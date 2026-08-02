import React from 'react';
import { motion } from 'framer-motion';
import { checkReducedMotion } from '../config';
import { DURATION, EASING } from '../motionVariants';

export default function SystemArchitectureCard() {
  const shouldReduceMotion = checkReducedMotion();

  const securityInvariants = [
    { code: 'ADR-001', label: 'LLM Isolation', desc: 'AI has 0 DB write & 0 Stripe access' },
    { code: 'ADR-002', label: 'Middleware Authority', desc: 'Workflow C re-verifies all policies' },
    { code: 'ADR-003', label: 'Race Guard', desc: 'Checkpoint 3 verifies before execution' },
    { code: 'ADR-004', label: 'Auditable System Actions', desc: 'Operator identity logged on all events' }
  ];

  return (
    <motion.div 
      initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: DURATION.deliberate, ease: EASING.entrance, delay: 0.3 }}
      className="glass-panel rounded-xl p-5 bg-white border border-slate-200 shadow-sm space-y-4"
    >
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div>
          <h2 className="font-sans font-bold text-xs uppercase tracking-wider text-slate-900">Architecture & Compliance</h2>
          <p className="text-[11px] text-slate-500">Zero-Trust Security Invariants</p>
        </div>
        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-100 border border-emerald-300 text-emerald-800">
          VERIFIED
        </span>
      </div>

      <div className="space-y-2 font-mono text-xs">
        {securityInvariants.map((inv, idx) => (
          <div key={idx} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 space-y-0.5">
            <div className="flex items-center justify-between">
              <span className="text-slate-900 font-bold text-[11px]">{inv.label}</span>
              <span className="text-[9px] text-slate-600 bg-white px-1.5 py-0.5 rounded border border-slate-200">{inv.code}</span>
            </div>
            <p className="text-[10px] text-slate-500">{inv.desc}</p>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
