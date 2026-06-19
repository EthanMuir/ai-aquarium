-- Update fish_context table
ALTER TABLE fish_context ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Drop old unique constraint and create user-specific one
ALTER TABLE fish_context DROP CONSTRAINT IF EXISTS fish_context_fish_slug_context_key_key;
ALTER TABLE fish_context DROP CONSTRAINT IF EXISTS fish_context_user_slug_key;
ALTER TABLE fish_context ADD CONSTRAINT fish_context_user_slug_key UNIQUE (user_id, fish_slug, context_key);

-- Update daily_digests table
ALTER TABLE daily_digests ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Drop old unique constraint and create user-specific one
ALTER TABLE daily_digests DROP CONSTRAINT IF EXISTS daily_digests_fish_slug_digest_date_key;
ALTER TABLE daily_digests DROP CONSTRAINT IF EXISTS daily_digests_user_slug_date_key;
ALTER TABLE daily_digests ADD CONSTRAINT daily_digests_user_slug_date_key UNIQUE (user_id, fish_slug, digest_date);

-- Create user_api_keys table
CREATE TABLE IF NOT EXISTS user_api_keys (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  gemini_api_key TEXT,
  tavily_api_key TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS and configure policies
ALTER TABLE fish ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow read for everyone" ON fish;
CREATE POLICY "Allow read for everyone" ON fish FOR SELECT TO public USING (true);

ALTER TABLE fish_context ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own context" ON fish_context;
CREATE POLICY "Users can manage their own context" ON fish_context
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

ALTER TABLE daily_digests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own digests" ON daily_digests;
CREATE POLICY "Users can manage their own digests" ON daily_digests
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

ALTER TABLE user_api_keys ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own api keys" ON user_api_keys;
CREATE POLICY "Users can manage their own api keys" ON user_api_keys
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Seed stock lookout fish agent
INSERT INTO fish (name, slug, emoji, description, color_accent)
VALUES ('Stock Lookout', 'stock-lookout', '📈', 'Daily market research agent', '#1e88e5')
ON CONFLICT (slug) DO NOTHING;

-- Seed world news fish agent
INSERT INTO fish (name, slug, emoji, description, color_accent)
VALUES ('World News', 'news-briefing', '📰', 'Daily global news anchorman', '#00e673')
ON CONFLICT (slug) DO NOTHING;

