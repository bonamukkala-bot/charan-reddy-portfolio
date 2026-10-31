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

const COOLDOWN_MS = 30 * 1000;
const cooldownUntil: Record<string, number> = {};

type Provider = { name: "clone" | "stock"; apiKey?: string; agentId: number };

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

async function createSession(p: Provider): Promise<string | null> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);
    try {
        const r = await fetch("https://omnidim.io/api/v1/sessions/create", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${p.apiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ agent_id: p.agentId, type: "voice" }),
            signal: controller.signal,
        });
        if (!r.ok) {
            console.error(`omnidim ${p.name} session failed, status`, r.status);
            return null;
        }
        const data = (await r.json()) as { ws_url?: string };
        return data.ws_url ?? null;
    } catch (err) {
        console.error(`omnidim ${p.name} session error`, (err as Error).name);
        return null;
    } finally {
        clearTimeout(timer);
    }
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

    const providers: Provider[] = [
        {
            name: "clone",
            apiKey: process.env.OMNIDIM_PRIMARY_API_KEY,
            agentId: Number(process.env.OMNIDIM_PRIMARY_AGENT_ID),
        },
        {
            name: "stock",
            apiKey: process.env.OMNIDIM_FALLBACK_API_KEY,
            agentId: Number(process.env.OMNIDIM_FALLBACK_AGENT_ID),
        },
    ].filter((p) => p.apiKey && p.agentId) as Provider[];

    if (providers.length === 0) {
        return res.status(500).json({ error: "server_not_configured" });
    }

    // Try providers that are not cooling down first, then the rest.
    const now = Date.now();
    const ready = providers.filter((p) => (cooldownUntil[p.name] ?? 0) <= now);
    const order = [...ready, ...providers.filter((p) => !ready.includes(p))];

    for (const p of order) {
        const wsUrl = await createSession(p);
        if (wsUrl) {
            return res.status(200).json({ ws_url: wsUrl, voice: p.name });
        }
        cooldownUntil[p.name] = Date.now() + COOLDOWN_MS;
    }

    return res.status(502).json({ error: "session_failed" });
}