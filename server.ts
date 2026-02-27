import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("SUPABASE_URL or SUPABASE_ANON_KEY is not set in environment variables");
}

const supabase = createClient(supabaseUrl, supabaseKey);

/** Creates the Express app with API routes only (used for Vercel serverless) */
export function createApiApp() {
  const app = express();
  app.use(express.json());

  // API Routes
  app.post("/api/login", async (req, res) => {
    const { email, password, role } = req.body;
    try {
      const { data, error } = await supabase
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
      let query = supabase.from("theses").select("*");

      if (status) {
        query = query.eq("status", status);
      }
      if (college) {
        query = query.eq("college", college);
      }
      if (year) {
        query = query.eq("year", Number(year));
      }
      if (awardee === "true") {
        query = query.eq("awardee", true);
      }
      if (search) {
        const term = `%${search}%`;
        query = query.or(
          `title.ilike.${term},author.ilike.${term},summary.ilike.${term}`
        );
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
      const { data, error } = await supabase
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
      const { data, error } = await supabase
        .from("theses")
        .select("college, status")
        .eq("status", "approved");

      if (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal server error" });
      }

      const statsMap: Record<string, number> = {};
      (data || []).forEach((row: any) => {
        const key = row.college;
        statsMap[key] = (statsMap[key] || 0) + 1;
      });

      const stats = Object.entries(statsMap).map(([college, count]) => ({
        college,
        count,
      }));

      res.json(stats);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/theses/:id", async (req, res) => {
    try {
      const { data, error } = await supabase
        .from("theses")
        .select("*")
        .eq("id", Number(req.params.id))
        .maybeSingle();

      if (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal server error" });
      }

      if (!data) {
        return res.status(404).json({ error: "Thesis not found" });
      }

      res.json(data);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/theses", async (req, res) => {
    const { title, author, year, college, summary, cover_image_url, pdf_url, submitted_by } =
      req.body;
    try {
      const { data, error } = await supabase
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

    if (status) {
      updates.status = status;
    }
    if (awardee !== undefined) {
      updates.awardee = awardee;
    }
    if (featured !== undefined) {
      if (featured) {
        await supabase.from("theses").update({ featured: false }).neq("id", id);
      }
      updates.featured = featured;
    }
    if (approval_date) {
      updates.approval_date = approval_date;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }

    try {
      const { error } = await supabase.from("theses").update(updates).eq("id", id);

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
    const userId = Number(req.params.userId);
    try {
      const { data, error } = await supabase
        .from("theses")
        .select("*")
        .eq("submitted_by", userId)
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

async function startServer() {
  const app = createApiApp();
  const PORT = 3000;

  // Vite middleware for development
  const isProduction = process.env.NODE_ENV === "production";
  
  if (!isProduction) {
    console.log("Starting in DEVELOPMENT mode with Vite middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting in PRODUCTION mode...");
    const distPath = path.join(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

// Skip listen when running on Vercel (API is served as serverless)
if (process.env.VERCEL !== "1") {
  startServer().catch((err) => {
    console.error("Failed to start server", err);
    process.exit(1);
  });
}
