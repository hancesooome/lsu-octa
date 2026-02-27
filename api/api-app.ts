/**
 * API-only Express app for Vercel serverless.
 * Lives inside api/ so Vercel bundles it with the function.
 */
import express from "express";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error("SUPABASE_URL or SUPABASE_ANON_KEY is not set in environment variables");
  }
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
    const hasUrl = !!(process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL);
    const hasKey = !!(process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY);
    res.json({
      ok: true,
      supabaseConfigured: hasUrl && hasKey,
      env: process.env.VERCEL ? "vercel" : "local",
    });
  });

  app.post("/api/login", async (req, res) => {
    const { email, password, role } = req.body;
    try {
      const { data, error } = await supabase()
        .from("users")
        .select("*")
        .eq("email", email)
        .eq("password", password)
        .eq("role", role)
        .maybeSingle();

      if (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal server error" });
      }
      if (!data) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      const { password: _password, ...userWithoutPassword } = data as any;
      res.json(userWithoutPassword);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/theses", async (req, res) => {
    const { status, college, year, awardee, search } = req.query as any;
    try {
      let query = supabase().from("theses").select("*");
      if (status) query = query.eq("status", status);
      if (college) query = query.eq("college", college);
      if (year) query = query.eq("year", Number(year));
      if (awardee === "true") query = query.eq("awardee", true);
      if (search) {
        const term = `%${search}%`;
        query = query.or(`title.ilike.${term},author.ilike.${term},summary.ilike.${term}`);
      }
      query = query.order("year", { ascending: false }).order("id", { ascending: false });
      const { data, error } = await query;
      if (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal server error" });
      }
      res.json(data || []);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/theses/featured", async (_req, res) => {
    try {
      const { data, error } = await supabase()
        .from("theses")
        .select("*")
        .eq("featured", true)
        .eq("status", "approved")
        .order("id", { ascending: false })
        .limit(1);
      if (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal server error" });
      }
      res.json(data?.[0] || null);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/college-stats", async (_req, res) => {
    try {
      const { data, error } = await supabase()
        .from("theses")
        .select("college, status")
        .eq("status", "approved");
      if (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal server error" });
      }
      const statsMap: Record<string, number> = {};
      (data || []).forEach((row: any) => {
        statsMap[row.college] = (statsMap[row.college] || 0) + 1;
      });
      res.json(Object.entries(statsMap).map(([college, count]) => ({ college, count })));
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/theses/:id", async (req, res) => {
    try {
      const { data, error } = await supabase()
        .from("theses")
        .select("*")
        .eq("id", Number(req.params.id))
        .maybeSingle();
      if (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal server error" });
      }
      if (!data) return res.status(404).json({ error: "Thesis not found" });
      res.json(data);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/theses", async (req, res) => {
    const { title, author, year, college, summary, cover_image_url, pdf_url, submitted_by } = req.body;
    try {
      const { data, error } = await supabase()
        .from("theses")
        .insert({
          title,
          author,
          year,
          college,
          summary,
          cover_image_url,
          pdf_url,
          submitted_by,
          status: "pending",
        })
        .select("id")
        .maybeSingle();
      if (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal server error" });
      }
      res.json({ id: data?.id });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.patch("/api/theses/:id", async (req, res) => {
    const { status, awardee, featured, approval_date } = req.body;
    const id = Number(req.params.id);
    const updates: any = {};
    if (status) updates.status = status;
    if (awardee !== undefined) updates.awardee = awardee;
    if (featured !== undefined) {
      if (featured) await supabase().from("theses").update({ featured: false }).neq("id", id);
      updates.featured = featured;
    }
    if (approval_date) updates.approval_date = approval_date;
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }
    try {
      const { error } = await supabase().from("theses").update(updates).eq("id", id);
      if (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal server error" });
      }
      res.json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/my-submissions/:userId", async (req, res) => {
    try {
      const { data, error } = await supabase()
        .from("theses")
        .select("*")
        .eq("submitted_by", Number(req.params.userId))
        .order("id", { ascending: false });
      if (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal server error" });
      }
      res.json(data || []);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  return app;
}
