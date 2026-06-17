import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, Info, Loader2, HelpCircle } from 'lucide-react';

export default function AquariumTank({ 
  quizDone, 
  digestState, // 'none' | 'generating' | 'ready' | 'failed'
  onFishClick, 
  onSettingsClick 
}) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipText, setTooltipText] = useState('');

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

  // Update tooltip content based on state
  useEffect(() => {
    if (!quizDone) {
      setTooltipText('Click me to get started');
    } else if (digestState === 'generating') {
      setTooltipText('Generating today’s digest...');
    } else if (digestState === 'ready') {
      setTooltipText('See today’s destination');
    } else if (digestState === 'failed') {
      setTooltipText('Digest generation failed. Check settings.');
    } else {
      setTooltipText('No digest yet. Check back tomorrow.');
    }
  }, [quizDone, digestState]);

  // Determine glow class and saturate filter
  let glowClass = 'fish-glow-default';
  let saturateStyle = {};

  if (!quizDone) {
    glowClass = '';
    saturateStyle = { filter: 'saturate(30%)' };
  } else if (digestState === 'generating') {
    glowClass = 'fish-glow-default';
  } else if (digestState === 'ready') {
    glowClass = 'fish-glow-fed';
  } else if (digestState === 'failed') {
    glowClass = 'fish-glow-failed';
  }

  return (
    <div className="relative w-full h-[50vh] md:h-[60vh] lg:h-[70vh] bg-gradient-to-b from-[#020810] via-[#050d1a] to-[#0a1628] overflow-hidden border-b border-white/5 select-none">
      
      {/* Light Rays */}
      <div className="light-ray left-[15%] w-[12%] rotate-[18deg]" style={{ animationDelay: '0s', animationDuration: '7s' }} />
      <div className="light-ray left-[40%] w-[16%] rotate-[22deg]" style={{ animationDelay: '1.5s', animationDuration: '9s' }} />
      <div className="light-ray left-[68%] w-[10%] rotate-[20deg]" style={{ animationDelay: '0.8s', animationDuration: '8s' }} />
      <div className="light-ray left-[85%] w-[14%] rotate-[24deg]" style={{ animationDelay: '2.2s', animationDuration: '10s' }} />

      {/* Floating Bubbles */}
      {bubbles.map((bubble) => (
        <div 
          key={bubble.id} 
          className="bubble" 
          style={bubble.style} 
        />
      ))}

      {/* Fish Onboarding Auto-Tooltip (triggers after 3s if quiz not done) */}
      {!quizDone && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 3, duration: 0.5 }}
          className="absolute top-[22%] left-[20%] z-20 bg-coral-warm text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-lg pointer-events-none badge-pulse"
        >
          Click me to get started 🐠
        </motion.div>
      )}

      {/* The Swimming Fish */}
      <div 
        className={`fish-container ${digestState === 'generating' ? 'fish-fast' : ''}`}
        onClick={onFishClick}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        style={saturateStyle}
      >
        <div className="relative w-full h-full flex flex-col items-center">
          
          {/* Status Badge */}
          {quizDone && digestState === 'ready' && (
            <div className="absolute top-1 right-3 w-3.5 h-3.5 rounded-full bg-coral-warm border border-white/20 badge-pulse z-30" />
          )}

          {quizDone && digestState === 'generating' && (
            <div className="absolute top-1 right-3 w-5 h-5 rounded-full bg-bioluminescent/20 flex items-center justify-center border border-bioluminescent/30 z-30 animate-spin">
              <Loader2 size={12} className="text-bioluminescent" />
            </div>
          )}

          {quizDone && digestState === 'failed' && (
            <div className="absolute top-1 right-3 w-3.5 h-3.5 rounded-full bg-coral-warm border border-white/20 flex items-center justify-center z-30">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
            </div>
          )}

          {/* Styled SVG Fish */}
          <svg 
            viewBox="0 0 120 100" 
            width="120" 
            height="90" 
            className={`transition-all duration-300 ${glowClass}`}
          >
            <defs>
              <linearGradient id="fish-body-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#00bcd4" />
                <stop offset="100%" stopColor="#1565c0" />
              </linearGradient>
              <linearGradient id="fin-coral-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ff8a65" />
                <stop offset="100%" stopColor="#ff6b47" />
              </linearGradient>
            </defs>
            
            {/* Dorsal Fin */}
            <path d="M35,32 C45,10 65,15 70,30 C55,25 42,28 35,32 Z" fill="url(#fin-coral-grad)" opacity="0.95" />
            
            {/* Tail Fin */}
            <path d="M10,50 C2,30 5,20 15,28 C22,40 18,45 10,50 Z" fill="url(#fin-coral-grad)" opacity="0.95" />
            <path d="M10,50 C2,70 5,80 15,72 C22,60 18,55 10,50 Z" fill="url(#fin-coral-grad)" opacity="0.95" />
            
            {/* Ventral Fin */}
            <path d="M40,68 C50,85 62,82 65,70 C53,72 45,71 40,68 Z" fill="url(#fin-coral-grad)" opacity="0.85" />
            
            {/* Main Body */}
            <path d="M15,50 C25,28 65,22 88,48 C100,50 108,48 112,47 C108,52 100,50 88,52 C65,78 25,72 15,50 Z" fill="url(#fish-body-grad)" />
            
            {/* Stripes */}
            <path d="M48,32 C52,42 52,58 48,68 C51,58 51,42 48,32 Z" fill="#0d47a1" opacity="0.3" />
            <path d="M62,30 C66,42 66,58 62,70 C65,58 65,42 62,30 Z" fill="#0d47a1" opacity="0.3" />
            
            {/* Eye */}
            <circle cx="95" cy="45" r="4.5" fill="white" />
            <circle cx="96.5" cy="44" r="2.5" fill="#020810" />
            {/* Eye catchlight */}
            <circle cx="95.5" cy="43.5" r="0.8" fill="white" />
          </svg>

          {/* Floating Fish Name */}
          <span className="font-display italic text-sm text-sea-foam tracking-wide mt-1.5 select-none drop-shadow-[0_2px_4px_rgba(2,8,16,0.8)]">
            Trip Planner
          </span>
          
          {/* Floating Hover Tooltip */}
          <AnimatePresence>
            {showTooltip && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute top-[-36px] bg-abyss/90 border border-white/10 px-3 py-1 rounded text-[11px] font-medium text-white shadow-xl pointer-events-none whitespace-nowrap frosted-glass z-40"
              >
                {tooltipText}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Decorative Seabed SVGs */}
      <div className="absolute bottom-0 inset-x-0 w-full h-[50px] md:h-[60px] pointer-events-none z-10">
        <svg 
          viewBox="0 0 1000 60" 
          preserveAspectRatio="none" 
          className="w-full h-full text-kelp-green"
          fill="currentColor"
        >
          {/* Layer 1: Dark Rocks (Background) */}
          <path d="M0,60 L0,38 C30,36 80,45 130,42 C190,38 220,50 290,44 C370,38 410,48 480,43 C550,38 580,45 640,40 C700,35 730,48 810,45 C880,42 930,35 1000,38 L1000,60 Z" fill="#051412" opacity="0.8" />
          
          {/* Layer 2: Coral & Seagrass shapes */}
          {/* Seagrass sways left and right using custom CSS sway classes */}
          {/* Grass clusters */}
          <g className="seabed-kelp-1 text-teal-900/40" fill="currentColor">
            <path d="M120,45 Q125,20 120,5 Q135,25 125,45 Z" />
            <path d="M125,45 Q132,15 135,8 Q140,28 130,45 Z" />
            <path d="M450,44 Q445,18 440,3 Q455,22 453,44 Z" />
            <path d="M455,44 Q462,15 466,6 Q470,26 459,44 Z" />
            <path d="M820,45 Q825,20 820,5 Q835,25 825,45 Z" />
          </g>

          <g className="seabed-kelp-2 text-kelp-green/50" fill="currentColor">
            <path d="M280,45 Q272,25 268,10 Q282,28 284,45 Z" />
            <path d="M284,45 Q292,20 298,12 Q298,30 288,45 Z" />
            <path d="M680,43 Q672,23 668,8 Q682,26 684,43 Z" />
            <path d="M684,43 Q692,18 698,10 Q698,28 688,43 Z" />
          </g>

          {/* Layer 3: Rounded foreground rocks */}
          <path d="M0,60 L0,48 C20,45 45,55 70,52 C110,48 130,56 160,51 C210,43 250,54 290,49 C330,44 350,53 380,50 C440,44 480,55 520,52 C570,48 590,56 620,51 C680,44 720,55 760,52 C810,48 830,56 860,51 C910,43 950,54 1000,48 L1000,60 Z" fill="#08201b" />
          
          {/* Foreground Coral details */}
          <path d="M210,50 C208,42 214,35 220,38 C226,34 232,38 230,45 C235,42 242,46 238,52 Z" fill="#ff6b47" opacity="0.6" />
          <path d="M710,51 C708,43 714,36 720,39 C726,35 732,39 730,46 C735,43 742,47 738,53 Z" fill="#00bcd4" opacity="0.4" />
        </svg>
      </div>
    </div>
  );
}
