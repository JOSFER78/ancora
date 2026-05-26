// @ts-nocheck
import { unzipSync } from "https://esm.sh/fflate@0.8.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Decodes Supabase Auth JWT to extract user ID (sub) without dependencies
function getUserIdFromToken(token: string): string {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return '';
    const payloadBase64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const decoded = atob(payloadBase64);
    const parsed = JSON.parse(decoded);
    return parsed.sub || '';
  } catch (e) {
    console.error("Error decoding JWT payload:", e);
    return '';
  }
}

// BingX API signature helper in Deno (Web Crypto API)
async function getBingXSignature(queryString: string, apiSecret: string): Promise<string> {
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
  
  // Convert ArrayBuffer to Hex String
  return Array.from(new Uint8Array(sigBuf))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

// Fetch open positions from BingX
async function fetchBingXPositions(apiKey: string, apiSecret: string): Promise<any> {
  try {
    const timestamp = Date.now();
    const recvWindow = 5000;
    const params = `recvWindow=${recvWindow}&timestamp=${timestamp}`;
    const signature = await getBingXSignature(params, apiSecret);
    
    const url = `https://open-api.bingx.com/openApi/swap/v2/user/positions?${params}&signature=${signature}`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1200);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "X-BX-APIKEY": apiKey,
        "Accept": "application/json",
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
    return []; // Devolver lista vacía para no romper el flujo
  }
}

// Execute trade order on BingX (e.g. reduce, close, limit or trigger position)
async function executeBingXOrder(
  apiKey: string,
  apiSecret: string,
  symbol: string,
  side: string,
  positionSide: string,
  quantity: number,
  type: string = "MARKET",
  price?: number,
  stopPrice?: number,
  reduceOnly: boolean = true
): Promise<string> {
  try {
    const timestamp = Date.now();
    const recvWindow = 5000;

    const paramObj: Record<string, string> = {
      symbol: symbol.toUpperCase(),
      side: side.toUpperCase(),
      positionSide: positionSide.toUpperCase(),
      type: type.toUpperCase(),
      reduceOnly: reduceOnly ? "true" : "false",
      quantity: quantity.toString(),
      recvWindow: recvWindow.toString(),
      timestamp: timestamp.toString()
    };

    if (price !== undefined && price !== null) {
      paramObj.price = price.toString();
    }

    if (stopPrice !== undefined && stopPrice !== null) {
      paramObj.stopPrice = stopPrice.toString();
    }

    const sortedQueryString = Object.keys(paramObj)
      .sort()
      .map(key => `${key}=${encodeURIComponent(paramObj[key])}`)
      .join("&");

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
      return `Éxito. Orden ejecutada en BingX (${type}). ID de Orden: ${orderId}. Símbolo: ${symbol}, Cantidad: ${quantity}${price ? `, Precio: ${price}` : ""}${stopPrice ? `, StopPrice: ${stopPrice}` : ""}`;
    } else {
      return `Fallo en BingX (Código ${json.code}): ${json.msg || "Error no especificado."}`;
    }
  } catch (e) {
    console.error("Error executing BingX order:", e.message);
    return `Error inesperado al enviar la orden a BingX: ${e.message}`;
  }
}

// Cancel all open orders of a symbol on BingX
async function cancelBingXOpenOrders(
  apiKey: string,
  apiSecret: string,
  symbol: string
): Promise<string> {
  try {
    const timestamp = Date.now();
    const recvWindow = 5000;

    const paramObj: Record<string, string> = {
      symbol: symbol.toUpperCase(),
      recvWindow: recvWindow.toString(),
      timestamp: timestamp.toString()
    };

    const sortedQueryString = Object.keys(paramObj)
      .sort()
      .map(key => `${key}=${encodeURIComponent(paramObj[key])}`)
      .join("&");

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
      return `Error HTTP de BingX al cancelar órdenes (${response.status}): ${errText}`;
    }

    const json = await response.json();
    if (json.code === 0) {
      return `Éxito. Todas las órdenes pendientes para el par ${symbol} han sido canceladas en BingX.`;
    } else {
      return `Fallo al cancelar órdenes en BingX (Código ${json.code}): ${json.msg || "Error no especificado."}`;
    }
  } catch (e) {
    console.error("Error cancelling BingX open orders:", e.message);
    return `Error inesperado al cancelar órdenes pendientes en BingX: ${e.message}`;
  }
}

// Fetch balance from BingX
async function fetchBingXBalance(apiKey: string, apiSecret: string): Promise<any> {
  try {
    const timestamp = Date.now();
    const recvWindow = 5000;
    const params = `recvWindow=${recvWindow}&timestamp=${timestamp}`;
    const signature = await getBingXSignature(params, apiSecret);
    
    const url = `https://open-api.bingx.com/openApi/swap/v3/user/balance?${params}&signature=${signature}`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1200);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "X-BX-APIKEY": apiKey,
        "Accept": "application/json",
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

// Fetch history orders from BingX
async function fetchBingXHistoryOrders(apiKey: string, apiSecret: string): Promise<any[]> {
  try {
    const timestamp = Date.now();
    const recvWindow = 5000;
    const limit = 100;
    const params = `limit=${limit}&recvWindow=${recvWindow}&timestamp=${timestamp}`;
    const signature = await getBingXSignature(params, apiSecret);
    
    const url = `https://open-api.bingx.com/openApi/swap/v2/user/historyOrders?${params}&signature=${signature}`;
    
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "X-BX-APIKEY": apiKey,
        "Accept": "application/json",
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

// Fetch profile using REST API to bypass @supabase/supabase-js dependency
async function fetchUserProfile(supabaseUrl: string, serviceKey: string, userId: string): Promise<any> {
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

// Update profile context using REST API
async function saveUserProfileContext(supabaseUrl: string, serviceKey: string, userId: string, context: any): Promise<void> {
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
      updated_at: new Date().toISOString()
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error(`Error patching profile context: ${response.status} - ${errText}`);
  }
}

// Fetch conversation title
async function fetchConversationTitle(supabaseUrl: string, serviceKey: string, conversationId: string): Promise<string> {
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
    if (!response.ok) return '';
    const list = await response.json();
    return list[0]?.title || '';
  } catch (e) {
    console.error("Error fetching conversation title:", e);
    return '';
  }
}

// Update conversation title
async function updateConversationTitle(supabaseUrl: string, serviceKey: string, conversationId: string, title: string): Promise<void> {
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
        title: title,
        updated_at: new Date().toISOString()
      })
    });
  } catch (e) {
    console.error("Error updating conversation title:", e);
  }
}

// Update conversation updated_at timestamp
async function updateConversationTimestamp(supabaseUrl: string, serviceKey: string, conversationId: string): Promise<void> {
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
        updated_at: new Date().toISOString()
      })
    });
  } catch (e) {
    console.error("Error updating conversation timestamp:", e);
  }
}

// Save message to database
async function saveMessageToDb(supabaseUrl: string, serviceKey: string, conversationId: string, role: string, content: string, image?: string): Promise<void> {
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

// Fetch all messages of a conversation
async function fetchConversationMessages(supabaseUrl: string, serviceKey: string, conversationId: string): Promise<any[]> {
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

// Save conversation conclusions/mapping
async function saveConversationConclusions(
  supabaseUrl: string,
  serviceKey: string,
  conversationId: string,
  conclusionsData: {
    captured_fact: string;
    conclusions: string[];
    solutions_exercises: string[];
    clinical_studies: string;
  },
  status: string = 'completed'
): Promise<void> {
  try {
    const url = `${supabaseUrl}/rest/v1/conversations?id=eq.${conversationId}`;
    const patchBody: any = {
      captured_fact: conclusionsData.captured_fact,
      conclusions: JSON.stringify(conclusionsData.conclusions),
      solutions_exercises: JSON.stringify(conclusionsData.solutions_exercises),
      clinical_studies: conclusionsData.clinical_studies,
      updated_at: new Date().toISOString()
    };
    if (status === 'completed') {
      patchBody.status = 'completed';
      patchBody.closed_at = new Date().toISOString();
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

// Fetch paciente context sources (NotebookLM-like files)
async function fetchMenteSources(supabaseUrl: string, serviceKey: string, userId: string): Promise<any[]> {
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

// Extract plain text from docx base64 data using fflate
function extractTextFromDocx(base64Data: string): string {
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
    
    // Extract text between <w:t> tags
    const matches = xmlText.match(/<w:t[^>]*>([\s\S]*?)<\/w:t>/g);
    if (!matches) return "";
    
    return matches
      .map(tag => {
        const text = tag.replace(/<[^>]+>/g, "");
        return text
          .replace(/&amp;/g, "&")
          .replace(/&lt;/g, "<")
          .replace(/&gt;/g, ">")
          .replace(/&quot;/g, '"')
          .replace(/&apos;/g, "'");
      })
      .join(" ");
  } catch (err) {
    console.error("Error extracting text from docx:", err);
    return `[Error al extraer texto del archivo docx: ${err.message}]`;
  }
}

// Helper to clean docx files on-the-fly and save them back to Supabase
async function getCleanTextContent(src: any, supabaseUrl: string, serviceKey: string): Promise<string> {
  let content = src.text_content ?? "";
  const isDocx = src.content_type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || 
                 (src.name && src.name.endsWith(".docx"));
                 
  if (isDocx && content.includes("base64,")) {
    const base64Data = content.split("base64,")[1] || "";
    if (base64Data) {
      console.log(`On-the-fly docx text extraction for: ${src.name}`);
      const cleanText = extractTextFromDocx(base64Data);
      if (cleanText && !cleanText.startsWith("[Error")) {
        // Update in Supabase so it's permanently cleaned
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

// Fetch recent daily moods
async function fetchRecentMoods(supabaseUrl: string, serviceKey: string, userId: string): Promise<any[]> {
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

// Fetch all debts
async function fetchUserDebts(supabaseUrl: string, serviceKey: string, userId: string): Promise<any[]> {
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

// Upsert journal days
async function upsertJournalDays(supabaseUrl: string, serviceKey: string, userId: string, days: any[]): Promise<void> {
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

// Generate a summary title using OpenRouter
async function generateConversationTitle(openrouterApiKey: string, userMessage: string): Promise<string> {
  const prompt = `Analiza este primer mensaje de un paciente y genera un título de 3 a 5 palabras en español que resuma el tema o estado emocional. Sé conciso y directo, sin comillas ni adornos. Ejemplos: "Ansiedad por pérdidas", "Foco en Oro", "Reset de Amígdala", "Plan familiar Lola".
  Mensaje: "${userMessage}"`;

  let title = "";
  try {
    if (!openrouterApiKey) {
      console.warn("OPENROUTER_API_KEY no configurado al generar título.");
      return "Nueva Sesión con Walter";
    }
    const openrouterUrl = "https://openrouter.ai/api/v1/chat/completions";
    const res = await fetch(openrouterUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openrouterApiKey}`
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 15
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
  return title.replace(/"/g, "").replace(/\./g, "").trim() || "Nueva Sesión con Walter";
}

// Fetch market price from Yahoo Finance public API
async function fetchYahooPrice(ticker: string): Promise<{price: number, change: number, changePercent: number} | null> {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=1d`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1000);
    const resp = await fetch(url, { 
      headers: { 'User-Agent': 'Mozilla/5.0' },
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    if (!resp.ok) return null;
    const data = await resp.json();
    const meta = data?.chart?.result?.[0]?.meta;
    if (!meta) return null;
    return {
      price: meta.regularMarketPrice,
      change: meta.regularMarketPrice - meta.previousClose,
      changePercent: ((meta.regularMarketPrice - meta.previousClose) / meta.previousClose) * 100
    };
  } catch { return null; }
}

interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// Fetch historical candles from Yahoo Finance
async function fetchYahooHistory(ticker: string, interval: string = '15m', range: string = '2d'): Promise<Candle[]> {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=${interval}&range=${range}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1000);
    const resp = await fetch(url, { 
      headers: { 'User-Agent': 'Mozilla/5.0' },
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

    const candles: Candle[] = [];
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

// Technical Indicators Calculation Helpers
function calculateEMA(prices: number[], period: number): number[] {
  if (prices.length < period) return [];
  const k = 2 / (period + 1);
  const ema: number[] = [];
  
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += prices[i];
  }
  let prevEma = sum / period;
  ema.push(prevEma);

  for (let i = period; i < prices.length; i++) {
    const val = (prices[i] * k) + (prevEma * (1 - k));
    ema.push(val);
    prevEma = val;
  }
  return ema;
}

function calculateRSI(prices: number[], period: number = 14): number[] {
  if (prices.length <= period) return [];
  const rsi: number[] = [];
  const gains: number[] = [];
  const losses: number[] = [];

  for (let i = 1; i < prices.length; i++) {
    const diff = prices[i] - prices[i - 1];
    gains.push(diff > 0 ? diff : 0);
    losses.push(diff < 0 ? -diff : 0);
  }

  let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
  let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;

  let rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
  rsi.push(100 - (100 / (1 + rs)));

  for (let i = period; i < prices.length - 1; i++) {
    avgGain = ((avgGain * (period - 1)) + gains[i]) / period;
    avgLoss = ((avgLoss * (period - 1)) + losses[i]) / period;
    rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    rsi.push(100 - (100 / (1 + rs)));
  }

  return rsi;
}

function calculateBollingerBands(prices: number[], period: number = 20, multiplier: number = 2): { middle: number[], upper: number[], lower: number[] } {
  const middle: number[] = [];
  const upper: number[] = [];
  const lower: number[] = [];

  for (let i = period - 1; i < prices.length; i++) {
    const slice = prices.slice(i - period + 1, i + 1);
    const sma = slice.reduce((a, b) => a + b, 0) / period;
    middle.push(sma);

    const variance = slice.reduce((a, b) => a + Math.pow(b - sma, 2), 0) / period;
    const stdDev = Math.sqrt(variance);
    upper.push(sma + (multiplier * stdDev));
    lower.push(sma - (multiplier * stdDev));
  }

  return { middle, upper, lower };
}

Deno.serve(async (req) => {
  // Handle CORS Preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    console.log("OPENROUTER_API_KEY length:", Deno.env.get("OPENROUTER_API_KEY")?.length || 0);
    console.log("GEMINI_API_KEY length:", Deno.env.get("GEMINI_API_KEY")?.length || 0);
    // 1. Resolve Authorization and Auth User
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing Authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const userId = getUserIdFromToken(token);
    if (!userId) {
      return new Response(JSON.stringify({ error: "Invalid user token (cannot parse payload)" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Initialize Supabase Client environment details
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    // 2. Parse request body
    const body = await req.json();
    const { action, messages, currentMood, conversationId, tradingviewContext, model, reset } = body;

    // ACTION: debug_env
    if (action === "debug_env") {
      return new Response(JSON.stringify({
        envKeys: Object.keys(Deno.env.toObject())
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // ACTION: sync_closed_trades
    if (action === "sync_closed_trades") {
      const profile = await fetchUserProfile(supabaseUrl, supabaseServiceKey, userId);

      if (!profile) {
        return new Response(JSON.stringify({ error: "Perfil no encontrado en Supabase." }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      if (!profile.bingx_api_key || !profile.bingx_api_secret) {
        return new Response(JSON.stringify({ error: "Configura las claves de API de BingX en Ajustes." }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      // Fetch history orders from BingX
      const historyOrders = await fetchBingXHistoryOrders(profile.bingx_api_key, profile.bingx_api_secret);
      
      const dailyPnL: Record<string, { pnl: number, trades: number }> = {};

      for (const order of historyOrders) {
        if (order.status !== "FILLED") continue;
        
        const profitNum = parseFloat(order.realizedProfit || order.realizedPnl || order.profit || "0");
        if (profitNum === 0) continue; // Solo órdenes con P&L realizado (cierres)
        
        const time = order.updateTime || order.time;
        if (!time) continue;
        
        const date = new Date(time);
        const formatter = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Madrid', year: 'numeric', month: '2-digit', day: '2-digit' });
        const dateStr = formatter.format(date); // "YYYY-MM-DD" in Spain timezone
        
        if (!dailyPnL[dateStr]) {
          dailyPnL[dateStr] = { pnl: 0, trades: 0 };
        }
        
        dailyPnL[dateStr].pnl += profitNum;
        dailyPnL[dateStr].trades += 1;
      }

      // Format for upsert
      const upsertData = Object.entries(dailyPnL).map(([dateStr, stats]) => {
        let status = 'no_trade';
        if (stats.pnl > 0) status = 'win';
        else if (stats.pnl < 0) status = 'loss';
        
        return {
          user_id: userId,
          date: dateStr,
          pnl: stats.pnl,
          trades: stats.trades,
          status: status
        };
      });

      if (upsertData.length > 0) {
        await upsertJournalDays(supabaseUrl, supabaseServiceKey, userId, upsertData);
      }

      return new Response(JSON.stringify({ success: true, count: upsertData.length, data: upsertData }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // ACTION: get_bingx_data
    if (action === "get_bingx_data") {
      const profile = await fetchUserProfile(supabaseUrl, supabaseServiceKey, userId);

      if (!profile) {
        return new Response(JSON.stringify({ error: "Perfil no encontrado en la base de datos." }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      if (!profile.bingx_api_key || !profile.bingx_api_secret) {
        return new Response(JSON.stringify({ error: "No se han configurado las claves de API de BingX en Ajustes." }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      const [positions, balance] = await Promise.all([
        fetchBingXPositions(profile.bingx_api_key, profile.bingx_api_secret),
        fetchBingXBalance(profile.bingx_api_key, profile.bingx_api_secret)
      ]);

      return new Response(JSON.stringify({ positions, balance }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // ACTION: prepare_close_conversation
    if (action === "prepare_close_conversation") {
      const openrouterApiKey = Deno.env.get("OPENROUTER_API_KEY");
      
      if (!openrouterApiKey) {
        return new Response(JSON.stringify({ error: "OPENROUTER_API_KEY no está configurado en las variables de entorno de Supabase." }), {
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

      // Fetch messages of this conversation
      const dbMessages = await fetchConversationMessages(supabaseUrl, supabaseServiceKey, conversationId);
      if (dbMessages.length === 0) {
        return new Response(JSON.stringify({ error: "No messages found in this conversation to analyze." }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      const conversationText = dbMessages.map(m => `${m.role === 'user' ? 'Emilio' : 'Walter'}: ${m.content}`).join('\n');

      const prompt = `Analiza de forma sumamente detallada, amplia y clínica la siguiente conversación de terapia entre Emilio (paciente) y Walter (terapeuta) y extrae las conclusiones estructuradas en formato JSON estricto.

Estructura JSON requerida:
{
  "captured_fact": "El hecho clínico, disparador o síntoma principal que desencadenó la sesión de forma breve y precisa (ej: ansiedad por flotante negativo en futuros de oro, recaída impulsiva o trigger familiar)",
  "analisis_evolutivo": "Un informe de análisis clínico exhaustivo y detallado (de 250 a 400 palabras en español) sobre todo lo valioso ocurrido en esta sesión. Debe estructurar detalladamente: (1) El núcleo temático trabajado y su conexión con la base traumática/TDAH de Emilio, (2) Los avances cognitivos o emocionales logrados en el chat, (3) Los mecanismos de defensa, resistencias y bloqueos detectados en el paciente durante la sesión, (4) El sentido y desglose de las pautas y compromisos prácticos acordados.",
  "conclusions": ["Conclusión 1 detallada sobre el comportamiento de Emilio", "Conclusión 2 detallada sobre sus patrones cognitivos", "Conclusión 3 sobre su estado de regulación"],
  "solutions_exercises": ["Pauta o ejercicio práctico detallado 1", "Pauta o compromiso práctico detallado 2", "Pauta o ejercicio detallado 3"],
  "clinical_studies": "Libros de referencia, autores, o estudios clínicos aplicables a Emilio (ej: Dr. Russell Barkley sobre TDAH, trauma complejo, etc.)",
  "assistant_summary": "Un texto explicativo y de cierre redactado como Walter (de 200 a 350 palabras en español) para mostrar en el chat. Debe detallar la investigación de lo que pasa, por qué y cómo solucionarlo, citando los libros, autores y estudios de apoyo de forma clara y directa, indicando al paciente que revise el panel derecho."
}

Historial de conversación:
${conversationText}

IMPORTANTE: Devuelve un JSON válido. Si usas comillas dobles dentro de una cadena de texto (por ejemplo en "analisis_evolutivo"), debes escaparlas estrictamente con barra invertida (\"), o preferiblemente usa comillas simples (') en su lugar.

Devuelve ÚNICAMENTE el objeto JSON válido. No incluyas explicaciones previas ni posteriores, ni bloques de código de markdown.`;

      let conclusionsData = null;
      try {
        let replyText = "";
        const openrouterPayload = {
          model: "google/gemini-3.5-flash",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.2,
          max_tokens: 3000,
          response_format: { type: "json_object" }
        };
        const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${openrouterApiKey}`
          },
          body: JSON.stringify(openrouterPayload)
        });
        if (res.ok) {
          const json = await res.json();
          replyText = json.choices?.[0]?.message?.content || "";
        } else {
          console.error("OpenRouter failed for prepare_close_conversation:", await res.text());
        }

        if (replyText) {
          let cleanJson = replyText.trim();
          if (cleanJson.startsWith("```json")) {
            cleanJson = cleanJson.substring(7);
          }
          if (cleanJson.endsWith("```")) {
            cleanJson = cleanJson.substring(0, cleanJson.length - 3);
          }
          conclusionsData = JSON.parse(cleanJson.trim());
        }
      } catch (err) {
        console.error("Error analyzing conversation with OpenRouter:", err.message);
      }

      if (!conclusionsData) {
        conclusionsData = {
          captured_fact: "Preparación de cierre completada.",
          analisis_evolutivo: "Se preparó el cierre de la sesión activa.",
          conclusions: ["Patrón de impulsividad reactiva en trading.", "Activación de autodefensas límbicas por trauma infantil."],
          solutions_exercises: ["Realizar parada cognitiva de 5 minutos al notar aumento de ritmo cardíaco.", "Revisar el checklist de control antes de operar."],
          clinical_studies: "Teoría del TDAH del Dr. Russell Barkley y reprocesamiento de trauma de Francine Shapiro (EMDR).",
          assistant_summary: "He analizado nuestra conversación y preparado las conclusiones del cierre de esta sesión. Puedes revisarlas en detalle en el panel de la derecha."
        };
      }

      // Save to conversations table with active status (draft)
      await saveConversationConclusions(supabaseUrl, supabaseServiceKey, conversationId, conclusionsData, 'active');

      // Save Walter's assistant summary text to DB (marked with model tag)
      const formattedSummary = conclusionsData.assistant_summary || "Borrador de cierre preparado.";
      const summaryWithMessage = `${formattedSummary}\n\n[model:3.5]`;
      await saveMessageToDb(supabaseUrl, supabaseServiceKey, conversationId, 'assistant', summaryWithMessage);

      // Fetch title and profile to build chronological evolution
      const currentTitle = await fetchConversationTitle(supabaseUrl, supabaseServiceKey, conversationId);
      const profile = await fetchUserProfile(supabaseUrl, supabaseServiceKey, userId);
      
      let mergedCtx = null;
      if (profile) {
        const currentCtx = profile.contexto_terapeutico || {};
        
        const defaultContextoBase = {
          diagnostico_inicial: "TDAH del adulto con fallas ejecutivas graves, trauma de desarrollo (CPTSD) por maltrato físico paterno y abuso de hermana mayor. Depresión severa recurrente con ideación suicida planificada (crisis extrema en junio de 2025 con intento autolítico por la pérdida total de contacto con su hija, alienada por su ex al mudarse Emilio a casa de su madre; lleva más de un año sin verla ni hablar con ella). Estrés financiero severo (deuda de 160.000€) y obsesión con el trading para conseguir capital rápido y 'recuperar' a su hija, quien no acepta su situación habitacional.",
          mecanismos_defensa: [
            "Autosabotaje financiero para validar la etiqueta paterna de 'inútil'.",
            "Parálisis ejecutiva (freeze) ante el éxito operativo por pánico identitario.",
            "Búsqueda de validación rápida a través del sobre-apalancamiento."
          ]
        };

        const ctxBase = currentCtx.contexto_base || defaultContextoBase;
        const evoluciones = Array.isArray(currentCtx.evoluciones) ? currentCtx.evoluciones : [];

        const nuevaEvolucion = {
          fecha: new Date().toISOString().split('T')[0],
          sesion_id: conversationId,
          titulo_sesion: currentTitle || "Nueva Sesión con Walter",
          hecho_clinico: conclusionsData.captured_fact,
          analisis_evolutivo: conclusionsData.analisis_evolutivo,
          pautas_y_compromisos: conclusionsData.solutions_exercises || []
        };

        const updatedEvoluciones = [nuevaEvolucion, ...evoluciones];

        const mergeArrays = (arr1: any[], arr2: any[]) => {
          const combined = [...(arr1 || []), ...(arr2 || [])];
          return Array.from(new Set(combined.map(s => String(s).trim()))).filter(Boolean);
        };

        mergedCtx = {
          ...currentCtx,
          contexto_base: ctxBase,
          evoluciones: updatedEvoluciones,
          conclusiones: mergeArrays(currentCtx.conclusiones, conclusionsData.conclusiones),
          compromisos: currentCtx.compromisos || [],
          pautas_accion: mergeArrays(currentCtx.pautas_accion, conclusionsData.solutions_exercises)
        };

        await saveUserProfileContext(supabaseUrl, supabaseServiceKey, userId, mergedCtx);
      }

      return new Response(JSON.stringify({ success: true, data: conclusionsData, updatedContext: mergedCtx || profile?.contexto_terapeutico }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // ACTION: close_conversation
    if (action === "close_conversation") {
      if (!conversationId) {
        return new Response(JSON.stringify({ error: "conversationId is required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      try {
        const url = `${supabaseUrl}/rest/v1/conversations?id=eq.${conversationId}`;
        const response = await fetch(url, {
          method: "PATCH",
          headers: {
            "apikey": supabaseServiceKey,
            "Authorization": `Bearer ${supabaseServiceKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            status: 'completed',
            closed_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
        });

        if (!response.ok) {
          throw new Error(`Failed to complete conversation: ${response.status}`);
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

// Helper to sanitize JSON string by replacing real newlines inside strings with escaped \n
function cleanJsonString(jsonStr: string): string {
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
    } else if (char === '\\' && !escaped) {
      escaped = true;
      result += char;
    } else {
      if (insideString) {
        if (char === '\n') {
          result += '\\n';
        } else if (char === '\r') {
          // ignore \r
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
}

// Fallback JSON parser using Regex when JSON.parse fails due to syntax errors or truncations
function extractJSONFieldsFallback(jsonStr: string): any {
  console.warn("JSON.parse failed. Initiating robust regex fallback extractor...");
  
  // 1. Extract foto_persona
  const fotoMatch = jsonStr.match(/"foto_persona"\s*:\s*"([\s\S]*?)"(?=\s*,\s*"|\s*\})/);
  let fotoPersona = fotoMatch ? fotoMatch[1] : "";
  if (!fotoPersona) {
    const fotoTruncatedMatch = jsonStr.match(/"foto_persona"\s*:\s*"([\s\S]*)/);
    if (fotoTruncatedMatch) {
      fotoPersona = fotoTruncatedMatch[1].trim().substring(0, 800) + "... [Texto truncado por el modelo]";
    } else {
      fotoPersona = "No se pudo extraer la síntesis de la foto de la persona.";
    }
  }

  // Helper to clean array elements
  const cleanArrayItems = (rawItems: string): string[] => {
    return rawItems
      .split(/",\s*"/g)
      .map(item => item.replace(/^\[?\s*"/, "").replace(/"\s*\]?$/, "").replace(/"/g, "").trim())
      .filter(Boolean);
  };

  // 2. Extract conclusiones
  const conclusionsMatch = jsonStr.match(/"conclusiones"\s*:\s*\[([\s\S]*?)\]/);
  let conclusiones: string[] = [];
  if (conclusionsMatch) {
    conclusiones = cleanArrayItems(conclusionsMatch[1]);
  } else {
    const lines = jsonStr.split('\n');
    lines.forEach(l => {
      if (l.includes('"conclusiones"') || conclusiones.length > 0 && !l.includes(']')) {
        const itemMatch = l.match(/"([^"]+)"/g);
        if (itemMatch) {
          itemMatch.forEach(it => {
            const cleanIt = it.replace(/"/g, "").trim();
            if (cleanIt && cleanIt !== "conclusiones" && cleanIt.length > 10) conclusiones.push(cleanIt);
          });
        }
      }
    });
  }

  // 3. Extract compromisos
  const compromisosMatch = jsonStr.match(/"compromisos"\s*:\s*\[([\s\S]*?)\]/);
  let compromisos: string[] = [];
  if (compromisosMatch) {
    compromisos = cleanArrayItems(compromisosMatch[1]);
  } else {
    const lines = jsonStr.split('\n');
    lines.forEach(l => {
      if (l.includes('"compromisos"') || compromisos.length > 0 && !l.includes(']')) {
        const itemMatch = l.match(/"([^"]+)"/g);
        if (itemMatch) {
          itemMatch.forEach(it => {
            const cleanIt = it.replace(/"/g, "").trim();
            if (cleanIt && cleanIt !== "compromisos" && cleanIt.length > 10) compromisos.push(cleanIt);
          });
        }
      }
    });
  }

  // 4. Extract pautas_accion
  const pautasMatch = jsonStr.match(/"pautas_accion"\s*:\s*\[([\s\S]*?)\]/);
  let pautas_accion: string[] = [];
  if (pautasMatch) {
    pautas_accion = cleanArrayItems(pautasMatch[1]);
  } else {
    const lines = jsonStr.split('\n');
    lines.forEach(l => {
      if (l.includes('"pautas_accion"') || pautas_accion.length > 0 && !l.includes(']')) {
        const itemMatch = l.match(/"([^"]+)"/g);
        if (itemMatch) {
          itemMatch.forEach(it => {
            const cleanIt = it.replace(/"/g, "").trim();
            if (cleanIt && cleanIt !== "pautas_accion" && cleanIt.length > 10) pautas_accion.push(cleanIt);
          });
        }
      }
    });
  }

  // 5. Extract temas list
  const temasMatch = jsonStr.match(/"temas"\s*:\s*\[([\s\S]*?)\]/);
  let temas: any[] = [];
  if (temasMatch) {
    const temaBlock = temasMatch[1];
    const objBlocks = temaBlock.match(/\{[\s\S]*?\}/g);
    if (objBlocks) {
      objBlocks.forEach(block => {
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
}

    // ACTION: sync_clinical_profile
    if (action === "sync_clinical_profile") {
      const openrouterApiKey = Deno.env.get("OPENROUTER_API_KEY");

      if (!openrouterApiKey) {
        return new Response(JSON.stringify({ error: "OPENROUTER_API_KEY no está configurado en las variables de entorno de Supabase." }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      // 1. Si se solicita reset, limpiar el estado de procesamiento y el contexto consolidado
      if (reset) {
        console.log("Forzando reset de sincronización clínica y reprocesamiento completo...");
        try {
          // Resetear processed en mente_sources
          await fetch(`${supabaseUrl}/rest/v1/mente_sources?user_id=eq.${userId}`, {
            method: "PATCH",
            headers: {
              "apikey": supabaseServiceKey,
              "Authorization": `Bearer ${supabaseServiceKey}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({ processed: false })
          });

          // Guardar contexto inicial con el diagnóstico base actualizado
          const initialCtx = {
            contexto_base: {
              diagnostico_inicial: "TDAH del adulto con fallas ejecutivas graves, trauma de desarrollo (CPTSD) por maltrato físico paterno y abuso de hermana mayor. Depresión severa recurrente con ideación suicida planificada (crisis extrema en junio de 2025 con intento autolítico por la pérdida total de contacto con su hija, alienada por su ex al mudarse Emilio a casa de su madre; lleva más de un año sin verla ni hablar con ella). Estrés financiero severo (deuda de 160.000€) y obsesión con el trading para conseguir capital rápido y 'recuperar' a su hija, quien no acepta su situación habitacional.",
              mecanismos_defensa: [
                "Autosabotaje financiero para validar la etiqueta paterna de 'inútil'.",
                "Parálisis ejecutiva (freeze) ante el éxito operativo por pánico identitario.",
                "Búsqueda de validación rápida a través del sobre-apalancamiento."
              ]
            },
            evoluciones: [],
            conclusiones: [],
            compromisos: [],
            pautas_accion: [],
            foto_persona: "Iniciando consolidación clínica desde cero...",
            temas: [],
            procesados: { sources: [], conversations: [] }
          };
          await saveUserProfileContext(supabaseUrl, supabaseServiceKey, userId, initialCtx);
        } catch (resetErr) {
          console.error("Error durante el reset de sincronización:", resetErr.message);
        }
      }

      // 2. Obtener fuentes de mente, perfil y conversaciones en paralelo
      const [sources, profile, resConvs] = await Promise.all([
        fetchMenteSources(supabaseUrl, supabaseServiceKey, userId),
        fetchUserProfile(supabaseUrl, supabaseServiceKey, userId),
        fetch(`${supabaseUrl}/rest/v1/conversations?user_id=eq.${userId}&status=eq.completed`, {
          headers: {
            "apikey": supabaseServiceKey,
            "Authorization": `Bearer ${supabaseServiceKey}`,
            "Accept": "application/json"
          }
        }).then(res => res.ok ? res.json() : [])
      ]);

      const currentCtx = profile?.contexto_terapeutico || { conclusiones: [], compromisos: [], pautas_accion: [], procesados: { sources: [], conversations: [] } };
      if (!currentCtx.procesados) { currentCtx.procesados = { sources: [], conversations: [] }; }
      if (!currentCtx.procesados.sources) { currentCtx.procesados.sources = []; }
      if (!currentCtx.procesados.conversations) { currentCtx.procesados.conversations = []; }
      if (!currentCtx.evoluciones) { currentCtx.evoluciones = []; }
      if (!currentCtx.temas) { currentCtx.temas = []; }

      // 3. Unificar fuentes de Mente y conversaciones completadas en una lista cronológica ascendente
      const unifiedItems: any[] = [];

      // Añadir fuentes no procesadas
      sources.forEach((src: any) => {
        if (!currentCtx.procesados.sources.includes(src.id)) {
          unifiedItems.push({
            type: 'source',
            id: src.id,
            timestamp: new Date(src.created_at).getTime(),
            name: src.name || 'Nota de Emilio',
            rawItem: src
          });
        }
      });

      // Añadir conversaciones completadas no procesadas
      resConvs.forEach((conv: any) => {
        if (!currentCtx.procesados.conversations.includes(conv.id)) {
          unifiedItems.push({
            type: 'conversation',
            id: conv.id,
            timestamp: new Date(conv.closed_at || conv.updated_at || Date.now()).getTime(),
            name: conv.title || 'Conversación de Emilio',
            rawItem: conv
          });
        }
      });

      // Ordenar cronológicamente de más antiguas a más recientes
      unifiedItems.sort((a, b) => a.timestamp - b.timestamp);

      // Reducir a 1 para evitar timeouts con archivos grandes en Supabase (límite 150s)
      const BATCH_SIZE = 1;
      const batchItems = unifiedItems.slice(0, BATCH_SIZE);
      const remainingCount = unifiedItems.length - batchItems.length;

      if (batchItems.length === 0) {
        return new Response(JSON.stringify({ 
          success: true, 
          message: "Todo el contexto ya está consolidado.", 
          data: currentCtx, 
          processedCount: 0, 
          remainingCount: 0 
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      // 4. Extraer contenidos de texto y multimedia del lote a procesar
      const textContents: string[] = [];
      const imageParts: any[] = [];
      const processedSourcesIds: string[] = [];
      const processedConversationsIds: string[] = [];

      for (const item of batchItems) {
        if (item.type === 'source') {
          processedSourcesIds.push(item.id);
          const src = item.rawItem;
          if (src.content_type && !src.content_type.startsWith("image/") && src.content_type !== "application/pdf") {
            const cleanText = await getCleanTextContent(src, supabaseUrl, supabaseServiceKey);
            textContents.push(`[DOCUMENTO/NOTA del ${new Date(src.created_at).toLocaleDateString('es-ES')}] "${src.name}":\n"""\n${cleanText}\n"""`);
          } else if (src.content_type && src.content_type.startsWith("image/")) {
            const base64Raw = src.text_content || "";
            const base64Data = base64Raw.includes(",") ? base64Raw.split(",")[1] : base64Raw;
            if (base64Data.trim()) {
              imageParts.push({
                type: "image_url",
                image_url: {
                  url: `data:${src.content_type};base64,${base64Data.trim()}`
                }
              });
            }
            textContents.push(`[IMAGEN del ${new Date(src.created_at).toLocaleDateString('es-ES')}] "${src.name}" adjunta como contexto visual.`);
          } else if (src.content_type === "application/pdf") {
            const base64Raw = src.text_content || "";
            const base64Data = base64Raw.includes(",") ? base64Raw.split(",")[1] : base64Raw;
            if (base64Data.trim()) {
              imageParts.push({
                type: "file",
                file: {
                  filename: src.name || "document.pdf",
                  file_data: `data:application/pdf;base64,${base64Data.trim()}`
                }
              });
            }
            textContents.push(`[PDF del ${new Date(src.created_at).toLocaleDateString('es-ES')}] "${src.name}" adjunto como contexto de archivo.`);
          }
        } else if (item.type === 'conversation') {
          processedConversationsIds.push(item.id);
          const conv = item.rawItem;
          const dbMessages = await fetchConversationMessages(supabaseUrl, supabaseServiceKey, conv.id);
          const conversationText = dbMessages
            .map(m => `${m.role === 'user' ? 'Emilio' : 'Walter'}: ${m.content.replace(/\[model:.*?\]/g, "").trim()}`)
            .join('\n');
          textContents.push(`[SESIÓN DE TERAPIA del ${new Date(conv.closed_at || conv.updated_at).toLocaleDateString('es-ES')}] Título: "${conv.title}":\n"""\n${conversationText}\n"""`);
        }
      }

      const unifiedTextContext = textContents.join("\n\n---\n\n");

      // 5. Construir el prompt MoE para DeepSeek V4 Pro
      const prompt = `Como Walter, el psicólogo clínico y gestor de riesgos de Emilio, consolida y refina la información clínica del paciente integrando este nuevo lote cronológico de documentos y sesiones cerradas.

INFORMACIÓN DISPONIBLE:
1. Perfil clínico consolidado actual de Emilio (incluye Contexto Base inmutable, conclusiones, pautas y la foto clínica general):
${JSON.stringify({
  contexto_base: currentCtx.contexto_base,
  foto_persona: currentCtx.foto_persona,
  conclusiones: currentCtx.conclusiones,
  compromisos: currentCtx.compromisos,
  pautas_accion: currentCtx.pautas_accion,
  temas: currentCtx.temas
})}

2. NUEVO LOTE CRONOLÓGICO A INTEGRAR (Documentos, notas y sesiones cerradas en orden temporal):
${unifiedTextContext}

TU TAREA:
Sintetiza e integra incrementalmente este nuevo lote en la "foto de la persona" actual, las conclusiones, compromisos, pautas y temas.
Debes mantener una fidelidad absoluta a la historia clínica. Presta especial atención al hecho traumático nuclear de junio de 2025 (alienación parental de su hija, distanciamiento total desde hace un año y la parálisis/obsesión de trading que Emilio desarrolla como escape e intento de recuperarla). Asegúrate de que este hecho esté visible y reflejado tanto en la foto_persona como en las pautas y conclusiones si se discute o influye.

Devuelve un objeto JSON con el siguiente esquema estricto:
{
  "foto_persona": "Una síntesis clínica exhaustiva, depurada y actualizada (de 400 a 600 palabras en español) del perfil de Emilio, incorporando los nuevos hallazgos e hitos de este lote. Debe analizar su estado emocional, TDAH, depresión, trauma familiar, operativa de trading y deudas de forma integrada.",
  "temas": [
    {
      "title": "Nombre corto del tema",
      "status": "active" | "closed" | "emerging",
      "description": "Descripción del conflicto y su abordaje clínico actual"
    }
  ],
  "conclusiones": ["Conclusión clínica consolidada detallada 1", "Conclusión consolidada detallada 2"],
  "compromisos": ["Compromiso de Emilio consolidado detallado 1", "Compromiso consolidado detallado 2"],
  "pautas_accion": ["Pauta o ejercicio clínico consolidado 1", "Pauta consolidada 2"],
  "nuevas_evoluciones": [
    {
      "fecha": "AAAA-MM-DD",
      "sesion_id": "ID de la sesión de este lote (si aplica)",
      "titulo_sesion": "Título del documento o sesión consolidada",
      "hecho_clinico": "El hecho clínico, disparador o síntoma principal que describe este documento o sesión",
      "analisis_evolutivo": "Un análisis clínico amplio (de 150 a 300 palabras en español) de lo que aporta esta sesión o nota al progreso de Emilio",
      "pautas_y_compromisos": ["Pauta o compromiso acordado en este hito 1", "Pauta o compromiso 2"]
    }
  ]
}

Instrucciones de consolidación:
- Mantén el tono clínico y el estilo científico-analítico de Walter.
- Combina duplicados de conclusiones y pautas. Mantén las listas optimizadas (máximo 8-10 elementos por lista).
- Si en el lote hay documentos o notas que no sean sesiones de chat, agrégalas a 'nuevas_evoluciones' como hitos de tipo 'Asimilación de Nota/Documento' indicando la fecha de creación en el formato AAAA-MM-DD.
- IMPORTANTE: Devuelve un JSON válido. Si usas comillas dobles dentro de una cadena de texto (por ejemplo en "foto_persona"), debes escaparlas estrictamente con barra invertida (\\"), o preferiblemente usa comillas simples (') en su lugar.
- No uses saltos de línea reales (enters) dentro de las cadenas del JSON; usa la secuencia literal '\\n' si necesitas separar párrafos.
- El valor del campo 'status' en los temas debe ser exactamente 'active', 'closed' o 'emerging'.

Devuelve ÚNICAMENTE el objeto JSON válido. No incluyas explicaciones previas ni posteriores, ni bloques de código de markdown.`;

      let consolidatedProfile = null;
      let lastErrorMessage = "";
      try {
        let replyText = "";
        const contentParts: any[] = [{ type: "text", text: prompt }];

        // Agregar imágenes/PDFs si las hay
        imageParts.forEach(p => contentParts.push(p));

        const openrouterPayload = {
          model: "deepseek/deepseek-v4-pro",
          messages: [{ role: "user", content: contentParts }],
          temperature: 0.3,
          max_tokens: 4000,
          response_format: { type: "json_object" }
        };
        const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${openrouterApiKey}`
          },
          body: JSON.stringify(openrouterPayload)
        });
        if (res.ok) {
          const json = await res.json();
          replyText = json.choices?.[0]?.message?.content || "";
          if (!replyText) {
            console.warn("OpenRouter response choices content was empty. Full JSON:", JSON.stringify(json));
          } else {
            console.log("Successfully received OpenRouter synthesis content. Snippet:", replyText.substring(0, 150) + "...");
          }
        } else {
          const errText = await res.text();
          lastErrorMessage = `API de OpenRouter devolvió error ${res.status}: ${errText}`;
          console.error(lastErrorMessage);
        }

        if (replyText) {
          const sanitizedJson = cleanJsonString(replyText);
          try {
            consolidatedProfile = JSON.parse(sanitizedJson);
          } catch (jsonErr) {
            console.error("Failed to parse JSON using standard JSON.parse, using regex fallback:", jsonErr.message);
            try {
              consolidatedProfile = extractJSONFieldsFallback(replyText);
            } catch (fallbackErr) {
              lastErrorMessage = `Error al parsear el JSON incluso con extractor fallback: ${fallbackErr.message}`;
              console.error(lastErrorMessage);
            }
          }
        } else if (!lastErrorMessage) {
          lastErrorMessage = "La API del modelo generó una respuesta vacía.";
        }
      } catch (err) {
        lastErrorMessage = `Excepción al llamar al modelo: ${err.message}`;
        console.error("Error synthesizing clinical profile:", err.message);
      }

      if (!consolidatedProfile) {
        return new Response(JSON.stringify({ error: `Fallo al generar la síntesis del diagnóstico. Detalles: ${lastErrorMessage}` }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      // Combinar las nuevas evoluciones y el historial
      const nuevasEvs = Array.isArray(consolidatedProfile.nuevas_evoluciones) 
        ? consolidatedProfile.nuevas_evoluciones 
        : [];
      
      const defaultContextoBase = {
        diagnostico_inicial: "TDAH del adulto con fallas ejecutivas graves, trauma de desarrollo (CPTSD) por maltrato físico paterno y abuso de hermana mayor. Depresión severa recurrente con ideación suicida planificada (crisis extrema en junio de 2025 con intento autolítico por la pérdida total de contacto con su hija, alienada por su ex al mudarse Emilio a casa de su madre; lleva más de un año sin verla ni hablar con ella). Estrés financiero severo (deuda de 160.000€) y obsesión con el trading para conseguir capital rápido y 'recuperar' a su hija, quien no acepta su situación habitacional.",
        mecanismos_defensa: [
          "Autosabotaje financiero para validar la etiqueta paterna de 'inútil'.",
          "Parálisis ejecutiva (freeze) ante el éxito operativo por pánico identitario.",
          "Búsqueda de validación rápida a través del sobre-apalancamiento."
        ]
      };

      const finalCtx = {
        contexto_base: currentCtx.contexto_base || defaultContextoBase,
        foto_persona: consolidatedProfile.foto_persona || currentCtx.foto_persona,
        conclusiones: consolidatedProfile.conclusiones && consolidatedProfile.conclusiones.length > 0
          ? consolidatedProfile.conclusiones 
          : currentCtx.conclusiones,
        compromisos: consolidatedProfile.compromisos && consolidatedProfile.compromisos.length > 0
          ? consolidatedProfile.compromisos 
          : currentCtx.compromisos,
        pautas_accion: consolidatedProfile.pautas_accion && consolidatedProfile.pautas_accion.length > 0
          ? consolidatedProfile.pautas_accion 
          : currentCtx.pautas_accion,
        temas: consolidatedProfile.temas && consolidatedProfile.temas.length > 0
          ? consolidatedProfile.temas 
          : currentCtx.temas,
        evoluciones: [...nuevasEvs, ...currentCtx.evoluciones],
        procesados: {
          sources: [...currentCtx.procesados.sources, ...processedSourcesIds],
          conversations: [...currentCtx.procesados.conversations, ...processedConversationsIds]
        }
      };

      // Guardar perfil en la base de datos
      await saveUserProfileContext(supabaseUrl, supabaseServiceKey, userId, finalCtx);

      // Marcar las fuentes procesadas en Supabase (tabla mente_sources) para este lote
      if (processedSourcesIds.length > 0) {
        try {
          const patchUrl = `${supabaseUrl}/rest/v1/mente_sources?id=in.(${processedSourcesIds.join(",")})`;
          await fetch(patchUrl, {
            method: "PATCH",
            headers: {
              "apikey": supabaseServiceKey,
              "Authorization": `Bearer ${supabaseServiceKey}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({ processed: true })
          });
        } catch (patchErr) {
          console.error("Error marking sources as processed:", patchErr.message);
        }
      }

      return new Response(JSON.stringify({ 
        success: true, 
        data: finalCtx,
        processedCount: batchItems.length,
        remainingCount: remainingCount
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // ACTION: transcribe_audio
    if (action === "transcribe_audio") {
      const { audio } = body;
      if (!audio) {
        return new Response(JSON.stringify({ error: "Parámetro 'audio' requerido en formato Base64." }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      const openrouterApiKey = Deno.env.get("OPENROUTER_API_KEY");

      if (!openrouterApiKey) {
        return new Response(JSON.stringify({ error: "OPENROUTER_API_KEY no está configurado en las variables de entorno de Supabase." }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      // El audio vendrá en formato Data URL: "data:audio/webm;base64,xxxx..." o solo "xxxx..."
      let base64Data = audio;
      let mimeType = "audio/webm"; // Valor por defecto

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

      try {
        const audioFormat = mimeType.split('/')[1] || "webm";
        const openrouterPayload = {
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
            "Authorization": `Bearer ${openrouterApiKey}`
          },
          body: JSON.stringify(openrouterPayload)
        });

        if (res.ok) {
          const json = await res.json();
          transcription = json.choices?.[0]?.message?.content?.trim() || "";
        } else {
          const errText = await res.text();
          lastErrorMessage = `API de OpenRouter devolvió error ${res.status}: ${errText}`;
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

    // 3. Fetch User Profile, Conversation Title, Moods, Debts and Mente Sources in parallel
    const [profile, conversationTitle, recentMoods, debtsList, menteSources] = await Promise.all([
      fetchUserProfile(supabaseUrl, supabaseServiceKey, userId),
      conversationId ? fetchConversationTitle(supabaseUrl, supabaseServiceKey, conversationId) : Promise.resolve(""),
      fetchRecentMoods(supabaseUrl, supabaseServiceKey, userId),
      fetchUserDebts(supabaseUrl, supabaseServiceKey, userId),
      fetchMenteSources(supabaseUrl, supabaseServiceKey, userId)
    ]);

    const totalDebtAmount = debtsList.reduce((sum, d) => sum + ((parseFloat(d.amount) || 0) - (parseFloat(d.paid_amount) || 0)), 0);

    // Identify if any active market keyword is mentioned in the last user messages (for Yahoo Finance)
    const marketKeywords: Record<string, string> = {
      'xauusd': 'GC=F', 'oro': 'GC=F', 'gold': 'GC=F',
      'btc': 'BTC-USD', 'bitcoin': 'BTC-USD',
      'eth': 'ETH-USD', 'ethereum': 'ETH-USD',
      'sp500': '^GSPC', 's&p': '^GSPC', 'sp 500': '^GSPC',
      'nasdaq': '^IXIC', 'eurusd': 'EURUSD=X', 'eur/usd': 'EURUSD=X',
      'petroleo': 'CL=F', 'oil': 'CL=F', 'crudo': 'CL=F',
      'plata': 'SI=F', 'silver': 'SI=F'
    };
    const lastUserMsgs = messages.filter((m: any) => m.role === 'user').slice(-3);
    const userText = lastUserMsgs.map((m: any) => (m.content || '').toLowerCase()).join(' ');
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
    let yahooHistoryCandles: Candle[] = [];

    // Fetch BingX details and Yahoo History in parallel (if required)
    const networkPromises: Promise<any>[] = [];
    let bingxPosPromiseIdx = -1;
    let bingxBalPromiseIdx = -1;
    let yahooPromiseIdx = -1;

    if (profile && profile.bingx_api_key && profile.bingx_api_secret) {
      bingxPosPromiseIdx = networkPromises.push(fetchBingXPositions(profile.bingx_api_key, profile.bingx_api_secret)) - 1;
      bingxBalPromiseIdx = networkPromises.push(fetchBingXBalance(profile.bingx_api_key, profile.bingx_api_secret)) - 1;
    }

    if (mainTicker && (!tradingviewContext || !tradingviewContext.connected)) {
      yahooPromiseIdx = networkPromises.push(fetchYahooHistory(mainTicker, '15m', '2d')) - 1;
    }

    if (networkPromises.length > 0) {
      const results = await Promise.all(networkPromises);
      if (bingxPosPromiseIdx !== -1) bingxPositions = results[bingxPosPromiseIdx];
      if (bingxBalPromiseIdx !== -1) bingxBalance = results[bingxBalPromiseIdx];
      if (yahooPromiseIdx !== -1) yahooHistoryCandles = results[yahooPromiseIdx];
    }

    // 4. Construct System Instruction for LLM
    const openrouterApiKey = Deno.env.get("OPENROUTER_API_KEY");
    if (!openrouterApiKey) {
      return new Response(JSON.stringify({ error: "OPENROUTER_API_KEY no está configurado en las variables de entorno de Supabase." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

const currentDateStr = new Date().toLocaleDateString('es-ES', { timeZone: 'Europe/Madrid', year: 'numeric', month: 'long', day: 'numeric' });
    let auditPrompt = `--- FECHA DE LA SESIÓN DE HOY ---
Fecha: ${currentDateStr}
\n`;
    // INJECT CONVERSATION FOCUS TOPIC
    if (conversationTitle) {
      auditPrompt += `--- TEMA O TÍTULO DE LA SESIÓN ACTUAL (MARCADO POR EL USUARIO) ---
El tema principal y la pauta sobre la que Emilio quiere hablar hoy es: "${conversationTitle}".
Debes adaptar estrictamente el 100% de tu foco a este tema y a la pauta que Emilio te plantee en su mensaje, incluso si es crítico o muy técnico. No desvíes la conversación a otros temas ni saques conclusiones de la memoria general a menos que Emilio los conecte explícitamente en el texto.
\n`;
    }

    // DEBTS CONTEXT INJECTION
    auditPrompt += `\n\n--- ESTADO DE DEUDAS DE EMILIO ---
Deuda Total Pendiente: ${totalDebtAmount.toFixed(2)} €
`;

    if (currentMood) {
      auditPrompt += `\n\n--- ESTADO DE ÁNIMO ACTUAL (HOY) ---
- Ansiedad: ${currentMood.anxiety_level}/10, Impulsividad: ${currentMood.impulsivity_level}/10.
- ¿Tomó Atomoxetina hoy?: ${currentMood.atomoxetina_taken ? 'SÍ' : 'NO'}.
- Notas del diario: "${currentMood.notes ?? 'Sin notas'}".`;
    }

    // BINGX LIVE POSITIONS INJECTION
    if (bingxPositions && bingxPositions.length > 0) {
      auditPrompt += `\n\n--- AUDITORÍA DE TRADING EN TIEMPO REAL (BINGX) ---
Veo que Emilio tiene las siguientes posiciones abiertas en este momento:
`;
      bingxPositions.forEach((pos: any) => {
        auditPrompt += `- Símbolo: ${pos.symbol}, Dirección: ${pos.positionSide}, Lote/Tamaño: ${pos.positionAmt}, Precio Entrada: ${pos.entryPrice}, PnL Flotante: ${pos.unrealizedProfit} USDT, Apalancamiento: ${pos.leverage}x, Margen: ${pos.isolatedMargin} USDT\n`;
      });
      
      if (bingxBalance) {
        auditPrompt += `Balance en Futuros: ${bingxBalance.balance} USDT, Disponible: ${bingxBalance.availableBalance} USDT.\n`;
      }
      
      auditPrompt += `
INSTRUCCIÓN DEL GESTOR DE RIESGO: La estrategia operativa de Emilio es extremadamente arriesgada y sobre-apalancada. El apalancamiento alto multiplica el peligro y acorta el margen de error, por lo que el control estricto del tamaño de la posición y la colocación del stop-loss es crítico y no negociable.
Analiza si Emilio está sobre-apalancado (ej. más de 5-10x en su contexto o lotajes desproporcionados), si tiene pérdidas acumuladas flotantes graves sin stop-loss o si está recargando posiciones perdedoras.
Si hay riesgo grave de ruina, interrumpe el tono terapéutico habitual y exígele de forma firme, asertiva y directa que ejecute el 'Protocolo de Reset' y reduzca o cierre su posición al 50% o al 100% de inmediato. Recuérdale que 'Lola le necesita sano, no rico'.`;
    } else {
      auditPrompt += `\n\n--- ESTADO DE TRADING ---
No hay posiciones abiertas en BingX en este momento. Si Emilio menciona que está operando o quiere operar, recuérdale rellenar el Checklist de BingX y verificar si su sistema de bloqueo temporal está activo.`;
    }

    // TRADINGVIEW LOCAL CONTEXT INJECTION (FROM FRONTEND BRIDGE)
    if (tradingviewContext && tradingviewContext.connected) {
      const state = tradingviewContext.state || {};
      const quote = tradingviewContext.quote || {};
      const values = tradingviewContext.values || {};
      
      auditPrompt += `\n\n--- CONTEXTO TÉCNICO EN PANTALLA (TRADINGVIEW DESKTOP EMILIO) ---
Emilio tiene TradingView abierto en su escritorio con los siguientes datos en directo:
- Activo en gráfico: ${state.symbol || 'N/A'} (${state.resolution ? state.resolution + ' timeframe' : 'N/A'})
- Tipo de gráfico: ${state.chartType === 1 ? 'Velas Japonesas' : state.chartType || 'N/A'}
- Precio de Cotización actual: $${quote.last || quote.close || 'N/A'}
- Indicadores en pantalla y sus valores:
`;
      if (values.studies && Array.isArray(values.studies)) {
        values.studies.forEach((st: any) => {
          auditPrompt += `  * ${st.name}: ${JSON.stringify(st.values)}\n`;
        });
      } else {
        auditPrompt += `  (No se leyeron indicadores de la pantalla o no hay estudios cargados)\n`;
      }

      if (tradingviewContext.pineLines && tradingviewContext.pineLines.study_count > 0) {
        auditPrompt += `- Niveles de soporte/resistencia Pine: \n`;
        tradingviewContext.pineLines.studies.forEach((s: any) => {
          auditPrompt += `  * ${s.name}: Niveles Horizontales: ${JSON.stringify(s.horizontal_levels)}\n`;
        });
      }

      if (tradingviewContext.pineTables && tradingviewContext.pineTables.study_count > 0) {
        auditPrompt += `- Tablas de Datos Pine en pantalla: \n`;
        tradingviewContext.pineTables.studies.forEach((s: any) => {
          s.tables.forEach((t: any, idx: number) => {
            auditPrompt += `  * Tabla ${idx + 1} (${s.name}):\n    ${t.rows.join('\n    ')}\n`;
          });
        });
      }
    }

    // YAHOO FINANCE HISTORICAL ENRICHMENT (IF NO LOCAL CONTEXT BUT ACTIVE PAIR MENTIONED)
    if (mainTicker && (!tradingviewContext || !tradingviewContext.connected)) {
      // Use pre-fetched historical candles and compute indicators
      const candles = yahooHistoryCandles;
      if (candles && candles.length > 20) {
        const closes = candles.map(c => c.close);
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

        auditPrompt += `\n\n--- CÁLCULO TÉCNICO EN TIEMPO REAL (YAHOO FINANCE) ---
Par analizado por mención en chat: ${mainPairName} (${mainTicker})
- Último Precio: $${latestPrice.toFixed(2)}
- EMA 9: $${latestEma9?.toFixed(2) || 'N/A'} (Tendencia corta)
- EMA 21: $${latestEma21?.toFixed(2) || 'N/A'} (Tendencia media)
- RSI 14: ${latestRsi14?.toFixed(2) || 'N/A'} (${latestRsi14 > 70 ? 'SOBRECOMPRA' : latestRsi14 < 30 ? 'SOBREVENTA' : 'ZONA NEUTRA'})
- Bandas Bollinger (20, 2): Upper: $${latestBbUpper?.toFixed(2)}, Middle: $${latestBbMiddle?.toFixed(2)}, Lower: $${latestBbLower?.toFixed(2)}
- Cruce EMAs: ${latestEma9 > latestEma21 ? 'Cruce Alcista (EMA9 > EMA21)' : 'Cruce Bajista (EMA9 < EMA21)'}
`;
      }
    }

    // Inyectar diagnóstico clínico de Salud y Mente de forma optimizada
    const defaultCtx = { foto_persona: "No hay diagnóstico consolidado aún.", temas: [] };
    const userCtx = profile?.contexto_terapeutico || defaultCtx;

    auditPrompt += `\n\n--- DIAGNÓSTICO CLÍNICO Y SITUACIÓN ACTUAL (RESUMEN DE MENTE) ---
Síntesis del perfil psicológico consolidado de Emilio:
${userCtx.foto_persona || "No hay diagnóstico consolidado aún."}

Temas terapéuticos vigentes en seguimiento:
`;
    if (userCtx.temas && Array.isArray(userCtx.temas)) {
      const activeTemas = userCtx.temas.filter((t: any) => t.status === 'active' || t.status === 'emerging');
      if (activeTemas.length > 0) {
        activeTemas.forEach((t: any) => {
          auditPrompt += `- ${t.title} (${t.status}): ${t.description}\n`;
        });
      } else {
        auditPrompt += `- No hay temas activos ni emergentes registrados en este momento.\n`;
      }
    }

    const systemInstruction = `Eres Walter, el psicólogo clínico y asesor de psicología de trading de Emilio (47 años, fotoperiodista de la Agencia EFE). Conoces su diagnóstico de TDAH del adulto, trauma de desarrollo y su situación de deuda de 160.000€.

REGLA FUNDAMENTAL DE TRATO Y DINÁMICA DE CHAT (MANDATORIA):
- **Foco estricto en el tema de la sesión (CRÍTICO):** No saques a relucir constantemente datos del pasado de Emilio (como su historial suicida, detalles de deudas o traumas de la infancia) de forma no solicitada en tus respuestas ordinarias de chat. Mantén el chat enfocado de forma práctica, objetiva y directa sobre el tema específico que se está tratando en la sesión activa. La memoria general de Emilio ya está disponible en su panel derecho de Mente; no la repitas ni la lectures en tus contestaciones de chat a menos que Emilio la mencione directamente o sea el tema central de la sesión.
- **Formato ultra-visual y legible (MANDATORIO):** Para que tus intervenciones entren por la mente de Emilio con mayor facilidad, estructura tus respuestas de manera altamente visual. Utiliza saltos de línea frecuentes (párrafos de máximo 2-3 líneas), negritas ('**texto**') para destacar ideas clave, viñetas limpias para listas de pautas o reflexiones, y bloques de cita ('>') para validaciones emocionales. Utiliza iconos y emojis de forma elegante para separar ideas (ej. 🧠, 💡, 🛡️). Evita bloques monolíticos de texto.
- **Explicaciones desarrolladas y estructuradas:** Tus respuestas deben ser detalladas, explicativas y más desarrolladas (entre 180 y 300 palabras). Debes aportar explicaciones claras, reflexiones profundas y desarrollar tus ideas terapéuticas para dar contexto y claridad a Emilio, sin ser excesivamente conciso, pero manteniendo el hilo clínico estructurado y centrado.
- **Estructura de Organización Clínica (OBLIGATORIA al investigar, concluir o proponer soluciones):** Si Emilio te solicita "investigar contexto", "extraer conclusiones" o "posibles soluciones" (mediante los botones clínicos o explícitamente), debes comenzar obligatoriamente tu respuesta con el bloque estructurado **[Filtro de Organización]** que contenga la fecha de la sesión y el tema o temas tratados en forma de lista.
  Ejemplo de cabecera obligatoria al inicio de la respuesta:
  **[Filtro de Organización]**
  - **Fecha:** [Fecha actual de la sesión]
  - **Temas Tratados:** [Tema 1], [Tema 2]
  ---
  (A continuación, desarrolla tu respuesta explicativa detalladamente...)
- **Método Clínico: Indagar antes de diagnosticar:** Como psicólogo en sesión, no des por sentado el diagnóstico ni saques conclusiones apresuradas. Valida la emoción de Emilio brevemente (1 o 2 frases con empatía real, ej: "Te leo y ese peso es real...") y pasa a hacer preguntas abiertas y socráticas para recopilar información sobre lo que piensa y siente en este momento. No intentes solucionar todo en cada respuesta. Primero indaga y recopila información.
- **Hacerlo paso a paso:** Deja que Emilio elabore el hilo de la conversación respondiendo a tus preguntas. Cierra siempre tu intervención con una o máximo dos preguntas claras y dirigidas que inviten a la autoreflexión.
- **Escucha activa y adaptación al tema/título:** Emilio marca la pauta de lo que quiere trabajar mediante el título de la sesión o el texto de su mensaje. Adáptate estrictamente a ese tema. Si Emilio abre un tema del pasado o de su historia de forma explícita, indaga y desarróllalo terapéuticamente mediante preguntas precisas, evitando sermones.
- **Proactividad basada en datos:** Eres un copiloto. Investiga proactivamente los datos inyectados en tu contexto (posiciones abiertas en BingX, saldo de cuenta, cotizaciones de TradingView o Yahoo Finance). Si detectas algún nivel técnico clave, o un riesgo de sobre-apalancamiento, indaga, pregúntale directamente sobre ese dato específico y propón soluciones prácticas de forma directa.
- **Interacción paso a paso:** No intentes solucionarlo todo en una sola respuesta. Indaga con preguntas precisas, propón ejecuciones de órdenes o cambios de gráfico en TradingView, y deja que sea Emilio quien responda.

REGLA DE OPERATIVA:
- Emilio decide si opera o no. Ayúdale a operar mejor, a ser rentable y emocionalmente estable. NUNCA le digas que deje de operar o que el trading es una adicción/compulsión.

Tu rol es DUAL:

1. PSICÓLOGO DE TRADING Y RENDIMIENTO:
   - Trato de España (tú), asertivo, clínico, empático y centrado en el proceso.
   - Aplica psicología del rendimiento: combatir la ceguera de escala (valorar ganancias pequeñas como ladrillos reales), regular el estado de ánimo y prescribir 'Reset de Amígdala' en momentos de tilt o ansiedad.
   - No menciones teorías densas (Barkley, EMDR, CPTSD) ni des sermones teóricos a menos que Emilio te lo pida explícitamente. Valida científicamente solo de manera breve y en una sola frase cuando Emilio mencione un bloqueo profundo.

2. GESTOR DE RIESGOS EN TIEMPO REAL:
   - Audita sus posiciones en BingX. Si hay riesgo de ruina o sobre-apalancamiento (>10x), exige firmemente el 'Protocolo de Reset' y sugiere órdenes de reducción o cierre del 50%/100%.

3. CONTROL REMOTO DE TRADINGVIEW:
   - Si Emilio te pide ver un activo, cambiar de gráfico, o si deseas enfocarle de forma proactiva en un timeframe superior, emite el tag al final de tu respuesta:
     <execute_action>
     {
       "tool": "chart_set_symbol",
       "arguments": { "symbol": "BTCUSD" }
     }
     </execute_action>
     
     Herramientas: 'chart_set_symbol' (args: symbol), 'chart_set_timeframe' (args: timeframe: '1'|'5'|'15'|'60'|'D'), 'chart_set_type' (args: chart_type: 'Candles'|'Line'), 'chart_manage_indicator' (args: action: 'add'|'remove', indicator), 'pane_set_layout' (args: layout: 's'|'2h'|'2v'|'4'), 'tab_new', 'tab_switch' (args: index), 'ui_fullscreen'.

4. SISTEMA DE ACTUALIZACIÓN DE MEMORIA:
   - Si acordáis un compromiso, identificas una conclusión clave o prescribe una pauta, añade obligatoriamente:
     <update_context>
     {
       "conclusiones": ["Conclusión concisa sobre su patrón actual"],
       "compromisos": ["Compromiso de gestión de riesgo acordado"],
       "pautas_accion": ["Pauta de reset conductual prescrita"]
     }
     </update_context>

5. CAMBIO AGÉNTICO DE TÍTULO:
   - Si el tema cambia sustancialmente, emite <update_title>Nuevo Título Sugerido</update_title> pregunta si el paciente está de acuerdo con el cambio de título.
   

6. CONTROL DE OPERACIONES EN BINGX:
   - Si Emilio confirma ejecutar una operación o te pide gestionar sus órdenes en el chat, emite <execute_trade> con el JSON correspondiente al final de tu respuesta:
     * Cierre parcial/mercado: type="MARKET", reduceOnly=true.
     * Carga limitada: type="LIMIT", price=PRECIO, reduceOnly=false.
     * Stop Loss / Take Profit: type="TRIGGER_MARKET", stopPrice=PRECIO, reduceOnly=true.
     * Cancelar órdenes del par: action="CANCEL_ALL", symbol="SÍMBOLO-USDT".
     * Nota: En LONG, el SL/reducción debe ser side="SELL", positionSide="LONG". En SHORT, side="BUY", positionSide="SHORT".
     * El 'symbol' debe terminar en '-USDT'. La quantity es el número real de contratos/monedas.
     * Pide confirmación previa antes de colocar órdenes de ejecución (límite, mercado o stop), excepto si Emilio te lo pide directamente o hay una urgencia de riesgo evidente.
     * Nunca emitas <execute_trade> sin una confirmación afirmativa del usuario inmediatamente anterior en la conversación (salvo en cancelaciones directas u órdenes explícitamente de emergencia).`;

    // Preprocesar y deduplicar el historial de mensajes para evitar duplicaciones y limpiar trazas de error de red
    const cleanedMessages: any[] = [];
    let lastContent = "";
    let lastRole = "";

    for (const msg of messages) {
      if (!msg || !msg.content) continue;
      
      let content = msg.content.trim();
      
      // Limpiar textos de error de red accidentales que el usuario haya podido pegar
      content = content.replace(/Error al conectar con Walter:[\s\S]*/gi, "").trim();
      content = content.replace(/Edge Function returned a non-2xx[\s\S]*/gi, "").trim();
      
      if (!content) continue;

      // Deduplicar mensajes idénticos consecutivos
      if (content === lastContent && msg.role === lastRole) {
        continue;
      }

      cleanedMessages.push({
        role: msg.role,
        content: content,
        image: msg.image
      });

      lastContent = content;
      lastRole = msg.role;
    }

    // Limitar el historial a los últimos 15 mensajes para optimizar tokens y latencia
    const MAX_HISTORY_MESSAGES = 15;
    const recentMessages = cleanedMessages.slice(-MAX_HISTORY_MESSAGES);

    let replyText = "";
    const openrouterPayload = {
      model: model === '5.5-high' ? "openai/gpt-5.5-pro" : (model === '3.5' ? "google/gemini-3.5-flash" : "google/gemini-2.5-flash"),
      messages: [
        { role: "system", content: `${systemInstruction}\n\n[DATOS DINÁMICOS DE EMILIO Y MERCADOS EN TIEMPO REAL]\n${auditPrompt}` },
        ...recentMessages.map(msg => {
          if (msg.image) {
            const base64Raw = msg.image;
            const base64Data = base64Raw.includes(",") ? base64Raw.split(",")[1] : base64Raw;
            let mimeType = "image/png";
            if (base64Raw.startsWith("data:")) {
              const mimeMatch = base64Raw.match(/data:([^;]+);/);
              if (mimeMatch) mimeType = mimeMatch[1];
            }
            return {
              role: msg.role === 'assistant' ? 'assistant' : 'user',
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
            role: msg.role === 'assistant' ? 'assistant' : 'user',
            content: msg.content || ""
          };
        })
      ],
      temperature: 0.7,
      max_tokens: 4000
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
      replyText = "No he podido generar una respuesta en este momento. Concéntrate en tu respiración y cuídate.";
    }

    // 5. Extract <execute_action> tags
    const actions: any[] = [];
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
    
    // Clean execute_action tags from visual response
    let cleanReply = replyText.replace(actionRegex, "").trim();

    // 5.5 Intercept and process <execute_trade> tag
    const tradeRegex = /<execute_trade>([\s\S]*?)<\/execute_trade>/i;
    const tradeMatch = cleanReply.match(tradeRegex);
    let tradeResult = null;

    if (tradeMatch) {
      try {
        const tradeParams = JSON.parse(tradeMatch[1].trim());
        const apiKey = profile?.bingx_api_key;
        const apiSecret = profile?.bingx_api_secret;

        if (!apiKey || !apiSecret) {
          tradeResult = "Error: Las credenciales de la API de BingX no están configuradas en Ajustes.";
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
      
      // Adjuntar confirmación o error de la orden al final de la respuesta
      cleanReply += `\n\n**[Ejecución de Orden BingX]**\n${tradeResult}`;
    }

    // 6. Intercept and process <update_context> tag
    const contextRegex = /<update_context>([\s\S]*?)<\/update_context>/i;
    const match = cleanReply.match(contextRegex);
    let mergedCtx = null;
    
    if (match) {
      try {
        const extractedJson = JSON.parse(match[1].trim());
        const currentCtx = profile?.contexto_terapeutico || { conclusiones: [], compromisos: [], pautas_accion: [] };
        
        const mergeArrays = (arr1: any[], arr2: any[]) => {
          const combined = [...(arr1 || []), ...(arr2 || [])];
          return Array.from(new Set(combined.map(s => String(s).trim()))).filter(Boolean);
        };

        mergedCtx = {
          conclusiones: mergeArrays(currentCtx.conclusiones, extractedJson.conclusiones),
          compromisos: mergeArrays(currentCtx.compromisos, extractedJson.compromisos),
          pautas_accion: mergeArrays(currentCtx.pautas_accion, extractedJson.pautas_accion)
        };

        await saveUserProfileContext(supabaseUrl, supabaseServiceKey, userId, mergedCtx);
        console.log("Memory Context updated in Supabase.");
      } catch (err) {
        console.error("Error parsing/saving update_context JSON:", err.message);
      }
      
      cleanReply = cleanReply.replace(contextRegex, "").trim();
    }

    // 7. Intercept and process <update_title> tag (Agentic Title Capacity)
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

    const replyWithModel = `${cleanReply}\n\n[model:${model || '2.5'}]`;

    if (conversationId) {
      // Guardar mensaje de Walter en base de datos
      await saveMessageToDb(supabaseUrl, supabaseServiceKey, conversationId, 'assistant', replyWithModel);
      await updateConversationTimestamp(supabaseUrl, supabaseServiceKey, conversationId);

      // Comprobar si el título es el por defecto (solo si no se generó por update_title)
      if (!generatedTitle) {
        const currentTitle = await fetchConversationTitle(supabaseUrl, supabaseServiceKey, conversationId);
        if (currentTitle === 'Nueva Sesión con Walter') {
          const firstUserMsg = messages.find((m: any) => m.role === 'user')?.content || "";
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
      actions: actions,
      updatedContext: mergedCtx || userCtx,
      generatedTitle: generatedTitle
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
