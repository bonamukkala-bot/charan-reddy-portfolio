import { createClient } from "npm:@supabase/supabase-js@2";

/**
 * Constant-time comparison using Web Crypto SHA-256 digests.
 * Hashing both values guarantees a fixed 32-byte comparison length,
 * completely mitigating timing attacks on string length or character prefix.
 */
async function timingSafeEqual(a: string, b: string): Promise<boolean> {
  if (!a || !b) return false;
  const encoder = new TextEncoder();
  const aHash = new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(a)));
  const bHash = new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(b)));
  let diff = 0;
  for (let i = 0; i < aHash.length; i++) {
    diff |= aHash[i] ^ bHash[i];
  }
  return diff === 0;
}

/**
 * Normalizes an Indian phone number to +91XXXXXXXXXX format.
 */
function normalizeIndianPhone(input: unknown): string | null {
  if (!input) return null;
  const digits = String(input).replace(/\D/g, "");
  if (digits.length === 10 && /^[6-9]\d{9}$/.test(digits)) {
    return `+91${digits}`;
  }
  if (digits.length === 12 && digits.startsWith("91") && /^91[6-9]\d{9}$/.test(digits)) {
    return `+${digits}`;
  }
  if (digits.length === 11 && digits.startsWith("0") && /^0[6-9]\d{9}$/.test(digits)) {
    return `+91${digits.slice(1)}`;
  }
  return null;
}

/**
 * Extracts the structural shape of call_report for diagnostics.
 * Returns each key's type (string/number/object/array/boolean) and
 * for extracted_variables only its key names, ensuring no sensitive
 * lead text, summaries, or transcripts are logged.
 */
function getCallReportShape(callReport: any): Record<string, any> {
  if (!callReport || typeof callReport !== "object") {
    return { _type: typeof callReport };
  }
  const shape: Record<string, any> = {};
  for (const [key, val] of Object.entries(callReport)) {
    if (key === "extracted_variables" || key === "extractedVariables") {
      if (val && typeof val === "object" && !Array.isArray(val)) {
        shape[key] = Object.keys(val);
      } else {
        shape[key] = Array.isArray(val) ? "array" : typeof val;
      }
    } else if (Array.isArray(val)) {
      shape[key] = "array";
    } else if (val === null) {
      shape[key] = "null";
    } else {
      shape[key] = typeof val;
    }
  }
  return shape;
}

const NO_ANSWER_CALL_STATUS_PATTERNS = [
  "no-answer",
  "no_answer",
  "noanswer",
  "busy",
  "failed",
  "voicemail",
  "unanswered",
  "not answered",
  "canceled",
  "cancelled",
];

Deno.serve(async (req: Request) => {
  // 1. Accept POST only
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ ok: false, error: "Method not allowed. Use POST." }),
      {
        status: 405,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // 1. Authenticate webhook using constant-time comparison on ?token= (never log token)
  const url = new URL(req.url);
  const token = url.searchParams.get("token") ?? "";
  const webhookSecret = Deno.env.get("WEBHOOK_SECRET") ?? "";

  if (!webhookSecret || !token || !(await timingSafeEqual(token, webhookSecret))) {
    return new Response(
      JSON.stringify({ ok: false, error: "Unauthorized" }),
      {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  try {
    // 2. Parse JSON body defensively
    let payload: Record<string, any>;
    try {
      payload = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ ok: false, error: "Invalid JSON payload" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (!payload || typeof payload !== "object") {
      return new Response(
        JSON.stringify({ ok: false, error: "Invalid payload format" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Initialize Supabase Admin client with service role key
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
      return new Response(
        JSON.stringify({ ok: false, error: "Server configuration error" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { persistSession: false },
    });

    // Extract sub-objects defensively
    const metadata =
      payload.metadata && typeof payload.metadata === "object" ? payload.metadata : {};
    const callReport =
      payload.call_report && typeof payload.call_report === "object"
        ? payload.call_report
        : payload.callReport && typeof payload.callReport === "object"
        ? payload.callReport
        : {};
    const reportMetadata =
      callReport.metadata && typeof callReport.metadata === "object" ? callReport.metadata : {};
    const callContext =
      payload.call_context && typeof payload.call_context === "object"
        ? payload.call_context
        : payload.callContext && typeof payload.callContext === "object"
        ? payload.callContext
        : {};
    const reportContext =
      callReport.call_context && typeof callReport.call_context === "object"
        ? callReport.call_context
        : callReport.callContext && typeof callReport.callContext === "object"
        ? callReport.callContext
        : {};

    // 1. LEAD MATCHING ORDER
    let matchedLead: any = null;
    let matchRule = "none";

    // a. Primary match: call_request_id (compare as text) against leads.omni_request_id
    const candidateRequestId =
      payload.call_request_id ??
      payload.callRequestId ??
      payload.request_id ??
      payload.requestId ??
      payload.omni_request_id;

    if (candidateRequestId !== undefined && candidateRequestId !== null) {
      const reqIdStr = String(candidateRequestId).trim();
      if (reqIdStr) {
        const { data, error } = await supabase
          .from("leads")
          .select("*")
          .eq("omni_request_id", reqIdStr)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!error && data) {
          matchedLead = data;
          matchRule = "a:call_request_id";
        }
      }
    }

    // b. metadata.lead_id or call_context.lead_id if present anywhere in the payload
    if (!matchedLead) {
      const candidateLeadId =
        metadata.lead_id ??
        metadata.leadId ??
        reportMetadata.lead_id ??
        reportMetadata.leadId ??
        callContext.lead_id ??
        callContext.leadId ??
        reportContext.lead_id ??
        reportContext.leadId ??
        payload.lead_id ??
        payload.leadId;

      if (candidateLeadId && typeof candidateLeadId === "string" && candidateLeadId.trim()) {
        const { data, error } = await supabase
          .from("leads")
          .select("*")
          .eq("id", candidateLeadId.trim())
          .maybeSingle();

        if (!error && data) {
          matchedLead = data;
          matchRule = "b:lead_id";
        }
      }
    }

    // c. Fallback: most recent lead whose phone equals to_number first, then phone_number
    // (both normalized to +91XXXXXXXXXX) with status 'calling' created in last 3 hours.
    // Never match on from_number.
    if (!matchedLead) {
      const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();

      const normalizedTo = normalizeIndianPhone(payload.to_number ?? payload.toNumber);
      if (normalizedTo) {
        const { data, error } = await supabase
          .from("leads")
          .select("*")
          .eq("phone", normalizedTo)
          .eq("status", "calling")
          .gte("created_at", threeHoursAgo)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!error && data) {
          matchedLead = data;
          matchRule = "c:to_number";
        }
      }

      if (!matchedLead) {
        const normalizedPhone = normalizeIndianPhone(payload.phone_number ?? payload.phoneNumber);
        if (normalizedPhone) {
          const { data, error } = await supabase
            .from("leads")
            .select("*")
            .eq("phone", normalizedPhone)
            .eq("status", "calling")
            .gte("created_at", threeHoursAgo)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          if (!error && data) {
            matchedLead = data;
            matchRule = "c:phone_number";
          }
        }
      }
    }

    // Extract top-level call values
    const callStatusVal =
      payload.call_status !== undefined && payload.call_status !== null
        ? String(payload.call_status).trim()
        : null;

    const callDirectionVal =
      payload.call_direction !== undefined && payload.call_direction !== null
        ? String(payload.call_direction).trim()
        : null;

    const hangupSourceVal =
      payload.hangup_source !== undefined && payload.hangup_source !== null
        ? String(payload.hangup_source).trim()
        : null;

    const callDurationVal =
      payload.call_duration !== undefined && payload.call_duration !== null
        ? String(payload.call_duration).trim()
        : null;

    // 4. DIAGNOSTICS: log one line on EVERY request with values & call_report shape (never log transcripts or lead text)
    const reportShape = getCallReportShape(callReport);
    console.log(
      `[OmniDimension Webhook] Diagnostics: ${JSON.stringify({
        call_status: callStatusVal,
        call_direction: callDirectionVal,
        hangup_source: hangupSourceVal,
        call_duration: callDurationVal,
        matched_rule: matchRule,
        call_report_shape: reportShape,
      })}`
    );

    // 5. If no lead matches, return 200 { ok: true, matched: false }
    if (!matchedLead) {
      return new Response(
        JSON.stringify({ ok: true, matched: false }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Extract report fields
    let transcriptText: string | null = null;
    const rawConversation =
      callReport.full_conversation ??
      payload.full_conversation ??
      callReport.fullConversation ??
      payload.fullConversation ??
      callReport.transcript ??
      payload.transcript ??
      null;

    if (typeof rawConversation === "string") {
      transcriptText = rawConversation;
    } else if (Array.isArray(rawConversation)) {
      transcriptText = rawConversation
        .map((entry) => {
          if (typeof entry === "string") return entry;
          if (entry && typeof entry === "object") {
            const speaker = entry.role ?? entry.speaker ?? entry.sender ?? "Speaker";
            const text = entry.text ?? entry.message ?? entry.content ?? "";
            return `${speaker}: ${text}`;
          }
          return String(entry);
        })
        .join("\n");
    } else if (rawConversation) {
      transcriptText = JSON.stringify(rawConversation, null, 2);
    }

    const aiSummary =
      typeof callReport.summary === "string"
        ? callReport.summary
        : typeof payload.summary === "string"
        ? payload.summary
        : null;

    const callSentiment =
      typeof callReport.sentiment === "string"
        ? callReport.sentiment
        : typeof payload.sentiment === "string"
        ? payload.sentiment
        : null;

    const rawExtracted =
      callReport.extracted_variables ??
      payload.extracted_variables ??
      callReport.extractedVariables ??
      payload.extractedVariables ??
      {};

    const extracted =
      typeof rawExtracted === "object" && rawExtracted !== null ? rawExtracted : {};

    const rawCallOutcome =
      extracted.call_outcome ??
      extracted.callOutcome ??
      callReport.call_outcome ??
      payload.call_outcome ??
      null;
    const callOutcome = typeof rawCallOutcome === "string" ? rawCallOutcome.trim() : null;

    let fitScore: number | null = null;
    const rawFitScore = extracted.fit_score ?? extracted.fitScore;
    if (rawFitScore !== undefined && rawFitScore !== null && rawFitScore !== "") {
      const parsed = parseInt(String(rawFitScore), 10);
      if (!isNaN(parsed) && parsed >= 1 && parsed <= 10) {
        fitScore = parsed;
      }
    }

    const rawDnc = String(
      extracted.do_not_call ?? extracted.doNotCall ?? ""
    ).trim().toLowerCase();
    const doNotCall = rawDnc === "yes" ? true : (matchedLead.do_not_call ?? false);

    const rawCallId = payload.call_id ?? payload.callId;
    const omniCallId = rawCallId !== undefined && rawCallId !== null ? String(rawCallId) : null;

    const callEndedAt = new Date().toISOString();

    // 3. STATUS LOGIC:
    // Set 'no_answer' when call_outcome is Voicemail or Hung up early,
    // OR when call_status (case-insensitive) contains any of the 10 no-answer patterns.
    // Otherwise 'called'. Never overwrite a status of qualified, won or lost.
    let isNoAnswer = false;

    const outcomeLower = (callOutcome ?? "").toLowerCase();
    if (outcomeLower === "voicemail" || outcomeLower === "hung up early") {
      isNoAnswer = true;
    }

    const statusLower = (callStatusVal ?? "").toLowerCase();
    if (statusLower) {
      for (const pattern of NO_ANSWER_CALL_STATUS_PATTERNS) {
        if (statusLower.includes(pattern)) {
          isNoAnswer = true;
          break;
        }
      }
    }

    let updatedStatus = matchedLead.status;
    const preservedStatuses = ["qualified", "won", "lost"];

    if (!preservedStatuses.includes(matchedLead.status)) {
      if (isNoAnswer) {
        updatedStatus = "no_answer";
      } else {
        updatedStatus = "called";
      }
    }

    // 2. NEW COLUMNS & UPDATES
    const updateData: Record<string, any> = {
      call_transcript: transcriptText ?? matchedLead.call_transcript ?? null,
      ai_summary: aiSummary ?? matchedLead.ai_summary ?? null,
      call_sentiment: callSentiment ?? matchedLead.call_sentiment ?? null,
      extracted: extracted,
      call_outcome: callOutcome ?? matchedLead.call_outcome ?? null,
      fit_score: fitScore !== null ? fitScore : matchedLead.fit_score ?? null,
      do_not_call: doNotCall,
      omni_call_id: omniCallId ?? matchedLead.omni_call_id ?? null,
      call_ended_at: callEndedAt,
      last_webhook: payload,
      status: updatedStatus,
      call_status: callStatusVal ?? matchedLead.call_status ?? null,
      call_duration: callDurationVal ?? matchedLead.call_duration ?? null,
      hangup_source: hangupSourceVal ?? matchedLead.hangup_source ?? null,
    };

    const { error: updateError } = await supabase
      .from("leads")
      .update(updateData)
      .eq("id", matchedLead.id);

    if (updateError) {
      console.error("Failed to update lead with webhook payload:", updateError);
      return new Response(
        JSON.stringify({ ok: false, error: "Database update error" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({ ok: true, matched: true, lead_id: matchedLead.id }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (err: unknown) {
    console.error("Unhandled omnidim-webhook error:", err);
    return new Response(
      JSON.stringify({ ok: false, error: "Internal server error" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
});
