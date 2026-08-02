import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { checkReducedMotion } from '../config';
import { DURATION, EASING } from '../motionVariants';

export default function AddCompanyModal({ isOpen, onClose, onAdd }) {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [error, setError] = useState('');
  const shouldReduceMotion = checkReducedMotion();

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter a company name');
      return;
    }
    if (!address.trim()) {
      setError('Please enter a counterparty address or email');
      return;
    }

    onAdd({ id: 'allow-' + Date.now(), name: name.trim(), address: address.trim() });
    setName('');
    setAddress('');
    setError('');
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm">
        
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0"
        />

        {/* Modal Window */}
        <motion.div 
          initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: 12 }}
          transition={{ duration: DURATION.deliberate, ease: EASING.entrance }}
          className="glass-panel rounded-2xl p-6 max-w-md w-full border border-slate-200 dark:border-[#2A2A2A] bg-white dark:bg-[#141414] shadow-2xl relative z-10 space-y-4 font-sans text-slate-900 dark:text-white"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#2A2A2A] pb-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <h3 className="font-sans font-bold text-base text-slate-900 dark:text-white">Add Verified Counterparty</h3>
            </div>
            <button 
              onClick={onClose}
              className="text-slate-400 hover:text-slate-700 dark:hover:text-white font-bold text-sm"
            >
              ✕
            </button>
          </div>

          <p className="text-xs text-slate-500 dark:text-zinc-400 font-sans">
            Add a new company or counterparty address to the system allowlist. The AI agent will only be authorized to send funds to verified counterparties.
          </p>

          {error && (
            <div className="p-2.5 rounded-lg bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-500/40 text-xs font-mono text-red-700 dark:text-red-300">
              ⚠️ {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3 font-mono text-xs">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider block">
                Company / Merchant Name
              </label>
              <input
                type="text"
                placeholder="e.g. Stripe Inc, Vercel Inc, Amazon Web Services"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#0A0A0A] border border-slate-200 dark:border-[#2A2A2A] text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-600 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider block">
                Counterparty Address or Billing Email
              </label>
              <input
                type="text"
                placeholder="e.g. billing@stripe.com, aws-billing@amazon.com"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#0A0A0A] border border-slate-200 dark:border-[#2A2A2A] text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-600 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#1C1C1C] dark:hover:bg-[#2A2A2A] text-slate-700 dark:text-zinc-300 font-bold transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-[#635BFF] hover:bg-[#5249FF] text-white font-bold transition-all shadow-md flex items-center gap-1.5"
              >
                <span>✓ Verify & Add Company</span>
              </button>
            </div>
          </form>

        </motion.div>
      </div>
    </AnimatePresence>
  );
}
