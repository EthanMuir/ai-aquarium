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

async function runTests() {
  let testUser = null;
  let userJwt = null;

  console.log('--- AIquarium Regression Testing Suite ---');
  console.log('Connecting to remote Supabase:', supabaseUrl);

  try {
    // 1. Create temporary test user
    const testEmail = `test-user-${Date.now()}@example.com`;
    console.log(`[1/7] Creating temporary test user: ${testEmail}...`);
    const { data: { user }, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: testEmail,
      password: 'testPassword123!',
      email_confirm: true
    });

    if (createError) throw createError;
    testUser = user;
    console.log('      Test user created successfully. ID:', user.id);

    // 2. Sign in to get JWT token
    console.log('[2/7] Logging in as test user...');
    const { data: { session }, error: loginError } = await supabaseAdmin.auth.signInWithPassword({
      email: testEmail,
      password: 'testPassword123!'
    });

    if (loginError) throw loginError;
    userJwt = session.access_token;
    console.log('      Login successful, retrieved user JWT.');

    // 3. Seed preferences context
    console.log('[3/7] Seeding test preferences...');
    const contextPayload = [
      { user_id: testUser.id, fish_slug: 'trip-planner', context_key: 'home_city', context_value: 'Ottawa, Canada' },
      { user_id: testUser.id, fish_slug: 'trip-planner', context_key: 'budget_range', context_value: 'Medium ($1,500–$3,000)' },
      { user_id: testUser.id, fish_slug: 'trip-planner', context_key: 'trip_duration', context_value: 'Week (7–10 days)' },
      { user_id: testUser.id, fish_slug: 'trip-planner', context_key: 'travel_style', context_value: 'Adventure' },
      { user_id: testUser.id, fish_slug: 'stock-lookout', context_key: 'experience_level', context_value: 'Some experience' },
      { user_id: testUser.id, fish_slug: 'stock-lookout', context_key: 'investing_goal', context_value: 'Steady long-term growth' },
      { user_id: testUser.id, fish_slug: 'news-briefing', context_key: 'news_interests', context_value: 'Geopolitics & World Affairs' },
      { user_id: testUser.id, fish_slug: 'news-briefing', context_key: 'geo_focus', context_value: 'Global / International' }
    ];

    const { error: seedError } = await supabaseAdmin
      .from('fish_context')
      .insert(contextPayload);

    if (seedError) throw seedError;
    console.log('      Test preferences seeded successfully.');

    // 4. Test generate-trip-digest
    console.log('[4/7] Invoking remote generate-trip-digest edge function (mock: true)...');
    const tripUrl = `${supabaseUrl}/functions/v1/generate-trip-digest`;
    const tripRes = await fetch(tripUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userJwt}`
      },
      body: JSON.stringify({ mock: true, force: true })
    });

    if (!tripRes.ok) {
      const errText = await tripRes.text();
      throw new Error(`Edge Function returned HTTP ${tripRes.status}: ${errText}`);
    }

    const tripData = await tripRes.json();
    console.log('      Response:', JSON.stringify(tripData));
    if (tripData.status !== 'success' || tripData.data.title !== 'Escape to Mock Island') {
      throw new Error('Trip planner response payload assertion failed.');
    }
    console.log('      Trip planner assertion passed.');

    // 5. Test generate-stock-digest
    console.log('[5/7] Invoking remote generate-stock-digest edge function (mock: true)...');
    const stockUrl = `${supabaseUrl}/functions/v1/generate-stock-digest`;
    const stockRes = await fetch(stockUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userJwt}`
      },
      body: JSON.stringify({ mock: true, force: true })
    });

    if (!stockRes.ok) {
      const errText = await stockRes.text();
      throw new Error(`Edge Function returned HTTP ${stockRes.status}: ${errText}`);
    }

    const stockData = await stockRes.json();
    console.log('      Response:', JSON.stringify(stockData));
    if (stockData.status !== 'success' || stockData.data.destination !== '🟢') {
      throw new Error('Stock lookout response payload assertion failed.');
    }
    console.log('      Stock lookout assertion passed.');

    // 6. Test generate-news-digest
    console.log('[6/7] Invoking remote generate-news-digest edge function (mock: true)...');
    const newsUrl = `${supabaseUrl}/functions/v1/generate-news-digest`;
    const newsRes = await fetch(newsUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userJwt}`
      },
      body: JSON.stringify({ mock: true, force: true })
    });

    if (!newsRes.ok) {
      const errText = await newsRes.text();
      throw new Error(`Edge Function returned HTTP ${newsRes.status}: ${errText}`);
    }

    const newsData = await newsRes.json();
    console.log('      Response:', JSON.stringify(newsData));
    if (newsData.status !== 'success' || newsData.data.destination !== '🌐') {
      throw new Error('World news response payload assertion failed.');
    }
    console.log('      World news assertion passed.');

    console.log('All tests passed successfully!');

  } catch (err) {
    console.error('Test execution failed:', err);
    process.exitCode = 1;
  } finally {
    // 7. Teardown
    if (testUser) {
      console.log('[7/7] Cleaning up test user and cascading database rows...');
      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(testUser.id);
      if (deleteError) {
        console.error('      Failed to delete test user during cleanup:', deleteError);
      } else {
        console.log('      Cleanup completed. Test database is clean.');
      }
    }
    console.log('------------------------------------------');
  }
}

runTests();
