const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SYNTH_MODEL = "nvidia/nemotron-3-super-120b-a12b:free";
const SNAPSHOT_VERSION = "hermes-clinical-v1";

function jsonResponse(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function requireEnv(name: string) {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`${name} no esta configurado.`);
  return value;
}

function getBearerToken(req: Request) {
  const auth = req.headers.get("Authorization") || "";
  return auth.startsWith("Bearer ") ? auth.slice(7) : "";
}

function decodeJwtPayload(token: string) {
  try {
    const part = token.split(".")[1];
    const normalized = part.replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(normalized));
  } catch (_) {
    return {};
  }
}

function getAuthContext(req: Request) {
  const payload = decodeJwtPayload(getBearerToken(req));
  return {
    userId: String(payload.sub || ""),
    email: String(payload.email || "").toLowerCase(),
  };
}

async function restFetch(supabaseUrl: string, serviceKey: string, path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers || {});
  headers.set("apikey", serviceKey);
  headers.set("Authorization", `Bearer ${serviceKey}`);
  if (!headers.has("Accept")) headers.set("Accept", "application/json");
  const res = await fetch(`${supabaseUrl}/rest/v1/${path}`, { ...init, headers });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`REST ${path} HTTP ${res.status}: ${errText}`);
  }
  if (res.status === 204) return null;
  return await res.json();
}

async function fetchList(supabaseUrl: string, serviceKey: string, path: string) {
  const data = await restFetch(supabaseUrl, serviceKey, path);
  return Array.isArray(data) ? data : [];
}

async function insertRecord<T>(supabaseUrl: string, serviceKey: string, table: string, payload: Record<string, unknown> | Record<string, unknown>[]): Promise<T[]> {
  return await restFetch(supabaseUrl, serviceKey, table, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Prefer": "return=representation" },
    body: JSON.stringify(payload),
  });
}

async function upsertRecord<T>(supabaseUrl: string, serviceKey: string, table: string, payload: Record<string, unknown> | Record<string, unknown>[], onConflict: string): Promise<T[]> {
  return await restFetch(supabaseUrl, serviceKey, `${table}?on_conflict=${encodeURIComponent(onConflict)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Prefer": "resolution=merge-duplicates,return=representation" },
    body: JSON.stringify(payload),
  });
}

async function deleteByPatient(supabaseUrl: string, serviceKey: string, table: string, patientId: string) {
  await restFetch(supabaseUrl, serviceKey, `${table}?patient_id=eq.${patientId}`, {
    method: "DELETE",
    headers: { "Prefer": "return=minimal" },
  });
}

async function assertCanAccessPatient(supabaseUrl: string, serviceKey: string, patientId: string, userId: string, email: string) {
  if (!userId) throw new Error("Usuario no autenticado.");
  if (userId === patientId) return;
  if (email === "josferestudio@gmail.com") return;
  const linked = await fetchList(supabaseUrl, serviceKey, `psychologist_patient_links?patient_id=eq.${patientId}&psychologist_id=eq.${userId}&status=eq.active&select=id&limit=1`);
  if (linked.length > 0) return;
  const appointments = await fetchList(supabaseUrl, serviceKey, `appointments?patient_id=eq.${patientId}&psychologist_id=eq.${userId}&select=id&limit=1`);
  if (appointments.length > 0) return;
  throw new Error("No tienes acceso a este paciente.");
}

function cleanString(value: unknown) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function compact(value: unknown, max = 700) {
  const text = cleanString(value);
  return text.length > max ? `${text.slice(0, max)}...` : text;
}

function isExcludedOperationalMemory(value: unknown) {
  const text = cleanString(value).toLowerCase();
  return /\b(en-78|walter|trading|bingx|drawdown|apalanc|scalping|btc|usdt|mercado|rentabilidad|ordenes?|operativa)\b/.test(text);
}

function cleanJson(text: string) {
  return text.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();
}

function parseJson(text: string) {
  const clean = cleanJson(text);
  try {
    return JSON.parse(clean);
  } catch (_) {
    const first = clean.indexOf("{");
    const last = clean.lastIndexOf("}");
    if (first >= 0 && last > first) return JSON.parse(clean.slice(first, last + 1));
    throw new Error("El modelo no devolvio JSON valido.");
  }
}

async function callModel(messages: unknown[], timeoutMs = 120000) {
  const key = requireEnv("OPENROUTER_API_KEY");
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${key}` },
      body: JSON.stringify({ model: SYNTH_MODEL, messages, temperature: 0.15 }),
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`OpenRouter HTTP ${res.status}: ${await res.text()}`);
    const json = await res.json();
    return cleanString(json.choices?.[0]?.message?.content || "");
  } finally {
    clearTimeout(timeoutId);
  }
}

function proposalText(row: Record<string, unknown>) {
  const data = (row.proposal_data && typeof row.proposal_data === "object") ? row.proposal_data as Record<string, unknown> : {};
  return cleanString(data.claim || data.event || data.name || data.question || data.summary_vital || data.risk_summary || "");
}

async function gatherSynthesisInputs(supabaseUrl: string, serviceKey: string, patientId: string) {
  const [
    profile,
    facts,
    acceptedTimeline,
    proposals,
    riskEvents,
    extractions,
    appointments,
    conversations,
    memoryUpdates,
  ] = await Promise.all([
    fetchList(supabaseUrl, serviceKey, `clinical_profiles?patient_id=eq.${patientId}&select=*`),
    fetchList(supabaseUrl, serviceKey, `clinical_facts?patient_id=eq.${patientId}&select=kind,claim,verbatim_quote,date_value,date_precision,confidence,authority_level,created_at&order=created_at.desc&limit=80`),
    fetchList(supabaseUrl, serviceKey, `timeline_events?patient_id=eq.${patientId}&select=event_date,date_precision,event_type,description,associated_emotion,intensity,authority_level,source_info,created_at&order=event_date.asc.nullslast,created_at.asc&limit=80`),
    fetchList(supabaseUrl, serviceKey, `clinical_proposals?patient_id=eq.${patientId}&status=eq.pending&select=proposal_type,proposal_data,source_quote,confidence,created_at&order=created_at.desc&limit=120`),
    fetchList(supabaseUrl, serviceKey, `risk_events?patient_id=eq.${patientId}&select=risk_type,severity,evidence_quote,recommended_action,status,created_at&order=created_at.desc&limit=20`),
    fetchList(supabaseUrl, serviceKey, `document_extractions?patient_id=eq.${patientId}&select=document_summary,created_at&order=created_at.desc&limit=30`),
    fetchList(supabaseUrl, serviceKey, `appointments?patient_id=eq.${patientId}&select=*&order=created_at.desc&limit=10`),
    fetchList(supabaseUrl, serviceKey, `conversations?user_id=eq.${patientId}&select=title,captured_fact,conclusions,solutions_exercises,clinical_studies,status,updated_at&order=updated_at.desc&limit=12`),
    fetchList(supabaseUrl, serviceKey, `conversation_memory_updates?patient_id=eq.${patientId}&status=eq.pending&select=update_type,update_data,source_quote,confidence,created_at&order=created_at.desc&limit=50`),
  ]);

  return {
    profile: profile[0] || null,
    facts,
    acceptedTimeline,
    proposals,
    riskEvents,
    documentSummaries: extractions,
    appointments,
    conversations,
    memoryUpdates,
  };
}

function buildEvidenceText(inputs: Record<string, unknown>) {
  const facts = inputs.facts as Record<string, unknown>[];
  const acceptedTimeline = inputs.acceptedTimeline as Record<string, unknown>[];
  const proposals = inputs.proposals as Record<string, unknown>[];
  const riskEvents = inputs.riskEvents as Record<string, unknown>[];
  const documentSummaries = inputs.documentSummaries as Record<string, unknown>[];
  const appointments = inputs.appointments as Record<string, unknown>[];
  const conversations = inputs.conversations as Record<string, unknown>[];
  const memoryUpdates = inputs.memoryUpdates as Record<string, unknown>[];
  const profile = inputs.profile as Record<string, unknown> | null;

  const lines: string[] = [];
  if (profile) {
    lines.push("PERFIL CONSOLIDADO:");
    for (const key of ["summary_vital", "psychological_history", "medical_history", "relationship_context", "patterns", "goals", "risk_summary"]) {
      if (profile[key] && !isExcludedOperationalMemory(profile[key])) lines.push(`- ${key}: ${compact(profile[key], 900)}`);
    }
  }
  lines.push("\nRESUMENES DE DOCUMENTOS (no texto raw):");
  for (const item of documentSummaries) {
    if (!isExcludedOperationalMemory(item.document_summary)) lines.push(`- ${compact(item.document_summary, 700)}`);
  }
  lines.push("\nHECHOS ACEPTADOS/DOCUMENTADOS:");
  for (const item of facts) {
    if (!isExcludedOperationalMemory(`${item.claim || ""} ${item.verbatim_quote || ""}`)) lines.push(`- ${item.kind}: ${compact(item.claim, 520)} | fecha=${item.date_value || "null"} precision=${item.date_precision} | cita=${compact(item.verbatim_quote, 260)}`);
  }
  lines.push("\nTIMELINE VALIDADO:");
  for (const item of acceptedTimeline) {
    if (!isExcludedOperationalMemory(item.description)) lines.push(`- ${item.event_date || "sin fecha"} (${item.date_precision}): ${compact(item.description, 520)} | emocion=${item.associated_emotion || ""}`);
  }
  lines.push("\nPROPUESTAS PENDIENTES:");
  for (const item of proposals) {
    if (!isExcludedOperationalMemory(`${proposalText(item)} ${item.source_quote || ""}`)) lines.push(`- ${item.proposal_type}: ${compact(proposalText(item), 520)} | cita=${compact(item.source_quote, 260)}`);
  }
  lines.push("\nRIESGOS:");
  for (const item of riskEvents) lines.push(`- ${item.severity}/${item.risk_type} [${item.status}]: ${compact(item.evidence_quote, 400)} Accion=${compact(item.recommended_action, 260)}`);
  lines.push("\nACTUALIZACIONES DE CHAT PENDIENTES:");
  for (const item of memoryUpdates) {
    const payload = `${JSON.stringify(item.update_data || {})} ${item.source_quote || ""}`;
    if (!isExcludedOperationalMemory(payload)) lines.push(`- ${item.update_type}: ${compact(JSON.stringify(item.update_data || {}), 500)} | cita=${compact(item.source_quote, 220)}`);
  }
  lines.push("\nCITAS/SESIONES:");
  for (const item of appointments) lines.push(`- ${compact(JSON.stringify(item), 450)}`);
  lines.push("\nCONVERSACIONES CERRADAS/RECIENTES:");
  for (const item of conversations) lines.push(`- ${item.title || "Sin titulo"} [${item.status}]: ${compact(item.captured_fact || item.clinical_studies || item.conclusions || "", 600)}`);
  return lines.join("\n");
}

async function synthesizeAll(supabaseUrl: string, serviceKey: string, patientId: string) {
  const inputs = await gatherSynthesisInputs(supabaseUrl, serviceKey, patientId);
  const evidence = buildEvidenceText(inputs);
  const prompt = `Eres el motor Hermes de memoria clinica de Ancora.

Objetivo: sintetizar memoria clinica compacta para paciente y psicologo. No diagnostiques. No uses texto raw de documentos. Usa solo resumenes, hechos, propuestas, citas y sesiones.

Reglas:
- Fechas clinicas: nunca uses fecha de subida si no es el evento real.
- Si no hay fecha, usa date_value=null y date_precision="unknown".
- Contextualiza etapas: infancia, adolescencia, adultez, actual, unknown.
- Separa pasado, familia, relaciones, rupturas, trabajo, salud, apoyos y situacion actual.
- Lo pendiente de IA debe quedar como pendiente, no validado.
- Excluye por completo EN-78, trading, operativa financiera, BingX, mercado, rentabilidad y cualquier material de Walter como sistema personal de trading.
- Devuelve JSON valido.

EVIDENCIA:
"""
${evidence.slice(0, 65000)}
"""

JSON:
{
  "snapshot_content": "Memoria compacta para prompt conversacional. Max 1200 palabras.",
  "profile_patch": {
    "summary_vital": "",
    "psychological_history": "",
    "medical_history": "",
    "relationship_context": "",
    "patterns": "",
    "goals": "",
    "risk_summary": "",
    "open_questions": []
  },
  "life_tree": {
    "family_origin": [],
    "childhood": [],
    "adolescence": [],
    "relationships": [],
    "ruptures_losses": [],
    "work_studies": [],
    "health": [],
    "supports_resources": [],
    "current_situation": [],
    "protective_factors": [],
    "open_questions": []
  },
  "timeline": [
    {
      "date_value": null,
      "date_precision": "exact | month | year | relative | unknown | none",
      "life_stage": "childhood | adolescence | adulthood | current | unknown",
      "domain": "family | relationship | health | work | symptom | risk | therapy | resource | other",
      "title": "",
      "description": "",
      "evidence_quotes": [],
      "confidence": 0.0
    }
  ],
  "for_next_session": {
    "themes": [],
    "questions": [],
    "briefing": ""
  },
  "source_counts": {"facts": 0, "pending_proposals": 0, "risks": 0, "document_summaries": 0}
}`;

  const output = parseJson(await callModel([{ role: "user", content: prompt }]));
  return { inputs, output };
}

function dateOrNull(value: unknown) {
  const text = cleanString(value);
  return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : null;
}

function normalizePrecision(value: unknown) {
  const text = cleanString(value);
  return ["exact", "month", "year", "relative", "unknown", "none"].includes(text) ? text : "unknown";
}

async function persistSynthesis(supabaseUrl: string, serviceKey: string, patientId: string, output: Record<string, unknown>, sourceCounts: Record<string, unknown>) {
  const profilePatch = (output.profile_patch && typeof output.profile_patch === "object") ? output.profile_patch as Record<string, unknown> : {};
  const currentProfiles = await fetchList(supabaseUrl, serviceKey, `clinical_profiles?patient_id=eq.${patientId}&select=*`);
  const existing = currentProfiles[0] || {};
  await upsertRecord(supabaseUrl, serviceKey, "clinical_profiles", {
    patient_id: patientId,
    summary_vital: cleanString(profilePatch.summary_vital) || existing.summary_vital || null,
    psychological_history: cleanString(profilePatch.psychological_history) || existing.psychological_history || null,
    medical_history: cleanString(profilePatch.medical_history) || existing.medical_history || null,
    relationship_context: cleanString(profilePatch.relationship_context) || existing.relationship_context || null,
    patterns: cleanString(profilePatch.patterns) || existing.patterns || null,
    goals: cleanString(profilePatch.goals) || existing.goals || null,
    risk_summary: cleanString(profilePatch.risk_summary) || existing.risk_summary || null,
    open_questions: Array.isArray(profilePatch.open_questions) ? profilePatch.open_questions : existing.open_questions || [],
    last_synthesized_at: new Date().toISOString(),
  }, "patient_id");

  const lifeTree = (output.life_tree && typeof output.life_tree === "object") ? output.life_tree as Record<string, unknown> : {};
  await upsertRecord(supabaseUrl, serviceKey, "clinical_life_tree", {
    patient_id: patientId,
    tree_data: lifeTree,
    source_summary: cleanString(output.snapshot_content).slice(0, 4000),
    last_synthesized_at: new Date().toISOString(),
  }, "patient_id");

  await deleteByPatient(supabaseUrl, serviceKey, "clinical_timeline_index", patientId);
  const timeline = Array.isArray(output.timeline) ? output.timeline as Record<string, unknown>[] : [];
  const rows = timeline
    .filter((item) => cleanString(item.title) || cleanString(item.description))
    .slice(0, 120)
    .map((item) => ({
      patient_id: patientId,
      event_date: dateOrNull(item.date_value),
      date_precision: normalizePrecision(item.date_precision),
      life_stage: cleanString(item.life_stage) || "unknown",
      domain: cleanString(item.domain) || "clinical",
      title: cleanString(item.title).slice(0, 220) || cleanString(item.description).slice(0, 220),
      description: cleanString(item.description) || cleanString(item.title),
      evidence_quotes: Array.isArray(item.evidence_quotes) ? item.evidence_quotes.slice(0, 4) : [],
      source_refs: [],
      confidence: Number(item.confidence) || 0.5,
      status: "synthesized",
    }));
  if (rows.length > 0) await insertRecord(supabaseUrl, serviceKey, "clinical_timeline_index", rows);

  const snapshotContent = cleanString(output.snapshot_content);
  const summary = {
    profile_patch: profilePatch,
    for_next_session: output.for_next_session || {},
    life_tree: lifeTree,
  };
  const [snapshot] = await insertRecord<Record<string, unknown>>(supabaseUrl, serviceKey, "patient_context_snapshots", {
    patient_id: patientId,
    snapshot_type: "clinical_chat",
    content: snapshotContent,
    summary,
    token_estimate: Math.ceil(snapshotContent.length / 4),
    source_counts: sourceCounts,
    version: SNAPSHOT_VERSION,
  });
  return { snapshot_id: snapshot.id, timeline_count: rows.length };
}

async function buildPatientSnapshot(req: Request, patientId: string) {
  const supabaseUrl = requireEnv("SUPABASE_URL");
  const serviceKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
  const auth = getAuthContext(req);
  await assertCanAccessPatient(supabaseUrl, serviceKey, patientId, auth.userId, auth.email);
  const { inputs, output } = await synthesizeAll(supabaseUrl, serviceKey, patientId);
  const sourceCounts = {
    facts: (inputs.facts as unknown[]).length,
    pending_proposals: (inputs.proposals as unknown[]).length,
    risks: (inputs.riskEvents as unknown[]).length,
    document_summaries: (inputs.documentSummaries as unknown[]).length,
    conversation_updates: (inputs.memoryUpdates as unknown[]).length,
  };
  const persisted = await persistSynthesis(supabaseUrl, serviceKey, patientId, output, sourceCounts);
  return jsonResponse({ success: true, patient_id: patientId, ...persisted });
}

async function selectChatContext(req: Request, patientId: string, userMessage = "") {
  const supabaseUrl = requireEnv("SUPABASE_URL");
  const serviceKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
  const auth = getAuthContext(req);
  await assertCanAccessPatient(supabaseUrl, serviceKey, patientId, auth.userId, auth.email);
  let snapshots = await fetchList(supabaseUrl, serviceKey, `patient_context_snapshots?patient_id=eq.${patientId}&snapshot_type=eq.clinical_chat&select=content,summary,source_counts,created_at&order=created_at.desc&limit=1`);
  if (snapshots.length === 0) {
    const { inputs, output } = await synthesizeAll(supabaseUrl, serviceKey, patientId);
    const sourceCounts = {
      facts: (inputs.facts as unknown[]).length,
      pending_proposals: (inputs.proposals as unknown[]).length,
      risks: (inputs.riskEvents as unknown[]).length,
      document_summaries: (inputs.documentSummaries as unknown[]).length,
      conversation_updates: (inputs.memoryUpdates as unknown[]).length,
    };
    await persistSynthesis(supabaseUrl, serviceKey, patientId, output, sourceCounts);
    snapshots = await fetchList(supabaseUrl, serviceKey, `patient_context_snapshots?patient_id=eq.${patientId}&snapshot_type=eq.clinical_chat&select=content,summary,source_counts,created_at&order=created_at.desc&limit=1`);
  }
  const snapshot = snapshots[0] || {};
  const riskEvents = await fetchList(supabaseUrl, serviceKey, `risk_events?patient_id=eq.${patientId}&status=eq.open&select=risk_type,severity,evidence_quote,recommended_action,created_at&order=created_at.desc&limit=4`);
  const questions = await fetchList(supabaseUrl, serviceKey, `clinical_proposals?patient_id=eq.${patientId}&status=eq.pending&proposal_type=eq.question&select=proposal_data,source_quote,created_at&order=created_at.desc&limit=5`);
  const appointments = await fetchList(supabaseUrl, serviceKey, `appointments?patient_id=eq.${patientId}&select=*&order=created_at.desc&limit=3`);
  const context = [
    "--- CONTEXTO COMPACTO HERMES / ANCORA ---",
    "No contiene documentos completos. Es sintesis versionada y datos pendientes de revision.",
    compact(snapshot.content, 5000),
    "",
    "Riesgos activos:",
    ...riskEvents.map((item) => `- ${item.severity}/${item.risk_type}: ${compact(item.evidence_quote, 260)} Accion: ${compact(item.recommended_action, 220)}`),
    "",
    "Preguntas pendientes para psicologo:",
    ...questions.map((item) => `- ${compact((item.proposal_data || {}).question, 260)}`),
    "",
    "Citas/sesiones relevantes:",
    ...appointments.map((item) => `- ${compact(JSON.stringify(item), 360)}`),
    "",
    `Mensaje actual del paciente: ${compact(userMessage, 700)}`,
  ].join("\n");
  return jsonResponse({ success: true, patient_id: patientId, context, snapshot });
}

async function processConversationTurn(req: Request, conversationId: string, messageId?: string) {
  const supabaseUrl = requireEnv("SUPABASE_URL");
  const serviceKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
  const auth = getAuthContext(req);
  const conversations = await fetchList(supabaseUrl, serviceKey, `conversations?id=eq.${conversationId}&select=id,user_id,title&limit=1`);
  const conversation = conversations[0];
  if (!conversation) return jsonResponse({ error: "Conversacion no encontrada." }, 404);
  const patientId = String(conversation.user_id);
  await assertCanAccessPatient(supabaseUrl, serviceKey, patientId, auth.userId, auth.email);
  const messageFilter = messageId ? `id=eq.${messageId}` : `conversation_id=eq.${conversationId}&role=eq.user&order=created_at.desc&limit=1`;
  const messages = await fetchList(supabaseUrl, serviceKey, `messages?${messageFilter}&select=id,content,created_at`);
  const message = messages[0];
  if (!message) return jsonResponse({ error: "Mensaje no encontrado." }, 404);
  const prompt = `Extrae SOLO datos clinicamente utiles de este turno conversacional para memoria pendiente de revision. No diagnostiques.

Mensaje:
"""
${String(message.content || "").slice(0, 8000)}
"""

Devuelve JSON:
{"updates":[{"update_type":"clinical_fact | timeline_event | life_tree | risk_event | question | profile_patch","update_data":{},"source_quote":"","confidence":0.0}],"risk_event":null}`;
  const output = parseJson(await callModel([{ role: "user", content: prompt }], 90000));
  const updates = Array.isArray(output.updates) ? output.updates as Record<string, unknown>[] : [];
  const allowed = new Set(["clinical_fact", "timeline_event", "life_tree", "risk_event", "question", "profile_patch"]);
  const rows = updates
    .filter((item) => allowed.has(cleanString(item.update_type)))
    .slice(0, 8)
    .map((item) => ({
      patient_id: patientId,
      conversation_id: conversationId,
      message_id: message.id,
      update_type: cleanString(item.update_type),
      update_data: item.update_data && typeof item.update_data === "object" ? item.update_data : {},
      source_quote: cleanString(item.source_quote) || null,
      confidence: Number(item.confidence) || 0.5,
      status: "pending",
    }));
  if (rows.length > 0) {
    await insertRecord(supabaseUrl, serviceKey, "conversation_memory_updates", rows);
    const proposals = rows.map((row) => ({
      patient_id: patientId,
      proposal_type: row.update_type === "life_tree" ? "profile_patch" : row.update_type,
      proposal_data: row.update_data,
      source_quote: row.source_quote,
      confidence: row.confidence,
      status: "pending",
    })).filter((row) => ["clinical_fact", "timeline_event", "risk_event", "question", "profile_patch"].includes(row.proposal_type));
    if (proposals.length > 0) await insertRecord(supabaseUrl, serviceKey, "clinical_proposals", proposals);
  }
  return jsonResponse({ success: true, patient_id: patientId, update_count: rows.length });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "Metodo no permitido." }, 405);
  try {
    const body = await req.json();
    const action = body?.action;
    if (action === "build_patient_snapshot" || action === "rebuild_timeline" || action === "rebuild_life_tree") {
      if (!body.patient_id) return jsonResponse({ error: "patient_id es requerido." }, 400);
      return await buildPatientSnapshot(req, String(body.patient_id));
    }
    if (action === "select_chat_context") {
      if (!body.patient_id) return jsonResponse({ error: "patient_id es requerido." }, 400);
      return await selectChatContext(req, String(body.patient_id), String(body.user_message || ""));
    }
    if (action === "process_conversation_turn") {
      if (!body.conversation_id) return jsonResponse({ error: "conversation_id es requerido." }, 400);
      return await processConversationTurn(req, String(body.conversation_id), body.message_id ? String(body.message_id) : undefined);
    }
    return jsonResponse({ error: "Accion no soportada." }, 400);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return jsonResponse({ error: message }, 500);
  }
});
