import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { checkReducedMotion } from '../config';
import { SPRING, DURATION, EASING } from '../motionVariants';

export default function N8nPipelineVisualizer({ 
  isSending, 
  isFrozen, 
  lastDecision, 
  onTriggerRequest, 
  onTriggerKillSwitch 
}) {
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [activeSubNodeId, setActiveSubNodeId] = useState(null);
  const shouldReduceMotion = checkReducedMotion();

  // Granular Sub-Node Execution Animation Pacing
  useEffect(() => {
    if (!isSending) {
      if (lastDecision) {
        if (lastDecision.decision === 'APPROVED') setActiveSubNodeId('D5');
        else if (lastDecision.reason?.includes('frozen')) setActiveSubNodeId('B2');
        else if (lastDecision.reason?.includes('allowlist') || lastDecision.reason?.includes('limit')) setActiveSubNodeId('C3');
        else setActiveSubNodeId(null);
      } else {
        setActiveSubNodeId(null);
      }
      return;
    }

    const sequence = ['B1', 'B2', 'B3', 'B4', 'C1', 'C2', 'C3', 'C4', 'C5', 'D1', 'D2', 'D3', 'D4', 'D5'];
    let step = 0;

    const timer = setInterval(() => {
      if (step < sequence.length) {
        setActiveSubNodeId(sequence[step]);
        step++;
      } else {
        clearInterval(timer);
      }
    }, 120);

    return () => clearInterval(timer);
  }, [isSending, lastDecision]);

  // Sub-Nodes Data Structure
  const workflowNodes = [
    {
      id: 'wf-b',
      title: 'Workflow B — AI Agent Gate',
      type: 'LLM Extraction & Delegate',
      credential: 'Gemini API Key ONLY (0 DB Write, 0 Stripe)',
      checkpoint: 'Checkpoint 1 (Pre-LLM Freeze Guard)',
      description: 'Parses natural language prompt into {recipient, amount}. Rejects at Checkpoint 1 if wallet is frozen before invoking Gemini.',
      triggerType: 'Public Webhook (POST /webhook/ai-agent)',
      subNodes: [
        { id: 'B1', name: 'Webhook Ingestion', type: 'webhook', desc: 'POST /webhook/ai-agent' },
        { id: 'B2', name: 'Checkpoint 1 Read Policy', type: 'supabase', desc: 'Fail-fast if frozen' },
        { id: 'B3', name: 'Gemini 2.5 Flash', type: 'llm', desc: 'Extract {recipient, amount}' },
        { id: 'B4', name: 'Delegate to Workflow C', type: 'execute', desc: 'Invoke Middleware' }
      ]
    },
    {
      id: 'wf-c',
      title: 'Workflow C — Authorization Middleware',
      type: 'Sole Authorization Authority',
      credential: 'Supabase Service Role Key ONLY (Cannot call Stripe)',
      checkpoint: 'Checkpoint 2 & Checkpoint 3 (Pre-Executor Race Guard)',
      description: 'Re-reads policies.is_frozen from Postgres. Validates recipient against allowlist and spent_today + amount <= daily_limit.',
      triggerType: 'Internal Execute Workflow Trigger Only',
      subNodes: [
        { id: 'C1', name: 'Execute Trigger', type: 'trigger', desc: 'Sub-workflow entry' },
        { id: 'C2', name: 'Checkpoint 2 Read Policy', type: 'supabase', desc: 'Verify is_frozen' },
        { id: 'C3', name: 'DB Allowlist & Cap Check', type: 'supabase', desc: 'Validate counterparty' },
        { id: 'C4', name: 'Checkpoint 3 Race Guard', type: 'supabase', desc: 'Re-verify before D' },
        { id: 'C5', name: 'Delegate to Workflow D', type: 'execute', desc: 'Invoke Executor' }
      ]
    },
    {
      id: 'wf-d',
      title: 'Workflow D — Payment Executor',
      type: 'Stripe Rail Execution',
      credential: 'Stripe Test Secret Key + Supabase Service Role Key',
      checkpoint: 'Checkpoint 4 (Final Pre-Stripe Execution Guard)',
      description: 'Re-checks is_frozen one final time before invoking Stripe /v1/payment_intents. Idempotency guarded by request_id.',
      triggerType: 'Internal Execute Workflow Trigger Only',
      subNodes: [
        { id: 'D1', name: 'Execute Trigger', type: 'trigger', desc: 'Sub-workflow entry' },
        { id: 'D2', name: 'Idempotency Guard', type: 'code', desc: 'Check request_id' },
        { id: 'D3', name: 'Checkpoint 4 Read Policy', type: 'supabase', desc: 'Pre-Stripe check' },
        { id: 'D4', name: 'Stripe PaymentIntent', type: 'stripe', desc: '/v1/payment_intents' },
        { id: 'D5', name: 'Log Audit Transaction', type: 'supabase', desc: 'Write transaction_logs' }
      ]
    },
    {
      id: 'wf-a',
      title: 'Workflow A — Kill Switch API',
      type: 'Circuit Breaker Controller',
      credential: 'Supabase Service Role Key ONLY',
      checkpoint: 'Mutates policies.is_frozen & Logs SYSTEM Audit Event',
      description: 'Invoked by Emergency Stop / Unfreeze buttons. Instantly updates policies.is_frozen and records auditable actor row.',
      triggerType: 'Public Webhook (POST /webhook/kill-switch)',
      subNodes: [
        { id: 'A1', name: 'Kill Switch Webhook', type: 'webhook', desc: 'POST /webhook/kill-switch' },
        { id: 'A2', name: 'Validate Request', type: 'code', desc: 'Validate actor & action' },
        { id: 'A3', name: 'Mutate policies.is_frozen', type: 'supabase', desc: 'Set is_frozen in DB' },
        { id: 'A4', name: 'Log SYSTEM Audit Event', type: 'supabase', desc: 'Record actor in logs' }
      ]
    }
  ];

  const selectedNode = workflowNodes.find(n => n.id === selectedNodeId);

  return (
    <motion.div 
      initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: DURATION.deliberate, ease: EASING.entrance, delay: 0.18 }}
      className="glass-panel rounded-xl p-5 bg-white border border-slate-200 shadow-sm space-y-5 overflow-hidden relative"
    >
      {/* Visualizer Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-sans font-bold text-base text-slate-900">n8n Live Workflow Visualizer</h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-800 font-bold animate-pulse">
              ● LIVE NODE TOPOLOGY
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">Real-time execution tracing across Workflows A, B, C, and D</p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-[11px] font-mono text-slate-600 bg-slate-50 px-3 py-1 rounded-lg border border-slate-200">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-slate-400"></span>
            <span>IDLE</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-indigo-600 animate-ping"></span>
            <span className="text-indigo-700 font-bold">PROCESSING</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span className="text-emerald-700 font-bold">PASS</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-500"></span>
            <span className="text-red-700 font-bold">REJECTED</span>
          </div>
        </div>
      </div>

      {/* Main Workflow Topology Canvas with SVG Connecting Cables */}
      <div className="space-y-4 relative py-1">

        {/* SVG Flow Stream Canvas Overlay */}
        <svg className="hidden md:block absolute top-[90px] left-0 right-0 w-full h-12 pointer-events-none z-0 overflow-visible opacity-60">
          <line x1="28%" y1="50%" x2="42%" y2="50%" stroke="#94A3B8" strokeWidth="2" strokeDasharray="4 4" />
          <line x1="62%" y1="50%" x2="76%" y2="50%" stroke="#94A3B8" strokeWidth="2" strokeDasharray="4 4" />

          {(isSending || activeSubNodeId) && !shouldReduceMotion && (
            <>
              <circle r="4" fill="#635BFF">
                <animate attributeName="cx" values="28%; 42%" dur="0.6s" repeatCount="indefinite" />
                <animate attributeName="cy" values="50%; 50%" dur="0.6s" repeatCount="indefinite" />
              </circle>
              <circle r="4" fill="#635BFF">
                <animate attributeName="cx" values="62%; 76%" dur="0.6s" begin="0.3s" repeatCount="indefinite" />
                <animate attributeName="cy" values="50%; 50%" dur="0.6s" begin="0.3s" repeatCount="indefinite" />
              </circle>
            </>
          )}
        </svg>

        {/* Top Pipelines Row (Workflows B, C, D) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 relative z-10">
          {workflowNodes.slice(0, 3).map((wf) => {
            const isSelected = selectedNodeId === wf.id;

            return (
              <div 
                key={wf.id}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3 relative shadow-xs"
              >
                {/* Workflow Header */}
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-slate-500 uppercase">{wf.id.toUpperCase()}</span>
                    <h3 className="font-sans text-xs font-bold text-slate-900">{wf.title}</h3>
                  </div>
                  <button 
                    onClick={() => setSelectedNodeId(isSelected ? null : wf.id)}
                    className="text-[10px] font-mono text-indigo-600 underline font-bold hover:text-indigo-800"
                  >
                    {isSelected ? 'Close' : 'Inspect'}
                  </button>
                </div>

                {/* Internal n8n Sub-Nodes List */}
                <div className="space-y-1.5">
                  {wf.subNodes.map((sn) => {
                    const isSubActive = activeSubNodeId === sn.id;
                    const isSubPass = lastDecision?.decision === 'APPROVED' && !isSending && activeSubNodeId === 'D5';
                    const isSubRejected = lastDecision?.decision === 'REJECTED' && !isSending && (
                      (sn.id === 'B2' && lastDecision.reason?.includes('frozen')) ||
                      (sn.id === 'C3' && (lastDecision.reason?.includes('allowlist') || lastDecision.reason?.includes('limit')))
                    );

                    return (
                      <motion.div
                        key={sn.id}
                        animate={isSubActive && !shouldReduceMotion ? { scale: [1, 1.02, 1] } : {}}
                        className={`p-2 rounded-lg border text-xs font-mono transition-all flex items-center justify-between ${
                          isSubActive 
                            ? 'bg-indigo-50 border-indigo-500 text-indigo-900 shadow-sm' 
                            : isSubPass 
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-900' 
                              : isSubRejected 
                                ? 'bg-red-50 border-red-300 text-red-900 shadow-xs' 
                                : 'bg-white border-slate-200 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-800">
                            {sn.id}
                          </span>
                          <div>
                            <span className="font-semibold text-[11px] block text-slate-900">{sn.name}</span>
                            <span className="text-[9px] text-slate-500">{sn.desc}</span>
                          </div>
                        </div>

                        {isSubActive ? (
                          <span className="w-2 h-2 rounded-full bg-indigo-600 animate-ping"></span>
                        ) : isSubPass ? (
                          <span className="text-emerald-600 font-bold">✓</span>
                        ) : isSubRejected ? (
                          <span className="text-red-600 font-bold">✕</span>
                        ) : (
                          <span className="text-slate-300">○</span>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Workflow A (System Controller Node) Bar */}
        {(() => {
          const sysWf = workflowNodes[3];
          const isSysSelected = selectedNodeId === sysWf.id;

          return (
            <div className={`p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2 relative z-10 ${isFrozen ? 'border-red-300 bg-red-50' : ''}`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded border border-red-200">
                    SYSTEM CONTROL
                  </span>
                  <h3 className="font-sans text-xs font-bold text-slate-900">{sysWf.title}</h3>
                </div>
                <button 
                  onClick={() => setSelectedNodeId(isSysSelected ? null : sysWf.id)}
                  className="text-[10px] font-mono text-indigo-600 underline font-bold hover:text-indigo-800"
                >
                  {isSysSelected ? 'Close' : 'Inspect Node'}
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 font-mono text-xs">
                {sysWf.subNodes.map((sn) => (
                  <div key={sn.id} className="p-2 rounded bg-white border border-slate-200 flex items-center justify-between text-[11px]">
                    <div>
                      <span className="text-slate-900 font-bold block">{sn.name}</span>
                      <span className="text-[9px] text-slate-500">{sn.desc}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-bold">{sn.id}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

      </div>

      {/* Shared Layout Inline Node Inspector Drawer */}
      <AnimatePresence>
        {selectedNode && (
          <motion.div
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: DURATION.deliberate, ease: EASING.entrance }}
            className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 font-mono text-xs overflow-hidden relative z-20"
          >
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div className="flex items-center gap-2">
                <span className="text-indigo-600 font-bold">🔍 Node Inspector:</span>
                <span className="text-slate-900 font-bold">{selectedNode.title}</span>
              </div>
              <button 
                onClick={() => setSelectedNodeId(null)}
                className="text-slate-500 hover:text-slate-900 text-xs font-bold"
              >
                ✕ Close Inspector
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
              <div className="space-y-1">
                <span className="text-slate-500 uppercase tracking-wider text-[10px] font-bold">Trigger Mechanism & Webhook URL</span>
                <div className="text-slate-900 p-2 rounded bg-white border border-slate-200 font-semibold break-all select-all">{selectedNode.triggerType}</div>
              </div>

              <div className="space-y-1">
                <span className="text-slate-500 uppercase tracking-wider text-[10px] font-bold">Credential Scope (Zero-Trust)</span>
                <div className="text-slate-900 p-2 rounded bg-white border border-slate-200 font-semibold">{selectedNode.credential}</div>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-slate-500 uppercase tracking-wider text-[10px] font-bold">Enforced Security Checkpoint</span>
              <div className="text-slate-900 p-2 rounded bg-white border border-slate-200 font-semibold">{selectedNode.checkpoint}</div>
            </div>

            <div className="space-y-1">
              <span className="text-slate-500 uppercase tracking-wider text-[10px] font-bold">n8n Internal Nodes Included</span>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {selectedNode.nodesInWorkflow.map((n, idx) => (
                  <span key={idx} className="px-2 py-1 rounded bg-white border border-slate-200 text-[10px] text-slate-700 font-mono font-medium">
                    {n}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
