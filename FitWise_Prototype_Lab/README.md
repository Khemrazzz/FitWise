# FitWise Prototype Lab

This repository contains the **three prototypes** needed before the full FitWise application is built:

1. **Python ML prototype** — predicts the workout category (`Cardio`, `Strength`, `HIIT`, `Yoga`).
2. **Deterministic rule-based workout generator** — converts the ML category + user constraints into a weekly plan.
3. **Gemini AI workout generator** — receives the *same profile and same approved exercise catalogue* and generates a structured weekly plan.
4. **Comparison endpoint/UI** — compares Rule-Based vs Gemini on constraint compliance, plan validity and latency.

The design intentionally keeps the experiment fair: the ML prediction is produced once, then both generators receive the **same prediction, user profile and approved exercise catalogue**.

## Architecture

```text
User profile
    |
    v
Python ML model (FastAPI)
    |
    | predicted workout category + confidence
    v
Next.js prototype lab
    |
    +------------------------+
    |                        |
    v                        v
Rule-Based Generator     Gemini Generator
    |                        |
    +-----------+------------+
                |
                v
      Deterministic Validator
                |
                v
         Comparison Results
```

## Folder structure

```text
FitWise_Prototype_Lab/
├── ml/
│   ├── train.py
│   ├── app.py
│   ├── requirements.txt
│   ├── data/
│   │   └── README.md
│   └── artifacts/
└── web/
    ├── app/
    │   ├── page.tsx        <- guided client-facing demo (start here)
    │   └── debug/page.tsx  <- raw developer test harness
    ├── lib/
    ├── next.config.js
    ├── package.json
    ├── .env.example
    └── tsconfig.json
```

## Prerequisites

- Python 3.12+ (with `venv` support)
- Node.js 22+ and npm
- The dataset file `gym_members_exercise_tracking.csv` (Kaggle "Gym Members Exercise Dataset" — see `ml/data/README.md`)
- A Gemini API key (get one at https://ai.google.dev/) — the free tier is capped at 20 requests, so a billed key is recommended for repeated demo use

## 1. Start the ML API

```bash
cd ml
python -m venv .venv
```

Windows:

```bash
.venv\Scripts\activate
```

macOS/Linux:

```bash
source .venv/bin/activate
```

Install and train:

```bash
pip install -r requirements.txt
python train.py
```

This creates `ml/artifacts/workout_pipeline.joblib`, `model_metadata.json` and `model_results.json`.

Start the inference API:

```bash
uvicorn app:app --host 127.0.0.1 --port 8000
```

- API base: `http://127.0.0.1:8000`
- Interactive docs: `http://127.0.0.1:8000/docs`

Leave this running in its own terminal.

## 2. Start the web app

In a second terminal:

```bash
cd web
npm install
```

Copy the environment file and fill in your own keys:

```bash
cp .env.example .env.local
```

Windows PowerShell:

```powershell
Copy-Item .env.example .env.local
```

Edit `.env.local` and set at minimum:

```text
ML_API_URL=http://127.0.0.1:8000
GEMINI_API_KEY=your_own_key_here
GEMINI_MODEL=gemini-3.6-flash
```

Then start the dev server **on port 3001**, not the default 3000:

```bash
npm run dev -- -p 3001
```

Open:

```text
http://localhost:3001
```

> **Why port 3001 and not 3000:** Next.js's dev server blocks cross-origin requests to its own JavaScript bundles by default, trusting only the literal hostname `localhost`. Port 3001 avoids clashing with other local dev servers. `next.config.js` also whitelists `127.0.0.1` via `allowedDevOrigins`, so both `http://localhost:3001` and `http://127.0.0.1:3001` work correctly.

## What you'll see

- **`http://localhost:3001`** — the guided demo: pick a sample member, click "Run FitWise Demo," and watch the ML prediction, both generated plans, and the head-to-head comparison render live. This is the one to show a client or examiner.
- **`http://localhost:3001/debug`** — the raw developer harness: a full manual form and separate buttons for each pipeline stage, showing raw JSON responses. Useful for troubleshooting, not for demos.

## Important research rule

Do **not** compare the rule system with Gemini using different exercise pools. Both systems should receive the same approved catalogue. Otherwise the experiment changes more than one variable and becomes weaker academically.

## Suggested FYP experiment

Create 15–30 fixed test profiles covering:

- beginner/intermediate/advanced;
- weight loss/muscle gain/endurance/general fitness/flexibility;
- 2–5 days per week;
- 20–75 minute sessions;
- no equipment/dumbbells/full gym;
- no restrictions/knee sensitivity/lower-back sensitivity/high-impact restriction.

Run every profile through both systems. For Gemini, repeat each profile 3 times and measure stability.

Suggested metrics:

- constraint satisfaction rate;
- invalid exercise IDs;
- equipment violations;
- restriction violations;
- requested-day compliance;
- session-duration compliance;
- plan diversity;
- response latency;
- reproducibility;
- trainer/user rating (later UAT).

**Do not use prototype numbers as final dissertation results.** Final results must come from the actual executed experiments.

## Known limitations (for context, not hidden)

- The ML model performs near chance level on this dataset (see `ml/artifacts/model_results.json`) — this is a documented, honest finding, not a bug.
- Gemini's dominant failure mode is producing out-of-range numeric values (e.g. absurd `sets` counts); the validator catches this, but expect occasional invalid Gemini plans even with a working API key.
- There is no database or authentication in this prototype — nothing persists between runs.
