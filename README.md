<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/06961b56-75ab-4c6a-b28e-959efc49fe20

## Run Locally

**Prerequisites:** Node.js

1. `npm install`
2. Copy `.env.example` to `.env` and fill in your Supabase values:
   ```
   VITE_SUPABASE_URL=https://cnhcbxgsttrsvzfqzfxa.supabase.co
   VITE_SUPABASE_ANON_KEY=your_anon_key
   ```
3. `npm run dev`

## Deploy to Vercel

`.env` is gitignored, so add env vars in Vercel:

1. **Vercel → Project → Settings → Environment Variables**
2. Add (Production + Preview):
   - `VITE_SUPABASE_URL` = `https://cnhcbxgsttrsvzfqzfxa.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = your Supabase anon key (JWT from Supabase dashboard)
3. **Redeploy** (Deployments → ⋮ → Redeploy)

**Check:** `https://your-app.vercel.app/api/health`  
→ `supabaseConfigured: true` means it’s working.
