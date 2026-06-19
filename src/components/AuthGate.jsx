import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Lock, Mail, UserPlus, LogIn, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

export default function AuthGate({ onAuthSuccess }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      if (isSignUp) {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });
        if (signUpError) throw signUpError;
        alert('Account created! Please check your email to confirm registration or sign in directly.');
        setIsSignUp(false);
      } else {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
        if (onAuthSuccess) {
          onAuthSuccess(data.session);
        }
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-abyss text-sea-foam p-4 select-none">
      {/* Ambient backgrounds */}
      <div className="absolute inset-0 bg-gradient-to-b from-deep-ocean via-abyss to-abyss opacity-90 pointer-events-none" />
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-bioluminescent opacity-[0.03] blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-coral-warm opacity-[0.03] blur-[120px]" />

      {/* Floating Bubbles */}
      <div className="absolute inset-x-0 bottom-0 top-[20%] pointer-events-none overflow-hidden z-0 opacity-20">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute bottom-[-10px] w-2.5 h-2.5 rounded-full bg-white animate-[rise_12s_infinite_ease-in-out]"
            style={{
              left: `${15 + i * 14}%`,
              animationDelay: `${i * 1.8}s`,
              animationDuration: `${8 + i * 2}s`
            }}
          />
        ))}
      </div>

      <div className="w-full max-w-md z-10 flex flex-col items-center px-4">
        {/* Wordmark */}
        <h1 className="font-display italic text-4xl text-sea-foam mb-1 text-center drop-shadow-md">
          The AIquarium
        </h1>
        <p className="font-mono text-[9px] uppercase tracking-widest text-sea-foam/45 mb-8 flex items-center gap-1.5">
          <Shield size={11} className="text-bioluminescent" />
          An Aquarium of AI Agents
        </p>

        {/* Card */}
        <div className="w-full bg-[#050d1a]/60 border border-white/5 rounded-2xl p-6 md:p-8 frosted-glass shadow-2xl">
          {/* Tabs */}
          <div className="flex border-b border-white/5 mb-6">
            <button
              onClick={() => { setIsSignUp(false); setError(''); }}
              className={`flex-1 pb-3 text-sm font-mono tracking-wider transition-colors duration-200 border-b-2 flex items-center justify-center gap-1.5 ${
                !isSignUp 
                  ? 'border-bioluminescent text-white' 
                  : 'border-transparent text-sea-foam/40 hover:text-white'
              }`}
            >
              <LogIn size={14} />
              Sign In
            </button>
            <button
              onClick={() => { setIsSignUp(true); setError(''); }}
              className={`flex-1 pb-3 text-sm font-mono tracking-wider transition-colors duration-200 border-b-2 flex items-center justify-center gap-1.5 ${
                isSignUp 
                  ? 'border-coral-warm text-white' 
                  : 'border-transparent text-sea-foam/40 hover:text-white'
              }`}
            >
              <UserPlus size={14} />
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3 rounded-lg bg-rose-950/20 border border-rose-500/30 text-rose-400 text-xs font-mono flex items-start gap-2">
                <AlertTriangle size={15} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-mono tracking-wider text-sea-foam/50 flex items-center gap-1.5">
                <Mail size={12} className="text-sea-foam/40" />
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className={`w-full bg-white/[0.02] border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none transition-all ${
                  isSignUp 
                    ? 'focus:border-coral-warm/40 focus:bg-[#ff6b47]/5' 
                    : 'focus:border-bioluminescent/40 focus:bg-[#00e5ff]/5'
                }`}
                required
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5 relative">
              <label className="text-[10px] uppercase font-mono tracking-wider text-sea-foam/50 flex items-center gap-1.5">
                <Lock size={12} className="text-sea-foam/40" />
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`w-full bg-white/[0.02] border border-white/5 rounded-xl pl-4 pr-10 py-3 text-sm text-white focus:outline-none transition-all ${
                    isSignUp 
                      ? 'focus:border-coral-warm/40 focus:bg-[#ff6b47]/5' 
                      : 'focus:border-bioluminescent/40 focus:bg-[#00e5ff]/5'
                  }`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sea-foam/40 hover:text-white"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 rounded-xl font-semibold text-sm transition-all duration-300 flex items-center justify-center gap-1.5 ${
                isSignUp 
                  ? 'bg-coral-warm text-white hover:shadow-[0_0_20px_rgba(255,107,71,0.3)] active:scale-98' 
                  : 'bg-bioluminescent text-black hover:shadow-[0_0_20px_rgba(0,229,255,0.3)] active:scale-98'
              } disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none`}
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : isSignUp ? (
                'Create Free Account'
              ) : (
                'Log In'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
