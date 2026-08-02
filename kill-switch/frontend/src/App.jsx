import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import EmergencyBanner from './components/EmergencyBanner';
import MetricsCards from './components/MetricsCards';
import SpendProgressBar from './components/SpendProgressBar';
import N8nPipelineVisualizer from './components/N8nPipelineVisualizer';
import AllowlistCard from './components/AllowlistCard';
import TransactionLedger from './components/TransactionLedger';
import KillSwitchControl from './components/KillSwitchControl';
import AiAgentPlayground from './components/AiAgentPlayground';
import OperatorModal from './components/OperatorModal';
import { CONFIG } from './config';

export default function App() {
  // System State
  const [state, setState] = useState({
    is_frozen: false,
    daily_limit: 1000,
    spent_today: 150,
    allowlist: [
      { id: '1', name: 'Acme Corp', address: 'acme@example.com' },
      { id: '2', name: 'Globex Inc', address: 'globex@example.com' }
    ],
    transactions: [
      { id: 'tx-1', created_at: new Date().toISOString(), recipient: 'Acme Corp', amount: 150, status: 'APPROVED', reason: 'Payment Intent pi_3P_test_123' }
    ]
  });

  // UI States
  const [prompt, setPrompt] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [activeWorkflowStep, setActiveWorkflowStep] = useState(null);
  const [agentResponse, setAgentResponse] = useState(null);
  const [actorModal, setActorModal] = useState({ open: false, action: 'freeze', actorName: '' });
  const [notification, setNotification] = useState(null);

  const showToast = (msg, type = 'info') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Supabase Data Fetching
  const fetchSupabaseData = async () => {
    if (!CONFIG.SUPABASE_URL || CONFIG.SUPABASE_URL.includes('REPLACE')) return;
    try {
      const headers = {
        'apikey': CONFIG.SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${CONFIG.SUPABASE_ANON_KEY}`
      };
      const [policyRes, allowRes, txRes] = await Promise.all([
        fetch(`${CONFIG.SUPABASE_URL}/rest/v1/policies?select=*&limit=1`, { headers }),
        fetch(`${CONFIG.SUPABASE_URL}/rest/v1/allowlist?select=*`, { headers }),
        fetch(`${CONFIG.SUPABASE_URL}/rest/v1/transaction_logs?select=*&order=created_at.desc&limit=30`, { headers })
      ]);

      if (policyRes.ok && allowRes.ok && txRes.ok) {
        const policyData = await policyRes.json();
        const allowData = await allowRes.json();
        const txData = await txRes.json();

        if (policyData && policyData.length > 0) {
          const pol = policyData[0];
          setState(prev => ({
            ...prev,
            is_frozen: pol.is_frozen,
            daily_limit: Number(pol.daily_limit || 1000),
            spent_today: Number(pol.spent_today || 0),
            allowlist: allowData || prev.allowlist,
            transactions: txData || prev.transactions
          }));
        }
      }
    } catch (e) {
      console.warn('Supabase auto-sync offline/unreachable:', e);
    }
  };

  useEffect(() => {
    fetchSupabaseData();
    const interval = setInterval(fetchSupabaseData, 5000);
    return () => clearInterval(interval);
  }, []);

  // Execute Kill Switch
  const handleKillSwitchSubmit = async () => {
    if (!actorModal.actorName.trim()) {
      showToast('Please enter an operator name for the audit log', 'error');
      return;
    }

    const action = actorModal.action;
    const actor = actorModal.actorName.trim();
    setActorModal({ open: false, action: 'freeze', actorName: '' });

    const newFrozen = action === 'freeze';
    const timestamp = new Date().toISOString();

    setState(prev => ({
      ...prev,
      is_frozen: newFrozen,
      transactions: [
        {
          id: 'sys-' + Date.now(),
          created_at: timestamp,
          recipient: 'SYSTEM',
          amount: 0,
          status: newFrozen ? 'FROZEN' : 'UNFROZEN',
          reason: `actor: ${actor} — ${newFrozen ? 'Manual emergency stop activated' : 'Manual system unfreeze'}`
        },
        ...prev.transactions
      ]
    }));

    showToast(
      newFrozen ? `🚨 Emergency Stop Activated by ${actor}` : `🔓 System Unfrozen by ${actor}`,
      newFrozen ? 'error' : 'success'
    );

    if (!CONFIG.KILL_SWITCH_WEBHOOK_URL || CONFIG.KILL_SWITCH_WEBHOOK_URL.includes('REPLACE_ME')) return;

    try {
      await fetch(CONFIG.KILL_SWITCH_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          actor,
          reason: newFrozen ? 'Manual emergency stop from React dashboard' : 'Manual restore from React dashboard'
        })
      });
      fetchSupabaseData();
    } catch (err) {
      console.error('Kill switch webhook error:', err);
    }
  };

  // Send Prompt to AI Agent Workflow
  const handleSendAgentRequest = async (overridePrompt = null) => {
    const textToUse = overridePrompt || prompt;
    if (!textToUse.trim()) return;

    setIsSending(true);
    setAgentResponse(null);
    setActiveWorkflowStep(1); // Workflow B

    /* Presentational pacing during real async wait, not synthetic data */
    const stepTimer1 = setTimeout(() => setActiveWorkflowStep(2), 300); // Workflow C
    const stepTimer2 = setTimeout(() => setActiveWorkflowStep(3), 600); // Workflow D

    if (state.is_frozen) {
      setTimeout(() => {
        setIsSending(false);
        setAgentResponse({
          decision: 'REJECTED',
          reason: 'Wallet is frozen. The AI agent will not even attempt to interpret payment requests while the Emergency Kill Switch is active.'
        });
        clearTimeout(stepTimer1);
        clearTimeout(stepTimer2);
      }, 300);
      return;
    }

    if (!CONFIG.AI_AGENT_WEBHOOK_URL || CONFIG.AI_AGENT_WEBHOOK_URL.includes('REPLACE_ME')) {
      setTimeout(() => {
        setIsSending(false);
        setAgentResponse({
          decision: 'DEMO MODE',
          reason: 'Please configure CONFIG.AI_AGENT_WEBHOOK_URL to link to n8n Workflow B.'
        });
        clearTimeout(stepTimer1);
        clearTimeout(stepTimer2);
      }, 500);
      return;
    }

    try {
      const res = await fetch(CONFIG.AI_AGENT_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: textToUse })
      });
      const data = await res.json();
      setAgentResponse(data);
      fetchSupabaseData();
    } catch (err) {
      setAgentResponse({
        decision: 'FAILED',
        reason: 'Webhook execution failed. Please verify n8n Workflow B activation.'
      });
    } finally {
      setIsSending(false);
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
    }
  };

  const remainingBudget = Math.max(0, state.daily_limit - state.spent_today);
  const budgetPercentage = Math.min(100, Math.round((state.spent_today / state.daily_limit) * 100));

  return (
    <div className="min-h-screen flex flex-col grid-pattern bg-[#0A0A0A] text-[#F5F5F5]">
      <Header isFrozen={state.is_frozen} />

      {state.is_frozen && <EmergencyBanner />}

      {notification && (
        <div className="fixed top-20 right-6 z-50 animate-bounce">
          <div className={`px-4 py-3 rounded-xl border text-sm font-mono shadow-2xl flex items-center gap-3 ${
            notification.type === 'error' ? 'bg-red-950/90 border-red-500 text-red-100' : 'bg-emerald-950/90 border-emerald-500 text-emerald-100'
          }`}>
            <span>{notification.type === 'error' ? '⚠️' : '✅'}</span>
            <span>{notification.msg}</span>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 w-full">
        
        {/* Left Column: Metrics, Velocity Bar, n8n Pipeline Visualizer, Allowlist & Transaction Ledger */}
        <div className="lg:col-span-8 space-y-6">
          <MetricsCards 
            dailyLimit={state.daily_limit} 
            spentToday={state.spent_today} 
            remainingBudget={remainingBudget} 
            budgetPercentage={budgetPercentage} 
          />

          <SpendProgressBar 
            spentToday={state.spent_today} 
            dailyLimit={state.daily_limit} 
            budgetPercentage={budgetPercentage} 
          />

          {/* Real n8n Workflow Topology Visualizer */}
          <N8nPipelineVisualizer 
            activeWorkflowStep={activeWorkflowStep} 
            isSending={isSending} 
            isFrozen={state.is_frozen} 
            lastDecision={agentResponse} 
          />

          <AllowlistCard allowlist={state.allowlist} />

          <TransactionLedger transactions={state.transactions} />
        </div>

        {/* Right Column: Physical Emergency Kill Switch & AI Agent Sandbox */}
        <div className="lg:col-span-4 space-y-6">
          <KillSwitchControl 
            isFrozen={state.is_frozen} 
            onOpenModal={(action) => setActorModal({ open: true, action, actorName: '' })} 
          />

          <AiAgentPlayground 
            prompt={prompt} 
            setPrompt={setPrompt} 
            isSending={isSending} 
            agentResponse={agentResponse} 
            onSendRequest={handleSendAgentRequest} 
          />
        </div>

      </main>

      <footer className="border-t border-[#2A2A2A] py-4 text-center text-xs font-mono text-[#8A8A8E] bg-[#0A0A0A]">
        Stripe Test Mode · Supabase Postgres · n8n Cloud · Gemini 2.5 Flash
      </footer>

      <OperatorModal 
        actorModal={actorModal} 
        setActorModal={setActorModal} 
        onSubmit={handleKillSwitchSubmit} 
      />
    </div>
  );
}
