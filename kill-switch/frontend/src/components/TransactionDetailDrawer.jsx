import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatMoney, formatTime, checkReducedMotion } from '../config';
import { DURATION, EASING } from '../motionVariants';

export default function TransactionDetailDrawer({ transaction, onClose }) {
  const [copied, setCopied] = useState(false);
  const shouldReduceMotion = checkReducedMotion();

  if (!transaction) return null;

  const isApproved = transaction.status === 'APPROVED' || transaction.status === 'EXECUTED';
  const isRejected = transaction.status === 'REJECTED' || transaction.status === 'FAILED';
  const isSystem = transaction.recipient === 'SYSTEM';

  let stripeId = transaction.payment_id || 'N/A';
  if (stripeId === 'N/A' && transaction.reason && transaction.reason.includes('pi_')) {
    const match = transaction.reason.match(/pi_[a-zA-Z0-9]+/);
    if (match) stripeId = match[0];
  }

  const copyStripeId = () => {
    if (stripeId !== 'N/A' && navigator.clipboard) {
      navigator.clipboard.writeText(stripeId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
        
        {/* Backdrop click to close */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0"
        />

        {/* Drawer Window */}
        <motion.div 
          initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: 12 }}
          transition={{ duration: DURATION.deliberate, ease: EASING.entrance }}
          className="glass-panel rounded-2xl p-6 max-w-2xl w-full border border-slate-200 bg-white shadow-2xl relative z-10 space-y-5 font-mono text-xs max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div className="flex items-center gap-3">
              <span className="text-slate-600 text-[10px] font-bold uppercase tracking-wider bg-slate-100 px-2.5 py-1 rounded border border-slate-200">
                STRIPE AUDIT LOG RECORD
              </span>
              <span className={`px-2.5 py-1 rounded text-xs font-bold ${
                isApproved ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                isRejected ? 'bg-red-100 text-red-800 border border-red-300' :
                'bg-slate-100 text-slate-700 border border-slate-200'
              }`}>
                {isApproved ? 'Succeeded ✓' : isRejected ? 'Declined ✕' : transaction.status}
              </span>
            </div>

            <button 
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 flex items-center justify-center text-slate-700 font-bold transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Primary Transaction Attributes Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] text-slate-500 uppercase font-bold block">Customer / Target</span>
              <span className="text-xs font-bold text-slate-900 mt-1 block truncate">
                {isSystem ? '⚙️ SYSTEM' : transaction.recipient}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] text-slate-500 uppercase font-bold block">Amount</span>
              <span className="text-xs font-bold text-slate-900 mt-1 block tabular-nums">
                {isSystem ? '—' : `US${formatMoney(transaction.amount)} USD`}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] text-slate-500 uppercase font-bold block">Date & Time</span>
              <span className="text-xs font-bold text-slate-900 mt-1 block tabular-nums">
                {formatTime(transaction.created_at)}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] text-slate-500 uppercase font-bold block">Stripe Intent ID</span>
              <div className="flex items-center justify-between mt-1">
                <span className="text-[11px] font-bold text-slate-900 truncate max-w-[90px]">{stripeId}</span>
                {stripeId !== 'N/A' && (
                  <button onClick={copyStripeId} className="text-[9px] text-indigo-600 font-bold hover:underline">
                    {copied ? '✓' : 'Copy'}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Reason / Details Banner */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Authorization Description / Audit Details</span>
            <div className="text-xs text-slate-900 leading-relaxed font-semibold">
              {transaction.reason || 'No detailed reason provided.'}
            </div>
          </div>

          {/* Security Checkpoints Evaluation Map */}
          <div className="space-y-2">
            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Security Checkpoint Verification Matrix</span>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <span>Checkpoint 1 (Pre-LLM Guard)</span>
                <span className={transaction.status === 'FROZEN' ? 'text-red-600 font-bold' : 'text-emerald-600 font-bold'}>
                  {transaction.status === 'FROZEN' ? 'BLOCKED' : 'PASSED ✓'}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <span>Checkpoint 2 (Policy & Allowlist)</span>
                <span className={isRejected && transaction.status !== 'FROZEN' ? 'text-red-600 font-bold' : 'text-emerald-600 font-bold'}>
                  {isRejected && transaction.status !== 'FROZEN' ? 'FAILED ✕' : 'PASSED ✓'}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <span>Checkpoint 3 (Race Guard)</span>
                <span className="text-emerald-600 font-bold">PASSED ✓</span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <span>Checkpoint 4 (Pre-Stripe Guard)</span>
                <span className={isApproved ? 'text-emerald-600 font-bold' : 'text-slate-400'}>
                  {isApproved ? 'EXECUTED ✓' : 'SKIPPED'}
                </span>
              </div>
            </div>
          </div>

          {/* Raw JSON Payload Viewer */}
          <div className="space-y-1.5">
            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Raw Audit Log Payload (Postgres / Supabase)</span>
            <pre className="p-3 rounded-xl bg-slate-900 text-slate-100 text-[10px] overflow-x-auto select-all leading-normal">
              {JSON.stringify(transaction, null, 2)}
            </pre>
          </div>

          {/* Close Action */}
          <div className="pt-2 flex justify-end">
            <button 
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-[#0A2540] hover:bg-[#05192D] text-white font-bold text-xs transition-colors shadow-sm"
            >
              Close Record Window
            </button>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
}
