/**
 * Environment variables read by this function:
 * - ALLOWED_ORIGINS
 * - SUPABASE_URL
 * - SUPABASE_ANON_KEY
 * - SUPABASE_SERVICE_ROLE_KEY
 * - OMNIDIM_API_KEY
 * - OMNIDIM_API_BASE_URL
 */

import { createClient } from "npm:@supabase/supabase-js@2";

const ALLOWED_ORIGINS_ENV = Deno.env.get("ALLOWED_ORIGINS") ?? "";
const allowedOrigins = ALLOWED_ORIGINS_ENV
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("origin") ?? "";
  const isAllowed =
    allowedOrigins.length === 0 ||
    allowedOrigins.includes("*") ||
    allowedOrigins.includes(origin);

  const allowOrigin = isAllowed && origin ? origin : (allowedOrigins[0] ?? "*");

  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
    "Cache-Control": "no-store",
  };
}

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function fetchWithTimeout(url: string, headers: HeadersInit, timeoutMs = 8000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      method: "GET",
      headers,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

Deno.serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req);

  // 1. Handle OPTIONS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed. Use POST." }),
      {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  // 2. Authenticate: require Authorization: Bearer <access token>
  const authHeader = req.headers.get("Authorization") ?? req.headers.get("authorization") ?? "";
  if (!authHeader || !authHeader.toLowerCase().startsWith("bearer ")) {
    return new Response(
      JSON.stringify({ error: "Missing or invalid authorization header." }),
      {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  const token = authHeader.slice(7).trim();
  if (!token) {
    return new Response(
      JSON.stringify({ error: "Missing access token." }),
      {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
    console.error("Missing SUPABASE_URL, SUPABASE_ANON_KEY, or SUPABASE_SERVICE_ROLE_KEY.");
    return new Response(
      JSON.stringify({ error: "Server configuration error." }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  // Supabase client with user token
  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    auth: { persistSession: false },
  });

  const { data: userData, error: userError } = await userClient.auth.getUser(token);
  if (userError || !userData?.user) {
    return new Response(
      JSON.stringify({ error: "Unauthorized." }),
      {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  const { data: isAdmin, error: rpcError } = await userClient.rpc("is_admin");
  if (rpcError || isAdmin !== true) {
    return new Response(
      JSON.stringify({ error: "Forbidden: Admin access required." }),
      {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  // 3. Parse and validate JSON { "leadId": "<uuid>" }
  let body: { leadId?: string };
  try {
    body = await req.json();
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid JSON payload." }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  const leadId = String(body?.leadId ?? "").trim();
  if (!leadId || !UUID_REGEX.test(leadId)) {
    return new Response(
      JSON.stringify({ error: "Invalid leadId. Must be a valid UUID." }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  // Read lead using service-role client
  const serviceClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { persistSession: false },
  });

  const { data: lead, error: leadError } = await serviceClient
    .from("leads")
    .select("omni_call_id, call_ended_at, status")
    .eq("id", leadId)
    .maybeSingle();

  if (leadError) {
    console.error("Database error retrieving lead:", leadError);
    return new Response(
      JSON.stringify({ status: "error", message: "Database query error." }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  if (!lead) {
    return new Response(
      JSON.stringify({ error: "Lead not found." }),
      {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  if (!lead.omni_call_id || typeof lead.omni_call_id !== "string" || !lead.omni_call_id.trim()) {
    console.log(`[get-recording] leadId: ${leadId}, upstream: none, status: not_available`);
    return new Response(
      JSON.stringify({ status: "not_available" }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  // 4. Ask OmniDimension for call log
  const omnidimApiKey = Deno.env.get("OMNIDIM_API_KEY");
  if (!omnidimApiKey) {
    console.error("Missing OMNIDIM_API_KEY environment variable.");
    console.log(`[get-recording] leadId: ${leadId}, upstream: none, status: error`);
    return new Response(
      JSON.stringify({ status: "error", message: "Recording service configuration missing." }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  const primaryBase = (
    Deno.env.get("OMNIDIM_API_BASE_URL") || "https://backend.omnidim.io/api/v1"
  ).replace(/\/+$/, "");
  const fallbackBase = "https://omnidim.io/api/v1";

  const omniCallId = lead.omni_call_id.trim();
  const primaryUrl = `${primaryBase}/calls/logs/${encodeURIComponent(omniCallId)}`;
  const fallbackUrl = `${fallbackBase}/calls/logs/${encodeURIComponent(omniCallId)}`;

  const requestHeaders = {
    Authorization: `Bearer ${omnidimApiKey}`,
    Accept: "application/json",
  };

  let chosenHost = new URL(primaryBase).host;
  let responseData: any = null;
  let upstreamFailed = false;

  let primaryRes: Response | null = null;
  let primaryNetError = false;

  try {
    primaryRes = await fetchWithTimeout(primaryUrl, requestHeaders, 8000);
  } catch (_err) {
    primaryNetError = true;
  }

  if (primaryRes && primaryRes.ok) {
    try {
      responseData = await primaryRes.json();
      chosenHost = new URL(primaryBase).host;
    } catch {
      upstreamFailed = true;
    }
  } else if (primaryNetError || primaryRes?.status === 404) {
    // Retry once against https://omnidim.io/api/v1
    if (primaryBase !== fallbackBase) {
      chosenHost = new URL(fallbackBase).host;
      try {
        const fallbackRes = await fetchWithTimeout(fallbackUrl, requestHeaders, 8000);
        if (fallbackRes.ok) {
          try {
            responseData = await fallbackRes.json();
          } catch {
            upstreamFailed = true;
          }
        } else {
          upstreamFailed = true;
        }
      } catch {
        upstreamFailed = true;
      }
    } else {
      upstreamFailed = true;
    }
  } else {
    upstreamFailed = true;
  }

  if (upstreamFailed || !responseData) {
    console.log(`[get-recording] leadId: ${leadId}, upstream: ${chosenHost}, status: error`);
    return new Response(
      JSON.stringify({ status: "error", message: "Failed to communicate with recording provider." }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  // 5. Extract recording URL
  let logItem: any = null;
  const rawLog = responseData?.call_log_data ?? responseData?.callLogData;
  if (Array.isArray(rawLog)) {
    logItem = rawLog[0];
  } else if (rawLog && typeof rawLog === "object") {
    logItem = rawLog;
  } else if (responseData && typeof responseData === "object") {
    logItem = responseData;
  }

  const recUrl = logItem?.recording_url;
  const internalUrl = logItem?.internal_recording_url;

  let chosenUrl: string | null = null;
  if (typeof recUrl === "string" && recUrl.trim().startsWith("https://")) {
    chosenUrl = recUrl.trim();
  } else if (typeof internalUrl === "string" && internalUrl.trim().startsWith("https://")) {
    chosenUrl = internalUrl.trim();
  }

  if (chosenUrl) {
    console.log(`[get-recording] leadId: ${leadId}, upstream: ${chosenHost}, status: ready`);
    return new Response(
      JSON.stringify({ status: "ready", url: chosenUrl }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  let isUnder15Mins = false;
  if (lead.call_ended_at) {
    const endedAt = new Date(lead.call_ended_at).getTime();
    const now = Date.now();
    if (!isNaN(endedAt) && (now - endedAt) < 15 * 60 * 1000 && (now - endedAt) >= 0) {
      isUnder15Mins = true;
    }
  }

  const finalStatus = isUnder15Mins ? "processing" : "not_available";
  console.log(`[get-recording] leadId: ${leadId}, upstream: ${chosenHost}, status: ${finalStatus}`);
  return new Response(
    JSON.stringify({ status: finalStatus }),
    {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }
  );
});

