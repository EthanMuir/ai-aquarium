# AI Aquarium — Trip Planner Fish MVP
### Complete Build Specification for Google Lovable (Antigravity)

---

## Project Overview

Build a web application called **The Aquarium** — a personal AI agent dashboard styled as a living underwater aquarium. The MVP contains one agent: the **Trip Planner Fish**. This fish runs a daily AI-powered trip suggestion in the background using free API tiers, stores the result, and surfaces it as a beautiful "daily digest" card when the user clicks on the fish.

The core loop is:
1. User completes a one-time onboarding quiz to set their travel preferences
2. A daily background job fetches real travel research via Tavily API + generates a personalized trip suggestion via Google Gemini Flash API
3. User visits the site, clicks their fish, and reads today's trip suggestion
4. User can also browse past digest history

This is a personal-use single-user app. No auth system needed — protect it with a simple PIN or password gate on the frontend if desired. The whole stack should run free indefinitely.

---

## Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Frontend | React + Vite + Tailwind CSS | Fast, modern, Lovable-native |
| Backend / DB | Supabase (free tier) | Postgres DB + Edge Functions + Storage |
| Daily Cron | Supabase Edge Function (scheduled) | Runs the daily fish digest generation |
| AI Model | Google Gemini 1.5 Flash (free tier via AI Studio) | 1,500 req/day free, no credit card |
| Web Research | Tavily API (free tier) | 1,000 searches/month free, AI-optimized scraping |
| Hosting | Vercel (free tier) | Auto-deploys from GitHub |
| Animations | Framer Motion | Smooth fish swimming + UI transitions |

---

## Visual Design Specification

### Aesthetic Direction

The app is called The Aquarium. It should feel like looking through the glass of a premium, dimly-lit saltwater aquarium at night — the kind you see in high-end restaurants or marine biology research stations. Dark, immersive, alive with subtle movement. This is **not** a cartoon fish game. It is a sophisticated, ambient personal dashboard.

### Color Palette

```
--deep-ocean:     #050d1a   /* near-black background, the tank */
--midnight-water: #0a1628   /* slightly lighter panel backgrounds */
--bioluminescent: #00e5ff   /* electric cyan — primary accent, fish glow, CTAs */
--coral-warm:     #ff6b47   /* warm orange-coral — secondary accent, alerts, badges */
--sea-foam:       #b2eef4   /* pale aqua — body text, secondary labels */
--abyss:          #020810   /* deepest shadows */
--glass-sheen:    rgba(255,255,255,0.04)  /* subtle glass panels */
--kelp-green:     #1a3a2e   /* used sparingly for nature depth */
```

### Typography

- **Display / Wordmark:** "Playfair Display" — elegant, premium serif. Used for "The Aquarium" title, fish names, and digest headlines. Set in italic for the wordmark.
- **Body / UI:** "Inter" — clean, readable sans-serif for all interface labels, quiz text, digest body copy.
- **Data / Labels:** "JetBrains Mono" — monospace, used sparingly for stats, token counts, dates.

### Layout Structure

```
┌─────────────────────────────────────────────────────┐
│  🐠 The Aquarium          [Last updated: today 6am] │  ← Header bar, minimal
├─────────────────────────────────────────────────────┤
│                                                     │
│          [AQUARIUM TANK — Full viewport width]      │
│                                                     │
│   ~  ~  ~  ~  ~  ~  ~  ~  ~  ~  ~  ~  ~  ~  ~    │  ← Ambient particle bubbles
│                                                     │
│         🐟  ←swimming fish, glowing cyan           │
│                                                     │
│   ~  ~  ~  ~                          ~  ~  ~  ~   │
│                                                     │
│  [seabed layer with decorative coral/rocks SVGs]   │
└─────────────────────────────────────────────────────┘
│  [DIGEST PANEL — slides up from bottom on click]   │
└─────────────────────────────────────────────────────┘
```

### The Signature Element

**Bioluminescent fish glow.** The trip planner fish has a soft, pulsing cyan glow radiating from it — like deep-sea creatures that produce their own light. This glow brightens when a new digest is ready (indicating "fed" state). When no digest exists yet, it dims to a cooler, dimmer purple-blue. This single visual cue communicates system state without any text UI needed.

---

## Database Schema (Supabase)

### Table: `fish`
```sql
CREATE TABLE fish (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,                    -- "Trip Planner"
  slug TEXT UNIQUE NOT NULL,             -- "trip-planner"
  emoji TEXT,                            -- "🐟"
  description TEXT,                      -- short tagline
  color_accent TEXT,                     -- hex, per-fish theming
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Table: `fish_context`
```sql
CREATE TABLE fish_context (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fish_slug TEXT NOT NULL REFERENCES fish(slug),
  context_key TEXT NOT NULL,             -- e.g. "home_city", "budget", "travel_style"
  context_value TEXT,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(fish_slug, context_key)
);
```

### Table: `daily_digests`
```sql
CREATE TABLE daily_digests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fish_slug TEXT NOT NULL,
  digest_date DATE NOT NULL DEFAULT CURRENT_DATE,
  title TEXT,                            -- "Escape to the Azores"
  destination TEXT,
  country TEXT,
  region TEXT,
  headline TEXT,                         -- 1-sentence hook
  body_markdown TEXT,                    -- full digest content
  estimated_budget_low INTEGER,          -- CAD
  estimated_budget_high INTEGER,
  best_time_to_go TEXT,
  flight_info TEXT,                      -- scraped estimate from Ottawa
  hidden_gem TEXT,
  one_action_today TEXT,                 -- "Book flights 3 months out"
  research_sources JSONB,               -- array of Tavily URLs used
  model_used TEXT,                       -- "gemini-1.5-flash"
  generation_status TEXT DEFAULT 'pending',  -- pending | success | failed
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(fish_slug, digest_date)
);
```

### Table: `app_settings`
```sql
CREATE TABLE app_settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);
-- Seed with: INSERT INTO app_settings VALUES ('pin', '1234', now());
```

---

## Frontend Pages & Components

### 1. PIN Gate (if enabled)
A full-screen dark overlay with a simple 4-digit PIN pad. On correct entry, sets a session flag and reveals the app. Style: minimalist, centered, the Aquarium wordmark above the keypad.

### 2. Main Aquarium View (`/`)

**The Tank:**
- Full viewport canvas (or CSS + SVG) showing the underwater environment
- Animated CSS background: deep dark gradient with subtle light ray effects filtering down from the top (use CSS keyframe animation with pseudo-elements, suggesting sunlight from the water surface)
- Floating particle bubbles rising from the bottom (small white circles, varying sizes, random horizontal drift, CSS animation)
- Seabed layer at bottom: decorative SVG coral, rocks, and sea plants in deep teal/green tones
- The fish swims in a smooth horizontal figure-eight path using CSS animation or Framer Motion path animation

**The Fish:**
- SVG fish character, approximately 120px wide
- Design: sleek, elegant — not cartoonish. Think a stylized tropical fish. Cyan body with a warm coral-orange dorsal fin detail (matching the palette)
- Drop shadow glow: `filter: drop-shadow(0 0 18px #00e5ff)` pulsing with a 3s ease-in-out animation
- Fish name appears as a floating label below it in Playfair Display italic: *"Trip Planner"*
- **New digest badge:** when today's digest is ready, a small glowing dot appears top-right of the fish (coral-warm color, pulsing)
- On hover: fish slows its swim and turns to face the cursor slightly; glow intensifies; cursor changes to pointer
- On click: triggers the Digest Panel

**Header:**
- Minimal top bar: left side is the wordmark "The Aquarium" in Playfair Display italic, pale aqua color
- Right side: small text in JetBrains Mono showing "Last fed: Today, 6:02 AM" or "Next feed: Tomorrow, 6:00 AM"

### 3. Digest Panel (slide-up overlay)

Triggered by clicking the fish. A panel slides up from the bottom of the screen, covering ~70% of the viewport. Has a frosted glass aesthetic: `background: rgba(5, 13, 26, 0.92); backdrop-filter: blur(20px);`

**Panel Header:**
- Fish emoji + name: "🐟 Trip Planner"
- Date of digest in JetBrains Mono: "June 16, 2026"
- Close button (X) top right
- Tab bar: [ Today ] [ History ]

**Today Tab — Digest Card:**

```
┌─────────────────────────────────────────────────────┐
│  DESTINATION OF THE DAY                             │  ← small mono eyebrow label
│                                                     │
│  Escape to the Azores                               │  ← Playfair Display, large
│  São Miguel Island, Portugal                        │  ← subtitle, sea-foam color
│                                                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐         │
│  │ Budget   │  │ Duration │  │ Best For │         │
│  │ $2,400–  │  │ 7–10     │  │ Couples  │         │
│  │ $3,800   │  │ days     │  │ + Nature │         │
│  └──────────┘  └──────────┘  └──────────┘         │
│                                                     │
│  WHY NOW                                            │  ← section label
│  [2-3 sentence body paragraph from Gemini]         │
│                                                     │
│  GETTING THERE FROM OTTAWA                          │
│  [Flight estimate info, connection cities]          │
│                                                     │
│  THE HIDDEN GEM                                     │
│  [One specific local tip from Tavily research]      │
│                                                     │
│  YOUR ONE ACTION TODAY                              │
│  [Single actionable suggestion]                     │
│                                                     │
│  ─────────────────────────────────────────────     │
│  Sources: Nomadic Matt · Atlas Obscura · Reddit     │  ← small, mono
└─────────────────────────────────────────────────────┘
```

**History Tab:**
- A scrollable list of past digest cards, each showing: date, destination name, country, budget range
- Clicking one expands it to show the full digest inline
- Empty state: "Your travel history will appear here after your first few days."

### 4. Onboarding Quiz Modal

Triggered automatically on first visit (or via a settings icon on the fish's label). A full-screen modal, dark themed, with a progress bar across the top.

**Quiz Flow — 9 questions, one per screen:**

```
Q1: "Where are you flying from?"
    → Text input, placeholder "e.g. Ottawa, Canada"
    → Stored as: home_city

Q2: "What's your typical trip budget? (per person, CAD)"
    → Button grid: [ Under $1,500 ] [ $1,500–$3,000 ] [ $3,000–$6,000 ] [ $6,000+ ]
    → Stored as: budget_range

Q3: "How long do your trips usually run?"
    → Button grid: [ Weekend (2–3 days) ] [ Short (4–6 days) ] [ Week (7–10 days) ] [ Extended (2+ weeks) ]
    → Stored as: trip_duration

Q4: "What kind of traveller are you?"
    → Multi-select chips: [ Adventure ] [ Culture & History ] [ Beach & Relaxation ] [ Food & Drink ] [ Off the Beaten Path ] [ City Exploration ] [ Nature & Wildlife ]
    → Stored as: travel_style (comma-separated)

Q5: "Who do you usually travel with?"
    → Button grid: [ Solo ] [ Partner ] [ Friends ] [ Family with kids ]
    → Stored as: travel_party

Q6: "Any visa or passport restrictions we should know about?"
    → Text input, placeholder "e.g. Canadian passport, no US visa"
    → Stored as: passport_notes

Q7: "Any months you can't travel?"
    → Multi-select month chips (Jan–Dec)
    → Stored as: blackout_months

Q8: "Places you've already visited that we shouldn't repeat?"
    → Text area, placeholder "e.g. Paris, Tokyo, New York"
    → Stored as: visited_places

Q9: "Give us 3 words that describe your dream trip."
    → Text input, placeholder "e.g. warm, remote, ancient"
    → Stored as: dream_keywords
```

Each question screen has:
- Progress bar at top (fills cyan)
- Question in Playfair Display
- Input/selection below
- "Next →" button in coral-warm
- Fish silhouette watermark in background at 4% opacity

On completion: animated transition showing the fish swimming across the screen, then the aquarium view loads with a toast: *"Your fish is ready. First digest arrives tomorrow morning."*

### 5. Settings Panel

Accessible via a small gear icon in the header. Slide-in panel from the right. Options:
- Re-take the quiz (re-runs onboarding)
- View raw context stored for the fish
- Manually trigger a digest generation (for testing — calls the Edge Function directly)
- Toggle PIN gate on/off
- "About" section explaining the tech stack and APIs used

---

## Backend: Supabase Edge Function — Daily Digest Generator

**Function name:** `generate-trip-digest`
**Schedule:** Daily at 6:00 AM UTC (configurable)

### Full Logic Flow

```typescript
// pseudocode — implement in Deno/TypeScript

async function generateTripDigest() {

  // 1. Load user context from fish_context table
  const context = await loadFishContext('trip-planner')
  // Returns: { home_city, budget_range, travel_style, trip_duration, 
  //            travel_party, passport_notes, blackout_months, 
  //            visited_places, dream_keywords }

  // 2. Check if today's digest already exists
  const existing = await checkTodayDigest('trip-planner')
  if (existing) return  // skip if already generated

  // 3. Tavily Research Phase — 3 searches
  const currentMonth = getCurrentMonthName()
  
  const search1 = await tavilySearch(
    `best travel destinations ${currentMonth} 2026 ${context.budget_range} budget ${context.travel_style}`
  )
  
  const search2 = await tavilySearch(
    `flights from ${context.home_city} to [top destination from search1] price estimate`
  )
  
  const search3 = await tavilySearch(
    `[top destination] hidden gems local tips reddit 2025 2026`
  )

  // 4. Build Gemini prompt
  const prompt = buildGeminiPrompt(context, search1, search2, search3, currentMonth)

  // 5. Call Gemini 1.5 Flash
  const geminiResponse = await callGeminiFlash(prompt)

  // 6. Parse response into structured fields
  const digest = parseDigestResponse(geminiResponse)

  // 7. Save to daily_digests table
  await saveDigest('trip-planner', digest)
}
```

### Gemini Prompt Template

```
You are a world-class travel curator generating a daily personalized trip suggestion.

USER PROFILE:
- Flying from: ${context.home_city}
- Budget (per person): ${context.budget_range} CAD
- Trip length preference: ${context.trip_duration}
- Travel style: ${context.travel_style}
- Travels with: ${context.travel_party}
- Passport/visa notes: ${context.passport_notes}
- Blackout months: ${context.blackout_months}
- Already visited: ${context.visited_places}
- Dream trip keywords: ${context.dream_keywords}
- Current month: ${currentMonth}

RESEARCH GATHERED TODAY:
[Tavily Search 1 Results — Destination ideas]
${search1.results.map(r => r.content).join('\n\n')}

[Tavily Search 2 Results — Flight info]
${search2.results.map(r => r.content).join('\n\n')}

[Tavily Search 3 Results — Local tips]
${search3.results.map(r => r.content).join('\n\n')}

Based on this user profile and today's research, generate a single destination recommendation.

Respond ONLY in valid JSON. No markdown, no preamble, no explanation. Exactly this structure:

{
  "title": "string — evocative headline like 'Escape to the Azores'",
  "destination": "string — city or region name",
  "country": "string",
  "region": "string — e.g. 'Western Europe'",
  "headline": "string — one sentence hook, why this place right now",
  "why_now": "string — 2-3 sentences on why this month is ideal",
  "getting_there": "string — practical flight info from their home city, connections, estimate",
  "estimated_budget_low": number,
  "estimated_budget_high": number,
  "best_duration": "string — e.g. '7-10 days'",
  "best_for": "string — e.g. 'Couples who love nature'",
  "hidden_gem": "string — one specific local tip they won't find on TripAdvisor",
  "one_action_today": "string — one concrete thing they can do today to make this trip happen"
}
```

### Gemini API Call

```typescript
async function callGeminiFlash(prompt: string) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.8,
          maxOutputTokens: 1000
        }
      })
    }
  )
  return response.json()
}
```

### Tavily API Call

```typescript
async function tavilySearch(query: string) {
  const response = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${TAVILY_API_KEY}`
    },
    body: JSON.stringify({
      query,
      max_results: 5,
      search_depth: 'basic',
      include_answer: true
    })
  })
  return response.json()
}
```

---

## Environment Variables Required

```
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
GEMINI_API_KEY=
TAVILY_API_KEY=
APP_PIN=1234
```

---

## Animation Specifications

### Fish Swim Path
```css
@keyframes swim {
  0%   { transform: translateX(0px) translateY(0px) scaleX(1); }
  25%  { transform: translateX(200px) translateY(-30px) scaleX(1); }
  50%  { transform: translateX(350px) translateY(10px) scaleX(1); }
  75%  { transform: translateX(180px) translateY(-20px) scaleX(-1); }
  100% { transform: translateX(0px) translateY(0px) scaleX(1); }
}
.fish { animation: swim 18s ease-in-out infinite; }
```

### Glow Pulse
```css
@keyframes glow-pulse {
  0%, 100% { filter: drop-shadow(0 0 12px #00e5ff88); }
  50%       { filter: drop-shadow(0 0 28px #00e5ffcc); }
}
.fish-glow { animation: glow-pulse 3s ease-in-out infinite; }

/* New digest ready state */
.fish-fed { 
  animation: glow-pulse-bright 2s ease-in-out infinite;
}
@keyframes glow-pulse-bright {
  0%, 100% { filter: drop-shadow(0 0 20px #00e5ff) drop-shadow(0 0 40px #00e5ff44); }
  50%       { filter: drop-shadow(0 0 40px #00e5ff) drop-shadow(0 0 80px #00e5ff66); }
}
```

### Bubbles
```css
@keyframes rise {
  0%   { transform: translateY(0) translateX(0); opacity: 0.6; }
  50%  { transform: translateY(-40vh) translateX(8px); }
  100% { transform: translateY(-90vh) translateX(-5px); opacity: 0; }
}
/* Generate 15–20 bubble divs at random X positions, random animation-delay (0–8s), 
   random sizes (4px–12px), animation duration 6–12s */
```

### Light Rays
```css
/* 3-4 angled pseudo-element divs at the top of the tank */
/* linear-gradient from rgba(255,255,255,0.04) to transparent */
/* Rotated 15–25 degrees, varying widths */
/* Slow opacity pulse: 8s ease-in-out infinite */
```

### Digest Panel Slide-Up
```
Framer Motion: initial={{ y: '100%' }}, animate={{ y: '30%' }}, 
transition={{ type: 'spring', damping: 30, stiffness: 200 }}
Backdrop: animate opacity 0 → 0.6
```

---

## Fish SVG Design Reference

The trip planner fish should be a stylized tropical fish — suggest a semi-realistic design:
- Body shape: rounded teardrop, slightly elongated
- Color: gradient from deep cyan (#00bcd4) at the nose to a mid-blue (#1565c0) at the tail
- Dorsal fin and tail: coral-warm (#ff6b47) with slight transparency
- Eye: small white circle with a tiny dark pupil, with a subtle catchlight
- Optional: 2-3 thin stripe details in a slightly darker blue across the body
- All as clean SVG paths with no stroke, just fills and subtle gradients
- Named: `<g id="trip-planner-fish">` for easy JS reference

---

## Responsive Behavior

- **Desktop (>1024px):** Full aquarium tank takes 70vh. Digest panel slides up to cover bottom 65%.
- **Tablet (768–1024px):** Tank takes 60vh. Fish slightly smaller. Digest panel is full-width bottom sheet.
- **Mobile (<768px):** Tank takes 50vh. Fish at 80px. Digest panel opens as a full-screen overlay. Quiz is full-screen each step.

---

## Empty & Loading States

- **No quiz taken yet:** Fish swims but is dimmed and slightly desaturated. A soft tooltip appears after 3 seconds: *"Click me to get started"*
- **Quiz done, no digest yet:** Fish glows dimly purple-blue. Label shows: *"Checking in tomorrow..."*
- **Digest generating:** Fish swims slightly faster. Subtle spinner in the badge dot.
- **Digest ready:** Full bright cyan glow. Badge dot pulses coral-warm.
- **Digest failed:** Fish glow turns amber. Settings icon shows a red dot.

---

## Setup Tutorial Output Requirements

At the end of generation, output a complete `SETUP.md` file that walks through:

1. **Supabase setup** — create project, run the SQL schema above, get URL + service role key
2. **Gemini API key** — go to aistudio.google.com, create a project, generate a free API key (no credit card)
3. **Tavily API key** — go to tavily.com, sign up, get free API key (1,000 searches/month)
4. **Supabase Edge Function deployment** — how to deploy the `generate-trip-digest` function using Supabase CLI
5. **Scheduling the cron** — how to enable the pg_cron extension in Supabase and set the 6 AM schedule
6. **Vercel deployment** — connect GitHub repo, add environment variables, deploy
7. **First run test** — how to manually trigger the Edge Function from the Supabase dashboard to verify everything works before waiting for the cron
8. **Expected costs** — confirm all free tiers and their limits

---

## Future Fish (Do Not Build Yet — Reference Only)

The architecture should support adding new fish easily. Future fish planned:
- 💰 Financial Advisor Fish — daily FIRE progress digest
- 📈 Stock Market Fish — daily screener picks with rationale
- 🥗 Meal Planner Fish — weekly meal plan generated Sunday nights
- 💼 Business Opportunity Fish — daily micro-business or side hustle idea

Each fish would be a new row in the `fish` table, a new set of `fish_context` entries, and a new scheduled Edge Function. The frontend aquarium would render multiple fish swimming around.

---

## Deliverables Checklist

- [ ] Full React + Vite + Tailwind frontend
- [ ] Supabase schema SQL (all 4 tables)
- [ ] Supabase Edge Function: `generate-trip-digest` (TypeScript/Deno)
- [ ] Animated aquarium UI (fish + bubbles + light rays + seabed)
- [ ] 9-question onboarding quiz with progress bar
- [ ] Digest panel (Today + History tabs)
- [ ] Settings panel with manual trigger
- [ ] All empty/loading/error states handled
- [ ] Mobile responsive
- [ ] `SETUP.md` — complete API key and deployment tutorial
- [ ] `.env.example` file with all required variables

---

*Build this as a polished, production-quality application. The aesthetic should feel premium and immersive — this is a personal dashboard someone will check every morning. Every animation, color, and interaction should reinforce the feeling of a living, breathing underwater world.*
