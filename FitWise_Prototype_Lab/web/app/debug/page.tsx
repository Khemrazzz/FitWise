"use client";

import { FormEvent, useMemo, useState } from "react";

const defaultProfile = {
  age: 28,
  gender: "Male",
  weightKg: 79,
  heightM: 1.78,
  fatPercentage: 21,
  workoutFrequency: 4,
  experienceLevelNumber: 2,
  experienceLevel: "intermediate",
  bmi: 24.9,
  goal: "muscle_gain",
  daysPerWeek: 4,
  sessionDurationMinutes: 50,
  equipment: ["dumbbells", "cable_machine", "lat_pulldown", "leg_press", "barbell", "stationary_bike", "treadmill"],
  restrictions: [],
};

type Result = any;

export default function Home() {
  const [profile, setProfile] = useState<any>(defaultProfile);
  const [prediction, setPrediction] = useState<Result>(null);
  const [ruleResult, setRuleResult] = useState<Result>(null);
  const [aiResult, setAiResult] = useState<Result>(null);
  const [comparison, setComparison] = useState<Result>(null);
  const [loading, setLoading] = useState("");
  const [error, setError] = useState("");

  const enriched = useMemo(() => ({
    ...profile,
    predictedWorkoutType: prediction?.predictedWorkoutType,
  }), [profile, prediction]);

  const update = (key: string, value: any) => setProfile((p: any) => ({ ...p, [key]: value }));

  async function call(url: string, body: any) {
    const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    let json: any;
    try {
      json = await res.json();
    } catch {
      // Body could not be read/parsed (e.g. an aborted or already-consumed
      // stream) -- surface the HTTP status instead of a cryptic parse error.
      throw new Error(`Request failed with status ${res.status}${res.status === 429 ? " (rate limited -- try again shortly)" : ""}.`);
    }
    if (!res.ok) throw new Error(json.error ?? json.detail ?? `Request failed with status ${res.status}.`);
    return json;
  }

  async function predict(e?: FormEvent) {
    e?.preventDefault();
    setLoading("model"); setError("");
    try {
      const result = await call("/api/model/predict", profile);
      setPrediction(result); setRuleResult(null); setAiResult(null); setComparison(null);
    } catch (err) { setError(err instanceof Error ? err.message : "Prediction failed"); }
    finally { setLoading(""); }
  }

  async function runRules() {
    if (!prediction) return setError("Run the ML model first.");
    setLoading("rules"); setError("");
    try { setRuleResult(await call("/api/rules/generate", enriched)); }
    catch (err) { setError(err instanceof Error ? err.message : "Rule generation failed"); }
    finally { setLoading(""); }
  }

  async function runAi() {
    if (!prediction) return setError("Run the ML model first.");
    setLoading("ai"); setError("");
    try { setAiResult(await call("/api/ai/generate", enriched)); }
    catch (err) { setError(err instanceof Error ? err.message : "AI generation failed"); }
    finally { setLoading(""); }
  }

  async function compare() {
    if (!prediction) return setError("Run the ML model first.");
    setLoading("compare"); setError("");
    try { setComparison(await call("/api/compare", enriched)); }
    catch (err) { setError(err instanceof Error ? err.message : "Comparison failed"); }
    finally { setLoading(""); }
  }

  return <main className="container">
    <section className="hero">
      <span className="badge">FYP EXPERIMENT LAB</span>
      <h1>FitWise Prototype Lab</h1>
      <p>Run the Python workout-category model first, then send the exact same prediction and member profile to the deterministic Rule-Based Generator and the Gemini Generator. The validator scores both plans against the same hard constraints.</p>
    </section>

    <div className="grid">
      <form className="card" onSubmit={predict}>
        <h2>Test Member</h2>
        <div className="row"><label>Age<input type="number" value={profile.age} onChange={e=>update("age", +e.target.value)} /></label><label>Gender<select value={profile.gender} onChange={e=>update("gender", e.target.value)}><option>Male</option><option>Female</option></select></label></div>
        <div className="row"><label>Weight kg<input type="number" step="0.1" value={profile.weightKg} onChange={e=>update("weightKg", +e.target.value)} /></label><label>Height m<input type="number" step="0.01" value={profile.heightM} onChange={e=>update("heightM", +e.target.value)} /></label></div>
        <div className="row"><label>Body fat %<input type="number" step="0.1" value={profile.fatPercentage} onChange={e=>update("fatPercentage", +e.target.value)} /></label><label>BMI<input type="number" step="0.1" value={profile.bmi} onChange={e=>update("bmi", +e.target.value)} /></label></div>
        <div className="row"><label>Dataset workout frequency<input type="number" min="1" max="7" value={profile.workoutFrequency} onChange={e=>update("workoutFrequency", +e.target.value)} /></label><label>Experience<select value={profile.experienceLevel} onChange={e=>{ const val=e.target.value; update("experienceLevel", val); update("experienceLevelNumber", val==="beginner"?1:val==="intermediate"?2:3); }}><option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option></select></label></div>
        <label>Fitness goal<select value={profile.goal} onChange={e=>update("goal", e.target.value)}><option value="weight_loss">Weight loss</option><option value="muscle_gain">Muscle gain</option><option value="endurance">Endurance</option><option value="general_fitness">General fitness</option><option value="flexibility">Flexibility</option></select></label>
        <div className="row"><label>Plan days/week<input type="number" min="1" max="7" value={profile.daysPerWeek} onChange={e=>update("daysPerWeek", +e.target.value)} /></label><label>Minutes/session<input type="number" min="15" max="120" value={profile.sessionDurationMinutes} onChange={e=>update("sessionDurationMinutes", +e.target.value)} /></label></div>
        <label>Equipment (comma separated)<input value={profile.equipment.join(",")} onChange={e=>update("equipment", e.target.value.split(",").map(s=>s.trim()).filter(Boolean))} /></label>
        <label>Restriction tags (comma separated)<input value={profile.restrictions.join(",")} placeholder="knee_high_load,avoid_high_impact" onChange={e=>update("restrictions", e.target.value.split(",").map(s=>s.trim()).filter(Boolean))} /></label>
        <div className="actions">
          <button disabled={!!loading}>{loading==="model"?"Running model...":"1. Run ML Model"}</button>
          <button type="button" className="secondary" onClick={runRules} disabled={!!loading || !prediction}>{loading==="rules"?"Generating...":"2A. Rule-Based Generator"}</button>
          <button type="button" className="teal" onClick={runAi} disabled={!!loading || !prediction}>{loading==="ai"?"Generating...":"2B. Gemini Generator"}</button>
          <button type="button" className="dark" onClick={compare} disabled={!!loading || !prediction}>{loading==="compare"?"Comparing...":"3. Compare Both"}</button>
        </div>
        <p className="small">Restriction tags used by the sample catalogue include <b>knee_high_load</b>, <b>avoid_high_impact</b> and <b>lower_back_bending</b>.</p>
      </form>

      <section className="results">
        {error && <div className="error"><b>Error:</b> {error}</div>}
        <div className="resultGrid">
          <div className="resultCard"><span className="badge">MODEL</span><h3>Python ML</h3>{prediction ? <><div className="metric">{prediction.predictedWorkoutType}</div><p>Confidence: <b>{prediction.confidence == null ? "n/a" : `${Math.round(prediction.confidence*100)}%`}</b></p><pre>{JSON.stringify(prediction, null, 2)}</pre></> : <p className="small">Start FastAPI and run the model first.</p>}</div>
          <div className="resultCard"><span className="badge">BASELINE</span><h3>Rule-Based</h3>{ruleResult ? <><div className={`metric ${ruleResult.validation.valid?"good":"bad"}`}>{ruleResult.validation.score}%</div><p>Constraint score · {ruleResult.latencyMs} ms</p><pre>{JSON.stringify(ruleResult, null, 2)}</pre></> : <p className="small">Deterministic, repeatable plan generation from the approved catalogue.</p>}</div>
          <div className="resultCard"><span className="badge">AI</span><h3>Gemini</h3>{aiResult ? <><div className={`metric ${aiResult.validation.valid?"good":"bad"}`}>{aiResult.validation.score}%</div><p>Constraint score · {aiResult.latencyMs} ms</p><pre>{JSON.stringify(aiResult, null, 2)}</pre></> : <p className="small">Requires GEMINI_API_KEY. Gemini receives the same profile and approved exercise catalogue.</p>}</div>
        </div>
        {comparison && <div className="card"><h2>Head-to-Head Comparison</h2><div className="resultGrid"><div><span className="badge">RULES</span><div className="metric">{comparison.comparison.ruleConstraintScore}%</div><p>{comparison.comparison.ruleLatencyMs} ms</p></div><div><span className="badge">GEMINI</span><div className="metric">{comparison.comparison.geminiConstraintScore}%</div><p>{comparison.comparison.geminiLatencyMs} ms</p></div><div><span className="badge">RESEARCH NOTE</span><p className="small">{comparison.comparison.note}</p></div></div><pre>{JSON.stringify(comparison, null, 2)}</pre></div>}
      </section>
    </div>
  </main>;
}
