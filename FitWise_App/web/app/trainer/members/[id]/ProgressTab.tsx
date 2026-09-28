"use client";

import { useEffect, useState } from "react";

interface Progress {
  baselineWeightKg: number;
  targetWeightKg: number;
  projections: { month1: number; month2: number; month3: number };
  adherenceFactor: number;
  assumptions: string[];
  disclaimer: string;
  completedDays: number;
  totalDays: number;
}

export function ProgressTab({ memberId }: { memberId: string }) {
  const [progress, setProgress] = useState<Progress | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/members/${memberId}/progress`)
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.error);
        setProgress(json);
      })
      .catch((e) => setError(e.message));
  }, [memberId]);

  if (error) return <div className="warning-banner">{error}</div>;
  if (!progress) return <p className="muted small">Loading progress...</p>;

  return (
    <div>
      <div className="grid six">
        {[
          ["Current weight", `${progress.baselineWeightKg} kg`],
          ["Target weight", `${progress.targetWeightKg} kg`],
          ["1-month estimate", `${progress.projections.month1} kg`],
          ["2-month estimate", `${progress.projections.month2} kg`],
          ["3-month estimate", `${progress.projections.month3} kg`],
          ["Adherence factor", `${Math.round(progress.adherenceFactor * 100)}%`],
        ].map(([label, value]) => (
          <div className="card" key={label}>
            <span className="kpi-label">{label}</span>
            <span className="kpi-value">{value}</span>
          </div>
        ))}
      </div>
      <div className="card" style={{ marginTop: 13 }}>
        <h3>Assumptions</h3>
        <ul className="small muted">
          {progress.assumptions.map((a, i) => (
            <li key={i}>{a}</li>
          ))}
        </ul>
        <p className="muted small">
          Based on {progress.completedDays} of {progress.totalDays} planned days completed so far.
        </p>
      </div>
      <div className="warning-banner" style={{ marginTop: 13 }}>
        <strong>Projection assumptions:</strong> {progress.disclaimer}
      </div>
    </div>
  );
}
