import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { checkReducedMotion } from '../config';
import { SPRING } from '../motionVariants';

export default function KillSwitchControl({ isFrozen, onOpenModal }) {
  const [isArmed, setIsArmed] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  const shouldReduceMotion = checkReducedMotion();

  useEffect(() => {
    let interval;
    if (isArmed && !isFrozen) {
      interval = setInterval(() => {
        setHoldProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            onOpenModal('freeze');
            setIsArmed(false);
            return 0;
          }
          return prev + 10;
        });
      }, 50);
    } else {
      setHoldProgress(0);
    }
    return () => clearInterval(interval);
  }, [isArmed, isFrozen, onOpenModal]);

  const handleToggleArm = () => {
    if (isFrozen) return;
    setIsArmed(!isArmed);
  };

  return (
    <motion.div 
      initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={`glass-panel rounded-xl p-6 flex flex-col items-center justify-between min-h-[360px] text-center relative overflow-hidden transition-all duration-300 bg-white border shadow-sm ${
        isFrozen ? 'border-red-400 bg-red-50/30' : isArmed ? 'border-red-300 bg-red-50/20' : 'border-slate-200'
      }`}
    >
      {/* Background Pulse Effect when Frozen */}
      <AnimatePresence>
        {isFrozen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.1, 0.2, 0.1] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="absolute inset-0 bg-red-500/10 pointer-events-none"
          />
        )}
      </AnimatePresence>

      <div className="w-full flex justify-between items-center z-10">
        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">
          Circuit Breaker Control
        </span>
        <span className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded ${
          isFrozen ? 'bg-red-100 text-red-800 border border-red-300' : 
          isArmed ? 'bg-amber-100 text-amber-800 border border-amber-300' : 
          'bg-slate-100 text-slate-700 border border-slate-200'
        }`}>
          {isFrozen ? 'SYSTEM FROZEN' : isArmed ? 'ARMED' : 'HARDWARE GUARD'}
        </span>
      </div>

      {/* 3D Tactile Stop Button Unit */}
      <div className="my-6 z-10 flex flex-col items-center justify-center">
        <div className={`stop-housing ${isArmed ? 'is-armed' : ''} ${isFrozen ? 'is-frozen' : ''}`}>
          
          {/* Protective Flip Cover */}
          {!isFrozen && (
            <div 
              onClick={handleToggleArm}
              className={`stop-cover flex flex-col items-center justify-center text-slate-700 transition-all ${isArmed ? 'open' : ''}`}
            >
              <div className="text-2xl mb-1">🔒</div>
              <span className="font-mono text-[11px] font-bold tracking-wider text-slate-800">SAFETY GUARD</span>
              <span className="text-[9px] text-slate-500 mt-1 font-mono">Hover / Click to Arm</span>
            </div>
          )}

          {/* Physical Emergency Stop Button */}
          <button 
            onClick={() => {
              if (isFrozen) onOpenModal('unfreeze');
              else onOpenModal('freeze');
            }}
            className="stop-button group"
          >
            <span className="text-2xl mb-1 transition-transform group-hover:scale-110">
              {isFrozen ? '🔓' : '🛑'}
            </span>
            <span className="text-xs tracking-wider font-extrabold text-white uppercase font-sans">
              {isFrozen ? 'UNFREEZE' : 'STOP'}
            </span>
          </button>
        </div>

        {/* Hold Progress Indicator */}
        {isArmed && !isFrozen && (
          <div className="w-48 h-1.5 bg-slate-200 rounded-full mt-4 overflow-hidden">
            <div 
              className="h-full bg-red-600 transition-all duration-75"
              style={{ width: `${holdProgress}%` }}
            ></div>
          </div>
        )}
      </div>

      <div className="w-full z-10">
        <p className="text-xs text-slate-600 font-sans font-medium mb-3">
          {isFrozen 
            ? 'Emergency kill switch active. All n8n webhook calls blocked.' 
            : 'Instantly halts all autonomous payment pipelines mid-flight at the contract layer.'}
        </p>

        {isFrozen && (
          <motion.button 
            whileHover={shouldReduceMotion ? {} : { scale: 1.02 }}
            whileTap={shouldReduceMotion ? {} : { scale: 0.98 }}
            transition={SPRING.cardSpring}
            onClick={() => onOpenModal('unfreeze')}
            className="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-mono text-xs font-bold transition-all shadow-sm"
          >
            🔓 UNFREEZE SYSTEM PIPELINE
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}
