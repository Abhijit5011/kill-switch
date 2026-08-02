import React from 'react';
import { motion } from 'framer-motion';
import { checkReducedMotion } from '../config';
import { DURATION, EASING } from '../motionVariants';

export default function AllowlistCard({ allowlist }) {
  const shouldReduceMotion = checkReducedMotion();

  return (
    <motion.div 
      initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: DURATION.deliberate, ease: EASING.entrance, delay: 0.22 }}
      className="glass-panel rounded-xl p-5 bg-white border border-slate-200 shadow-sm space-y-4"
    >
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div>
          <h2 className="font-sans font-bold text-xs uppercase tracking-wider text-slate-900">Allowlisted Counterparties</h2>
          <p className="text-[11px] text-slate-500">Only pre-approved addresses can be paid by the agent</p>
        </div>
        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700">
          {allowlist.length} Verified
        </span>
      </div>

      <div className="space-y-2 font-mono text-xs">
        {allowlist.map((item) => (
          <div key={item.id} className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span className="font-bold text-slate-900">{item.name}</span>
            </div>
            <span className="text-[11px] text-slate-500 font-mono">{item.address}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
