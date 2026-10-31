import type { VercelRequest, VercelResponse } from "@vercel/node";

const ALLOWED_ORIGINS = (
    process.env.ALLOWED_ORIGINS ??
    "https://bonamukkala-charan.vercel.app,http://localhost:3000,http://localhost:5173"
)
    .split(",")
    .map((s) => s.trim());

const WINDOW_MS = 60 * 60 * 1000;
const MAX_SESSIONS_PER_WINDOW = 6;
const hits = new Map<string, number[]>();

function clientIp(req: VercelRequest): string {
    const xff = req.headers["x-forwarded-for"];
    const raw = Array.isArray(xff) ? xff[0] : xff;
    return (raw ?? "unknown").split(",")[0].trim();
}

function rateLimited(ip: string): boolean {
    const now = Date.now();
    const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
    if (recent.length >= MAX_SESSIONS_PER_WINDOW) {
        hits.set(ip, recent);
        return true;
    }
    recent.push(now);
    hits.set(ip, recent);
    return false;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    res.setHeader("Cache-Control", "no-store");

    if (req.method !== "POST") {
        return res.status(405).json({ error: "method_not_allowed" });
    }

    const origin = req.headers.origin;
    if (origin && !ALLOWED_ORIGINS.includes(origin)) {
        return res.status(403).json({ error: "forbidden_origin" });
    }

    if (rateLimited(clientIp(req))) {
        return res.status(429).json({ error: "too_many_sessions" });
    }

    const apiKey = process.env.OMNIDIM_API_KEY;
    const agentId = Number(process.env.OMNIDIM_AGENT_ID);
    if (!apiKey || !agentId) {
        return res.status(500).json({ error: "server_not_configured" });
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);

    try {
        const r = await fetch("https://omnidim.io/api/v1/sessions/create", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${apiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ agent_id: agentId, type: "voice" }),
            signal: controller.signal,
        });

        if (!r.ok) {
            console.error("omnidim session create failed", r.status);
            return res.status(502).json({ error: "session_failed" });
        }

        const data = (await r.json()) as { ws_url?: string };
        if (!data.ws_url) {
            return res.status(502).json({ error: "no_ws_url" });
        }
        return res.status(200).json({ ws_url: data.ws_url });
    } catch (err) {
        console.error("omnidim session create error", err);
        return res.status(502).json({ error: "session_failed" });
    } finally {
        clearTimeout(timer);
    }
}