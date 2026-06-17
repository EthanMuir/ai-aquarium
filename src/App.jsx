import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabaseClient';
import AquariumTank from './components/AquariumTank';
import OnboardingQuiz from './components/OnboardingQuiz';
import DigestPanel from './components/DigestPanel';
import SettingsPanel from './components/SettingsPanel';
import PinGate from './components/PinGate';
import { Settings, Shield, AlertCircle } from 'lucide-react';

export default function App() {
  const [dbStatus, setDbStatus] = useState('loading'); // 'loading' | 'ready' | 'missing_tables'
  const [pinEnabled, setPinEnabled] = useState(false);
  const [pinCode, setPinCode] = useState('1234');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [quizDone, setQuizDone] = useState(false);
  
  // Quiz context key-values
  const [quizContext, setQuizContext] = useState({});
  const [homeCity, setHomeCity] = useState('');

  // Digests history
  const [digests, setDigests] = useState([]);
  const [digestState, setDigestState] = useState('none'); // 'none' | 'generating' | 'ready' | 'failed'

  // Modal / panel toggles
  const [isQuizOpen, setIsQuizOpen] = useState(false);
  const [isDigestOpen, setIsDigestOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Initialize and check database tables
  useEffect(() => {
    async function initApp() {
      try {
        // 1. Check if we can query app_settings (indicates if schema is run)
        const { data: settingsData, error: settingsError } = await supabase
          .from('app_settings')
          .select('*');

        if (settingsError) {
          console.error('Database connection or table missing error:', settingsError);
          setDbStatus('missing_tables');
          return;
        }

        setDbStatus('ready');

        // Parse global settings
        const enabledSetting = settingsData.find(s => s.key === 'pin_enabled');
        const codeSetting = settingsData.find(s => s.key === 'pin');
        
        const isEnabled = enabledSetting?.value === 'true';
        const code = codeSetting?.value || '1234';
        
        setPinEnabled(isEnabled);
        setPinCode(code);

        // Check local session authentication
        if (sessionStorage.getItem('aquarium_authenticated') === 'true') {
          setIsAuthenticated(true);
        }

        // 2. Check onboarding quiz state
        const localQuizDone = localStorage.getItem('aquarium_quiz_done') === 'true';
        setQuizDone(localQuizDone);
        
        // Fetch context from DB regardless of local storage to keep sync
        await fetchFishContext();
        await fetchDigests();

      } catch (err) {
        console.error('Initialization crash:', err);
        setDbStatus('missing_tables');
      }
    }

    initApp();
  }, []);

  const fetchFishContext = async () => {
    try {
      const { data, error } = await supabase
        .from('fish_context')
        .select('context_key, context_value')
        .eq('fish_slug', 'trip-planner');

      if (!error && data) {
        const contextMap = {};
        data.forEach(row => {
          contextMap[row.context_key] = row.context_value;
        });
        setQuizContext(contextMap);
        
        if (contextMap.home_city) {
          setHomeCity(contextMap.home_city);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchDigests = async () => {
    try {
      const { data, error } = await supabase
        .from('daily_digests')
        .select('*')
        .eq('fish_slug', 'trip-planner')
        .order('digest_date', { ascending: false });

      if (!error && data) {
        setDigests(data);
        
        // Update fish visual state based on digests
        if (data.length > 0) {
          const latest = data[0];
          // Check if latest digest matches today's date in local time
          const todayStr = new Date().toISOString().split('T')[0];
          
          if (latest.generation_status === 'failed') {
            setDigestState('failed');
          } else if (latest.generation_status === 'success') {
            setDigestState('ready');
          } else {
            setDigestState('none');
          }
        } else {
          setDigestState('none');
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleVerifyPin = () => {
    setIsAuthenticated(true);
    sessionStorage.setItem('aquarium_authenticated', 'true');
  };

  const handleQuizComplete = async () => {
    setQuizDone(true);
    setIsQuizOpen(false);
    await fetchFishContext();
    await fetchDigests();
  };

  const handleRetakeQuiz = () => {
    localStorage.removeItem('aquarium_quiz_done');
    setQuizDone(false);
    setIsSettingsOpen(false);
    setIsQuizOpen(true);
  };

  const handleDigestGenerated = async (failed = false) => {
    if (failed) {
      setDigestState('failed');
      return;
    }
    
    // Set to ready state while loading new list
    setDigestState('ready');
    await fetchDigests();
  };

  const handleTogglePin = async () => {
    const nextVal = !pinEnabled;
    try {
      const { error } = await supabase
        .from('app_settings')
        .upsert({ key: 'pin_enabled', value: nextVal ? 'true' : 'false' });

      if (!error) {
        setPinEnabled(nextVal);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdatePinCode = (code) => {
    setPinCode(code);
  };

  // Determine last fed metadata message for header
  const getLastFedText = () => {
    if (!quizDone) {
      return "Setup profile to begin feeding";
    }
    if (digestState === 'generating') {
      return "Agent is feeding now...";
    }
    if (!digests || digests.length === 0) {
      return "Next feed: Tomorrow, 6:00 AM";
    }
    const latest = digests[0];
    const dateStr = latest.digest_date;
    const todayStr = new Date().toISOString().split('T')[0];
    
    if (dateStr === todayStr && latest.generation_status === 'success') {
      const timeStr = latest.created_at 
        ? new Date(latest.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) 
        : "6:02 AM";
      return `Last fed: Today, ${timeStr}`;
    } else {
      return "Next feed: Tomorrow, 6:00 AM";
    }
  };

  // --------------------------------------------------------
  // Views Handling
  // --------------------------------------------------------

  if (dbStatus === 'loading') {
    return (
      <div className="min-h-screen bg-abyss flex items-center justify-center text-sea-foam/50 font-mono text-xs">
        <span className="w-5 h-5 border-2 border-bioluminescent/25 border-t-bioluminescent rounded-full animate-spin mr-3" />
        Connecting to the Aquarium database...
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

  // Auth Gate
  if (pinEnabled && !isAuthenticated) {
    return (
      <PinGate 
        correctPin={pinCode} 
        onVerify={handleVerifyPin} 
      />
    );
  }

  // Force quiz on first launch
  if (!quizDone && !isQuizOpen) {
    setIsQuizOpen(true);
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
              The Aquarium
            </span>
          </div>
          
          <div className="flex items-center gap-4">
            <span className="font-mono text-[10px] md:text-xs text-sea-foam/50 uppercase tracking-wider">
              {getLastFedText()}
            </span>
            
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
              quizDone={quizDone}
              digestState={digestState}
              onFishClick={quizDone ? () => setIsDigestOpen(true) : () => setIsQuizOpen(true)}
              onSettingsClick={() => setIsSettingsOpen(true)}
            />
          </div>
        </main>
      </div>

      {/* Dashboard minimal Footer credits */}
      <footer className="py-4 text-center font-mono text-[9px] text-sea-foam/20 z-10">
        THE AQUARIUM MVP · GEMINI FLASH CURATION · TAVILY SCRAPING
      </footer>

      {/* Onboarding Quiz Modal overlay */}
      {isQuizOpen && (
        <OnboardingQuiz 
          onComplete={handleQuizComplete} 
        />
      )}

      {/* Slide up Digest panel sheet */}
      <DigestPanel
        isOpen={isDigestOpen}
        onClose={() => setIsDigestOpen(false)}
        digests={digests}
        homeCity={homeCity}
      />

      {/* Slide in Settings panel sidebar */}
      <SettingsPanel
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        quizContext={quizContext}
        onRetakeQuiz={handleRetakeQuiz}
        onDigestGenerated={handleDigestGenerated}
        pinEnabled={pinEnabled}
        onTogglePin={handleTogglePin}
        pinCode={pinCode}
        onUpdatePin={handleUpdatePinCode}
      />

    </div>
  );
}
