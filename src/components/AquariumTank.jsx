import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, Info, Loader2, HelpCircle } from 'lucide-react';

export default function AquariumTank({ 
  tripQuizDone, 
  stockQuizDone,
  tripDigestState, // 'none' | 'generating' | 'ready' | 'failed'
  stockDigestState, // 'none' | 'generating' | 'ready' | 'failed'
  tripFishActive = true,
  stockFishActive = true,
  onFishClick, 
  onSettingsClick,
  onAddAgent
}) {
  const [showTripTooltip, setShowTripTooltip] = useState(false);
  const [showStockTooltip, setShowStockTooltip] = useState(false);
  const [tripTooltipText, setTripTooltipText] = useState('');
  const [stockTooltipText, setStockTooltipText] = useState('');
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);

  // Generate 18 static bubble parameters once to prevent re-renders resetting animations
  const bubbles = useMemo(() => {
    return Array.from({ length: 18 }).map((_, i) => {
      const size = Math.floor(Math.random() * 8) + 4; // 4px to 12px
      const left = Math.random() * 100; // 0% to 100%
      const delay = Math.random() * 10; // 0s to 10s
      const duration = Math.floor(Math.random() * 8) + 6; // 6s to 14s
      const drift = Math.floor(Math.random() * 40) - 20; // -20px to 20px
      return {
        id: i,
        style: {
          left: `${left}%`,
          width: `${size}px`,
          height: `${size}px`,
          animationDelay: `${delay}s`,
          animationDuration: `${duration}s`,
          '--drift': `${drift}px`
        }
      };
    });
  }, []);

  // Generate 24 static floating micro-particle parameters once
  const particles = useMemo(() => {
    return Array.from({ length: 24 }).map((_, i) => {
      const size = Math.floor(Math.random() * 4) + 2; // 2px to 6px
      const left = Math.random() * 100; // 0% to 100%
      const delay = Math.random() * 15; // 0s to 15s
      const duration = Math.floor(Math.random() * 12) + 12; // 12s to 24s
      const driftX = Math.floor(Math.random() * 80) - 40; // -40px to 40px
      return {
        id: i,
        style: {
          left: `${left}%`,
          width: `${size}px`,
          height: `${size}px`,
          animationDelay: `${delay}s`,
          animationDuration: `${duration}s`,
          '--drift-x': `${driftX}px`
        }
      };
    });
  }, []);

  // Update trip planner tooltip content based on state
  useEffect(() => {
    if (!tripQuizDone) {
      setTripTooltipText('Click to configure Trip Planner 🐠');
    } else if (tripDigestState === 'generating') {
      setTripTooltipText('Curation in progress...');
    } else if (tripDigestState === 'ready') {
      setTripTooltipText('Travel digest ready! Click to view.');
    } else if (tripDigestState === 'failed') {
      setTripTooltipText('Curation failed. Click to view settings.');
    } else {
      setTripTooltipText('Curation active. Click to view history.');
    }
  }, [tripQuizDone, tripDigestState]);

  // Update stock lookout tooltip content based on state
  useEffect(() => {
    if (!stockQuizDone) {
      setStockTooltipText('Click to configure Stock Lookout 📈');
    } else if (stockDigestState === 'generating') {
      setStockTooltipText('Researching the market...');
    } else if (stockDigestState === 'ready') {
      setStockTooltipText('Market digest ready! Click to view.');
    } else if (stockDigestState === 'failed') {
      setStockTooltipText('Research failed. Click to view settings.');
    } else {
      setStockTooltipText('Research active. Click to view history.');
    }
  }, [stockQuizDone, stockDigestState]);

  // Determine glow class and saturate filter for Trip Planner
  let tripGlowClass = 'fish-glow-default';
  let tripSaturateStyle = {};

  if (!tripQuizDone) {
    tripGlowClass = '';
    tripSaturateStyle = { filter: 'saturate(30%)' };
  } else if (tripDigestState === 'generating') {
    tripGlowClass = 'fish-glow-default';
  } else if (tripDigestState === 'ready') {
    tripGlowClass = 'fish-glow-fed';
  } else if (tripDigestState === 'failed') {
    tripGlowClass = 'fish-glow-failed';
  }

  // Determine glow class and saturate filter for Stock Lookout
  let stockGlowClass = 'fish-glow-stock-default';
  let stockSaturateStyle = {};

  if (!stockQuizDone) {
    stockGlowClass = '';
    stockSaturateStyle = { filter: 'saturate(30%)' };
  } else if (stockDigestState === 'generating') {
    stockGlowClass = 'fish-glow-stock-default';
  } else if (stockDigestState === 'ready') {
    stockGlowClass = 'fish-glow-stock-fed';
  } else if (stockDigestState === 'failed') {
    stockGlowClass = 'fish-glow-failed';
  }

  return (
    <div className="relative w-full h-[50vh] md:h-[60vh] lg:h-[70vh] bg-gradient-to-b from-[#020810] via-[#050d1a] to-[#0a1628] overflow-hidden border-b border-white/5 select-none">
      
      {/* Ambient Light Rays */}
      <div className="light-ray left-[15%] w-[12%] rotate-[18deg]" style={{ animationDelay: '0s', animationDuration: '7s' }} />
      <div className="light-ray left-[40%] w-[16%] rotate-[22deg]" style={{ animationDelay: '1.5s', animationDuration: '9s' }} />
      <div className="light-ray left-[68%] w-[10%] rotate-[20deg]" style={{ animationDelay: '0.8s', animationDuration: '8s' }} />
      <div className="light-ray left-[85%] w-[14%] rotate-[24deg]" style={{ animationDelay: '2.2s', animationDuration: '10s' }} />

      {/* Water Caustics Shimmer Overlay */}
      <div className="caustics-layer-1" />
      <div className="caustics-layer-2" />

      {/* Floating Wobbling Bubbles */}
      {bubbles.map((bubble) => (
        <div key={bubble.id} className="bubble" style={bubble.style}>
          <div className="bubble-inner" />
        </div>
      ))}

      {/* Floating Marine Snow Particles */}
      {particles.map((particle) => (
        <div key={particle.id} className="particle" style={particle.style} />
      ))}

      {/* ---------------------------------------------------- */}
      {/* Add Agent Button & Menu Overlay */}
      {/* ---------------------------------------------------- */}
      {(!tripQuizDone || !stockQuizDone) && (
        <div className="absolute top-4 left-4 z-20">
          <button
            onClick={() => setIsAddMenuOpen(!isAddMenuOpen)}
            className="bg-white/5 hover:bg-white/10 active:scale-95 border border-white/10 hover:border-bioluminescent/40 text-sea-foam/90 hover:text-bioluminescent px-3.5 py-1.5 rounded-full text-xs font-mono tracking-wider shadow-lg flex items-center gap-1.5 transition-all duration-300 pointer-events-auto"
          >
            <span className="text-sm font-semibold">+</span> Add AI Agent
          </button>
          
          <AnimatePresence>
            {isAddMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute left-0 mt-2 w-56 bg-[#050d1a]/95 border border-white/10 rounded-xl p-2 shadow-2xl frosted-glass flex flex-col gap-1 z-30 pointer-events-auto"
              >
                <div className="px-2.5 py-1 text-[9px] uppercase tracking-wider text-sea-foam/40 font-mono">
                  Available Agents
                </div>
                {!tripQuizDone && (
                  <button
                    onClick={() => {
                      setIsAddMenuOpen(false);
                      if (onAddAgent) onAddAgent('trip-planner');
                    }}
                    className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-white/5 text-xs text-white hover:text-bioluminescent flex items-center justify-between group transition-all"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-base group-hover:animate-bounce">🐠</span>
                      <div>
                        <span className="font-semibold block text-[11px]">Trip Planner Fish</span>
                        <span className="text-[9px] text-sea-foam/50 font-sans block">Daily travel curation agent</span>
                      </div>
                    </div>
                  </button>
                )}
                {!stockQuizDone && (
                  <button
                    onClick={() => {
                      setIsAddMenuOpen(false);
                      if (onAddAgent) onAddAgent('stock-lookout');
                    }}
                    className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-white/5 text-xs text-white hover:text-[#42a5f5] flex items-center justify-between group transition-all"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-base group-hover:animate-bounce">📈</span>
                      <div>
                        <span className="font-semibold block text-[11px]">Stock Lookout Fish</span>
                        <span className="text-[9px] text-sea-foam/50 font-sans block">Daily market research agent</span>
                      </div>
                    </div>
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* If the tank is completely empty of active/configured fish, show a centered tutorial prompt */}
      {(!tripQuizDone || !tripFishActive) && (!stockQuizDone || !stockFishActive) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="text-center space-y-2 p-6 rounded-2xl bg-white/[0.01] border border-white/5 frosted-glass max-w-xs"
          >
            <p className="text-xs text-sea-foam/60 font-sans leading-relaxed">
              Your AIquarium is empty. Click <span className="font-semibold text-bioluminescent">Add AI Agent</span> in the top-left to configure and deploy your first fish.
            </p>
          </motion.div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 1. Trip Planner Fish (Clownfish) */}
      {/* ---------------------------------------------------- */}
      {tripFishActive && tripQuizDone && (
        <div 
          id="fish-trip-planner"
          className={`fish-container ${tripDigestState === 'generating' ? 'fish-fast' : ''}`}
          onClick={() => onFishClick('trip-planner')}
          onMouseEnter={() => setShowTripTooltip(true)}
          onMouseLeave={() => setShowTripTooltip(false)}
          style={tripSaturateStyle}
        >
        <div className="relative w-full h-full flex flex-col items-center">
          
          {/* Status Badge */}
          {tripQuizDone && tripDigestState === 'ready' && (
            <div className="absolute top-1 right-3 w-3.5 h-3.5 rounded-full bg-coral-warm border border-white/20 badge-pulse z-30" />
          )}

          {tripQuizDone && tripDigestState === 'generating' && (
            <div className="absolute top-1 right-3 w-5 h-5 rounded-full bg-bioluminescent/20 flex items-center justify-center border border-bioluminescent/30 z-30 animate-spin">
              <Loader2 size={12} className="text-bioluminescent" />
            </div>
          )}

          {tripQuizDone && tripDigestState === 'failed' && (
            <div className="absolute top-1 right-3 w-3.5 h-3.5 rounded-full bg-coral-warm border border-white/20 flex items-center justify-center z-30">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
            </div>
          )}

          {/* Styled SVG Fish */}
          <svg 
            viewBox="0 0 140 100" 
            width="130" 
            height="95" 
            className={`transition-all duration-300 ${tripGlowClass}`}
          >
            <defs>
              <linearGradient id="clown-body-grad" x1="0%" y1="30%" x2="100%" y2="70%">
                <stop offset="0%" stopColor="#ff4500" />
                <stop offset="35%" stopColor="#ff6a00" />
                <stop offset="75%" stopColor="#ffa500" />
                <stop offset="100%" stopColor="#ffd700" />
              </linearGradient>
              <linearGradient id="clown-fin-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ff7f50" />
                <stop offset="60%" stopColor="#ff4500" />
                <stop offset="100%" stopColor="#8b0000" />
              </linearGradient>
              <linearGradient id="clown-gloss" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.4" />
                <stop offset="40%" stopColor="#ffffff" stopOpacity="0.05" />
                <stop offset="100%" stopColor="#000000" stopOpacity="0.3" />
              </linearGradient>
              <clipPath id="clown-body-clip">
                <path d="M 18,50 C 24,30 52,22 84,28 C 96,31 106,38 116,42 C 124,45 128,48 128,50 C 128,52 124,55 116,58 C 106,62 96,69 84,72 C 52,78 24,70 18,50 Z" />
              </clipPath>
            </defs>

            {/* Dorsal Fin */}
            <g>
              <path d="M 40,28 C 45,6 68,2 90,14 C 95,16 92,23 88,28 C 76,24 58,26 40,28 Z" fill="url(#clown-fin-grad)" stroke="#1a0d00" strokeWidth="1.5" />
              <path d="M 40,28 C 45,6 68,2 90,14" fill="none" stroke="#111" strokeWidth="4" strokeLinecap="round" />
              <path d="M 41,27 C 45.5,7.5 67.5,3.5 89,15.2" fill="none" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" />
              <path d="M 50,23 C 54,12 56,12 56,23 M 62,21 C 66,8 68,8 68,22 M 74,20 C 78,10 80,10 80,21 M 84,21 C 87,14 88,14 88,22" fill="none" stroke="#1a0d00" strokeWidth="1.2" opacity="0.65" />
            </g>

            {/* Ventral & Anal Fins */}
            <g>
              <path d="M 46,68 C 48,88 64,92 72,74 C 70,72 58,70 46,68 Z" fill="url(#clown-fin-grad)" stroke="#1a0d00" strokeWidth="1.5" />
              <path d="M 46,68 C 48,88 64,92 72,74" fill="none" stroke="#111" strokeWidth="4" strokeLinecap="round" />
              <path d="M 47,69 C 49,87 63,91 71,75" fill="none" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" />
              <path d="M 52,72 C 55,83 58,83 58,71 M 60,71 C 63,81 66,80 66,72" fill="none" stroke="#1a0d00" strokeWidth="1.2" opacity="0.65" />
              <path d="M 88,68 C 96,82 106,78 108,60 C 102,60 94,64 88,68 Z" fill="url(#clown-fin-grad)" stroke="#1a0d00" strokeWidth="1.5" />
              <path d="M 88,68 C 96,82 106,78 108,60" fill="none" stroke="#111" strokeWidth="4.2" strokeLinecap="round" />
              <path d="M 89,67 C 96.5,80.5 105,76.5 107,61.5" fill="none" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" />
              <path d="M 94,66 C 98,75 101,73 101,63" fill="none" stroke="#1a0d00" strokeWidth="1.2" opacity="0.6" />
            </g>

            {/* Tail Fin */}
            <g className="fish-tail">
              <path d="M 122,50 C 138,24 146,26 138,12 C 128,14 122,34 116,42 M 122,50 C 138,76 146,74 138,88 C 128,86 122,66 116,58" fill="url(#clown-fin-grad)" stroke="#1a0d00" strokeWidth="1.5" />
              <path d="M 138,12 C 148,22 148,78 138,88" fill="none" stroke="#111" strokeWidth="5.5" strokeLinecap="round" />
              <path d="M 137.5,13 C 146.5,23 146.5,77 137.5,87" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M 124,47 C 130,38 134,34 137,34 M 126,50 C 134,50 138,50 142,50 M 124,53 C 130,62 134,66 137,66" fill="none" stroke="#1a0d00" strokeWidth="1.2" opacity="0.6" />
            </g>

            {/* Main Body */}
            <g clipPath="url(#clown-body-clip)">
              <path d="M 10,20 H 130 V 80 H 10 Z" fill="url(#clown-body-grad)" />
              <path d="M 108,20 C 114,35 114,65 108,80 L 117,80 C 123,65 123,35 117,20 Z" fill="#111" />
              <path d="M 110,20 C 115.5,35 115.5,65 110,80 L 115,80 C 120.5,65 120.5,35 115,20 Z" fill="#fff" />
              <path d="M 70,20 C 72,30 68,45 54,50 C 68,55 72,70 70,80 L 80,80 C 83,68 81,54 74,50 C 81,46 83,32 80,20 Z" fill="#111" />
              <path d="M 72,20 C 74,30 70.2,45 56.5,50 C 70.2,55 74,70 72,80 L 78,80 C 80.5,68 78.5,54 71.5,50 C 78.5,46 80.5,32 78,20 Z" fill="#fff" />
              <path d="M 38,22 C 43,30 43,70 38,78 L 46,78 C 52,65 52,35 46,22 Z" fill="#111" />
              <path d="M 39.5,22 C 44.5,30 44.5,70 39.5,78 L 44,78 C 49.5,65 49.5,35 44,22 Z" fill="#fff" />
              <path d="M 18,50 C 24,30 52,22 84,28 C 96,31 106,38 116,42 C 124,45 128,48 128,50 C 128,52 124,55 116,58 C 106,62 96,69 84,72 C 52,78 24,70 18,50 Z" fill="url(#clown-gloss)" />
              <path d="M 18,50 Q 15,48 18,46 Q 21,47 18,50" fill="#a00" stroke="#111" strokeWidth="0.8" />
            </g>

            {/* Outer body outline */}
            <path d="M 18,50 C 24,30 52,22 84,28 C 96,31 106,38 116,42 C 124,45 128,48 128,50 C 128,52 124,55 116,58 C 106,62 96,69 84,72 C 52,78 24,70 18,50 Z" fill="none" stroke="#1a0d00" strokeWidth="1.5" />

            {/* Pectoral Fin */}
            <g>
              <path d="M 42,50 C 36,56 32,66 38,72 C 44,78 52,64 50,56 C 48,48 44,48 42,50 Z" fill="url(#clown-fin-grad)" stroke="#1a0d00" strokeWidth="1.2" />
              <path d="M 38,72 C 44,78 52,64 50,56" fill="none" stroke="#111" strokeWidth="3" strokeLinecap="round" />
              <path d="M 39,71 C 44,76 51,64 49,57" fill="none" stroke="#fff" strokeWidth="1" strokeLinecap="round" />
            </g>

            {/* Eye */}
            <g>
              <circle cx="28" cy="42" r="6" fill="#fca103" stroke="#111" strokeWidth="0.8" />
              <circle cx="28" cy="42" r="4.2" fill="#7d3b00" />
              <circle cx="28.8" cy="41.2" r="2.8" fill="#0c0c0c" />
              <circle cx="27.8" cy="40.2" r="1.1" fill="#ffffff" />
              <circle cx="29.8" cy="42.5" r="0.5" fill="#ffffff" />
            </g>
          </svg>

          {/* Floating Fish Name */}
          <span className="font-display italic text-xs text-sea-foam/90 tracking-wide mt-1 select-none drop-shadow-[0_2px_4px_rgba(2,8,16,0.8)]">
            Trip Planner
          </span>
          
          {/* Floating Hover Tooltip */}
          <AnimatePresence>
            {showTripTooltip && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute top-[-36px] bg-abyss/90 border border-white/10 px-3 py-1 rounded text-[11px] font-medium text-white shadow-xl pointer-events-none whitespace-nowrap frosted-glass z-40"
              >
                {tripTooltipText}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 2. Stock Lookout Fish (Blue Tang) */}
      {/* ---------------------------------------------------- */}
      {stockFishActive && stockQuizDone && (
        <div 
          id="fish-stock-lookout"
          className={`stock-fish-container ${stockDigestState === 'generating' ? 'stock-fish-fast' : ''}`}
          onClick={() => onFishClick('stock-lookout')}
          onMouseEnter={() => setShowStockTooltip(true)}
          onMouseLeave={() => setShowStockTooltip(false)}
          style={stockSaturateStyle}
        >
        <div className="relative w-full h-full flex flex-col items-center">
          
          {/* Status Badge */}
          {stockQuizDone && stockDigestState === 'ready' && (
            <div className="absolute top-1 right-3 w-3.5 h-3.5 rounded-full bg-[#1e88e5] border border-white/20 badge-pulse z-30" />
          )}

          {stockQuizDone && stockDigestState === 'generating' && (
            <div className="absolute top-1 right-3 w-5 h-5 rounded-full bg-[#1e88e5]/20 flex items-center justify-center border border-[#1e88e5]/30 z-30 animate-spin">
              <Loader2 size={12} className="text-[#42a5f5]" />
            </div>
          )}

          {stockQuizDone && stockDigestState === 'failed' && (
            <div className="absolute top-1 right-3 w-3.5 h-3.5 rounded-full bg-[#1e88e5] border border-white/20 flex items-center justify-center z-30">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
            </div>
          )}

          {/* Styled SVG Fish */}
          <svg 
            viewBox="0 0 140 100" 
            width="130" 
            height="95" 
            className={`transition-all duration-300 ${stockGlowClass}`}
          >
            <defs>
              <linearGradient id="tang-body-grad" x1="0%" y1="0%" x2="100%" y2="80%">
                <stop offset="0%" stopColor="#0052cc" />
                <stop offset="35%" stopColor="#0a5cff" />
                <stop offset="70%" stopColor="#002288" />
                <stop offset="100%" stopColor="#000d33" />
              </linearGradient>
              <linearGradient id="tang-yellow-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ffea00" />
                <stop offset="80%" stopColor="#ffa600" />
                <stop offset="100%" stopColor="#ff7b00" />
              </linearGradient>
              <linearGradient id="tang-black-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#111a2e" />
                <stop offset="100%" stopColor="#05070d" />
              </linearGradient>
              <linearGradient id="tang-gloss" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.35" />
                <stop offset="50%" stopColor="#ffffff" stopOpacity="0.0" />
                <stop offset="100%" stopColor="#000000" stopOpacity="0.45" />
              </linearGradient>
              <clipPath id="tang-body-clip">
                <path d="M 22,50 C 26,22 56,15 88,20 C 104,23 112,32 118,44 C 122,48 122,52 118,56 C 112,68 104,77 88,80 C 56,85 26,78 22,50 Z" />
              </clipPath>
            </defs>

            {/* Dorsal Fin */}
            <g>
              <path d="M 42,22 C 55,2 88,4 112,18 C 114,19 110,24 104,22 C 86,18 64,18 42,22 Z" fill="url(#tang-body-grad)" stroke="#001a66" strokeWidth="1.2" />
              <path d="M 44,20 C 56,4 88,6 110,19" fill="none" stroke="#00e5ff" strokeWidth="1.8" strokeLinecap="round" opacity="0.85" />
              <path d="M 42,22 C 55,2 88,4 112,18" fill="none" stroke="#05070d" strokeWidth="2.5" />
            </g>

            {/* Anal/Ventral Fin */}
            <g>
              <path d="M 44,78 C 56,98 88,96 112,82 C 114,81 110,76 104,78 C 86,82 64,82 44,78 Z" fill="url(#tang-body-grad)" stroke="#001a66" strokeWidth="1.2" />
              <path d="M 46,80 C 57,96 88,94 110,81" fill="none" stroke="#00e5ff" strokeWidth="1.8" strokeLinecap="round" opacity="0.85" />
              <path d="M 44,78 C 56,98 88,96 112,82" fill="none" stroke="#05070d" strokeWidth="2.5" />
            </g>

            {/* Tail Fin */}
            <g className="fish-tail">
              <path d="M 112,50 L 136,22 C 144,35 144,65 136,78 Z" fill="url(#tang-yellow-grad)" stroke="#cc8800" strokeWidth="1.2" />
              <path d="M 136,22 C 144,35 144,65 136,78" fill="none" stroke="#05070d" strokeWidth="3" strokeLinecap="round" />
              <path d="M 112,50 L 136,22 M 112,50 L 136,78" fill="none" stroke="#05070d" strokeWidth="3" />
              <path d="M 113,50 L 135,23 M 113,50 L 135,77" fill="none" stroke="#fff" strokeWidth="1" opacity="0.7" />
              <path d="M 116,46 L 130,34 M 118,50 L 134,50 M 116,54 L 130,66" fill="none" stroke="#cc8800" strokeWidth="1" opacity="0.65" />
            </g>

            {/* Main Body */}
            <g clipPath="url(#tang-body-clip)">
              <path d="M 10,10 H 130 V 90 H 10 Z" fill="url(#tang-body-grad)" />
              <path d="M 118,46 C 104,40 92,42 78,48 C 66,54 52,55 36,46 C 30,42 26,44 24,54 C 22,66 26,76 34,76 C 46,76 56,66 66,58 C 76,50 90,48 106,53 C 112,55 116,52 118,46 Z" fill="url(#tang-black-grad)" />
              <path d="M 52,24 C 64,18 84,20 98,28 C 108,34 106,42 98,40 C 84,36 68,36 56,42 C 48,46 44,38 52,24 Z" fill="url(#tang-black-grad)" />
              <path d="M 22,50 C 26,22 56,15 88,20 C 104,23 112,32 118,44 C 122,48 122,52 118,56 C 112,68 104,77 88,80 C 56,85 26,78 22,50 Z" fill="url(#tang-gloss)" />
              <path d="M 22,50 C 24,36 36,26 50,22" fill="none" stroke="#33d6ff" strokeWidth="1.5" opacity="0.6" />
            </g>

            {/* Outer body outline */}
            <path d="M 22,50 C 26,22 56,15 88,20 C 104,23 112,32 118,44 C 122,48 122,52 118,56 C 112,68 104,77 88,80 C 56,85 26,78 22,50 Z" fill="none" stroke="#001a66" strokeWidth="1.5" />

            {/* Caudal Peduncle Spine */}
            <path d="M 108,49 L 102,50 L 108,51 Z" fill="#ffea00" stroke="#ffa600" strokeWidth="0.8" />

            {/* Pectoral Fin */}
            <g>
              <path d="M 78,54 C 86,58 92,68 88,74 C 84,80 78,74 76,68 C 74,62 74,56 78,54 Z" fill="rgba(255, 234, 0, 0.75)" stroke="#e69d00" strokeWidth="1" />
              <path d="M 88,74 C 84,80 78,74 76,68" fill="none" stroke="#05070d" strokeWidth="2.5" strokeLinecap="round" />
              <path d="M 78,56 C 81,62 84,66 85,71" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.8" />
            </g>

            {/* Eye */}
            <g>
              <circle cx="38" cy="40" r="6.2" fill="#ffe600" stroke="#05070d" strokeWidth="0.8" />
              <circle cx="38" cy="40" r="4.5" fill="#111" />
              <circle cx="39" cy="39" r="2.8" fill="#000" />
              <circle cx="38" cy="38" r="1.1" fill="#ffffff" />
              <circle cx="39.8" cy="40.2" r="0.6" fill="#ffffff" />
            </g>
          </svg>

          {/* Floating Fish Name */}
          <span className="font-display italic text-xs text-sea-foam/90 tracking-wide mt-1 select-none drop-shadow-[0_2px_4px_rgba(2,8,16,0.8)]">
            Stock Lookout
          </span>
          
          {/* Floating Hover Tooltip */}
          <AnimatePresence>
            {showStockTooltip && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute top-[-36px] bg-abyss/90 border border-white/10 px-3 py-1 rounded text-[11px] font-medium text-white shadow-xl pointer-events-none whitespace-nowrap frosted-glass z-40"
              >
                {stockTooltipText}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      )}

      {/* Decorative Seabed SVGs */}
      <div className="absolute bottom-0 inset-x-0 w-full h-[70px] md:h-[90px] pointer-events-none z-10">
        <svg 
          viewBox="0 0 1000 90" 
          preserveAspectRatio="none" 
          className="w-full h-full"
          fill="none"
        >
          <defs>
            <linearGradient id="dune-back" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#02111a" />
              <stop offset="100%" stopColor="#051f2e" />
            </linearGradient>
            <linearGradient id="dune-mid" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#042330" />
              <stop offset="100%" stopColor="#073b52" />
            </linearGradient>
            <linearGradient id="dune-front" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#063142" />
              <stop offset="100%" stopColor="#0a4b66" />
            </linearGradient>
            <filter id="neon-glow-filter-pink" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id="neon-glow-filter-aqua" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Layer 1: Dark Dunes (Background) */}
          <path d="M0,90 L0,58 C60,56 120,70 190,65 C260,60 320,75 410,70 C500,65 560,78 650,72 C740,66 820,78 910,74 C950,72 980,68 1000,70 L1000,90 Z" fill="url(#dune-back)" opacity="0.95" />
          
          {/* Layer 2: Swaying Kelp / Seagrass (Back layer) */}
          <g className="seabed-kelp-1 text-teal-900/40" fill="currentColor">
            <path d="M120,75 Q128,45 120,15 Q138,50 126,75 Z" />
            <path d="M126,75 Q135,38 140,25 Q145,55 132,75 Z" />
            <path d="M450,74 Q440,38 435,10 Q455,42 452,74 Z" />
            <path d="M453,74 Q465,30 472,12 Q476,46 459,74 Z" />
            <path d="M820,75 Q828,45 820,15 Q838,50 826,75 Z" />
          </g>

          <g className="seabed-kelp-2 text-emerald-900/50" fill="currentColor">
            <path d="M280,75 Q268,40 262,20 Q282,50 284,75 Z" />
            <path d="M284,75 Q296,35 304,22 Q304,52 290,75 Z" />
            <path d="M680,73 Q668,38 662,18 Q682,48 684,73 Z" />
            <path d="M684,73 Q696,32 704,20 Q704,50 690,73 Z" />
          </g>

          {/* Layer 3: Mid Dunes */}
          <path d="M0,90 L0,68 C40,65 90,80 150,74 C220,68 280,82 370,76 C460,70 520,85 610,79 C700,73 780,85 870,81 C930,78 970,73 1000,75 L1000,90 Z" fill="url(#dune-mid)" opacity="0.95" />

          {/* Layer 4: Swaying Kelp / Seagrass (Front layer) */}
          <g className="seabed-kelp-3 text-emerald-500/35" fill="currentColor">
            <path d="M35,78 Q50,35 35,5 Q55,42 45,78 Z" />
            <path d="M570,76 Q550,38 560,10 Q580,45 575,76 Z" />
            <path d="M910,78 Q890,40 900,12 Q920,48 915,78 Z" />
          </g>

          {/* Layer 5: Foreground Dunes */}
          <path d="M0,90 L0,78 C30,75 70,88 120,83 C180,77 240,90 320,85 C400,80 460,92 540,87 C620,82 680,94 760,89 C840,84 900,92 1000,85 L1000,90 Z" fill="url(#dune-front)" />

          {/* Coral Group 1: Left */}
          <g filter="url(#neon-glow-filter-pink)">
            <path d="M 85,82 C 80,62 86,52 82,40 Q 86,38 90,48 C 96,40 102,34 98,22 Q 104,22 103,38 C 110,44 116,40 112,52 C 109,53 105,53 102,57 C 100,52 92,52 89,82 Z" fill="#ff4081" opacity="0.9" />
            <circle cx="82" cy="40" r="1.5" fill="#fff" />
            <circle cx="98" cy="22" r="1.5" fill="#fff" />
            <circle cx="112" cy="52" r="1.5" fill="#fff" />
          </g>
          <circle cx="160" cy="84" r="8" fill="#9c27b0" opacity="0.85" />
          <circle cx="163" cy="81" r="5" fill="#ba68c8" opacity="0.9" />
          <circle cx="157" cy="85" r="4" fill="#7b1fa2" opacity="0.8" />

          {/* Coral Group 2: Middle */}
          <g filter="url(#neon-glow-filter-aqua)">
            <path d="M 350,82 C 345,64 349,52 344,40 C 350,40 354,48 353,60 M 353,60 C 360,52 366,48 362,35 C 368,35 371,44 366,62 C 372,68 380,65 376,78 C 373,79 369,79 366,82 Z" stroke="#00e5ff" strokeWidth="4" strokeLinecap="round" fill="none" opacity="0.9" />
            <path d="M 350,82 C 345,64 349,52 344,40 C 350,40 354,48 353,60 M 353,60 C 360,52 366,48 362,35 C 368,35 371,44 366,62" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" fill="none" opacity="0.95" />
            <circle cx="344" cy="40" r="2.2" fill="#00e5ff" />
            <circle cx="362" cy="35" r="2.2" fill="#00e5ff" />
            <circle cx="376" cy="78" r="2.2" fill="#00e5ff" />
          </g>
          <path d="M 485,84 C 482,74 498,74 495,84 Z" fill="#ffca28" opacity="0.95" stroke="#ff8f00" strokeWidth="1" />
          <ellipse cx="490" cy="76" rx="4" ry="1.5" fill="#ff8f00" />
          <path d="M 495,85 C 493,78 503,78 501,85 Z" fill="#ffd54f" opacity="0.95" stroke="#ffb300" strokeWidth="1" />
          <ellipse cx="498" cy="79" rx="3" ry="1.2" fill="#ffb300" />

          {/* Coral Group 3: Right */}
          <g filter="url(#neon-glow-filter-pink)">
            <path d="M 715,82 C 710,66 718,56 713,42 Q 718,42 721,54 C 728,45 735,42 731,32 Q 736,32 735,48 C 742,54 748,51 744,63 C 742,65 738,65 735,68 C 733,62 725,62 723,82 Z" fill="#e040fb" opacity="0.85" />
            <circle cx="713" cy="42" r="1.5" fill="#fff" />
            <circle cx="731" cy="32" r="1.5" fill="#fff" />
            <circle cx="744" cy="63" r="1.5" fill="#fff" />
          </g>
          <path d="M 770,84 Q 762,68 756,68 Q 766,73 770,84 Q 776,68 776,68 Q 776,73 770,84 Q 786,70 790,72 Q 782,76 770,84" fill="#ffa726" opacity="0.9" stroke="#fb8c00" strokeWidth="1.2" strokeLinecap="round" />
          <circle cx="756" cy="68" r="1.2" fill="#ffcc80" />
          <circle cx="776" cy="68" r="1.2" fill="#ffcc80" />
          <circle cx="790" cy="72" r="1.2" fill="#ffcc80" />

          {/* Starfish */}
          <g>
            <path d="M 630,82 L 633,76 L 639,76 L 634,80 L 637,86 L 630,83 L 623,86 L 626,80 L 621,76 L 627,76 Z" fill="#ff7043" stroke="#d84315" strokeWidth="0.8" opacity="0.95" />
            <circle cx="630" cy="80" r="1" fill="#fff" />
            <circle cx="630" cy="78" r="0.4" fill="#fff" opacity="0.7" />
            <circle cx="634" cy="78" r="0.4" fill="#fff" opacity="0.7" />
            <circle cx="633" cy="82" r="0.4" fill="#fff" opacity="0.7" />
            <circle cx="627" cy="82" r="0.4" fill="#fff" opacity="0.7" />
            <circle cx="627" cy="78" r="0.4" fill="#fff" opacity="0.7" />
          </g>

          {/* Shells */}
          <g>
            <path d="M 188,85 C 184,81 195,78 198,85 Z" fill="#ffe0b2" stroke="#8d6e63" strokeWidth="0.6" />
            <path d="M 188,85 Q 193,80 198,85 M 190,85 Q 194,80 196,85 M 192,85 Q 194,80 194,85" stroke="#8d6e63" strokeWidth="0.4" fill="none" />
          </g>
          <g>
            <path d="M 846,84 C 842,80 853,77 856,84 Z" fill="#cfd8dc" stroke="#546e7a" strokeWidth="0.6" />
            <path d="M 846,84 Q 851,79 856,84 M 848,84 Q 852,79 854,84" stroke="#546e7a" strokeWidth="0.4" fill="none" />
          </g>
        </svg>
      </div>
    </div>
  );
}
