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

    // 8. Insert into public.leads table (status stays 'new', do not trigger call yet)
    const { error: insertError } = await supabase.from("leads").insert({
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
    });

    if (insertError) {
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

