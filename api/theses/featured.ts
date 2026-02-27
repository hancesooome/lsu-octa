/**
 * Dedicated handler for GET /api/theses/featured - Vercel explicit route.
 * Returns the currently featured thesis (or null) for the home page spotlight.
 */
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  const url = (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "").trim();
  const key = (process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "").trim();
  if (!url || !key) throw new Error("Supabase env vars not set");
  return createClient(url, key);
}

export default async function handler(
  req: { method?: string },
  res: { status: (n: number) => { json: (o: unknown) => void }; setHeader: (k: string, v: string) => void }
) {
  res.setHeader("Content-Type", "application/json");
  if (req.method && req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  try {
    const { data, error } = await getSupabase()
      .from("theses")
      .select("*")
      .eq("featured", true)
      .eq("status", "approved")
      .order("id", { ascending: false })
      .limit(1);
    if (error) return res.status(500).json({ error: "Internal server error" });
    res.status(200).json(data?.[0] ?? null);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
}
