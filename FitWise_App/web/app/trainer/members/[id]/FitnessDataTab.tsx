"use client";

import { useState } from "react";
import type { ExperienceLevel, FitnessGoal, MemberProfile } from "@/lib/types";

const defaultProfile: MemberProfile = {
  age: 28,
  gender: "Male",
  weightKg: 75,
  heightM: 1.75,
  fatPercentage: 20,
  workoutFrequency: 3,
  experienceLevelNumber: 1,
  experienceLevel: "beginner",
  bmi: 24.5,
  goal: "general_fitness",
  daysPerWeek: 3,
  sessionDurationMinutes: 45,
  equipment: [],
  restrictions: [],
};

export function FitnessDataTab({
  memberId,
  assessments,
  onSaved,
}: {
  memberId: string;
  assessments: Array<Record<string, unknown>>;
  onSaved: () => void;
}) {
  const [profile, setProfile] = useState<MemberProfile>(defaultProfile);
  const [notes, setNotes] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  function update<K extends keyof MemberProfile>(key: K, value: MemberProfile[K]) {
    setProfile((p) => ({ ...p, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError("");

    const res = await fetch(`/api/trainer/members/${memberId}/assessments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...profile, trainerNotes: notes }),
    });
    const json = await res.json();
    setPending(false);

    if (!res.ok) {
      setError(json.error ?? "Failed to record assessment");
      return;
    }
    setNotes("");
    onSaved();
  }

  return (
    <div>
      <div className="card">
        <h3 className="section-title">Record fitness data</h3>
        <form onSubmit={handleSubmit} className="form-grid">
          <label className="form-label">
            Age
            <input className="input" type="number" value={profile.age} onChange={(e) => update("age", +e.target.value)} />
          </label>
          <label className="form-label">
            Gender
            <select className="select" value={profile.gender} onChange={(e) => update("gender", e.target.value as MemberProfile["gender"])}>
              <option>Male</option>
              <option>Female</option>
            </select>
          </label>
          <label className="form-label">
            Weight (kg)
            <input className="input" type="number" step="0.1" value={profile.weightKg} onChange={(e) => update("weightKg", +e.target.value)} />
          </label>
          <label className="form-label">
            Height (m)
            <input className="input" type="number" step="0.01" value={profile.heightM} onChange={(e) => update("heightM", +e.target.value)} />
          </label>
          <label className="form-label">
            Body fat %
            <input className="input" type="number" step="0.1" value={profile.fatPercentage} onChange={(e) => update("fatPercentage", +e.target.value)} />
          </label>
          <label className="form-label">
            BMI
            <input className="input" type="number" step="0.1" value={profile.bmi} onChange={(e) => update("bmi", +e.target.value)} />
          </label>
          <label className="form-label">
            Workout frequency (dataset field)
            <input
              className="input"
              type="number"
              min={1}
              max={7}
              value={profile.workoutFrequency}
              onChange={(e) => update("workoutFrequency", +e.target.value)}
            />
          </label>
          <label className="form-label">
            Experience level
            <select
              className="select"
              value={profile.experienceLevel}
              onChange={(e) => {
                const val = e.target.value as ExperienceLevel;
                update("experienceLevel", val);
                update("experienceLevelNumber", val === "beginner" ? 1 : val === "intermediate" ? 2 : 3);
              }}
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </label>
          <label className="form-label">
            Fitness goal
            <select className="select" value={profile.goal} onChange={(e) => update("goal", e.target.value as FitnessGoal)}>
              <option value="weight_loss">Weight loss</option>
              <option value="muscle_gain">Muscle gain</option>
              <option value="endurance">Endurance</option>
              <option value="general_fitness">General fitness</option>
              <option value="flexibility">Flexibility</option>
            </select>
          </label>
          <label className="form-label">
            Days per week (plan)
            <input className="input" type="number" min={1} max={7} value={profile.daysPerWeek} onChange={(e) => update("daysPerWeek", +e.target.value)} />
          </label>
          <label className="form-label">
            Session duration (minutes)
            <input
              className="input"
              type="number"
              min={15}
              max={120}
              value={profile.sessionDurationMinutes}
              onChange={(e) => update("sessionDurationMinutes", +e.target.value)}
            />
          </label>
          <label className="form-label">
            Equipment (comma separated)
            <input
              className="input"
              value={profile.equipment.join(",")}
              onChange={(e) => update("equipment", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))}
            />
          </label>
          <label className="form-label">
            Restrictions (comma separated tags)
            <input
              className="input"
              value={profile.restrictions.join(",")}
              onChange={(e) => update("restrictions", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))}
            />
          </label>
          <label className="form-label" style={{ gridColumn: "span 3" }}>
            Trainer observations
            <textarea className="textarea" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </label>
        </form>
        {error && <p style={{ color: "var(--red)" }}>{error}</p>}
        <div className="action-row" style={{ marginTop: 13 }}>
          <button className="button primary small-button" onClick={handleSubmit} disabled={pending}>
            {pending ? "Saving..." : "Save Record"}
          </button>
        </div>
      </div>

      <div className="card" style={{ marginTop: 13 }}>
        <h3>History ({assessments.length})</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Weight</th>
                <th>BMI</th>
                <th>Goal</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {assessments.map((a) => (
                <tr key={a.id as string}>
                  <td>{new Date(a.created_at as string).toLocaleDateString()}</td>
                  <td>{a.weight_kg as number} kg</td>
                  <td>{a.bmi as number}</td>
                  <td>{(a.goal as string)?.replaceAll("_", " ")}</td>
                  <td>{(a.trainer_notes as string) ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
