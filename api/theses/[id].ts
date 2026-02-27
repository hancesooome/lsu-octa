/**
 * Dedicated handler for GET and PATCH /api/theses/:id - Vercel explicit route.
 * Used for single thesis fetch and for librarian actions (approve, reject, award, feature).
 */
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  const url = (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "").trim();
  const key = (process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "").trim();
  if (!url || !key) throw new Error("Supabase env vars not set");
  return createClient(url, key);
}

export default async function handler(
  req: { method?: string; query?: Record<string, string | string[] | undefined>; body?: { status?: string; awardee?: boolean; featured?: boolean; approval_date?: string } },
  res: { status: (n: number) => { json: (o: object) => void }; setHeader: (k: string, v: string) => void }
) {
  res.setHeader("Content-Type", "application/json");
  const id = Number(req.query?.id ?? 0);
  if (!id) return res.status(400).json({ error: "Thesis ID is required" });
  const sb = getSupabase();

  if (req.method === "GET") {
    try {
      const { data, error } = await sb.from("theses").select("*").eq("id", id).maybeSingle();
      if (error) return res.status(500).json({ error: "Internal server error" });
      if (!data) return res.status(404).json({ error: "Thesis not found" });
      res.status(200).json(data);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Internal server error" });
    }
    return;
  }

  if (req.method === "PATCH") {
    try {
      const { status, awardee, featured, approval_date } = req.body || {};
      if (status === "approved" || status === "rejected") {
        const { data: thesisRow } = await sb.from("theses").select("id, collaborators").eq("id", id).maybeSingle();
        const collabs = thesisRow?.collaborators;
        const hasCollaborators = Array.isArray(collabs) && collabs.length > 0;
        if (hasCollaborators) {
          const { data: pending } = await sb.from("collaboration_requests").select("id").eq("thesis_id", id).eq("status", "pending");
          const pendingCount = (pending || []).length;
          if (pendingCount > 0) return res.status(400).json({ error: "All collaborators must accept or decline their requests before this submission can be approved or rejected.", pendingCollaboratorCount: pendingCount });
        }
      }
      const u: Record<string, unknown> = {};
      if (status) u.status = status;
      if (awardee !== undefined) u.awardee = awardee;
      if (featured !== undefined) {
        if (featured) await sb.from("theses").update({ featured: false }).neq("id", id);
        u.featured = featured;
      }
      if (approval_date) u.approval_date = approval_date;
      if (Object.keys(u).length === 0) return res.status(400).json({ error: "No fields to update" });
      const { error } = await sb.from("theses").update(u).eq("id", id);
      if (error) return res.status(500).json({ error: error.message || "Internal server error" });
      res.status(200).json({ success: true });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Internal server error" });
    }
    return;
  }

  if (req.method === "DELETE") {
    try {
      const { data: thesis } = await sb.from("theses").select("cover_image_url, pdf_url").eq("id", id).maybeSingle();
      const paths: string[] = [];
      if (thesis?.cover_image_url) {
        const m = String(thesis.cover_image_url).match(/\/research-files\/(.+)$/);
        if (m) paths.push(m[1]);
      }
      if (thesis?.pdf_url) {
        const m = String(thesis.pdf_url).match(/\/research-files\/(.+)$/);
        if (m) paths.push(m[1]);
      }
      if (paths.length > 0) {
        try {
          await sb.storage.from("research-files").remove(paths);
        } catch (storageErr) {
          console.error("[delete thesis] storage remove:", storageErr);
        }
      }
      const { error } = await sb.from("theses").delete().eq("id", id);
      if (error) return res.status(500).json({ error: error.message || "Failed to delete thesis" });
      res.status(200).json({ success: true });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: e instanceof Error ? e.message : "Internal server error" });
    }
    return;
  }

  res.status(405).json({ error: "Method not allowed" });
}
