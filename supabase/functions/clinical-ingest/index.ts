import { unzipSync } from "https://esm.sh/fflate@0.8.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const EXTRACTION_MODEL = "nvidia/nemotron-3-super-120b-a12b:free";
const CLINICAL_MODEL = "nvidia/nemotron-3-super-120b-a12b:free";
const CLINICAL_FALLBACK_MODEL = "nvidia/nemotron-3-super-120b-a12b:free";
const SCHEMA_VERSION = "clinical-extractor-v1";

type ClinicalDocument = {
  id: string;
  patient_id: string;
  uploaded_by: string;
  bucket_id: string;
  storage_path: string | null;
  file_name: string;
  mime_type: string | null;
  source_kind: string;
};

function jsonResponse(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
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
  const token = getBearerToken(req);
  const payload = decodeJwtPayload(token);
  return {
    token,
    userId: String(payload.sub || ""),
    email: String(payload.email || "").toLowerCase(),
  };
}

function requireEnv(name: string) {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`${name} no esta configurado.`);
  return value;
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

async function selectOne<T>(supabaseUrl: string, serviceKey: string, path: string): Promise<T | null> {
  const list = await restFetch(supabaseUrl, serviceKey, path);
  return Array.isArray(list) ? (list[0] || null) : list;
}

async function patchRecord(supabaseUrl: string, serviceKey: string, table: string, id: string, payload: Record<string, unknown>) {
  await restFetch(supabaseUrl, serviceKey, `${table}?id=eq.${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "Prefer": "return=minimal",
    },
    body: JSON.stringify(payload),
  });
}

async function insertRecord<T>(supabaseUrl: string, serviceKey: string, table: string, payload: Record<string, unknown> | Record<string, unknown>[]): Promise<T[]> {
  return await restFetch(supabaseUrl, serviceKey, table, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Prefer": "return=representation",
    },
    body: JSON.stringify(payload),
  });
}

async function upsertRecord<T>(
  supabaseUrl: string,
  serviceKey: string,
  table: string,
  payload: Record<string, unknown> | Record<string, unknown>[],
  onConflict: string,
): Promise<T[]> {
  return await restFetch(supabaseUrl, serviceKey, `${table}?on_conflict=${encodeURIComponent(onConflict)}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Prefer": "resolution=merge-duplicates,return=representation",
    },
    body: JSON.stringify(payload),
  });
}

async function assertCanAccessPatient(supabaseUrl: string, serviceKey: string, patientId: string, userId: string, email: string) {
  if (!userId) throw new Error("Usuario no autenticado.");
  if (userId === patientId) return;
  if (email === "josferestudio@gmail.com") return;
  const linked = await restFetch(
    supabaseUrl,
    serviceKey,
    `psychologist_patient_links?patient_id=eq.${patientId}&psychologist_id=eq.${userId}&status=eq.active&select=id&limit=1`,
  );
  if (Array.isArray(linked) && linked.length > 0) return;
  const appointments = await restFetch(
    supabaseUrl,
    serviceKey,
    `appointments?patient_id=eq.${patientId}&psychologist_id=eq.${userId}&select=id&limit=1`,
  );
  if (Array.isArray(appointments) && appointments.length > 0) return;
  throw new Error("No tienes acceso a este paciente.");
}

function bytesToBase64(bytes: Uint8Array) {
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

function decodeUtf8(bytes: Uint8Array) {
  return new TextDecoder("utf-8", { fatal: false }).decode(bytes);
}

function extractDocxText(bytes: Uint8Array) {
  const unzipped = unzipSync(bytes);
  const documentXml = unzipped["word/document.xml"];
  if (!documentXml) throw new Error("DOCX sin word/document.xml.");
  const xml = decodeUtf8(documentXml);
  return xml
    .replace(/<w:p[\s\S]*?>/g, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function isDirectText(mimeType = "", fileName = "") {
  const lower = fileName.toLowerCase();
  return mimeType.startsWith("text/")
    || mimeType === "application/json"
    || lower.endsWith(".txt")
    || lower.endsWith(".md")
    || lower.endsWith(".csv")
    || lower.endsWith(".json");
}

function isDocx(mimeType = "", fileName = "") {
  return mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    || fileName.toLowerCase().endsWith(".docx");
}

function isImage(mimeType = "") {
  return mimeType.startsWith("image/");
}

function isAudio(mimeType = "") {
  return mimeType.startsWith("audio/");
}

async function downloadClinicalObject(supabaseUrl: string, serviceKey: string, doc: ClinicalDocument) {
  if (!doc.storage_path) throw new Error("El documento no tiene storage_path.");
  const encodedPath = doc.storage_path.split("/").map(encodeURIComponent).join("/");
  const res = await fetch(`${supabaseUrl}/storage/v1/object/${doc.bucket_id}/${encodedPath}`, {
    headers: {
      "Authorization": `Bearer ${serviceKey}`,
      "apikey": serviceKey,
    },
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Storage HTTP ${res.status}: ${errText}`);
  }
  return new Uint8Array(await res.arrayBuffer());
}

async function callOpenRouter(model: string, messages: unknown[], temperature: number, timeoutMs: number) {
  const openrouterApiKey = requireEnv("OPENROUTER_API_KEY");
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openrouterApiKey}`,
      },
      body: JSON.stringify({ model, messages, temperature }),
      signal: controller.signal,
    });
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`OpenRouter HTTP ${res.status}: ${errText}`);
    }
    const json = await res.json();
    return String(json.choices?.[0]?.message?.content || "").trim();
  } finally {
    clearTimeout(timeoutId);
  }
}

async function extractAttachmentText(bytes: Uint8Array, doc: ClinicalDocument) {
  const mimeType = doc.mime_type || "application/octet-stream";
  const base64 = bytesToBase64(bytes);
  const dataUrl = `data:${mimeType};base64,${base64}`;
  const filePart = isImage(mimeType)
    ? { type: "image_url", image_url: { url: dataUrl } }
    : isAudio(mimeType)
      ? { type: "input_audio", input_audio: { data: base64, format: mimeType.split("/")[1] || "webm" } }
      : { type: "file", file: { filename: doc.file_name || "documento", file_data: dataUrl } };

  const prompt = `Extrae y transcribe el contenido util del adjunto para una memoria clinica privada.

Reglas:
- Devuelve solo texto en espanol.
- Conserva estructura de secciones, fechas y citas literales relevantes.
- Si es imagen, transcribe texto visible y describe solo informacion objetiva.
- Si es audio, transcribe de forma limpia y literal.
- No inventes datos que no aparezcan en el adjunto.
- Si no hay texto legible, explica brevemente que no hay texto suficiente.`;

  const text = await callOpenRouter(
    EXTRACTION_MODEL,
    [{ role: "user", content: [{ type: "text", text: prompt }, filePart] }],
    0.1,
    90000,
  );
  if (!text) throw new Error("La extraccion multimodal no produjo texto.");
  return text;
}

async function getDocumentText(supabaseUrl: string, serviceKey: string, doc: ClinicalDocument, fallbackText?: string) {
  if (fallbackText && fallbackText.trim()) return { text: fallbackText.trim(), model: "direct-body" };
  const bytes = await downloadClinicalObject(supabaseUrl, serviceKey, doc);
  const mimeType = doc.mime_type || "";
  if (isDirectText(mimeType, doc.file_name)) {
    return { text: decodeUtf8(bytes).trim(), model: "direct" };
  }
  if (isDocx(mimeType, doc.file_name)) {
    return { text: extractDocxText(bytes), model: "docx-fflate" };
  }
  return { text: await extractAttachmentText(bytes, doc), model: EXTRACTION_MODEL };
}

function cleanJson(text: string) {
  return text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();
}

function parseClinicalJson(text: string) {
  const clean = cleanJson(text);
  try {
    return JSON.parse(clean);
  } catch (_) {
    const first = clean.indexOf("{");
    const last = clean.lastIndexOf("}");
    if (first >= 0 && last > first) {
      return JSON.parse(clean.slice(first, last + 1));
    }
    throw new Error("El modelo no devolvio JSON valido.");
  }
}

async function runClinicalExtractor(text: string, doc: ClinicalDocument) {
  const clipped = text.length > 70000 ? text.slice(0, 70000) : text;
  const prompt = `Actua como asistente clinico junior para un psicologo sanitario dentro de Ancora. Tu trabajo es organizar informacion clinica, no diagnosticar ni decidir tratamiento.

ALCANCE DE ANCORA:
- Ancora es una plataforma clinica paciente-psicologo-admin.
- EN-78, Walter como sistema personal, trading, deuda, reglas operativas, rentabilidad y gestion financiera quedan FUERA del expediente clinico estable.
- Si un documento habla de trading o dinero, tratatalo solo como contexto narrativo cuando aporte informacion psicologica: ansiedad, impulsividad, evitacion, rumiacion, bloqueo, sueño, conflicto relacional, autovaloracion, riesgo o conducta compulsiva.
- No extraigas reglas de trading, planes financieros, objetivos economicos ni instrucciones operativas como facts, timeline o profile_patch.
- No conviertas una perdida/operacion financiera en evento clinico salvo que el texto describa impacto emocional, conducta de riesgo o deterioro funcional.

DOCUMENTO:
Nombre: ${doc.file_name}
Tipo: ${doc.mime_type || "desconocido"}

CONTENIDO:
"""
${clipped}
"""

Devuelve UNICAMENTE JSON valido con este esquema:
{
  "document_summary": "Resumen neutral y trazable del documento, 80-160 palabras.",
  "facts": [
    {
      "kind": "vital_event | symptom | medication | risk | pattern | objective | context | clinical_observation",
      "claim": "Hecho o dato clinico redactado de forma neutral.",
      "verbatim_quote": "Cita literal breve que justifica el dato, si existe.",
      "date_value": "AAAA-MM-DD o null. No uses la fecha de subida salvo que el hecho sea la propia subida.",
      "date_precision": "exact | month | year | relative | unknown | none",
      "confidence": 0.0,
      "event_type": "vital_event | symptom_start | medication_change | crisis | therapy_session | clinical_observation | other",
      "associated_emotion": "emocion si aparece o null",
      "intensity": 1,
      "medication": {"name": "", "dose": "", "frequency": "", "prescriber": ""}
    }
  ],
  "risk_signals": [
    {"risk_type": "suicidal_ideation | self_harm | acute_crisis | violence | severe_deterioration | other", "severity": "low | moderate | high | critical", "evidence_quote": "", "recommended_action": "", "confidence": 0.0}
  ],
  "profile_patch": {
    "summary_vital": "",
    "psychological_history": "",
    "medical_history": "",
    "relationship_context": "",
    "patterns": "",
    "goals": "",
    "risk_summary": ""
  },
  "questions_for_psychologist": []
}

Reglas clinicas:
- No inventes diagnosticos ni medicacion. Si aparece un diagnostico externo, atribuyelo como dato documentado/declarado.
- Separa hechos, citas, interpretaciones e hipotesis.
- Ignora contenido financiero/operativo que no aporte informacion psicologica.
- No conviertas cada frase en evento. Extrae solo elementos clinicamente utiles y agrupados.
- Maximo 12 facts, maximo 5 risk_signals, maximo 8 preguntas.
- No uses fechas falsas. Si la fecha no esta clara, date_value=null y date_precision="unknown".
- Para medicacion, crea fact kind="medication" solo si hay nombre claro del farmaco.
- Si hay ideacion autolitica o riesgo grave, incluyelo en risk_signals con accion conservadora.`;

  let reply = "";
  try {
    reply = await callOpenRouter(
      CLINICAL_MODEL,
      [{ role: "user", content: prompt }],
      0.2,
      120000,
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (!message.toLowerCase().includes("abort") && !message.toLowerCase().includes("timeout")) throw err;
    reply = await callOpenRouter(
      CLINICAL_FALLBACK_MODEL,
      [{ role: "user", content: prompt }],
      0.2,
      120000,
    );
  }
  return parseClinicalJson(reply);
}

function clampConfidence(value: unknown) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0.5;
  return Math.max(0, Math.min(1, n));
}

function cleanString(value: unknown) {
  return String(value || "").trim();
}

function dateOrNull(value: unknown) {
  const text = cleanString(value);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return null;
  return text;
}

function isOutOfScopeTradingContent(value: unknown) {
  const text = JSON.stringify(value || "").toLowerCase();
  const hasTradingOps = /stop\s*loss|take\s*profit|apalanc|backtest|entrada|salida|ratio|riesgo\s*beneficio|tradingview|binance|bingx|capital|operaci[oó]n|mercado|vela|setup|liquidaci[oó]n/.test(text);
  if (!hasTradingOps) return false;
  const hasClinicalContext = /ansiedad|impulsiv|compuls|bloqueo|par[aá]lisis|rumiaci[oó]n|emocion|emoci[oó]n|evitaci[oó]n|deterioro|desesperanza|autoval|conducta|sue[ñn]o|crisis|riesgo suicida|autol[ií]tic|medicaci[oó]n|pastillas|terapia|trauma|familia|relaci[oó]n|enga[ñn]o|p[eé]rdida de control/.test(text);
  return !hasClinicalContext;
}

function factToProposal(fact: Record<string, unknown>, doc: ClinicalDocument, extractionId: string) {
  const kind = cleanString(fact.kind).toLowerCase();
  const medication = (fact.medication && typeof fact.medication === "object") ? fact.medication as Record<string, unknown> : {};
  const quote = cleanString(fact.verbatim_quote);
  const confidence = clampConfidence(fact.confidence);

  if (kind === "medication" || cleanString(medication.name)) {
    return {
      patient_id: doc.patient_id,
      document_id: doc.id,
      extraction_id: extractionId,
      proposal_type: "medication",
      proposal_data: {
        name: cleanString(medication.name) || cleanString(fact.claim),
        dose: cleanString(medication.dose) || "No especificada",
        frequency: cleanString(medication.frequency) || "No especificada",
        prescriber: cleanString(medication.prescriber) || "No especificado",
        claim: cleanString(fact.claim),
      },
      source_quote: quote || null,
      confidence,
    };
  }

  const eventKinds = new Set(["vital_event", "symptom", "risk", "pattern", "objective", "clinical_observation", "context"]);
  const proposalType = eventKinds.has(kind) ? "timeline_event" : "clinical_fact";
  return {
    patient_id: doc.patient_id,
    document_id: doc.id,
    extraction_id: extractionId,
    proposal_type: proposalType,
    proposal_data: {
      kind: kind || "clinical_observation",
      date: dateOrNull(fact.date_value),
      date_precision: cleanString(fact.date_precision) || "unknown",
      event_type: cleanString(fact.event_type) || "clinical_observation",
      event: cleanString(fact.claim),
      associated_emotion: cleanString(fact.associated_emotion) || null,
      intensity: Number(fact.intensity) || null,
      claim: cleanString(fact.claim),
    },
    source_quote: quote || null,
    confidence,
  };
}

function buildProfilePatchProposal(profilePatch: Record<string, unknown>, doc: ClinicalDocument, extractionId: string) {
  const cleaned: Record<string, string> = {};
  for (const key of ["summary_vital", "psychological_history", "medical_history", "relationship_context", "patterns", "goals", "risk_summary"]) {
    const value = cleanString(profilePatch[key]);
    if (value) cleaned[key] = value;
  }
  if (Object.keys(cleaned).length === 0) return null;
  return {
    patient_id: doc.patient_id,
    document_id: doc.id,
    extraction_id: extractionId,
    proposal_type: "profile_patch",
    proposal_data: cleaned,
    source_quote: null,
    confidence: 0.7,
  };
}

async function persistClinicalOutput(supabaseUrl: string, serviceKey: string, doc: ClinicalDocument, extractedText: string, extractionModel: string, rawOutput: Record<string, unknown>) {
  const [extraction] = await upsertRecord<Record<string, unknown>>(supabaseUrl, serviceKey, "document_extractions", {
    document_id: doc.id,
    patient_id: doc.patient_id,
    extracted_text: extractedText,
    document_summary: cleanString(rawOutput.document_summary),
    extraction_model: extractionModel,
    schema_version: SCHEMA_VERSION,
    status: "ready",
    raw_output: rawOutput,
  }, "document_id");
  const extractionId = String(extraction.id);
  const proposals: Record<string, unknown>[] = [];
  for (const fact of Array.isArray(rawOutput.facts) ? rawOutput.facts : []) {
    if (!fact || typeof fact !== "object") continue;
    const proposal = factToProposal(fact as Record<string, unknown>, doc, extractionId);
    if (proposal.proposal_data && cleanString((proposal.proposal_data as Record<string, unknown>).event || (proposal.proposal_data as Record<string, unknown>).name || (proposal.proposal_data as Record<string, unknown>).claim)) {
      if (!isOutOfScopeTradingContent({ data: proposal.proposal_data, quote: proposal.source_quote })) {
        proposals.push(proposal);
      }
    }
  }
  if (rawOutput.profile_patch && typeof rawOutput.profile_patch === "object") {
    const profileProposal = buildProfilePatchProposal(rawOutput.profile_patch as Record<string, unknown>, doc, extractionId);
    if (profileProposal) proposals.push(profileProposal);
  }
  for (const risk of Array.isArray(rawOutput.risk_signals) ? rawOutput.risk_signals : []) {
    if (!risk || typeof risk !== "object") continue;
    const riskObj = risk as Record<string, unknown>;
    const severity = cleanString(riskObj.severity) || "moderate";
    const proposal = {
      patient_id: doc.patient_id,
      document_id: doc.id,
      extraction_id: extractionId,
      proposal_type: "risk_event",
      proposal_data: {
        risk_type: cleanString(riskObj.risk_type) || "other",
        severity: ["low", "moderate", "high", "critical"].includes(severity) ? severity : "moderate",
        evidence_quote: cleanString(riskObj.evidence_quote),
        recommended_action: cleanString(riskObj.recommended_action),
      },
      source_quote: cleanString(riskObj.evidence_quote) || null,
      confidence: clampConfidence(riskObj.confidence),
    };
    if (isOutOfScopeTradingContent({ data: proposal.proposal_data, quote: proposal.source_quote })) continue;
    proposals.push(proposal);
    if (proposal.proposal_data.severity === "high" || proposal.proposal_data.severity === "critical") {
      await insertRecord(supabaseUrl, serviceKey, "risk_events", {
        patient_id: doc.patient_id,
        document_id: doc.id,
        risk_type: proposal.proposal_data.risk_type,
        severity: proposal.proposal_data.severity,
        evidence_quote: proposal.proposal_data.evidence_quote,
        recommended_action: proposal.proposal_data.recommended_action,
        status: "open",
      });
    }
  }
  for (const question of Array.isArray(rawOutput.questions_for_psychologist) ? rawOutput.questions_for_psychologist : []) {
    const text = cleanString(question);
    if (!text) continue;
    proposals.push({
      patient_id: doc.patient_id,
      document_id: doc.id,
      extraction_id: extractionId,
      proposal_type: "question",
      proposal_data: { question: text },
      source_quote: null,
      confidence: 0.6,
    });
  }
  if (proposals.length > 0) {
    await insertRecord(supabaseUrl, serviceKey, "clinical_proposals", proposals);
  }
  await patchRecord(supabaseUrl, serviceKey, "clinical_documents", doc.id, {
    extraction_status: "ready",
    extraction_error: null,
  });
  return { extractionId, proposalCount: proposals.length };
}

async function markOldPendingRejected(supabaseUrl: string, serviceKey: string, documentId: string) {
  await restFetch(supabaseUrl, serviceKey, `clinical_proposals?document_id=eq.${documentId}&status=eq.pending`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "Prefer": "return=minimal",
    },
    body: JSON.stringify({ status: "rejected", reviewed_at: new Date().toISOString() }),
  });
}

type PatientCredits = {
  patient_id: string;
  document_credits_total: number;
  document_credits_used: number;
  text_credits_total: number;
  text_credits_used: number;
};

async function checkAndUpdateDocumentCredits(supabaseUrl: string, serviceKey: string, patientId: string): Promise<void> {
  const credits = await selectOne<PatientCredits>(
    supabaseUrl,
    serviceKey,
    `patient_credits?patient_id=eq.${patientId}&select=patient_id,document_credits_total,document_credits_used,text_credits_total,text_credits_used`,
  );
  if (credits) {
    const isExceeded = (credits.document_credits_used || 0) >= (credits.document_credits_total || 10);
    if (isExceeded) {
      const costInTokens = 25000;
      const currentTextUsed = credits.text_credits_used || 0;
      const currentTextTotal = credits.text_credits_total || 450000;
      if (currentTextUsed + costInTokens > currentTextTotal) {
        throw new Error("Has consumido el cupo de 10 documentos gratuitos y no dispones de suficientes créditos de chat (25,000 tokens) para procesar un documento adicional.");
      }
      await restFetch(supabaseUrl, serviceKey, `patient_credits?patient_id=eq.${patientId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Prefer": "return=minimal",
        },
        body: JSON.stringify({
          document_credits_used: (credits.document_credits_used || 0) + 1,
          text_credits_used: currentTextUsed + costInTokens,
          updated_at: new Date().toISOString(),
        }),
      });
    } else {
      await restFetch(supabaseUrl, serviceKey, `patient_credits?patient_id=eq.${patientId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Prefer": "return=minimal",
        },
        body: JSON.stringify({
          document_credits_used: (credits.document_credits_used || 0) + 1,
          updated_at: new Date().toISOString(),
        }),
      });
    }
  }
}


async function processDocument(req: Request, documentId: string, fallbackText?: string, reprocess = false) {
  const supabaseUrl = requireEnv("SUPABASE_URL");
  const serviceKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
  const auth = getAuthContext(req);
  const doc = await selectOne<ClinicalDocument>(
    supabaseUrl,
    serviceKey,
    `clinical_documents?id=eq.${documentId}&select=*`,
  );
  if (!doc) return jsonResponse({ error: "Documento no encontrado." }, 404);
  await assertCanAccessPatient(supabaseUrl, serviceKey, doc.patient_id, auth.userId, auth.email);

  if (!reprocess) {
    try {
      await checkAndUpdateDocumentCredits(supabaseUrl, serviceKey, doc.patient_id);
    } catch (creditErr) {
      return jsonResponse({ error: creditErr.message }, 403);
    }
  }

  try {
    await patchRecord(supabaseUrl, serviceKey, "clinical_documents", doc.id, {
      extraction_status: "processing",
      extraction_error: null,
    });
    if (reprocess) await markOldPendingRejected(supabaseUrl, serviceKey, doc.id);
    const extracted = await getDocumentText(supabaseUrl, serviceKey, doc, fallbackText);
    if (!extracted.text.trim()) throw new Error("No se pudo extraer texto util del documento.");
    const clinicalOutput = await runClinicalExtractor(extracted.text, doc);
    const persisted = await persistClinicalOutput(supabaseUrl, serviceKey, doc, extracted.text, extracted.model, clinicalOutput);
    return jsonResponse({
      success: true,
      document_id: doc.id,
      extraction_id: persisted.extractionId,
      proposal_count: persisted.proposalCount,
      document_summary: cleanString(clinicalOutput.document_summary),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await patchRecord(supabaseUrl, serviceKey, "clinical_documents", doc.id, {
      extraction_status: "error",
      extraction_error: message,
    });
    return jsonResponse({ error: message, document_id: doc.id }, 500);
  }
}

async function processChatSession(req: Request, conversationId: string) {
  const supabaseUrl = requireEnv("SUPABASE_URL");
  const serviceKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
  const auth = getAuthContext(req);
  const conversation = await selectOne<Record<string, unknown>>(
    supabaseUrl,
    serviceKey,
    `conversations?id=eq.${conversationId}&select=*`,
  );
  if (!conversation) return jsonResponse({ error: "Conversacion no encontrada." }, 404);
  const patientId = String(conversation.user_id);
  await assertCanAccessPatient(supabaseUrl, serviceKey, patientId, auth.userId, auth.email);
  const messages = await restFetch(
    supabaseUrl,
    serviceKey,
    `messages?conversation_id=eq.${conversationId}&select=role,content,created_at&order=created_at.asc`,
  );
  const transcript = (Array.isArray(messages) ? messages : [])
    .map((m) => `${m.role === "user" ? "Paciente" : "IA Ancora"}: ${String(m.content || "").trim()}`)
    .filter(Boolean)
    .join("\n");
  const [doc] = await insertRecord<ClinicalDocument>(supabaseUrl, serviceKey, "clinical_documents", {
    patient_id: patientId,
    uploaded_by: auth.userId,
    file_name: `chat_${conversationId}.txt`,
    mime_type: "text/plain",
    file_size: transcript.length,
    source_kind: "chat_session",
    extraction_status: "pending",
  });
  return await processDocument(req, doc.id, transcript, false);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "Metodo no permitido." }, 405);

  try {
    const body = await req.json();
    const action = body?.action;
    if (action === "process_document") {
      if (!body.document_id) return jsonResponse({ error: "document_id es requerido." }, 400);
      return await processDocument(req, String(body.document_id), undefined, false);
    }
    if (action === "reprocess_document") {
      if (!body.document_id) return jsonResponse({ error: "document_id es requerido." }, 400);
      return await processDocument(req, String(body.document_id), undefined, true);
    }
    if (action === "process_chat_session") {
      if (!body.conversation_id) return jsonResponse({ error: "conversation_id es requerido." }, 400);
      return await processChatSession(req, String(body.conversation_id));
    }
    return jsonResponse({ error: "Accion no soportada." }, 400);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return jsonResponse({ error: message }, 500);
  }
});
