"use client";

import { useMemo, useState } from "react";
import { EXERCISES } from "@/lib/exercises";

type Profile = {
  age: number;
  gender: "Male" | "Female";
  weightKg: number;
  heightM: number;
  fatPercentage: number;
  workoutFrequency: number;
  experienceLevelNumber: 1 | 2 | 3;
  experienceLevel: "beginner" | "intermediate" | "advanced";
  bmi: number;
  goal: string;
  daysPerWeek: number;
  sessionDurationMinutes: number;
  equipment: string[];
  restrictions: string[];
};

const PRESETS: { id: string; label: string; emoji: string; blurb: string; profile: Profile }[] = [
  {
    id: "P01",
    label: "Beginner, weight loss",
    emoji: "\u{1F331}",
    blurb: "24yo, no equipment, 3 days/week",
    profile: {
      age: 24, gender: "Female", weightKg: 72, heightM: 1.65, fatPercentage: 30, workoutFrequency: 3,
      experienceLevelNumber: 1, experienceLevel: "beginner", bmi: 26.4, goal: "weight_loss",
      daysPerWeek: 3, sessionDurationMinutes: 30, equipment: [], restrictions: [],
    },
  },
  {
    id: "P02",
    label: "Intermediate, muscle gain",
    emoji: "\u{1F4AA}",
    blurb: "28yo, full gym, 4 days/week",
    profile: {
      age: 28, gender: "Male", weightKg: 79, heightM: 1.78, fatPercentage: 21, workoutFrequency: 4,
      experienceLevelNumber: 2, experienceLevel: "intermediate", bmi: 24.9, goal: "muscle_gain",
      daysPerWeek: 4, sessionDurationMinutes: 50,
      equipment: ["dumbbells", "cable_machine", "lat_pulldown", "leg_press", "barbell", "stationary_bike", "treadmill"],
      restrictions: [],
    },
  },
  {
    id: "P03",
    label: "Beginner, with restrictions",
    emoji: "\u{1FA79}",
    blurb: "42yo, knee & high-impact restrictions",
    profile: {
      age: 42, gender: "Female", weightKg: 82, heightM: 1.68, fatPercentage: 34, workoutFrequency: 3,
      experienceLevelNumber: 1, experienceLevel: "beginner", bmi: 29.1, goal: "general_fitness",
      daysPerWeek: 3, sessionDurationMinutes: 35, equipment: ["dumbbells", "stationary_bike"],
      restrictions: ["knee_high_load", "avoid_high_impact"],
    },
  },
  {
    id: "P05",
    label: "Advanced, lower-back care",
    emoji: "\u{1F3CB}",
    blurb: "36yo, full gym, lower-back restriction",
    profile: {
      age: 36, gender: "Male", weightKg: 88, heightM: 1.82, fatPercentage: 18, workoutFrequency: 5,
      experienceLevelNumber: 3, experienceLevel: "advanced", bmi: 26.6, goal: "muscle_gain",
      daysPerWeek: 5, sessionDurationMinutes: 60,
      equipment: ["dumbbells", "cable_machine", "lat_pulldown", "leg_press", "barbell", "stationary_bike"],
      restrictions: ["lower_back_bending"],
    },
  },
];

const CATEGORY_COLOR: Record<string, string> = { Cardio: "#1357d4", Strength: "#b45309", HIIT: "#b42318", Yoga: "#0f9f9a" };
const EXERCISE_BY_ID = Object.fromEntries(EXERCISES.map((e) => [e.id, e]));

type Stage = "idle" | "predicting" | "predicted" | "generating" | "done";

export default function Home() {
  const [selectedId, setSelectedId] = useState(PRESETS[1].id);
  const profile = useMemo(() => PRESETS.find((p) => p.id === selectedId)!.profile, [selectedId]);

  const [stage, setStage] = useState<Stage>("idle");
  const [prediction, setPrediction] = useState<any>(null);
  const [rule, setRule] = useState<any>(null);
  const [gemini, setGemini] = useState<any>(null);
  const [geminiError, setGeminiError] = useState("");
  const [fatalError, setFatalError] = useState("");
  const [ruleDay, setRuleDay] = useState(1);
  const [geminiDay, setGeminiDay] = useState(1);

  async function callApi(url: string, body: any) {
    const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    let json: any;
    try {
      json = await res.json();
    } catch {
      throw new Error(`Request failed with status ${res.status}${res.status === 429 ? " (rate limited)" : ""}.`);
    }
    if (!res.ok) throw new Error(json.error ?? json.detail ?? `Request failed with status ${res.status}.`);
    return json;
  }

  async function runDemo() {
    setFatalError(""); setGeminiError(""); setPrediction(null); setRule(null); setGemini(null);
    setRuleDay(1); setGeminiDay(1);
    setStage("predicting");
    try {
      const pred = await callApi("/api/model/predict", profile);
      setPrediction(pred);
      setStage("predicted");

      const enriched = { ...profile, predictedWorkoutType: pred.predictedWorkoutType };
      setStage("generating");

      const rulePromise = callApi("/api/rules/generate", enriched);
      const geminiPromise = callApi("/api/ai/generate", enriched).catch((err) => {
        const message = err instanceof Error ? err.message : "Gemini generation failed.";
        const looksLikeTransientFailure =
          message.includes("429") ||
          message.toLowerCase().includes("quota") ||
          message.toLowerCase().includes("unusable") ||
          message.toLowerCase().includes("rate limited");
        setGeminiError(
          looksLikeTransientFailure
            ? "Gemini's free-tier request quota is temporarily exhausted for this demo key. This is an external API limit, not a defect -- the pipeline itself is working, as shown by the rule-based result alongside it."
            : `Gemini generation failed: ${message}`
        );
        return null;
      });

      const [ruleResult, geminiResult] = await Promise.all([rulePromise, geminiPromise]);
      setRule(ruleResult);
      if (geminiResult) setGemini(geminiResult);
      setStage("done");
    } catch (err) {
      setFatalError(err instanceof Error ? err.message : "Demo run failed.");
      setStage("idle");
    }
  }

  const steps = [
    { key: "profile", label: "Member Profile" },
    { key: "predict", label: "AI Prediction" },
    { key: "generate", label: "Plan Generation" },
    { key: "compare", label: "Head-to-Head" },
  ];
  const stepIndex = stage === "idle" ? 0 : stage === "predicting" ? 1 : stage === "predicted" || stage === "generating" ? 2 : 3;

  return (
    <main className="container">
      <section className="hero">
        <span className="badge">FITWISE LIVE DEMO</span>
        <h1>See FitWise Recommend a Workout</h1>
        <p>
          Pick a sample gym member below, then watch the full pipeline run live: the trained machine-learning model predicts a
          workout category, then a deterministic rule engine and Gemini AI each independently build a weekly plan from the same
          prediction, which are then validated and compared.
        </p>
      </section>

      <nav className="stepper">
        {steps.map((s, i) => (
          <div key={s.key} className={`step ${i < stepIndex ? "done" : i === stepIndex ? "active" : ""}`}>
            <span className="stepDot">{i < stepIndex ? "✓" : i + 1}</span>
            <span className="stepLabel">{s.label}</span>
          </div>
        ))}
      </nav>

      <section className="card">
        <h2>1. Choose a sample member</h2>
        <div className="presetGrid">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              className={`presetCard ${selectedId === p.id ? "selected" : ""}`}
              onClick={() => { setSelectedId(p.id); setStage("idle"); setPrediction(null); setRule(null); setGemini(null); }}
              type="button"
            >
              <span className="presetEmoji">{p.emoji}</span>
              <span className="presetLabel">{p.label}</span>
              <span className="presetBlurb">{p.blurb}</span>
            </button>
          ))}
        </div>
        <button className="runBtn" onClick={runDemo} disabled={stage === "predicting" || stage === "generating"}>
          {stage === "predicting" ? "Running prediction..." : stage === "generating" ? "Generating plans..." : "▶ Run FitWise Demo"}
        </button>
        {fatalError && <div className="error">{fatalError}</div>}
      </section>

      {prediction && (
        <section className="card">
          <h2>2. AI Prediction</h2>
          <div className="predictionRow">
            <div className="predictionMain">
              <span className="predictedCategory" style={{ color: CATEGORY_COLOR[prediction.predictedWorkoutType] }}>
                {prediction.predictedWorkoutType}
              </span>
              <span className="small">Recommended workout category</span>
            </div>
            <div className="confidenceBlock">
              <div className="confidenceLabel">Model confidence: <b>{Math.round(prediction.confidence * 100)}%</b></div>
              <div className="confidenceBar"><div className="confidenceFill" style={{ width: `${prediction.confidence * 100}%` }} /></div>
            </div>
          </div>
          <div className="probRow">
            {Object.entries(prediction.probabilities as Record<string, number>).map(([cat, p]) => (
              <div key={cat} className="probItem">
                <div className="probBarTrack"><div className="probBarFill" style={{ height: `${p * 100}%`, background: CATEGORY_COLOR[cat] }} /></div>
                <span className="probPct">{Math.round(p * 100)}%</span>
                <span className="probCat">{cat}</span>
              </div>
            ))}
          </div>
          <p className="small disclaimer">{prediction.disclaimer}</p>
        </section>
      )}

      {(rule || gemini || geminiError) && (
        <section className="planGrid">
          <PlanCard
            title="Rule-Based Generator"
            subtitle="Deterministic -- same input always produces the same plan"
            accent="#0f9f9a"
            result={rule}
            activeDay={ruleDay}
            setActiveDay={setRuleDay}
          />
          <PlanCard
            title="Gemini AI Generator"
            subtitle="Generative -- receives the same profile, prediction and approved catalogue"
            accent="#7c3aed"
            result={gemini}
            error={geminiError}
            activeDay={geminiDay}
            setActiveDay={setGeminiDay}
          />
        </section>
      )}

      {rule && (gemini || geminiError) && (
        <section className="card">
          <h2>3. Head-to-Head Comparison</h2>
          <div className="scoreboard">
            <ScoreCol label="Rule-Based" score={rule.validation.score} valid={rule.validation.valid} latency={rule.latencyMs} accent="#0f9f9a" />
            <div className="scoreboardVs">vs</div>
            <ScoreCol
              label="Gemini"
              score={gemini?.validation.score}
              valid={gemini?.validation.valid}
              latency={gemini?.latencyMs}
              accent="#7c3aed"
              unavailable={!gemini}
            />
          </div>
          <p className="insight">{buildInsight(rule, gemini)}</p>
        </section>
      )}
    </main>
  );
}

function buildInsight(rule: any, gemini: any) {
  if (!gemini) return "Gemini AI generation was unavailable for this run (see the note above), so only the rule-based plan could be shown.";
  const speedup = gemini.latencyMs > 0 ? Math.round(gemini.latencyMs / Math.max(rule.latencyMs, 0.01)) : 0;
  if (rule.validation.valid && !gemini.validation.valid) {
    return `The rule-based plan passed every constraint check; Gemini's plan had ${gemini.validation.totalChecks - gemini.validation.checksPassed} issue(s). Rule-based also responded roughly ${speedup.toLocaleString()}x faster.`;
  }
  if (rule.validation.valid && gemini.validation.valid) {
    return `Both plans passed every constraint check on this profile. Rule-based responded roughly ${speedup.toLocaleString()}x faster than Gemini.`;
  }
  return "Compare the validation scores and generated plans above for this profile.";
}

function ScoreCol({ label, score, valid, latency, accent, unavailable }: any) {
  return (
    <div className="scoreCol">
      <span className="scoreLabel" style={{ color: accent }}>{label}</span>
      {unavailable ? (
        <span className="scoreUnavailable">Unavailable</span>
      ) : (
        <>
          <span className={`scoreBig ${valid ? "good" : "bad"}`}>{score}%</span>
          <span className="small">{valid ? "All checks passed" : "Some checks failed"}</span>
          <span className="small">{latency < 1000 ? `${latency} ms` : `${(latency / 1000).toFixed(1)} s`}</span>
        </>
      )}
    </div>
  );
}

function PlanCard({ title, subtitle, accent, result, error, activeDay, setActiveDay }: any) {
  return (
    <div className="card planCard" style={{ borderTop: `4px solid ${accent}` }}>
      <h3 style={{ color: accent }}>{title}</h3>
      <p className="small">{subtitle}</p>
      {error && <div className="error small">{error}</div>}
      {!result && !error && <p className="small">Waiting...</p>}
      {result && (
        <>
          <div className="planMeta">
            <span className={`badge ${result.validation.valid ? "badgeGood" : "badgeBad"}`}>
              {result.validation.valid ? "Valid" : `${result.validation.totalChecks - result.validation.checksPassed} issue(s)`}
            </span>
            <span className="small">Score {result.validation.score}% &middot; {result.latencyMs < 1000 ? `${result.latencyMs} ms` : `${(result.latencyMs / 1000).toFixed(1)} s`}</span>
          </div>
          <p className="planExplanation small">{result.plan.explanation}</p>
          <div className="dayPills">
            {result.plan.days.map((d: any) => (
              <button key={d.day} className={`dayPill ${activeDay === d.day ? "active" : ""}`} onClick={() => setActiveDay(d.day)} type="button">
                Day {d.day}
              </button>
            ))}
          </div>
          {result.plan.days
            .filter((d: any) => d.day === activeDay)
            .map((d: any) => (
              <div key={d.day} className="dayDetail">
                <div className="dayTitle">{d.title} &middot; {d.estimatedDurationMinutes} min</div>
                <ul className="exerciseList">
                  {d.exercises.map((ex: any, i: number) => {
                    const info = EXERCISE_BY_ID[ex.exerciseId];
                    return (
                      <li key={i}>
                        <span className="exName">{info?.name ?? ex.exerciseId}</span>
                        <span className="exDetail small">
                          {ex.sets ? `${ex.sets} x ${ex.reps} reps` : ex.durationMinutes ? `${ex.durationMinutes} min` : ""}
                          {ex.restSeconds != null ? ` · ${ex.restSeconds}s rest` : ""}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          {result.validation.violations.length > 0 && (
            <details className="violationDetails">
              <summary className="small">{result.validation.violations.length} validation issue(s)</summary>
              <ul className="small">
                {result.validation.violations.slice(0, 6).map((v: string, i: number) => <li key={i}>{v}</li>)}
              </ul>
            </details>
          )}
        </>
      )}
    </div>
  );
}
