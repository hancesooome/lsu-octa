/**
 * Dedicated handler for GET /api/my-submissions/:userId - Vercel explicit route.
 */
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  const url = (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "").trim();
  const key = (process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "").trim();
  if (!url || !key) throw new Error("Supabase env vars not set");
  return createClient(url, key);
}

export default async function handler(
  req: { method?: string; query?: Record<string, string | string[] | undefined> },
  res: { status: (n: number) => { json: (o: object) => void }; setHeader: (k: string, v: string) => void }
) {
  res.setHeader("Content-Type", "application/json");
  if (req.method && req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  try {
    const userId = Number(req.query?.userId ?? 0);
    if (!userId) return res.status(400).json({ error: "userId is required" });
    const sb = getSupabase();
    const [authored, collabRes] = await Promise.all([
      sb.from("theses").select("*").eq("submitted_by", userId).order("id", { ascending: false }),
      sb.from("collaboration_requests").select("thesis_id").eq("collaborator_user_id", userId).eq("status", "accepted")
    ]);
    if (authored.error) return res.status(500).json({ error: "Internal server error" });
    const authoredList = authored.data || [];
    if (collabRes.error) console.error("[my-submissions collaboration_requests]", collabRes.error);
    const collabIds = (collabRes.data || []).map((r: any) => r.thesis_id).filter(Boolean);
    let collabTheses: any[] = [];
    if (collabIds.length > 0) {
      const { data } = await sb.from("theses").select("*").in("id", collabIds);
      collabTheses = data || [];
    }
    const byId = new Map(authoredList.map((t: any) => [t.id, t]));
    for (const t of collabTheses) {
      if (!byId.has(t.id)) byId.set(t.id, t);
    }
    const merged = Array.from(byId.values()).sort((a: any, b: any) => b.id - a.id);
    res.status(200).json(merged);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
}
