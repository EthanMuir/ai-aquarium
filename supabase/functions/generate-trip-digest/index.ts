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

async function callGeminiFlash(prompt: string, apiKey: string) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.8,
          maxOutputTokens: 1200
        }
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
  if (cleaned.startsWith('```')) {
    // Extract anything between ```json and ``` or ``` and ```
    const match = cleaned.match(/```(?:json)?([\s\S]*?)```/);
    if (match) {
      cleaned = match[1].trim();
    }
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
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY') || '';
    const TAVILY_API_KEY = Deno.env.get('TAVILY_API_KEY') || '';

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !GEMINI_API_KEY || !TAVILY_API_KEY) {
      return new Response(
        JSON.stringify({ 
          error: 'Required environment variables (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, GEMINI_API_KEY, TAVILY_API_KEY) are missing.' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // 1. Check if today's digest already exists
    const todayStr = new Date().toISOString().split('T')[0];
    
    // Check if we are forcing generation (manual trigger)
    let force = false;
    try {
      const body = await req.json();
      force = body?.force === true;
    } catch (_) {
      // Body empty or not JSON
    }

    const { data: existingDigest } = await supabase
      .from('daily_digests')
      .select('*')
      .eq('fish_slug', 'trip-planner')
      .eq('digest_date', todayStr)
      .maybeSingle();

    if (existingDigest && !force) {
      return new Response(
        JSON.stringify({ status: 'skipped', message: "Today's digest already exists.", data: existingDigest }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Load user preferences from fish_context
    const { data: contextRows, error: contextError } = await supabase
      .from('fish_context')
      .select('*')
      .eq('fish_slug', 'trip-planner');

    if (contextError) {
      throw new Error(`Failed to load user preferences: ${contextError.message}`);
    }

    const contextMap: Record<string, string> = {
      home_city: 'Ottawa, Canada',
      budget_range: 'Medium ($1,500–$3,000)',
      trip_duration: 'Week (7–10 days)',
      travel_style: 'Adventure, Nature & Wildlife',
      travel_party: 'Solo',
      passport_notes: 'Canadian Passport',
      blackout_months: 'None',
      visited_places: 'None',
      dream_keywords: 'nature, active, scenic'
    };

    if (contextRows) {
      contextRows.forEach(row => {
        contextMap[row.context_key] = row.context_value || '';
      });
    }

    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const currentMonth = months[new Date().getMonth()];

    // 3. Tavily Research Phase - 3 searches
    const sources: string[] = [];
    
    // Search 1: Destination Ideas
    let search1Content = '';
    try {
      const q1 = `best travel destinations ${currentMonth} 2026 budget ${contextMap.budget_range} travel style ${contextMap.travel_style}`;
      console.log(`Running Tavily Search 1: ${q1}`);
      const s1 = await tavilySearch(q1, TAVILY_API_KEY);
      if (s1.results && s1.results.length > 0) {
        search1Content = s1.results.map((r: any) => r.content).join('\n\n');
        s1.results.forEach((r: any) => { if (r.url) sources.push(r.url); });
      }
    } catch (e) {
      console.error("Tavily Search 1 failed:", e);
      search1Content = "Search failed, defaulting to Gemini standard recommendations.";
    }

    // Secondary Decision Phase: Let Gemini select a specific destination from search 1
    let destinationName = 'Azores, Portugal';
    try {
      const decisionPrompt = `You are a world-class travel planner. Given the following search results about ideal destinations for the month of ${currentMonth} under budget ${contextMap.budget_range} and style ${contextMap.travel_style}:
      
      ${search1Content}
      
      Select the single best destination (format: "City, Country" or "Region, Country"). Respond only with that selected destination, nothing else. No explanation, no quotes.`;
      
      const res = await callGeminiFlash(decisionPrompt, GEMINI_API_KEY);
      destinationName = res.trim().replace(/["']/g, '');
      console.log(`Gemini Selected Destination: ${destinationName}`);
    } catch (e) {
      console.error("Gemini destination selection failed:", e);
    }

    // Search 2: Flight Estimates
    let search2Content = '';
    try {
      const q2 = `flights from ${contextMap.home_city} to ${destinationName} price estimate`;
      console.log(`Running Tavily Search 2: ${q2}`);
      const s2 = await tavilySearch(q2, TAVILY_API_KEY);
      if (s2.results && s2.results.length > 0) {
        search2Content = s2.results.map((r: any) => r.content).join('\n\n');
        s2.results.forEach((r: any) => { if (r.url) sources.push(r.url); });
      }
    } catch (e) {
      console.error("Tavily Search 2 failed:", e);
      search2Content = "Flight searches failed, estimate flights using general airline routing.";
    }

    // Search 3: Reddit Tips & Hidden Gems
    let search3Content = '';
    try {
      const q3 = `${destinationName} local tips hidden gems reddit 2026`;
      console.log(`Running Tavily Search 3: ${q3}`);
      const s3 = await tavilySearch(q3, TAVILY_API_KEY);
      if (s3.results && s3.results.length > 0) {
        search3Content = s3.results.map((r: any) => r.content).join('\n\n');
        s3.results.forEach((r: any) => { if (r.url) sources.push(r.url); });
      }
    } catch (e) {
      console.error("Tavily Search 3 failed:", e);
      search3Content = "No specific reddit tips returned, list standard local sights.";
    }

    // 4. Build Gemini Content Prompts
    const prompt = `You are a world-class travel curator. Generate one daily personalized trip suggestion.

USER PROFILE:
- Flying from: ${contextMap.home_city}
- Budget (per person): ${contextMap.budget_range} CAD
- Trip length preference: ${contextMap.trip_duration}
- Travel style: ${contextMap.travel_style}
- Travels with: ${contextMap.travel_party}
- Passport/visa notes: ${contextMap.passport_notes}
- Blackout months: ${contextMap.blackout_months}
- Already visited: ${contextMap.visited_places}
- Dream trip keywords: ${contextMap.dream_keywords}
- Current month: ${currentMonth}

RESEARCH GATHERED TODAY:
[Tavily Search 1 Results — Destination ideas]
${search1Content}

[Tavily Search 2 Results — Flight info]
${search2Content}

[Tavily Search 3 Results — Local tips]
${search3Content}

Based on this user profile and today's research, generate a single destination recommendation (ideally matching ${destinationName}).

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
}`;

    // 5. Call Gemini 1.5 Flash
    console.log("Invoking Gemini 1.5 Flash Content Generation...");
    const rawResult = await callGeminiFlash(prompt, GEMINI_API_KEY);
    const cleanedJson = cleanText(rawResult);
    
    // Validate JSON
    const parsedData = JSON.parse(cleanedJson);

    // Filter unique sources to not overload the column (limit to top 5)
    const uniqueSources = [...new Set(sources)].slice(0, 5);

    // 6. Map and Save to Supabase
    const digestPayload = {
      fish_slug: 'trip-planner',
      digest_date: todayStr,
      title: parsedData.title,
      destination: parsedData.destination,
      country: parsedData.country,
      region: parsedData.region,
      headline: parsedData.headline,
      body_markdown: parsedData.why_now,
      estimated_budget_low: Number(parsedData.estimated_budget_low) || 0,
      estimated_budget_high: Number(parsedData.estimated_budget_high) || 0,
      best_time_to_go: `${parsedData.best_duration} | ${parsedData.best_for}`,
      flight_info: parsedData.getting_there || parsedData.flight_info,
      hidden_gem: parsedData.hidden_gem,
      one_action_today: parsedData.one_action_today,
      research_sources: uniqueSources,
      model_used: 'gemini-1.5-flash',
      generation_status: 'success'
    };

    const { data: savedData, error: saveError } = await supabase
      .from('daily_digests')
      .upsert(digestPayload, { onConflict: 'fish_slug,digest_date' })
      .select()
      .single();

    if (saveError) {
      throw new Error(`Failed to save digest to Supabase: ${saveError.message}`);
    }

    return new Response(
      JSON.stringify({ status: 'success', data: savedData }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err: any) {
    console.error("Critical error in digest execution:", err);

    // Save failed record in Supabase daily_digests so the UI updates
    try {
      const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
      const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
      
      if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        const todayStr = new Date().toISOString().split('T')[0];
        
        await supabase
          .from('daily_digests')
          .upsert({
            fish_slug: 'trip-planner',
            digest_date: todayStr,
            title: 'Curation Failed',
            generation_status: 'failed',
            headline: 'An error occurred during agent curation execution.'
          }, { onConflict: 'fish_slug,digest_date' });
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
