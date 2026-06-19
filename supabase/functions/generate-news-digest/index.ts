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
    temperature: 0.85
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
        .eq('fish_slug', 'news-briefing');

      if (usersError) {
        throw new Error(`Failed to load users for cron: ${usersError.message}`);
      }

      // Filter unique user IDs
      const uniqueUserIds = [...new Set((users || []).map(u => u.user_id).filter(id => id !== null))];
      console.log(`Cron trigger (News): Dispatching curation for ${uniqueUserIds.length} users.`);

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
      .eq('fish_slug', 'news-briefing')
      .eq('digest_date', todayStr)
      .maybeSingle();

    if (existingDigest && existingDigest.generation_status === 'success' && !force) {
      return new Response(
        JSON.stringify({ status: 'skipped', message: "Today's news digest already exists.", data: existingDigest }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Load user preferences from fish_context for this user
    const { data: contextRows, error: contextError } = await supabase
      .from('fish_context')
      .select('*')
      .eq('fish_slug', 'news-briefing')
      .eq('user_id', targetUserId);

    if (contextError) {
      throw new Error(`Failed to load user preferences: ${contextError.message}`);
    }

    const contextMap: Record<string, string> = {
      news_interests: 'Geopolitics & World Affairs, Tech & AI',
      geo_focus: 'Global / International',
      news_tone: 'Objective & concise briefing',
      excluded_topics: ''
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
        todays_theme: "Tech Giants Unveil Quantum Networks & Geopolitics Shift",
        vibe_emoji: "🌐",
        headline: "Quantum leaps in communication occur amidst changing economic ties.",
        stories: [
          {
            title: "Global Alliance Deploys First Subsea Quantum Link",
            category: "Tech & AI",
            summary: "A joint venture between North American and European consortiums successfully activated a quantum-encrypted communications line connecting Ireland and Newfoundland.",
            implications: "This represents a zero-latency secure framework preventing decryption leaks from traditional signal drops.",
            reliability_score: "High"
          },
          {
            title: "Central Banks Pivot Toward Digital Settlement Currencies",
            category: "Business & Finance",
            summary: "Twelve leading central banks announced a consolidated pilot project to handle wholesale clearing rates directly using sovereign tokens, replacing legacy SWIFT wire steps.",
            implications: "This will speed up cross-border trade settlements by 99% but creates sovereignty regulatory puzzles.",
            reliability_score: "Medium"
          },
          {
            title: "New Algae Variant Neutralizes Microplastics in Saltwater Trials",
            category: "Environment & Climate",
            summary: "Marine biologists reported a bioengineered algae strain capable of eating through microplastic compounds in closed laboratory tanks under 72 hours.",
            implications: "Scaling it to open ocean currents could begin cleanups but runs ecological alteration risks.",
            reliability_score: "High"
          }
        ],
        disclaimer: "Mock disclaimer: simulated world news briefing."
      };
      uniqueSources = ["https://example.com/mock-source-1"];
    } else {
      const todayDate = todayStr;

      // Tavily Research Phase - 2 searches
      const sources: string[] = [];
      
      // Search 1: Breaking Global Headlines focused by region
      let search1Content = '';
      try {
        const q1 = `latest world news headlines events politics geopolitics today ${todayDate} focus ${contextMap.geo_focus}`;
        console.log(`Running Tavily Search 1: ${q1}`);
        const s1 = await tavilySearch(q1, activeTavilyKey);
        if (s1.results && s1.results.length > 0) {
          search1Content = s1.results.map((r: any) => r.content).join('\n\n');
          s1.results.forEach((r: any) => { if (r.url) sources.push(r.url); });
        }
      } catch (e) {
        console.error("Tavily News Search 1 failed:", e);
        search1Content = "Headlines search failed, falling back to Gemini default tracking.";
      }

      // Search 2: Specific Interests
      let search2Content = '';
      try {
        const q2 = `top news developments in ${contextMap.news_interests} today ${todayDate}`;
        console.log(`Running Tavily Search 2: ${q2}`);
        const s2 = await tavilySearch(q2, activeTavilyKey);
        if (s2.results && s2.results.length > 0) {
          search2Content = s2.results.map((r: any) => r.content).join('\n\n');
          s2.results.forEach((r: any) => { if (r.url) sources.push(r.url); });
        }
      } catch (e) {
        console.error("Tavily News Search 2 failed:", e);
        search2Content = "Interests news search failed.";
      }

      // 4. Build Gemini Prompt
      const prompt = `You are a professional daily world news anchorman fish agent. Generate one personalized global news briefing based on real, current search updates.
      
USER FOCUS PROFILE:
- Interests: ${contextMap.news_interests}
- Geographical Focus: ${contextMap.geo_focus}
- Tone preference: ${contextMap.news_tone}
- Exclude topics containing: ${contextMap.excluded_topics}
- Today's date: ${todayDate}

TODAY'S GATHERED SEARCH DATA:
[Global Headlines Search]
${search1Content}

[Specific Interests Search]
${search2Content}

Based on this profile and today's news research, output a beautiful daily briefing summary containing exactly 3 key news items. Filter out topics matching the excluded list.
Adopt the tone of "${contextMap.news_tone}" in your wording.

Respond ONLY in valid JSON. No markdown wrapper, no explanations. Exactly this structure:
{
  "todays_theme": "string — a short title connecting the stories together",
  "vibe_emoji": "string — one emoji representing today's global mood (e.g. 🚨 🕊️ ⚡ 🩹 🌐)",
  "headline": "string — one sentence capturing the main takeaway of today's news briefing",
  "stories": [
    {
      "title": "string — brief catchy headline of the news event",
      "category": "string — e.g. Geopolitics / Tech & AI / Science / Finance / Climate",
      "summary": "string — 2-3 sentences explaining exactly what happened objectively",
      "implications": "string — 1-2 sentences explaining why this matters or the future consequences",
      "reliability_score": "string — 'High' or 'Medium' or 'Low' based on source consensus"
    }
  ],
  "disclaimer": "string — brief warning that AI summaries should be cross-checked with primary sources"
}`;

      // 5. Call Gemini 1.5 Flash
      console.log("Invoking Gemini 1.5 Flash for World News...");
      const rawResult = await callGeminiFlash(prompt, activeGeminiKey, true);
      const cleanedJson = cleanText(rawResult);
      parsedData = JSON.parse(cleanedJson);
      if (!parsedData.stories || parsedData.stories.length === 0) {
        throw new Error("Gemini returned invalid structure: stories array missing or empty.");
      }
      uniqueSources = [...new Set(sources)].slice(0, 5);
    }

    // 6. Map and Save to Supabase (associating with user_id)
    const rawBodyMarkdown = JSON.stringify(parsedData);
    const digestPayload = {
      user_id: targetUserId,
      fish_slug: 'news-briefing',
      digest_date: todayStr,
      title: parsedData.todays_theme,
      destination: parsedData.vibe_emoji,
      headline: parsedData.headline,
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
      throw new Error(`Failed to save news digest to Supabase: ${saveError.message}`);
    }

    return new Response(
      JSON.stringify({ status: 'success', data: savedData }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err: any) {
    console.error("Critical error in news digest execution:", err);

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
              fish_slug: 'news-briefing',
              digest_date: todayStr,
              title: 'Briefing Failed',
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
