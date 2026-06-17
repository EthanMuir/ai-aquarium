import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, Award } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

export default function OnboardingQuiz({ onComplete }) {
  const [step, setStep] = useState(1);
  const [animatingOut, setAnimatingOut] = useState(false);
  const [celebrate, setCelebrate] = useState(false);
  
  const [answers, setAnswers] = useState({
    home_city: '',
    budget_range: '',
    trip_duration: '',
    travel_style: [], // array for multi-select
    travel_party: '',
    passport_notes: '',
    blackout_months: [], // array for multi-select
    visited_places: '',
    dream_keywords: ''
  });

  const [loading, setLoading] = useState(false);

  const questions = [
    {
      id: 'home_city',
      title: 'Where are you flying from?',
      type: 'text',
      placeholder: 'e.g. Ottawa, Canada',
      validate: () => answers.home_city.trim().length > 0
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
      validate: () => answers.travel_style.length > 0
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
      validate: () => true // Optional
    },
    {
      id: 'blackout_months',
      title: 'Any months you can’t travel?',
      type: 'months',
      options: [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
      ],
      validate: () => true // Optional
    },
    {
      id: 'visited_places',
      title: "Places you've already been that we shouldn't repeat?",
      type: 'textarea',
      placeholder: 'e.g. Paris, Tokyo, New York (comma separated)',
      validate: () => true // Optional
    },
    {
      id: 'dream_keywords',
      title: 'Three words that describe your dream trip.',
      type: 'text',
      placeholder: 'e.g. warm, remote, ancient',
      validate: () => answers.dream_keywords.trim().length > 0
    }
  ];

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
      // Form context payload for Supabase upsert
      const contextRows = Object.entries(answers).map(([key, value]) => {
        let valString = '';
        if (Array.isArray(value)) {
          valString = value.join(', ');
        } else {
          valString = value || '';
        }

        return {
          fish_slug: 'trip-planner',
          context_key: key,
          context_value: valString
        };
      });

      // Write context to fish_context table
      const { error } = await supabase
        .from('fish_context')
        .upsert(contextRows, { onConflict: 'fish_slug,context_key' });

      if (error) {
        console.error('Error saving quiz to Supabase:', error);
        alert('Could not save your preferences. Please try again.');
        setLoading(false);
        return;
      }

      // Quiz completed successfully
      localStorage.setItem('aquarium_quiz_done', 'true');
      
      // Trigger celebration swim animation
      setCelebrate(true);
      
      // After celebration animation completes, close the modal
      setTimeout(() => {
        onComplete();
      }, 4000);
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  const isValid = currentQ.validate();

  return (
    <div className="fixed inset-0 z-40 bg-abyss text-sea-foam flex flex-col justify-between overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 bg-gradient-to-b from-deep-ocean via-abyss to-abyss opacity-95 pointer-events-none" />
      
      {/* Huge subtle fish silhouette watermark */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none opacity-[0.03] z-0">
        <svg width="400" height="400" viewBox="0 0 100 100" fill="currentColor">
          <path d="M10,50 C25,25 65,20 85,45 C90,40 92,35 95,32 C94,44 94,56 95,68 C92,65 90,60 85,55 C65,80 25,75 10,50 Z" />
        </svg>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-white/5 h-1 z-10">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progressPercent}%` }}
          className="h-full bg-bioluminescent shadow-[0_0_8px_#00e5ff]"
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
                {currentQ.type === 'text' && (
                  <input
                    type="text"
                    value={answers[currentQ.id]}
                    onChange={(e) => setAnswers({ ...answers, [currentQ.id]: e.target.value })}
                    placeholder={currentQ.placeholder}
                    className="w-full bg-white/[0.03] border border-white/10 rounded-lg px-4 py-3 text-lg focus:outline-none focus:border-bioluminescent focus:ring-1 focus:ring-bioluminescent transition-colors placeholder-sea-foam/30"
                    autoFocus
                  />
                )}

                {currentQ.type === 'textarea' && (
                  <textarea
                    value={answers[currentQ.id]}
                    onChange={(e) => setAnswers({ ...answers, [currentQ.id]: e.target.value })}
                    placeholder={currentQ.placeholder}
                    rows={4}
                    className="w-full bg-white/[0.03] border border-white/10 rounded-lg px-4 py-3 text-base focus:outline-none focus:border-bioluminescent focus:ring-1 focus:ring-bioluminescent transition-colors placeholder-sea-foam/30 resize-none"
                    autoFocus
                  />
                )}

                {currentQ.type === 'buttons' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {currentQ.options.map((option) => (
                      <button
                        key={option}
                        onClick={() => selectOption(option)}
                        className={`px-6 py-4 rounded-lg text-left text-base border transition-all duration-200 ${
                          answers[currentQ.id] === option
                            ? 'bg-bioluminescent/10 border-bioluminescent text-bioluminescent shadow-[0_0_15px_rgba(0,229,255,0.1)]'
                            : 'bg-white/[0.02] border-white/10 hover:bg-white/[0.05] hover:border-white/20'
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
                          className={`px-4 py-2.5 rounded-full text-sm font-medium border transition-all duration-200 ${
                            selected
                              ? 'bg-bioluminescent/15 border-bioluminescent text-bioluminescent shadow-[0_0_10px_rgba(0,229,255,0.15)]'
                              : 'bg-white/[0.02] border-white/10 hover:bg-white/[0.05] hover:border-white/20'
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
                          className={`py-3 rounded-lg text-sm font-semibold border transition-all duration-200 ${
                            selected
                              ? 'bg-bioluminescent/15 border-bioluminescent text-bioluminescent shadow-[0_0_10px_rgba(0,229,255,0.15)]'
                              : 'bg-white/[0.02] border-white/10 hover:bg-white/[0.05] hover:border-white/20'
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
                  <svg viewBox="0 0 120 100" width="100%" height="100%">
                    <defs>
                      <linearGradient id="celeb-fish-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#00bcd4" />
                        <stop offset="100%" stopColor="#1565c0" />
                      </linearGradient>
                      <linearGradient id="celeb-fin-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#ff8a65" />
                        <stop offset="100%" stopColor="#ff6b47" />
                      </linearGradient>
                    </defs>
                    
                    {/* Dorsal Fin */}
                    <path d="M35,32 C45,10 65,15 70,30 C55,25 42,28 35,32 Z" fill="url(#celeb-fin-grad)" opacity="0.9" />
                    {/* Tail Fin */}
                    <path d="M10,50 C2,30 5,20 15,28 C22,40 18,45 10,50 Z" fill="url(#celeb-fin-grad)" opacity="0.9" />
                    <path d="M10,50 C2,70 5,80 15,72 C22,60 18,55 10,50 Z" fill="url(#celeb-fin-grad)" opacity="0.9" />
                    {/* Ventral Fin */}
                    <path d="M40,68 C50,85 62,82 65,70 C53,72 45,71 40,68 Z" fill="url(#celeb-fin-grad)" opacity="0.8" />
                    
                    {/* Main Body */}
                    <path d="M15,50 C25,28 65,22 88,48 C100,50 108,48 112,47 C108,52 100,50 88,52 C65,78 25,72 15,50 Z" fill="url(#celeb-fish-grad)" />
                    
                    {/* Body Stripes */}
                    <path d="M48,32 C52,42 52,58 48,68 C51,58 51,42 48,32 Z" fill="#0d47a1" opacity="0.25" />
                    <path d="M62,30 C66,42 66,58 62,70 C65,58 65,42 62,30 Z" fill="#0d47a1" opacity="0.25" />
                    
                    {/* Eye */}
                    <circle cx="95" cy="45" r="4.5" fill="white" />
                    <circle cx="96.5" cy="44" r="2" fill="#020810" />
                  </svg>
                </motion.div>
              </div>

              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="flex flex-col items-center"
              >
                <div className="w-16 h-16 rounded-full bg-bioluminescent/10 flex items-center justify-center text-bioluminescent border border-bioluminescent/20 mb-6 shadow-[0_0_20px_rgba(0,229,255,0.15)]">
                  <Award size={32} />
                </div>
                <h2 className="font-display italic text-3xl text-white mb-3">
                  Your Fish is Ready!
                </h2>
                <p className="text-sea-foam/70 max-w-sm text-sm font-sans leading-relaxed">
                  The aquarium ecosystem has adapted to your profile. Your first travel digest will arrive tomorrow morning.
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
            onClick={handleNext}
            disabled={!isValid || loading}
            className={`flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
              isValid && !loading
                ? 'bg-coral-warm text-white shadow-[0_0_15px_rgba(255,107,71,0.25)] hover:shadow-[0_0_20px_rgba(255,107,71,0.4)] active:scale-95'
                : 'bg-white/5 border border-white/5 text-sea-foam/30 cursor-not-allowed'
            }`}
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : step === questions.length ? (
              'Finish Onboarding'
            ) : (
              <>
                Next
                <ChevronRight size={16} />
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
