import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, Award } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

export default function OnboardingQuiz({ onComplete, fishSlug = 'trip-planner' }) {
  const [step, setStep] = useState(1);
  const [celebrate, setCelebrate] = useState(false);
  const [geminiKey, setGeminiKey] = useState('');
  const [tavilyKey, setTavilyKey] = useState('');
  
  const isStock = fishSlug === 'stock-lookout';

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
      id: 'excluded_sectors',
      title: "Any specific sectors or companies to exclude?",
      type: 'text',
      placeholder: "e.g. Oil & Gas, Crypto (or leave blank)",
      validate: () => true
    },
    {
      id: 'tip_preference',
      title: "What kind of daily recommendations do you want?",
      type: 'buttons',
      options: ['Stocks trending right now', 'Undervalued hidden gems', 'Solid dividend payers', 'Conservative index ETFs'],
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

  const questions = isStock ? stockQuestions : tripQuestions;
  const currentQ = questions[step - 1];
  const progressPercent = (step / questions.length) * 100;

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

  const isValid = currentQ.type === 'api_keys' ? true : currentQ.validate();

  return (
    <div className="fixed inset-0 z-40 bg-abyss text-sea-foam flex flex-col justify-between overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 bg-gradient-to-b from-deep-ocean via-abyss to-abyss opacity-95 pointer-events-none" />
      
      {/* Huge subtle fish silhouette watermark */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none opacity-[0.03] z-0">
        <svg width="400" height="400" viewBox="0 0 100 100" fill="currentColor">
          {isStock ? (
            <ellipse cx="50" cy="50" rx="38" ry="28" />
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
          className={`h-full ${isStock ? 'bg-[#1e88e5] shadow-[0_0_8px_#1e88e5]' : 'bg-bioluminescent shadow-[0_0_8px_#00e5ff]'}`}
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
                      Enter your personal keys to run these AI agents on your own quota. You can leave these fields empty to use system default keys (subject to shared API limits).
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
                            isStock ? 'focus:border-[#1e88e5]/40 focus:bg-[#1e88e5]/5' : 'focus:border-bioluminescent/40 focus:bg-[#00e5ff]/5'
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
                            isStock ? 'focus:border-[#1e88e5]/40 focus:bg-[#1e88e5]/5' : 'focus:border-bioluminescent/40 focus:bg-[#00e5ff]/5'
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
                    className={`w-full frosted-glass-light rounded-xl px-4 py-3.5 text-lg text-white focus:outline-none transition-all ${isStock ? 'neon-border-stock focus:neon-border-stock-active' : 'neon-border-blue focus:neon-border-blue-active'} placeholder-sea-foam/25`}
                    autoFocus
                  />
                )}

                {currentQ.type === 'textarea' && (
                  <textarea
                    value={answers[currentQ.id]}
                    onChange={(e) => setAnswers({ ...answers, [currentQ.id]: e.target.value })}
                    placeholder={currentQ.placeholder}
                    rows={4}
                    className={`w-full frosted-glass-light rounded-xl px-4 py-3.5 text-base text-white focus:outline-none transition-all resize-none ${isStock ? 'neon-border-stock focus:neon-border-stock-active' : 'neon-border-blue focus:neon-border-blue-active'} placeholder-sea-foam/25`}
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
                    <svg viewBox="0 0 120 100" width="100%" height="100%">
                      <defs>
                        <linearGradient id="celeb-stock-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#1565c0" />
                          <stop offset="40%" stopColor="#1e88e5" />
                          <stop offset="100%" stopColor="#42a5f5" />
                        </linearGradient>
                        <linearGradient id="celeb-stock-fin-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#1565c0" />
                          <stop offset="100%" stopColor="#0d47a1" />
                        </linearGradient>
                        <linearGradient id="celeb-stock-tail-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#fdd835" />
                          <stop offset="100%" stopColor="#f9a825" />
                        </linearGradient>
                        <clipPath id="celeb-stock-clip">
                          <ellipse cx="60" cy="50" rx="35" ry="28" />
                        </clipPath>
                      </defs>
                      <path d="M38,25 C42,8 60,6 72,18 C72,22 65,24 38,25 Z" fill="url(#celeb-stock-fin-grad)" opacity="0.9" />
                      <path d="M40,75 C45,88 62,90 72,80 C65,78 50,77 40,75 Z" fill="url(#celeb-stock-fin-grad)" opacity="0.8" />
                      <path d="M72,52 C78,58 82,62 76,66 C72,62 70,56 72,52 Z" fill="#fdd835" opacity="0.7" />
                      <path d="M22,50 C14,35 10,24 20,30 C24,40 24,44 22,50 Z" fill="url(#celeb-stock-tail-grad)" opacity="0.9" />
                      <path d="M22,50 C14,65 10,76 20,70 C24,60 24,56 22,50 Z" fill="url(#celeb-stock-tail-grad)" opacity="0.9" />
                      <g clipPath="url(#celeb-stock-clip)">
                        <ellipse cx="60" cy="50" rx="35" ry="28" fill="url(#celeb-stock-grad)" />
                        <path d="M80,38 C72,36 55,38 42,45 C35,50 30,58 28,68 L32,72 C35,62 40,54 48,48 C58,42 72,40 82,42 Z" fill="#0a1628" opacity="0.85" />
                        <ellipse cx="62" cy="38" rx="18" ry="8" fill="#64b5f6" opacity="0.3" />
                      </g>
                      <ellipse cx="60" cy="50" rx="35" ry="28" fill="none" stroke="#0d47a1" strokeWidth="1.5" />
                      <path d="M26,46 L22,50 L26,54" stroke="#fdd835" strokeWidth="2" fill="none" strokeLinecap="round" />
                      <circle cx="80" cy="44" r="5" fill="white" />
                      <circle cx="81.5" cy="43.5" r="2.5" fill="#020810" />
                      <circle cx="80.5" cy="42.5" r="0.9" fill="white" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 120 100" width="100%" height="100%">
                      <defs>
                        <linearGradient id="celeb-fish-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#ff5722" />
                          <stop offset="60%" stopColor="#ff7043" />
                          <stop offset="100%" stopColor="#ffb74d" />
                        </linearGradient>
                        <linearGradient id="celeb-fin-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#ff7043" />
                          <stop offset="100%" stopColor="#d84315" />
                        </linearGradient>
                        <clipPath id="celeb-body-clip">
                          <path d="M15,50 C25,28 65,22 85,38 C92,42 102,45 102,50 C102,55 92,58 85,62 C65,78 25,72 15,50 Z" />
                        </clipPath>
                      </defs>
                      <path d="M35,32 C45,10 65,15 70,30 C55,25 42,28 35,32 Z" fill="url(#celeb-fin-grad)" opacity="0.9" />
                      <path d="M10,50 C2,30 5,20 15,28 C22,40 18,45 10,50 Z" fill="url(#celeb-fin-grad)" opacity="0.9" />
                      <path d="M10,50 C2,70 5,80 15,72 C22,60 18,55 10,50 Z" fill="url(#celeb-fin-grad)" opacity="0.9" />
                      <path d="M40,68 C50,85 62,82 65,70 C53,72 45,71 40,68 Z" fill="url(#celeb-fin-grad)" opacity="0.8" />
                      <g clipPath="url(#celeb-body-clip)">
                        <path d="M15,50 C25,28 65,22 85,38 C92,42 102,45 102,50 C102,55 92,58 85,62 C65,78 25,72 15,50 Z" fill="url(#celeb-fish-grad)" />
                        <path d="M 24,15 L 34,15 L 30,85 L 20,85 Z" fill="#212121" />
                        <path d="M 26,15 L 32,15 L 28,85 L 22,85 Z" fill="#ffffff" />
                        <path d="M 52,10 C 63.5,35 63.5,65 52,90 L 61,90 C 72.5,65 72.5,35 61,10 Z" fill="#ffffff" />
                        <path d="M 78,10 C 84.5,35 84.5,65 78,90 L 85,90 C 91.5,65 91.5,35 85,10 Z" fill="#ffffff" />
                      </g>
                      <circle cx="86" cy="44" r="4.5" fill="white" />
                      <circle cx="87.5" cy="43" r="2.5" fill="#020810" />
                      <circle cx="86.5" cy="42.5" r="0.8" fill="white" />
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
                <div className={`w-16 h-16 rounded-full ${isStock ? 'bg-[#1e88e5]/10 text-[#42a5f5] border-[#1e88e5]/20 shadow-[0_0_20px_rgba(30,136,229,0.15)]' : 'bg-bioluminescent/10 text-bioluminescent border-bioluminescent/20 shadow-[0_0_20px_rgba(0,229,255,0.15)]'} flex items-center justify-center mb-6`}>
                  <Award size={32} />
                </div>
                <h2 className="font-display italic text-3xl text-white mb-3">
                  Your Fish is Ready!
                </h2>
                <p className="text-sea-foam/70 max-w-sm text-sm font-sans leading-relaxed">
                  {isStock
                    ? "The stock market lookout has updated. Your first personalized market digest will arrive tomorrow morning."
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
