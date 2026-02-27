/**
 * Dedicated handler for PATCH /api/collaboration-requests/:id - Vercel explicit route.
 */
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  const url = (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "").trim();
  const key = (process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "").trim();
  if (!url || !key) throw new Error("Supabase env vars not set");
  return createClient(url, key);
}

function getSupabaseAdmin() {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

export default async function handler(
  req: { method?: string; query?: Record<string, string | string[] | undefined>; body?: { status?: string } },
  res: { status: (n: number) => { json: (o: object) => void }; setHeader: (k: string, v: string) => void }
) {
  res.setHeader("Content-Type", "application/json");
  if (req.method && req.method !== "PATCH") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  try {
    const id = Number(req.query?.id ?? 0);
    if (!id) return res.status(400).json({ error: "Request ID is required" });
    const status = req.body?.status;
    if (status !== "accepted" && status !== "declined") return res.status(400).json({ error: "status must be accepted or declined" });
    const sb = getSupabase();
    const sbAdmin = getSupabaseAdmin() || sb;
    const { data: reqRow, error: fetchErr } = await sb.from("collaboration_requests").select("thesis_id, collaborator_user_id").eq("id", id).maybeSingle();
    if (fetchErr || !reqRow) return res.status(500).json({ error: "Request not found" });
    const { error } = await sb.from("collaboration_requests").update({ status }).eq("id", id);
    if (error) return res.status(500).json({ error: error.message || "Internal server error" });
    if (status === "declined") {
      const { data: userRow } = await sb.from("users").select("id_number, name").eq("id", reqRow.collaborator_user_id).maybeSingle();
      if (userRow) {
        const idNum = userRow.id_number != null ? String(userRow.id_number).trim() : "";
        const userName = userRow.name != null ? String(userRow.name).trim() : "";
        const { data: thesisRow } = await sbAdmin.from("theses").select("collaborators").eq("id", reqRow.thesis_id).maybeSingle();
        const collabs = Array.isArray(thesisRow?.collaborators) ? thesisRow.collaborators : [];
        const filtered = collabs.filter((c: any) => {
          const cId = String(c?.id_number ?? c?.idNumber ?? "").trim();
          const cName = String(c?.name ?? "").trim();
          const matchId = idNum && cId && cId === idNum;
          const matchName = userName && cName && cName.toLowerCase() === userName.toLowerCase();
          return !matchId && !matchName;
        });
        const { error: updErr } = await sbAdmin.from("theses").update({ collaborators: filtered }).eq("id", reqRow.thesis_id);
        if (updErr) {
          console.error("[decline: thesis update]", updErr);
          return res.status(500).json({ error: "Failed to remove collaborator from thesis" });
        }
      }
    }
    res.status(200).json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
}
