/**
 * Single-file API for Vercel – no imports from other api/ files to avoid module resolution errors.
 */
import express from "express";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  const url = (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "").trim();
  const key = (process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "").trim();
  if (!url || !key) throw new Error("SUPABASE_URL and SUPABASE_ANON_KEY (or VITE_* variants) must be set in Vercel Environment Variables");
  return createClient(url, key);
}

function getSupabaseAdmin() {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

let _supabase: ReturnType<typeof createClient> | null = null;
let _supabaseAdmin: ReturnType<typeof createClient> | null = null;
function supabase() {
  if (!_supabase) _supabase = getSupabase();
  return _supabase;
}
function supabaseAdmin() {
  if (!_supabaseAdmin) _supabaseAdmin = getSupabaseAdmin();
  return _supabaseAdmin;
}

const app = express();
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    supabaseConfigured: !!(process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL) && !!(process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY),
    env: process.env.VERCEL ? "vercel" : "local",
  });
});

app.post("/api/login", async (req, res) => {
  try {
    const { data, error } = await supabase().from("users").select("*").eq("email", req.body.email).eq("password", req.body.password).eq("role", req.body.role).maybeSingle();
    if (error) return res.status(500).json({ error: "Internal server error" });
    if (!data) return res.status(401).json({ error: "Invalid credentials" });
    const { password: _, ...u } = data as any;
    res.json(u);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/theses", async (req, res) => {
  try {
    const { status, college, year, awardee, search } = req.query as any;
    let q = supabase().from("theses").select("*");
    if (status) q = q.eq("status", status);
    if (college) q = q.eq("college", college);
    if (year) q = q.eq("year", Number(year));
    if (awardee === "true") q = q.eq("awardee", true);
    if (search) {
      const t = `%${search}%`;
      q = q.or(`title.ilike.${t},author.ilike.${t},summary.ilike.${t}`);
    }
    q = q.order("year", { ascending: false }).order("id", { ascending: false });
    const { data, error } = await q;
    if (error) return res.status(500).json({ error: "Internal server error" });
    let list = data || [];
    if (status === "pending" && list.length > 0) {
      const ids = list.map((t: any) => t.id);
      const { data: pendingRows } = await supabase().from("collaboration_requests").select("thesis_id").eq("status", "pending").in("thesis_id", ids);
      const countByThesis: Record<number, number> = {};
      (pendingRows || []).forEach((r: any) => { countByThesis[r.thesis_id] = (countByThesis[r.thesis_id] || 0) + 1; });
      list = list.map((t: any) => ({ ...t, pending_collaborator_count: countByThesis[t.id] || 0 }));
    }
    res.json(list);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/theses/featured", async (_req, res) => {
  try {
    const { data, error } = await supabase().from("theses").select("*").eq("featured", true).eq("status", "approved").order("id", { ascending: false }).limit(1);
    if (error) return res.status(500).json({ error: "Internal server error" });
    res.json(data?.[0] ?? null);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/college-stats", async (_req, res) => {
  try {
    const { data, error } = await supabase().from("theses").select("college").eq("status", "approved");
    if (error) return res.status(500).json({ error: "Internal server error" });
    const m: Record<string, number> = {};
    (data || []).forEach((r: any) => { m[r.college] = (m[r.college] || 0) + 1; });
    res.json(Object.entries(m).map(([college, count]) => ({ college, count })));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/theses/:id", async (req, res) => {
  try {
    const { data, error } = await supabase().from("theses").select("*").eq("id", Number(req.params.id)).maybeSingle();
    if (error) return res.status(500).json({ error: "Internal server error" });
    if (!data) return res.status(404).json({ error: "Thesis not found" });
    res.json(data);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/theses", async (req, res) => {
  try {
    const { title, author, year, college, summary, cover_image_url, pdf_url, submitted_by, collaborators } = req.body;
    const collabList = collaborators && Array.isArray(collaborators) ? collaborators : [];
    const collabForPayload = collabList.map((c: any) => ({ id_number: c.id_number, name: c.name }));
    const payload: Record<string, unknown> = { title, author, year, college, summary, cover_image_url: cover_image_url || "", pdf_url: pdf_url || "", submitted_by, status: "pending" };
    if (collabForPayload.length > 0) payload.collaborators = collabForPayload;
    const { data, error } = await supabase().from("theses").insert(payload).select("id").maybeSingle();
    if (error) return res.status(500).json({ error: "Internal server error" });
    const thesisId = data?.id;
    if (thesisId && collabList.length > 0) {
      for (const c of collabList) {
        let collabUserId = c.user_id;
        if (!collabUserId && c.id_number) {
          const { data: u } = await supabase().from("users").select("id").eq("role", "student").eq("id_number", c.id_number).maybeSingle();
          collabUserId = u?.id;
        }
        if (collabUserId && collabUserId !== submitted_by) {
          const { error: insErr } = await supabase().from("collaboration_requests").insert({ thesis_id: thesisId, collaborator_user_id: collabUserId, requester_user_id: submitted_by, status: "pending" });
          if (insErr) console.error("[collaboration_requests insert]", insErr);
        }
      }
    }
    res.json({ id: thesisId });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.patch("/api/theses/:id", async (req, res) => {
  try {
    const { status, awardee, featured, approval_date } = req.body;
    const id = Number(req.params.id);
    if (status === "approved" || status === "rejected") {
      const { data: thesisRow } = await supabase().from("theses").select("id, collaborators").eq("id", id).maybeSingle();
      const collabs = thesisRow?.collaborators;
      const hasCollaborators = Array.isArray(collabs) && collabs.length > 0;
      if (hasCollaborators) {
        const { data: pending } = await supabase().from("collaboration_requests").select("id").eq("thesis_id", id).eq("status", "pending");
        const pendingCount = (pending || []).length;
        if (pendingCount > 0) return res.status(400).json({ error: "All collaborators must accept or decline their requests before this submission can be approved or rejected.", pendingCollaboratorCount: pendingCount });
      }
    }
    const u: any = {};
    if (status) u.status = status;
    if (awardee !== undefined) u.awardee = awardee;
    if (featured !== undefined) {
      if (featured) await supabase().from("theses").update({ featured: false }).neq("id", id);
      u.featured = featured;
    }
    if (approval_date) u.approval_date = approval_date;
    if (Object.keys(u).length === 0) return res.status(400).json({ error: "No fields to update" });
    const { error } = await supabase().from("theses").update(u).eq("id", id);
    if (error) return res.status(500).json({ error: "Internal server error" });
    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.delete("/api/theses/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { data: thesis } = await supabase().from("theses").select("cover_image_url, pdf_url").eq("id", id).maybeSingle();
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
        await supabase().storage.from("research-files").remove(paths);
      } catch (storageErr) {
        console.error("[delete thesis] storage remove:", storageErr);
      }
    }
    const { error } = await supabase().from("theses").delete().eq("id", id);
    if (error) return res.status(500).json({ error: error.message || "Failed to delete thesis" });
    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e instanceof Error ? e.message : "Internal server error" });
  }
});

app.get("/api/users", async (_req, res) => {
  try {
    const { data, error } = await supabase().from("users").select("id, name, email, role, id_number").eq("role", "student").order("id", { ascending: false });
    if (error) return res.status(500).json({ error: "Internal server error" });
    res.json(data || []);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
});

const byIdNumberHandler = async (req: express.Request, res: express.Response) => {
  try {
    const idNumber = String(req.query.id ?? req.query.idNumber ?? "").trim();
    if (!idNumber) return res.status(400).json({ error: "ID number is required" });
    const { data, error } = await supabase().from("users").select("id, name, email, id_number").eq("role", "student").eq("id_number", idNumber).maybeSingle();
    if (error) return res.status(500).json({ error: "Internal server error" });
    if (!data) return res.status(404).json({ error: "No student found with that ID number" });
    res.json(data);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
};
app.get("/api/users/by-id-number", byIdNumberHandler);
app.get("/users/by-id-number", byIdNumberHandler);

app.post("/api/users", async (req, res) => {
  try {
    const { name, email, password, id_number } = req.body;
    if (process.env.NODE_ENV !== "production") {
      console.log("[POST /api/users] body:", JSON.stringify({ name, email, id_number }));
    }
    if (!name || !email || !password) return res.status(400).json({ error: "Name, email, and password are required" });
    const idNum = (id_number != null && String(id_number).trim() !== "") ? String(id_number).trim() : null;
    const payload: Record<string, unknown> = { name, email, password, role: "student", id_number: idNum };
    if (process.env.NODE_ENV !== "production") {
      console.log("[POST /api/users] insert payload:", JSON.stringify(payload));
    }
    const { data, error } = await supabase().from("users").insert(payload).select("id, name, email, role, id_number").maybeSingle();
    if (error) {
      if (process.env.NODE_ENV !== "production") console.error("[POST /api/users] Supabase error:", error);
      return res.status(500).json({ error: error.message || "Internal server error" });
    }
    if (!data) return res.status(500).json({ error: "Failed to create user" });
    if (process.env.NODE_ENV !== "production") {
      console.log("[POST /api/users] created:", JSON.stringify(data));
    }
    res.json(data);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.patch("/api/users/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { name, email, password, id_number } = req.body;
    const u: Record<string, unknown> = {};
    if (name !== undefined) u.name = name;
    if (email !== undefined) u.email = email;
    if (password !== undefined && password !== "") u.password = password;
    if (id_number !== undefined) u.id_number = id_number === "" ? null : String(id_number).trim();
    if (Object.keys(u).length === 0) return res.status(400).json({ error: "No fields to update" });
    const { error } = await supabase().from("users").update(u).eq("id", id);
    if (error) return res.status(500).json({ error: error.message || "Internal server error" });
    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.delete("/api/users/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { error } = await supabase().from("users").delete().eq("id", id);
    if (error) return res.status(500).json({ error: error.message || "Internal server error" });
    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/my-submissions/:userId", async (req, res) => {
  try {
    const userId = Number(req.params.userId);
    const [authored, collabRes] = await Promise.all([
      supabase().from("theses").select("*").eq("submitted_by", userId).order("id", { ascending: false }),
      supabase().from("collaboration_requests").select("thesis_id").eq("collaborator_user_id", userId).eq("status", "accepted")
    ]);
    if (authored.error) return res.status(500).json({ error: "Internal server error" });
    const authoredList = authored.data || [];
    if (collabRes.error) console.error("[my-submissions collaboration_requests]", collabRes.error);
    const collabIds = (collabRes.data || []).map((r: any) => r.thesis_id).filter(Boolean);
    let collabTheses: any[] = [];
    if (collabIds.length > 0) {
      const { data } = await supabase().from("theses").select("*").in("id", collabIds);
      collabTheses = data || [];
    }
    const byId = new Map(authoredList.map((t: any) => [t.id, t]));
    for (const t of collabTheses) {
      if (!byId.has(t.id)) byId.set(t.id, t);
    }
    const merged = Array.from(byId.values()).sort((a, b) => b.id - a.id);
    res.json(merged);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/collaboration-requests", async (req, res) => {
  try {
    const userId = Number(req.query.userId);
    if (!userId) return res.status(400).json({ error: "userId is required" });
    const { data, error } = await supabase().from("collaboration_requests").select("id, thesis_id, collaborator_user_id, requester_user_id, status, created_at").eq("collaborator_user_id", userId).eq("status", "pending").order("created_at", { ascending: false });
    if (error) return res.status(500).json({ error: error.message || "Internal server error" });
    const rows = data || [];
    const enriched = await Promise.all(rows.map(async (r: any) => {
      const [t, u] = await Promise.all([
        supabase().from("theses").select("id, title, author, year").eq("id", r.thesis_id).maybeSingle(),
        supabase().from("users").select("id, name").eq("id", r.requester_user_id).maybeSingle()
      ]);
      return { ...r, thesis: t.data, requester: u.data };
    }));
    res.json(enriched);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.patch("/api/collaboration-requests/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { status } = req.body;
    if (status !== "accepted" && status !== "declined") return res.status(400).json({ error: "status must be accepted or declined" });
    const { data: reqRow, error: fetchErr } = await supabase().from("collaboration_requests").select("thesis_id, collaborator_user_id").eq("id", id).maybeSingle();
    if (fetchErr || !reqRow) return res.status(500).json({ error: "Request not found" });
    const { error } = await supabase().from("collaboration_requests").update({ status }).eq("id", id);
    if (error) return res.status(500).json({ error: error.message || "Internal server error" });
    if (status === "declined") {
      const { data: userRow } = await supabase().from("users").select("id_number, name").eq("id", reqRow.collaborator_user_id).maybeSingle();
      if (userRow) {
        const idNum = userRow.id_number != null ? String(userRow.id_number).trim() : "";
        const userName = userRow.name != null ? String(userRow.name).trim() : "";
        const db = supabaseAdmin() || supabase();
        const { data: thesisRow } = await db.from("theses").select("collaborators").eq("id", reqRow.thesis_id).maybeSingle();
        const collabs = Array.isArray(thesisRow?.collaborators) ? thesisRow.collaborators : [];
        const filtered = collabs.filter((c: any) => {
          const cId = String(c?.id_number ?? c?.idNumber ?? "").trim();
          const cName = String(c?.name ?? "").trim();
          const matchId = idNum && cId && cId === idNum;
          const matchName = userName && cName && cName.toLowerCase() === userName.toLowerCase();
          return !matchId && !matchName;
        });
        const { error: updErr } = await db.from("theses").update({ collaborators: filtered }).eq("id", reqRow.thesis_id);
        if (updErr) {
          console.error("[decline: thesis update]", updErr);
          return res.status(500).json({ error: "Failed to remove collaborator from thesis" });
        }
      }
    }
    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
});

// 404 handler - ensure JSON response
app.use((_req, res) => res.status(404).json({ error: "Not found" }));

// Global error handler - ensure JSON
app.use((err: Error, _req: express.Request, res: express.Response) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

export default app;
