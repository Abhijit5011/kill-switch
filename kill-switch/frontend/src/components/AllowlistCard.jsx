import React from 'react';
import { motion } from 'framer-motion';
import { checkReducedMotion } from '../config';
import { DURATION, EASING } from '../motionVariants';

export default function AllowlistCard({ allowlist, onOpenAddModal }) {
  const shouldReduceMotion = checkReducedMotion();

  return (
    <motion.div 
      initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: DURATION.deliberate, ease: EASING.entrance, delay: 0.22 }}
      className="glass-panel rounded-xl p-5 bg-white dark:bg-[#141414] border border-slate-200 dark:border-[#2A2A2A] shadow-sm space-y-4"
    >
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#2A2A2A] pb-3">
        <div>
          <h2 className="font-sans font-bold text-xs uppercase tracking-wider text-slate-900 dark:text-white">Allowlisted Counterparties</h2>
          <p className="text-[11px] text-slate-500 dark:text-zinc-400">Only pre-approved addresses can be paid by the agent</p>
        </div>

        <div className="flex items-center gap-2">
          <motion.button
            whileHover={shouldReduceMotion ? {} : { scale: 1.03 }}
            whileTap={shouldReduceMotion ? {} : { scale: 0.97 }}
            onClick={onOpenAddModal}
            className="px-2.5 py-1 rounded-lg bg-[#635BFF] hover:bg-[#5249FF] text-white font-mono text-[10px] font-bold transition-all shadow-sm flex items-center gap-1"
          >
            <span>+ Add Company</span>
          </motion.button>
          
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-[#1C1C1C] border border-slate-200 dark:border-[#2A2A2A] text-slate-700 dark:text-zinc-300">
            {allowlist.length} Verified
          </span>
        </div>
      </div>

      <div className="space-y-2 font-mono text-xs max-h-[220px] overflow-y-auto pr-1">
        {allowlist.map((item, idx) => (
          <div key={item.id || idx} className="p-3 rounded-lg bg-slate-50 dark:bg-[#0A0A0A] border border-slate-200 dark:border-[#2A2A2A] flex items-center justify-between hover:border-slate-300 dark:hover:border-zinc-700 transition-colors">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span className="font-bold text-slate-900 dark:text-white">{item.name}</span>
            </div>
            <span className="text-[11px] text-slate-500 dark:text-zinc-400 font-mono">{item.address}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
