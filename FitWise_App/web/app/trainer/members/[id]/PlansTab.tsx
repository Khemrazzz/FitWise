"use client";

import { useState } from "react";
import type { WorkoutDay } from "@/lib/types";

export function PlansTab({
  memberId,
  assessments,
  predictions,
  plans,
  onChanged,
}: {
  memberId: string;
  assessments: Array<Record<string, unknown>>;
  predictions: Array<Record<string, unknown>>;
  plans: Array<Record<string, unknown>>;
  onChanged: () => void;
}) {
  const [assessmentId, setAssessmentId] = useState(assessments[0]?.id as string | undefined);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function generate() {
    if (!assessmentId) return;
    setPending(true);
    setError("");
    const res = await fetch("/api/plans/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assessmentId }),
    });
    const json = await res.json();
    setPending(false);
    if (!res.ok) {
      setError(json.error ?? "Plan generation failed");
      return;
    }
    onChanged();
  }

  const hasPrediction = predictions.some((p) => p.assessment_id === assessmentId);

  return (
    <div>
      <div className="page-head">
        <div>
          <h2 style={{ fontSize: 20, margin: 0 }}>Workout Plan Generator</h2>
          <div className="muted small">Generates a rule-based plan and a Gemini-assisted plan from the same profile and prediction, then validates both.</div>
        </div>
        <div className="action-row">
          <select className="select" style={{ width: "auto" }} value={assessmentId} onChange={(e) => setAssessmentId(e.target.value)}>
            {assessments.map((a) => (
              <option key={a.id as string} value={a.id as string}>
                {new Date(a.created_at as string).toLocaleDateString()} · {(a.goal as string)?.replaceAll("_", " ")}
              </option>
            ))}
          </select>
          <button className="button primary small-button" onClick={generate} disabled={pending || !assessmentId}>
            {pending ? "Generating..." : "⚙ Generate Plan"}
          </button>
        </div>
      </div>
      {!hasPrediction && <div className="warning-banner">Run a prediction for this assessment first (Predictions tab).</div>}
      {error && <p style={{ color: "var(--red)" }}>{error}</p>}

      {plans.length === 0 ? (
        <p className="muted small">No plans generated yet.</p>
      ) : (
        plans.map((plan) => <PlanCard key={plan.id as string} plan={plan} onChanged={onChanged} />)
      )}
    </div>
  );
}

function PlanCard({ plan, onChanged }: { plan: Record<string, unknown>; onChanged: () => void }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [reason, setReason] = useState("");
  const validation = plan.validation as { valid: boolean; score: number; violations: string[] };
  const days = plan.days as WorkoutDay[];
  const status = plan.status as string;

  async function approve() {
    setPending(true);
    setError("");
    const res = await fetch(`/api/plans/${plan.id}/approve`, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
    const json = await res.json();
    setPending(false);
    if (!res.ok) return setError(json.error ?? "Approval failed");
    onChanged();
  }

  async function reject() {
    if (!reason) return setError("A reason is required to reject a plan.");
    setPending(true);
    setError("");
    const res = await fetch(`/api/plans/${plan.id}/reject`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason }),
    });
    const json = await res.json();
    setPending(false);
    if (!res.ok) return setError(json.error ?? "Rejection failed");
    onChanged();
  }

  return (
    <div className="card" style={{ marginTop: 13 }}>
      <div className="page-head">
        <div>
          <h3 style={{ margin: 0 }}>
            {plan.plan_name as string}{" "}
            <span className={`status${status === "rejected" ? " danger" : status === "draft" ? " warning" : ""}`}>{status}</span>
          </h3>
          <div className="muted small">
            {plan.generator === "gemini" ? "Gemini-assisted" : "Deterministic rule-based"} · validation:{" "}
            {validation.valid ? "valid" : "invalid"} ({validation.score}%)
          </div>
        </div>
        {status === "draft" && (
          <div className="action-row">
            <input className="input" style={{ width: 220 }} placeholder="Reason (required to reject)" value={reason} onChange={(e) => setReason(e.target.value)} />
            <button className="button danger small-button" onClick={reject} disabled={pending}>
              Reject
            </button>
            <button className="button primary small-button" onClick={approve} disabled={pending || !validation.valid}>
              Approve
            </button>
          </div>
        )}
      </div>
      {error && <p style={{ color: "var(--red)" }}>{error}</p>}
      {!validation.valid && validation.violations.length > 0 && (
        <div className="warning-banner" style={{ marginBottom: 10 }}>
          {validation.violations.slice(0, 3).join("; ")}
          {validation.violations.length > 3 ? ` (+${validation.violations.length - 3} more)` : ""} — approval is blocked until valid.
        </div>
      )}
      <div className="week-grid">
        {days.map((day) => (
          <div className="day-card" key={day.day}>
            <b>Day {day.day}</b>
            <h4 style={{ color: "var(--blue)", margin: "6px 0 8px" }}>{day.title}</h4>
            {day.exercises.map((e, i) => (
              <div className="exercise-item" key={i}>
                {e.exerciseId} {e.sets ? `· ${e.sets}×${e.reps}` : e.durationMinutes ? `· ${e.durationMinutes} min` : ""}
              </div>
            ))}
            <p className="muted small">{day.estimatedDurationMinutes} min</p>
          </div>
        ))}
      </div>
    </div>
  );
}
