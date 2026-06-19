import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, RefreshCw, Key, Database, Play, Eye, EyeOff, Loader2, Sparkles, AlertTriangle, LogOut } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

export default function SettingsPanel({ 
  isOpen, 
  onClose, 
  quizContext, // trip planner
  stockQuizContext, // stock lookout
  newsQuizContext, // world news
  onRetakeQuiz, 
  onDigestGenerating,
  onDigestGenerated,
  pinEnabled,
  onTogglePin,
  pinCode,
  onUpdatePin,
  energy = 5,
  secondsToRecharge = 0,
  tripFishActive = true,
  stockFishActive = true,
  newsFishActive = true,
  onToggleFishActive,
  onLogout
}) {
  const [showPinInput, setShowPinInput] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [statusMessage, setStatusMessage] = useState(null); // { type: 'success'|'error'|'info', text: string }

  const [loadingTrip, setLoadingTrip] = useState(false);
  const [loadingStock, setLoadingStock] = useState(false);
  const [loadingNews, setLoadingNews] = useState(false);

  const [tavilyUsage, setTavilyUsage] = useState(null);
  const [loadingUsage, setLoadingUsage] = useState(false);

  // Per-user API key states
  const [geminiKeyInput, setGeminiKeyInput] = useState('');
  const [tavilyKeyInput, setTavilyKeyInput] = useState('');
  const [savingKeys, setSavingKeys] = useState(false);

  const fetchTavilyUsage = async () => {
    setLoadingUsage(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-trip-digest', {
        method: 'POST',
        body: { action: 'usage' }
      });
      if (!error && data?.status === 'success') {
        setTavilyUsage(data.usage);
      }
    } catch (err) {
      console.error('Failed to load Tavily usage:', err);
    } finally {
      setLoadingUsage(false);
    }
  };

  const fetchUserKeys = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('user_api_keys')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();
        if (data) {
          setGeminiKeyInput(data.gemini_api_key || '');
          setTavilyKeyInput(data.tavily_api_key || '');
        }
      }
    } catch (err) {
      console.error('Failed to load user API keys:', err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchTavilyUsage();
      fetchUserKeys();
    }
  }, [isOpen]);

  const handleSaveApiKeys = async (e) => {
    e.preventDefault();
    setSavingKeys(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not logged in.');

      const { error } = await supabase
        .from('user_api_keys')
        .upsert({
          user_id: user.id,
          gemini_api_key: geminiKeyInput,
          tavily_api_key: tavilyKeyInput,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      setStatusMessage({ type: 'success', text: 'API keys updated successfully!' });
      fetchTavilyUsage(); // reload usage in case keys changed
    } catch (err) {
      console.error(err);
      setStatusMessage({ type: 'error', text: `Failed to save keys: ${err.message || 'Error'}` });
    } finally {
      setSavingKeys(false);
    }
  };

  const handleTripManualTrigger = async () => {
    setLoadingTrip(true);
    if (onDigestGenerating) {
      onDigestGenerating('trip-planner');
    }
    setStatusMessage({ type: 'info', text: 'Trip Planner: Scraping travel options & calling Gemini...' });
    try {
      const { data, error } = await supabase.functions.invoke('generate-trip-digest', {
        method: 'POST',
        body: { force: true }
      });

      if (error) {
        throw new Error(error.message || 'Function invocation failed');
      }

      setStatusMessage({ type: 'success', text: 'Trip Planner digest generated successfully!' });
      
      if (onDigestGenerated) {
        onDigestGenerated('trip-planner');
      }
    } catch (err) {
      console.error('Trip Planner manual generation failed:', err);
      setStatusMessage({ 
        type: 'error', 
        text: `Trip Planner: ${err.message || 'Generation failed.'}` 
      });
      if (onDigestGenerated) {
        onDigestGenerated('trip-planner', true); // failed
      }
    } finally {
      setLoadingTrip(false);
    }
  };

  const handleStockManualTrigger = async () => {
    setLoadingStock(true);
    if (onDigestGenerating) {
      onDigestGenerating('stock-lookout');
    }
    setStatusMessage({ type: 'info', text: 'Stock Lookout: Scraping market options & calling Gemini...' });
    try {
      const { data, error } = await supabase.functions.invoke('generate-stock-digest', {
        method: 'POST',
        body: { force: true }
      });

      if (error) {
        throw new Error(error.message || 'Function invocation failed');
      }

      setStatusMessage({ type: 'success', text: 'Stock Lookout digest generated successfully!' });
      
      if (onDigestGenerated) {
        onDigestGenerated('stock-lookout');
      }
    } catch (err) {
      console.error('Stock Lookout manual generation failed:', err);
      setStatusMessage({ 
        type: 'error', 
        text: `Stock Lookout: ${err.message || 'Generation failed.'}` 
      });
      if (onDigestGenerated) {
        onDigestGenerated('stock-lookout', true); // failed
      }
    } finally {
      setLoadingStock(false);
    }
  };

  const handleNewsManualTrigger = async () => {
    setLoadingNews(true);
    if (onDigestGenerating) {
      onDigestGenerating('news-briefing');
    }
    setStatusMessage({ type: 'info', text: 'World News: Scraping global news & calling Gemini...' });
    try {
      const { data, error } = await supabase.functions.invoke('generate-news-digest', {
        method: 'POST',
        body: { force: true }
      });

      if (error) {
        throw new Error(error.message || 'Function invocation failed');
      }

      setStatusMessage({ type: 'success', text: 'World News digest generated successfully!' });
      
      if (onDigestGenerated) {
        onDigestGenerated('news-briefing');
      }
    } catch (err) {
      console.error('World News manual generation failed:', err);
      setStatusMessage({ 
        type: 'error', 
        text: `World News: ${err.message || 'Generation failed.'}` 
      });
      if (onDigestGenerated) {
        onDigestGenerated('news-briefing', true); // failed
      }
    } finally {
      setLoadingNews(false);
    }
  };

  const handlePinUpdateSubmit = async (e) => {
    e.preventDefault();
    if (!/^\d{4}$/.test(newPin)) {
      setPinError('PIN must be exactly 4 digits');
      return;
    }
    setPinError('');
    try {
      const { error } = await supabase
        .from('app_settings')
        .upsert({ key: 'pin', value: newPin });
      
      if (error) throw error;
      
      onUpdatePin(newPin);
      setNewPin('');
      setShowPinInput(false);
      alert('PIN updated successfully.');
    } catch (err) {
      console.error(err);
      setPinError('Could not save to database.');
    }
  };

  useEffect(() => {
    if (statusMessage && statusMessage.type !== 'info') {
      const timer = setTimeout(() => setStatusMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [statusMessage]);

  const cleanContextKey = (key) => {
    return key.replace(/_/g, ' ');
  };

  const renderPreferencesTable = (context) => {
    if (!context || Object.keys(context).length === 0) {
      return (
        <p className="text-xs text-sea-foam/45 py-2 text-center">
          No saved profile preferences context.
        </p>
      );
    }

    return (
      <table className="w-full border-collapse text-left text-xs font-mono">
        <thead>
          <tr className="border-b border-white/5 text-sea-foam/30">
            <th className="pb-2 font-medium w-1/3">Key</th>
            <th className="pb-2 font-medium w-2/3">Value</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(context).map(([key, val]) => (
            <tr key={key} className="border-b border-white/[0.02] hover:bg-white/[0.01]">
              <td className="py-2.5 text-sea-foam/50 select-none pr-2 truncate max-w-[120px] uppercase text-[9px] tracking-wider font-semibold">
                {cleanContextKey(key)}
              </td>
              <td className="py-2.5 text-white whitespace-pre-wrap font-sans break-words pr-1 text-xs">
                {val || 'None'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-30 bg-abyss/80"
          />

          {/* Sidebar */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 26, stiffness: 200 }}
            className="fixed top-0 right-0 bottom-0 z-30 w-full sm:w-[450px] bg-gradient-to-b from-[#050d1a] to-[#020810] border-l border-white/10 frosted-glass shadow-2xl flex flex-col text-sea-foam overflow-hidden"
          >
            {/* Header */}
            <div className="px-6 py-5 flex items-center justify-between border-b border-white/5 shrink-0">
              <div className="flex items-center gap-2">
                <Database size={18} className="text-bioluminescent" />
                <h3 className="font-display italic text-lg text-white font-semibold">
                  AIquarium Settings
                </h3>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 active:scale-95 transition-all"
              >
                <X size={16} />
              </button>
            </div>

            {/* Content list */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8 custom-scrollbar pb-12">
              
              {/* Dynamic status notifications */}
              {statusMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-3.5 rounded-lg border text-xs font-mono flex items-start gap-2.5 ${
                    statusMessage.type === 'success'
                      ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-400'
                      : statusMessage.type === 'error'
                        ? 'bg-rose-950/20 border-rose-500/30 text-rose-400'
                        : 'bg-bioluminescent/5 border-bioluminescent/20 text-bioluminescent'
                  }`}
                >
                  {statusMessage.type === 'error' ? (
                    <AlertTriangle size={15} className="shrink-0 mt-0.5" />
                  ) : statusMessage.type === 'info' ? (
                    <Loader2 size={15} className="shrink-0 mt-0.5 animate-spin" />
                  ) : (
                    <Sparkles size={15} className="shrink-0 mt-0.5" />
                  )}
                  <span>{statusMessage.text}</span>
                </motion.div>
              )}

              {/* Shared Energy Tracker Details */}
              <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-white">Central Curation Energy</span>
                  <div className="flex items-center gap-1.5">
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, idx) => (
                        <div 
                          key={idx}
                          className={`w-2 h-3.5 rounded-sm transition-all duration-300 ${
                            idx < energy 
                              ? 'bg-bioluminescent shadow-[0_0_6px_rgba(0,229,255,0.5)]' 
                              : 'bg-white/10'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="font-mono text-xs text-bioluminescent font-semibold ml-1">
                      {energy}/5
                    </span>
                  </div>
                </div>
                <p className="text-[11px] text-sea-foam/50 leading-relaxed font-sans">
                  Manual generation consumes 1 energy charge on success. Recharge occurs automatically at a rate of 1 charge every 4 hours.
                </p>
                {energy < 5 && secondsToRecharge > 0 && (
                  <div className="text-[10px] text-bioluminescent font-mono pt-1 border-t border-white/5">
                    Next recovery: {(() => {
                      const hours = Math.floor(secondsToRecharge / 3600);
                      const minutes = Math.floor((secondsToRecharge % 3600) / 60);
                      const seconds = secondsToRecharge % 60;
                      if (hours > 0) return `${hours}h ${minutes}m`;
                      return `${minutes}m ${seconds}s`;
                    })()}
                  </div>
                )}
              </div>

              {/* API KEYS SECTION */}
              <div className="space-y-4 pt-2">
                <h4 className="font-mono text-[10px] uppercase tracking-wider text-bioluminescent font-bold flex items-center gap-1.5">
                  <Key size={12} /> Personal API Keys
                </h4>
                <form onSubmit={handleSaveApiKeys} className="bg-white/[0.02] border border-white/5 rounded-xl p-4 space-y-4">
                  <div className="space-y-3">
                    <div>
                      <label className="text-[10px] uppercase font-mono tracking-wider text-sea-foam/50 block mb-1">
                        Gemini API Key
                      </label>
                      <input
                        type="password"
                        value={geminiKeyInput}
                        onChange={(e) => setGeminiKeyInput(e.target.value)}
                        placeholder="Enter your personal Gemini API key"
                        className="w-full bg-white/[0.03] border border-white/10 rounded px-3 py-1.5 text-xs font-mono focus:outline-none focus:border-bioluminescent text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-mono tracking-wider text-sea-foam/50 block mb-1">
                        Tavily API Key
                      </label>
                      <input
                        type="password"
                        value={tavilyKeyInput}
                        onChange={(e) => setTavilyKeyInput(e.target.value)}
                        placeholder="Enter your personal Tavily API key"
                        className="w-full bg-white/[0.03] border border-white/10 rounded px-3 py-1.5 text-xs font-mono focus:outline-none focus:border-bioluminescent text-white"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={savingKeys}
                    className="w-full py-2 bg-bioluminescent text-black font-semibold rounded text-xs hover:shadow-[0_0_10px_rgba(0,229,255,0.3)] active:scale-98 transition-all disabled:opacity-50"
                  >
                    {savingKeys ? 'Saving API Keys...' : 'Save API Keys'}
                  </button>
                </form>
              </div>

              {/* Aquarium Inhabitants Visibility Controls */}
              <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 space-y-4">
                <div>
                  <span className="text-sm font-semibold text-white block">Aquarium Inhabitants</span>
                  <span className="text-[11px] text-sea-foam/55">Toggle which AI agents are actively swimming in your AIquarium.</span>
                </div>
                
                <div className="space-y-3 pt-1">
                  {/* Trip Planner Row */}
                  <div className="flex items-center justify-between bg-white/[0.01] border border-white/5 p-3 rounded-lg hover:border-coral-warm/20 transition-all duration-200">
                    <div className="flex items-center gap-2.5">
                      <span className="text-lg">🐠</span>
                      <div>
                        <span className="text-xs font-semibold text-white block">Trip Planner Fish</span>
                        <span className="text-[9px] font-mono text-coral-warm/70 uppercase">Clownfish</span>
                      </div>
                    </div>
                    <button
                      onClick={() => onToggleFishActive('trip-planner')}
                      className={`premium-switch-track ${tripFishActive ? 'bg-coral-warm/25 border-coral-warm/40' : 'bg-white/5 border-white/10'}`}
                    >
                      <div 
                        className={`premium-switch-handle ${tripFishActive ? 'translate-x-5 bg-coral-warm shadow-[0_0_8px_#ff6b47]' : 'translate-x-0 bg-white/40'}`} 
                      />
                    </button>
                  </div>

                  {/* Stock Lookout Row */}
                  <div className="flex items-center justify-between bg-white/[0.01] border border-white/5 p-3 rounded-lg hover:border-[#1e88e5]/20 transition-all duration-200">
                    <div className="flex items-center gap-2.5">
                      <span className="text-lg">📈</span>
                      <div>
                        <span className="text-xs font-semibold text-white block">Stock Lookout Fish</span>
                        <span className="text-[9px] font-mono text-[#42a5f5]/70 uppercase">Blue Tang</span>
                      </div>
                    </div>
                    <button
                      onClick={() => onToggleFishActive('stock-lookout')}
                      className={`premium-switch-track ${stockFishActive ? 'bg-[#1e88e5]/25 border-[#1e88e5]/40' : 'bg-white/5 border-white/10'}`}
                    >
                      <div 
                        className={`premium-switch-handle ${stockFishActive ? 'translate-x-5 bg-[#1e88e5] shadow-[0_0_8px_#1e88e5]' : 'translate-x-0 bg-white/40'}`} 
                      />
                    </button>
                  </div>

                  {/* World News Row */}
                  <div className="flex items-center justify-between bg-white/[0.01] border border-white/5 p-3 rounded-lg hover:border-[#00e673]/20 transition-all duration-200">
                    <div className="flex items-center gap-2.5">
                      <span className="text-lg">📰</span>
                      <div>
                        <span className="text-xs font-semibold text-white block">World News Fish</span>
                        <span className="text-[9px] font-mono text-[#00e673]/70 uppercase">Moorish Idol</span>
                      </div>
                    </div>
                    <button
                      onClick={() => onToggleFishActive('news-briefing')}
                      className={`premium-switch-track ${newsFishActive ? 'bg-[#00e673]/25 border-[#00e673]/40' : 'bg-white/5 border-white/10'}`}
                    >
                      <div 
                        className={`premium-switch-handle ${newsFishActive ? 'translate-x-5 bg-[#00e673] shadow-[0_0_8px_#00e673]' : 'translate-x-0 bg-white/40'}`} 
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* SECTION 1: TRIP PLANNER FISH OPERATIONS */}
              <div className="space-y-4 pt-4 border-t border-white/5">
                <h4 className="font-mono text-[10px] uppercase tracking-wider text-coral-warm font-bold flex items-center gap-1.5">
                  <span>🐠</span> Trip Planner Fish
                </h4>
                
                <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 space-y-4">
                  <div className="space-y-1">
                    <p className="text-xs text-sea-foam/70 leading-relaxed">
                      Force curating travel options. Uses Tavily to scrape flight patterns and forums for trip destinations, generating content via Gemini 1.5 Flash.
                    </p>
                  </div>
                  
                  <button
                    onClick={handleTripManualTrigger}
                    disabled={loadingTrip || loadingStock || energy === 0}
                    className="w-full py-2.5 rounded-lg bg-bioluminescent text-black font-semibold text-sm flex items-center justify-center gap-1.5 hover:shadow-[0_0_15px_rgba(0,229,255,0.4)] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loadingTrip ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Generating Travel Digest...
                      </>
                    ) : energy === 0 ? (
                      <>
                        <AlertTriangle size={16} className="text-amber-500 animate-pulse" />
                        Out of Energy. Recharging...
                      </>
                    ) : (
                      <>
                        <Play size={16} fill="black" />
                        Manual Feed (Travel)
                      </>
                    )}
                  </button>
                </div>

                {/* Trip planner preferences */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[9px] uppercase tracking-wider text-sea-foam/40">Travel Preferences</span>
                    <button
                      onClick={() => onRetakeQuiz('trip-planner')}
                      className="text-[11px] text-coral-warm hover:underline flex items-center gap-1 font-mono"
                    >
                      <RefreshCw size={10} />
                      Retake Quiz
                    </button>
                  </div>
                  <div className="bg-white/[0.01] border border-white/5 rounded-xl p-3.5 overflow-x-auto max-h-[220px]">
                    {renderPreferencesTable(quizContext)}
                  </div>
                </div>
              </div>

              {/* SECTION 2: STOCK LOOKOUT FISH OPERATIONS */}
              <div className="space-y-4 pt-6 border-t border-white/5">
                <h4 className="font-mono text-[10px] uppercase tracking-wider text-[#42a5f5] font-bold flex items-center gap-1.5">
                  <span>🐠</span> Stock Lookout Fish
                </h4>
                
                <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 space-y-4">
                  <div className="space-y-1">
                    <p className="text-xs text-sea-foam/70 leading-relaxed">
                      Force researching the stock market. Tavily executes 4 financial sentiment queries, compiling analysis cards, confidence scores, and themes via Gemini.
                    </p>
                  </div>
                  
                  <button
                    onClick={handleStockManualTrigger}
                    disabled={loadingTrip || loadingStock || energy === 0}
                    className="w-full py-2.5 rounded-lg bg-[#1e88e5] text-white font-semibold text-sm flex items-center justify-center gap-1.5 hover:shadow-[0_0_15px_rgba(30,136,229,0.4)] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loadingStock ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Generating Stock Digest...
                      </>
                    ) : energy === 0 ? (
                      <>
                        <AlertTriangle size={16} className="text-amber-500 animate-pulse" />
                        Out of Energy. Recharging...
                      </>
                    ) : (
                      <>
                        <Play size={16} fill="black" />
                        Manual Feed (Stocks)
                      </>
                    )}
                  </button>
                </div>

                {/* Stock preferences */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[9px] uppercase tracking-wider text-sea-foam/40">Stock Preferences</span>
                    <button
                      onClick={() => onRetakeQuiz('stock-lookout')}
                      className="text-[11px] text-[#42a5f5] hover:underline flex items-center gap-1 font-mono"
                    >
                      <RefreshCw size={10} />
                      Retake Quiz
                    </button>
                  </div>
                  <div className="bg-white/[0.01] border border-white/5 rounded-xl p-3.5 overflow-x-auto max-h-[220px]">
                    {renderPreferencesTable(stockQuizContext)}
                  </div>
                </div>
              </div>

              {/* SECTION 3: WORLD NEWS FISH OPERATIONS */}
              <div className="space-y-4 pt-6 border-t border-white/5">
                <h4 className="font-mono text-[10px] uppercase tracking-wider text-[#00e673] font-bold flex items-center gap-1.5">
                  <span>📰</span> World News Fish
                </h4>
                
                <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 space-y-4">
                  <div className="space-y-1">
                    <p className="text-xs text-sea-foam/70 leading-relaxed">
                      Force compiling world news briefing. Tavily runs searches against global news indexes for today's date, generating story cards and summaries via Gemini.
                    </p>
                  </div>
                  
                  <button
                    onClick={handleNewsManualTrigger}
                    disabled={loadingTrip || loadingStock || loadingNews || energy === 0}
                    className="w-full py-2.5 rounded-lg bg-[#00e673] text-black font-semibold text-sm flex items-center justify-center gap-1.5 hover:shadow-[0_0_15px_rgba(0,230,115,0.4)] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loadingNews ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Generating News Digest...
                      </>
                    ) : energy === 0 ? (
                      <>
                        <AlertTriangle size={16} className="text-amber-500 animate-pulse" />
                        Out of Energy. Recharging...
                      </>
                    ) : (
                      <>
                        <Play size={16} fill="black" />
                        Manual Feed (News)
                      </>
                    )}
                  </button>
                </div>

                {/* News preferences */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[9px] uppercase tracking-wider text-sea-foam/40">News Preferences</span>
                    <button
                      onClick={() => onRetakeQuiz('news-briefing')}
                      className="text-[11px] text-[#00e673] hover:underline flex items-center gap-1 font-mono"
                    >
                      <RefreshCw size={10} />
                      Retake Quiz
                    </button>
                  </div>
                  <div className="bg-white/[0.01] border border-white/5 rounded-xl p-3.5 overflow-x-auto max-h-[220px]">
                    {renderPreferencesTable(newsQuizContext)}
                  </div>
                </div>
              </div>

              {/* SECTION 3: TAVILY USAGE & SECURITY */}
              <div className="space-y-6 pt-6 border-t border-white/5">
                {/* Tavily Search Quota Tracker */}
                <div className="space-y-3">
                  <h4 className="font-mono text-[10px] uppercase tracking-wider text-sea-foam/40 font-semibold">
                    Tavily API Usage
                  </h4>
                  <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-white font-semibold">Monthly Search Queries</span>
                      {loadingUsage ? (
                        <span className="text-[10px] text-sea-foam/40 animate-pulse">Loading...</span>
                      ) : tavilyUsage?.account ? (
                        <span className="text-bioluminescent font-semibold">
                          {(tavilyUsage.account.plan_limit - tavilyUsage.account.plan_usage).toLocaleString()} / {tavilyUsage.account.plan_limit.toLocaleString()} left
                        </span>
                      ) : (
                        <span className="text-sea-foam/40">Unavailable</span>
                      )}
                    </div>
                    {tavilyUsage?.account && (
                      <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className="bg-bioluminescent h-full transition-all duration-500 shadow-[0_0_6px_rgba(0,229,255,0.4)]"
                          style={{ 
                            width: `${Math.min(100, ((tavilyUsage.account.plan_limit - tavilyUsage.account.plan_usage) / tavilyUsage.account.plan_limit) * 100)}%` 
                          }}
                        />
                      </div>
                    )}
                    <div className="flex justify-between items-center text-[9px] text-sea-foam/40 font-mono">
                      <span>Plan: {tavilyUsage?.account?.current_plan || 'Researcher'}</span>
                      <span>Resets monthly</span>
                    </div>
                  </div>
                </div>

                {/* Security / PIN Lock settings */}
                <div className="space-y-3">
                  <h4 className="font-mono text-[10px] uppercase tracking-wider text-sea-foam/40 font-semibold">
                    Security Lock
                  </h4>
                  <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-white">Enable PIN Protection</p>
                        <p className="text-xs text-sea-foam/55">Require 4-digit PIN lock screen on launch.</p>
                      </div>
                      <button
                        onClick={onTogglePin}
                        className={`w-11 h-6 rounded-full transition-colors relative flex items-center px-0.5 ${
                          pinEnabled ? 'bg-bioluminescent' : 'bg-white/10'
                        }`}
                      >
                        <div 
                          className={`w-5 h-5 rounded-full bg-white transition-transform ${
                            pinEnabled ? 'translate-x-5' : 'translate-x-0'
                          }`} 
                        />
                      </button>
                    </div>

                    {pinEnabled && (
                      <div className="pt-2 border-t border-white/5 space-y-3">
                        <div className="flex items-center justify-between text-xs font-mono">
                          <span className="text-sea-foam/50">Current PIN Code:</span>
                          <span className="text-white bg-white/5 px-2 py-0.5 rounded font-semibold tracking-wider">
                            {pinCode}
                          </span>
                        </div>
                        
                        {!showPinInput ? (
                          <button
                            onClick={() => setShowPinInput(true)}
                            className="text-xs text-bioluminescent hover:underline flex items-center gap-1"
                          >
                            <Key size={12} />
                            Change PIN Code
                          </button>
                        ) : (
                          <form onSubmit={handlePinUpdateSubmit} className="space-y-2">
                            <input
                              type="password"
                              maxLength={4}
                              value={newPin}
                              onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                              placeholder="Enter new 4-digit PIN"
                              className="w-full bg-white/[0.03] border border-white/10 rounded px-3 py-1.5 text-xs font-mono focus:outline-none focus:border-bioluminescent text-white"
                            />
                            {pinError && <p className="text-coral-warm text-[10px] font-mono">{pinError}</p>}
                            <div className="flex gap-2">
                              <button
                                type="submit"
                                className="px-3 py-1 rounded bg-white/10 text-[10px] text-white hover:bg-white/20"
                              >
                                Save
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setShowPinInput(false);
                                  setNewPin('');
                                }}
                                className="px-3 py-1 rounded text-[10px] text-sea-foam/45 hover:text-white"
                              >
                                Cancel
                              </button>
                            </div>
                          </form>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* About section */}
                <div className="space-y-3">
                  <h4 className="font-mono text-[10px] uppercase tracking-wider text-sea-foam/40 font-semibold">
                    API & Tech Stack
                  </h4>
                  <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 text-xs text-sea-foam/60 space-y-2 leading-relaxed">
                    <p>
                      <span className="text-white font-semibold">Supabase Postgres</span> - Holds database tables and tracks agent logs.
                    </p>
                    <p>
                      <span className="text-white font-semibold">Gemini 1.5 Flash</span> - Generates curated suggestions matching profile constraints.
                    </p>
                    <p>
                      <span className="text-white font-semibold">Tavily Search API</span> - Aggregates and scrapes real-time travel flight patterns, stock movers, and sentiment metrics.
                    </p>
                    <p>
                      <span className="text-white font-semibold">Supabase Edge Functions</span> - Orchestrates backend API fetch execution in Deno environment.
                    </p>
                  </div>
                </div>
              </div>

              {/* Logout Block */}
              <div className="pt-4 border-t border-white/5">
                <button
                  onClick={onLogout}
                  className="w-full py-3 rounded-lg border border-red-500/20 bg-red-950/10 hover:bg-red-950/20 text-red-400 font-semibold text-xs flex items-center justify-center gap-1.5 transition-all duration-200"
                >
                  <LogOut size={14} />
                  Sign Out of Account
                </button>
              </div>

            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
