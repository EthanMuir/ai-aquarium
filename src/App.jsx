import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabaseClient';
import AquariumTank from './components/AquariumTank';
import OnboardingQuiz from './components/OnboardingQuiz';
import DigestPanel from './components/DigestPanel';
import SettingsPanel from './components/SettingsPanel';
import AuthGate from './components/AuthGate';
import { Settings, Shield, AlertCircle } from 'lucide-react';

export default function App() {
  const [dbStatus, setDbStatus] = useState('loading'); // 'loading' | 'ready' | 'missing_tables'
  const [session, setSession] = useState(null);
  
  // Double Quiz status states
  const [tripQuizDone, setTripQuizDone] = useState(false);
  const [stockQuizDone, setStockQuizDone] = useState(false);
  const [newsQuizDone, setNewsQuizDone] = useState(false);
  
  // Track which quiz to show
  const [quizSlug, setQuizSlug] = useState('trip-planner');

  // persistent active status for the two fish
  const [tripFishActive, setTripFishActive] = useState(true);
  const [stockFishActive, setStockFishActive] = useState(true);
  const [newsFishActive, setNewsFishActive] = useState(true);

  // Quiz context key-values for both fish
  const [tripQuizContext, setTripQuizContext] = useState({});
  const [stockQuizContext, setStockQuizContext] = useState({});
  const [newsQuizContext, setNewsQuizContext] = useState({});
  const [homeCity, setHomeCity] = useState('');

  // Digests history (contains both Trip Planner and Stock Lookout digests)
  const [digests, setDigests] = useState([]);
  
  // Digest visual states for both fish
  const [tripDigestState, setTripDigestState] = useState('none'); // 'none' | 'generating' | 'ready' | 'failed'
  const [stockDigestState, setStockDigestState] = useState('none'); // 'none' | 'generating' | 'ready' | 'failed'
  const [newsDigestState, setNewsDigestState] = useState('none'); // 'none' | 'generating' | 'ready' | 'failed'

  // Modal / panel toggles
  const [isQuizOpen, setIsQuizOpen] = useState(false);
  const [isDigestOpen, setIsDigestOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeDigestTab, setActiveDigestTab] = useState('trip-planner');

  // AI Curation Energy Tracker State (Shared)
  const [energy, setEnergy] = useState(5);
  const [lastRechargedAt, setLastRechargedAt] = useState(Date.now());
  const [secondsToRecharge, setSecondsToRecharge] = useState(0);

  const FOUR_HOURS_IN_MS = 4 * 60 * 60 * 1000;

  // Load energy from localStorage on mount and compute recovered charges
  useEffect(() => {
    const savedEnergy = localStorage.getItem('aquarium_energy');
    const savedTime = localStorage.getItem('aquarium_energy_time');
    
    if (savedEnergy !== null && savedTime !== null) {
      const parsedEnergy = parseInt(savedEnergy, 10);
      const parsedTime = parseInt(savedTime, 10);
      
      const now = Date.now();
      const msPassed = now - parsedTime;
      const recovered = Math.floor(msPassed / FOUR_HOURS_IN_MS);
      
      if (recovered > 0) {
        const nextEnergy = Math.min(5, parsedEnergy + recovered);
        setEnergy(nextEnergy);
        if (nextEnergy === 5) {
          setLastRechargedAt(now);
          localStorage.setItem('aquarium_energy', '5');
          localStorage.setItem('aquarium_energy_time', now.toString());
        } else {
          const nextTime = parsedTime + (recovered * FOUR_HOURS_IN_MS);
          setLastRechargedAt(nextTime);
          localStorage.setItem('aquarium_energy', nextEnergy.toString());
          localStorage.setItem('aquarium_energy_time', nextTime.toString());
        }
      } else {
        setEnergy(parsedEnergy);
        setLastRechargedAt(parsedTime);
      }
    } else {
      setEnergy(5);
      const now = Date.now();
      setLastRechargedAt(now);
      localStorage.setItem('aquarium_energy', '5');
      localStorage.setItem('aquarium_energy_time', now.toString());
    }
  }, []);

  // Countdown timer and auto-increment loop
  useEffect(() => {
    if (energy >= 5) {
      setSecondsToRecharge(0);
      return;
    }

    const interval = setInterval(() => {
      const now = Date.now();
      const msPassed = now - lastRechargedAt;
      
      if (msPassed >= FOUR_HOURS_IN_MS) {
        setEnergy((prev) => {
          const nextEnergy = Math.min(5, prev + 1);
          const nextTime = lastRechargedAt + FOUR_HOURS_IN_MS;
          setLastRechargedAt(nextTime);
          localStorage.setItem('aquarium_energy', nextEnergy.toString());
          localStorage.setItem('aquarium_energy_time', nextTime.toString());
          return nextEnergy;
        });
      } else {
        const remainingMs = FOUR_HOURS_IN_MS - msPassed;
        setSecondsToRecharge(Math.max(0, Math.ceil(remainingMs / 1000)));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [energy, lastRechargedAt]);

  const consumeEnergyCharge = () => {
    setEnergy((prev) => {
      if (prev <= 0) return 0;
      const nextEnergy = prev - 1;
      const now = Date.now();
      const nextTime = prev === 5 ? now : lastRechargedAt;
      
      setLastRechargedAt(nextTime);
      localStorage.setItem('aquarium_energy', nextEnergy.toString());
      localStorage.setItem('aquarium_energy_time', nextTime.toString());
      return nextEnergy;
    });
  };

  // Initialize and check database tables
  useEffect(() => {
    async function initApp() {
      try {
        // Check if we can query the fish table
        const { error } = await supabase.from('fish').select('slug').limit(1);

        if (error) {
          console.error('Database connection or table missing error:', error);
          setDbStatus('missing_tables');
          return;
        }

        setDbStatus('ready');

        // Check local session
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        setSession(currentSession);

      } catch (err) {
        console.error('Initialization crash:', err);
        setDbStatus('missing_tables');
      }
    }

    initApp();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch data only when session is present
  useEffect(() => {
    if (session) {
      fetchFishContext();
      fetchDigests();
      fetchFishStatus();
    } else {
      setTripQuizContext({});
      setStockQuizContext({});
      setNewsQuizContext({});
      setDigests([]);
      setTripQuizDone(false);
      setStockQuizDone(false);
      setNewsQuizDone(false);
    }
  }, [session]);

  const handleAddAgent = (slug) => {
    setQuizSlug(slug);
    setIsQuizOpen(true);
  };

  const fetchFishStatus = async () => {
    try {
      const { data: fishData, error: fishError } = await supabase
        .from('fish')
        .select('slug, is_active');
      if (!fishError && fishData) {
        const trip = fishData.find(f => f.slug === 'trip-planner');
        if (trip) setTripFishActive(trip.is_active !== false);
        const stock = fishData.find(f => f.slug === 'stock-lookout');
        if (stock) setStockFishActive(stock.is_active !== false);
        const news = fishData.find(f => f.slug === 'news-briefing');
        if (news) setNewsFishActive(news.is_active !== false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchFishContext = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('fish_context')
        .select('fish_slug, context_key, context_value')
        .eq('user_id', user.id);

      if (!error && data) {
        const tripMap = {};
        const stockMap = {};
        const newsMap = {};
        
        data.forEach(row => {
          if (row.fish_slug === 'trip-planner') {
            tripMap[row.context_key] = row.context_value;
          } else if (row.fish_slug === 'stock-lookout') {
            stockMap[row.context_key] = row.context_value;
          } else if (row.fish_slug === 'news-briefing') {
            newsMap[row.context_key] = row.context_value;
          }
        });

        setTripQuizContext(tripMap);
        setStockQuizContext(stockMap);
        setNewsQuizContext(newsMap);
        
        // Dynamically set quiz complete status
        setTripQuizDone(Object.keys(tripMap).filter(k => k !== 'feed_frequency').length > 0);
        setStockQuizDone(Object.keys(stockMap).filter(k => k !== 'feed_frequency').length > 0);
        setNewsQuizDone(Object.keys(newsMap).filter(k => k !== 'feed_frequency').length > 0);
        
        if (tripMap.home_city) {
          setHomeCity(tripMap.home_city);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchDigests = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('daily_digests')
        .select('*')
        .eq('user_id', user.id)
        .in('fish_slug', ['trip-planner', 'stock-lookout', 'news-briefing'])
        .order('digest_date', { ascending: false });

      if (!error && data) {
        setDigests(data);
        
        // Update Trip Planner visual state
        const tripList = data.filter(d => d.fish_slug === 'trip-planner');
        if (tripList.length > 0) {
          const latest = tripList[0];
          if (latest.generation_status === 'failed') {
            setTripDigestState('failed');
          } else if (latest.generation_status === 'success') {
            setTripDigestState('ready');
          } else {
            setTripDigestState('none');
          }
        } else {
          setTripDigestState('none');
        }

        // Update Stock Lookout visual state
        const stockList = data.filter(d => d.fish_slug === 'stock-lookout');
        if (stockList.length > 0) {
          const latest = stockList[0];
          if (latest.generation_status === 'failed') {
            setStockDigestState('failed');
          } else if (latest.generation_status === 'success') {
            setStockDigestState('ready');
          } else {
            setStockDigestState('none');
          }
        } else {
          setStockDigestState('none');
        }

        // Update World News visual state
        const newsList = data.filter(d => d.fish_slug === 'news-briefing');
        if (newsList.length > 0) {
          const latest = newsList[0];
          if (latest.generation_status === 'failed') {
            setNewsDigestState('failed');
          } else if (latest.generation_status === 'success') {
            setNewsDigestState('ready');
          } else {
            setNewsDigestState('none');
          }
        } else {
          setNewsDigestState('none');
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleQuizComplete = async () => {
    await fetchFishContext();
    await fetchDigests();
    setIsQuizOpen(false);
  };

  const handleRetakeQuiz = (slug) => {
    if (slug === 'trip-planner') {
      setTripQuizDone(false);
    } else if (slug === 'stock-lookout') {
      setStockQuizDone(false);
    } else {
      setNewsQuizDone(false);
    }
    setQuizSlug(slug);
    setIsSettingsOpen(false);
    setIsQuizOpen(true);
  };

  const handleDigestGenerated = async (slug, failed = false) => {
    if (slug === 'trip-planner') {
      if (failed) {
        setTripDigestState('failed');
        return;
      }
      setTripDigestState('ready');
    } else if (slug === 'stock-lookout') {
      if (failed) {
        setStockDigestState('failed');
        return;
      }
      setStockDigestState('ready');
    } else {
      if (failed) {
        setNewsDigestState('failed');
        return;
      }
      setNewsDigestState('ready');
    }
    
    consumeEnergyCharge();
    await fetchDigests();
  };

  const handleUpdateFeedFrequency = async (fishSlug, frequency) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('fish_context')
        .upsert({
          user_id: user.id,
          fish_slug: fishSlug,
          context_key: 'feed_frequency',
          context_value: frequency
        }, { onConflict: 'user_id,fish_slug,context_key' });

      if (!error) {
        await fetchFishContext();
      } else {
        console.error("Failed to update feed frequency:", error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleFishActive = async (slug) => {
    const nextVal = slug === 'trip-planner' 
      ? !tripFishActive 
      : slug === 'stock-lookout' 
        ? !stockFishActive 
        : !newsFishActive;
    try {
      const { error } = await supabase
        .from('fish')
        .update({ is_active: nextVal })
        .eq('slug', slug);

      if (!error) {
        if (slug === 'trip-planner') {
          setTripFishActive(nextVal);
        } else if (slug === 'stock-lookout') {
          setStockFishActive(nextVal);
        } else {
          setNewsFishActive(nextVal);
        }
      } else {
        console.error("Failed to update fish visibility:", error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleFishClick = (slug) => {
    if (slug === 'trip-planner') {
      if (!tripQuizDone) {
        setQuizSlug('trip-planner');
        setIsQuizOpen(true);
      } else {
        setActiveDigestTab('trip-planner');
        setIsDigestOpen(true);
      }
    } else if (slug === 'stock-lookout') {
      if (!stockQuizDone) {
        setQuizSlug('stock-lookout');
        setIsQuizOpen(true);
      } else {
        setActiveDigestTab('stock-lookout');
        setIsDigestOpen(true);
      }
    } else if (slug === 'news-briefing') {
      if (!newsQuizDone) {
        setQuizSlug('news-briefing');
        setIsQuizOpen(true);
      } else {
        setActiveDigestTab('news-briefing');
        setIsDigestOpen(true);
      }
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setIsSettingsOpen(false);
  };

  // Determine last fed metadata message for header
  const getLastFedText = () => {
    if (!tripQuizDone && !stockQuizDone && !newsQuizDone) {
      return "Setup profile to begin feeding";
    }
    if (tripDigestState === 'generating' || stockDigestState === 'generating' || newsDigestState === 'generating') {
      return "Agent is feeding now...";
    }
    
    const successfulDigests = digests?.filter(d => d.generation_status === 'success') || [];
    if (successfulDigests.length === 0) {
      return "Next feed: Tomorrow, 6:00 AM";
    }
    
    const sorted = [...successfulDigests].sort((a, b) => {
      const dateA = new Date(a.created_at || a.digest_date);
      const dateB = new Date(b.created_at || b.digest_date);
      return dateB - dateA;
    });
    
    const latest = sorted[0];
    const dateStr = latest.digest_date;
    const todayStr = new Date().toISOString().split('T')[0];
    
    if (dateStr === todayStr) {
      const timeStr = latest.created_at 
        ? new Date(latest.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) 
        : "6:02 AM";
      
      let name = 'Trip Planner';
      if (latest.fish_slug === 'stock-lookout') name = 'Stock Lookout';
      else if (latest.fish_slug === 'news-briefing') name = 'World News';
      
      return `Last fed (${name}): Today, ${timeStr}`;
    } else {
      return "Next feed: Tomorrow, 6:00 AM";
    }
  };

  if (dbStatus === 'loading') {
    return (
      <div className="min-h-screen bg-abyss flex items-center justify-center text-sea-foam/50 font-mono text-xs">
        <span className="w-5 h-5 border-2 border-bioluminescent/25 border-t-bioluminescent rounded-full animate-spin mr-3" />
        Connecting to the AIquarium database...
      </div>
    );
  }

  if (dbStatus === 'missing_tables') {
    return (
      <div className="min-h-screen bg-abyss flex flex-col items-center justify-center text-center p-6 text-sea-foam">
        <div className="max-w-md bg-[#050d1a] border border-coral-warm/25 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="w-12 h-12 rounded-full bg-coral-warm/15 border border-coral-warm/30 flex items-center justify-center text-coral-warm mx-auto">
            <AlertCircle size={24} />
          </div>
          <h2 className="font-display italic text-2xl text-white font-semibold">
            Database Setup Required
          </h2>
          <p className="text-xs text-sea-foam/60 leading-relaxed font-sans">
            We connected to Supabase, but the tables (<code>fish</code>, <code>fish_context</code>, <code>daily_digests</code>, <code>app_settings</code>) do not exist yet.
          </p>
          <div className="text-left text-xs bg-black/40 p-4 rounded-lg font-mono text-sea-foam/70 overflow-x-auto space-y-2 select-all">
            <p className="font-semibold text-coral-warm">Please run the SQL schema located in:</p>
            <code>supabase/schema.sql</code>
          </div>
          <p className="text-[10px] text-sea-foam/40 font-mono">
            Execute this SQL script inside your Supabase SQL Editor.
          </p>
        </div>
      </div>
    );
  }

  // Auth Gate check
  if (!session) {
    return <AuthGate onAuthSuccess={(sess) => setSession(sess)} />;
  }

  return (
    <div className="min-h-screen bg-abyss flex flex-col justify-between select-none relative">
      
      {/* Background gradients */}
      <div className="absolute inset-0 bg-gradient-to-b from-deep-ocean via-abyss to-abyss pointer-events-none z-0" />

      {/* Main Container */}
      <div className="w-full flex-1 flex flex-col z-10">
        
        {/* Header Bar */}
        <header className="px-6 py-4 flex items-center justify-between border-b border-white/5 bg-white/[0.01]">
          <div className="flex items-center gap-2">
            <span className="font-display italic text-2xl text-sea-foam select-none">
              The AIquarium
            </span>
          </div>
          
          <div className="flex items-center gap-4">
            <span className="font-mono text-[10px] md:text-xs text-sea-foam/50 uppercase tracking-wider hidden sm:inline text-right max-w-[280px] truncate">
              {getLastFedText()}
            </span>

            {/* AI Power Indicator in Header */}
            <div className="flex items-center gap-1 bg-white/[0.02] border border-white/5 rounded-full px-2.5 py-1 text-xs select-none">
              <span className="text-[9px] font-mono text-sea-foam/40 uppercase tracking-wider mr-1 hidden sm:inline">AI Power</span>
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, idx) => (
                  <div 
                    key={idx}
                    className={`w-1.5 h-2.5 rounded-sm transition-all duration-300 ${
                      idx < energy 
                        ? 'bg-bioluminescent shadow-[0_0_6px_rgba(0,229,255,0.6)]' 
                        : 'bg-white/10'
                    }`}
                  />
                ))}
              </div>
              <span className="font-mono text-[10px] text-bioluminescent font-semibold ml-1">
                {energy}/5
              </span>
            </div>
            
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="w-8 h-8 rounded-full bg-white/5 border border-white/5 hover:border-bioluminescent/20 text-sea-foam/60 hover:text-bioluminescent active:scale-95 flex items-center justify-center transition-all"
            >
              <Settings size={15} />
            </button>
          </div>
        </header>

        {/* The Animated Tank Workspace */}
        <main className="flex-1 flex items-center justify-center p-0 md:p-6 lg:p-8">
          <div className="w-full max-w-5xl rounded-none md:rounded-2xl border-none md:border border-white/5 shadow-2xl overflow-hidden bg-black/10">
            <AquariumTank
              tripQuizDone={tripQuizDone}
              stockQuizDone={stockQuizDone}
              newsQuizDone={newsQuizDone}
              tripDigestState={tripDigestState}
              stockDigestState={stockDigestState}
              newsDigestState={newsDigestState}
              tripFishActive={tripFishActive}
              stockFishActive={stockFishActive}
              newsFishActive={newsFishActive}
              onFishClick={handleFishClick}
              onSettingsClick={() => setIsSettingsOpen(true)}
              onAddAgent={handleAddAgent}
            />
          </div>
        </main>
      </div>

      {/* Dashboard minimal Footer credits */}
      <footer className="py-4 text-center font-mono text-[9px] text-sea-foam/20 z-10">
        THE AIQUARIUM MVP · GEMINI FLASH CURATION · TAVILY SCRAPING
      </footer>

      {/* Onboarding Quiz Modal overlay */}
      {isQuizOpen && (
        <OnboardingQuiz 
          fishSlug={quizSlug}
          onComplete={handleQuizComplete} 
        />
      )}

      {/* Slide up Digest panel sheet */}
      <DigestPanel
        isOpen={isDigestOpen}
        onClose={() => setIsDigestOpen(false)}
        digests={digests}
        homeCity={homeCity}
        initialAgent={activeDigestTab}
      />

      {/* Slide in Settings panel sidebar */}
      <SettingsPanel
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        quizContext={tripQuizContext}
        stockQuizContext={stockQuizContext}
        newsQuizContext={newsQuizContext}
        onRetakeQuiz={handleRetakeQuiz}
        onDigestGenerating={(slug) => {
          if (slug === 'trip-planner') setTripDigestState('generating');
          else if (slug === 'stock-lookout') setStockDigestState('generating');
          else setNewsDigestState('generating');
        }}
        onDigestGenerated={handleDigestGenerated}
        pinEnabled={false}
        onTogglePin={() => {}}
        pinCode={""}
        onUpdatePin={() => {}}
        energy={energy}
        secondsToRecharge={secondsToRecharge}
        tripFishActive={tripFishActive}
        stockFishActive={stockFishActive}
        newsFishActive={newsFishActive}
        onToggleFishActive={handleToggleFishActive}
        onLogout={handleLogout}
        onUpdateFeedFrequency={handleUpdateFeedFrequency}
      />

    </div>
  );
}
