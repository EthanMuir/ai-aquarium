import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Initialize admin client to manage user creation and teardown
const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

describe('AIquarium Regression Testing Suite', () => {
  let testUser = null;
  let userJwt = null;

  beforeAll(async () => {
    // 1. Create temporary test user
    const testEmail = `test-user-${Date.now()}@example.com`;
    const { data: { user }, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: testEmail,
      password: 'testPassword123!',
      email_confirm: true
    });

    if (createError) throw createError;
    testUser = user;

    // 2. Sign in to get JWT token
    const { data: { session }, error: loginError } = await supabaseAdmin.auth.signInWithPassword({
      email: testEmail,
      password: 'testPassword123!'
    });

    if (loginError) throw loginError;
    userJwt = session.access_token;

    // 3. Seed preferences context for Trip Planner and Stock Lookout
    const contextPayload = [
      { user_id: testUser.id, fish_slug: 'trip-planner', context_key: 'home_city', context_value: 'Ottawa, Canada' },
      { user_id: testUser.id, fish_slug: 'trip-planner', context_key: 'budget_range', context_value: 'Medium ($1,500–$3,000)' },
      { user_id: testUser.id, fish_slug: 'trip-planner', context_key: 'trip_duration', context_value: 'Week (7–10 days)' },
      { user_id: testUser.id, fish_slug: 'trip-planner', context_key: 'travel_style', context_value: 'Adventure' },
      { user_id: testUser.id, fish_slug: 'stock-lookout', context_key: 'experience_level', context_value: 'Some experience' },
      { user_id: testUser.id, fish_slug: 'stock-lookout', context_key: 'investing_goal', context_value: 'Steady long-term growth' }
    ];

    const { error: seedError } = await supabaseAdmin
      .from('fish_context')
      .insert(contextPayload);

    if (seedError) throw seedError;
  });

  afterAll(async () => {
    // Teardown: deleting the user cascades and deletes contexts and digests automatically
    if (testUser) {
      await supabaseAdmin.auth.admin.deleteUser(testUser.id);
    }
  });

  it('successfully generates a mocked Trip Planner digest via user JWT', async () => {
    const url = 'http://localhost:54321/functions/v1/generate-trip-digest';
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userJwt}`
      },
      body: JSON.stringify({ mock: true, force: true })
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.status).toBe('success');
    expect(data.data.title).toBe('Escape to Mock Island');
    expect(data.data.destination).toBe('Mock City');
    expect(data.data.country).toBe('Mockland');
    expect(data.data.generation_status).toBe('success');
  });

  it('successfully generates a mocked Stock Lookout digest via user JWT', async () => {
    const url = 'http://localhost:54321/functions/v1/generate-stock-digest';
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userJwt}`
      },
      body: JSON.stringify({ mock: true, force: true })
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.status).toBe('success');
    expect(data.data.destination).toBe('🟢');
    expect(data.data.generation_status).toBe('success');
  });

  it('rejects unauthenticated requests to the Edge Functions', async () => {
    const url = 'http://localhost:54321/functions/v1/generate-trip-digest';
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ mock: true, force: true })
    });

    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.error).toContain('Unauthorized');
  });
});
