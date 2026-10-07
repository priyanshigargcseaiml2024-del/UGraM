# UGraM Prototype

UGraM is a simulation-based learning prototype for grassroots and rural entrepreneurs.

It delivers a practical learning loop:

**Scenario → Decision → Consequence → Feedback → Try again**

## What this prototype includes

- Public landing experience and onboarding profile flow
- Returning-user dashboard with persisted profile and progress
- Deterministic recommendations (profile + performance based, no AI claim)
- Three simulations:
  - **Market Day** (pricing, demand, inventory, reserve)
  - **Bank Visit** (loan, repayment, investment, reserve, risk)
  - **Virtual Shop Ledger** (sales, purchases, expenses, cash flow, profit/loss)
- Result feedback linked directly to user decisions
- Attempt history, milestones, and review/try-again behavior
- localStorage persistence with schema versioning and normalization
- Optional browser-native **Listen to Tip** (speech synthesis)

## Tech stack

- React + TypeScript + Vite
- Local browser storage (`localStorage`) for prototype persistence

## Local setup

```bash
npm install
npm run dev
```

Open the printed local URL (usually `http://localhost:5173`).

## Scripts

```bash
npm run dev       # Start local development server
npm run typecheck # TypeScript typecheck
npm run test      # Run unit tests (Vitest)
npm run build     # Typecheck + production build
npm run preview   # Preview production build
```

## Prototype limitations

- Authentication is prototype-only; there is no backend auth service.
- Data is stored only in the current browser and device.
- Recommendations are deterministic logic rules; this prototype does not use AI services.
- Simulations support learning practice and are not financial advice.
