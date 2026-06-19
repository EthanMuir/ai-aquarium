const { createClient } = require('@supabase/supabase-js');
const ws = require('ws');
const fs = require('fs');
const path = require('path');

// Helper to load env variables from .env
function loadEnv() {
  const envPath = path.resolve(__dirname, '../.env');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    content.split('\n').forEach(line => {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let value = match[2] || '';
        if (value.startsWith('"') && value.endsWith('"')) {
          value = value.slice(1, -1);
        } else if (value.startsWith("'") && value.endsWith("'")) {
          value = value.slice(1, -1);
        }
        process.env[key] = value.trim();
      }
    });
  }
}

loadEnv();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Error: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  },
  realtime: {
    transport: ws
  }
});


async function seed() {
  console.log('Seeding fish table on remote Supabase...');
  
  const fishToSeed = [
    { name: 'Trip Planner', slug: 'trip-planner', emoji: '🐠', description: 'Daily travel curation agent', color_accent: '#ff6b47' },
    { name: 'Stock Lookout', slug: 'stock-lookout', emoji: '📈', description: 'Daily market research agent', color_accent: '#1e88e5' },
    { name: 'World News', slug: 'news-briefing', emoji: '📰', description: 'Daily global news anchorman', color_accent: '#00e673' }
  ];

  for (const fish of fishToSeed) {
    const { data, error } = await supabaseAdmin
      .from('fish')
      .upsert(fish, { onConflict: 'slug' })
      .select();

    if (error) {
      console.error(`Failed to seed ${fish.name}:`, error.message);
    } else {
      console.log(`Successfully seeded/upserted ${fish.name}`);
    }
  }
}

seed();
