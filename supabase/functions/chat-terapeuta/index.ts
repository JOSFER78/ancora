// supabase/functions/chat-terapeuta/index.ts
import { unzipSync } from "https://esm.sh/fflate@0.8.2";
var corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};
var TEXT_MODEL = "nvidia/nemotron-3-super-120b-a12b:free";
var EXTRACTION_MODEL = "nvidia/nemotron-3-super-120b-a12b:free";
function getUserIdFromToken(token) {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return "";
    const payloadBase64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const decoded = atob(payloadBase64);
    const parsed = JSON.parse(decoded);
    return parsed.sub || "";
  } catch (e) {
    console.error("Error decoding JWT payload:", e);
    return "";
  }
}
function getUserEmailFromToken(token) {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return "";
    const payloadBase64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const decoded = atob(payloadBase64);
    const parsed = JSON.parse(decoded);
    return String(parsed.email || "").toLowerCase();
  } catch (e) {
    console.error("Error decoding JWT email:", e);
    return "";
  }
}
async function fetchUserProfile(supabaseUrl, serviceKey, userId) {
  const url = `${supabaseUrl}/rest/v1/profiles?id=eq.${userId}&select=*`;
  const response = await fetch(url, {
    method: "GET",
    headers: {
      "apikey": serviceKey,
      "Authorization": `Bearer ${serviceKey}`,
      "Accept": "application/json"
    }
  });
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Fetch profile HTTP error ${response.status}: ${errText}`);
  }
  const list = await response.json();
  return list[0] || null;
}
async function saveUserProfileContext(supabaseUrl, serviceKey, userId, context) {
  const url = `${supabaseUrl}/rest/v1/profiles?id=eq.${userId}`;
  const response = await fetch(url, {
    method: "PATCH",
    headers: {
      "apikey": serviceKey,
      "Authorization": `Bearer ${serviceKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      contexto_terapeutico: context,
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    })
  });
  if (!response.ok) {
    const errText = await response.text();
    console.error(`Error patching profile context: ${response.status} - ${errText}`);
  }
}
async function fetchConversationTitle(supabaseUrl, serviceKey, conversationId) {
  try {
    const url = `${supabaseUrl}/rest/v1/conversations?id=eq.${conversationId}&select=title`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "apikey": serviceKey,
        "Authorization": `Bearer ${serviceKey}`,
        "Accept": "application/json"
      }
    });
    if (!response.ok) return "";
    const list = await response.json();
    return list[0]?.title || "";
  } catch (e) {
    console.error("Error fetching conversation title:", e);
    return "";
  }
}
async function fetchConversationUserId(supabaseUrl, serviceKey, conversationId) {
  try {
    const url = `${supabaseUrl}/rest/v1/conversations?id=eq.${conversationId}&select=user_id`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "apikey": serviceKey,
        "Authorization": `Bearer ${serviceKey}`,
        "Accept": "application/json"
      }
    });
    if (!response.ok) return "";
    const list = await response.json();
    return list[0]?.user_id || "";
  } catch (e) {
    console.error("Error fetching conversation user:", e);
    return "";
  }
}
async function updateConversationTitle(supabaseUrl, serviceKey, conversationId, title) {
  try {
    const url = `${supabaseUrl}/rest/v1/conversations?id=eq.${conversationId}`;
    await fetch(url, {
      method: "PATCH",
      headers: {
        "apikey": serviceKey,
        "Authorization": `Bearer ${serviceKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        title,
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      })
    });
  } catch (e) {
    console.error("Error updating conversation title:", e);
  }
}
async function updateConversationTimestamp(supabaseUrl, serviceKey, conversationId) {
  try {
    const url = `${supabaseUrl}/rest/v1/conversations?id=eq.${conversationId}`;
    await fetch(url, {
      method: "PATCH",
      headers: {
        "apikey": serviceKey,
        "Authorization": `Bearer ${serviceKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      })
    });
  } catch (e) {
    console.error("Error updating conversation timestamp:", e);
  }
}
async function saveMessageToDb(supabaseUrl, serviceKey, conversationId, role, content, image) {
  try {
    const url = `${supabaseUrl}/rest/v1/messages`;
    await fetch(url, {
      method: "POST",
      headers: {
        "apikey": serviceKey,
        "Authorization": `Bearer ${serviceKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        conversation_id: conversationId,
        role,
        content,
        image
      })
    });
  } catch (e) {
    console.error("Error saving message to database:", e);
  }
}
async function fetchConversationMessages(supabaseUrl, serviceKey, conversationId) {
  try {
    const url = `${supabaseUrl}/rest/v1/messages?conversation_id=eq.${conversationId}&order=created_at.asc`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "apikey": serviceKey,
        "Authorization": `Bearer ${serviceKey}`,
        "Accept": "application/json"
      }
    });
    if (!response.ok) return [];
    return await response.json();
  } catch {
    return [];
  }
}

async function fetchJsonList(supabaseUrl, serviceKey, path) {
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/${path}`, {
      method: "GET",
      headers: {
        "apikey": serviceKey,
        "Authorization": `Bearer ${serviceKey}`,
        "Accept": "application/json"
      }
    });
    if (!response.ok) {
      const errText = await response.text();
      console.error(`fetchJsonList ${path} HTTP ${response.status}: ${errText}`);
      return [];
    }
    const json = await response.json();
    return Array.isArray(json) ? json : [];
  } catch (e) {
    console.error(`fetchJsonList ${path}:`, e.message);
    return [];
  }
}

function compactText(value, max = 800) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  return text.length > max ? `${text.slice(0, max)}...` : text;
}

function isExcludedOperationalMemory(value) {
  const text = String(value || "").replace(/\s+/g, " ").trim().toLowerCase();
  return /\b(en-78|walter|trading|bingx|drawdown|apalanc|scalping|btc|usdt|mercado|rentabilidad|ordenes?|operativa)\b/.test(text);
}

function proposalText(proposal) {
  const data = proposal?.proposal_data || {};
  return compactText(data.claim || data.event || data.name || data.question || data.summary_vital || data.risk_summary || "", 420);
}

async function fetchClinicalMemory(supabaseUrl, serviceKey, patientId) {
  const [
    profiles,
    snapshots,
    lifeTrees,
    timelineIndex,
    proposals,
    facts,
    riskEvents,
    appointments,
    conversations
  ] = await Promise.all([
    fetchJsonList(supabaseUrl, serviceKey, `clinical_profiles?patient_id=eq.${patientId}&select=summary_vital,psychological_history,medical_history,relationship_context,patterns,goals,risk_summary,last_synthesized_at&limit=1`),
    fetchJsonList(supabaseUrl, serviceKey, `patient_context_snapshots?patient_id=eq.${patientId}&snapshot_type=eq.clinical_chat&select=content,summary,source_counts,created_at&order=created_at.desc&limit=1`),
    fetchJsonList(supabaseUrl, serviceKey, `clinical_life_tree?patient_id=eq.${patientId}&select=tree_data,source_summary,last_synthesized_at&limit=1`),
    fetchJsonList(supabaseUrl, serviceKey, `clinical_timeline_index?patient_id=eq.${patientId}&status=eq.synthesized&select=event_date,date_precision,life_stage,domain,title,description,evidence_quotes,confidence&order=event_date.asc.nullslast,created_at.asc&limit=25`),
    fetchJsonList(supabaseUrl, serviceKey, `clinical_proposals?patient_id=eq.${patientId}&status=eq.pending&select=proposal_type,proposal_data,source_quote,confidence,created_at&order=created_at.desc&limit=16`),
    fetchJsonList(supabaseUrl, serviceKey, `clinical_facts?patient_id=eq.${patientId}&select=kind,claim,verbatim_quote,date_value,date_precision,created_at&order=created_at.desc&limit=12`),
    fetchJsonList(supabaseUrl, serviceKey, `risk_events?patient_id=eq.${patientId}&select=risk_type,severity,evidence_quote,recommended_action,status,created_at&order=created_at.desc&limit=5`),
    fetchJsonList(supabaseUrl, serviceKey, `appointments?patient_id=eq.${patientId}&select=*&order=created_at.desc&limit=5`),
    fetchJsonList(supabaseUrl, serviceKey, `conversations?user_id=eq.${patientId}&select=title,captured_fact,conclusions,solutions_exercises,clinical_studies,status,updated_at&order=updated_at.desc&limit=6`)
  ]);

  const lines = [];
  const profile = profiles[0] || null;
  const snapshot = snapshots[0] || null;
  const lifeTree = lifeTrees[0] || null;

  lines.push("--- MEMORIA CLINICA HERMES / ANCORA ---");
  lines.push("Uso: contexto privado compacto para orientar preguntas, apoyo y preparacion de sesion. No diagnostiques, no prescribas y no presentes lo pendiente como validado.");
  lines.push("Importante: este contexto NO contiene documentos completos ni extracciones largas. Usa solo sintesis versionadas, hechos trazables, timeline, arbol vital, riesgos y propuestas pendientes.");

  if (snapshot?.content) {
    lines.push("\nSintesis compacta disponible:");
    lines.push(isExcludedOperationalMemory(snapshot.content) ? "Snapshot anterior descartado por contener material no clinico/operativo. Regenerar memoria clinica." : compactText(snapshot.content, 3600));
    if (snapshot.source_counts) lines.push(`Fuentes sintetizadas: ${compactText(JSON.stringify(snapshot.source_counts), 360)}`);
  } else {
    lines.push("\nSintesis compacta: aun no hay snapshot clinico generado. Si el paciente pregunta, explica que el sistema necesita procesar/sintetizar su historial antes de usarlo en chat.");
  }

  if (profile) {
    lines.push("\nPerfil clinico consolidado:");
    for (const [label, key] of [
      ["Resumen vital", "summary_vital"],
      ["Antecedentes psicologicos", "psychological_history"],
      ["Antecedentes medicos", "medical_history"],
      ["Contexto relacional", "relationship_context"],
      ["Patrones", "patterns"],
      ["Objetivos", "goals"],
      ["Riesgo", "risk_summary"]
    ]) {
      if (profile[key] && !isExcludedOperationalMemory(profile[key])) lines.push(`- ${label}: ${compactText(profile[key], 600)}`);
    }
  } else {
    lines.push("\nPerfil clinico consolidado: aun no hay perfil validado; usa solo memoria pendiente como hipotesis de trabajo.");
  }

  if (lifeTree?.tree_data) {
    lines.push("\nArbol vital sintetizado:");
    const tree = lifeTree.tree_data || {};
    for (const key of ["family_origin", "childhood", "adolescence", "relationships", "ruptures_losses", "work_studies", "health", "supports_resources", "current_situation", "protective_factors", "open_questions"]) {
      const value = tree[key];
      if (Array.isArray(value) && value.length > 0 && !isExcludedOperationalMemory(value.join("; "))) lines.push(`- ${key}: ${compactText(value.join("; "), 800)}`);
      else if (value && !isExcludedOperationalMemory(JSON.stringify(value))) lines.push(`- ${key}: ${compactText(JSON.stringify(value), 800)}`);
    }
  }

  if (timelineIndex.length > 0) {
    lines.push("\nEje cronologico sintetizado por fecha clinica:");
    for (const ev of timelineIndex) {
      if (isExcludedOperationalMemory(`${ev.title || ""} ${ev.description || ""}`)) continue;
      const quote = Array.isArray(ev.evidence_quotes) && ev.evidence_quotes.length > 0 ? ` | evidencia: "${compactText(ev.evidence_quotes[0], 180)}"` : "";
      lines.push(`- ${ev.event_date || "sin fecha"} (${ev.date_precision || "unknown"}, ${ev.life_stage || "unknown"}): ${compactText(ev.title || ev.description, 420)}${quote}`);
    }
  }

  if (facts.length > 0) {
    lines.push("\nHechos clinicos ya aceptados/documentados:");
    for (const fact of facts) {
      if (isExcludedOperationalMemory(`${fact.claim || ""} ${fact.verbatim_quote || ""}`)) continue;
      lines.push(`- ${fact.kind}: ${compactText(fact.claim, 420)}${fact.verbatim_quote ? ` | cita: "${compactText(fact.verbatim_quote, 240)}"` : ""}`);
    }
  }

  if (proposals.length > 0) {
    lines.push("\nPropuestas IA pendientes de revision psicologica:");
    for (const prop of proposals) {
      if (isExcludedOperationalMemory(`${proposalText(prop)} ${prop.source_quote || ""}`)) continue;
      const quote = prop.source_quote ? ` | cita: "${compactText(prop.source_quote, 220)}"` : "";
      lines.push(`- ${prop.proposal_type}: ${proposalText(prop)}${quote}`);
    }
  }

  if (riskEvents.length > 0) {
    lines.push("\nRiesgos registrados para vigilancia:");
    for (const risk of riskEvents) {
      lines.push(`- ${risk.severity}/${risk.risk_type} [${risk.status}]: ${compactText(risk.evidence_quote, 360)} Accion sugerida: ${compactText(risk.recommended_action, 260)}`);
    }
  }

  if (appointments.length > 0) {
    lines.push("\nCitas/sesiones en agenda o recientes:");
    for (const appt of appointments) {
      const payload = Object.entries(appt).filter(([key]) => !["id", "patient_id", "psychologist_id"].includes(key)).map(([key, value]) => `${key}=${value}`).join(", ");
      lines.push(`- ${compactText(payload, 500)}`);
    }
  }

  if (conversations.length > 0) {
    lines.push("\nConversaciones/sesiones previas:");
    for (const conv of conversations) {
      lines.push(`- ${conv.title || "Sin titulo"} [${conv.status || "sin estado"}]: ${compactText(conv.captured_fact || conv.clinical_studies || conv.conclusions || "", 520)}`);
    }
  }

  return {
    hasClinicalMemory: Boolean(snapshot?.content) || timelineIndex.length > 0 || proposals.length > 0 || facts.length > 0 || Boolean(profile),
    prompt: lines.join("\n")
  };
}
async function saveConversationConclusions(supabaseUrl, serviceKey, conversationId, conclusionsData, status = "completed") {
  try {
    const url = `${supabaseUrl}/rest/v1/conversations?id=eq.${conversationId}`;
    const patchBody = {
      captured_fact: conclusionsData.captured_fact,
      conclusions: JSON.stringify(conclusionsData.conclusions),
      solutions_exercises: JSON.stringify(conclusionsData.solutions_exercises),
      clinical_studies: conclusionsData.clinical_studies,
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    };
    if (status === "completed") {
      patchBody.status = "completed";
      patchBody.closed_at = (/* @__PURE__ */ new Date()).toISOString();
    } else {
      patchBody.status = status;
    }
    const response = await fetch(url, {
      method: "PATCH",
      headers: {
        "apikey": serviceKey,
        "Authorization": `Bearer ${serviceKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(patchBody)
    });
    if (!response.ok) {
      const errText = await response.text();
      console.error(`Error patching conversation conclusions: ${response.status} - ${errText}`);
    }
  } catch (e) {
    console.error("Error saving conversation conclusions:", e);
  }
}
async function fetchMenteSources(supabaseUrl, serviceKey, userId) {
  try {
    const url = `${supabaseUrl}/rest/v1/mente_sources?user_id=eq.${userId}&order=created_at.desc`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "apikey": serviceKey,
        "Authorization": `Bearer ${serviceKey}`,
        "Accept": "application/json"
      }
    });
    if (!response.ok) return [];
    return await response.json();
  } catch {
    return [];
  }
}
function extractTextFromDocx(base64Data) {
  try {
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const unzipped = unzipSync(bytes);
    const docXmlBytes = unzipped["word/document.xml"];
    if (!docXmlBytes) return "";
    const xmlText = new TextDecoder().decode(docXmlBytes);
    const matches = xmlText.match(/<w:t[^>]*>([\s\S]*?)<\/w:t>/g);
    if (!matches) return "";
    return matches.map((tag) => {
      const text = tag.replace(/<[^>]+>/g, "");
      return text.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'");
    }).join(" ");
  } catch (err) {
    console.error("Error extracting text from docx:", err);
    return `[Error al extraer texto del archivo docx: ${err.message}]`;
  }
}
async function getCleanTextContent(src, supabaseUrl, serviceKey) {
  let content = src.text_content ?? "";
  const isDocx = src.content_type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || src.name && src.name.endsWith(".docx");
  if (isDocx && content.includes("base64,")) {
    const base64Data = content.split("base64,")[1] || "";
    if (base64Data) {
      console.log(`On-the-fly docx text extraction for: ${src.name}`);
      const cleanText = extractTextFromDocx(base64Data);
      if (cleanText && !cleanText.startsWith("[Error")) {
        try {
          const url = `${supabaseUrl}/rest/v1/mente_sources?id=eq.${src.id}`;
          await fetch(url, {
            method: "PATCH",
            headers: {
              "apikey": serviceKey,
              "Authorization": `Bearer ${serviceKey}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({ text_content: cleanText })
          });
          console.log(`Successfully updated docx text_content in database for: ${src.name}`);
          content = cleanText;
        } catch (dbErr) {
          console.error("Error updating docx in DB:", dbErr.message);
        }
      } else {
        content = cleanText;
      }
    }
  }
  return content;
}
async function fetchRecentMoods(supabaseUrl, serviceKey, userId) {
  try {
    const url = `${supabaseUrl}/rest/v1/daily_moods?user_id=eq.${userId}&order=date.desc&limit=7`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "apikey": serviceKey,
        "Authorization": `Bearer ${serviceKey}`,
        "Accept": "application/json"
      }
    });
    if (!response.ok) return [];
    return await response.json();
  } catch {
    return [];
  }
}
async function upsertJournalDays(supabaseUrl, serviceKey, userId, days) {
  if (days.length === 0) return;
  const url = `${supabaseUrl}/rest/v1/journal_days?on_conflict=user_id,date`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "apikey": serviceKey,
      "Authorization": `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
      "Prefer": "resolution=merge-duplicates"
    },
    body: JSON.stringify(days)
  });
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Upsert journal_days HTTP error ${response.status}: ${errText}`);
  }
}
async function generateConversationTitle(openrouterApiKey, userMessage) {
  const prompt = `Analiza este primer mensaje de una sesi\xF3n y genera un t\xEDtulo de 3 a 5 palabras en espa\xF1ol que resuma el tema. S\xE9 conciso y directo, sin comillas ni adornos.
  Mensaje: "${userMessage}"`;
  let title = "";
  try {
    if (!openrouterApiKey) {
      console.warn("OPENROUTER_API_KEY no configurado al generar t\xEDtulo.");
      return "Nueva Sesi\xF3n con Walter";
    }
    const openrouterUrl = "https://openrouter.ai/api/v1/chat/completions";
    const res = await fetch(openrouterUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openrouterApiKey}`
      },
      body: JSON.stringify({
        model: TEXT_MODEL,
        messages: [{ role: "user", content: prompt }],
        max_tokens: 30
      })
    });
    if (res.ok) {
      const json = await res.json();
      title = json.choices?.[0]?.message?.content?.trim() || "";
    } else {
      console.error("OpenRouter error generating title:", await res.text());
    }
  } catch (e) {
    console.error("Error generating title:", e.message);
  }
  return title.replace(/"/g, "").replace(/\./g, "").trim() || "Nueva Sesi\xF3n";
}
async function callOpenRouter(model, messages, temperature = 0.3, responseFormatJson = false, timeoutMs = 4e4, openrouterApiKey) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const payload = {
      model,
      messages,
      temperature
    };
    if (responseFormatJson) {
      payload.response_format = { type: "json_object" };
    }
    if (model.includes("deepseek")) {
      payload.provider = {
        order: ["DeepInfra", "DeepSeek", "NovitaAI"],
        allow_fallbacks: true
      };
    }
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openrouterApiKey}`
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`HTTP ${res.status}: ${errText}`);
    }
    const json = await res.json();
    return json.choices?.[0]?.message?.content || "";
  } catch (err) {
    console.error(`Error calling model ${model}:`, err.message);
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}
function createEmptyMenteContext() {
  return {
    contexto_base: {
      diagnostico_inicial: "",
      mecanismos_defensa: []
    },
    foto_persona: "",
    evoluciones: [],
    temas: [],
    conclusiones: [],
    compromisos: [],
    pautas_accion: [],
    fuentes_ayuda: [],
    procesados: { sources: [], conversations: [] }
  };
}
function uniqueStringList(value) {
  const list = Array.isArray(value) ? value : value === null || value === void 0 || value === "" ? [] : [value];
  return Array.from(new Set(list.map((item) => String(item).trim()).filter(Boolean)));
}
function normalizeMenteContext(value) {
  const clean = { ...createEmptyMenteContext(), ...value || {} };
  clean.contexto_base = {
    diagnostico_inicial: clean.contexto_base?.diagnostico_inicial || "",
    mecanismos_defensa: uniqueStringList(clean.contexto_base?.mecanismos_defensa)
  };
  clean.evoluciones = Array.isArray(clean.evoluciones) ? clean.evoluciones : [];
  clean.temas = Array.isArray(clean.temas) ? clean.temas : [];
  clean.conclusiones = uniqueStringList(clean.conclusiones);
  clean.compromisos = uniqueStringList(clean.compromisos);
  clean.pautas_accion = uniqueStringList(clean.pautas_accion);
  clean.fuentes_ayuda = uniqueStringList(clean.fuentes_ayuda);
  clean.procesados = {
    sources: uniqueStringList(clean.procesados?.sources),
    conversations: uniqueStringList(clean.procesados?.conversations)
  };
  return clean;
}
function stripSyncRun(ctx) {
  const clean = normalizeMenteContext(ctx);
  delete clean.sync_run;
  return clean;
}
function dataUrlForSource(src) {
  const content = String(src.text_content || "");
  const mime = src.content_type || "application/octet-stream";
  if (content.startsWith("data:")) return content;
  const base64Data = content.includes("base64,") ? content.split("base64,")[1] : content;
  return `data:${mime};base64,${base64Data}`;
}
function isDocxSource(src) {
  const name = String(src.name || "").toLowerCase();
  return src.content_type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || name.endsWith(".docx");
}
function isDirectTextSource(src) {
  const name = String(src.name || "").toLowerCase();
  const mime = String(src.content_type || "").toLowerCase();
  return mime === "note" || mime.startsWith("text/") || name.endsWith(".txt") || name.endsWith(".md") || name.endsWith(".json") || name.endsWith(".csv");
}
function isPdfSource(src) {
  const name = String(src.name || "").toLowerCase();
  const mime = String(src.content_type || "").toLowerCase();
  return mime === "application/pdf" || name.endsWith(".pdf");
}
function isImageSource(src) {
  return String(src.content_type || "").toLowerCase().startsWith("image/");
}
async function patchRestRecord(supabaseUrl, serviceKey, table, id, payload) {
  const response = await fetch(`${supabaseUrl}/rest/v1/${table}?id=eq.${id}`, {
    method: "PATCH",
    headers: {
      "apikey": serviceKey,
      "Authorization": `Bearer ${serviceKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Failed to patch ${table}/${id}: HTTP ${response.status}: ${errText}`);
  }
}
async function extractAttachmentTextWithGemini(src, openrouterApiKey) {
  const isImage = isImageSource(src);
  const filePart = isImage ? {
    type: "image_url",
    image_url: { url: dataUrlForSource(src) }
  } : {
    type: "file",
    file: {
      filename: src.name || "document.pdf",
      file_data: dataUrlForSource(src)
    }
  };
  const prompt = `Extrae y transcribe el contenido util de este adjunto para una memoria privada de contexto.

Reglas:
- Devuelve solo texto en espanol.
- Si es un PDF, extrae el texto legible y conserva estructura de secciones si existe.
- Si es una imagen, transcribe texto visible y describe de forma objetiva la informacion relevante.
- No inventes datos que no aparezcan en el adjunto.
- Si no hay texto legible, devuelve una descripcion breve de lo observable.`;
  const replyText = await callOpenRouter(
    EXTRACTION_MODEL,
    [{ role: "user", content: [{ type: "text", text: prompt }, filePart] }],
    0.1,
    false,
    6e4,
    openrouterApiKey
  );
  const clean = String(replyText || "").trim();
  if (!clean) throw new Error("Gemini no devolvio texto extraido.");
  return clean;
}
async function getSourceTextForSync(src, supabaseUrl, serviceKey, openrouterApiKey) {
  if (src.extraction_status === "ready" && src.extracted_text) {
    return String(src.extracted_text);
  }
  let extractedText = "";
  let extractionModel = "direct";
  if (isDirectTextSource(src) || isDocxSource(src)) {
    extractedText = await getCleanTextContent(src, supabaseUrl, serviceKey);
    extractionModel = isDocxSource(src) ? "docx-fflate" : "direct";
  } else if (isPdfSource(src) || isImageSource(src)) {
    extractedText = await extractAttachmentTextWithGemini(src, openrouterApiKey);
    extractionModel = EXTRACTION_MODEL;
  } else {
    throw new Error(`Tipo de archivo no soportado para extraccion: ${src.content_type || src.name || "desconocido"}`);
  }
  extractedText = String(extractedText || "").trim();
  if (!extractedText) throw new Error("La extraccion no produjo texto util.");
  await patchRestRecord(supabaseUrl, serviceKey, "mente_sources", src.id, {
    extracted_text: extractedText,
    extraction_status: "ready",
    extraction_model: extractionModel,
    extracted_at: (/* @__PURE__ */ new Date()).toISOString(),
    extraction_error: null
  });
  return extractedText;
}
function readableValue(value) {
  if (!value) return "";
  if (Array.isArray(value)) return value.map((item) => `- ${String(item).trim()}`).join("\n");
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed.map((item) => `- ${String(item).trim()}`).join("\n");
    } catch (_) {
    }
    return value;
  }
  return JSON.stringify(value);
}
function mergeEvoluciones(newItems, existingItems) {
  const seen = /* @__PURE__ */ new Set();
  const merged = [];
  [...newItems || [], ...existingItems || []].forEach((item) => {
    if (!item) return;
    const key = [
      item.sesion_id || "",
      item.fecha || "",
      item.titulo_sesion || "",
      item.hecho_clinico || ""
    ].map((part) => String(part).trim().toLowerCase()).join("|");
    if (seen.has(key)) return;
    seen.add(key);
    merged.push(item);
  });
  return merged;
}
function buildConversationContextText(conv, dbMessages, isOwner) {
  const parts = [
    `Titulo: ${conv.title || "Conversacion"}`,
    conv.captured_fact ? `Hecho principal: ${conv.captured_fact}` : "",
    conv.analisis_evolutivo ? `Analisis previo de cierre:
${conv.analisis_evolutivo}` : "",
    conv.conclusions ? `Conclusiones de cierre:
${readableValue(conv.conclusions)}` : "",
    conv.solutions_exercises ? `Pautas/ejercicios:
${readableValue(conv.solutions_exercises)}` : "",
    conv.clinical_studies ? `Fuentes o referencias:
${conv.clinical_studies}` : ""
  ].filter(Boolean);
  const transcript = dbMessages.map((m) => `${m.role === "user" ? "Usuario" : isOwner ? "Walter" : "Asistente"}: ${String(m.content || "").replace(/\[model:.*?\]/g, "").trim()}`).filter(Boolean).join("\n");
  if (transcript) parts.push(`Transcripcion:
${transcript}`);
}

async function fetchUserCredits(supabaseUrl, serviceKey, userId) {
  try {
    const url = `${supabaseUrl}/rest/v1/patient_credits?patient_id=eq.${userId}&select=*`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "apikey": serviceKey,
        "Authorization": `Bearer ${serviceKey}`,
        "Accept": "application/json"
      }
    });
    if (!response.ok) {
      const errText = await response.text();
      console.error(`Fetch credits HTTP error ${response.status}: ${errText}`);
      return null;
    }
    const list = await response.json();
    return list[0] || null;
  } catch (err) {
    console.error(`Error fetching credits for user ${userId}:`, err.message);
    return null;
  }
}

async function updateUserTextCredits(supabaseUrl, serviceKey, userId, tokensUsed) {
  try {
    const credits = await fetchUserCredits(supabaseUrl, serviceKey, userId);
    if (!credits) return null;
    const newUsed = (credits.text_credits_used || 0) + tokensUsed;
    const url = `${supabaseUrl}/rest/v1/patient_credits?patient_id=eq.${userId}`;
    const response = await fetch(url, {
      method: "PATCH",
      headers: {
        "apikey": serviceKey,
        "Authorization": `Bearer ${serviceKey}`,
        "Content-Type": "application/json",
        "Prefer": "return=representation"
      },
      body: JSON.stringify({
        text_credits_used: newUsed,
        updated_at: new Date().toISOString()
      })
    });
    if (!response.ok) {
      const errText = await response.text();
      console.error(`Update text credits HTTP error ${response.status}: ${errText}`);
      return null;
    }
    const list = await response.json();
    return list[0] || null;
  } catch (err) {
    console.error(`Error updating text credits for user ${userId}:`, err.message);
    return null;
  }
}

async function updateUserLiveCredits(supabaseUrl, serviceKey, userId, secondsUsed) {
  try {
    const credits = await fetchUserCredits(supabaseUrl, serviceKey, userId);
    if (!credits) return null;
    const newUsed = (credits.live_credits_used || 0) + secondsUsed;
    const url = `${supabaseUrl}/rest/v1/patient_credits?patient_id=eq.${userId}`;
    const response = await fetch(url, {
      method: "PATCH",
      headers: {
        "apikey": serviceKey,
        "Authorization": `Bearer ${serviceKey}`,
        "Content-Type": "application/json",
        "Prefer": "return=representation"
      },
      body: JSON.stringify({
        live_credits_used: newUsed,
        updated_at: new Date().toISOString()
      })
    });
    if (!response.ok) {
      const errText = await response.text();
      console.error(`Update live credits HTTP error ${response.status}: ${errText}`);
      return null;
    }
    const list = await response.json();
    return list[0] || null;
  } catch (err) {
    console.error(`Error updating live credits for user ${userId}:`, err.message);
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  try {
    let cleanJsonString = function(jsonStr) {
      let clean = jsonStr.trim();
      if (clean.startsWith("```json")) {
        clean = clean.substring(7);
      } else if (clean.startsWith("```")) {
        clean = clean.substring(3);
      }
      if (clean.endsWith("```")) {
        clean = clean.substring(0, clean.length - 3);
      }
      clean = clean.trim();
      let insideString = false;
      let escaped = false;
      let result = "";
      for (let i = 0; i < clean.length; i++) {
        const char = clean[i];
        if (char === '"' && !escaped) {
          insideString = !insideString;
          result += char;
        } else if (char === "\\" && !escaped) {
          escaped = true;
          result += char;
        } else {
          if (insideString) {
            if (char === "\n") {
              result += "\\n";
            } else if (char === "\r") {
            } else {
              result += char;
            }
          } else {
            result += char;
          }
          escaped = false;
        }
      }
      return result;
    }, extractJSONFieldsFallback = function(jsonStr) {
      console.warn("JSON.parse failed. Initiating robust regex fallback extractor...");
      const fotoMatch = jsonStr.match(/"foto_persona"\s*:\s*"([\s\S]*?)"(?=\s*,\s*"|\s*\})/);
      let fotoPersona = fotoMatch ? fotoMatch[1] : "";
      if (!fotoPersona) {
        const fotoTruncatedMatch = jsonStr.match(/"foto_persona"\s*:\s*"([\s\S]*)/);
        if (fotoTruncatedMatch) {
          fotoPersona = fotoTruncatedMatch[1].trim().substring(0, 800) + "... [Texto truncado por el modelo]";
        } else {
          fotoPersona = "No se pudo extraer la s\xEDntesis de la foto de la persona.";
        }
      }
      const cleanArrayItems = (rawItems) => {
        return rawItems.split(/",\s*"/g).map((item) => item.replace(/^\[?\s*"/, "").replace(/"\s*\]?$/, "").replace(/"/g, "").trim()).filter(Boolean);
      };
      const conclusionsMatch = jsonStr.match(/"conclusiones"\s*:\s*\[([\s\S]*?)\]/);
      let conclusiones = [];
      if (conclusionsMatch) {
        conclusiones = cleanArrayItems(conclusionsMatch[1]);
      } else {
        const lines = jsonStr.split("\n");
        lines.forEach((l) => {
          if (l.includes('"conclusiones"') || conclusiones.length > 0 && !l.includes("]")) {
            const itemMatch = l.match(/"([^"]+)"/g);
            if (itemMatch) {
              itemMatch.forEach((it) => {
                const cleanIt = it.replace(/"/g, "").trim();
                if (cleanIt && cleanIt !== "conclusiones" && cleanIt.length > 10) conclusiones.push(cleanIt);
              });
            }
          }
        });
      }
      const compromisosMatch = jsonStr.match(/"compromisos"\s*:\s*\[([\s\S]*?)\]/);
      let compromisos = [];
      if (compromisosMatch) {
        compromisos = cleanArrayItems(compromisosMatch[1]);
      } else {
        const lines = jsonStr.split("\n");
        lines.forEach((l) => {
          if (l.includes('"compromisos"') || compromisos.length > 0 && !l.includes("]")) {
            const itemMatch = l.match(/"([^"]+)"/g);
            if (itemMatch) {
              itemMatch.forEach((it) => {
                const cleanIt = it.replace(/"/g, "").trim();
                if (cleanIt && cleanIt !== "compromisos" && cleanIt.length > 10) compromisos.push(cleanIt);
              });
            }
          }
        });
      }
      const pautasMatch = jsonStr.match(/"pautas_accion"\s*:\s*\[([\s\S]*?)\]/);
      let pautas_accion = [];
      if (pautasMatch) {
        pautas_accion = cleanArrayItems(pautasMatch[1]);
      } else {
        const lines = jsonStr.split("\n");
        lines.forEach((l) => {
          if (l.includes('"pautas_accion"') || pautas_accion.length > 0 && !l.includes("]")) {
            const itemMatch = l.match(/"([^"]+)"/g);
            if (itemMatch) {
              itemMatch.forEach((it) => {
                const cleanIt = it.replace(/"/g, "").trim();
                if (cleanIt && cleanIt !== "pautas_accion" && cleanIt.length > 10) pautas_accion.push(cleanIt);
              });
            }
          }
        });
      }
      const temasMatch = jsonStr.match(/"temas"\s*:\s*\[([\s\S]*?)\]/);
      let temas = [];
      if (temasMatch) {
        const temaBlock = temasMatch[1];
        const objBlocks = temaBlock.match(/\{[\s\S]*?\}/g);
        if (objBlocks) {
          objBlocks.forEach((block) => {
            const tMatch = block.match(/"title"\s*:\s*"([^"]*)"/);
            const sMatch = block.match(/"status"\s*:\s*"([^"]*)"/);
            const dMatch = block.match(/"description"\s*:\s*"([^"]*)"/);
            if (tMatch) {
              temas.push({
                title: tMatch[1],
                status: sMatch ? sMatch[1] : "active",
                description: dMatch ? dMatch[1] : ""
              });
            }
          });
        }
      }
      return {
        foto_persona: fotoPersona.replace(/\\n/g, "\n"),
        temas,
        conclusiones: conclusiones.slice(0, 10),
        compromisos: compromisos.slice(0, 10),
        pautas_accion: pautas_accion.slice(0, 10)
      };
    };
    console.log("OPENROUTER_API_KEY length:", Deno.env.get("OPENROUTER_API_KEY")?.length || 0);
    console.log("GEMINI_API_KEY length:", Deno.env.get("GEMINI_API_KEY")?.length || 0);
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing Authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    const token = authHeader.replace("Bearer ", "");
    const userId = getUserIdFromToken(token);
    const userEmail = getUserEmailFromToken(token);
    const isOwner = userEmail === "josferestudio@gmail.com";
    if (!userId) {
      return new Response(JSON.stringify({ error: "Invalid user token (cannot parse payload)" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const body = await req.json();
    const { action, messages, currentMood, conversationId, tradingviewContext, model, reset, only } = body;
    
    if (action === "live_session_close") {
      const { durationSeconds } = body;
      if (durationSeconds === undefined || typeof durationSeconds !== "number" || durationSeconds <= 0) {
        return new Response(JSON.stringify({ error: "durationSeconds es requerido y debe ser un número positivo." }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      const updatedCredits = await updateUserLiveCredits(supabaseUrl, supabaseServiceKey, userId, durationSeconds);
      if (!updatedCredits) {
        return new Response(JSON.stringify({ error: "No se pudieron actualizar los créditos del paciente." }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      return new Response(JSON.stringify({
        success: true,
        credits: {
          text_credits_total: updatedCredits.text_credits_total,
          text_credits_used: updatedCredits.text_credits_used,
          live_credits_total: updatedCredits.live_credits_total,
          live_credits_used: updatedCredits.live_credits_used,
          cycle_start_date: updatedCredits.cycle_start_date,
          cycle_end_date: updatedCredits.cycle_end_date
        }
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    if (action === "debug_env") {
      return new Response(JSON.stringify({
        envKeys: Object.keys(Deno.env.toObject())
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    if (action === "prepare_close_conversation") {
      const openrouterApiKey2 = Deno.env.get("OPENROUTER_API_KEY");
      if (!openrouterApiKey2) {
        return new Response(JSON.stringify({ error: "OPENROUTER_API_KEY no est\xE1 configurado en las variables de entorno de Supabase." }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      if (!conversationId) {
        return new Response(JSON.stringify({ error: "conversationId is required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      const conversationOwnerId = await fetchConversationUserId(supabaseUrl, supabaseServiceKey, conversationId);
      if (conversationOwnerId !== userId) {
        return new Response(JSON.stringify({ error: "Conversation does not belong to this user." }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      const dbMessages = await fetchConversationMessages(supabaseUrl, supabaseServiceKey, conversationId);
      if (dbMessages.length === 0) {
        return new Response(JSON.stringify({ error: "No messages found in this conversation to analyze." }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      const conversationText = dbMessages.map((m) => `${m.role === "user" ? "Usuario" : isOwner ? "Walter" : "Asistente"}: ${m.content}`).join("\n");
      const prompt = `Analiza de forma sumamente detallada, amplia y cl\xEDnica la siguiente conversaci\xF3n entre el usuario propietario y Walter, y extrae las conclusiones estructuradas en formato JSON estricto.

Estructura JSON requerida:
{
  "captured_fact": "El hecho cl\xEDnico, disparador o s\xEDntoma principal que desencaden\xF3 la sesi\xF3n de forma breve y precisa",
  "analisis_evolutivo": "Un informe de an\xE1lisis exhaustivo y detallado (de 250 a 400 palabras en espa\xF1ol) sobre todo lo valioso ocurrido en esta sesi\xF3n. Debe estructurar detalladamente: (1) El n\xFAcleo tem\xE1tico trabajado, (2) Los avances cognitivos o emocionales logrados en el chat, (3) Los mecanismos de defensa, resistencias y bloqueos observados durante la sesi\xF3n, (4) El sentido y desglose de las pautas y compromisos pr\xE1cticos acordados.",
  "conclusions": ["Conclusi\xF3n 1 detallada sobre el patr\xF3n observado", "Conclusi\xF3n 2 detallada sobre sus patrones cognitivos", "Conclusi\xF3n 3 sobre su estado de regulaci\xF3n"],
  "solutions_exercises": ["Pauta o ejercicio pr\xE1ctico detallado 1", "Pauta o compromiso pr\xE1ctico detallado 2", "Pauta o ejercicio detallado 3"],
  "clinical_studies": "Libros de referencia, autores, o estudios aplicables si proceden seg\xFAn la conversaci\xF3n",
  "assistant_summary": "Un texto explicativo y de cierre redactado como Walter (de 200 a 350 palabras en espa\xF1ol) para mostrar en el chat. Debe detallar la investigaci\xF3n de lo que pasa, por qu\xE9 y c\xF3mo solucionarlo, citando fuentes de apoyo de forma clara y directa si proceden, indicando que revise el panel derecho."
}

Historial de conversaci\xF3n:
${conversationText}

IMPORTANTE: El an\xE1lisis y las conclusiones deben basarse ESTRICTAMENTE en la conversaci\xF3n real del chat activo provista arriba. No asumas ni inventes deudas, diagn\xF3sticos, trading ni relaciones personales si la conversaci\xF3n no trata de ello. Si hablaron sobre familiares, bloqueos mentales u otros temas personales, conc\xE9ntrate solo en eso y describe el hecho y las pautas reales acordadas en el chat.

IMPORTANTE: Devuelve un JSON v\xE1lido. Si usas comillas dobles dentro de una cadena de texto (por ejemplo en "analisis_evolutivo"), debes escaparlas estrictamente con barra invertida ("), o preferiblemente usa comillas simples (') en su lugar.

Devuelve \xDANICAMENTE el objeto JSON v\xE1lido. No incluyas explicaciones previas ni posteriores, ni bloques de c\xF3digo de markdown.`;
      const genericClosePrompt = `Analiza de forma objetiva y pr\xE1ctica la siguiente conversaci\xF3n de apoyo entre un usuario y un asistente, y extrae conclusiones estructuradas en formato JSON estricto.

Estructura JSON requerida:
{
  "captured_fact": "El tema, disparador o necesidad principal de la sesi\xF3n de forma breve y precisa",
  "analisis_evolutivo": "Un informe de 180 a 300 palabras en espa\xF1ol sobre lo trabajado, patrones observados y pautas pr\xE1cticas, sin inventar datos personales no presentes.",
  "conclusions": ["Conclusi\xF3n 1 basada solo en la conversaci\xF3n", "Conclusi\xF3n 2 basada solo en la conversaci\xF3n"],
  "solutions_exercises": ["Pauta pr\xE1ctica 1", "Pauta pr\xE1ctica 2"],
  "clinical_studies": "Referencias generales aplicables si proceden, sin asumir diagn\xF3sticos",
  "assistant_summary": "Un texto de cierre de 150 a 250 palabras para mostrar en el chat, pr\xE1ctico y neutral."
}

Historial de conversaci\xF3n:
${conversationText}

IMPORTANTE: No menciones nombres, entidades, deudas, trading, herramientas externas ni ning\xFAn dato privado que no aparezca literalmente en esta conversaci\xF3n.
IMPORTANTE: Devuelve \xFAnicamente JSON v\xE1lido.`;
      const closurePrompt = isOwner ? prompt : genericClosePrompt;
      let conclusionsData = null;
      let lastErrorMsg = "";
      let closePromptTokens = 0;
      let closeCompletionTokens = 0;
      let closeCacheTokens = 0;
      try {
        console.log(`PREPARAR CIERRE: Llamando a OpenRouter con ${TEXT_MODEL}...`);
        const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${openrouterApiKey2}`
          },
          body: JSON.stringify({
            model: TEXT_MODEL,
            messages: [{ role: "user", content: closurePrompt }],
            temperature: 0.2,
            response_format: { type: "json_object" }
          })
        });
        if (!res.ok) {
          const errText = await res.text();
          throw new Error(`HTTP ${res.status}: ${errText}`);
        }
        const json = await res.json();
        const replyText2 = json.choices?.[0]?.message?.content || "";
        
        closePromptTokens = json.usage?.prompt_tokens || 0;
        closeCompletionTokens = json.usage?.completion_tokens || 0;
        closeCacheTokens = json.usage?.prompt_tokens_details?.cached || json.usage?.cache_read_input_tokens || 0;

        if (replyText2) {
          const cleanJson = cleanJsonString(replyText2);
          try {
            conclusionsData = JSON.parse(cleanJson);
          } catch (jsonErr) {
            console.error("Failed to parse close conversation JSON using JSON.parse, trying regex fallback:", jsonErr.message);
            try {
              const fallbackData = extractJSONFieldsFallback(replyText2);
              conclusionsData = {
                captured_fact: fallbackData.captured_fact || "Hecho cl\xEDnico analizado en sesi\xF3n.",
                analisis_evolutivo: fallbackData.foto_persona || "Se analiz\xF3 evolutivamente la sesi\xF3n.",
                conclusions: fallbackData.conclusiones || [],
                solutions_exercises: fallbackData.pautas_accion || [],
                clinical_studies: "Referencias pendientes de consolidar.",
                assistant_summary: "He analizado nuestra conversaci\xF3n y preparado las conclusiones del cierre de esta sesi\xF3n. Puedes revisarlas en detalle en el panel de la derecha."
              };
            } catch (fallbackErr) {
              lastErrorMsg = `Fallo al parsear con regex fallback: ${fallbackErr.message}`;
              console.error(lastErrorMsg);
            }
          }
        } else {
          lastErrorMsg = "OpenRouter retorn\xF3 una respuesta vac\xEDa.";
        }
      } catch (err) {
        lastErrorMsg = err.message || String(err);
        console.error("Error analyzing close conversation:", lastErrorMsg);
      }
      if (!conclusionsData) {
        return new Response(JSON.stringify({ error: `Fallo al analizar la sesi\xF3n con el modelo de an\xE1lisis. Detalles: ${lastErrorMsg}` }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      await saveConversationConclusions(supabaseUrl, supabaseServiceKey, conversationId, conclusionsData, "active");
      const formattedSummary = conclusionsData.assistant_summary || "Borrador de cierre preparado.";
      const closeCachePercent = closePromptTokens > 0 ? Math.round((closeCacheTokens / closePromptTokens) * 100) : 0;
      const summaryWithMessage = `${formattedSummary}\n\n[model:${TEXT_MODEL}][usage:${closePromptTokens}|${closeCompletionTokens}|${closeCachePercent}%]`;
      await saveMessageToDb(supabaseUrl, supabaseServiceKey, conversationId, "assistant", summaryWithMessage);
      const profile2 = await fetchUserProfile(supabaseUrl, supabaseServiceKey, userId);
      return new Response(JSON.stringify({ success: true, data: conclusionsData, updatedContext: profile2?.contexto_terapeutico || null }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    if (action === "close_conversation") {
      if (!conversationId) {
        return new Response(JSON.stringify({ error: "conversationId is required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      try {
        const conversationOwnerId = await fetchConversationUserId(supabaseUrl, supabaseServiceKey, conversationId);
        if (conversationOwnerId !== userId) {
          return new Response(JSON.stringify({ error: "Conversation does not belong to this user." }), {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }
        const url = `${supabaseUrl}/rest/v1/conversations?id=eq.${conversationId}`;
        const response2 = await fetch(url, {
          method: "PATCH",
          headers: {
            "apikey": supabaseServiceKey,
            "Authorization": `Bearer ${supabaseServiceKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            status: "completed",
            context_sync_status: "pending",
            context_synced_at: null,
            context_sync_run_id: null,
            closed_at: (/* @__PURE__ */ new Date()).toISOString(),
            updated_at: (/* @__PURE__ */ new Date()).toISOString()
          })
        });
        if (!response2.ok) {
          throw new Error(`Failed to complete conversation: ${response2.status}`);
        }
      } catch (err) {
        console.error("Error setting status to completed:", err.message);
        return new Response(JSON.stringify({ error: err.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    if (action === "prepare_mente_sync") {
      const [sources, profile2, resConvs] = await Promise.all([
        fetchMenteSources(supabaseUrl, supabaseServiceKey, userId),
        fetchUserProfile(supabaseUrl, supabaseServiceKey, userId),
        fetch(`${supabaseUrl}/rest/v1/conversations?user_id=eq.${userId}&status=eq.completed`, {
          headers: {
            "apikey": supabaseServiceKey,
            "Authorization": `Bearer ${supabaseServiceKey}`,
            "Accept": "application/json"
          }
        }).then((res) => res.ok ? res.json() : [])
      ]);
      if (reset) {
        console.log("prepare_mente_sync: reset requested, resetting sync statuses in DB...");
        try {
          await fetch(`${supabaseUrl}/rest/v1/mente_sources?user_id=eq.${userId}`, {
            method: "PATCH",
            headers: {
              "apikey": supabaseServiceKey,
              "Authorization": `Bearer ${supabaseServiceKey}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({ processed: false, sync_status: "pending", analysis_run_id: null })
          });
          await fetch(`${supabaseUrl}/rest/v1/conversations?user_id=eq.${userId}`, {
            method: "PATCH",
            headers: {
              "apikey": supabaseServiceKey,
              "Authorization": `Bearer ${supabaseServiceKey}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({ context_sync_status: "pending", context_sync_run_id: null, context_synced_at: null })
          });
        } catch (resetErr) {
          console.error("prepare_mente_sync: reset error:", resetErr.message);
        }
      }
      const [freshSources, freshProfile, freshConvs] = reset ? await Promise.all([
        fetchMenteSources(supabaseUrl, supabaseServiceKey, userId),
        fetchUserProfile(supabaseUrl, supabaseServiceKey, userId),
        fetch(`${supabaseUrl}/rest/v1/conversations?user_id=eq.${userId}&status=eq.completed`, {
          headers: {
            "apikey": supabaseServiceKey,
            "Authorization": `Bearer ${supabaseServiceKey}`,
            "Accept": "application/json"
          }
        }).then((res) => res.ok ? res.json() : [])
      ]) : [sources, profile2, resConvs];
      const originalCtx = freshProfile?.contexto_terapeutico || {};
      const stableCtx = stripSyncRun(originalCtx);
      const requestedMode = reset ? "complete" : only === "sources" ? "sources" : "incremental";
      const sourceShouldSync = (src) => {
        if (requestedMode === "complete") return true;
        const fallbackAnalyzed = src.processed === true || (stableCtx.procesados?.sources || []).includes(src.id);
        const status = src.sync_status || (fallbackAnalyzed ? "analyzed" : "pending");
        if (status === "pending") return true;
        if (status === "error" && src.extraction_status !== "error") return true;
        return false;
      };
      const conversationShouldSync = (conv) => {
        if (requestedMode === "complete") return true;
        const fallbackAnalyzed = (stableCtx.procesados?.conversations || []).includes(conv.id);
        const status = conv.context_sync_status || (fallbackAnalyzed ? "analyzed" : "pending");
        return status === "pending" || status === "error";
      };
      const queueSources = only === "conversations" ? [] : (freshSources || []).filter(sourceShouldSync).sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()).map((src) => src.id);
      const queueConversations = only === "sources" ? [] : (freshConvs || []).filter(conversationShouldSync).sort((a, b) => new Date(a.closed_at || a.updated_at || Date.now()).getTime() - new Date(b.closed_at || b.updated_at || Date.now()).getTime()).map((conv) => conv.id);
      const syncRun = {
        id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        status: "active",
        mode: requestedMode,
        only: only || "all",
        started_at: (/* @__PURE__ */ new Date()).toISOString(),
        queue_sources: queueSources,
        queue_conversations: queueConversations,
        processed_sources: [],
        processed_conversations: [],
        error_sources: [],
        error_conversations: [],
        errors: [],
        draft_context: reset ? createEmptyMenteContext() : stableCtx
      };
      const contextToSave = { ...stableCtx, sync_run: syncRun };
      await saveUserProfileContext(supabaseUrl, supabaseServiceKey, userId, contextToSave);
      const queueItems = [
        ...queueSources.map((id) => ({ id, type: "source" })),
        ...queueConversations.map((id) => ({ id, type: "conversation" }))
      ];
      return new Response(JSON.stringify({
        success: true,
        runId: syncRun.id,
        totalCount: queueItems.length,
        remainingCount: queueItems.length,
        queue: queueItems
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    if (action === "process_mente_sync_item") {
      const { runId, item } = body;
      if (!runId || !item || !item.id || !item.type) {
        return new Response(JSON.stringify({ error: "runId and item {id, type} are required." }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      const openrouterApiKey2 = Deno.env.get("OPENROUTER_API_KEY");
      if (!openrouterApiKey2) {
        return new Response(JSON.stringify({ error: "OPENROUTER_API_KEY no esta configurado en Supabase." }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      const profile2 = await fetchUserProfile(supabaseUrl, supabaseServiceKey, userId);
      const originalCtx = profile2?.contexto_terapeutico || {};
      const syncRun = originalCtx.sync_run;
      if (!syncRun || syncRun.id !== runId || syncRun.status !== "active") {
        return new Response(JSON.stringify({ error: "Sincronizacion no encontrada o inactiva." }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      if (!syncRun.processed_sources) syncRun.processed_sources = [];
      if (!syncRun.processed_conversations) syncRun.processed_conversations = [];
      if (!syncRun.error_sources) syncRun.error_sources = [];
      if (!syncRun.error_conversations) syncRun.error_conversations = [];
      if (!syncRun.errors) syncRun.errors = [];
      let itemName = "Elemento";
      let errorOccurred = false;
      let errorMessage = "";
      try {
        if (item.type === "source") {
          const srcRes = await fetch(`${supabaseUrl}/rest/v1/mente_sources?id=eq.${item.id}`, {
            headers: {
              "apikey": supabaseServiceKey,
              "Authorization": `Bearer ${supabaseServiceKey}`,
              "Accept": "application/json"
            }
          });
          const srcList = srcRes.ok ? await srcRes.json() : [];
          const src = srcList[0];
          if (!src) throw new Error("Fuente no encontrada.");
          itemName = src.name || "Documento";
          console.log(`[mente-sync] item:start source: ${itemName}`);
          const cleanText = await getSourceTextForSync(src, supabaseUrl, supabaseServiceKey, openrouterApiKey2);
          await patchRestRecord(supabaseUrl, supabaseServiceKey, "mente_sources", item.id, {
            sync_status: "analyzed",
            processed: true,
            analyzed_at: (/* @__PURE__ */ new Date()).toISOString(),
            analysis_run_id: runId,
            extraction_error: null
          });
          syncRun.processed_sources = uniqueStringList([...syncRun.processed_sources, item.id]);
          console.log(`[mente-sync] item:success source: ${itemName} chars: ${cleanText.length}`);
        } else if (item.type === "conversation") {
          const convRes = await fetch(`${supabaseUrl}/rest/v1/conversations?id=eq.${item.id}`, {
            headers: {
              "apikey": supabaseServiceKey,
              "Authorization": `Bearer ${supabaseServiceKey}`,
              "Accept": "application/json"
            }
          });
          const convList = convRes.ok ? await convRes.json() : [];
          const conv = convList[0];
          if (!conv) throw new Error("Conversacion no encontrada.");
          itemName = conv.title || "Sesion de Chat";
          console.log(`[mente-sync] item:start conversation: ${itemName}`);
          const dbMessages = await fetchConversationMessages(supabaseUrl, supabaseServiceKey, conv.id);
          const conversationText = buildConversationContextText(conv, dbMessages, isOwner);
          if (!conversationText.trim()) throw new Error("La sesion no contiene texto util.");
          await patchRestRecord(supabaseUrl, supabaseServiceKey, "conversations", item.id, {
            context_sync_status: "analyzed",
            context_synced_at: (/* @__PURE__ */ new Date()).toISOString(),
            context_sync_run_id: runId
          });
          syncRun.processed_conversations = uniqueStringList([...syncRun.processed_conversations, item.id]);
          console.log(`[mente-sync] item:success conversation: ${itemName}`);
        } else {
          throw new Error("Tipo de item desconocido: " + item.type);
        }
      } catch (err) {
        errorOccurred = true;
        errorMessage = err.message || String(err);
        console.error(`[mente-sync] item:error ${item.id}:`, errorMessage);
        syncRun.errors.push({ id: item.id, name: itemName, type: item.type, error: errorMessage });
        if (item.type === "source") {
          syncRun.error_sources = uniqueStringList([...syncRun.error_sources, item.id]);
          try {
            await patchRestRecord(supabaseUrl, supabaseServiceKey, "mente_sources", item.id, {
              sync_status: "error",
              analysis_run_id: runId,
              extraction_status: "error",
              extraction_error: errorMessage
            });
          } catch (patchErr) {
            console.error("Error marking source error:", patchErr.message);
          }
        } else {
          syncRun.error_conversations = uniqueStringList([...syncRun.error_conversations, item.id]);
          try {
            await patchRestRecord(supabaseUrl, supabaseServiceKey, "conversations", item.id, {
              context_sync_status: "error",
              context_sync_run_id: runId
            });
          } catch (patchErr) {
            console.error("Error marking conversation error:", patchErr.message);
          }
        }
      }
      await saveUserProfileContext(supabaseUrl, supabaseServiceKey, userId, {
        ...stripSyncRun(originalCtx),
        sync_run: syncRun
      });
      const totalQueuedCount = (syncRun.queue_sources || []).length + (syncRun.queue_conversations || []).length;
      const totalProcessedCount = (syncRun.processed_sources || []).length + (syncRun.error_sources || []).length + (syncRun.processed_conversations || []).length + (syncRun.error_conversations || []).length;
      const remainingCount = Math.max(0, totalQueuedCount - totalProcessedCount);
      return new Response(JSON.stringify({
        success: !errorOccurred,
        processedItem: { id: item.id, name: itemName, type: item.type },
        error: errorOccurred ? errorMessage : null,
        remainingCount,
        totalCount: totalQueuedCount
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    if (action === "consolidate_mente_sync") {
      const { runId } = body;
      if (!runId) {
        return new Response(JSON.stringify({ error: "runId is required." }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      const openrouterApiKey2 = Deno.env.get("OPENROUTER_API_KEY");
      if (!openrouterApiKey2) {
        return new Response(JSON.stringify({ error: "OPENROUTER_API_KEY no esta configurado en Supabase." }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      const [sources, profile2, resConvs] = await Promise.all([
        fetchMenteSources(supabaseUrl, supabaseServiceKey, userId),
        fetchUserProfile(supabaseUrl, supabaseServiceKey, userId),
        fetch(`${supabaseUrl}/rest/v1/conversations?user_id=eq.${userId}&status=eq.completed`, {
          headers: {
            "apikey": supabaseServiceKey,
            "Authorization": `Bearer ${supabaseServiceKey}`,
            "Accept": "application/json"
          }
        }).then((res) => res.ok ? res.json() : [])
      ]);
      const originalCtx = profile2?.contexto_terapeutico || {};
      const syncRun = originalCtx.sync_run;
      if (!syncRun || syncRun.id !== runId) {
        return new Response(JSON.stringify({ error: "Sincronizacion no encontrada." }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      const stableCtx = stripSyncRun(originalCtx);
      const baseCtx = normalizeMenteContext(syncRun.draft_context || (syncRun.mode === "complete" ? createEmptyMenteContext() : stableCtx));
      const sourceById = new Map((sources || []).map((src) => [src.id, src]));
      const convById = new Map((resConvs || []).map((conv) => [conv.id, conv]));
      const textContents = [];
      const processedSourcesIds = syncRun.processed_sources || [];
      const processedConversationsIds = syncRun.processed_conversations || [];
      for (const id of processedSourcesIds) {
        const src = sourceById.get(id);
        if (src) {
          const cleanText = src.extracted_text || src.text_content || "";
          textContents.push(`[DOCUMENTO/NOTA del ${new Date(src.created_at).toLocaleDateString("es-ES")}] "${src.name}":
"""
${cleanText}
"""`);
        }
      }
      for (const id of processedConversationsIds) {
        const conv = convById.get(id);
        if (conv) {
          const dbMessages = await fetchConversationMessages(supabaseUrl, supabaseServiceKey, conv.id);
          const conversationText = buildConversationContextText(conv, dbMessages, isOwner);
          if (conversationText.trim()) {
            textContents.push(`[SESION DE CHAT del ${new Date(conv.closed_at || conv.updated_at).toLocaleDateString("es-ES")}] Titulo: "${conv.title}":
"""
${conversationText}
"""`);
          }
        }
      }
      const unifiedTextContext = textContents.join("\n\n---\n\n");
      let finalCtx = baseCtx;
      if (unifiedTextContext.trim()) {
        const ownerSyncPrompt = `Como Walter, psicologo y asesor de rendimiento/trading de Josfer, consolida una base psicologica estable usando exclusivamente los documentos, notas y sesiones cerradas aportadas por este usuario.

INFORMACION DISPONIBLE:
1. Mapa consolidado actual o borrador de esta sincronizacion:
${JSON.stringify({
          contexto_base: baseCtx.contexto_base,
          foto_persona: baseCtx.foto_persona,
          evoluciones: baseCtx.evoluciones,
          conclusiones: baseCtx.conclusiones,
          compromisos: baseCtx.compromisos,
          pautas_accion: baseCtx.pautas_accion,
          fuentes_ayuda: baseCtx.fuentes_ayuda,
          temas: baseCtx.temas,
          procesados: baseCtx.procesados
        })}

2. NUEVO LOTE CRONOLOGICO A INTEGRAR:
${unifiedTextContext}

TU TAREA:
Integra el lote nuevo en el mapa existente sin perder lo anterior. Las sesiones cerradas y los documentos tienen el mismo peso para enriquecer el eje cronologico, temas, conclusiones, compromisos, pautas y fuentes de ayuda.
No inventes datos: si algo no aparece en documentos o sesiones, no lo introduzcas.

Devuelve un objeto JSON con el siguiente esquema estricto:
{
  "contexto_base": {
    "diagnostico_inicial": "Hipotesis psicologica base organizada y prudente, basada solo en datos aportados.",
    "mecanismos_defensa": ["Patron o mecanismo observado con evidencia en los datos"]
  },
  "foto_persona": "Sintesis psicologica exhaustiva, depurada y actualizada de 400 a 700 palabras, basada solo en datos aportados.",
  "temas": [{"title": "Nombre corto del tema", "status": "active" | "closed" | "emerging", "description": "Descripcion del conflicto, patron o linea de trabajo"}],
  "conclusiones": ["Conclusion psicologica consolidada y basada en evidencia interna"],
  "compromisos": ["Compromiso o decision expresada por el usuario"],
  "pautas_accion": ["Pauta, ejercicio o solucion practica"],
  "fuentes_ayuda": ["Autor, libro, enfoque o fuente util vinculada a los temas detectados"],
  "nuevas_evoluciones": [{"fecha": "AAAA-MM-DD", "sesion_id": "ID de la sesion o documento si aparece", "titulo_sesion": "Titulo", "hecho_clinico": "Hecho, disparador, patron o tema principal", "analisis_evolutivo": "Analisis de 150 a 300 palabras", "pautas_y_compromisos": []}]
}

Instrucciones:
- Combina duplicados y conserva informacion previa valida.
- Optimiza listas a 8-12 elementos relevantes.
- Si el lote contiene documentos, crea hitos de evolucion con su fecha.
- El valor de "status" debe ser exactamente "active", "closed" o "emerging".
- Devuelve JSON valido. No uses markdown ni texto fuera del JSON.
- No uses saltos de linea reales dentro de cadenas; usa "\\n" si necesitas parrafos.

Devuelve UNICAMENTE el objeto JSON valido.`;
        const genericSyncPrompt = `Consolida y refina la memoria privada de un usuario integrando este lote cronologico de documentos, notas y sesiones cerradas.

INFORMACION DISPONIBLE:
1. Memoria consolidada actual:
${JSON.stringify({
          contexto_base: baseCtx.contexto_base,
          foto_persona: baseCtx.foto_persona,
          evoluciones: baseCtx.evoluciones,
          conclusiones: baseCtx.conclusiones,
          compromisos: baseCtx.compromisos,
          pautas_accion: baseCtx.pautas_accion,
          fuentes_ayuda: baseCtx.fuentes_ayuda,
          temas: baseCtx.temas,
          procesados: baseCtx.procesados
        })}

2. NUEVO LOTE A INTEGRAR:
${unifiedTextContext}

Devuelve un objeto JSON valido con este esquema:
{
  "contexto_base": {"diagnostico_inicial": "Hipotesis base prudente", "mecanismos_defensa": []},
  "foto_persona": "Sintesis neutral de 250 a 450 palabras basada solo en los datos aportados por este usuario.",
  "temas": [{"title": "Nombre corto", "status": "active", "description": "Descripcion neutral"}],
  "conclusiones": ["Conclusion basada en datos del usuario"],
  "compromisos": ["Compromiso o decision expresada por el usuario"],
  "pautas_accion": ["Pauta practica neutral"],
  "fuentes_ayuda": ["Fuente, autor o enfoque util si procede"],
  "nuevas_evoluciones": [{"fecha": "AAAA-MM-DD", "sesion_id": "", "titulo_sesion": "Titulo", "hecho_clinico": "Hecho o tema tratado", "analisis_evolutivo": "Analisis neutral", "pautas_y_compromisos": []}]
}

IMPORTANTE: No menciones nombres, entidades, deuda, trading, herramientas externas ni datos privados que no esten literalmente en el lote de este usuario. No inventes diagnosticos. Devuelve unicamente JSON valido.`;
        const syncPrompt = isOwner ? ownerSyncPrompt : genericSyncPrompt;
        let consolidatedProfile = null;
        let lastErrorMessage = "";
        try {
          console.log(`[mente-sync] Calling callOpenRouter with ${TEXT_MODEL}...`);
          const replyText2 = await callOpenRouter(
            TEXT_MODEL,
            [{ role: "user", content: syncPrompt }],
            0.3,
            true,
            8e4,
            openrouterApiKey2
          );
          if (replyText2) {
            const sanitizedJson = cleanJsonString(replyText2);
            try {
              consolidatedProfile = JSON.parse(sanitizedJson);
            } catch (jsonErr) {
              console.error("Failed to parse consolidated JSON using standard JSON.parse, using regex fallback:", jsonErr.message);
              try {
                consolidatedProfile = extractJSONFieldsFallback(replyText2);
              } catch (fallbackErr) {
                lastErrorMessage = `Error al parsear el JSON incluso con extractor fallback: ${fallbackErr.message}`;
                console.error(lastErrorMessage);
              }
            }
          } else {
            lastErrorMessage = "OpenRouter retorno una respuesta vacia.";
          }
        } catch (err) {
          lastErrorMessage = err.message || String(err);
          console.error("Error synthesizing Mente profile with callOpenRouter:", lastErrorMessage);
        }
        if (!consolidatedProfile) {
          return new Response(JSON.stringify({ error: `Fallo al generar la sintesis de Mente. Detalles: ${lastErrorMessage}` }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }
        const nuevasEvs = Array.isArray(consolidatedProfile.nuevas_evoluciones) ? consolidatedProfile.nuevas_evoluciones : [];
        const conclusions = uniqueStringList(consolidatedProfile.conclusiones);
        const commitments = uniqueStringList(consolidatedProfile.compromisos);
        const actions2 = uniqueStringList(consolidatedProfile.pautas_accion);
        const resources = uniqueStringList(consolidatedProfile.fuentes_ayuda);
        finalCtx = normalizeMenteContext({
          ...baseCtx,
          contexto_base: consolidatedProfile.contexto_base || baseCtx.contexto_base,
          foto_persona: consolidatedProfile.foto_persona || baseCtx.foto_persona,
          conclusiones: conclusions.length > 0 ? conclusions : baseCtx.conclusiones,
          compromisos: commitments.length > 0 ? commitments : baseCtx.compromisos,
          pautas_accion: actions2.length > 0 ? actions2 : baseCtx.pautas_accion,
          fuentes_ayuda: resources.length > 0 ? resources : baseCtx.fuentes_ayuda,
          temas: Array.isArray(consolidatedProfile.temas) && consolidatedProfile.temas.length > 0 ? consolidatedProfile.temas : baseCtx.temas,
          evoluciones: mergeEvoluciones(nuevasEvs, baseCtx.evoluciones),
          procesados: {
            sources: uniqueStringList([...baseCtx.procesados.sources, ...processedSourcesIds]),
            conversations: uniqueStringList([...baseCtx.procesados.conversations, ...processedConversationsIds])
          }
        });
      }
      const finalCleanCtx = stripSyncRun(finalCtx);
      await saveUserProfileContext(supabaseUrl, supabaseServiceKey, userId, finalCleanCtx);
      return new Response(JSON.stringify({
        success: true,
        data: finalCleanCtx,
        message: "Consolidacion de Mente finalizada con exito."
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    if (action === "transcribe_audio") {
      const { audio } = body;
      if (!audio) {
        return new Response(JSON.stringify({ error: "Par\xE1metro 'audio' requerido en formato Base64." }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
      if (!geminiApiKey) {
        return new Response(JSON.stringify({ error: "GEMINI_API_KEY no está configurado en las variables de entorno de Supabase." }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      const credits = await fetchUserCredits(supabaseUrl, supabaseServiceKey, userId);
      if (credits && credits.text_credits_used >= credits.text_credits_total) {
        return new Response(JSON.stringify({
          error: "Has consumido el cupo de chat de tu plan mensual. Tu racha no se perderá.",
          creditsExceeded: true,
          credits: {
            text_credits_total: credits.text_credits_total,
            text_credits_used: credits.text_credits_used,
            live_credits_total: credits.live_credits_total,
            live_credits_used: credits.live_credits_used,
            document_credits_total: credits.document_credits_total,
            document_credits_used: credits.document_credits_used
          }
        }), {
          status: 402, // Payment Required
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      let base64Data = audio;
      let mimeType = "audio/webm";
      if (audio.includes("base64,")) {
        const parts = audio.split("base64,");
        base64Data = parts[1];
        const matchMime = parts[0].match(/data:([^;]+);/);
        if (matchMime) {
          mimeType = matchMime[1];
        }
      }
      const prompt = "Transcribe y organiza de forma limpia, legible, bien puntuada y coherente el siguiente audio en español. Mantén el tono literal pero corrige errores de pronunciación o muletillas obvias. Devuelve únicamente el texto de la transcripción, sin introducciones, explicaciones, ni marcas adicionales (como comillas o tags).";
      let transcription = "";
      let lastErrorMessage = "";
      let tokensUsed = 0;
      try {
        const geminiPayload = {
          contents: [{
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType: mimeType,
                  data: base64Data.trim()
                }
              }
            ]
          }],
          generationConfig: {
            temperature: 0.1
          }
        };
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-live-preview:generateContent?key=${geminiApiKey}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(geminiPayload)
        });
        if (res.ok) {
          const json2 = await res.json();
          transcription = json2.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
          tokensUsed = json2.usageMetadata?.totalTokenCount || Math.ceil((transcription.length + audio.length) / 4);
        } else {
          const errText = await res.text();
          lastErrorMessage = `API de Google Gemini devolvió error ${res.status}: ${errText}`;
          console.error(lastErrorMessage);
        }
      } catch (err) {
        lastErrorMessage = `Excepción al llamar al modelo para transcripción: ${err.message}`;
        console.error(lastErrorMessage);
      }
      if (!transcription) {
        return new Response(JSON.stringify({ error: `Fallo al transcribir el audio. Detalles: ${lastErrorMessage || "Respuesta vacía del modelo."}` }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      let updatedCredits = null;
      if (tokensUsed > 0) {
        updatedCredits = await updateUserTextCredits(supabaseUrl, supabaseServiceKey, userId, tokensUsed);
      }
      return new Response(JSON.stringify({
        success: true,
        transcription,
        tokensUsed,
        credits: updatedCredits ? {
          text_credits_total: updatedCredits.text_credits_total,
          text_credits_used: updatedCredits.text_credits_used,
          live_credits_total: updatedCredits.live_credits_total,
          live_credits_used: updatedCredits.live_credits_used,
          document_credits_total: updatedCredits.document_credits_total,
          document_credits_used: updatedCredits.document_credits_used,
          cycle_start_date: updatedCredits.cycle_start_date,
          cycle_end_date: updatedCredits.cycle_end_date
        } : (credits ? {
          text_credits_total: credits.text_credits_total,
          text_credits_used: credits.text_credits_used,
          live_credits_total: credits.live_credits_total,
          live_credits_used: credits.live_credits_used,
          document_credits_total: credits.document_credits_total,
          document_credits_used: credits.document_credits_used,
          cycle_start_date: credits.cycle_start_date,
          cycle_end_date: credits.cycle_end_date
        } : null)
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "Invalid body: messages array required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    if (conversationId) {
      const conversationOwnerId = await fetchConversationUserId(supabaseUrl, supabaseServiceKey, conversationId);
      if (conversationOwnerId !== userId) {
        return new Response(JSON.stringify({ error: "Conversation does not belong to this user." }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
    }

    // Validar créditos del paciente (Texto)
    const credits = await fetchUserCredits(supabaseUrl, supabaseServiceKey, userId);
    if (credits) {
      if (credits.text_credits_used >= credits.text_credits_total) {
        return new Response(JSON.stringify({
          error: "Has consumido el cupo de chat de tu plan semanal. Tu racha no se perderá.",
          creditsExceeded: true,
          credits: {
            text_credits_total: credits.text_credits_total,
            text_credits_used: credits.text_credits_used,
            live_credits_total: credits.live_credits_total,
            live_credits_used: credits.live_credits_used
          }
        }), {
          status: 402, // Payment Required
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
    }
    
    let updatedCredits = null;
    const [profile, conversationTitle, recentMoods, menteSources, clinicalMemory] = await Promise.all([
      fetchUserProfile(supabaseUrl, supabaseServiceKey, userId),
      conversationId ? fetchConversationTitle(supabaseUrl, supabaseServiceKey, conversationId) : Promise.resolve(""),
      fetchRecentMoods(supabaseUrl, supabaseServiceKey, userId),
      fetchMenteSources(supabaseUrl, supabaseServiceKey, userId),
      fetchClinicalMemory(supabaseUrl, supabaseServiceKey, userId)
    ]);
    const openrouterApiKey = Deno.env.get("OPENROUTER_API_KEY");
    if (!openrouterApiKey) {
      return new Response(JSON.stringify({ error: "OPENROUTER_API_KEY no est\xE1 configurado en las variables de entorno de Supabase." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    const ownerDisplayName = isOwner ? "Josfer" : "el usuario";
    const dynamicDataLabel = isOwner ? "[DATOS DIN\xC1MICOS DEL USUARIO PROPIETARIO Y MERCADOS EN TIEMPO REAL]" : "[DATOS PRIVADOS DEL USUARIO ACTUAL]";
    const currentDateStr = (/* @__PURE__ */ new Date()).toLocaleDateString("es-ES", { timeZone: "Europe/Madrid", year: "numeric", month: "long", day: "numeric" });
    let auditPrompt = `--- FECHA DE LA SESI\xD3N DE HOY ---
Fecha: ${currentDateStr}

`;
    if (conversationTitle) {
      auditPrompt += `--- TEMA O T\xCDTULO DE LA SESI\xD3N ACTUAL (MARCADO POR EL USUARIO) ---
El tema principal y la pauta sobre la que ${ownerDisplayName} quiere hablar hoy es: "${conversationTitle}".
Debes adaptar estrictamente el 100% de tu foco a este tema y a la pauta que el usuario te plantee en su mensaje, incluso si es cr\xEDtico o muy t\xE9cnico. No desv\xEDes la conversaci\xF3n a otros temas ni saques conclusiones de la memoria general a menos que el usuario los conecte expl\xEDcitamente en el texto.

`;
    }
    if (clinicalMemory?.prompt) {
      auditPrompt += `

${clinicalMemory.prompt}
`;
    }
    if (currentMood) {
      auditPrompt += `

--- REGISTRO DIARIO ACTUAL (HOY) ---
- Nivel interno 1: ${currentMood.anxiety_level ?? "N/A"}/10, Nivel interno 2: ${currentMood.impulsivity_level ?? "N/A"}/10.
- Notas del diario: "${currentMood.notes ?? "Sin notas"}".`;
    }
    const defaultCtx = { foto_persona: "No hay mapa consolidado a\xFAn.", temas: [] };
    const userCtx = profile?.contexto_terapeutico || defaultCtx;
    auditPrompt += `

--- MAPA PSICOL\xD3GICO Y SITUACI\xF3N ACTUAL (RESUMEN DE MENTE) ---
S\xEDntesis del mapa consolidado del usuario:
${userCtx.foto_persona || "No hay mapa consolidado a\xFAn."}

Temas terap\xE9uticos vigentes en seguimiento:
`;
    if (userCtx.temas && Array.isArray(userCtx.temas)) {
      const activeTemas = userCtx.temas.filter((t) => t.status === "active" || t.status === "emerging");
      if (activeTemas.length > 0) {
        activeTemas.forEach((t) => {
          auditPrompt += `- ${t.title} (${t.status}): ${t.description}
`;
        });
      } else {
        auditPrompt += `- No hay temas activos ni emergentes registrados en este momento.
`;
      }
    }
    const personalSystemInstruction = `Eres Walter, asistente privado de Josfer en psicolog\xEDa, rendimiento y bienestar emocional. Tu prioridad es psicol\xF3gica: investigar paso a paso lo que ocurre, ordenar el contexto y proponer pautas pr\xE1cticas de regulaci\xF3n emocional y mental. Usa solo la memoria y los datos din\xE1micos inyectados; no trates ning\xFAn dato hist\xF3rico como fijo si no aparece en esos datos.

REGLA FUNDAMENTAL DE TRATO Y DIN\xC1MICA DE CHAT (MANDATORIA):
- **Foco estricto en el tema de la sesi\xF3n (CR\xCDTICO):** No saques a relucir datos sensibles del pasado de forma no solicitada en tus respuestas ordinarias de chat. Mant\xE9n el chat enfocado de forma pr\xE1ctica, objetiva y directa sobre el tema espec\xEDfico que se est\xE1 tratando en la sesi\xF3n activa. La memoria general ya est\xE1 disponible en el panel derecho de Mente; no la repitas ni la lectures en tus contestaciones de chat a menos que el usuario la mencione directamente o sea el tema central de la sesi\xF3n.
- **Formato ultra-visual y legible (MANDATORIO):** Para que tus intervenciones entren con mayor facilidad, estructura tus respuestas de manera altamente visual. Utiliza saltos de l\xEDnea frecuentes (p\xE1rrafos de m\xE1ximo 2-3 l\xEDneas), negritas ('**texto**') para destacar ideas clave, vi\xF1etas limpias para listas de pautas o reflexiones, y bloques de cita ('>') para validaciones emocionales. Utiliza iconos y emojis de forma elegante para separar ideas (ej. \u{1F9E0}, \u{1F4A1}, \u{1F6E1}\uFE0F). Evita bloques monol\xEDticos de texto.
- **Explicaciones desarrolladas y estructuradas:** Tus respuestas deben ser detalladas, explicativas y m\xE1s desarrolladas (entre 180 y 300 palabras). Debes aportar explicaciones claras, reflexiones profundas y desarrollar tus ideas para dar contexto y claridad, sin ser excesivamente conciso, pero manteniendo el hilo estructurado y centrado.
- **Estructura de Organizaci\xF3n (OBLIGATORIA al investigar, concluir o proponer soluciones):** Si el usuario solicita "investigar contexto", "extraer conclusiones" o "posibles soluciones" (mediante los botones o expl\xEDcitamente), debes comenzar obligatoriamente tu respuesta con el bloque estructurado **[Filtro de Organizaci\xF3n]** que contenga la fecha de la sesi\xF3n y el tema o temas tratados en forma de lista.
  Ejemplo de cabecera obligatoria al inicio de la respuesta:
  **[Filtro de Organizaci\xF3n]**
  - **Fecha:** [Fecha actual de la sesi\xF3n]
  - **Temas Tratados:** [Tema 1], [Tema 2]
  ---
  (A continuaci\xF3n, desarrolla tu respuesta explicativa detalladamente...)
- **M\xE9todo de investigaci\xF3n: Indagar antes de concluir:** No des por sentado un diagn\xF3stico ni saques conclusiones apresuradas. Valida la emoci\xF3n del usuario brevemente (1 o 2 frases con empat\xEDa real, ej: "Te leo y ese peso es real...") y pasa a hacer preguntas abiertas y socr\xE1ticas para recopilar informaci\xF3n sobre lo que piensa y siente en este momento. No intentes solucionar todo en cada respuesta. Primero indaga y recopila informaci\xF3n.
- **Hacerlo paso a paso:** Deja que el usuario elabore el hilo de la conversaci\xF3n respondiendo a tus preguntas. Cierra siempre tu intervenci\xF3n con una o m\xE1ximo dos preguntas claras y dirigidas que inviten a la autoreflexi\xF3n.
- **Escucha activa y adaptaci\xF3n al tema/t\xEDtulo:** El usuario marca la pauta de lo que quiere trabajar mediante el t\xEDtulo de la sesi\xF3n o el texto de su mensaje. Ad\xE1ptate estrictamente a ese tema. Si abre un tema del pasado o de su historia de forma expl\xEDcita, indaga y desarr\xF3llalo mediante preguntas precisas, evitando sermones.

Tu rol es:
1. PSIC\xD3LOGO DE RENDIMIENTO Y BIENESTAR:
   - Trato de Espa\xF1a (t\xFA), asertivo, cl\xEDnico, emp\xE1tico y centrado en el proceso.
   - Regula el estado de \xE1nimo y prescribe 'Reset de Am\xEDgdala' en momentos de estr\xE9s o alta activaci\xF3n emocional.
   - No menciones teor\xEDas densas ni etiquetas cl\xEDnicas cerradas a menos que el usuario te lo pida expl\xEDcitamente. Valida cient\xEDficamente solo de manera breve y en una sola frase cuando mencione un bloqueo profundo.

2. SISTEMA DE ACTUALIZACI\xF3N DE MEMORIA:
   - Si acord\xE1is un compromiso, identificas una conclusi\xF3n clave o prescribe una pauta, a\xF1ade obligatoriamente:
     <update_context>
     {
       "conclusiones": ["Conclusi\xF3n concisa sobre su patr\xF3n actual"],
       "compromisos": ["Compromiso de bienestar acordado"],
       "pautas_accion": ["Pauta de reset conductual prescrita"]
     }
     </update_context>

3. CAMBIO AG\xC9NTICO DE T\xCDTULO:
   - Si el tema cambia sustancialmente, emite <update_title>Nuevo T\xEDtulo Sugerido</update_title> y pregunta si el usuario est\xE1 de acuerdo con el cambio de t\xEDtulo.`;
    const cleanedMessages = [];
    let lastContent = "";
    let lastRole = "";
    for (const msg of messages) {
      if (!msg || !msg.content) continue;
      let content = msg.content.trim();
      content = content.replace(/Error al conectar con Walter:[\s\S]*/gi, "").trim();
      content = content.replace(/Edge Function returned a non-2xx[\s\S]*/gi, "").trim();
      if (!content) continue;
      if (content === lastContent && msg.role === lastRole) {
        continue;
      }
      cleanedMessages.push({
        role: msg.role,
        content,
        image: msg.image
      });
      lastContent = content;
      lastRole = msg.role;
    }
    const MAX_HISTORY_MESSAGES = 15;
    const recentMessages = cleanedMessages.slice(-MAX_HISTORY_MESSAGES);
    const genericSystemInstruction = `Eres IA Áncora, asistente clínico conversacional de apoyo psicológico. Actúas como un psicólogo junior/asistente experto: escuchas, regulas, ordenas información y preparas material útil para el psicólogo humano. No diagnosticas, no prescribes y no sustituyes una sesión clínica.

MEMORIA Y CONTEXTO:
- Tienes acceso a la memoria clínica inyectada en este prompt: documentos subidos, resúmenes de extracción, propuestas pendientes, hechos aceptados, riesgos, citas y conversaciones previas.
- Si el usuario pregunta si ves su historial, responde con precisión: sí puedes ver el material persistido que aparece en la memoria inyectada. Menciona brevemente qué tipo de material hay, sin volcar datos sensibles completos de golpe.
- No digas "no tengo acceso a historial/documentos" si la sección MEMORIA CLINICA PERSISTENTE contiene datos.
- Si un dato está en propuestas pendientes, dilo como "dato pendiente de revisión", no como verdad clínica consolidada.
- Usa citas literales solo en fragmentos breves cuando ayuden a preparar la revisión con el psicólogo.

REGLAS DE TRIAJE CLÍNICO (PHQ-9 y GAD-7) - MANDATORIO:
- **Investigación Emocional Camuflada:** Debes evaluar el nivel de depresión (PHQ-9, escala de 0 a 27) y ansiedad (GAD-7, escala de 0 a 21) a través de preguntas naturales en el chat. No menciones explícitamente "PHQ-9" o "GAD-7" ni enumeres reactivos de manera fría. Pregunta de forma progresiva sobre placer en las cosas, dificultades para dormir, nerviosismo, preocupación constante, etc., integrándolo de manera cálida en la conversación.
- **Paso a Paso:** Haz una o dos preguntas como máximo por respuesta. Valida la emoción del paciente con empatía real y permítele responder.
- **Conclusión de Triaje:** Cuando consideres que tienes suficiente información sobre el estado del paciente (usualmente tras 4-6 intercambios significativos), realiza una evaluación interna mental y emite una conclusión formal utilizando la etiqueta <update_context>. Debe incluir obligatoriamente el texto "Triaje" y la puntuación de ambas escalas junto con la clasificación de riesgo (Riesgo Leve, Riesgo Moderado o Riesgo Grave).
  Ejemplo exacto de formato de actualización:
  <update_context>
  {
    "conclusiones": ["Triaje inicial completado: Ansiedad GAD-7 = [puntuación], Depresión PHQ-9 = [puntuación]. Clasificación: [Riesgo Leve / Riesgo Moderado / Riesgo Grave]."],
    "pautas_accion": ["Pauta inicial recomendada según nivel de riesgo."]
  }
  </update_context>
- **Derivación de Emergencia:** Si identificas ideación suicida o riesgo inminente de autolisis (Riesgo Grave / Crítico), debes alertar de forma muy clara sobre el número de emergencia 024 (en España) o la Línea de la Esperanza, e invitar al usuario a buscar apoyo médico de urgencia inmediato.

REGLAS GENERALES:
- Usa únicamente los datos de la conversación, el diario y la memoria privada inyectada para este usuario.
- No asumas deudas, trading ni datos privados del usuario propietario (Josfer/Emilio). Concéntrate en el usuario nuevo.
- Mantén un tono empático, seguro, asertivo y paso a paso.
- Tu objetivo principal no es dar sermones: es sostener el momento, sacar información clínicamente útil y dejar 1-2 preguntas claras para revisión o seguimiento.
- Si detectas mal momento, empieza por regulación breve: respiración, orientación, bajar activación, contacto con apoyo o crisis si procede.`;
    const systemInstruction = isOwner ? personalSystemInstruction : genericSystemInstruction;
    let replyText = "";
    const openrouterPayload = {
      model: TEXT_MODEL,
      messages: [
        { role: "system", content: `${systemInstruction}

${dynamicDataLabel}
${auditPrompt}` },
        ...recentMessages.map((msg) => {
          if (msg.image) {
            const base64Raw = msg.image;
            const base64Data = base64Raw.includes(",") ? base64Raw.split(",")[1] : base64Raw;
            let mimeType = "image/png";
            if (base64Raw.startsWith("data:")) {
              const mimeMatch = base64Raw.match(/data:([^;]+);/);
              if (mimeMatch) mimeType = mimeMatch[1];
            }
            return {
              role: msg.role === "assistant" ? "assistant" : "user",
              content: [
                { type: "text", text: msg.content || "" },
                {
                  type: "image_url",
                  image_url: {
                    url: `data:${mimeType};base64,${base64Data.trim()}`
                  }
                }
              ]
            };
          }
          return {
            role: msg.role === "assistant" ? "assistant" : "user",
            content: msg.content || ""
          };
        })
      ],
      temperature: 0.7,
      max_tokens: 4e3
    };
    const openrouterUrl = "https://openrouter.ai/api/v1/chat/completions";
    const response = await fetch(openrouterUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openrouterApiKey}`,
        "HTTP-Referer": "https://supabase.co",
        "X-Title": "Walter Survival Portal"
      },
      body: JSON.stringify(openrouterPayload)
    });
    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`OpenRouter API HTTP error ${response.status}: ${errText}`);
    }
    const json = await response.json();
    replyText = json.choices?.[0]?.message?.content || "";
    
    const promptTokens = json.usage?.prompt_tokens || 0;
    const completionTokens = json.usage?.completion_tokens || 0;
    const cacheTokens = json.usage?.prompt_tokens_details?.cached || json.usage?.cache_read_input_tokens || 0;

    // Descontar tokens del crédito del paciente
    let tokensUsed = json.usage?.total_tokens || (Math.ceil(replyText.length / 4) + Math.ceil(messages.reduce((acc, m) => acc + (m.content || "").length, 0) / 4));
    tokensUsed = Math.ceil(tokensUsed);
    updatedCredits = await updateUserTextCredits(supabaseUrl, supabaseServiceKey, userId, tokensUsed);

    if (!replyText) {
      replyText = "No he podido generar una respuesta en este momento. Conc\xE9ntrate en tu respiraci\xF3n y cu\xEDdate.";
    }
    const actions = [];
    const actionRegex = /<execute_action>([\s\S]*?)<\/execute_action>/gi;
    let actionMatch;
    while ((actionMatch = actionRegex.exec(replyText)) !== null) {
      try {
        const actionJson = JSON.parse(actionMatch[1].trim());
        actions.push(actionJson);
      } catch (err) {
        console.error("Error parsing execute_action JSON:", err.message);
      }
    }
    let cleanReply = replyText.replace(actionRegex, "").trim();
    const contextRegex = /<update_context>([\s\S]*?)<\/update_context>/i;
    const match = cleanReply.match(contextRegex);
    let mergedCtx = null;
    if (match) {
      try {
        const extractedJson = JSON.parse(match[1].trim());
        const currentCtx = profile?.contexto_terapeutico || {
          contexto_base: { diagnostico_inicial: "", mecanismos_defensa: [] },
          evoluciones: [],
          conclusiones: [],
          compromisos: [],
          pautas_accion: [],
          fuentes_ayuda: [],
          foto_persona: "",
          temas: [],
          procesados: { sources: [], conversations: [] }
        };
        const mergeArrays = (arr1, arr2) => {
          const combined = [...arr1 || [], ...arr2 || []];
          return Array.from(new Set(combined.map((s) => String(s).trim()))).filter(Boolean);
        };
        mergedCtx = {
          ...currentCtx,
          conclusiones: mergeArrays(currentCtx.conclusiones, extractedJson.conclusiones),
          compromisos: mergeArrays(currentCtx.compromisos, extractedJson.compromisos),
          pautas_accion: mergeArrays(currentCtx.pautas_accion, extractedJson.pautas_accion),
          fuentes_ayuda: mergeArrays(currentCtx.fuentes_ayuda, extractedJson.fuentes_ayuda)
        };
        await saveUserProfileContext(supabaseUrl, supabaseServiceKey, userId, mergedCtx);
        console.log("Memory Context updated in Supabase.");
      } catch (err) {
        console.error("Error parsing/saving update_context JSON:", err.message);
      }
      cleanReply = cleanReply.replace(contextRegex, "").trim();
    }
    const titleRegex = /<update_title>([\s\S]*?)<\/update_title>/i;
    const titleMatch = cleanReply.match(titleRegex);
    let generatedTitle = null;
    if (titleMatch) {
      const suggestedTitle = titleMatch[1].trim();
      if (suggestedTitle && conversationId) {
        generatedTitle = suggestedTitle;
        await updateConversationTitle(supabaseUrl, supabaseServiceKey, conversationId, suggestedTitle);
        console.log(`Title updated agently: "${suggestedTitle}"`);
      }
      cleanReply = cleanReply.replace(titleRegex, "").trim();
    }
    const cachePercent = promptTokens > 0 ? Math.round((cacheTokens / promptTokens) * 100) : 0;
    const replyWithModel = `${cleanReply}\n\n[model:${TEXT_MODEL}][usage:${promptTokens}|${completionTokens}|${cachePercent}%]`;
    if (conversationId) {
      await saveMessageToDb(supabaseUrl, supabaseServiceKey, conversationId, "assistant", replyWithModel);
      await updateConversationTimestamp(supabaseUrl, supabaseServiceKey, conversationId);
      if (!generatedTitle) {
        const currentTitle = await fetchConversationTitle(supabaseUrl, supabaseServiceKey, conversationId);
        if (currentTitle === "Nueva Sesi\xF3n con Walter" || currentTitle === "Nueva Sesi\xF3n") {
          const firstUserMsg = messages.find((m) => m.role === "user")?.content || "";
          if (firstUserMsg) {
            generatedTitle = await generateConversationTitle(openrouterApiKey, firstUserMsg);
            await updateConversationTitle(supabaseUrl, supabaseServiceKey, conversationId, generatedTitle);
            console.log(`Generated title saved: "${generatedTitle}"`);
          }
        }
      }
    }
    return new Response(JSON.stringify({
      reply: replyWithModel,
      actions: isOwner ? actions : [],
      updatedContext: mergedCtx || userCtx,
      generatedTitle,
      tokensUsed,
      credits: updatedCredits ? {
        text_credits_total: updatedCredits.text_credits_total,
        text_credits_used: updatedCredits.text_credits_used,
        live_credits_total: updatedCredits.live_credits_total,
        live_credits_used: updatedCredits.live_credits_used,
        document_credits_total: updatedCredits.document_credits_total,
        document_credits_used: updatedCredits.document_credits_used,
        cycle_start_date: updatedCredits.cycle_start_date,
        cycle_end_date: updatedCredits.cycle_end_date
      } : null
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (e) {
    console.error("Edge Function error:", e.stack || e.message);
    return new Response(JSON.stringify({ error: e.stack || e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
