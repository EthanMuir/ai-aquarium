import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, Award, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

export default function OnboardingQuiz({ onComplete, fishSlug = 'trip-planner' }) {
  const [step, setStep] = useState(1);
  const [celebrate, setCelebrate] = useState(false);
  const [geminiKey, setGeminiKey] = useState('');
  const [tavilyKey, setTavilyKey] = useState('');
  const [keysLoaded, setKeysLoaded] = useState(false);
  
  const isStock = fishSlug === 'stock-lookout';
  const isNews = fishSlug === 'news-briefing';

  const [answers, setAnswers] = useState(() => {
    if (isStock) {
      return {
        experience_level: 'Some experience',
        investing_goal: 'Steady long-term growth',
        risk_reaction: 'Hold and wait it out',
        stock_interests: ['Tech & AI', 'Growth Stocks'],
        time_horizon: 'Long-term (3–10 years)',
        position_size: '$500–$2,000',
        markets: 'NYSE, NASDAQ (US)',
        excluded_sectors: '',
        tip_preference: 'Stocks trending right now',
        current_holdings: ''
      };
    } else if (isNews) {
      return {
        news_interests: ['Geopolitics & World Affairs', 'Tech & AI'],
        geo_focus: 'Global / International',
        news_tone: 'Objective & concise briefing',
        excluded_topics: ''
      };
    } else {
      return {
        home_city: 'Ottawa, Canada',
        budget_range: '$1,500–$3,000',
        trip_duration: 'Week (7–10 days)',
        travel_style: ['Adventure', 'Culture & History'],
        travel_party: 'Solo',
        passport_notes: 'Canadian passport',
        blackout_months: [],
        visited_places: '',
        dream_keywords: 'warm, remote, ancient'
      };
    }
  });

  const [loading, setLoading] = useState(false);

  // Load existing API keys from DB on mount
  useEffect(() => {
    async function loadApiKeys() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data } = await supabase
            .from('user_api_keys')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle();
          if (data) {
            setGeminiKey(data.gemini_api_key || '');
            setTavilyKey(data.tavily_api_key || '');
          }
        }
      } catch (err) {
        console.error("Failed to load API keys:", err);
      } finally {
        setKeysLoaded(true);
      }
    }
    loadApiKeys();
  }, []);

  const tripQuestions = [
    {
      id: 'api_keys',
      title: 'Configure Your API Keys',
      type: 'api_keys',
      validate: () => true
    },
    {
      id: 'home_city',
      title: 'Where are you flying from?',
      type: 'text',
      placeholder: 'e.g. Ottawa, Canada',
      validate: () => answers.home_city?.trim().length > 0
    },
    {
      id: 'budget_range',
      title: "What's your trip budget? (per person, CAD)",
      type: 'buttons',
      options: ['Under $1,500', '$1,500–$3,000', '$3,000–$6,000', '$6,000+'],
      validate: () => answers.budget_range !== ''
    },
    {
      id: 'trip_duration',
      title: 'How long do your trips usually run?',
      type: 'buttons',
      options: ['Weekend (2–3 days)', 'Short (4–6 days)', 'Week (7–10 days)', 'Extended (2+ weeks)'],
      validate: () => answers.trip_duration !== ''
    },
    {
      id: 'travel_style',
      title: 'What kind of traveller are you?',
      type: 'chips',
      options: [
        'Adventure',
        'Culture & History',
        'Beach & Relaxation',
        'Food & Drink',
        'Off the Beaten Path',
        'City Exploration',
        'Nature & Wildlife'
      ],
      validate: () => answers.travel_style?.length > 0
    },
    {
      id: 'travel_party',
      title: 'Who do you travel with?',
      type: 'buttons',
      options: ['Solo', 'Partner', 'Friends', 'Family'],
      validate: () => answers.travel_party !== ''
    },
    {
      id: 'passport_notes',
      title: 'Passport or visa restrictions?',
      type: 'text',
      placeholder: 'e.g. Canadian passport, no US visa needed',
      validate: () => true
    },
    {
      id: 'blackout_months',
      title: 'Any months you can’t travel?',
      type: 'months',
      options: [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
      ],
      validate: () => true
    },
    {
      id: 'visited_places',
      title: "Places you've already been that we shouldn't repeat?",
      type: 'textarea',
      placeholder: 'e.g. Paris, Tokyo, New York (comma separated)',
      validate: () => true
    },
    {
      id: 'dream_keywords',
      title: 'Three words that describe your dream trip.',
      type: 'text',
      placeholder: 'e.g. warm, remote, ancient',
      validate: () => answers.dream_keywords?.trim().length > 0
    }
  ];

  const stockQuestions = [
    {
      id: 'api_keys',
      title: 'Configure Your API Keys',
      type: 'api_keys',
      validate: () => true
    },
    {
      id: 'experience_level',
      title: "What's your stock investing experience?",
      type: 'buttons',
      options: ['Complete beginner', 'Some experience', 'Experienced trader', 'Institutional / Advanced'],
      validate: () => answers.experience_level !== ''
    },
    {
      id: 'investing_goal',
      title: "What is your primary investing goal?",
      type: 'buttons',
      options: ['Steady long-term growth', 'Passive dividend income', 'High-risk speculation', 'Capital preservation'],
      validate: () => answers.investing_goal !== ''
    },
    {
      id: 'risk_reaction',
      title: "How do you react to a 20% stock market drop?",
      type: 'buttons',
      options: ['Panic and sell everything', 'Hold and wait it out', 'Buy more at a discount', 'Do nothing/Unsure'],
      validate: () => answers.risk_reaction !== ''
    },
    {
      id: 'stock_interests',
      title: "Which sectors or themes interest you most?",
      type: 'chips',
      options: ['Tech & AI', 'Growth Stocks', 'ETFs & Index Funds', 'Energy & Utilities', 'Healthcare & Biotech', 'Finance & Real Estate', 'Value Stocks'],
      validate: () => answers.stock_interests?.length > 0
    },
    {
      id: 'time_horizon',
      title: "What is your target investment time horizon?",
      type: 'buttons',
      options: ['Short-term (< 1 year)', 'Medium-term (1–3 years)', 'Long-term (3–10 years)', 'Retirement / 10+ years'],
      validate: () => answers.time_horizon !== ''
    },
    {
      id: 'position_size',
      title: "What is your typical investment size per position?",
      type: 'buttons',
      options: ['Under $500', '$500–$2,000', '$2,000–$5,000', '$5,000+'],
      validate: () => answers.position_size !== ''
    },
    {
      id: 'markets',
      title: "Which stock markets do you prefer trading in?",
      type: 'buttons',
      options: ['NYSE, NASDAQ (US)', 'TSX (Canada)', 'LSE (UK) / European', 'Global Markets'],
      validate: () => answers.markets !== ''
    },
    {
      id: 'excluded_topics',
      title: "Any specific sectors or companies to exclude?",
      type: 'text',
      placeholder: "e.g. Oil & Gas, Crypto (or leave blank)",
      validate: () => true
    },
    {
      id: 'tip_preference',
      title: "What kind of daily recommendations do you want?",
      type: 'buttons',
      options: ['Stocks trending right now', 'Undervalued hidden gems', 'Solid daily dividend payers', 'Conservative index ETFs'],
      validate: () => answers.tip_preference !== ''
    },
    {
      id: 'current_holdings',
      title: "What are your primary current holdings?",
      type: 'text',
      placeholder: "e.g. AAPL, VOO, TSLA (comma separated, or leave blank)",
      validate: () => true
    }
  ];

  const newsQuestions = [
    {
      id: 'api_keys',
      title: 'Configure Your API Keys',
      type: 'api_keys',
      validate: () => true
    },
    {
      id: 'news_interests',
      title: 'Which topics interest you most?',
      type: 'chips',
      options: [
        'Geopolitics & World Affairs',
        'Science & Space',
        'Tech & AI',
        'Business & Finance',
        'Environment & Climate',
        'Medicine & Health',
        'Culture & Society'
      ],
      validate: () => answers.news_interests?.length > 0
    },
    {
      id: 'geo_focus',
      title: 'What geographical focus do you prefer?',
      type: 'buttons',
      options: [
        'Global / International',
        'North America',
        'Europe & UK',
        'Asia-Pacific',
        'Middle East & Africa'
      ],
      validate: () => answers.geo_focus !== ''
    },
    {
      id: 'news_tone',
      title: 'How should your anchor fish deliver the news?',
      type: 'buttons',
      options: [
        'Objective & concise briefing',
        'Deep-dive narrative overview',
        'Optimistic & solutions-focused',
        'Analytical & critical breakdown'
      ],
      validate: () => answers.news_tone !== ''
    },
    {
      id: 'excluded_topics',
      title: 'Any topics you want to filter out?',
      type: 'text',
      placeholder: 'e.g. sports, celebrity gossip, crime (or leave blank)',
      validate: () => true
    }
  ];

  const questions = React.useMemo(() => {
    const base = isStock ? stockQuestions : isNews ? newsQuestions : tripQuestions;
    if (keysLoaded && geminiKey && tavilyKey) {
      return base.filter(q => q.id !== 'api_keys');
    }
    return base;
  }, [isStock, isNews, keysLoaded, geminiKey, tavilyKey]);
  const currentQ = questions[step - 1];
  const progressPercent = questions.length > 0 ? (step / questions.length) * 100 : 0;

  const handleNext = () => {
    if (step < questions.length) {
      setStep(step + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const selectOption = (val) => {
    setAnswers({ ...answers, [currentQ.id]: val });
  };

  const toggleChip = (val) => {
    const currentList = answers[currentQ.id] || [];
    let updated;
    if (currentList.includes(val)) {
      updated = currentList.filter(item => item !== val);
    } else {
      updated = [...currentList, val];
    }
    setAnswers({ ...answers, [currentQ.id]: updated });
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('You must be logged in.');
        setLoading(false);
        return;
      }

      // 1. Save user API keys
      const { error: keysError } = await supabase
        .from('user_api_keys')
        .upsert({
          user_id: user.id,
          gemini_api_key: geminiKey,
          tavily_api_key: tavilyKey,
          updated_at: new Date().toISOString()
        });

      if (keysError) {
        console.error('Error saving API keys to Supabase:', keysError);
        alert('Could not save your API keys. Please try again.');
        setLoading(false);
        return;
      }

      // 2. Save quiz preferences to context rows
      const contextRows = Object.entries(answers)
        .filter(([key]) => key !== 'api_keys')
        .map(([key, value]) => {
          let valString = '';
          if (Array.isArray(value)) {
            valString = value.join(', ');
          } else {
            valString = value || '';
          }

          return {
            user_id: user.id,
            fish_slug: fishSlug,
            context_key: key,
            context_value: valString
          };
        });

      const { error } = await supabase
        .from('fish_context')
        .upsert(contextRows, { onConflict: 'user_id,fish_slug,context_key' });

      if (error) {
        console.error('Error saving quiz to Supabase:', error);
        alert('Could not save your preferences. Please try again.');
        setLoading(false);
        return;
      }

      // Trigger celebration swim animation
      setCelebrate(true);
      
      setTimeout(() => {
        onComplete();
      }, 4000);
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  const isValid = currentQ && currentQ.type === 'api_keys' 
    ? (geminiKey.trim().length > 0 && tavilyKey.trim().length > 0)
    : currentQ ? currentQ.validate() : false;

  if (!keysLoaded) {
    return (
      <div className="fixed inset-0 z-40 bg-abyss text-sea-foam flex flex-col items-center justify-center">
        <Loader2 size={32} className="text-[#00e5ff] animate-spin" />
        <span className="text-xs font-mono text-sea-foam/40 mt-3">Loading keys...</span>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-40 bg-abyss text-sea-foam flex flex-col justify-between overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 bg-gradient-to-b from-deep-ocean via-abyss to-abyss opacity-95 pointer-events-none" />
      
      {/* Huge subtle fish silhouette watermark */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none opacity-[0.03] z-0">
        <svg width="400" height="400" viewBox="0 0 100 100" fill="currentColor">
          {isStock ? (
            <ellipse cx="50" cy="50" rx="38" ry="28" />
          ) : isNews ? (
            <path d="M50,15 C20,35 20,85 50,75 C80,85 80,35 50,15 Z M50,75 C40,90 60,90 50,75 Z" />
          ) : (
            <path d="M10,50 C25,25 65,20 85,45 C90,40 92,35 95,32 C94,44 94,56 95,68 C92,65 90,60 85,55 C65,80 25,75 10,50 Z" />
          )}
        </svg>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-white/5 h-1 z-10">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progressPercent}%` }}
          className={`h-full ${isStock ? 'bg-[#1e88e5] shadow-[0_0_8px_#1e88e5]' : isNews ? 'bg-[#00e673] shadow-[0_0_8px_#00e673]' : 'bg-bioluminescent shadow-[0_0_8px_#00e5ff]'}`}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col justify-center px-6 md:px-12 max-w-2xl mx-auto w-full z-10">
        <AnimatePresence mode="wait">
          {!celebrate ? (
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col gap-6"
            >
              {/* Question Index */}
              <span className="font-mono text-xs uppercase tracking-widest text-sea-foam/40">
                Question {step} of {questions.length}
              </span>

              {/* Question text */}
              <h2 className="font-display italic text-3xl md:text-4xl text-white font-semibold leading-tight">
                {currentQ.title}
              </h2>

              {/* Render Inputs based on question type */}
              <div className="mt-4">
                {currentQ.type === 'api_keys' && (
                  <div className="space-y-4">
                    <p className="text-xs text-sea-foam/60 leading-relaxed font-sans">
                      Enter your personal keys to run these AI agents on your own quota. Both keys are required to complete onboarding and activate your fish.
                    </p>
                    <div className="space-y-4">
                      <div>
                        <label className="text-[10px] uppercase font-mono tracking-wider text-sea-foam/50 block mb-1.5 font-semibold">
                          Google Gemini API Key
                        </label>
                        <input
                          type="password"
                          value={geminiKey}
                          onChange={(e) => setGeminiKey(e.target.value)}
                          placeholder="e.g. AIzaSy..."
                          className={`w-full bg-white/[0.02] border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none transition-all ${
                            isStock ? 'focus:border-[#1e88e5]/40 focus:bg-[#1e88e5]/5' : isNews ? 'focus:border-[#00e673]/40 focus:bg-[#00e673]/5' : 'focus:border-bioluminescent/40 focus:bg-[#00e5ff]/5'
                          } placeholder-sea-foam/20`}
                        />
                        <a 
                          href="https://aistudio.google.com" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-[10px] text-bioluminescent hover:underline font-mono mt-1 inline-block"
                        >
                          Get a free Gemini API key →
                        </a>
                      </div>
                      <div>
                        <label className="text-[10px] uppercase font-mono tracking-wider text-sea-foam/50 block mb-1.5 font-semibold">
                          Tavily Search API Key
                        </label>
                        <input
                          type="password"
                          value={tavilyKey}
                          onChange={(e) => setTavilyKey(e.target.value)}
                          placeholder="e.g. tvly-..."
                          className={`w-full bg-white/[0.02] border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none transition-all ${
                            isStock ? 'focus:border-[#1e88e5]/40 focus:bg-[#1e88e5]/5' : isNews ? 'focus:border-[#00e673]/40 focus:bg-[#00e673]/5' : 'focus:border-bioluminescent/40 focus:bg-[#00e5ff]/5'
                          } placeholder-sea-foam/20`}
                        />
                        <a 
                          href="https://tavily.com" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-[10px] text-coral-warm hover:underline font-mono mt-1 inline-block"
                        >
                          Get a free Tavily API key →
                        </a>
                      </div>
                    </div>
                  </div>
                )}

                {currentQ.type === 'text' && (
                  <input
                    type="text"
                    value={answers[currentQ.id]}
                    onChange={(e) => setAnswers({ ...answers, [currentQ.id]: e.target.value })}
                    placeholder={currentQ.placeholder}
                    className={`w-full frosted-glass-light rounded-xl px-4 py-3.5 text-lg text-white focus:outline-none transition-all ${isStock ? 'neon-border-stock focus:neon-border-stock-active' : isNews ? 'border-[#00e673]/30 focus:border-[#00e673] focus:shadow-[0_0_15px_rgba(0,230,115,0.15)]' : 'neon-border-blue focus:neon-border-blue-active'} placeholder-sea-foam/25`}
                    autoFocus
                  />
                )}

                {currentQ.type === 'textarea' && (
                  <textarea
                    value={answers[currentQ.id]}
                    onChange={(e) => setAnswers({ ...answers, [currentQ.id]: e.target.value })}
                    placeholder={currentQ.placeholder}
                    rows={4}
                    className={`w-full frosted-glass-light rounded-xl px-4 py-3.5 text-base text-white focus:outline-none transition-all resize-none ${isStock ? 'neon-border-stock focus:neon-border-stock-active' : isNews ? 'border-[#00e673]/30 focus:border-[#00e673] focus:shadow-[0_0_15px_rgba(0,230,115,0.15)]' : 'neon-border-blue focus:neon-border-blue-active'} placeholder-sea-foam/25`}
                    autoFocus
                  />
                )}

                {currentQ.type === 'buttons' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {currentQ.options.map((option) => (
                      <button
                        key={option}
                        onClick={() => selectOption(option)}
                        className={`px-6 py-4 rounded-xl text-left text-base transition-all duration-300 transform hover:-translate-y-0.5 ${
                          answers[currentQ.id] === option
                            ? isStock
                              ? 'frosted-glass-light neon-border-stock-active text-white shadow-[0_0_15px_rgba(30,136,229,0.15)]'
                              : isNews
                                ? 'frosted-glass-light border-[#00e673] text-white shadow-[0_0_15px_rgba(0,230,115,0.15)]'
                                : 'frosted-glass-light neon-border-blue-active text-white shadow-[0_0_15px_rgba(0,229,255,0.15)]'
                            : 'frosted-glass-light text-sea-foam/70 hover:text-white border border-white/5 hover:border-white/20'
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                )}

                {currentQ.type === 'chips' && (
                  <div className="flex flex-wrap gap-3">
                    {currentQ.options.map((option) => {
                      const selected = answers[currentQ.id]?.includes(option);
                      return (
                        <button
                          key={option}
                          onClick={() => toggleChip(option)}
                          className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                            selected
                              ? isStock
                                ? 'frosted-glass-light neon-border-stock-active text-white shadow-[0_0_10px_rgba(30,136,229,0.15)]'
                                : isNews
                                  ? 'frosted-glass-light border-[#00e673] text-white shadow-[0_0_10px_rgba(0,230,115,0.15)]'
                                  : 'frosted-glass-light neon-border-blue-active text-white shadow-[0_0_10px_rgba(0,229,255,0.15)]'
                              : 'frosted-glass-light text-sea-foam/70 hover:text-white border border-white/5 hover:border-white/20'
                          }`}
                        >
                          {option}
                        </button>
                      );
                    })}
                  </div>
                )}

                {currentQ.type === 'months' && (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                    {currentQ.options.map((month) => {
                      const selected = answers[currentQ.id]?.includes(month);
                      return (
                        <button
                          key={month}
                          onClick={() => toggleChip(month)}
                          className={`py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${
                            selected
                              ? isStock
                                ? 'frosted-glass-light neon-border-stock-active text-white shadow-[0_0_10px_rgba(30,136,229,0.15)]'
                                : isNews
                                  ? 'frosted-glass-light border-[#00e673] text-white shadow-[0_0_10px_rgba(0,230,115,0.15)]'
                                  : 'frosted-glass-light neon-border-blue-active text-white shadow-[0_0_10px_rgba(0,229,255,0.15)]'
                              : 'frosted-glass-light text-sea-foam/70 hover:text-white border border-white/5 hover:border-white/20'
                          }`}
                        >
                          {month}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            /* Celebration Screen */
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center text-center py-12"
            >
              {/* Swimming celebration fish */}
              <div className="absolute inset-x-0 top-[20%] pointer-events-none h-[200px] overflow-hidden">
                <motion.div
                  initial={{ x: '-150px', y: '0px' }}
                  animate={{ 
                    x: ['-150px', '25vw', '50vw', '75vw', '110vw'],
                    y: ['0px', '-40px', '20px', '-20px', '0px']
                  }}
                  transition={{ 
                    duration: 3.5, 
                    ease: 'easeInOut' 
                  }}
                  className="w-[120px] h-[100px] absolute"
                >
                  {isStock ? (
                    <svg viewBox="0 0 140 100" width="100%" height="100%">
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
                      <g>
                        <path d="M 42,22 C 55,2 88,4 112,18 C 114,19 110,24 104,22 C 86,18 64,18 42,22 Z" fill="url(#tang-body-grad)" stroke="#001a66" strokeWidth="1.2" />
                        <path d="M 44,20 C 56,4 88,6 110,19" fill="none" stroke="#00e5ff" strokeWidth="1.8" strokeLinecap="round" opacity="0.85" />
                        <path d="M 42,22 C 55,2 88,4 112,18" fill="none" stroke="#05070d" strokeWidth="2.5" />
                      </g>
                      <g>
                        <path d="M 44,78 C 56,98 88,96 112,82 C 114,81 110,76 104,78 C 86,82 64,82 44,78 Z" fill="url(#tang-body-grad)" stroke="#001a66" strokeWidth="1.2" />
                        <path d="M 46,80 C 57,96 88,94 110,81" fill="none" stroke="#00e5ff" strokeWidth="1.8" strokeLinecap="round" opacity="0.85" />
                        <path d="M 44,78 C 56,98 88,96 112,82" fill="none" stroke="#05070d" strokeWidth="2.5" />
                      </g>
                      <g>
                        <path d="M 112,50 L 136,22 C 144,35 144,65 136,78 Z" fill="url(#tang-yellow-grad)" stroke="#cc8800" strokeWidth="1.2" />
                        <path d="M 136,22 C 144,35 144,65 136,78" fill="none" stroke="#05070d" strokeWidth="3" strokeLinecap="round" />
                        <path d="M 112,50 L 136,22 M 112,50 L 136,78" fill="none" stroke="#05070d" strokeWidth="3" />
                      </g>
                      <g clipPath="url(#tang-body-clip)">
                        <path d="M 10,10 H 130 V 90 H 10 Z" fill="url(#tang-body-grad)" />
                        <path d="M 118,46 C 104,40 92,42 78,48 C 66,54 52,55 36,46 C 30,42 26,44 24,54 C 22,66 26,76 34,76 C 46,76 56,66 66,58 C 76,50 90,48 106,53 C 112,55 116,52 118,46 Z" fill="url(#tang-black-grad)" />
                        <path d="M 52,24 C 64,18 84,20 98,28 C 108,34 106,42 98,40 C 84,36 68,36 56,42 C 48,46 44,38 52,24 Z" fill="url(#tang-black-grad)" />
                        <path d="M 22,50 C 26,22 56,15 88,20 C 104,23 112,32 118,44 C 122,48 122,52 118,56 C 112,68 104,77 88,80 C 56,85 26,78 22,50 Z" fill="url(#tang-gloss)" />
                      </g>
                      <path d="M 22,50 C 26,22 56,15 88,20 C 104,23 112,32 118,44 C 122,48 122,52 118,56 C 112,68 104,77 88,80 C 56,85 26,78 22,50 Z" fill="none" stroke="#001a66" strokeWidth="1.5" />
                      <circle cx="38" cy="40" r="6.2" fill="#ffe600" stroke="#05070d" strokeWidth="0.8" />
                      <circle cx="38" cy="40" r="4.5" fill="#111" />
                    </svg>
                  ) : isNews ? (
                    <svg viewBox="0 0 140 150" width="100%" height="100%">
                      <defs>
                        <linearGradient id="news-body-grad" x1="0%" y1="0%" x2="100%" y2="80%">
                          <stop offset="0%" stopColor="#00e673" />
                          <stop offset="50%" stopColor="#00b359" />
                          <stop offset="100%" stopColor="#004d26" />
                        </linearGradient>
                        <linearGradient id="news-yellow-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#ccff33" />
                          <stop offset="100%" stopColor="#99ff00" />
                        </linearGradient>
                        <linearGradient id="news-stripe-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#0a120d" />
                          <stop offset="100%" stopColor="#020503" />
                        </linearGradient>
                        <linearGradient id="news-gloss" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.35" />
                          <stop offset="50%" stopColor="#ffffff" stopOpacity="0.0" />
                          <stop offset="100%" stopColor="#000000" stopOpacity="0.45" />
                        </linearGradient>
                        <clipPath id="news-body-clip">
                          <path d="M 30,60 C 30,35 55,20 80,32 C 92,38 102,48 106,60 C 102,72 92,82 80,88 C 55,100 30,85 30,60 Z" />
                        </clipPath>
                      </defs>
                      <g>
                        <path d="M 65,33 Q 40,-15 25,-22 Q 55,10 85,34 Z" fill="url(#news-yellow-grad)" stroke="#003311" strokeWidth="1.2" />
                        <path d="M 65,33 Q 40,-15 25,-22" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
                      </g>
                      <g>
                        <path d="M 65,87 Q 40,135 25,142 Q 55,110 85,86 Z" fill="url(#news-yellow-grad)" stroke="#003311" strokeWidth="1.2" />
                        <path d="M 65,87 Q 40,135 25,142" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
                      </g>
                      <g>
                        <path d="M 52,82 Q 38,125 24,146" fill="none" stroke="#ccff33" strokeWidth="2.2" strokeLinecap="round" />
                      </g>
                      <g>
                        <path d="M 106,60 L 126,38 C 132,45 132,75 126,82 Z" fill="url(#news-yellow-grad)" stroke="#003311" strokeWidth="1.2" />
                        <path d="M 126,38 C 132,45 132,75 126,82" fill="none" stroke="#111" strokeWidth="2.5" strokeLinecap="round" />
                      </g>
                      <g clipPath="url(#news-body-clip)">
                        <path d="M 10,10 H 130 V 110 H 10 Z" fill="url(#news-body-grad)" />
                        <path d="M 46,10 C 56,30 56,90 46,110 H 60 C 70,90 70,30 60,10 Z" fill="url(#news-stripe-grad)" />
                        <path d="M 82,10 C 92,30 92,90 82,110 H 94 C 104,90 104,30 94,10 Z" fill="url(#news-stripe-grad)" />
                        <path d="M 30,60 C 30,35 55,20 80,32 C 92,38 102,48 106,60 C 102,72 92,82 80,88 C 55,100 30,85 30,60 Z" fill="url(#news-gloss)" />
                      </g>
                      <path d="M 30,60 C 30,35 55,20 80,32 C 92,38 102,48 106,60 C 102,72 92,82 80,88 C 55,100 30,85 30,60 Z" fill="none" stroke="#003311" strokeWidth="1.5" />
                      <circle cx="42" cy="48" r="5.5" fill="#ccff33" stroke="#111" strokeWidth="0.8" />
                      <circle cx="42" cy="48" r="3.5" fill="#000" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 140 100" width="100%" height="100%">
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
                      <g>
                        <path d="M 40,28 C 45,6 68,2 90,14 C 95,16 92,23 88,28 C 76,24 58,26 40,28 Z" fill="url(#clown-fin-grad)" stroke="#1a0d00" strokeWidth="1.5" />
                        <path d="M 40,28 C 45,6 68,2 90,14" fill="none" stroke="#111" strokeWidth="4" strokeLinecap="round" />
                      </g>
                      <g>
                        <path d="M 46,68 C 48,88 64,92 72,74 C 70,72 58,70 46,68 Z" fill="url(#clown-fin-grad)" stroke="#1a0d00" strokeWidth="1.5" />
                        <path d="M 46,68 C 48,88 64,92 72,74" fill="none" stroke="#111" strokeWidth="4" strokeLinecap="round" />
                        <path d="M 88,68 C 96,82 106,78 108,60 C 102,60 94,64 88,68 Z" fill="url(#clown-fin-grad)" stroke="#1a0d00" strokeWidth="1.5" />
                        <path d="M 88,68 C 96,82 106,78 108,60" fill="none" stroke="#111" strokeWidth="4.2" strokeLinecap="round" />
                      </g>
                      <g>
                        <path d="M 122,50 C 138,24 146,26 138,12 C 128,14 122,34 116,42 M 122,50 C 138,76 146,74 138,88 C 128,86 122,66 116,58" fill="url(#clown-fin-grad)" stroke="#1a0d00" strokeWidth="1.5" />
                        <path d="M 138,12 C 148,22 148,78 138,88" fill="none" stroke="#111" strokeWidth="5.5" strokeLinecap="round" />
                      </g>
                      <g clipPath="url(#clown-body-clip)">
                        <path d="M 10,10 H 130 V 90 H 10 Z" fill="url(#clown-body-grad)" />
                        <path d="M 44,10 C 58,25 58,75 44,90 L 58,90 C 72,75 72,25 58,10 Z" fill="#ffffff" />
                        <path d="M 44,10 C 46,25 46,75 44,90 M 58,10 C 56,25 56,75 58,90" fill="none" stroke="#1a0d00" strokeWidth="1.8" />
                        <path d="M 80,10 C 90,25 90,75 80,90 L 90,90 C 100,75 100,25 90,10 Z" fill="#ffffff" />
                        <path d="M 80,10 C 82,25 82,75 80,90 M 90,10 C 88,25 88,75 90,90" fill="none" stroke="#1a0d00" strokeWidth="1.8" />
                        <path d="M 112,30 C 117,38 117,62 112,70 L 118,70 C 123,62 123,38 118,30 Z" fill="#ffffff" />
                        <path d="M 18,50 C 24,30 52,22 84,28 C 96,31 106,38 116,42 C 124,45 128,48 128,50 C 128,52 124,55 116,58 C 106,62 96,69 84,72 C 52,78 24,70 18,50 Z" fill="url(#clown-gloss)" />
                      </g>
                      <path d="M 18,50 C 24,30 52,22 84,28 C 96,31 106,38 116,42 C 124,45 128,48 128,50 C 128,52 124,55 116,58 C 106,62 96,69 84,72 C 52,78 24,70 18,50 Z" fill="none" stroke="#1a0d00" strokeWidth="1.8" />
                      <circle cx="34" cy="42" r="5.5" fill="#ffd700" stroke="#1a0d00" strokeWidth="0.8" />
                      <circle cx="34" cy="42" r="3.5" fill="#111" />
                    </svg>
                  )}
                </motion.div>
              </div>

              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="flex flex-col items-center"
              >
                 <div className={`w-16 h-16 rounded-full ${
                   isStock 
                     ? 'bg-[#1e88e5]/10 text-[#42a5f5] border-[#1e88e5]/20 shadow-[0_0_20px_rgba(30,136,229,0.15)]' 
                     : isNews
                       ? 'bg-[#00e673]/10 text-[#00e673] border-[#00e673]/20 shadow-[0_0_20px_rgba(0,230,115,0.15)]'
                       : 'bg-bioluminescent/10 text-bioluminescent border-bioluminescent/20 shadow-[0_0_20px_rgba(0,229,255,0.15)]'
                 } flex items-center justify-center mb-6`}>
                   <Award size={32} />
                 </div>
                 <h2 className="font-display italic text-3xl text-white mb-3">
                   Your Fish is Ready!
                 </h2>
                 <p className="text-sea-foam/70 max-w-sm text-sm font-sans leading-relaxed">
                   {isStock
                     ? "The stock market lookout has updated. Your first personalized market digest will arrive tomorrow morning."
                     : isNews
                       ? "The World News briefing has adapted to your profile. Your first personalized news briefing will arrive tomorrow morning."
                       : "The AIquarium ecosystem has adapted to your profile. Your first travel digest will arrive tomorrow morning."}
                 </p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation Footer */}
      {!celebrate && (
        <div className="border-t border-white/5 bg-white/[0.01] px-6 py-4 flex items-center justify-between z-10">
          {step > 1 ? (
            <button
              onClick={handleBack}
              disabled={loading}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm text-sea-foam/60 hover:text-white hover:bg-white/5 active:bg-white/10 transition-colors"
            >
              <ChevronLeft size={16} />
              Back
            </button>
          ) : (
            <div />
          )}

          <button
            id="quiz-next-btn"
            onClick={handleNext}
            disabled={!isValid || loading}
            className={`flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
              isValid && !loading
                ? isStock
                  ? 'bg-[#1e88e5] text-white shadow-[0_0_15px_rgba(30,136,229,0.25)] hover:shadow-[0_0_20px_rgba(30,136,229,0.4)] active:scale-95'
                  : isNews
                    ? 'bg-[#00e673] text-black shadow-[0_0_15px_rgba(0,230,115,0.25)] hover:shadow-[0_0_20px_rgba(0,230,115,0.4)] active:scale-95'
                    : 'bg-coral-warm text-white shadow-[0_0_15px_rgba(255,107,71,0.25)] hover:shadow-[0_0_20px_rgba(255,107,71,0.4)] active:scale-95'
                : 'bg-white/5 border border-white/5 text-sea-foam/30 cursor-not-allowed'
            }`}
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : step === questions.length ? (
              'Finish Onboarding'
            ) : (
              <div className="flex items-center gap-1">
                Next
                <ChevronRight size={16} />
              </div>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
