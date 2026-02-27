<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/06961b56-75ab-4c6a-b28e-959efc49fe20

## Run Locally

**Prerequisites:**  Node.js

1. Install dependencies: `npm install`
2. Create `.env` with:
   - `VITE_SUPABASE_URL` or `SUPABASE_URL` = your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` or `SUPABASE_ANON_KEY` = your Supabase anon key
3. Run the app: `npm run dev`

## Deploy to Vercel

**Important:** `.env` is gitignored, so you must add env vars in Vercel.

1. In Vercel: **Project → Settings → Environment Variables**
2. Add (for Production, Preview, and Development):
   - `VITE_SUPABASE_URL` = `https://YOUR_PROJECT_REF.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = your Supabase anon/publishable key
   - Or use `SUPABASE_URL` and `SUPABASE_ANON_KEY` instead
3. Redeploy

**Debug:** After deploy, open `https://your-app.vercel.app/api/health`:
- `supabaseConfigured: true` → env vars are set correctly
- `supabaseConfigured: false` → add env vars in Vercel and redeploy
