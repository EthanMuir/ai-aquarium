import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, DollarSign, Clock, Compass, ExternalLink } from 'lucide-react';

export default function DigestPanel({ isOpen, onClose, digests, homeCity }) {
  const [activeTab, setActiveTab] = useState('today');
  const [expandedDigestId, setExpandedDigestId] = useState(null);

  // Today's digest is the most recent one
  const todayDigest = digests && digests.length > 0 ? digests[0] : null;

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
                <span className="text-2xl">🐟</span>
                <div>
                  <h3 className="font-display text-lg text-white font-semibold leading-tight">
                    Trip Planner
                  </h3>
                  <span className="font-mono text-[10px] text-sea-foam/40 uppercase tracking-wider">
                    AI CURATOR
                  </span>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                {todayDigest && (
                  <div className="hidden sm:flex items-center gap-1.5 font-mono text-xs text-sea-foam/50 bg-white/[0.02] px-2.5 py-1 rounded border border-white/5">
                    <Calendar size={13} className="text-bioluminescent" />
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

            {/* Tab Bar */}
            <div className="px-6 py-2 bg-white/[0.01] border-b border-white/5 flex gap-4 shrink-0 font-mono text-xs">
              <button
                onClick={() => setActiveTab('today')}
                className={`px-3 py-2 border-b-2 font-medium transition-all ${
                  activeTab === 'today'
                    ? 'border-bioluminescent text-bioluminescent'
                    : 'border-transparent text-sea-foam/40 hover:text-sea-foam/70'
                }`}
              >
                [ Today ]
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`px-3 py-2 border-b-2 font-medium transition-all ${
                  activeTab === 'history'
                    ? 'border-bioluminescent text-bioluminescent'
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
                      <div className="frosted-glass-light rounded-xl p-4 flex items-center gap-3">
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
                      <div className="frosted-glass-light rounded-xl p-4 flex items-center gap-3">
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
                      <div className="frosted-glass-light rounded-xl p-4 flex items-center gap-3">
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
                ) : (
                  /* EMPTY STATE TODAY */
                  <div className="flex flex-col items-center justify-center text-center py-20 max-w-sm mx-auto">
                    <span className="text-4xl mb-4 opacity-50">🧭</span>
                    <h4 className="font-display text-lg text-white mb-2">No Digest Generated Yet</h4>
                    <p className="text-xs text-sea-foam/50 leading-relaxed font-sans">
                      Your AI agent hasn't created today's travel recommendation. Complete onboarding or trigger a manual feed in Settings to feed your fish.
                    </p>
                  </div>
                )
              ) : (
                /* HISTORY TAB */
                digests && digests.length > 1 ? (
                  <div className="max-w-3xl mx-auto space-y-3 pb-12">
                    {digests.slice(1).map((digest) => {
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
                                {digest.destination}, {digest.country}
                              </span>
                            </div>
                            <div className="flex items-center justify-between sm:justify-end gap-4">
                              <span className="font-mono text-xs text-bioluminescent">
                                {formatBudget(digest.estimated_budget_low, digest.estimated_budget_high)}
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
                    <h4 className="font-display text-lg text-white mb-2">No Travel History Yet</h4>
                    <p className="text-xs text-sea-foam/50 leading-relaxed font-sans">
                      Your travel history will appear here after your first few days. As daily suggestions accumulate, you can compare and track them here.
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
