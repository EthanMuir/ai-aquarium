-- CREATE TABLES

CREATE TABLE fish (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  emoji TEXT,
  description TEXT,
  color_accent TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE fish_context (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fish_slug TEXT NOT NULL REFERENCES fish(slug) ON DELETE CASCADE,
  context_key TEXT NOT NULL,
  context_value TEXT,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(fish_slug, context_key)
);

CREATE TABLE daily_digests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fish_slug TEXT NOT NULL,
  digest_date DATE NOT NULL DEFAULT CURRENT_DATE,
  title TEXT,
  destination TEXT,
  country TEXT,
  region TEXT,
  headline TEXT,
  body_markdown TEXT,
  estimated_budget_low INTEGER,
  estimated_budget_high INTEGER,
  best_time_to_go TEXT,
  flight_info TEXT,
  hidden_gem TEXT,
  one_action_today TEXT,
  research_sources JSONB,
  model_used TEXT,
  generation_status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(fish_slug, digest_date)
);

CREATE TABLE app_settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- SEED INITIAL DATA

-- Seed app settings with PIN parameters
INSERT INTO app_settings (key, value, updated_at)
VALUES 
  ('pin_enabled', 'false', now()),
  ('pin', '1234', now())
ON CONFLICT (key) DO NOTHING;

-- Seed trip planner fish agent
INSERT INTO fish (name, slug, emoji, description, color_accent) 
VALUES ('Trip Planner', 'trip-planner', '🐟', 'Your daily escape artist', '#00e5ff')
ON CONFLICT (slug) DO NOTHING;
