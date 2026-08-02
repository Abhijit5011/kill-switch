# 🛠️ THE KILL SWITCH — End-to-End Technology Stack & Architecture Report

**Independent AI Wallet Authorization Middleware**  
*Zero-Trust Security, Multi-Stage Enforced Checkpoints, and Emergency Circuit Breakers for Autonomous Agentic Financial Transactions.*

---

## 1. High-Level Architecture Diagram

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                 FRONTEND PRESENTATION                                  │
│  React 18 + Vite 5 + TailwindCSS + Framer Motion (Stripe Light / Cyber Dark Themes)     │
└──────────────────────────────────────────┬─────────────────────────────────────────────┘
                                           │
                        ┌──────────────────┴──────────────────┐
                        │   n8n CLOUD ORCHESTRATION ENGINE    │
                        └──────────────────┬──────────────────┘
                                           │
         ┌──────────────────┬──────────────┴───────────────┬──────────────────┐
         ▼                  ▼                             ▼                  ▼
┌─────────────────┐┌──────────────────┐         ┌──────────────────┐┌──────────────────┐
│  WORKFLOW B     ││   WORKFLOW C     │         │   WORKFLOW D     ││   WORKFLOW A     │
│  AI Agent Gate  ││  Authorization   │         │ Payment Executor ││  Kill Switch API │
│ (Gemini 2.5 LLM)││    Middleware    │         │ (Stripe Test API)││ (Postgres Mutate)│
└────────┬────────┘└────────┬─────────┘         └────────┬─────────┘└────────┬─────────┘
         │                  │                            │                   │
         └──────────────────┼────────────────────────────┴───────────────────┘
                            ▼
                 ┌─────────────────────┐
                 │  SUPABASE POSTGRES  │
                 │   Database Storage  │
                 └─────────────────────┘
```

---

## 2. Granular Tech Stack Breakdown by Layer

### 📱 A. Frontend Layer (User Interface & Control Dashboard)

| Technology | Version / Tool | Purpose & Technical Implementation |
| :--- | :--- | :--- |
| **Framework** | `React 18.3.1` | Component-based interactive UI architecture. |
| **Build Tool & Bundler** | `Vite 5.4.21` | Lightning-fast dev server with HMR and optimized production bundling (900ms build times). |
| **Styling & CSS** | `TailwindCSS v3.4` + Vanilla CSS | Utility-first responsive layouts, glassmorphism (`glass-panel`), and custom color tokens. |
| **Animation Engine** | `Framer Motion 11.3` | GPU-accelerated micro-animations (`SPRING`, `DURATION`, SVG data stream animations, drawer transitions). |
| **Typography** | `Inter`, `SFMono-Regular`, `IBM Plex Mono` | Crisp sans-serif and tabular monospace fonts matching Stripe & Fintech design standards. |
| **State Management** | React `useState` & `useEffect` + `localStorage` | System state, 5000ms Supabase auto-sync interval, 1-click theme persistence (`light`/`dark`). |

---

### ⚙️ B. Backend Orchestration & Microservices Layer

| Technology | Service | Purpose & Technical Implementation |
| :--- | :--- | :--- |
| **Workflow Engine** | `n8n Cloud` | Visual multi-workflow microservices pipeline executing asynchronous payment evaluations. |
| **Workflow A** | `workflow-a-kill-switch-api.json` | Public Webhook (`POST /webhook/kill-switch`) -> Updates `policies.is_frozen` in Supabase & logs `SYSTEM` event. |
| **Workflow B** | `workflow-b-ai-agent.json` | Public Webhook (`POST /webhook/ai-agent`) -> Enforces **Checkpoint 1** (Freeze Guard) & invokes Gemini. |
| **Workflow C** | `workflow-c-authorization-middleware.json` | Internal Trigger -> Enforces **Checkpoint 2** (Allowlist/Cap) & **Checkpoint 3** (Race Guard). |
| **Workflow D** | `workflow-d-payment-executor.json` | Internal Trigger -> Enforces **Checkpoint 4** (Pre-Stripe Guard) & calls Stripe `/v1/payment_intents`. |

---

### 🧠 C. Artificial Intelligence & LLM Layer

| Component | Provider / Model | Security Scope & Implementation |
| :--- | :--- | :--- |
| **LLM Engine** | `Gemini 2.5 Flash` | Natural language prompt parser extracting structured JSON (`{ recipient, amount }`). |
| **Credential Scope** | Gemini API Key ONLY | Isolated exclusively inside Workflow B. **0 Database write access**, **0 Stripe access** (ADR-001). |
| **Prompt Injection Protection** | System Guard Prompt | Forces JSON schema validation and rejects malicious prompt injection payloads. |

---

### 💾 D. Database & Persistence Layer

| Technology | Service Provider | Schema & Data Tables |
| :--- | :--- | :--- |
| **Database** | `Supabase Postgres` | High-availability PostgreSQL database connected via REST API & Service Role keys. |
| **Table 1: `policies`** | Policy Store | Holds system circuit breaker status (`is_frozen: boolean`, `daily_limit: numeric`, `spent_today: numeric`). |
| **Table 2: `allowlist`** | Counterparty Store | Holds pre-approved counterparty addresses (`name`, `address: string`). |
| **Table 3: `transaction_logs`** | Immutable Audit Ledger | Auditable log of all agent calls and system actions (`recipient`, `amount`, `status`, `reason`, `payment_id`). |

---

### 💳 E. Payment Rails & Financial Integration

| Technology | API Endpoint | Security & Execution Standard |
| :--- | :--- | :--- |
| **Payment Processor** | `Stripe API (Test Mode)` | Real test payment rail execution creating verified PaymentIntents. |
| **API Endpoint** | `POST https://api.stripe.com/v1/payment_intents` | Invoked strictly by Workflow D upon passing Checkpoint 4. |
| **Idempotency Guard** | `Stripe-Idempotency-Key` Header | Passes `request_id` to prevent duplicate charges on retries (ADR-005). |

---

### 🛡️ F. Security & Governance Layer

| Feature | Implementation Mechanism | SLA / Standard |
| :--- | :--- | :--- |
| **Emergency Stop Latency** | Webhook Mutation | Instantly updates `policies.is_frozen` in **< 50 milliseconds**. |
| **Zero-Trust Privilege Separation** | Credential Isolation | No single workflow holds all keys. Gemini key, Supabase key, and Stripe key are completely isolated. |
| **Multi-Stage Checkpoints** | Checkpoints 1, 2, 3, 4 | Fails fast at the earliest illegal state before invoking external APIs. |

---

### 🧪 G. Testing, Verification & Tooling

| Tool | Purpose |
| :--- | :--- |
| **Puppeteer Core** | Headless Chrome automated screenshot capture for visual regression testing (`capture_qa_screenshots.cjs`). |
| **Git & GitHub** | Version control & remote repository hosting (`https://github.com/Abhijit5011/kill-switch.git`). |
| **Node.js (v20+)** | Local JavaScript runtime executing build commands and verification scripts. |

---

## 3. Summary Tech Matrix

```
┌─────────────────┬───────────────────────────────────────────────────────────┐
│ Layer           │ Technology Selection                                      │
├─────────────────┼───────────────────────────────────────────────────────────┤
│ Frontend        │ React 18 + Vite 5 + TailwindCSS + Framer Motion          │
│ Themes          │ 1-Click Stripe Light Mode (#F8FAFC) / Cyber Dark (#0A0A0A)│
│ Middleware      │ n8n Cloud (Workflows A, B, C, D)                          │
│ AI Engine       │ Gemini 2.5 Flash (Isolated in Workflow B)                 │
│ Database        │ Supabase Postgres (Rest API & Audit Logging)              │
│ Payments        │ Stripe Test API (/v1/payment_intents with Idempotency)    │
│ Security        │ 4 Enforced Checkpoints + 3D Physical Emergency Stop       │
└─────────────────┴───────────────────────────────────────────────────────────┘
```
