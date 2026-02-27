/**
 * Dedicated handler for GET /api/collaboration-requests - Vercel explicit route.
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
    const { data: rows, error } = await sb.from("collaboration_requests").select("id, thesis_id, collaborator_user_id, requester_user_id, status, created_at").eq("collaborator_user_id", userId).eq("status", "pending").order("created_at", { ascending: false });
    if (error) return res.status(500).json({ error: error.message || "Internal server error" });
    const list = rows || [];
    const enriched = await Promise.all(list.map(async (r: any) => {
      const [t, u] = await Promise.all([
        sb.from("theses").select("id, title, author, year").eq("id", r.thesis_id).maybeSingle(),
        sb.from("users").select("id, name").eq("id", r.requester_user_id).maybeSingle()
      ]);
      return { ...r, thesis: t.data, requester: u.data };
    }));
    res.status(200).json(enriched);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
}
