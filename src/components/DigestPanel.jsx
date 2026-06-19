import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, DollarSign, Clock, Compass, ExternalLink } from 'lucide-react';

export default function DigestPanel({ isOpen, onClose, digests, homeCity, initialAgent = 'trip-planner' }) {
  const [activeAgent, setActiveAgent] = useState('trip-planner');
  const [activeTab, setActiveTab] = useState('today');
  const [expandedDigestId, setExpandedDigestId] = useState(null);

  // Set active agent when panel opens or when clicked from a specific fish
  useEffect(() => {
    if (isOpen && initialAgent) {
      setActiveAgent(initialAgent);
      setActiveTab('today');
      setExpandedDigestId(null);
    }
  }, [isOpen, initialAgent]);

  // Filter digests by agent slug
  const tripDigests = (digests || []).filter(d => d.fish_slug === 'trip-planner');
  const stockDigests = (digests || []).filter(d => d.fish_slug === 'stock-lookout');
  const newsDigests = (digests || []).filter(d => d.fish_slug === 'news-briefing');

  const currentDigests = activeAgent === 'trip-planner'
    ? tripDigests
    : activeAgent === 'stock-lookout'
      ? stockDigests
      : newsDigests;
  const todayDigest = currentDigests.length > 0 ? currentDigests[0] : null;

  // Helper to extract clean domain names from URLs
  const getDomainName = (url) => {
    try {
      const parsed = new URL(url);
      return parsed.hostname.replace('www.', '');
    } catch (e) {
      return url;
    }
  };

  const formatBudget = (low, high) => {
    if (!low && !high) return 'N/A';
    return `$${low?.toLocaleString() || '0'} – $${high?.toLocaleString() || '0'} CAD`;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr + 'T00:00:00'); // Prevent timezone shifts
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const toggleExpandHistory = (id) => {
    if (expandedDigestId === id) {
      setExpandedDigestId(null);
    } else {
      setExpandedDigestId(id);
    }
  };

  // Helper to render Stock picks content dynamically
  const renderStockContent = (digest, isHistory = false) => {
    if (!digest) return null;

    if (digest.generation_status === 'failed') {
      return (
        <div className="text-sm text-sea-foam/50 p-6 border border-dashed border-coral-warm/25 bg-coral-warm/5 rounded-xl space-y-3">
          <p className="font-semibold text-coral-warm flex items-center gap-1.5">
            <span>⚠️</span> Stock Curation Failed
          </p>
          <p className="text-xs text-sea-foam/70 leading-relaxed">
            {digest.headline || 'An error occurred during agent curation execution.'}
          </p>
          <p className="text-[10px] text-sea-foam/40 font-mono">
            You can trigger a manual feed inside the AIquarium Settings.
          </p>
        </div>
      );
    }

    let stockData = null;
    try {
      if (!digest.body_markdown) {
        throw new Error("No digest body content available");
      }
      stockData = JSON.parse(digest.body_markdown);
      if (!stockData || typeof stockData !== 'object') {
        throw new Error("Invalid stock data structure");
      }
    } catch (e) {
      return (
        <div className="text-sm text-sea-foam/50 p-4 border border-dashed border-white/10 rounded-lg">
          <p className="font-semibold text-coral-warm">Failed to parse stock digest data</p>
          <p className="text-xs mt-1">{digest.headline || 'An error occurred during parse.'}</p>
        </div>
      );
    }

    const renderConfidenceDots = (confidence) => {
      const c = confidence?.toLowerCase();
      if (c === 'high') return <span className="text-[#42a5f5] tracking-wider">●●●</span>;
      if (c === 'medium') return <span className="text-[#42a5f5] tracking-wider">●●○</span>;
      return <span className="text-[#42a5f5] tracking-wider">●○○</span>;
    };

    const getBadgeColor = (type) => {
      const t = type?.toLowerCase();
      if (t?.includes('speculative')) return 'bg-red-500/10 border-red-500/30 text-red-400';
      if (t?.includes('compounder') || t?.includes('safe')) return 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400';
      if (t?.includes('etf')) return 'bg-blue-500/10 border-blue-500/30 text-blue-400';
      if (t?.includes('hidden') || t?.includes('gem')) return 'bg-amber-500/10 border-amber-500/30 text-amber-400';
      if (t?.includes('upgrade') || t?.includes('analyst')) return 'bg-purple-500/10 border-purple-500/30 text-purple-400';
      return 'bg-teal-500/10 border-teal-500/30 text-teal-400';
    };

    return (
      <div className="space-y-6">
        {/* Market Mood Card */}
        <div className="bg-[#0d2a4a]/40 border border-[#1e88e5]/20 rounded-xl p-4 flex items-center gap-4">
          <div className="text-3xl shrink-0">{stockData.market_mood_emoji || '🟢'}</div>
          <div>
            <span className="font-mono text-[9px] uppercase tracking-widest text-[#42a5f5] font-semibold block">Market Vibe</span>
            <p className="text-sm md:text-base text-white/90 font-sans">{stockData.market_mood}</p>
          </div>
        </div>

        {/* Theme Title */}
        {!isHistory && (
          <div className="space-y-1">
            <span className="font-mono text-[9px] uppercase tracking-widest text-sea-foam/40 font-semibold block">Today's Focus Theme</span>
            <h2 className="font-display italic text-2xl text-white font-semibold leading-tight">{stockData.todays_theme}</h2>
          </div>
        )}

        {/* 3 Stock Cards Grid */}
        <div className={`grid grid-cols-1 ${isHistory ? 'gap-4' : 'md:grid-cols-3 gap-5'}`}>
          {stockData.picks?.map((pick, i) => (
            <div 
              key={i}
              className="frosted-glass-light rounded-xl p-5 flex flex-col justify-between neon-border-stock hover:neon-border-stock-active glass-glow-hover-stock transition-all duration-300 shadow-xl"
            >
              <div className="space-y-4">
                {/* Ticker and Title */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-2xl font-mono font-bold tracking-tight text-white block">{pick.ticker}</span>
                    <span className="text-[11px] text-sea-foam/60 font-sans block truncate max-w-[150px]">{pick.company_name}</span>
                    <span className="text-[9px] font-mono text-sea-foam/40 tracking-wider uppercase block">{pick.market}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border shrink-0 ${getBadgeColor(pick.pick_type)}`}>
                    {pick.pick_type}
                  </span>
                </div>

                {/* Why Today */}
                <div className="space-y-1">
                  <span className="font-mono text-[9px] uppercase tracking-wider text-sea-foam/40 block">Why Today</span>
                  <p className="text-xs md:text-sm text-sea-foam/80 leading-relaxed font-sans">{pick.why_today}</p>
                </div>

                {/* Bull case & Risk */}
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/5 text-[11px]">
                  <div className="space-y-0.5">
                    <span className="font-mono uppercase text-[#42a5f5]/80 font-semibold block">The Case For</span>
                    <p className="text-sea-foam/70 leading-normal">{pick.the_case_for}</p>
                  </div>
                  <div className="space-y-0.5">
                    <span className="font-mono uppercase text-red-400/80 font-semibold block">Main Risk</span>
                    <p className="text-sea-foam/70 leading-normal">{pick.the_risk}</p>
                  </div>
                </div>
              </div>

              {/* Bottom details */}
              <div className="mt-5 pt-3 border-t border-white/5 flex items-center justify-between text-[11px]">
                <div>
                  <span className="font-mono text-[9px] uppercase text-sea-foam/40 block">Fit & Duration</span>
                  <span className="text-white font-medium">{pick.time_horizon_fit}</span>
                </div>
                <div className="text-right">
                  <span className="font-mono text-[9px] uppercase text-sea-foam/40 block">Confidence</span>
                  {renderConfidenceDots(pick.confidence)}
                </div>
              </div>

              {/* One thing to check */}
              <div className="mt-3 bg-[#0d2a4a]/20 border border-[#1e88e5]/10 rounded-lg p-2.5 text-[10px] text-sea-foam/70">
                <span className="font-mono uppercase text-[#42a5f5]/80 font-semibold block mb-0.5">One thing to verify</span>
                {pick.one_thing_to_check}
              </div>
            </div>
          ))}
        </div>

        {/* Disclaimer */}
        <div className="text-[10px] font-sans text-sea-foam/30 leading-relaxed bg-white/[0.01] border border-white/5 rounded-lg p-3">
          <span className="font-semibold block text-sea-foam/40 mb-0.5">⚠️ DISCLAIMER</span>
          {stockData.disclaimer || "Not financial advice. Details generated are for educational purposes only."}
        </div>
      </div>
    );
  };

  const renderNewsContent = (digest, isHistory = false) => {
    if (!digest) return null;

    if (digest.generation_status === 'failed') {
      return (
        <div className="text-sm text-sea-foam/50 p-6 border border-dashed border-[#00e673]/25 bg-[#00e673]/5 rounded-xl space-y-3">
          <p className="font-semibold text-[#00e673] flex items-center gap-1.5">
            <span>⚠️</span> News Curation Failed
          </p>
          <p className="text-xs text-sea-foam/70 leading-relaxed">
            {digest.headline || 'An error occurred during agent curation execution.'}
          </p>
          <p className="text-[10px] text-sea-foam/40 font-mono">
            You can trigger a manual feed inside the AIquarium Settings.
          </p>
        </div>
      );
    }

    let newsData = null;
    try {
      if (!digest.body_markdown) {
        throw new Error("No digest body content available");
      }
      newsData = JSON.parse(digest.body_markdown);
      if (!newsData || typeof newsData !== 'object') {
        throw new Error("Invalid news data structure");
      }
    } catch (e) {
      return (
        <div className="text-sm text-sea-foam/50 p-4 border border-dashed border-white/10 rounded-lg">
          <p className="font-semibold text-coral-warm">Failed to parse news digest data</p>
          <p className="text-xs mt-1">{digest.headline || 'An error occurred during parse.'}</p>
        </div>
      );
    }

    const renderReliability = (score) => {
      const s = score?.toLowerCase();
      if (s === 'high') return <span className="text-[#00e673]">High Reliability</span>;
      if (s === 'medium') return <span className="text-amber-400">Medium Reliability</span>;
      return <span className="text-red-400">Low Reliability / Speculative</span>;
    };

    return (
      <div className="space-y-6">
        {/* News Vibe Card */}
        <div className="bg-[#021d12]/40 border border-[#00e673]/20 rounded-xl p-4 flex items-center gap-4">
          <div className="text-3xl shrink-0">{newsData.vibe_emoji || '🌐'}</div>
          <div>
            <span className="font-mono text-[9px] uppercase tracking-widest text-[#00e673] font-semibold block">Global News Vibe</span>
            <p className="text-sm md:text-base text-white/90 font-sans">{digest.headline || newsData.headline}</p>
          </div>
        </div>

        {/* Focus Theme */}
        {!isHistory && (
          <div className="space-y-1">
            <span className="font-mono text-[9px] uppercase tracking-widest text-sea-foam/40 font-semibold block">Today's Focus Theme</span>
            <h2 className="font-display italic text-2xl text-white font-semibold leading-tight">{newsData.todays_theme}</h2>
          </div>
        )}

        {/* Stories list */}
        <div className="space-y-4">
          {newsData.stories?.map((story, i) => (
            <div 
              key={i}
              className="frosted-glass-light rounded-xl p-5 border border-white/5 hover:border-[#00e673]/30 transition-all duration-300 shadow-xl space-y-3"
            >
              <div className="flex items-start justify-between gap-4">
                <h3 className="text-sm md:text-base font-semibold text-white leading-snug">{story.title}</h3>
                <span className="px-2 py-0.5 rounded text-[9px] font-mono tracking-wider font-semibold border bg-white/5 border-white/10 text-sea-foam/70">
                  {story.category || 'General'}
                </span>
              </div>
              <p className="text-xs md:text-sm text-sea-foam/80 leading-relaxed font-sans">{story.summary}</p>
              
              <div className="pt-2 border-t border-white/5 grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="font-mono uppercase text-[#00e673] font-semibold block text-[9px]">The Ripples / Implications</span>
                  <p className="text-sea-foam/70 leading-normal mt-0.5">{story.implications}</p>
                </div>
                <div className="md:text-right md:flex md:flex-col md:justify-end">
                  <span className="font-mono uppercase text-sea-foam/40 block text-[9px]">Sources Verification</span>
                  <span className="font-semibold block mt-0.5">{renderReliability(story.reliability_score)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Disclaimer */}
        <div className="text-[10px] font-sans text-sea-foam/30 leading-relaxed bg-white/[0.01] border border-white/5 rounded-lg p-3">
          <span className="font-semibold block text-sea-foam/40 mb-0.5">⚠️ DISCLAIMER</span>
          {newsData.disclaimer || "AI generated summary from web search indexes. Always verify critical news with primary journalism sources."}
        </div>
      </div>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop Blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-30 bg-abyss/85 backdrop-blur-sm"
          />

          {/* Slide up panel */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 180 }}
            className="fixed bottom-0 left-0 right-0 z-30 w-full h-[85vh] md:h-[75vh] lg:h-[68%] rounded-t-2xl border-t border-white/10 frosted-glass flex flex-col shadow-2xl text-sea-foam overflow-hidden"
          >
            {/* Panel Grabber for mobile visual hint */}
            <div className="w-12 h-1 bg-white/10 rounded-full mx-auto my-2.5 shrink-0" />

            {/* Panel Header */}
            <div className="px-6 pb-4 flex items-center justify-between border-b border-white/5 shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-2xl">
                  {activeAgent === 'trip-planner' 
                    ? '🐠' 
                    : activeAgent === 'stock-lookout' 
                      ? '📈' 
                      : '📰'
                  }
                </span>
                <div>
                  <h3 className="font-display text-lg text-white font-semibold leading-tight">
                    {activeAgent === 'trip-planner' 
                      ? 'Trip Planner' 
                      : activeAgent === 'stock-lookout' 
                        ? 'Stock Lookout' 
                        : 'World News'
                    }
                  </h3>
                  <span className="font-mono text-[10px] text-sea-foam/40 uppercase tracking-wider">
                    {activeAgent === 'trip-planner' 
                      ? 'AI CURATOR' 
                      : activeAgent === 'stock-lookout' 
                        ? 'MARKET ANALYST' 
                        : 'GLOBAL ANCHORMAN'
                    }
                  </span>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                {todayDigest && (
                  <div className="hidden sm:flex items-center gap-1.5 font-mono text-xs text-sea-foam/50 bg-white/[0.02] px-2.5 py-1 rounded border border-white/5">
                    <Calendar size={13} className={
                      activeAgent === 'trip-planner'
                        ? "text-bioluminescent"
                        : activeAgent === 'stock-lookout'
                          ? "text-[#42a5f5]"
                          : "text-[#00e673]"
                    } />
                    {formatDate(todayDigest.digest_date)}
                  </div>
                )}
                
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 active:scale-95 transition-all"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Agent Switcher Tabs */}
            <div className="px-6 pt-3 pb-1 border-b border-white/5 flex gap-6 shrink-0 font-sans text-sm font-semibold">
              <button
                onClick={() => {
                  setActiveAgent('trip-planner');
                  setActiveTab('today');
                  setExpandedDigestId(null);
                }}
                className={`pb-2 border-b-2 transition-all ${
                  activeAgent === 'trip-planner'
                    ? 'border-bioluminescent text-bioluminescent font-bold'
                    : 'border-transparent text-sea-foam/40 hover:text-sea-foam/70 font-medium'
                }`}
              >
                Trip Planner 🐠
              </button>
              <button
                onClick={() => {
                  setActiveAgent('stock-lookout');
                  setActiveTab('today');
                  setExpandedDigestId(null);
                }}
                className={`pb-2 border-b-2 transition-all ${
                  activeAgent === 'stock-lookout'
                    ? 'border-[#1e88e5] text-[#42a5f5] font-bold'
                    : 'border-transparent text-sea-foam/40 hover:text-sea-foam/70 font-medium'
                }`}
              >
                Stock Lookout 📈
              </button>
              <button
                onClick={() => {
                  setActiveAgent('news-briefing');
                  setActiveTab('today');
                  setExpandedDigestId(null);
                }}
                className={`pb-2 border-b-2 transition-all ${
                  activeAgent === 'news-briefing'
                    ? 'border-[#00e673] text-[#00e673] font-bold'
                    : 'border-transparent text-sea-foam/40 hover:text-sea-foam/70 font-medium'
                }`}
              >
                World News 📰
              </button>
            </div>

            {/* Tab Bar (Today/History) */}
            <div className="px-6 py-2 bg-white/[0.01] border-b border-white/5 flex gap-4 shrink-0 font-mono text-xs">
              <button
                onClick={() => {
                  setActiveTab('today');
                  setExpandedDigestId(null);
                }}
                className={`px-3 py-2 border-b-2 font-medium transition-all ${
                  activeTab === 'today'
                    ? activeAgent === 'trip-planner'
                      ? 'border-bioluminescent text-bioluminescent'
                      : activeAgent === 'stock-lookout'
                        ? 'border-[#1e88e5] text-[#42a5f5]'
                        : 'border-[#00e673] text-[#00e673]'
                    : 'border-transparent text-sea-foam/40 hover:text-sea-foam/70'
                }`}
              >
                [ Today ]
              </button>
              <button
                onClick={() => {
                  setActiveTab('history');
                  setExpandedDigestId(null);
                }}
                className={`px-3 py-2 border-b-2 font-medium transition-all ${
                  activeTab === 'history'
                    ? activeAgent === 'trip-planner'
                      ? 'border-bioluminescent text-bioluminescent'
                      : activeAgent === 'stock-lookout'
                        ? 'border-[#1e88e5] text-[#42a5f5]'
                        : 'border-[#00e673] text-[#00e673]'
                    : 'border-transparent text-sea-foam/40 hover:text-sea-foam/70'
                }`}
              >
                [ History ]
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar">
              {activeTab === 'today' ? (
                /* TODAY TAB */
                todayDigest ? (
                  activeAgent === 'trip-planner' ? (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="max-w-3xl mx-auto space-y-8 pb-12"
                    >
                      {/* Eyebrow & Title */}
                      <div className="space-y-1">
                        <span className="font-mono text-[9px] uppercase tracking-widest text-sea-foam/40 font-semibold block">
                          Destination of the Day
                        </span>
                        <h1 className="font-display italic text-3xl md:text-4xl text-white leading-tight">
                          {todayDigest.title}
                        </h1>
                        <p className="text-base text-bioluminescent flex items-center gap-1">
                          <Compass size={14} />
                          {todayDigest.destination}, {todayDigest.country}
                          {todayDigest.region && <span className="text-sea-foam/40 text-xs">({todayDigest.region})</span>}
                        </p>
                      </div>

                      {/* Stat Chips Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {/* Budget */}
                        <div className="frosted-glass-light rounded-xl p-4 flex items-center gap-3 neon-border-blue hover:neon-border-blue-active glass-glow-hover">
                          <div className="w-10 h-10 rounded-lg bg-bioluminescent/5 border border-bioluminescent/20 flex items-center justify-center text-bioluminescent shrink-0">
                            <DollarSign size={18} />
                          </div>
                          <div>
                            <span className="font-mono text-[10px] uppercase tracking-wider text-sea-foam/40 block">Est. Budget</span>
                            <span className="text-xs md:text-sm font-semibold text-white">
                              {formatBudget(todayDigest.estimated_budget_low, todayDigest.estimated_budget_high)}
                            </span>
                          </div>
                        </div>

                        {/* Duration */}
                        <div className="frosted-glass-light rounded-xl p-4 flex items-center gap-3 neon-border-blue hover:neon-border-blue-active glass-glow-hover">
                          <div className="w-10 h-10 rounded-lg bg-bioluminescent/5 border border-bioluminescent/20 flex items-center justify-center text-bioluminescent shrink-0">
                            <Clock size={18} />
                          </div>
                          <div>
                            <span className="font-mono text-[10px] uppercase tracking-wider text-sea-foam/40 block">Trip Length</span>
                            <span className="text-xs md:text-sm font-semibold text-white">
                              {todayDigest.best_time_to_go || '7–10 days'}
                            </span>
                          </div>
                        </div>

                        {/* Best For */}
                        <div className="frosted-glass-light rounded-xl p-4 flex items-center gap-3 neon-border-blue hover:neon-border-blue-active glass-glow-hover">
                          <div className="w-10 h-10 rounded-lg bg-bioluminescent/5 border border-bioluminescent/20 flex items-center justify-center text-bioluminescent shrink-0">
                            <Compass size={18} />
                          </div>
                          <div className="min-w-0">
                            <span className="font-mono text-[10px] uppercase tracking-wider text-sea-foam/40 block">Best For</span>
                            <span className="text-xs md:text-sm font-semibold text-white truncate block">
                              {todayDigest.headline ? todayDigest.headline.slice(0, 30) + (todayDigest.headline.length > 30 ? '...' : '') : 'Nature Travelers'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Section: WHY NOW */}
                      <div className="space-y-2">
                        <h4 className="font-mono text-[10px] uppercase tracking-widest text-sea-foam/50 font-semibold">
                          Why Now
                        </h4>
                        <p className="text-sm md:text-base text-sea-foam/85 leading-relaxed font-sans">
                          {todayDigest.body_markdown || 'This destination represents an incredible opportunity to escape. Current seasons offer optimal sights and values.'}
                        </p>
                      </div>

                      {/* Section: GETTING THERE */}
                      <div className="space-y-2">
                        <h4 className="font-mono text-[10px] uppercase tracking-widest text-sea-foam/50 font-semibold">
                          Getting There From {homeCity?.toUpperCase() || 'YOUR CITY'}
                        </h4>
                        <p className="text-sm md:text-base text-sea-foam/85 leading-relaxed font-sans">
                          {todayDigest.flight_info || 'Flights connect through major hubs with reasonable layouts. Booking well in advance is recommended.'}
                        </p>
                      </div>

                      {/* Section: THE HIDDEN GEM */}
                      <div className="space-y-2">
                        <h4 className="font-mono text-[10px] uppercase tracking-widest text-sea-foam/50 font-semibold">
                          The Hidden Gem
                        </h4>
                        <div className="frosted-glass-light rounded-lg p-4 text-sm md:text-base text-sea-foam/80 border-l-2 border-bioluminescent/40">
                          {todayDigest.hidden_gem || 'Ask the locals about secret trails off the main roads for spectacular secluded views.'}
                        </div>
                      </div>

                      {/* Section: YOUR ONE ACTION TODAY */}
                      <div className="space-y-2">
                        <h4 className="font-mono text-[10px] uppercase tracking-widest text-coral-warm/80 font-semibold">
                          Your One Action Today
                        </h4>
                        <div className="border-l-4 border-coral-warm bg-coral-warm/5 pl-4 py-3 rounded-r-lg text-sm md:text-base text-white font-medium shadow-[inset_1px_0_0_rgba(255,107,71,0.2)]">
                          {todayDigest.one_action_today || 'Research flight alerts for this destination on Google Flights.'}
                        </div>
                      </div>

                      <div className="w-full h-px bg-white/5 my-6" />

                      {/* Footer Sources */}
                      {todayDigest.research_sources && todayDigest.research_sources.length > 0 && (
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-[10px] text-sea-foam/30 uppercase mr-1">Sources:</span>
                          {todayDigest.research_sources.map((url, idx) => (
                            <a
                              key={idx}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 font-mono text-[10px] text-sea-foam/50 hover:text-bioluminescent bg-white/[0.02] border border-white/5 hover:border-bioluminescent/30 px-2 py-0.5 rounded transition-all"
                            >
                              {getDomainName(url)}
                              <ExternalLink size={8} />
                            </a>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  ) : activeAgent === 'stock-lookout' ? (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="max-w-3xl mx-auto space-y-8 pb-12"
                    >
                      {renderStockContent(todayDigest)}
                    </motion.div>
                  ) : (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="max-w-3xl mx-auto space-y-8 pb-12"
                    >
                      {renderNewsContent(todayDigest)}
                    </motion.div>
                  )
                ) : (
                  /* EMPTY STATE TODAY */
                  <div className="flex flex-col items-center justify-center text-center py-20 max-w-sm mx-auto">
                    <span className="text-4xl mb-4 opacity-50">
                      {activeAgent === 'trip-planner' ? '🧭' : activeAgent === 'stock-lookout' ? '📈' : '📰'}
                    </span>
                    <h4 className="font-display text-lg text-white mb-2">No Digest Generated Yet</h4>
                    <p className="text-xs text-sea-foam/50 leading-relaxed font-sans">
                      {activeAgent === 'trip-planner'
                        ? "Your AI agent hasn't created today's travel recommendation. Complete onboarding or trigger a manual feed in Settings to feed your fish."
                        : activeAgent === 'stock-lookout'
                          ? "Your AI agent hasn't created today's stock research. Complete onboarding or trigger a manual feed in Settings to feed your fish."
                          : "Your AI agent hasn't created today's news summary. Complete onboarding or trigger a manual feed in Settings to feed your fish."}
                    </p>
                  </div>
                )
              ) : (
                /* HISTORY TAB */
                currentDigests && currentDigests.length > 1 ? (
                  <div className="max-w-3xl mx-auto space-y-3 pb-12">
                    {currentDigests.slice(1).map((digest) => {
                      const isExpanded = expandedDigestId === digest.id;
                      return (
                        <div 
                          key={digest.id}
                          className="border border-white/5 rounded-xl overflow-hidden bg-white/[0.01] transition-colors hover:bg-white/[0.02]"
                        >
                          {/* Accordion Header Row */}
                          <div 
                            onClick={() => toggleExpandHistory(digest.id)}
                            className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 cursor-pointer select-none"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 md:gap-4">
                              <span className="font-mono text-xs text-sea-foam/40 w-32">
                                {formatDate(digest.digest_date)}
                              </span>
                              <span className="text-sm font-semibold text-white">
                                {activeAgent === 'trip-planner' 
                                  ? `${digest.destination}, ${digest.country}`
                                  : activeAgent === 'stock-lookout'
                                    ? digest.title || 'Market Outlook'
                                    : digest.title || 'Global News Summary'
                                }
                              </span>
                            </div>
                            <div className="flex items-center justify-between sm:justify-end gap-4">
                              <span className="font-mono text-xs text-bioluminescent">
                                {activeAgent === 'trip-planner'
                                  ? formatBudget(digest.estimated_budget_low, digest.estimated_budget_high)
                                  : activeAgent === 'stock-lookout'
                                    ? digest.destination || '⚡' // emoji representing market mood
                                    : digest.destination || '🌐' // vibe emoji
                                }
                              </span>
                              <span className="text-xs text-sea-foam/30">
                                {isExpanded ? '[ Close ]' : '[ Open ]'}
                              </span>
                            </div>
                          </div>

                          {/* Expanded Card Details */}
                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ height: 0 }}
                                animate={{ height: 'auto' }}
                                exit={{ height: 0 }}
                                transition={{ duration: 0.25 }}
                                className="overflow-hidden bg-white/[0.01] border-t border-white/5"
                              >
                                {activeAgent === 'trip-planner' ? (
                                  <div className="p-5 space-y-6 text-sm text-sea-foam/80">
                                    {/* Title */}
                                    <div className="space-y-1">
                                      <h4 className="font-display italic text-xl text-white font-semibold">{digest.title}</h4>
                                      {digest.region && <p className="text-xs text-bioluminescent font-mono">{digest.region}</p>}
                                    </div>
                                    
                                    {/* Why Now */}
                                    <div className="space-y-1">
                                      <span className="font-mono text-[9px] uppercase tracking-wider text-sea-foam/40 font-semibold block">Why Now</span>
                                      <p className="text-xs leading-relaxed">{digest.body_markdown}</p>
                                    </div>

                                    {/* Getting There */}
                                    <div className="space-y-1">
                                      <span className="font-mono text-[9px] uppercase tracking-wider text-sea-foam/40 font-semibold block">Flight Info</span>
                                      <p className="text-xs leading-relaxed">{digest.flight_info}</p>
                                    </div>

                                    {/* Hidden Gem */}
                                    <div className="space-y-1">
                                      <span className="font-mono text-[9px] uppercase tracking-wider text-sea-foam/40 font-semibold block">Hidden Gem</span>
                                      <p className="text-xs bg-white/[0.02] p-2.5 rounded border border-white/5">{digest.hidden_gem}</p>
                                    </div>

                                    {/* One Action */}
                                    <div className="space-y-1">
                                      <span className="font-mono text-[9px] uppercase tracking-wider text-coral-warm/70 font-semibold block">Action Plan</span>
                                      <p className="text-xs border-l-2 border-coral-warm bg-coral-warm/5 pl-3 py-1.5 text-white font-medium">{digest.one_action_today}</p>
                                    </div>
                                  </div>
                                ) : activeAgent === 'stock-lookout' ? (
                                  <div className="p-5 space-y-6 text-sm text-sea-foam/80">
                                    {renderStockContent(digest, true)}
                                  </div>
                                ) : (
                                  <div className="p-5 space-y-6 text-sm text-sea-foam/80">
                                    {renderNewsContent(digest, true)}
                                  </div>
                                )}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  /* EMPTY STATE HISTORY */
                  <div className="flex flex-col items-center justify-center text-center py-20 max-w-sm mx-auto">
                    <span className="text-4xl mb-4 opacity-50">📂</span>
                    <h4 className="font-display text-lg text-white mb-2">No Research History Yet</h4>
                    <p className="text-xs text-sea-foam/50 leading-relaxed font-sans">
                      {activeAgent === 'trip-planner'
                        ? "Your travel history will appear here after your first few days."
                        : activeAgent === 'stock-lookout'
                          ? "Your stock research history will appear here after your first few days."
                          : "Your global news history will appear here after your first few days."}
                    </p>
                  </div>
                )
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
