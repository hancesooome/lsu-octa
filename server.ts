import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let db: Database.Database;

try {
  const dbPath = path.join(__dirname, "lsu_octa.db");
  db = new Database(dbPath);
  console.log(`Database initialized at: ${dbPath}`);
} catch (err) {
  console.error("FAILED TO INITIALIZE DATABASE:", err);
  // Fallback to in-memory if file fails
  db = new Database(":memory:");
  console.log("Falling back to in-memory database.");
}

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('student', 'librarian'))
  );

  CREATE TABLE IF NOT EXISTS theses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    year INTEGER NOT NULL,
    college TEXT NOT NULL,
    summary TEXT NOT NULL,
    cover_image_url TEXT,
    pdf_url TEXT,
    awardee BOOLEAN DEFAULT 0,
    featured BOOLEAN DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected')),
    submitted_by INTEGER,
    approval_date TEXT,
    FOREIGN KEY (submitted_by) REFERENCES users(id)
  );

  -- Clean up college names
  UPDATE theses SET college = 'College of Arts and Sciences' WHERE college LIKE '%CAS%';
  UPDATE theses SET college = 'College of Business and Accountancy' WHERE college LIKE '%CBA%';
  UPDATE theses SET college = 'College of Criminal Justice Education' WHERE college LIKE '%CCJE%';
  UPDATE theses SET college = 'College of Computer Studies, Engineering, and Architecture' WHERE college LIKE '%CCSEA%';
  UPDATE theses SET college = 'College of Nursing' WHERE college LIKE '%CON%';
  UPDATE theses SET college = 'College of Teacher Education' WHERE college LIKE '%CTE%';
  UPDATE theses SET college = 'College of Tourism and Hospitality Management' WHERE college LIKE '%CTHM%';
`);

// Seed initial data if empty
const userCount = db.prepare("SELECT COUNT(*) as count FROM users").get() as { count: number };
if (userCount.count === 0) {
  db.prepare("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)").run(
    "Librarian User", "librarian@lsu.edu.ph", "password123", "librarian"
  );
  db.prepare("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)").run(
    "Student User", "student@lsu.edu.ph", "password123", "student"
  );

  // Seed some approved theses
  const insertThesis = db.prepare(`
    INSERT INTO theses (title, author, year, college, summary, cover_image_url, pdf_url, awardee, featured, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertThesis.run(
    "AI-Driven Smart Campus Navigation",
    "Juan Dela Cruz",
    2024,
    "College of Computer Studies, Engineering, and Architecture",
    "A comprehensive study on implementing indoor positioning systems for large university campuses using BLE beacons and machine learning.",
    "https://picsum.photos/seed/thesis1/800/600",
    "https://example.com/sample.pdf",
    1,
    1,
    "approved"
  );

  insertThesis.run(
    "Sustainable Tourism in Misamis Occidental",
    "Maria Clara",
    2023,
    "College of Tourism and Hospitality Management",
    "Exploring the impact of eco-tourism on local communities and the preservation of natural heritage sites in Northern Mindanao.",
    "https://picsum.photos/seed/thesis2/800/600",
    "https://example.com/sample.pdf",
    0,
    0,
    "approved"
  );
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.post("/api/login", (req, res) => {
    const { email, password, role } = req.body;
    const user = db.prepare("SELECT * FROM users WHERE email = ? AND password = ? AND role = ?").get(email, password, role) as any;
    if (user) {
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  });

  app.get("/api/theses", (req, res) => {
    const { status, college, year, awardee, search } = req.query;
    let query = "SELECT * FROM theses WHERE 1=1";
    const params: any[] = [];

    if (status) {
      query += " AND status = ?";
      params.push(status);
    }
    if (college) {
      query += " AND college = ?";
      params.push(college);
    }
    if (year) {
      query += " AND year = ?";
      params.push(year);
    }
    if (awardee === 'true') {
      query += " AND awardee = 1";
    }
    if (search) {
      query += " AND (title LIKE ? OR author LIKE ? OR summary LIKE ?)";
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam);
    }

    query += " ORDER BY year DESC, id DESC";
    const theses = db.prepare(query).all(...params);
    res.json(theses);
  });

  app.get("/api/theses/featured", (req, res) => {
    const thesis = db.prepare("SELECT * FROM theses WHERE featured = 1 AND status = 'approved' LIMIT 1").get();
    res.json(thesis || null);
  });

  app.get("/api/college-stats", (req, res) => {
    const stats = db.prepare(`
      SELECT college, COUNT(*) as count 
      FROM theses 
      WHERE status = 'approved' 
      GROUP BY college
    `).all();
    res.json(stats);
  });

  app.get("/api/theses/:id", (req, res) => {
    const thesis = db.prepare("SELECT * FROM theses WHERE id = ?").get(req.params.id);
    if (thesis) res.json(thesis);
    else res.status(404).json({ error: "Thesis not found" });
  });

  app.post("/api/theses", (req, res) => {
    const { title, author, year, college, summary, cover_image_url, pdf_url, submitted_by, is_awardee_candidate } = req.body;
    const result = db.prepare(`
      INSERT INTO theses (title, author, year, college, summary, cover_image_url, pdf_url, submitted_by, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')
    `).run(title, author, year, college, summary, cover_image_url, pdf_url, submitted_by);
    res.json({ id: result.lastInsertRowid });
  });

  app.patch("/api/theses/:id", (req, res) => {
    const { status, awardee, featured, approval_date } = req.body;
    const updates: string[] = [];
    const params: any[] = [];

    if (status) { updates.push("status = ?"); params.push(status); }
    if (awardee !== undefined) { updates.push("awardee = ?"); params.push(awardee ? 1 : 0); }
    if (featured !== undefined) {
      // If setting a new featured, unset others
      if (featured) {
        db.prepare("UPDATE theses SET featured = 0").run();
      }
      updates.push("featured = ?");
      params.push(featured ? 1 : 0);
    }
    if (approval_date) { updates.push("approval_date = ?"); params.push(approval_date); }

    if (updates.length === 0) return res.status(400).json({ error: "No fields to update" });

    params.push(req.params.id);
    db.prepare(`UPDATE theses SET ${updates.join(", ")} WHERE id = ?`).run(...params);
    res.json({ success: true });
  });

  app.get("/api/my-submissions/:userId", (req, res) => {
    const theses = db.prepare("SELECT * FROM theses WHERE submitted_by = ? ORDER BY id DESC").all(req.params.userId);
    res.json(theses);
  });

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

startServer();
