"use client";

import { useState } from "react";

export function PredictionsTab({
  memberId,
  assessments,
  predictions,
  onChanged,
}: {
  memberId: string;
  assessments: Array<Record<string, unknown>>;
  predictions: Array<Record<string, unknown>>;
  onChanged: () => void;
}) {
  const [assessmentId, setAssessmentId] = useState(assessments[0]?.id as string | undefined);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function runPrediction() {
    if (!assessmentId) return;
    setPending(true);
    setError("");
    const res = await fetch(`/api/assessments/${assessmentId}/predict`, { method: "POST" });
    const json = await res.json();
    setPending(false);
    if (!res.ok) {
      setError(json.error ?? "Prediction failed");
      return;
    }
    onChanged();
  }

  const latest = predictions[0] as Record<string, unknown> | undefined;
  const probabilities = (latest?.probabilities as Record<string, number> | undefined) ?? {};

  return (
    <div>
      <div className="page-head">
        <div>
          <h2 style={{ fontSize: 20, margin: 0 }}>Workout-Type Prediction</h2>
          <div className="muted small">Machine-learning recommendation from the recorded fitness data.</div>
        </div>
        <div className="action-row">
          <select className="select" style={{ width: "auto" }} value={assessmentId} onChange={(e) => setAssessmentId(e.target.value)}>
            {assessments.map((a) => (
              <option key={a.id as string} value={a.id as string}>
                {new Date(a.created_at as string).toLocaleDateString()} · {(a.goal as string)?.replaceAll("_", " ")}
              </option>
            ))}
          </select>
          <button className="button primary small-button" onClick={runPrediction} disabled={pending || !assessmentId}>
            {pending ? "Predicting..." : "Run New Prediction"}
          </button>
        </div>
      </div>

      {error && <p style={{ color: "var(--red)" }}>{error}</p>}

      {latest ? (
        <div className="grid three">
          <div className="card" style={{ textAlign: "center" }}>
            <span className="kpi-label">Predicted workout category</span>
            <h2 style={{ color: "var(--blue)", margin: "8px 0" }}>{latest.predicted_category as string}</h2>
            <span className="status">{Math.round((latest.confidence as number) * 100)}% confidence</span>
          </div>
          <div className="card">
            <h3>Alternative probabilities</h3>
            {Object.entries(probabilities)
              .sort((a, b) => b[1] - a[1])
              .map(([category, prob]) => (
                <div key={category} style={{ margin: "10px 0" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }} className="small">
                    <b>{category}</b>
                    <span>{Math.round(prob * 100)}%</span>
                  </div>
                  <div className="factor-bar">
                    <i style={{ width: `${prob * 100}%` }} />
                  </div>
                </div>
              ))}
          </div>
          <div className="card">
            <h3>Model</h3>
            <p className="muted small">
              {latest.model_name as string} ({latest.model_version as string})
            </p>
            <div className="warning-banner">
              <strong>Important:</strong> this is a fitness recommendation based on the available dataset. It is not medical
              advice and does not diagnose injuries or health conditions.
            </div>
          </div>
        </div>
      ) : (
        <p className="muted small">No predictions yet — run one above.</p>
      )}

      <div className="card" style={{ marginTop: 13 }}>
        <h3>Prediction history</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Category</th>
                <th>Confidence</th>
                <th>Model</th>
              </tr>
            </thead>
            <tbody>
              {predictions.length === 0 ? (
                <tr>
                  <td colSpan={4} className="muted">
                    No predictions recorded.
                  </td>
                </tr>
              ) : (
                predictions.map((p) => (
                  <tr key={p.id as string}>
                    <td>{new Date(p.created_at as string).toLocaleString()}</td>
                    <td>{p.predicted_category as string}</td>
                    <td>{Math.round((p.confidence as number) * 100)}%</td>
                    <td>{p.model_version as string}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
