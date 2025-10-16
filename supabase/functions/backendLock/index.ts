// supabase/functions/backendLock/index.ts

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { crypto } from "https://deno.land/std@0.177.0/crypto/mod.ts";

// --- Service Configuration (TTLock) ---
const CLIENT_ID = "df9cc9624a0645deb4321f184d63abd6";
const CLIENT_SECRET = "022541df64527d48d0499df4b5ee72e7";
const TTLOCK_API_URL = "https://euapi.ttlock.com";

// ADDED: Define CORS headers in one place for consistency.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper function to create Supabase client
const getSupabaseClient = (req: Request) => {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: req.headers.get("Authorization")! } } }
  );
};

// --- Token Management (using Supabase DB) ---
// (No changes in this section)
async function loadTokens(supabase: any) {
  const { data, error } = await supabase
    .from("lock_tokens")
    .select("*")
    .eq("id", 1)
    .single();

  if (error || !data) {
    console.log("No tokens found in DB or error:", error?.message);
    return null;
  }
  return data;
}

async function saveTokens(supabase: any, tokens: any) {
  const record = {
    id: 1,
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    uid: tokens.uid,
    openid: tokens.openid,
    scope: tokens.scope,
    token_type: tokens.token_type,
    expires_in: tokens.expires_in,
    expires_at: tokens.expires_at,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase.from("lock_tokens").upsert(record);
  if (error) {
    console.error("Error saving tokens:", error);
    throw error;
  }
}

function tokenExpired(tokens: any) {
  if (!tokens || !tokens.expires_at) return true;
  return Date.now() > tokens.expires_at;
}

async function requestAccessTokenWithPassword(supabase: any, username: string, passwordPlain: string) {
  const passwordData = new TextEncoder().encode(passwordPlain);
  const hashBuffer = await crypto.subtle.digest("MD5", passwordData);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const md5Password = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

  const params = new URLSearchParams();
  params.append("clientId", CLIENT_ID);
  params.append("clientSecret", CLIENT_SECRET);
  params.append("username", username);
  params.append("password", md5Password);

  console.log(`Requesting access token for username: ${username}`);
  const res = await fetch(`${TTLOCK_API_URL}/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-form-urlencoded" },
    body: params.toString(),
  });

  const data = await res.json();
  if (!res.ok) {
    console.error("Failed to get access token:", data);
    throw new Error(data.description || "Failed to get access token");
  }

  const expires_at = Date.now() + data.expires_in * 1000 - 5 * 60 * 1000;
  const tokensToSave = { ...data, expires_at };
  await saveTokens(supabase, tokensToSave);
  console.log("Successfully fetched and saved new tokens.");
  return tokensToSave;
}

async function refreshAccessToken(supabase: any, refreshToken: string) {
  const params = new URLSearchParams();
  params.append("clientId", CLIENT_ID);
  params.append("clientSecret", CLIENT_SECRET);
  params.append("grant_type", "refresh_token");
  params.append("refresh_token", refreshToken);

  const res = await fetch(`${TTLOCK_API_URL}/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-form-urlencoded" },
    body: params.toString(),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.description || "Failed to refresh token");

  const expires_at = Date.now() + data.expires_in * 1000 - 5 * 60 * 1000;
  const tokensToSave = { ...data, expires_at };
  await saveTokens(supabase, tokensToSave);
  return tokensToSave;
}

async function ensureAccessToken(supabase: any) {
  const currentTokens = await loadTokens(supabase);
  if (!currentTokens) {
    console.log("No token found in DB. Using HARDCODED credentials for login.");
    const username = "santosimmanuel3@gmail.com";
    const password = "1Chthus2018*";
    return await requestAccessTokenWithPassword(supabase, username, password);
  }

  if (tokenExpired(currentTokens)) {
    console.log("Token expired, refreshing...");
    return await refreshAccessToken(supabase, currentTokens.refresh_token);
  }
  return currentTokens;
}

// --- Centralized API Request Helper ---
// (No changes in this section)
async function lockApiRequest(supabase: any, method: string, endpoint: string, data = {}) {
  const tokens = await ensureAccessToken(supabase);
  const requestData: Record<string, any> = {
    clientId: CLIENT_ID,
    accessToken: tokens.access_token,
    date: Date.now(),
    ...data,
  };

  const url = new URL(`${TTLOCK_API_URL}${endpoint}`);
  let response;

  if (method.toUpperCase() === "GET") {
    Object.keys(requestData).forEach(key => url.searchParams.append(key, requestData[key]));
    response = await fetch(url.toString(), { method: "GET" });
  } else {
    const params = new URLSearchParams();
    for (const key in requestData) {
      params.append(key, requestData[key]);
    }
    response = await fetch(url.toString(), {
      method: "POST",
      headers: { "Content-Type": "application/x-form-urlencoded" },
      body: params.toString(),
    });
  }

  const responseData = await response.json();

  if (responseData.errcode && responseData.errcode !== 0) {
    throw new Error(responseData.errmsg || `TTLock API Error with code: ${responseData.errcode}`);
  }

  return responseData;
}


// --- Main Server Logic ---
serve(async (req) => {
  const url = new URL(req.url);
  const path = url.pathname.replace(/^\/functions\/v1\//, "/");
  
  // CHANGED: Handle preflight OPTIONS requests for all routes.
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabase = getSupabaseClient(req);

  try {
    // --- AUTH ROUTE ---
    if (path === "/backendLock/login") {
        const { username, password } = await req.json();
        if (!username || !password) {
            // CHANGED: Added corsHeaders
            return new Response(JSON.stringify({ error: "username and password required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        const tokens = await requestAccessTokenWithPassword(supabase, username, password);
        // CHANGED: Added corsHeaders
        return new Response(JSON.stringify({ ok: true, uid: tokens.uid, expires_at: tokens.expires_at }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }


    
    // --- ADDED: GATEWAY ROUTES ---

    // GET /gateways - List all gateways
    if (path === "/backendLock/gateways" && req.method === "GET") {
        const data = await lockApiRequest(supabase, "GET", "/v3/gateway/list", { pageNo: 1, pageSize: 50 });
        // CHANGED: Added corsHeaders
        return new Response(JSON.stringify(data), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // POST /gateways/rename - Rename a gateway
    if (path === "/backendLock/gateways/rename" && req.method === "POST") {
        const { gatewayId, gatewayName } = await req.json();
        if (!gatewayId || !gatewayName) {
            // CHANGED: Added corsHeaders
            return new Response(JSON.stringify({ error: "gatewayId and gatewayName are required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        const data = await lockApiRequest(supabase, "POST", "/v3/gateway/rename", { gatewayId, gatewayName });
        // CHANGED: Added corsHeaders
        return new Response(JSON.stringify(data), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Handle dynamic routes like /gateways/12345 and /gateways/12345/locks
    const gatewayMatch = path.match(/^\/backendLock\/gateways\/(\d+)(\/locks)?$/);
    if (gatewayMatch) {
      const gatewayId = parseInt(gatewayMatch[1]);
      const isLocksRoute = gatewayMatch[2] === '/locks';

      // DELETE /gateways/:gatewayId - Delete a gateway
      if (!isLocksRoute && req.method === 'DELETE') {
        const data = await lockApiRequest(supabase, "POST", "/v3/gateway/delete", { gatewayId });
        // CHANGED: Added corsHeaders
        return new Response(JSON.stringify(data), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // GET /gateways/:gatewayId/locks - List locks for a specific gateway
      if (isLocksRoute && req.method === 'GET') {
        const data = await lockApiRequest(supabase, "GET", "/v3/gateway/listLock", { gatewayId });
        // CHANGED: Added corsHeaders
        return new Response(JSON.stringify(data), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }
    // --- END OF ADDED GATEWAY ROUTES ---
      
    // --- LOCK ROUTES ---
    // GET /locks - List all door locks
    if (path === "/backendLock/locks" && req.method === "GET") {
        const data = await lockApiRequest(supabase, "GET", "/v3/lock/list", { pageNo: 1, pageSize: 100 });
        // CHANGED: Added corsHeaders
        return new Response(JSON.stringify(data), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // --- START OF NEWLY ADDED IC CARD ROUTES ---

    // POST /locks/:lockId/cards/clear
    const clearCardsMatch = path.match(/^\/backendLock\/locks\/(\d+)\/cards\/clear$/);
    if (clearCardsMatch && req.method === "POST") {
      const lockId = parseInt(clearCardsMatch[1]);
      const data = await lockApiRequest(supabase, "POST", "/v3/identityCard/clear", { lockId });
      return new Response(JSON.stringify(data), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Matches /locks/:lockId/cards/:cardId
    const specificCardMatch = path.match(/^\/backendLock\/locks\/(\d+)\/cards\/(\d+)$/);
    if (specificCardMatch) {
      const lockId = parseInt(specificCardMatch[1]);
      const cardId = parseInt(specificCardMatch[2]);

      // DELETE /locks/:lockId/cards/:cardId
      if (req.method === "DELETE") {
        const data = await lockApiRequest(supabase, "POST", "/v3/identityCard/delete", {
          lockId,
          cardId,
          deleteType: 2, // 2 = via gateway
        });
        return new Response(JSON.stringify(data), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // PUT /locks/:lockId/cards/:cardId
      if (req.method === "PUT") {
        const { cardName, startDate, endDate } = await req.json();
        const payload: Record<string, any> = { lockId, cardId };
        if (cardName) payload.cardName = cardName;
        if (startDate !== undefined) payload.startDate = startDate;
        if (endDate !== undefined) payload.endDate = endDate;
        
        // Use the TTLock 'update' endpoint
        const data = await lockApiRequest(supabase, "POST", "/v3/identityCard/update", payload);
        return new Response(JSON.stringify(data), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    // Matches /locks/:lockId/cards
    const cardsListMatch = path.match(/^\/backendLock\/locks\/(\d+)\/cards$/);
    if (cardsListMatch) {
      const lockId = parseInt(cardsListMatch[1]);

      // GET /locks/:lockId/cards
      if (req.method === "GET") {
        const data = await lockApiRequest(supabase, "GET", "/v3/identityCard/list", {
          lockId,
          pageNo: 1,
          pageSize: 200,
        });
        return new Response(JSON.stringify(data), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // POST /locks/:lockId/cards
      if (req.method === "POST") {
        const { cardNumber, cardName, startDate, endDate } = await req.json();
        if (!cardNumber || !cardName) {
          return new Response(JSON.stringify({ error: "cardNumber and cardName are required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        const data = await lockApiRequest(supabase, "POST", "/v3/identityCard/addForReversedCardNumber", {
          lockId,
          cardNumber,
          cardName,
          startDate: startDate || 0,
          endDate: endDate || 0,
          addType: 2, // 2 = via gateway
        });
        return new Response(JSON.stringify(data), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }
    
    // --- END OF NEWLY ADDED IC CARD ROUTES ---

    // DELETE /locks/:lockId - Delete a specific door lock
    const lockMatch = path.match(/^\/backendLock\/locks\/(\d+)$/);
    if (lockMatch && req.method === "DELETE") {
      const lockId = parseInt(lockMatch[1]);
      // TTLock API uses a POST request to delete a lock
      const data = await lockApiRequest(supabase, "POST", "/v3/lock/delete", { lockId });
      return new Response(JSON.stringify(data), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    
    // CHANGED: Added corsHeaders
    return new Response(JSON.stringify({ error: "Route not found" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error(err);
    // CHANGED: Added corsHeaders
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});