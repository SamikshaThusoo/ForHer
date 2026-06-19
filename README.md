# Habit Cares — Prototype

Next.js + TypeScript + CSS Modules + Framer Motion. Single-laptop demo of the Habit Cares product.

## Run

cd app
npm install
npm run dev
# open http://localhost:3000

## What this demonstrates

- Habit Health home with the **Your Health Score** card transformed for Cares-enrolled users (State B).
- Tap-through into the Habit Cares experience: Digital Twin, 3 things today, food log (multi-mode), packet scan, Ask Habit AI, Care Team.
- Persona switcher (top chrome) toggles between **Priya** (State B, prediabetic, enrolled) and **Nikhil** (State A, healthy, not enrolled).
- All verdicts and AI replies are **anchored to the persona's lab values**, mocked from the Smart Reports model.

## What is NOT real yet

- Real LLM for Ask Habit (uses seed responses).
- Real Bonhappetee API for nutrition data.
- Wearable sync, cohort screens, mental-health overlay, employer dashboard, coach console.
- All four other programs beyond Prediabetes Reversal.

## Spec
See `/Users/nikhildubey/habit-cares/2026-05-26-habit-cares-product-journey.md`.
