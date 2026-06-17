# SETUP GUIDE — The Aquarium

Follow this step-by-step tutorial to configure, deploy, and run **The Aquarium** (AI Travel Agent Curation Dashboard) completely on free-tier services.

---

## 1. Supabase Setup
1. Visit [supabase.com](https://supabase.com) and create a free account.
2. Spin up a new project named `ai-aquarium` (select a region close to you).
3. Once the database is initialized, navigate to the **SQL Editor** tab in the sidebar.
4. Click **New Query**, copy the entire contents of [supabase/schema.sql](file:///c:/Users/Ethan/Desktop/Personal%20Projects/ai_aquarium/supabase/schema.sql) and paste it into the editor.
5. Click **Run** to generate the tables (`fish`, `fish_context`, `daily_digests`, `app_settings`) and seed default parameters.
6. Navigate to **Project Settings** (gear icon) -> **API**.
7. Copy the following keys:
   - **Project URL**
   - **anon public** key (Client anon key)
   - **service_role** key (Secret service role key - *Keep this hidden*)

---

## 2. Gemini API Key Registration
1. Go to [aistudio.google.com](https://aistudio.google.com).
2. Sign in with your Google account.
3. Click the **Get API Key** button in the header.
4. Click **Create API Key** and choose a project to associate it with.
5. Copy your generated key. The Gemini 1.5 Flash model runs on the free tier (1,500 requests/day) without requiring any billing or credit card details.

---

## 3. Tavily API Key Registration
1. Go to [tavily.com](https://tavily.com) and register for a free account.
2. Once logged in, navigate to your dashboard console.
3. Copy your **API Key** from the home panel. The free tier grants 1,000 search queries per month (ideal for daily agent scrapes).

---

## 4. Deploy Supabase Edge Function
To push the `generate-trip-digest` script to your Supabase host:
1. Ensure the Supabase CLI is installed on your local machine. If not, install it via npm or scoop:
   ```bash
   npm install -g supabase
   ```
2. Log in using your Supabase account token:
   ```bash
   supabase login
   ```
3. Initialize Supabase in your project root:
   ```bash
   supabase init
   ```
4. Link your CLI to your Supabase project (replace `your-project-ref` with your project code from the Supabase URL):
   ```bash
   supabase link --project-ref your-project-ref
   ```
5. Deploy the function code:
   ```bash
   supabase functions deploy generate-trip-digest
   ```
6. Set the required secrets on Supabase for the function execution (replace placeholders with your actual keys):
   ```bash
   supabase secrets set GEMINI_API_KEY=your_gemini_key TAVILY_API_KEY=your_tavily_key
   ```
*(Note: `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are automatically provided by the Supabase runtime environment, so you do not need to set them manually.)*

---

## 5. Schedule the Daily Cron Job
To automate the daily 6:00 AM UTC travel curation:
1. Go to your **Supabase Dashboard** -> **SQL Editor**.
2. Run the following SQL to enable the `pg_cron` extension and register the daily cron (replace `your-project-ref` in the URL with your project ref, and insert your actual `anon` key inside the Authorization header):
   ```sql
   -- Enable the cron extension
   CREATE EXTENSION IF NOT EXISTS pg_cron;

   -- Schedule the function to run at 6:00 AM UTC every day
   SELECT cron.schedule(
     'daily-trip-planner-feed',
     '0 6 * * *',
     $$
     SELECT net.http_post(
       url := 'https://your-project-ref.supabase.co/functions/v1/generate-trip-digest',
       headers := '{"Content-Type": "application/json", "Authorization": "Bearer your_supabase_anon_key"}'::jsonb,
       body := '{}'::jsonb
     );
     $$
   );
   ```

---

## 6. Vercel Deployment
1. Initialize a Git repository in your project folder and push the code to a GitHub repository.
2. Log in to [vercel.com](https://vercel.com) and click **Add New** -> **Project**.
3. Import your GitHub repository.
4. Under **Environment Variables**, configure the following variables:
   - `VITE_SUPABASE_URL` = (Your Supabase project URL)
   - `VITE_SUPABASE_ANON_KEY` = (Your Supabase anon key)
5. Click **Deploy**. Vercel will build the React production bundle and host it.

---

## 7. Manual First Run Verification
Before waiting for the 6:00 AM UTC cron, you can test the entire pipeline:
1. Complete the Onboarding Quiz on the frontend dashboard.
2. Open the **Settings Panel** (gear icon top right).
3. Click **Generate Today's Digest Now**.
4. You will see the fish swim faster as the loader spins. The edge function will run Tavily searches, query Gemini, and populate the database.
5. Once completed, the fish will glow bright cyan and a new digest badge will pulse, unlocking today's destination travel card!

---

## 8. Free Tier Limits Summary

| Service | Free Tier Limit | Credit Card Required | Purpose |
|---|---|---|---|
| **Supabase** | 2 free projects, 500MB database, 50k Edge Function invocations/mo | No | Database tables & serverless Deno hosting |
| **Google Gemini** | 15 RPM, 1,500 requests/day (Gemini 1.5 Flash) | No | AI travel curation agent |
| **Tavily API** | 1,000 search queries/month | No | Web research, flights info & local Reddit tip scrapes |
| **Vercel** | Unlimited personal deployments | No | React client static build hosting |
