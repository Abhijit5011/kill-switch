import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatMoney, formatTime, checkReducedMotion } from '../config';
import { SPRING, DURATION, EASING } from '../motionVariants';
import TransactionDetailDrawer from './TransactionDetailDrawer';

export default function TransactionLedger({ transactions }) {
  const [activeTab, setActiveTab] = useState('ALL');
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedTxForDrawer, setSelectedTxForDrawer] = useState(null);
  const shouldReduceMotion = checkReducedMotion();
  const knownTxIdsRef = useRef(new Set(transactions.map(t => t.id || t.created_at)));

  useEffect(() => {
    transactions.forEach(t => knownTxIdsRef.current.add(t.id || t.created_at));
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const matchesSearch = 
        (t.recipient || '').toLowerCase().includes(searchFilter.toLowerCase()) ||
        (t.reason || '').toLowerCase().includes(searchFilter.toLowerCase()) ||
        (t.status || '').toLowerCase().includes(searchFilter.toLowerCase());

      if (!matchesSearch) return false;

      if (activeTab === 'APPROVED') return t.status === 'APPROVED' || t.status === 'EXECUTED';
      if (activeTab === 'REJECTED') return t.status === 'REJECTED' || t.status === 'FAILED';
      if (activeTab === 'SYSTEM') return t.recipient === 'SYSTEM';
      return true;
    });
  }, [transactions, activeTab, searchFilter]);

  return (
    <motion.div 
      initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: DURATION.deliberate, ease: EASING.entrance, delay: 0.28 }}
      className="glass-panel rounded-xl p-5 bg-white border border-slate-200 shadow-sm space-y-4"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-sans font-bold text-base text-slate-900">Transactions Ledger</h2>
          <p className="text-xs text-slate-500">Immutable Stripe audit trail — click any log row to inspect record window</p>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-mono">
          {['ALL', 'APPROVED', 'REJECTED', 'SYSTEM'].map(tab => (
            <motion.button
              key={tab}
              whileHover={shouldReduceMotion ? {} : { scale: 1.02 }}
              whileTap={shouldReduceMotion ? {} : { scale: 0.97 }}
              transition={SPRING.cardSpring}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded font-bold transition-all ${
                activeTab === tab 
                  ? 'bg-white text-slate-900 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              {tab}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Search Filter */}
      <input
        type="text"
        placeholder="Filter by recipient, description, or status..."
        value={searchFilter}
        onChange={(e) => setSearchFilter(e.target.value)}
        className="w-full px-3.5 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs font-mono text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white shadow-inner"
      />

      {/* Table Content */}
      <motion.div 
        key={activeTab}
        initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: DURATION.base, ease: EASING.entrance }}
        className="overflow-x-auto max-h-[380px] overflow-y-auto rounded-lg border border-slate-200"
      >
        <table className="w-full text-left text-xs font-sans">
          <thead className="sticky top-0 bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px] z-10">
            <tr>
              <th className="py-3 px-4">Amount</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Payment Method</th>
              <th className="py-3 px-4">Description</th>
              <th className="py-3 px-4">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {filteredTransactions.length === 0 ? (
              <tr>
                <td colSpan="5" className="py-8 text-center text-slate-500">No ledger records match the selected filter.</td>
              </tr>
            ) : (
              <AnimatePresence initial={false}>
                {filteredTransactions.map((tx, i) => {
                  const isApproved = tx.status === 'APPROVED' || tx.status === 'EXECUTED';
                  const isRejected = tx.status === 'REJECTED' || tx.status === 'FAILED';
                  const isSystem = tx.recipient === 'SYSTEM';
                  const isNew = !knownTxIdsRef.current.has(tx.id || tx.created_at);

                  return (
                    <motion.tr 
                      key={tx.id || tx.created_at || i}
                      initial={shouldReduceMotion ? { opacity: 0 } : (isNew ? { opacity: 0, y: -12, backgroundColor: "#F0FDF4" } : { opacity: 1 })}
                      animate={{ opacity: 1, y: 0, backgroundColor: "#FFFFFF" }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: DURATION.deliberate, ease: EASING.entrance }}
                      onClick={() => setSelectedTxForDrawer(tx)}
                      className="hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <td className="py-3 px-4 font-bold text-slate-900 tabular-nums">
                        {isSystem ? '—' : `US${formatMoney(tx.amount)} USD`}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-0.5 rounded text-[11px] font-medium inline-flex items-center gap-1 ${
                          isApproved ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                          isRejected ? 'bg-red-100 text-red-800 border border-red-200' :
                          'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}>
                          {isApproved ? 'Succeeded ✓' : isRejected ? 'Declined ✕' : tx.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {isSystem ? (
                          <span className="text-slate-400 font-mono text-[11px]">System Call</span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-blue-900 text-white font-mono text-[10px] font-bold tracking-wider uppercase inline-flex items-center gap-1 shadow-xs">
                            VISA <span className="text-zinc-300 font-normal">•••• 4242</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-700 font-medium truncate max-w-xs">
                        {isSystem ? (
                          <span className="text-slate-500 font-mono">{tx.reason}</span>
                        ) : (
                          <span>Payment to <strong className="text-slate-900">{tx.recipient}</strong> — <span className="text-slate-500 font-mono text-[11px]">{tx.reason || 'Stripe Test Intent'}</span></span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-500 font-mono tabular-nums text-[11px]">
                        {formatTime(tx.created_at)}
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            )}
          </tbody>
        </table>
      </motion.div>

      {/* Transaction Detail Inspector Drawer Modal */}
      {selectedTxForDrawer && (
        <TransactionDetailDrawer 
          transaction={selectedTxForDrawer} 
          onClose={() => setSelectedTxForDrawer(null)} 
        />
      )}
    </motion.div>
  );
}
