import React from 'react';
import { motion } from 'framer-motion';
import { checkReducedMotion } from '../config';

export default function Header({ isFrozen }) {
  const shouldReduceMotion = checkReducedMotion();

  return (
    <motion.header 
      initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="sticky top-0 z-40 bg-[#0A2540] text-white shadow-md"
    >
      {/* Stripe Sandbox Environment Top Bar */}
      <div className="bg-[#05192D] text-zinc-300 text-[11px] font-sans py-1.5 px-4 sm:px-6 flex items-center justify-between border-b border-[#1E3A5F]">
        <div className="flex items-center gap-2">
          <span className="bg-[#635BFF] text-white text-[9px] font-bold px-2 py-0.5 rounded font-mono uppercase tracking-wider">Sandbox</span>
          <span>You are testing in an autonomous AI wallet sandbox. Changes do not impact real customers.</span>
        </div>
        <div className="hidden sm:flex items-center gap-3 text-xs font-medium">
          <span className="text-emerald-400 font-mono text-[10px]">● Stripe Test Rails Active</span>
        </div>
      </div>

      {/* Main Header Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
        
        <div className="flex items-center gap-3">
          <motion.div 
            whileHover={shouldReduceMotion ? {} : { scale: 1.03 }}
            className="w-9 h-9 rounded-lg bg-[#635BFF] text-white flex items-center justify-center font-mono font-bold text-sm shadow-sm cursor-pointer"
          >
            KS
          </motion.div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-sans font-bold text-lg tracking-tight text-white">The Kill Switch</h1>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[#1A365D] border border-[#2B4C7E] text-zinc-300">Stripe Rail</span>
            </div>
            <p className="text-[11px] text-zinc-300">Independent AI Wallet Authorization Middleware</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className={`px-3.5 py-1.5 rounded-full text-xs font-mono font-semibold flex items-center gap-2 transition-all ${
            isFrozen 
              ? 'bg-red-500/20 border border-red-400/40 text-red-300 shadow-sm'
              : 'bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 shadow-sm'
          }`}>
            <motion.span 
              animate={shouldReduceMotion ? { opacity: [1, 0.6, 1] } : (isFrozen ? { scale: [1, 1.15, 1], opacity: [1, 0.4, 1] } : { scale: [1, 1.25, 1], opacity: [1, 0.4, 1] })}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
              className={`w-2 h-2 rounded-full ${isFrozen ? 'bg-red-400' : 'bg-emerald-400'}`}
            ></motion.span>
            <span>{isFrozen ? 'WALLET FROZEN' : 'PIPELINE ACTIVE'}</span>
          </div>
        </div>

      </div>
    </motion.header>
  );
}
