# The Kill Switch — Independent AI Wallet Authorization Middleware

> An AI agent that can only **ask** for payments — never **make** them. A separate, deterministic
> authorization middleware is the sole trusted authority over every financial transaction, with a
> true circuit-breaker Emergency Kill Switch that can halt the entire pipeline instantly, even
> mid-transaction, and reject all new activity until an owner explicitly restores the system.

## Why this project exists

AI agents that are wired directly into payment rails are one hallucination, prompt injection, or
infinite loop away from moving real money. This project demonstrates the opposite design pattern:

- The **AI can only request** a payment (recipient + amount). It cannot call Stripe. It cannot
  write to the database. It cannot flip the kill switch.
- An **independent middleware** (Workflow C) is the only component allowed to approve a payment.
  It re-checks the frozen flag, the allowlist, and the daily limit on every single request,
  regardless of what the AI said or how it was prompted.
- A **circuit breaker**, not a boolean flag: `is_frozen` is checked at every critical checkpoint —
  before AI authorization, before middleware validation, before Stripe execution, before logging,
  and before every retry or queued job resumes. If frozen, everything stops at the next safe
  checkpoint, not just the next new request.

## System diagram

```
                 ┌─────────────────────────────────────────────────────────┐
                 │                     Owner / Dashboard                    │
                 │      🚨 EMERGENCY STOP        🔓 UNFREEZE                │
                 └───────────────┬───────────────────────┬─────────────────┘
                                 │                        │
                                 ▼                        ▼
                     Workflow A — Kill Switch API (webhook)
                     freezes/unfreezes policies.is_frozen
                                 │
                                 │ (is_frozen is polled by every workflow below)
                                 ▼
User ──prompt──▶ Workflow B — AI Agent (Gemini 2.5 Flash)
                     • checks is_frozen before even asking the LLM
                     • extracts {recipient, amount} from natural language
                     • NEVER touches Stripe or Supabase directly
                     • calls Workflow C via Execute Sub-workflow
                                 │
                                 ▼
                  Workflow C — Authorization Middleware  (single source of truth)
                     1. read policies row → if is_frozen → REJECT, log, return
                     2. recipient in allowlist? → else REJECT, log, return
                     3. spent_today + amount <= daily_limit? → else REJECT, log, return
                     4. re-check is_frozen (race-condition guard) → else REJECT
                     5. APPROVE → call Workflow D
                     6. on success: increment spent_today, log APPROVED
                                 │
                                 ▼
                  Workflow D — Payment Executor  (only callable by Workflow C)
                     • re-checks is_frozen once more (last checkpoint before Stripe)
                     • creates Stripe Test PaymentIntent
                     • returns {payment_id, status, timestamp}
                     • updates transaction_logs with the Stripe result
```

## Repository layout

```
kill-switch/
├── README.md                     ← you are here
├── plan.md                       ← build plan / milestones
├── decisions.md                  ← architecture decision records (ADRs)
├── architecture.md               ← detailed component + data-flow design
├── .env.example                  ← every required environment variable
├── docs/
│   ├── api-documentation.md      ← webhook contracts for all 4 workflows
│   ├── setup-guide.md            ← step-by-step local + n8n Cloud setup
│   ├── deployment-instructions.md
│   ├── demo-script.md            ← judge-facing walkthrough script
│   └── testing-scenarios.md      ← the required test matrix + expected results
├── frontend/
│   └── index.html                ← Tailwind + vanilla JS dashboard (single file)
├── n8n-workflows/
│   ├── workflow-a-kill-switch-api.json
│   ├── workflow-b-ai-agent.json
│   ├── workflow-c-authorization-middleware.json
│   └── workflow-d-payment-executor.json
└── sql/
    └── schema-reference.sql      ← reference only — tables already exist in Supabase
```

## Non-negotiable security invariants

1. The frontend holds **only** the Supabase anon key, and even that key is never used for writes —
   the dashboard talks exclusively to n8n webhooks. All privileged Postgres access happens inside
   n8n using the service-role key, which never reaches the browser.
2. The AI agent (Workflow B) has **no Supabase or Stripe credentials at all**. Its only capability
   is to call Workflow C through an `Execute Workflow` node and render the JSON it gets back.
3. Workflow C is the **only** workflow with permission to call Workflow D.
4. Workflow D is the **only** workflow with a Stripe key, and it will refuse to run if it is invoked
   any way other than by Workflow C, or if `is_frozen = true`.
5. `is_frozen` is re-read from Postgres (never cached, never passed as a trusted parameter) at every
   checkpoint listed in the diagram above.

## Quick start

See `docs/setup-guide.md` for the full walkthrough. Short version:

1. Import the four JSON files in `n8n-workflows/` into n8n Cloud.
2. Fill in credentials (Supabase service role, Stripe test secret key, Gemini API key) — see
   `.env.example` for the full list of variables n8n and the frontend expect.
3. Copy each workflow's **Production Webhook URL** into `frontend/index.html` (marked with
   `REPLACE_ME_WORKFLOW_A_URL` etc.).
4. Open `frontend/index.html` in a browser (or host it as a static file) and you have a working
   dashboard against your n8n Cloud instance and Supabase project.

## Demo flow for judges

See `docs/demo-script.md` for a full script; the one-line pitch is: *"Watch me try to prompt-inject
the AI into paying an unlisted recipient, watch the middleware reject it anyway — then watch me hit
the physical kill switch mid-payment and watch Stripe never get called."*
