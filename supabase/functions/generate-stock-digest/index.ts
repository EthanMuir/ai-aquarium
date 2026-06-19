import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function tavilySearch(query: string, apiKey: string) {
  const response = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      query,
      max_results: 5,
      search_depth: 'basic',
      include_answer: true
    })
  });
  if (!response.ok) {
    throw new Error(`Tavily search failed: ${response.statusText}`);
  }
  return response.json();
}

async function callGeminiFlash(prompt: string, apiKey: string, responseJson = false) {
  const generationConfig: any = {
    temperature: 0.8
  };
  if (responseJson) {
    generationConfig.responseMimeType = "application/json";
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig
      })
    }
  );
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API failed: ${errorText}`);
  }
  const result = await response.json();
  try {
    return result.candidates[0].content.parts[0].text;
  } catch (e) {
    throw new Error(`Failed to extract text from Gemini response: ${JSON.stringify(result)}`);
  }
}

function cleanText(text: string) {
  let cleaned = text.trim();
  const match = cleaned.match(/```(?:json)?([\s\S]*?)```/);
  if (match) {
    return match[1].trim();
  }
  return cleaned;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return new Response(
        JSON.stringify({ 
          error: 'Required environment variables (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY) are missing.' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Parse request body parameters
    let force = false;
    let action = 'generate';
    let mock = false;
    let requestedUserId: string | null = null;
    try {
      const body = await req.json();
      force = body?.force === true;
      action = body?.action || 'generate';
      mock = body?.mock === true;
      requestedUserId = body?.user_id || null;
    } catch (_) {
      // Body empty or not JSON
    }

    // Authenticate user session from JWT if present
    let targetUserId: string | null = null;
    const authHeader = req.headers.get('Authorization') || '';
    
    if (authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      if (token === SUPABASE_SERVICE_ROLE_KEY) {
        // Authenticated as service_role (CLI, admin, or internal cron)
        targetUserId = requestedUserId;
      } else {
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token);
        if (!authError && authUser) {
          targetUserId = authUser.id;
        }
      }
    }

    // Cron fan-out triggers: executed by daily scheduler with service_role auth
    const isServiceRole = authHeader.replace('Bearer ', '') === SUPABASE_SERVICE_ROLE_KEY;
    if (isServiceRole && (action === 'cron' || (!targetUserId && action === 'generate'))) {
      // Fetch all users who have configured API keys or onboarding context
      const { data: users, error: usersError } = await supabase
        .from('fish_context')
        .select('user_id')
        .eq('fish_slug', 'stock-lookout');

      if (usersError) {
        throw new Error(`Failed to load users for cron: ${usersError.message}`);
      }

      // Filter unique user IDs
      const uniqueUserIds = [...new Set((users || []).map(u => u.user_id).filter(id => id !== null))];
      console.log(`Cron trigger (Stocks): Dispatching curation for ${uniqueUserIds.length} users.`);

      const triggerPromises = uniqueUserIds.map(async (userId) => {
        try {
          const res = await fetch(req.url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
            },
            body: JSON.stringify({ user_id: userId, force, mock })
          });
          return { user_id: userId, status: res.status };
        } catch (err: any) {
          console.error(`Cron dispatch failed for user ${userId}:`, err);
          return { user_id: userId, error: err.message };
        }
      });

      const results = await Promise.all(triggerPromises);
      return new Response(
        JSON.stringify({ status: 'success', message: 'Cron dispatched', results }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Enforce authentication for single user execution
    if (!targetUserId) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: User authentication is required.' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Handle Tavily quota API usage inquiry
    if (action === 'usage') {
      const { data: userKeys } = await supabase
        .from('user_api_keys')
        .select('tavily_api_key')
        .eq('user_id', targetUserId)
        .maybeSingle();

      const activeTavilyKey = userKeys?.tavily_api_key;
      if (!activeTavilyKey) {
        throw new Error('Tavily API key is not configured.');
      }

      const usageResponse = await fetch('https://api.tavily.com/usage', {
        headers: {
          'Authorization': `Bearer ${activeTavilyKey}`
        }
      });
      if (!usageResponse.ok) {
        throw new Error(`Tavily API responded with status ${usageResponse.status}`);
      }
      const usageData = await usageResponse.json();
      return new Response(
        JSON.stringify({ status: 'success', usage: usageData }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 1. Check if today's digest already exists for this specific user
    const todayStr = new Date().toISOString().split('T')[0];

    const { data: existingDigest } = await supabase
      .from('daily_digests')
      .select('*')
      .eq('user_id', targetUserId)
      .eq('fish_slug', 'stock-lookout')
      .eq('digest_date', todayStr)
      .maybeSingle();

    if (existingDigest && existingDigest.generation_status === 'success' && !force) {
      return new Response(
        JSON.stringify({ status: 'skipped', message: "Today's stock digest already exists.", data: existingDigest }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Load user preferences from fish_context for this user
    const { data: contextRows, error: contextError } = await supabase
      .from('fish_context')
      .select('*')
      .eq('fish_slug', 'stock-lookout')
      .eq('user_id', targetUserId);

    if (contextError) {
      throw new Error(`Failed to load user preferences: ${contextError.message}`);
    }

    const contextMap: Record<string, string> = {
      experience_level: 'Some Experience',
      investing_goal: 'Steady long-term growth',
      risk_reaction: 'Hold and wait it out',
      stock_interests: 'Tech & AI, Growth Stocks',
      time_horizon: '3–10 years',
      position_size: '$500–$2,000',
      markets: 'NYSE, NASDAQ (US)',
      excluded_sectors: 'None',
      tip_preference: 'Stocks trending right now',
      current_holdings: 'None'
    };

    if (contextRows) {
      contextRows.forEach(row => {
        contextMap[row.context_key] = row.context_value || '';
      });
    }

    // Fetch user-specific API keys
    const { data: userKeys } = await supabase
      .from('user_api_keys')
      .select('*')
      .eq('user_id', targetUserId)
      .maybeSingle();

    const activeGeminiKey = userKeys?.gemini_api_key;
    const activeTavilyKey = userKeys?.tavily_api_key;

    if (!mock && (!activeGeminiKey || !activeTavilyKey)) {
      throw new Error('API keys are missing. Please configure your API keys first.');
    }

    let parsedData: any = null;
    let uniqueSources: string[] = [];

    if (mock) {
      // Return fast mock data for testing
      parsedData = {
        market_mood: "A highly positive mock market sentiment.",
        market_mood_emoji: "🟢",
        todays_theme: "Mock tech stocks are simulating significant growth.",
        picks: [
          {
            ticker: "MOCK",
            company_name: "Mocking Systems Corp",
            market: "NASDAQ",
            pick_type: "Momentum Play",
            why_today: "It is simulating high investor demand.",
            the_case_for: "Simulated market adoption is increasing.",
            the_risk: "If Vitest stops running, this company goes bankrupt.",
            time_horizon_fit: "Best for 1-2 day test holders",
            confidence: "High",
            one_thing_to_check: "Verify that index_test is green."
          }
        ],
        disclaimer: "Mock disclaimer: this is simulated data."
      };
      uniqueSources = ["https://example.com/mock-source-1"];
    } else {
      const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
      const currentMonth = months[new Date().getMonth()];
      const currentDate = todayStr;

      // Tavily Research Phase - 4 searches
      const sources: string[] = [];
      
      // Search 1: Today's Market Movers
      let search1Content = '';
      try {
        const q1 = `stock market today ${currentDate} top movers gainers`;
        console.log(`Running Tavily Search 1: ${q1}`);
        const s1 = await tavilySearch(q1, activeTavilyKey);
        if (s1.results && s1.results.length > 0) {
          search1Content = s1.results.map((r: any) => r.content).join('\n\n');
          s1.results.forEach((r: any) => { if (r.url) sources.push(r.url); });
        }
      } catch (e) {
        console.error("Tavily Search 1 failed:", e);
        search1Content = "Movers research failed, fallback to Gemini internal tracking.";
      }

      // Search 2: Analyst Picks Matching Interests
      let search2Content = '';
      try {
        const q2 = `${contextMap.stock_interests} best stocks to watch ${currentMonth} 2026 analyst picks`;
        console.log(`Running Tavily Search 2: ${q2}`);
        const s2 = await tavilySearch(q2, activeTavilyKey);
        if (s2.results && s2.results.length > 0) {
          search2Content = s2.results.map((r: any) => r.content).join('\n\n');
          s2.results.forEach((r: any) => { if (r.url) sources.push(r.url); });
        }
      } catch (e) {
        console.error("Tavily Search 2 failed:", e);
        search2Content = "Analyst picks research failed.";
      }

      // Search 3: Undervalued plays
      let search3Content = '';
      try {
        const q3 = `undervalued stocks ${contextMap.markets} ${contextMap.time_horizon} investor ${currentMonth} 2026`;
        console.log(`Running Tavily Search 3: ${q3}`);
        const s3 = await tavilySearch(q3, activeTavilyKey);
        if (s3.results && s3.results.length > 0) {
          search3Content = s3.results.map((r: any) => r.content).join('\n\n');
          s3.results.forEach((r: any) => { if (r.url) sources.push(r.url); });
        }
      } catch (e) {
        console.error("Tavily Search 3 failed:", e);
        search3Content = "Undervalued plays research failed.";
      }

      // Search 4: Community Sentiment
      let search4Content = '';
      try {
        const q4 = `${contextMap.tip_preference} stock recommendations reddit wallstreetbets ${currentMonth} 2026`;
        console.log(`Running Tavily Search 4: ${q4}`);
        const s4 = await tavilySearch(q4, activeTavilyKey);
        if (s4.results && s4.results.length > 0) {
          search4Content = s4.results.map((r: any) => r.content).join('\n\n');
          s4.results.forEach((r: any) => { if (r.url) sources.push(r.url); });
        }
      } catch (e) {
        console.error("Tavily Search 4 failed:", e);
        search4Content = "Community sentiment research failed.";
      }

      // 4. Build Gemini Prompt
      const prompt = `You are a sharp, well-researched stock market analyst generating a daily personalized stock lookout digest. You are NOT a licensed financial advisor — always include a brief disclaimer. Your job is to surface interesting, well-reasoned stock ideas based on real research.

USER INVESTOR PROFILE:
- Experience level: ${contextMap.experience_level}
- Investing goal: ${contextMap.investing_goal}
- Risk reaction: ${contextMap.risk_reaction}
- Stock interests: ${contextMap.stock_interests}
- Time horizon: ${contextMap.time_horizon}
- Typical position size: ${contextMap.position_size}
- Markets: ${contextMap.markets}
- Excluded sectors: ${contextMap.excluded_sectors}
- Tip preference: ${contextMap.tip_preference}
- Currently holds: ${contextMap.current_holdings}
- Today's date: ${currentDate}

TODAY'S MARKET RESEARCH:
[Tavily Search 1 — Today's movers]
${search1Content}

[Tavily Search 2 — Analyst picks matching profile]
${search2Content}

[Tavily Search 3 — Undervalued plays]
${search3Content}

[Tavily Search 4 — Community sentiment]
${search4Content}

Based on this profile and today's research, generate a daily stock lookout digest with exactly 3 stock or ETF ideas. Each idea should be tailored to this specific investor's profile. Do NOT recommend anything they already hold.
Mix the pick types based on the user's tip_preference. If the user is a beginner, weight toward ETFs and safe compounders. If they're experienced and want high-risk, include a speculative pick.

Respond ONLY in valid JSON, no markdown, no preamble, no explanation:
{
  "market_mood": "string — one sentence on today's overall market vibe",
  "market_mood_emoji": "string — one emoji representing market mood (e.g. 🟢 🔴 🟡 ⚡)",
  "picks": [
    {
      "ticker": "string — e.g. NVDA or XEQT",
      "company_name": "string — full company or fund name",
      "market": "string — e.g. NASDAQ or TSX",
      "pick_type": "string — Momentum Play / Safe Compounder / Hidden Gem / ETF Pick / Analyst Upgrade / Speculative",
      "why_today": "string — 2-3 sentences on why this is interesting right now",
      "the_case_for": "string — the bull case in 1-2 sentences",
      "the_risk": "string — honest 1 sentence on the main downside risk",
      "time_horizon_fit": "string — e.g. Best for 3-5 year holders",
      "confidence": "string — Low / Medium / High",
      "one_thing_to_check": "string — one specific thing the user should verify before acting"
    }
  ],
  "todays_theme": "string — overarching theme connecting today's picks, e.g. 'AI infrastructure spending is accelerating'",
  "disclaimer": "string — brief reminder this is not financial advice"
}`;

      // 5. Call Gemini 1.5 Flash
      console.log("Invoking Gemini 1.5 Flash Content Generation (Stocks)...");
      const rawResult = await callGeminiFlash(prompt, activeGeminiKey, true);
      const cleanedJson = cleanText(rawResult);
      parsedData = JSON.parse(cleanedJson);
      if (!parsedData.picks || parsedData.picks.length === 0) {
        throw new Error("Gemini returned invalid structure: picks array missing or empty.");
      }
      uniqueSources = [...new Set(sources)].slice(0, 5);
    }

    // 6. Map and Save to Supabase (associating with user_id)
    const rawBodyMarkdown = mock ? JSON.stringify(parsedData) : JSON.stringify(parsedData);
    const digestPayload = {
      user_id: targetUserId,
      fish_slug: 'stock-lookout',
      digest_date: todayStr,
      title: parsedData.todays_theme,
      destination: parsedData.market_mood_emoji,
      headline: parsedData.market_mood,
      body_markdown: rawBodyMarkdown,
      research_sources: uniqueSources,
      model_used: mock ? 'mock-model' : 'gemini-2.5-flash',
      generation_status: 'success'
    };

    const { data: savedData, error: saveError } = await supabase
      .from('daily_digests')
      .upsert(digestPayload, { onConflict: 'user_id,fish_slug,digest_date' })
      .select()
      .single();

    if (saveError) {
      throw new Error(`Failed to save stock digest to Supabase: ${saveError.message}`);
    }

    return new Response(
      JSON.stringify({ status: 'success', data: savedData }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err: any) {
    console.error("Critical error in stock digest execution:", err);

    // Attempt to save failure state if user context is resolved
    try {
      const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
      const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
      
      if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        const todayStr = new Date().toISOString().split('T')[0];
        
        let errUserId: string | null = null;
        const authHeader = req.headers.get('Authorization') || '';
        if (authHeader.startsWith('Bearer ')) {
          const token = authHeader.substring(7);
          if (token === SUPABASE_SERVICE_ROLE_KEY) {
            try {
              const body = await req.json();
              errUserId = body?.user_id || null;
            } catch (_) {}
          } else {
            const { data: { user: authUser } } = await supabase.auth.getUser(token);
            if (authUser) errUserId = authUser.id;
          }
        }

        if (errUserId) {
          await supabase
            .from('daily_digests')
            .upsert({
              user_id: errUserId,
              fish_slug: 'stock-lookout',
              digest_date: todayStr,
              title: 'Curation Failed',
              generation_status: 'failed',
              headline: err.message || 'An error occurred during agent curation execution.'
            }, { onConflict: 'user_id,fish_slug,digest_date' });
        }
      }
    } catch (dbErr) {
      console.error("Could not write failure status to DB:", dbErr);
    }

    return new Response(
      JSON.stringify({ error: err.message || 'Internal Server Error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
