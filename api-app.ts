/**
 * Shared API app – used by server.ts for local dev only.
 * Vercel uses api/[[...path]].ts directly (no imports).
 */
import express from "express";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("SUPABASE_URL or SUPABASE_ANON_KEY is not set");
  return createClient(url, key);
}

let _supabase: ReturnType<typeof createClient> | null = null;
function supabase() {
  if (!_supabase) _supabase = getSupabase();
  return _supabase;
}

export function createApiApp() {
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
      res.json(data || []);
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
      const { title, author, year, college, summary, cover_image_url, pdf_url, submitted_by } = req.body;
      const { data, error } = await supabase().from("theses").insert({ title, author, year, college, summary, cover_image_url, pdf_url, submitted_by, status: "pending" }).select("id").maybeSingle();
      if (error) return res.status(500).json({ error: "Internal server error" });
      res.json({ id: data?.id });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.patch("/api/theses/:id", async (req, res) => {
    try {
      const { status, awardee, featured, approval_date } = req.body;
      const id = Number(req.params.id);
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

  app.get("/api/users", async (_req, res) => {
    try {
      const { data, error } = await supabase().from("users").select("id, name, email, role").eq("role", "student").order("id", { ascending: false });
      if (error) return res.status(500).json({ error: "Internal server error" });
      res.json(data || []);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/users", async (req, res) => {
    try {
      const { name, email, password } = req.body;
      if (!name || !email || !password) return res.status(400).json({ error: "Name, email, and password are required" });
      const { data, error } = await supabase().from("users").insert({ name, email, password, role: "student" }).select("id, name, email, role").maybeSingle();
      if (error) return res.status(500).json({ error: error.message || "Internal server error" });
      if (!data) return res.status(500).json({ error: "Failed to create user" });
      res.json(data);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.patch("/api/users/:id", async (req, res) => {
    try {
      const id = Number(req.params.id);
      const { name, email, password } = req.body;
      const u: Record<string, unknown> = {};
      if (name !== undefined) u.name = name;
      if (email !== undefined) u.email = email;
      if (password !== undefined && password !== "") u.password = password;
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
      const { data, error } = await supabase().from("theses").select("*").eq("submitted_by", Number(req.params.userId)).order("id", { ascending: false });
      if (error) return res.status(500).json({ error: "Internal server error" });
      res.json(data || []);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  return app;
}
