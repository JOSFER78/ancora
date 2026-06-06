// supabase/functions/chat-terapeuta/index.ts
import { unzipSync } from "https://esm.sh/fflate@0.8.2";
var corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};
var TEXT_MODEL = "deepseek/deepseek-v4-pro";
var EXTRACTION_MODEL = "google/gemini-2.5-flash";
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
async function getBingXSignature(queryString, apiSecret) {
  const encoder = new TextEncoder();
  const keyBuf = encoder.encode(apiSecret);
  const msgBuf = encoder.encode(queryString);
  const key = await crypto.subtle.importKey(
    "raw",
    keyBuf,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sigBuf = await crypto.subtle.sign("HMAC", key, msgBuf);
  return Array.from(new Uint8Array(sigBuf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
async function fetchBingXPositions(apiKey, apiSecret) {
  try {
    const timestamp = Date.now();
    const recvWindow = 5e3;
    const params = `recvWindow=${recvWindow}&timestamp=${timestamp}`;
    const signature = await getBingXSignature(params, apiSecret);
    const url = `https://open-api.bingx.com/openApi/swap/v2/user/positions?${params}&signature=${signature}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1200);
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "X-BX-APIKEY": apiKey,
        "Accept": "application/json"
      },
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`BingX positions HTTP error ${response.status}: ${errText}`);
    }
    const json = await response.json();
    return json.data || [];
  } catch (e) {
    console.error("Error fetching BingX positions:", e.message);
    return [];
  }
}
async function executeBingXOrder(apiKey, apiSecret, symbol, side, positionSide, quantity, type = "MARKET", price, stopPrice, reduceOnly = true) {
  try {
    const timestamp = Date.now();
    const recvWindow = 5e3;
    const paramObj = {
      symbol: symbol.toUpperCase(),
      side: side.toUpperCase(),
      positionSide: positionSide.toUpperCase(),
      type: type.toUpperCase(),
      reduceOnly: reduceOnly ? "true" : "false",
      quantity: quantity.toString(),
      recvWindow: recvWindow.toString(),
      timestamp: timestamp.toString()
    };
    if (price !== void 0 && price !== null) {
      paramObj.price = price.toString();
    }
    if (stopPrice !== void 0 && stopPrice !== null) {
      paramObj.stopPrice = stopPrice.toString();
    }
    const sortedQueryString = Object.keys(paramObj).sort().map((key) => `${key}=${encodeURIComponent(paramObj[key])}`).join("&");
    const signature = await getBingXSignature(sortedQueryString, apiSecret);
    const url = `https://open-api.bingx.com/openApi/swap/v2/trade/order?${sortedQueryString}&signature=${signature}`;
    console.log(`Executing BingX Order: POST ${url.replace(apiKey, "API_KEY").replace(signature, "SIGNATURE")}`);
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "X-BX-APIKEY": apiKey,
        "Accept": "application/json"
      }
    });
    if (!response.ok) {
      const errText = await response.text();
      return `Error HTTP de BingX (${response.status}): ${errText}`;
    }
    const json = await response.json();
    if (json.code === 0) {
      const orderId = json.data?.orderId || "Desconocido";
      return `\xC9xito. Orden ejecutada en BingX (${type}). ID de Orden: ${orderId}. S\xEDmbolo: ${symbol}, Cantidad: ${quantity}${price ? `, Precio: ${price}` : ""}${stopPrice ? `, StopPrice: ${stopPrice}` : ""}`;
    } else {
      return `Fallo en BingX (C\xF3digo ${json.code}): ${json.msg || "Error no especificado."}`;
    }
  } catch (e) {
    console.error("Error executing BingX order:", e.message);
    return `Error inesperado al enviar la orden a BingX: ${e.message}`;
  }
}
async function cancelBingXOpenOrders(apiKey, apiSecret, symbol) {
  try {
    const timestamp = Date.now();
    const recvWindow = 5e3;
    const paramObj = {
      symbol: symbol.toUpperCase(),
      recvWindow: recvWindow.toString(),
      timestamp: timestamp.toString()
    };
    const sortedQueryString = Object.keys(paramObj).sort().map((key) => `${key}=${encodeURIComponent(paramObj[key])}`).join("&");
    const signature = await getBingXSignature(sortedQueryString, apiSecret);
    const url = `https://open-api.bingx.com/openApi/swap/v2/trade/allOpenOrders?${sortedQueryString}&signature=${signature}`;
    console.log(`Cancelling all BingX open orders: DELETE ${url.replace(apiKey, "API_KEY").replace(signature, "SIGNATURE")}`);
    const response = await fetch(url, {
      method: "DELETE",
      headers: {
        "X-BX-APIKEY": apiKey,
        "Accept": "application/json"
      }
    });
    if (!response.ok) {
      const errText = await response.text();
      return `Error HTTP de BingX al cancelar \xF3rdenes (${response.status}): ${errText}`;
    }
    const json = await response.json();
    if (json.code === 0) {
      return `\xC9xito. Todas las \xF3rdenes pendientes para el par ${symbol} han sido canceladas en BingX.`;
    } else {
      return `Fallo al cancelar \xF3rdenes en BingX (C\xF3digo ${json.code}): ${json.msg || "Error no especificado."}`;
    }
  } catch (e) {
    console.error("Error cancelling BingX open orders:", e.message);
    return `Error inesperado al cancelar \xF3rdenes pendientes en BingX: ${e.message}`;
  }
}
async function fetchBingXBalance(apiKey, apiSecret) {
  try {
    const timestamp = Date.now();
    const recvWindow = 5e3;
    const params = `recvWindow=${recvWindow}&timestamp=${timestamp}`;
    const signature = await getBingXSignature(params, apiSecret);
    const url = `https://open-api.bingx.com/openApi/swap/v3/user/balance?${params}&signature=${signature}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1200);
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "X-BX-APIKEY": apiKey,
        "Accept": "application/json"
      },
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`BingX balance HTTP error ${response.status}: ${errText}`);
    }
    const json = await response.json();
    return json.data || null;
  } catch (e) {
    console.error("Error fetching BingX balance:", e.message);
    return null;
  }
}
async function fetchBingXHistoryOrders(apiKey, apiSecret) {
  try {
    const timestamp = Date.now();
    const recvWindow = 5e3;
    const limit = 100;
    const params = `limit=${limit}&recvWindow=${recvWindow}&timestamp=${timestamp}`;
    const signature = await getBingXSignature(params, apiSecret);
    const url = `https://open-api.bingx.com/openApi/swap/v2/user/historyOrders?${params}&signature=${signature}`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "X-BX-APIKEY": apiKey,
        "Accept": "application/json"
      }
    });
    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`BingX historyOrders HTTP error ${response.status}: ${errText}`);
    }
    const json = await response.json();
    return json.data || [];
  } catch (e) {
    console.error("Error fetching BingX history orders:", e.message);
    throw e;
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
async function fetchUserDebts(supabaseUrl, serviceKey, userId) {
  try {
    const url = `${supabaseUrl}/rest/v1/debts?user_id=eq.${userId}&order=priority.asc`;
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
async function fetchYahooHistory(ticker, interval = "15m", range = "2d") {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=${interval}&range=${range}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1e3);
    const resp = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    if (!resp.ok) return [];
    const data = await resp.json();
    const result = data?.chart?.result?.[0];
    if (!result) return [];
    const timestamps = result.timestamp || [];
    const quote = result.indicators?.quote?.[0] || {};
    const opens = quote.open || [];
    const highs = quote.high || [];
    const lows = quote.low || [];
    const closes = quote.close || [];
    const volumes = quote.volume || [];
    const candles = [];
    for (let i = 0; i < timestamps.length; i++) {
      if (opens[i] != null && closes[i] != null && highs[i] != null && lows[i] != null) {
        candles.push({
          time: timestamps[i],
          open: opens[i],
          high: highs[i],
          low: lows[i],
          close: closes[i],
          volume: volumes[i] || 0
        });
      }
    }
    return candles;
  } catch (err) {
    console.error(`Error fetching Yahoo History for ${ticker}:`, err.message);
    return [];
  }
}
function calculateEMA(prices, period) {
  if (prices.length < period) return [];
  const k = 2 / (period + 1);
  const ema = [];
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += prices[i];
  }
  let prevEma = sum / period;
  ema.push(prevEma);
  for (let i = period; i < prices.length; i++) {
    const val = prices[i] * k + prevEma * (1 - k);
    ema.push(val);
    prevEma = val;
  }
  return ema;
}
function calculateRSI(prices, period = 14) {
  if (prices.length <= period) return [];
  const rsi = [];
  const gains = [];
  const losses = [];
  for (let i = 1; i < prices.length; i++) {
    const diff = prices[i] - prices[i - 1];
    gains.push(diff > 0 ? diff : 0);
    losses.push(diff < 0 ? -diff : 0);
  }
  let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
  let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;
  let rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
  rsi.push(100 - 100 / (1 + rs));
  for (let i = period; i < prices.length - 1; i++) {
    avgGain = (avgGain * (period - 1) + gains[i]) / period;
    avgLoss = (avgLoss * (period - 1) + losses[i]) / period;
    rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    rsi.push(100 - 100 / (1 + rs));
  }
  return rsi;
}
function calculateBollingerBands(prices, period = 20, multiplier = 2) {
  const middle = [];
  const upper = [];
  const lower = [];
  for (let i = period - 1; i < prices.length; i++) {
    const slice = prices.slice(i - period + 1, i + 1);
    const sma = slice.reduce((a, b) => a + b, 0) / period;
    middle.push(sma);
    const variance = slice.reduce((a, b) => a + Math.pow(b - sma, 2), 0) / period;
    const stdDev = Math.sqrt(variance);
    upper.push(sma + multiplier * stdDev);
    lower.push(sma - multiplier * stdDev);
  }
  return { middle, upper, lower };
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
  return parts.join("\n\n");
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
    if (action === "debug_env") {
      return new Response(JSON.stringify({
        envKeys: Object.keys(Deno.env.toObject())
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    if (action === "sync_closed_trades") {
      if (!isOwner) {
        return new Response(JSON.stringify({ error: "M\xF3dulo de trading no disponible para este usuario." }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      const profile2 = await fetchUserProfile(supabaseUrl, supabaseServiceKey, userId);
      if (!profile2) {
        return new Response(JSON.stringify({ error: "Perfil no encontrado en Supabase." }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      if (!profile2.bingx_api_key || !profile2.bingx_api_secret) {
        return new Response(JSON.stringify({ error: "Configura las claves de API de BingX en Ajustes." }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      const historyOrders = await fetchBingXHistoryOrders(profile2.bingx_api_key, profile2.bingx_api_secret);
      const dailyPnL = {};
      for (const order of historyOrders) {
        if (order.status !== "FILLED") continue;
        const profitNum = parseFloat(order.realizedProfit || order.realizedPnl || order.profit || "0");
        if (profitNum === 0) continue;
        const time = order.updateTime || order.time;
        if (!time) continue;
        const date = new Date(time);
        const formatter = new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Madrid", year: "numeric", month: "2-digit", day: "2-digit" });
        const dateStr = formatter.format(date);
        if (!dailyPnL[dateStr]) {
          dailyPnL[dateStr] = { pnl: 0, trades: 0 };
        }
        dailyPnL[dateStr].pnl += profitNum;
        dailyPnL[dateStr].trades += 1;
      }
      const upsertData = Object.entries(dailyPnL).map(([dateStr, stats]) => {
        let status = "no_trade";
        if (stats.pnl > 0) status = "win";
        else if (stats.pnl < 0) status = "loss";
        return {
          user_id: userId,
          date: dateStr,
          pnl: stats.pnl,
          trades: stats.trades,
          status
        };
      });
      if (upsertData.length > 0) {
        await upsertJournalDays(supabaseUrl, supabaseServiceKey, userId, upsertData);
      }
      return new Response(JSON.stringify({ success: true, count: upsertData.length, data: upsertData }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    if (action === "get_bingx_data") {
      if (!isOwner) {
        return new Response(JSON.stringify({ error: "M\xF3dulo de trading no disponible para este usuario." }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      const profile2 = await fetchUserProfile(supabaseUrl, supabaseServiceKey, userId);
      if (!profile2) {
        return new Response(JSON.stringify({ error: "Perfil no encontrado en la base de datos." }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      if (!profile2.bingx_api_key || !profile2.bingx_api_secret) {
        return new Response(JSON.stringify({ error: "No se han configurado las claves de API de BingX en Ajustes." }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      const [positions, balance] = await Promise.all([
        fetchBingXPositions(profile2.bingx_api_key, profile2.bingx_api_secret),
        fetchBingXBalance(profile2.bingx_api_key, profile2.bingx_api_secret)
      ]);
      return new Response(JSON.stringify({ positions, balance }), {
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
      try {
        console.log(`PREPARAR CIERRE: Llamando a callOpenRouter con ${TEXT_MODEL}...`);
        const replyText2 = await callOpenRouter(
          TEXT_MODEL,
          [{ role: "user", content: closurePrompt }],
          0.2,
          true,
          8e4,
          openrouterApiKey2
        );
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
        console.error("Error analyzing close conversation with callOpenRouter:", lastErrorMsg);
      }
      if (!conclusionsData) {
        return new Response(JSON.stringify({ error: `Fallo al analizar la sesi\xF3n con el modelo de an\xE1lisis. Detalles: ${lastErrorMsg}` }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      await saveConversationConclusions(supabaseUrl, supabaseServiceKey, conversationId, conclusionsData, "active");
      const formattedSummary = conclusionsData.assistant_summary || "Borrador de cierre preparado.";
      const summaryWithMessage = `${formattedSummary}

[model:deepseek]`;
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
      const openrouterApiKey2 = Deno.env.get("OPENROUTER_API_KEY");
      if (!openrouterApiKey2) {
        return new Response(JSON.stringify({ error: "OPENROUTER_API_KEY no est\xE1 configurado en las variables de entorno de Supabase." }), {
          status: 500,
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
      const prompt = "Transcribe y organiza de forma limpia, legible, bien puntuada y coherente el siguiente audio en espa\xF1ol. Mant\xE9n el tono literal pero corrige errores de pronunciaci\xF3n o muletillas obvias. Devuelve \xFAnicamente el texto de la transcripci\xF3n, sin introducciones, explicaciones, ni marcas adicionales (como comillas o tags).";
      let transcription = "";
      let lastErrorMessage = "";
      try {
        const audioFormat = mimeType.split("/")[1] || "webm";
        const openrouterPayload2 = {
          model: "google/gemini-2.5-flash",
          messages: [{
            role: "user",
            content: [
              {
                type: "text",
                text: prompt
              },
              {
                type: "input_audio",
                input_audio: {
                  data: base64Data.trim(),
                  format: audioFormat
                }
              }
            ]
          }],
          temperature: 0.1
        };
        const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${openrouterApiKey2}`
          },
          body: JSON.stringify(openrouterPayload2)
        });
        if (res.ok) {
          const json2 = await res.json();
          transcription = json2.choices?.[0]?.message?.content?.trim() || "";
        } else {
          const errText = await res.text();
          lastErrorMessage = `API de OpenRouter devolvi\xF3 error ${res.status}: ${errText}`;
          console.error(lastErrorMessage);
        }
      } catch (err) {
        lastErrorMessage = `Excepci\xF3n al llamar al modelo para transcripci\xF3n: ${err.message}`;
        console.error(lastErrorMessage);
      }
      if (!transcription) {
        return new Response(JSON.stringify({ error: `Fallo al transcribir el audio. Detalles: ${lastErrorMessage || "Respuesta vac\xEDa del modelo."}` }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      return new Response(JSON.stringify({ success: true, transcription }), {
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
    const [profile, conversationTitle, recentMoods, debtsList, menteSources] = await Promise.all([
      fetchUserProfile(supabaseUrl, supabaseServiceKey, userId),
      conversationId ? fetchConversationTitle(supabaseUrl, supabaseServiceKey, conversationId) : Promise.resolve(""),
      fetchRecentMoods(supabaseUrl, supabaseServiceKey, userId),
      isOwner ? fetchUserDebts(supabaseUrl, supabaseServiceKey, userId) : Promise.resolve([]),
      fetchMenteSources(supabaseUrl, supabaseServiceKey, userId)
    ]);
    const totalDebtAmount = debtsList.reduce((sum, d) => sum + ((parseFloat(d.amount) || 0) - (parseFloat(d.paid_amount) || 0)), 0);
    const marketKeywords = {
      "xauusd": "GC=F",
      "oro": "GC=F",
      "gold": "GC=F",
      "btc": "BTC-USD",
      "bitcoin": "BTC-USD",
      "eth": "ETH-USD",
      "ethereum": "ETH-USD",
      "sp500": "^GSPC",
      "s&p": "^GSPC",
      "sp 500": "^GSPC",
      "nasdaq": "^IXIC",
      "eurusd": "EURUSD=X",
      "eur/usd": "EURUSD=X",
      "petroleo": "CL=F",
      "oil": "CL=F",
      "crudo": "CL=F",
      "plata": "SI=F",
      "silver": "SI=F"
    };
    const lastUserMsgs = messages.filter((m) => m.role === "user").slice(-3);
    const userText = lastUserMsgs.map((m) => (m.content || "").toLowerCase()).join(" ");
    let mainTicker = "";
    let mainPairName = "";
    for (const [keyword, ticker] of Object.entries(marketKeywords)) {
      if (userText.includes(keyword)) {
        mainTicker = ticker;
        mainPairName = keyword.toUpperCase();
        break;
      }
    }
    let bingxPositions = null;
    let bingxBalance = null;
    let yahooHistoryCandles = [];
    const networkPromises = [];
    let bingxPosPromiseIdx = -1;
    let bingxBalPromiseIdx = -1;
    let yahooPromiseIdx = -1;
    if (isOwner && profile && profile.bingx_api_key && profile.bingx_api_secret) {
      bingxPosPromiseIdx = networkPromises.push(fetchBingXPositions(profile.bingx_api_key, profile.bingx_api_secret)) - 1;
      bingxBalPromiseIdx = networkPromises.push(fetchBingXBalance(profile.bingx_api_key, profile.bingx_api_secret)) - 1;
    }
    if (isOwner && mainTicker && (!tradingviewContext || !tradingviewContext.connected)) {
      yahooPromiseIdx = networkPromises.push(fetchYahooHistory(mainTicker, "15m", "2d")) - 1;
    }
    if (networkPromises.length > 0) {
      const results = await Promise.all(networkPromises);
      if (bingxPosPromiseIdx !== -1) bingxPositions = results[bingxPosPromiseIdx];
      if (bingxBalPromiseIdx !== -1) bingxBalance = results[bingxBalPromiseIdx];
      if (yahooPromiseIdx !== -1) yahooHistoryCandles = results[yahooPromiseIdx];
    }
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
    if (isOwner) {
      auditPrompt += `

--- ESTADO DE DEUDAS DEL USUARIO PROPIETARIO ---
Deuda Total Pendiente: ${totalDebtAmount.toFixed(2)} \u20AC
`;
    }
    if (currentMood) {
      const medicationLine = isOwner ? `
- Medicaci\xF3n registrada hoy: ${currentMood.atomoxetina_taken ? "S\xCD" : "NO"}.` : "";
      auditPrompt += `

--- REGISTRO DIARIO ACTUAL (HOY) ---
- Nivel interno 1: ${currentMood.anxiety_level ?? "N/A"}/10, Nivel interno 2: ${currentMood.impulsivity_level ?? "N/A"}/10.
- Notas del diario: "${currentMood.notes ?? "Sin notas"}".${medicationLine}`;
    }
    if (isOwner && bingxPositions && bingxPositions.length > 0) {
      auditPrompt += `

--- AUDITOR\xCDA DE TRADING EN TIEMPO REAL (BINGX) ---
Veo que el usuario propietario tiene las siguientes posiciones abiertas en este momento:
`;
      bingxPositions.forEach((pos) => {
        auditPrompt += `- S\xEDmbolo: ${pos.symbol}, Direcci\xF3n: ${pos.positionSide}, Lote/Tama\xF1o: ${pos.positionAmt}, Precio Entrada: ${pos.entryPrice}, PnL Flotante: ${pos.unrealizedProfit} USDT, Apalancamiento: ${pos.leverage}x, Margen: ${pos.isolatedMargin} USDT
`;
      });
      if (bingxBalance) {
        auditPrompt += `Balance en Futuros: ${bingxBalance.balance} USDT, Disponible: ${bingxBalance.availableBalance} USDT.
`;
      }
      auditPrompt += `
INSTRUCCI\xD3N DEL GESTOR DE RIESGO: El apalancamiento alto multiplica el peligro y acorta el margen de error, por lo que el control estricto del tama\xF1o de la posici\xF3n y la colocaci\xF3n del stop-loss es cr\xEDtico y no negociable.
Analiza si el usuario est\xE1 sobre-apalancado (ej. m\xE1s de 5-10x en su contexto o lotajes desproporcionados), si tiene p\xE9rdidas acumuladas flotantes graves sin stop-loss o si est\xE1 recargando posiciones perdedoras.
Si hay riesgo grave de ruina, interrumpe el tono terap\xE9utico habitual y exige de forma firme, asertiva y directa que ejecute el 'Protocolo de Reset' y reduzca o cierre su posici\xF3n al 50% o al 100% de inmediato. Recu\xE9rdale priorizar estabilidad, salud y control antes que recuperar de golpe.`;
    } else if (isOwner) {
      auditPrompt += `

--- ESTADO DE TRADING ---
No hay posiciones abiertas en BingX en este momento. Si el usuario menciona que est\xE1 operando o quiere operar, recu\xE9rdale rellenar el Checklist de BingX y verificar si su sistema de bloqueo temporal est\xE1 activo.`;
    }
    if (isOwner && tradingviewContext && tradingviewContext.connected) {
      const state = tradingviewContext.state || {};
      const quote = tradingviewContext.quote || {};
      const values = tradingviewContext.values || {};
      auditPrompt += `

--- CONTEXTO T\xC9CNICO EN PANTALLA (TRADINGVIEW DESKTOP USUARIO PROPIETARIO) ---
El usuario propietario tiene TradingView abierto en su escritorio con los siguientes datos en directo:
- Activo en gr\xE1fico: ${state.symbol || "N/A"} (${state.resolution ? state.resolution + " timeframe" : "N/A"})
- Tipo de gr\xE1fico: ${state.chartType === 1 ? "Velas Japonesas" : state.chartType || "N/A"}
- Precio de Cotizaci\xF3n actual: $${quote.last || quote.close || "N/A"}
- Indicadores en pantalla y sus valores:
`;
      if (values.studies && Array.isArray(values.studies)) {
        values.studies.forEach((st) => {
          auditPrompt += `  * ${st.name}: ${JSON.stringify(st.values)}
`;
        });
      } else {
        auditPrompt += `  (No se leyeron indicadores de la pantalla o no hay estudios cargados)
`;
      }
      if (tradingviewContext.pineLines && tradingviewContext.pineLines.study_count > 0) {
        auditPrompt += `- Niveles de soporte/resistencia Pine: 
`;
        tradingviewContext.pineLines.studies.forEach((s) => {
          auditPrompt += `  * ${s.name}: Niveles Horizontales: ${JSON.stringify(s.horizontal_levels)}
`;
        });
      }
      if (tradingviewContext.pineTables && tradingviewContext.pineTables.study_count > 0) {
        auditPrompt += `- Tablas de Datos Pine en pantalla: 
`;
        tradingviewContext.pineTables.studies.forEach((s) => {
          s.tables.forEach((t, idx) => {
            auditPrompt += `  * Tabla ${idx + 1} (${s.name}):
    ${t.rows.join("\n    ")}
`;
          });
        });
      }
    }
    if (mainTicker && (!tradingviewContext || !tradingviewContext.connected)) {
      const candles = yahooHistoryCandles;
      if (candles && candles.length > 20) {
        const closes = candles.map((c) => c.close);
        const latestPrice = closes[closes.length - 1];
        const ema9 = calculateEMA(closes, 9);
        const ema21 = calculateEMA(closes, 21);
        const rsi14 = calculateRSI(closes, 14);
        const bb = calculateBollingerBands(closes, 20, 2);
        const latestEma9 = ema9[ema9.length - 1];
        const latestEma21 = ema21[ema21.length - 1];
        const latestRsi14 = rsi14[rsi14.length - 1];
        const latestBbUpper = bb.upper[bb.upper.length - 1];
        const latestBbMiddle = bb.middle[bb.middle.length - 1];
        const latestBbLower = bb.lower[bb.lower.length - 1];
        auditPrompt += `

--- C\xC1LCULO T\xC9CNICO EN TIEMPO REAL (YAHOO FINANCE) ---
Par analizado por menci\xF3n en chat: ${mainPairName} (${mainTicker})
- \xDAltimo Precio: $${latestPrice.toFixed(2)}
- EMA 9: $${latestEma9?.toFixed(2) || "N/A"} (Tendencia corta)
- EMA 21: $${latestEma21?.toFixed(2) || "N/A"} (Tendencia media)
- RSI 14: ${latestRsi14?.toFixed(2) || "N/A"} (${latestRsi14 > 70 ? "SOBRECOMPRA" : latestRsi14 < 30 ? "SOBREVENTA" : "ZONA NEUTRA"})
- Bandas Bollinger (20, 2): Upper: $${latestBbUpper?.toFixed(2)}, Middle: $${latestBbMiddle?.toFixed(2)}, Lower: $${latestBbLower?.toFixed(2)}
- Cruce EMAs: ${latestEma9 > latestEma21 ? "Cruce Alcista (EMA9 > EMA21)" : "Cruce Bajista (EMA9 < EMA21)"}
`;
      }
    }
    const defaultCtx = { foto_persona: "No hay mapa consolidado a\xFAn.", temas: [] };
    const userCtx = profile?.contexto_terapeutico || defaultCtx;
    auditPrompt += `

--- MAPA PSICOL\xD3GICO Y SITUACI\xD3N ACTUAL (RESUMEN DE MENTE) ---
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
    const personalSystemInstruction = `Eres Walter, asistente privado de Josfer en psicolog\xEDa, rendimiento y trading. Tu prioridad es psicol\xF3gica: investigar paso a paso lo que ocurre, ordenar el contexto y proponer pautas pr\xE1cticas. Usa solo la memoria y los datos din\xE1micos inyectados; no trates ning\xFAn dato hist\xF3rico como fijo si no aparece en esos datos.

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
- **Proactividad basada en datos:** Eres un copiloto. Investiga proactivamente los datos inyectados en tu contexto (posiciones abiertas en BingX, saldo de cuenta, cotizaciones de TradingView o Yahoo Finance). Si detectas alg\xFAn nivel t\xE9cnico clave, o un riesgo de sobre-apalancamiento, indaga, preg\xFAntale directamente sobre ese dato espec\xEDfico y prop\xF3n soluciones pr\xE1cticas de forma directa.
- **Interacci\xF3n paso a paso:** No intentes solucionarlo todo en una sola respuesta. Indaga con preguntas precisas, prop\xF3n ejecuciones de \xF3rdenes o cambios de gr\xE1fico en TradingView, y deja que sea el usuario quien responda.

REGLA DE OPERATIVA:
- El usuario decide si opera o no. Ay\xFAdale a operar mejor, a ser rentable y emocionalmente estable. NUNCA le digas que deje de operar o que el trading es una adicci\xF3n/compulsi\xF3n.

Tu rol es DUAL:

1. PSIC\xD3LOGO DE TRADING Y RENDIMIENTO:
   - Trato de Espa\xF1a (t\xFA), asertivo, cl\xEDnico, emp\xE1tico y centrado en el proceso.
   - Aplica psicolog\xEDa del rendimiento: combatir la ceguera de escala (valorar ganancias peque\xF1as como ladrillos reales), regular el estado de \xE1nimo y prescribir 'Reset de Am\xEDgdala' en momentos de tilt o alta activaci\xF3n.
   - No menciones teor\xEDas densas ni etiquetas cl\xEDnicas cerradas a menos que el usuario te lo pida expl\xEDcitamente. Valida cient\xEDficamente solo de manera breve y en una sola frase cuando mencione un bloqueo profundo.

2. GESTOR DE RIESGOS EN TIEMPO REAL:
   - Audita sus posiciones en BingX. Si hay riesgo de ruina o sobre-apalancamiento (>10x), exige firmemente el 'Protocolo de Reset' y sugiere \xF3rdenes de reducci\xF3n o cierre del 50%/100%.

3. CONTROL REMOTO DE TRADINGVIEW:
   - Si el usuario te pide ver un activo, cambiar de gr\xE1fico, o si deseas enfocarle de forma proactiva en un timeframe superior, emite el tag al final de tu respuesta:
     <execute_action>
     {
       "tool": "chart_set_symbol",
       "arguments": { "symbol": "BTCUSD" }
     }
     </execute_action>

     Herramientas: 'chart_set_symbol' (args: symbol), 'chart_set_timeframe' (args: timeframe: '1'|'5'|'15'|'60'|'D'), 'chart_set_type' (args: chart_type: 'Candles'|'Line'), 'chart_manage_indicator' (args: action: 'add'|'remove', indicator), 'pane_set_layout' (args: layout: 's'|'2h'|'2v'|'4'), 'tab_new', 'tab_switch' (args: index), 'ui_fullscreen'.

4. SISTEMA DE ACTUALIZACI\xD3N DE MEMORIA:
   - Si acord\xE1is un compromiso, identificas una conclusi\xF3n clave o prescribe una pauta, a\xF1ade obligatoriamente:
     <update_context>
     {
       "conclusiones": ["Conclusi\xF3n concisa sobre su patr\xF3n actual"],
       "compromisos": ["Compromiso de gesti\xF3n de riesgo acordado"],
       "pautas_accion": ["Pauta de reset conductual prescrita"]
     }
     </update_context>

5. CAMBIO AG\xC9NTICO DE T\xCDTULO:
   - Si el tema cambia sustancialmente, emite <update_title>Nuevo T\xEDtulo Sugerido</update_title> y pregunta si el usuario est\xE1 de acuerdo con el cambio de t\xEDtulo.


6. CONTROL DE OPERACIONES EN BINGX:
   - Si el usuario confirma ejecutar una operaci\xF3n o te pide gestionar sus \xF3rdenes en el chat, emite <execute_trade> con el JSON correspondiente al final de tu respuesta:
     * Cierre parcial/mercado: type="MARKET", reduceOnly=true.
     * Carga limitada: type="LIMIT", price=PRECIO, reduceOnly=false.
     * Stop Loss / Take Profit: type="TRIGGER_MARKET", stopPrice=PRECIO, reduceOnly=true.
     * Cancelar \xF3rdenes del par: action="CANCEL_ALL", symbol="S\xCDMBOLO-USDT".
     * Nota: En LONG, el SL/reducci\xF3n debe ser side="SELL", positionSide="LONG". En SHORT, side="BUY", positionSide="SHORT".
     * El 'symbol' debe terminar en '-USDT'. La quantity es el n\xFAmero real de contratos/monedas.
     * Pide confirmaci\xF3n previa antes de colocar \xF3rdenes de ejecuci\xF3n (l\xEDmite, mercado o stop), excepto si el usuario te lo pide directamente o hay una urgencia de riesgo evidente.
     * Nunca emitas <execute_trade> sin una confirmaci\xF3n afirmativa del usuario inmediatamente anterior en la conversaci\xF3n (salvo en cancelaciones directas u \xF3rdenes expl\xEDcitamente de emergencia).`;
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
    const genericSystemInstruction = `Eres Walter, asistente clínico de apoyo psicológico para un usuario nuevo en ÁNCORA. Tu prioridad actual es guiar un triaje clínico inicial de forma conversacional y empática.

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
- Mantén un tono empático, seguro, asertivo y paso a paso.`;
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
    const tradeRegex = /<execute_trade>([\s\S]*?)<\/execute_trade>/i;
    const tradeMatch = cleanReply.match(tradeRegex);
    let tradeResult = null;
    if (tradeMatch) {
      try {
        if (!isOwner) {
          throw new Error("M\xF3dulo de trading no disponible para este usuario.");
        }
        const tradeParams = JSON.parse(tradeMatch[1].trim());
        const apiKey = profile?.bingx_api_key;
        const apiSecret = profile?.bingx_api_secret;
        if (!apiKey || !apiSecret) {
          tradeResult = "Error: Las credenciales de la API de BingX no est\xE1n configuradas en Ajustes.";
        } else {
          if (tradeParams.action === "CANCEL_ALL") {
            tradeResult = await cancelBingXOpenOrders(
              apiKey,
              apiSecret,
              tradeParams.symbol
            );
          } else {
            tradeResult = await executeBingXOrder(
              apiKey,
              apiSecret,
              tradeParams.symbol,
              tradeParams.side,
              tradeParams.positionSide,
              tradeParams.quantity,
              tradeParams.type || "MARKET",
              tradeParams.price,
              tradeParams.stopPrice,
              tradeParams.reduceOnly !== false
            );
          }
        }
      } catch (err) {
        console.error("Error executing trade action:", err.message);
        tradeResult = `Error al procesar la orden: ${err.message}`;
      }
      cleanReply = cleanReply.replace(tradeRegex, "").trim();
      cleanReply += `

**[Ejecuci\xF3n de Orden BingX]**
${tradeResult}`;
    }
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
    const replyWithModel = `${cleanReply}

[model:deepseek]`;
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
      generatedTitle
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
