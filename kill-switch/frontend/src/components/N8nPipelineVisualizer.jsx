import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { checkReducedMotion } from '../config';
import { SPRING, DURATION, EASING } from '../motionVariants';

export default function N8nPipelineVisualizer({ activeWorkflowStep, isSending, isFrozen, lastDecision }) {
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const shouldReduceMotion = checkReducedMotion();

  // Workflow Topology Nodes (Exact names from n8n-workflows/*.json)
  const workflowNodes = [
    {
      id: 'wf-b',
      title: 'Workflow B — AI Agent',
      type: 'LLM Extraction Gate',
      credential: 'Gemini API Key ONLY (0 DB Write, 0 Stripe)',
      checkpoint: 'Checkpoint 1 (Pre-LLM Freeze Guard)',
      description: 'Parses natural language prompt into {recipient, amount}. Rejects at Checkpoint 1 if wallet is frozen before invoking Gemini.',
      triggerType: 'Public Webhook (POST /webhook/ai-agent)',
      stepIndex: 1,
      nodesInWorkflow: ['AI Agent Webhook', 'Read Policy (checkpoint 1)', 'Gemini 2.5 Flash: Extract Payment Fields', 'Execute Workflow C']
    },
    {
      id: 'wf-c',
      title: 'Workflow C — Authorization Middleware',
      type: 'Sole Authorization Authority',
      credential: 'Supabase Service Role Key ONLY (Cannot call Stripe)',
      checkpoint: 'Checkpoint 2 & Checkpoint 3 (Pre-Executor Race Guard)',
      description: 'Re-reads policies.is_frozen from Postgres. Validates recipient against allowlist and spent_today + amount <= daily_limit.',
      triggerType: 'Internal Execute Workflow Trigger Only',
      stepIndex: 2,
      nodesInWorkflow: ['Execute Workflow Trigger', 'Read Policy (checkpoint 2)', 'Check Allowlist', 'Evaluate Allowlist + Limit', 'Re-read Policy (checkpoint 3)', 'Execute Workflow D']
    },
    {
      id: 'wf-d',
      title: 'Workflow D — Payment Executor',
      type: 'Stripe Rail Execution',
      credential: 'Stripe Test Secret Key + Supabase Service Role Key',
      checkpoint: 'Checkpoint 4 (Final Pre-Stripe Execution Guard)',
      description: 'Re-checks is_frozen one final time before invoking Stripe /v1/payment_intents. Idempotency guarded by request_id.',
      triggerType: 'Internal Execute Workflow Trigger Only',
      stepIndex: 3,
      nodesInWorkflow: ['Execute Workflow Trigger', 'Idempotency Check', 'Re-read Policy (checkpoint 4)', 'Stripe: Create PaymentIntent', 'Log EXECUTED/FAILED']
    },
    {
      id: 'wf-a',
      title: 'Workflow A — Kill Switch API',
      type: 'Circuit Breaker Controller',
      credential: 'Supabase Service Role Key ONLY',
      checkpoint: 'Mutates policies.is_frozen & Logs SYSTEM Audit Event',
      description: 'Invoked by Emergency Stop / Unfreeze buttons. Instantly updates policies.is_frozen and records auditable actor row.',
      triggerType: 'Public Webhook (POST /webhook/kill-switch)',
      stepIndex: 'SYSTEM',
      nodesInWorkflow: ['Kill Switch Webhook', 'Validate Request', 'Update policies.is_frozen', 'Insert Audit Log Row', 'Respond to Dashboard']
    }
  ];

  const selectedNode = workflowNodes.find(n => n.id === selectedNodeId);

  // Helper to determine node execution state
  const getNodeStatus = (node) => {
    if (isFrozen) {
      if (node.id === 'wf-a') return { state: 'FROZEN', label: 'ARMED / FROZEN', color: 'text-[#EF4444]', border: 'border-[#EF4444]', bg: 'bg-red-950/40' };
      if (activeWorkflowStep === node.stepIndex) return { state: 'FROZEN', label: 'BLOCKED AT CHECKPOINT', color: 'text-[#EF4444]', border: 'border-[#EF4444]', bg: 'bg-red-950/40' };
      return { state: 'IDLE', label: 'FROZEN INHIBITED', color: 'text-[#8A8A8E]', border: 'border-[#2A2A2A]', bg: 'bg-[#141414]' };
    }

    if (isSending && activeWorkflowStep === node.stepIndex) {
      return { state: 'PROCESSING', label: 'PROCESSING', color: 'text-white', border: 'border-white shadow-[0_0_15px_rgba(255,255,255,0.2)]', bg: 'bg-[#1C1C1C]' };
    }

    if (lastDecision) {
      if (lastDecision.decision === 'APPROVED' && typeof node.stepIndex === 'number') {
        return { state: 'PASS', label: 'CHECKPOINT PASS', color: 'text-[#22C55E]', border: 'border-emerald-500/50', bg: 'bg-emerald-950/20' };
      }
      if (lastDecision.decision === 'REJECTED' && activeWorkflowStep === node.stepIndex) {
        return { state: 'REJECTED', label: 'REJECTED', color: 'text-[#EF4444]', border: 'border-[#EF4444]', bg: 'bg-red-950/30' };
      }
    }

    return { state: 'IDLE', label: 'IDLE', color: 'text-[#8A8A8E]', border: 'border-[#2A2A2A]', bg: 'bg-[#141414]' };
  };

  return (
    <motion.div 
      initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: DURATION.deliberate, ease: EASING.entrance, delay: 0.18 }}
      className="glass-panel rounded-2xl p-5 space-y-4 scanline overflow-hidden relative"
    >
      {/* Header & Legend */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#2A2A2A] pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-display font-bold text-sm uppercase tracking-wide text-[#F5F5F5]">n8n Workflow Execution Visualizer</h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#1C1C1C] border border-[#2A2A2A] text-[#8A8A8E]">Live Topology</span>
          </div>
          <p className="text-xs text-[#8A8A8E]">Real-time execution tracing across Workflows A, B, C, and D</p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-[10px] font-mono text-[#8A8A8E]">
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#8A8A8E]"></span>
            <span>IDLE</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
            <span className="text-white font-bold">PROCESSING</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#22C55E]"></span>
            <span className="text-[#22C55E] font-bold">PASS</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#EF4444]"></span>
            <span className="text-[#EF4444] font-bold">REJECTED</span>
          </div>
        </div>
      </div>

      {/* SVG Connection Cables & Data Packets (Phase 2) */}
      <div className="relative py-2 space-y-3">
        
        {/* Workflow Pipeline Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 relative">
          {workflowNodes.slice(0, 3).map((node) => {
            const status = getNodeStatus(node);
            const isSelected = selectedNodeId === node.id;
            const isRejected = status.state === 'REJECTED';
            const isPass = status.state === 'PASS';

            return (
              <motion.div
                key={node.id}
                layoutId={node.id}
                whileHover={shouldReduceMotion ? {} : { scale: 1.02 }}
                whileTap={shouldReduceMotion ? {} : { scale: 0.98 }}
                animate={
                  isRejected && !shouldReduceMotion
                    ? { x: [-3, 3, -2, 2, 0] }
                    : {}
                }
                transition={
                  isRejected
                    ? { duration: 0.2, ease: "easeInOut" }
                    : SPRING.cardSpring
                }
                onClick={() => setSelectedNodeId(isSelected ? null : node.id)}
                className={`p-4 rounded-xl ${status.bg} ${status.border} border transition-all cursor-pointer space-y-2 relative shadow-md`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-[#8A8A8E] font-bold uppercase tracking-wider">
                    {node.id.toUpperCase()}
                  </span>

                  <div className="flex items-center gap-1">
                    {isPass && (
                      <motion.span 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={SPRING.cardSpring}
                        className="text-[#22C55E] font-bold text-xs"
                      >
                        ✓
                      </motion.span>
                    )}
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#0A0A0A] ${status.color}`}>
                      {status.label}
                    </span>
                  </div>
                </div>

                <div>
                  <h3 className="font-mono text-xs font-bold text-[#F5F5F5]">{node.title}</h3>
                  <p className="text-[11px] text-[#8A8A8E] mt-0.5">{node.type}</p>
                </div>

                <div className="text-[10px] font-mono text-[#8A8A8E] pt-1 border-t border-[#2A2A2A] flex items-center justify-between">
                  <span className="truncate max-w-[140px]">{node.checkpoint}</span>
                  <span className="text-white underline font-bold">{isSelected ? 'Close' : 'Inspect'}</span>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Workflow A (System Controller Node) Bar */}
        {(() => {
          const sysNode = workflowNodes[3];
          const sysStatus = getNodeStatus(sysNode);
          const isSysSelected = selectedNodeId === sysNode.id;

          return (
            <motion.div
              layoutId={sysNode.id}
              whileHover={shouldReduceMotion ? {} : { scale: 1.01 }}
              whileTap={shouldReduceMotion ? {} : { scale: 0.99 }}
              onClick={() => setSelectedNodeId(isSysSelected ? null : sysNode.id)}
              className={`p-3.5 rounded-xl ${sysStatus.bg} ${sysStatus.border} border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-2`}
            >
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono font-bold text-red-400 bg-red-950/80 px-2 py-0.5 rounded border border-red-500/30">
                  SYSTEM CONTROL
                </span>
                <div>
                  <h3 className="font-mono text-xs font-bold text-[#F5F5F5]">{sysNode.title}</h3>
                  <p className="text-[11px] text-[#8A8A8E]">{sysNode.description}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 font-mono text-[10px]">
                <span className={`font-bold ${sysStatus.color}`}>{sysStatus.label}</span>
                <span className="text-white underline font-bold">{isSysSelected ? 'Close' : 'Inspect Node'}</span>
              </div>
            </motion.div>
          );
        })()}

      </div>

      {/* Phase 3 — Shared Layout Inline Node Inspector Drawer */}
      <AnimatePresence>
        {selectedNode && (
          <motion.div
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: DURATION.deliberate, ease: EASING.entrance }}
            className="p-4 rounded-xl bg-[#1C1C1C] border border-[#2A2A2A] space-y-3 font-mono text-xs overflow-hidden shadow-inner"
          >
            <div className="flex items-center justify-between border-b border-[#2A2A2A] pb-2">
              <div className="flex items-center gap-2">
                <span className="text-emerald-400 font-bold">🔍 Node Inspector:</span>
                <span className="text-white font-bold">{selectedNode.title}</span>
              </div>
              <button 
                onClick={() => setSelectedNodeId(null)}
                className="text-[#8A8A8E] hover:text-white text-xs font-bold"
              >
                ✕ Close Inspector
              </button>
            </div>

            <motion.div 
              initial="hidden"
              animate="visible"
              variants={{
                visible: { transition: { staggerChildren: 0.05 } }
              }}
              className="space-y-3"
            >
              <motion.div 
                variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }}
                className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]"
              >
                <div className="space-y-1">
                  <span className="text-[#8A8A8E] uppercase tracking-wider text-[10px] font-bold">Trigger Mechanism</span>
                  <div className="text-[#F5F5F5] p-2 rounded bg-[#141414] border border-[#2A2A2A] font-semibold">{selectedNode.triggerType}</div>
                </div>

                <div className="space-y-1">
                  <span className="text-[#8A8A8E] uppercase tracking-wider text-[10px] font-bold">Credential Scope (Zero-Trust)</span>
                  <div className="text-[#F5F5F5] p-2 rounded bg-[#141414] border border-[#2A2A2A] font-semibold">{selectedNode.credential}</div>
                </div>
              </motion.div>

              <motion.div 
                variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }}
                className="space-y-1"
              >
                <span className="text-[#8A8A8E] uppercase tracking-wider text-[10px] font-bold">Enforced Security Checkpoint</span>
                <div className="text-[#F5F5F5] p-2 rounded bg-[#141414] border border-[#2A2A2A] font-semibold">{selectedNode.checkpoint}</div>
              </motion.div>

              <motion.div 
                variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }}
                className="space-y-1"
              >
                <span className="text-[#8A8A8E] uppercase tracking-wider text-[10px] font-bold">n8n Internal Nodes Included</span>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {selectedNode.nodesInWorkflow.map((n, idx) => (
                    <span key={idx} className="px-2 py-1 rounded bg-[#141414] border border-[#2A2A2A] text-[10px] text-[#A1A1AA] font-mono font-medium">
                      {n}
                    </span>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
