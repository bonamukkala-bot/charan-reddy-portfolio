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

  // 1. Authenticate webhook using constant-time comparison on ?token=
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

    // Initialize Supabase Admin client
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

    // Extract potential sub-objects defensively
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

    // 3. Find matching lead:
    // (a) lead id found in metadata or call_context echoed in payload
    let matchedLead: any = null;

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
      }
    }

    // (b) omni_request_id equal to a request id found in payload
    if (!matchedLead) {
      const candidateRequestId =
        payload.request_id ??
        payload.requestId ??
        payload.omni_request_id ??
        metadata.request_id ??
        metadata.requestId ??
        reportMetadata.request_id ??
        reportMetadata.requestId ??
        callReport.request_id ??
        callReport.requestId;

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
          }
        }
      }
    }

    // (c) Fallback: most recent lead whose phone equals payload phone_number (normalized to +91XXXXXXXXXX) with status 'calling' created in last 3 hours
    if (!matchedLead) {
      const rawPhone =
        payload.phone_number ??
        payload.phoneNumber ??
        payload.to_number ??
        payload.toNumber ??
        callReport.phone_number ??
        callReport.phoneNumber ??
        callReport.to_number ??
        callReport.toNumber;

      const normalizedPhone = normalizeIndianPhone(rawPhone);
      if (normalizedPhone) {
        const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
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
        }
      }
    }

    // 6. If no lead matches, store nothing, log clear warning with payload keys (not transcript), return 200 { ok: true, matched: false }
    if (!matchedLead) {
      console.warn(
        "OmniDimension webhook received but no matching lead found. Payload keys:",
        Object.keys(payload)
      );
      return new Response(
        JSON.stringify({ ok: true, matched: false }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 4. Extract fields to update the matched lead
    // call_transcript (full conversation as text)
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

    // ai_summary & call_sentiment
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

    // extracted variables (the whole extracted_variables object as jsonb)
    const rawExtracted =
      callReport.extracted_variables ??
      payload.extracted_variables ??
      callReport.extractedVariables ??
      payload.extractedVariables ??
      {};

    const extracted =
      typeof rawExtracted === "object" && rawExtracted !== null ? rawExtracted : {};

    // call_outcome (from extracted_variables.call_outcome if present)
    const rawCallOutcome =
      extracted.call_outcome ??
      extracted.callOutcome ??
      callReport.call_outcome ??
      payload.call_outcome ??
      null;
    const callOutcome = typeof rawCallOutcome === "string" ? rawCallOutcome.trim() : null;

    // fit_score (parse extracted_variables.fit_score as integer, only if 1 to 10)
    let fitScore: number | null = null;
    const rawFitScore = extracted.fit_score ?? extracted.fitScore;
    if (rawFitScore !== undefined && rawFitScore !== null && rawFitScore !== "") {
      const parsed = parseInt(String(rawFitScore), 10);
      if (!isNaN(parsed) && parsed >= 1 && parsed <= 10) {
        fitScore = parsed;
      }
    }

    // do_not_call (true if extracted_variables.do_not_call is "yes", case-insensitive)
    const rawDnc = String(
      extracted.do_not_call ?? extracted.doNotCall ?? ""
    ).trim().toLowerCase();
    const doNotCall = rawDnc === "yes" ? true : (matchedLead.do_not_call ?? false);

    // omni_call_id (payload call_id as text)
    const rawCallId = payload.call_id ?? payload.callId;
    const omniCallId = rawCallId !== undefined && rawCallId !== null ? String(rawCallId) : null;

    // call_ended_at (now)
    const callEndedAt = new Date().toISOString();

    // 5. Status: 'no_answer' if call_outcome is Voicemail or Hung up early, otherwise 'called'.
    // Never overwrite a status of qualified, won or lost.
    let updatedStatus = matchedLead.status;
    const preservedStatuses = ["qualified", "won", "lost"];

    if (!preservedStatuses.includes(matchedLead.status)) {
      const outcomeLower = (callOutcome ?? "").toLowerCase();
      if (outcomeLower === "voicemail" || outcomeLower === "hung up early") {
        updatedStatus = "no_answer";
      } else {
        updatedStatus = "called";
      }
    }

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

