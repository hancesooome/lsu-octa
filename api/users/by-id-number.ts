/**
 * Dedicated handler for /api/users/by-id-number - Vercel prefers explicit routes.
 */
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  const url = (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "").trim();
  const key = (process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "").trim();
  if (!url || !key) throw new Error("Supabase env vars not set");
  return createClient(url, key);
}

export default async function handler(req: { method?: string; query?: Record<string, string | string[] | undefined> }, res: { status: (n: number) => { json: (o: object) => void }; setHeader: (k: string, v: string) => void }) {
  res.setHeader("Content-Type", "application/json");
  if (req.method && req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  try {
    const idNumber = String(req.query?.id ?? req.query?.idNumber ?? "").trim();
    if (!idNumber) return res.status(400).json({ error: "ID number is required" });
    const { data, error } = await getSupabase().from("users").select("id, name, email, id_number").eq("role", "student").eq("id_number", idNumber).maybeSingle();
    if (error) return res.status(500).json({ error: "Internal server error" });
    if (!data) return res.status(404).json({ error: "No student found with that ID number" });
    res.status(200).json(data);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
}
