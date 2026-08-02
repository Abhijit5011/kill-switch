import React from 'react';
import { motion } from 'framer-motion';
import { formatMoney, checkReducedMotion } from '../config';

export default function SpendProgressBar({ spentToday, dailyLimit, budgetPercentage }) {
  const shouldReduceMotion = checkReducedMotion();
  const barColor = budgetPercentage > 90 ? 'bg-red-500' : 'bg-emerald-500';

  return (
    <motion.div 
      initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.2 }}
      className="glass-panel rounded-xl p-4 space-y-2 bg-white border border-slate-200 shadow-sm"
    >
      <div className="flex justify-between items-center text-xs font-mono text-slate-500 font-medium">
        <span>Daily Spending Velocity</span>
        <span className="text-slate-900 font-bold tabular-nums">{formatMoney(spentToday)} / {formatMoney(dailyLimit)}</span>
      </div>
      <div className="w-full h-3 rounded-full bg-slate-100 border border-slate-200 overflow-hidden p-0.5 shadow-inner">
        <motion.div 
          initial={shouldReduceMotion ? { width: `${budgetPercentage}%` } : { width: '0%' }}
          animate={{ width: `${budgetPercentage}%` }}
          transition={{ type: "spring", stiffness: 60, damping: 15, delay: 0.25 }}
          className={`h-full rounded-full shadow-sm ${barColor}`}
        ></motion.div>
      </div>
    </motion.div>
  );
}
