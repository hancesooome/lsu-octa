# LSU OCTA

**La Salle University – Online Capstone Thesis Archive**

A full-stack web application for submitting, reviewing, and browsing undergraduate capstone theses. Students submit research with cover images and PDFs; librarians approve or reject submissions and manage featured content and Thesis of the Year candidates.

---

## Features

- **Student submissions** – Submit thesis with title, college, year, abstract, cover image (JPG/PNG, 5MB), and full PDF (20MB). Optional collaborators by ID number; optional “Thesis of the Year” candidate flag.
- **File storage** – Uploads go to Supabase Storage bucket `research-files`. Files are removed when a thesis is deleted.
- **Collaboration requests** – Co-authors receive collaboration requests to accept or decline; pending collaborators block approve/reject until resolved.
- **Librarian control panel** – Review pending submissions, approve/reject, award Thesis of the Year, feature theses, delete rejected entries.
- **Public archive** – Browse approved theses with filters (college, year, Thesis of the Year), search, and featured spotlight.
- **My Submissions** – Students see their submitted and co-authored theses and collaboration requests.

---

## Tech Stack

| Layer      | Technology                    |
| ---------- | ----------------------------- |
| Frontend   | React 19, Vite 6, Tailwind 4, Motion |
| Backend    | Express (Node), TypeScript    |
| Database   | Supabase (PostgreSQL)        |
| Storage    | Supabase Storage (`research-files`) |
| Deploy     | Vercel                        |

---

## Prerequisites

- **Node.js** 18+
- **Supabase** project ([supabase.com](https://supabase.com))
- **Vercel** account (optional, for production)

---

## Setup

### 1. Clone and install

```bash
git clone <repository-url>
cd lsu-octa
npm install
```

### 2. Environment variables

Create a `.env` file in the project root:

```env
# Supabase (required)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Optional
APP_URL=http://localhost:3000
GEMINI_API_KEY=your-gemini-key
```

Get the keys from **Supabase Dashboard → Project Settings → API**.

### 3. Supabase configuration

In your Supabase project:

1. **Database** – Create tables: `users`, `theses`, `collaboration_requests` (and any migrations you use). Ensure the `theses` table has columns: `title`, `author`, `year`, `college`, `summary`, `cover_image_url`, `pdf_url`, `status`, `submitted_by`, `awardee`, `featured`, `collaborators` (JSONB), etc.
2. **Permissions** – Grant the `anon` role the needed table access (e.g. SELECT/INSERT/UPDATE/DELETE on `theses` as required by your API). Use RLS or table grants as appropriate.
3. **Storage** – Create a **public** bucket named `research-files`. Add storage policies so `anon` can:
   - **INSERT** and **SELECT** (uploads and public read)
   - **DELETE** (so the API can remove files when a thesis is deleted)

### 4. Run locally

```bash
npm run dev
```

App: **http://localhost:3000**  
API is served by the same server (e.g. `/api/health`, `/api/theses`, etc.).

### 5. Build for production

```bash
npm run build
npm run preview   # optional: serve dist locally
```

---

## Project structure

```
lsu-octa/
├── api/                    # Vercel serverless API routes
│   ├── [[...path]].ts       # Catch-all API handler
│   ├── theses/
│   │   └── [id].ts          # GET / PATCH / DELETE single thesis
│   ├── collaboration-requests/
│   ├── my-submissions/
│   └── users/
├── public/                 # Static assets (served at root)
│   ├── sitemap.xml         # Sitemap for search engines
│   └── robots.txt          # Crawler directives
├── src/
│   ├── components/         # React components
│   │   ├── SubmissionForm.tsx
│   │   ├── LibrarianDashboard.tsx
│   │   ├── CollaborationRequests.tsx
│   │   └── ...
│   ├── supabase.ts         # Frontend Supabase client & upload helpers
│   ├── types.ts
│   └── App.tsx
├── api-app.ts              # Shared Express app (used by server + Vercel)
├── server.ts               # Local dev server (Vite + Express)
├── .env                    # Local env (do not commit)
└── package.json
```

---

## Deployment (Vercel)

1. Connect the repo to Vercel.
2. Add the same environment variables in **Project Settings → Environment Variables** (including `VITE_*` for the frontend and `SUPABASE_*` for the API).
3. Build command: `npm run build`  
   Output directory: `dist`  
   Install command: `npm install`
4. Vercel will use the `api/` serverless functions for `/api/*` and serve the SPA from `dist`.

---

## Scripts

| Command        | Description                    |
| -------------- | ------------------------------ |
| `npm run dev`  | Start dev server with Vite     |
| `npm run build`| Production build (Vite)        |
| `npm run preview` | Serve `dist` locally        |
| `npm run lint` | Type-check (tsc)               |

---

## SEO & discoverability

After deploying, help search engines find your site:

1. **Replace the domain** in `public/sitemap.xml` and `public/robots.txt` — change `https://your-domain.com` to your live URL (e.g. `https://lsu-octa.vercel.app`).

2. **Google Search Console** — Go to [search.google.com/search-console](https://search.google.com/search-console), add your property, verify ownership, and submit your sitemap URL (e.g. `https://your-domain.com/sitemap.xml`).

3. **Meta tags** — Already set in `index.html` (title, description, Open Graph, Twitter Card). Add `og:image` and `twitter:image` with a 1200×630 preview image when ready.

---

## License

Private / institutional use. See repository or institution for terms.
