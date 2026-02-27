import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { createApiApp } from "./api-app";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = createApiApp();

// Vercel uses server.ts and expects default export – no Vite import here
export default app;

// Local dev only – Vite is loaded dynamically so it never runs on Vercel
if (process.env.VERCEL !== "1") {
  (async () => {
    const express = (await import("express")).default;
    const { createServer: createViteServer } = await import("vite");
    const isProduction = process.env.NODE_ENV === "production";

    if (!isProduction) {
      console.log("Starting in DEVELOPMENT mode with Vite middleware...");
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
    } else {
      const distPath = path.join(__dirname, "dist");
      app.use(express.static(distPath));
      app.get("*", (_req, res) => res.sendFile(path.join(distPath, "index.html")));
    }
    app.listen(3000, "0.0.0.0", () => console.log("Server running on http://localhost:3000"));
  })().catch((err) => {
    console.error("Failed to start server", err);
    process.exit(1);
  });
}
