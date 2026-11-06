/**
 * Environment variables read by this function:
 * - ALLOWED_ORIGINS
 * - SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY
 * - CALLS_ENABLED
 * - CALL_TEST_ALLOWLIST
 * - CALL_WINDOW_START
 * - CALL_WINDOW_END
 * - OMNIDIM_API_KEY
 * - OMNIDIM_AGENT_ID
 * - OMNIDIM_API_BASE_URL
 * - OMNIDIM_FROM_NUMBER_ID
 */

import { createClient } from "npm:@supabase/supabase-js@2";

interface SubmitLeadBody {
  name?: string;
  email?: string;
  phone?: string;
  project_type?: string;
  budget?: string;
  timeline?: string;
  preferred_language?: string;
  message?: string;
  consent_given?: boolean;
  consent_text?: string;
  website?: string; // honeypot
}

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
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  };
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\+91[6-9]\d{9}$/;
const DEFAULT_CONSENT_TEXT =
  "I agree to receive a call from Charan's AI assistant on this number about my inquiry. The call may be transcribed to help prepare a reply.";

/**
 * Checks whether the lead's phone number is permitted to receive calls.
 * Fails closed: if CALL_TEST_ALLOWLIST is missing or empty, allows nobody.
 * If set to "*", allows every number.
 * Otherwise, compares the last 10 digits after stripping non-digits.
 */
function isPhoneAllowedByAllowlist(phone: string): boolean {
  const rawAllowlist = Deno.env.get("CALL_TEST_ALLOWLIST");
  if (!rawAllowlist || rawAllowlist.trim() === "") {
    return false; // missing or empty: fail closed
  }

  const trimmed = rawAllowlist.trim();
  if (trimmed === "*") {
    return true; // wildcard: allow all numbers
  }

  const leadDigits = phone.replace(/\D/g, "");
  const leadLast10 = leadDigits.slice(-10);
  if (leadLast10.length !== 10) {
    return false;
  }

  const entries = trimmed.split(",").map((e) => e.trim()).filter(Boolean);
  return entries.some((entry) => {
    const entryDigits = entry.replace(/\D/g, "");
    const entryLast10 = entryDigits.slice(-10);
    return entryLast10.length === 10 && entryLast10 === leadLast10;
  });
}

/**
 * Parses and validates CALL_WINDOW_START (0-23) and CALL_WINDOW_END (1-24).
 * Falls back to 10 and 20 if missing, invalid, or start >= end.
 */
function getCallingWindowHours(): { start: number; end: number } {
  const defaultHours = { start: 10, end: 20 };
  const rawStart = Deno.env.get("CALL_WINDOW_START");
  const rawEnd = Deno.env.get("CALL_WINDOW_END");

  if (rawStart === undefined || rawEnd === undefined || rawStart === null || rawEnd === null) {
    return defaultHours;
  }

  const trimmedStart = rawStart.trim();
  const trimmedEnd = rawEnd.trim();

  if (!/^\d+$/.test(trimmedStart) || !/^\d+$/.test(trimmedEnd)) {
    return defaultHours;
  }

  const start = parseInt(trimmedStart, 10);
  const end = parseInt(trimmedEnd, 10);

  if (start < 0 || start > 23 || end < 1 || end > 24 || start >= end) {
    return defaultHours;
  }

  return { start, end };
}

/**
 * Checks whether the current time in Asia/Kolkata is within the configurable calling window.
 * The window is open when start <= current IST hour < end.
 */
function isWithinIndiaCallingWindow(): boolean {
  try {
    const { start, end } = getCallingWindowHours();

    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Kolkata",
      hour: "numeric",
      hourCycle: "h23",
    });
    const parts = formatter.formatToParts(new Date());
    const hourStr = parts.find((p) => p.type === "hour")?.value ?? "0";
    const currentHour = Number(hourStr);

    return currentHour >= start && currentHour < end;
  } catch (err) {
    console.error("Error evaluating Asia/Kolkata time window:", err);
    return false;
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
      JSON.stringify({ ok: false, error: "Method not allowed. Use POST." }),
      {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  try {
    let body: SubmitLeadBody;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ ok: false, error: "Invalid JSON payload." }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // 2. Honeypot check: if 'website' is filled, silently succeed without saving
    if (body.website && String(body.website).trim().length > 0) {
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 3. Extract and sanitize fields
    const name = String(body.name ?? "").trim();
    const email = String(body.email ?? "").trim();
    const phone = String(body.phone ?? "").trim();
    const project_type = body.project_type ? String(body.project_type).trim() : undefined;
    const budget = body.budget ? String(body.budget).trim() : undefined;
    const timeline = body.timeline ? String(body.timeline).trim() : undefined;
    const preferred_language = String(body.preferred_language ?? "en").trim();
    const message = String(body.message ?? "").trim();
    const consent_given = Boolean(body.consent_given);
    const consent_text = body.consent_text
      ? String(body.consent_text).trim()
      : DEFAULT_CONSENT_TEXT;

    // 4. Server-side validation
    if (!name) {
      return new Response(
        JSON.stringify({ ok: false, error: "Please enter your name." }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!email || !EMAIL_REGEX.test(email)) {
      return new Response(
        JSON.stringify({ ok: false, error: "Please enter a valid email address." }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!phone || !PHONE_REGEX.test(phone)) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: "Please enter a valid 10-digit Indian phone number starting with 6-9 (+91XXXXXXXXXX).",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (preferred_language !== "en" && preferred_language !== "te") {
      return new Response(
        JSON.stringify({
          ok: false,
          error: "Preferred call language must be either 'en' or 'te'.",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!message || message.length < 30) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: "Project overview must be at least 30 characters.",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!consent_given) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: "Consent is required to receive a call regarding your inquiry.",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // 5. Initialize Supabase Admin client with service role key
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.");
      return new Response(
        JSON.stringify({ ok: false, error: "Server configuration error." }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { persistSession: false },
    });

    // 6. Source IP extraction
    const forwardedFor = req.headers.get("x-forwarded-for");
    const sourceIp = forwardedFor
      ? forwardedFor.split(",")[0].trim()
      : req.headers.get("cf-connecting-ip") || req.headers.get("x-real-ip") || "unknown";

    // 7. Rate limits: max 3 per source IP per hour, max 2 per phone per day
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count: ipCount, error: ipCountError } = await supabase
      .from("leads")
      .select("*", { count: "exact", head: true })
      .eq("source_ip", sourceIp)
      .gte("created_at", oneHourAgo);

    if (ipCountError) {
      console.error("Rate limit check error (IP):", ipCountError);
    } else if (ipCount !== null && ipCount >= 3) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: "Too many inquiries from this IP address in the past hour. Please wait a bit or email Charan directly.",
        }),
        {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count: phoneCount, error: phoneCountError } = await supabase
      .from("leads")
      .select("*", { count: "exact", head: true })
      .eq("phone", phone)
      .gte("created_at", oneDayAgo);

    if (phoneCountError) {
      console.error("Rate limit check error (phone):", phoneCountError);
    } else if (phoneCount !== null && phoneCount >= 2) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: "You have already submitted 2 inquiries for this phone number today. We'll be in touch shortly!",
        }),
        {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // 8. Insert into public.leads table (saved with status 'new')
    const { data: insertedLead, error: insertError } = await supabase
      .from("leads")
      .insert({
        name,
        email,
        phone,
        project_type: project_type || null,
        budget: budget || null,
        timeline: timeline || null,
        preferred_language,
        message,
        consent_given: true,
        consent_at: new Date().toISOString(),
        consent_text,
        status: "new",
        source_ip: sourceIp,
      })
      .select()
      .single();

    if (insertError || !insertedLead) {
      console.error("Failed to insert lead into database:", insertError);
      return new Response(
        JSON.stringify({
          ok: false,
          error: "Unable to save your inquiry right now. Please try again or reach out directly.",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // 9. Outbound call checks and trigger
    // Check 1: CALLS_ENABLED must equal "true"
    const callsEnabled = Deno.env.get("CALLS_ENABLED") === "true";

    if (callsEnabled) {
      try {
        // Check 2: Allowlist check (fail-closed, compares last 10 digits)
        if (!isPhoneAllowedByAllowlist(insertedLead.phone)) {
          console.log("call skipped: not on allowlist");
        } else {
          // Check 3: Do not call check
          const { data: dncLead, error: dncError } = await supabase
            .from("leads")
            .select("id")
            .eq("phone", phone)
            .eq("do_not_call", true)
            .limit(1)
            .maybeSingle();

          if (dncError) {
            console.error("Error checking do_not_call status for phone:", dncError);
          }

          if (dncLead) {
            console.log("call skipped: marked do_not_call");
            await supabase
              .from("leads")
              .update({ do_not_call: true })
              .eq("id", insertedLead.id);
          } else if (!isWithinIndiaCallingWindow()) {
            // Check 4: Calling window check
            console.log("call queued: outside calling window");
            await supabase
              .from("leads")
              .update({ status: "queued" })
              .eq("id", insertedLead.id);
          } else {
            // Check 5: Dispatch call
            const omnidimApiKey = Deno.env.get("OMNIDIM_API_KEY");
            const omnidimAgentId = Deno.env.get("OMNIDIM_AGENT_ID");
            const apiBaseUrl = (
              Deno.env.get("OMNIDIM_API_BASE_URL") || "https://backend.omnidim.io/api/v1"
            ).replace(/\/+$/, "");
            const fromNumberId = Deno.env.get("OMNIDIM_FROM_NUMBER_ID")?.trim();

            if (!omnidimApiKey || !omnidimAgentId) {
              console.error("OmniDimension configuration missing (OMNIDIM_API_KEY or OMNIDIM_AGENT_ID). Marking lead failed.");
              await supabase
                .from("leads")
                .update({ status: "failed" })
                .eq("id", insertedLead.id);
            } else {
              const dispatchPayload: Record<string, any> = {
                agent_id: Number(omnidimAgentId),
                to_number: insertedLead.phone,
                call_context: {
                  user_name: insertedLead.name,
                  project_type: insertedLead.project_type,
                  budget_range: insertedLead.budget,
                  timeline: insertedLead.timeline,
                  preferred_language: insertedLead.preferred_language,
                  lead_message: insertedLead.message,
                },
                metadata: {
                  lead_id: insertedLead.id,
                  source: "portfolio_form",
                },
              };

              if (fromNumberId) {
                dispatchPayload.from_number_id = !isNaN(Number(fromNumberId))
                  ? Number(fromNumberId)
                  : fromNumberId;
              }

              const dispatchUrl = `${apiBaseUrl}/calls/dispatch`;
              const dispatchController = new AbortController();
              const dispatchTimeout = setTimeout(() => dispatchController.abort(), 8000);

              try {
                const dispatchRes = await fetch(dispatchUrl, {
                  method: "POST",
                  headers: {
                    Authorization: `Bearer ${omnidimApiKey}`,
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify(dispatchPayload),
                  signal: dispatchController.signal,
                });

                const responseText = await dispatchRes.text();
                let responseData: any = null;
                try {
                  responseData = JSON.parse(responseText);
                } catch {
                  // Not JSON
                }

                const isSuccess =
                  dispatchRes.ok &&
                  (responseData?.success === true ||
                    (responseData?.requestId && responseData?.success !== false));

                if (isSuccess) {
                  const omniRequestId =
                    responseData?.requestId ??
                    responseData?.request_id ??
                    (responseData?.id ? String(responseData.id) : null);

                  await supabase
                    .from("leads")
                    .update({
                      status: "calling",
                      omni_request_id: omniRequestId ? String(omniRequestId) : null,
                      call_started_at: new Date().toISOString(),
                      call_attempts: 1,
                    })
                    .eq("id", insertedLead.id);
                } else {
                  console.error(
                    `OmniDimension dispatch failed with status ${dispatchRes.status}: ${responseText}`
                  );
                  await supabase
                    .from("leads")
                    .update({ status: "failed" })
                    .eq("id", insertedLead.id);
                }
              } catch (dispatchErr: unknown) {
                console.error(
                  "OmniDimension dispatch network/timeout error:",
                  dispatchErr instanceof Error ? dispatchErr.message : String(dispatchErr)
                );
                await supabase
                  .from("leads")
                  .update({ status: "failed" })
                  .eq("id", insertedLead.id);
              } finally {
                clearTimeout(dispatchTimeout);
              }
            }
          }
        }
      } catch (callErr: unknown) {
        console.error("Outbound call handling error:", callErr);
      }
    }

    // Always return ok to the visitor
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    console.error("Unhandled submit-lead error:", err);
    return new Response(
      JSON.stringify({ ok: false, error: "An unexpected error occurred. Please try again." }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
