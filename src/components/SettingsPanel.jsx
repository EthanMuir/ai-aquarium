import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, RefreshCw, Key, Database, Play, Eye, EyeOff, Loader2, Sparkles, AlertTriangle } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

export default function SettingsPanel({ 
  isOpen, 
  onClose, 
  quizContext, 
  onRetakeQuiz, 
  onDigestGenerated,
  pinEnabled,
  onTogglePin,
  pinCode,
  onUpdatePin
}) {
  const [loading, setLoading] = useState(false);
  const [showPinInput, setShowPinInput] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [statusMessage, setStatusMessage] = useState(null); // { type: 'success'|'error', text: string }

  const handleManualTrigger = async () => {
    setLoading(true);
    setStatusMessage({ type: 'info', text: 'Scraping travel options & calling Gemini...' });
    try {
      // Invoke the Supabase Edge Function
      const { data, error } = await supabase.functions.invoke('generate-trip-digest', {
        method: 'POST'
      });

      if (error) {
        throw new Error(error.message || 'Function invocation failed');
      }

      setStatusMessage({ type: 'success', text: 'Digest generated successfully!' });
      
      // Let the parent reload the digest list
      if (onDigestGenerated) {
        onDigestGenerated();
      }
    } catch (err) {
      console.error('Manual generation failed:', err);
      setStatusMessage({ 
        type: 'error', 
        text: err.message || 'Generation failed. Check keys in Supabase secrets.' 
      });
      // Set failed state in parent
      if (onDigestGenerated) {
        onDigestGenerated(true); // pass failed=true
      }
    } finally {
      setLoading(false);
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

  // Clear toast status after 5s
  useEffect(() => {
    if (statusMessage) {
      const timer = setTimeout(() => setStatusMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [statusMessage]);

  const cleanContextKey = (key) => {
    return key.replace('_', ' ');
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
            <div className="px-6 py-5 flex items-center justify-between border-b border-white/5">
              <div className="flex items-center gap-2">
                <Database size={18} className="text-bioluminescent" />
                <h3 className="font-display italic text-lg text-white font-semibold">
                  Aquarium Settings
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
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8 custom-scrollbar">
              
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

              {/* Feed Agent Manual Trigger */}
              <div className="space-y-3">
                <h4 className="font-mono text-[10px] uppercase tracking-wider text-sea-foam/40 font-semibold">
                  Agent Operations
                </h4>
                <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 space-y-4">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-white">Feed Trip Planner Fish</p>
                    <p className="text-xs text-sea-foam/55 leading-relaxed">
                      Force the travel curator agent to run now. This scrapes Tavily search logs and builds a daily digest via Gemini 1.5 Flash.
                    </p>
                  </div>
                  <button
                    onClick={handleManualTrigger}
                    disabled={loading}
                    className="w-full py-2.5 rounded-lg bg-bioluminescent text-black font-semibold text-sm flex items-center justify-center gap-1.5 hover:shadow-[0_0_15px_rgba(0,229,255,0.4)] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Generating Digest...
                      </>
                    ) : (
                      <>
                        <Play size={16} fill="black" />
                        Generate Today's Digest Now
                      </>
                    )}
                  </button>
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

              {/* Onboarding Preferences context viewer */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-mono text-[10px] uppercase tracking-wider text-sea-foam/40 font-semibold">
                    Profile Preferences
                  </h4>
                  <button
                    onClick={onRetakeQuiz}
                    className="text-xs text-coral-warm hover:underline flex items-center gap-1 font-mono"
                  >
                    <RefreshCw size={11} />
                    Re-take Quiz
                  </button>
                </div>

                <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 overflow-x-auto">
                  {quizContext && Object.keys(quizContext).length > 0 ? (
                    <table className="w-full border-collapse text-left text-xs font-mono">
                      <thead>
                        <tr className="border-b border-white/5 text-sea-foam/30">
                          <th className="pb-2 font-medium w-1/3">Key</th>
                          <th className="pb-2 font-medium w-2/3">Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(quizContext).map(([key, val]) => (
                          <tr key={key} className="border-b border-white/[0.02] hover:bg-white/[0.01]">
                            <td className="py-2.5 text-sea-foam/50 select-none pr-2 truncate max-w-[120px] uppercase text-[9px] tracking-wider">
                              {cleanContextKey(key)}
                            </td>
                            <td className="py-2.5 text-white whitespace-pre-wrap font-sans break-words pr-1 text-xs">
                              {val || 'None'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p className="text-xs text-sea-foam/45 py-2 text-center">
                      No saved profile preferences context.
                    </p>
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
                    <span className="text-white font-semibold">Supabase Postgres</span> - Host database tables and tracks agent logs.
                  </p>
                  <p>
                    <span className="text-white font-semibold">Gemini 1.5 Flash</span> - Generates curated travel suggestions matching profile constraints.
                  </p>
                  <p>
                    <span className="text-white font-semibold">Tavily Search API</span> - Aggregates and scrapes real-time travel flight parameters and Reddit tip logs.
                  </p>
                  <p>
                    <span className="text-white font-semibold">Supabase Edge Function</span> - Orchestrates background API fetch execution (Deno D18 / TS).
                  </p>
                </div>
              </div>

            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
