# ⚡ Supabase Setup Guide for NE8 Corridor

This guide explains how to connect your Supabase project so your website can receive disaster photos and hazard descriptions from drivers in real time.

---

## 1. Create a Free Supabase Project
1. Go to [supabase.com](https://supabase.com) and sign in or sign up.
2. Click **"New Project"**.
3. Choose an organization, enter a project name (e.g. `ne8-corridor`), set a secure database password, and pick a region close to your users (e.g., `South Asia (Mumbai)`).
4. Click **"Create new project"** and wait ~1-2 minutes for it to provision.

---

## 2. Run the Database & Storage Setup SQL
1. In your Supabase project dashboard, click on **SQL Editor** in the left sidebar.
2. Click **"New query"**.
3. Open the file [`supabase-schema.sql`](supabase-schema.sql) in this repository, copy its entire contents, and paste them into the SQL Editor.
4. Click the green **"Run"** button.

This automatically:
- Creates the `incidents` table with all driver reporting columns.
- Configures Row Level Security (RLS) allowing anonymous drivers to post reports and anyone to view them.
- Enables Realtime broadcast on the table.
- Creates the public storage bucket named `incident-photos` with upload permissions.

---

## 3. Find Your Supabase Project URL & Anon Key
1. In your Supabase dashboard, click the **Project Settings** (gear icon) at the bottom of the left sidebar.
2. Click **Data API** (under Configuration) or **API Keys**.
3. You will see:
   - **Project URL**: something like `https://abcdefghijklm.supabase.co`
   - **Project API Keys** -> `anon` / `public`: a long key starting with `eyJhbGci...`
4. Copy both values.

---

## 4. Connect It to Your Website
You can connect your credentials in either of two easy ways:

### Option A: Via the Web App (No code changes needed!)
1. Open your deployed website or open `incidents.html` in your browser.
2. Click the **"⚙️ Supabase Setup"** button in the header or at the top of the reporting desk.
3. Paste your **Supabase Project URL** and **Anon Public Key**.
4. Click **"Save & Connect"**. The badge will switch to **"🟢 Supabase Live Cloud Connected"**!

### Option B: In `js/config.js` (Recommended for GitHub Pages deployment)
Edit `js/config.js` and paste your credentials:
```javascript
window.NE8_CONFIG = {
  mapsKey: "", // (Optional) Google Maps API Key
  supabaseUrl: "https://your-project.supabase.co",
  supabaseAnonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  supabaseBucket: "incident-photos",
  cameraSrc: "https://videos.pexels.com/video-files/9338498/9338498-hd_1280_720_24fps.mp4",
};
```

---

## 5. Deploy to GitHub
Commit and push the changes to your GitHub repository:
```bash
git add .
git commit -m "Add Supabase driver photos and reports integration"
git push
```
Your GitHub Pages site will now receive live driver photos and messages from anywhere in the world!

---

## 6. (Optional) Deploy IMD Weather Edge Function & Secrets
If you obtain an official India Meteorological Department (IMD) API Key and JWT Token:
1. Deploy the Edge Function using the Supabase CLI:
   ```bash
   supabase functions deploy imd-weather --no-verify-jwt
   ```
2. Set your IMD credentials as secure environment secrets in Supabase (they will never be exposed to the browser):
   ```bash
   supabase secrets set IMD_API_KEY="your-imd-api-key"
   supabase secrets set IMD_JWT_TOKEN="your-imd-jwt-token"
   ```
3. Run the updated `supabase-schema.sql` in your Supabase SQL Editor to create the `imd_weather_cache` table.

> **Note:** If IMD API keys are not set, the app automatically falls back to official live IMD NWFC feeds (`mausam.imd.gov.in`), so live meteorological data works right out of the box with zero configuration!
