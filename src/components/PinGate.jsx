import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Delete, Lock } from 'lucide-react';

export default function PinGate({ correctPin, onVerify }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const handleNumberClick = (num) => {
    if (pin.length < 4) {
      setError(false);
      const newPin = pin + num;
      setPin(newPin);
      
      // Auto verify when 4 digits are entered
      if (newPin === correctPin) {
        setTimeout(() => {
          onVerify();
        }, 150);
      } else if (newPin.length === 4) {
        setTimeout(() => {
          setError(true);
          setPin(''); // Reset
        }, 200);
      }
    }
  };

  const handleDelete = () => {
    setPin(pin.slice(0, -1));
    setError(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-abyss text-sea-foam p-4">
      {/* Ambient backgrounds */}
      <div className="absolute inset-0 bg-gradient-to-b from-deep-ocean via-abyss to-abyss opacity-80 pointer-events-none" />
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-bioluminescent opacity-5 blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-coral-warm opacity-5 blur-[120px]" />

      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-sm z-10 flex flex-col items-center"
      >
        {/* Wordmark */}
        <h1 className="font-display italic text-4xl text-sea-foam mb-2 text-center drop-shadow-md">
          The AIquarium
        </h1>
        <p className="font-mono text-[10px] uppercase tracking-widest text-sea-foam/50 mb-8 flex items-center gap-1.5">
          <Lock size={12} className="text-bioluminescent" />
          Dashboard Locked
        </p>

        {/* PIN Indicators */}
        <motion.div 
          animate={error ? { x: [-10, 10, -10, 10, 0] } : {}}
          transition={{ duration: 0.4 }}
          className="flex justify-center gap-6 mb-12"
        >
          {[0, 1, 2, 3].map((index) => (
            <div
              key={index}
              className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
                error 
                  ? 'border-coral-warm bg-coral-warm' 
                  : pin.length > index
                    ? 'border-bioluminescent bg-bioluminescent shadow-[0_0_10px_#00e5ff]'
                    : 'border-sea-foam/30 bg-transparent'
              }`}
            />
          ))}
        </motion.div>

        {/* Keypad Grid */}
        <div className="grid grid-cols-3 gap-4 w-full px-6">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              id={`pin-btn-${num}`}
              onClick={() => handleNumberClick(num.toString())}
              className="aspect-square flex items-center justify-center text-2xl font-mono border border-white/5 bg-white/[0.02] rounded-full active:bg-bioluminescent/20 hover:bg-white/[0.05] active:border-bioluminescent/40 transition-colors duration-150 focus:outline-none"
            >
              {num}
            </button>
          ))}
          <div className="flex items-center justify-center" /> {/* Empty spacing */}
          <button
            id="pin-btn-0"
            onClick={() => handleNumberClick('0')}
            className="aspect-square flex items-center justify-center text-2xl font-mono border border-white/5 bg-white/[0.02] rounded-full active:bg-bioluminescent/20 hover:bg-white/[0.05] active:border-bioluminescent/40 transition-colors duration-150 focus:outline-none"
          >
            0
          </button>
          <button
            onClick={handleDelete}
            className="aspect-square flex items-center justify-center text-xl border border-white/5 bg-white/[0.02] rounded-full text-sea-foam/60 hover:text-sea-foam active:bg-coral-warm/20 hover:bg-white/[0.05] active:border-coral-warm/40 transition-colors duration-150 focus:outline-none"
          >
            <Delete size={20} />
          </button>
        </div>
        
        {error && (
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-coral-warm text-xs mt-6 font-mono"
          >
            Incorrect PIN. Try again.
          </motion.p>
        )}
      </motion.div>
    </div>
  );
}
