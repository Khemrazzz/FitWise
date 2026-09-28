"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { ExperienceLevel, FitnessGoal } from "@/lib/types";

export default function RegisterMemberPage() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [created, setCreated] = useState<{ memberId: string; email: string; tempPassword: string } | null>(null);

  const [account, setAccount] = useState({ fullName: "", email: "", phone: "", dateOfBirth: "", emergencyContact: "" });
  const [physical, setPhysical] = useState({
    heightM: 1.75,
    weightKg: 75,
    fatPercentage: 20,
    experienceLevel: "beginner" as ExperienceLevel,
    workoutFrequency: 3,
    sessionDurationMinutes: 45,
  });
  const [goals, setGoals] = useState({
    goal: "general_fitness" as FitnessGoal,
    targetWeightKg: 70,
    daysPerWeek: 3,
    preferredDays: "Monday, Wednesday, Friday",
    availableTime: "18:00-19:00",
    restrictions: "",
    equipment: "",
    trainerNotes: "",
  });
  const [age, setAge] = useState(28);
  const [gender, setGender] = useState<"Male" | "Female">("Male");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError("");

    const memberRes = await fetch("/api/trainer/members", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: account.email,
        fullName: account.fullName,
        phone: account.phone || null,
        dateOfBirth: account.dateOfBirth || null,
        emergencyContact: account.emergencyContact || null,
      }),
    });
    const memberJson = await memberRes.json();
    if (!memberRes.ok) {
      setError(memberJson.error ?? "Failed to create member");
      setPending(false);
      return;
    }

    const experienceLevelNumber = physical.experienceLevel === "beginner" ? 1 : physical.experienceLevel === "intermediate" ? 2 : 3;
    const bmi = Math.round((physical.weightKg / (physical.heightM * physical.heightM)) * 10) / 10;

    const assessmentRes = await fetch(`/api/trainer/members/${memberJson.memberId}/assessments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        age,
        gender,
        weightKg: physical.weightKg,
        heightM: physical.heightM,
        fatPercentage: physical.fatPercentage,
        workoutFrequency: physical.workoutFrequency,
        experienceLevelNumber,
        experienceLevel: physical.experienceLevel,
        bmi,
        goal: goals.goal,
        daysPerWeek: goals.daysPerWeek,
        sessionDurationMinutes: physical.sessionDurationMinutes,
        equipment: goals.equipment.split(",").map((s) => s.trim()).filter(Boolean),
        restrictions: goals.restrictions.split(",").map((s) => s.trim()).filter(Boolean),
        targetWeightKg: goals.targetWeightKg,
        preferredDays: goals.preferredDays,
        availableTime: goals.availableTime,
        trainerNotes: goals.trainerNotes,
      }),
    });
    const assessmentJson = await assessmentRes.json();
    setPending(false);

    if (!assessmentRes.ok) {
      setError(`Member created, but the initial assessment failed: ${assessmentJson.error}`);
      return;
    }

    setCreated({ memberId: memberJson.memberId, email: memberJson.email, tempPassword: memberJson.tempPassword });
  }

  if (created) {
    return (
      <div>
        <div className="page-head">
          <div>
            <div className="breadcrumbs">FitWise / Register New Member</div>
            <h2>Member account created</h2>
            <div className="muted small">Hand these credentials to the member out of band -- the password is shown once and cannot be retrieved again.</div>
          </div>
        </div>
        <div className="card">
          <h3 className="section-title">One-time credentials</h3>
          <div className="form-grid">
            <label className="form-label">
              Email
              <div className="input">{created.email}</div>
            </label>
            <label className="form-label">
              Temporary password
              <div className="input" style={{ fontFamily: "monospace" }}>
                {created.tempPassword}
              </div>
            </label>
          </div>
          <div className="warning-banner" style={{ marginTop: 13 }}>
            <strong>This password will not be shown again.</strong> The member should sign in and change it from Settings.
          </div>
          <div className="action-row" style={{ marginTop: 13 }}>
            <button className="button primary small-button" onClick={() => router.push(`/trainer/members/${created.memberId}`)}>
              Continue to member profile
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="breadcrumbs">FitWise / Register New Member</div>
          <h2>Register New Member</h2>
          <div className="muted small">Trainer-created member account and initial fitness profile.</div>
        </div>
        <div className="action-row">
          <Link href="/trainer/members" className="button secondary small-button">
            Cancel
          </Link>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="card">
          <h3 className="section-title">Personal information</h3>
          <div className="form-grid">
            <label className="form-label">
              Full name
              <input className="input" required value={account.fullName} onChange={(e) => setAccount({ ...account, fullName: e.target.value })} />
            </label>
            <label className="form-label">
              Email
              <input className="input" type="email" required value={account.email} onChange={(e) => setAccount({ ...account, email: e.target.value })} />
            </label>
            <label className="form-label">
              Phone
              <input className="input" value={account.phone} onChange={(e) => setAccount({ ...account, phone: e.target.value })} />
            </label>
            <label className="form-label">
              Date of birth
              <input className="input" type="date" value={account.dateOfBirth} onChange={(e) => setAccount({ ...account, dateOfBirth: e.target.value })} />
            </label>
            <label className="form-label">
              Gender
              <select className="select" value={gender} onChange={(e) => setGender(e.target.value as "Male" | "Female")}>
                <option>Male</option>
                <option>Female</option>
              </select>
            </label>
            <label className="form-label">
              Emergency contact
              <input className="input" value={account.emergencyContact} onChange={(e) => setAccount({ ...account, emergencyContact: e.target.value })} />
            </label>
          </div>
        </div>

        <div className="card" style={{ marginTop: 13 }}>
          <h3 className="section-title">Physical information</h3>
          <div className="form-grid">
            <label className="form-label">
              Age
              <input className="input" type="number" value={age} onChange={(e) => setAge(+e.target.value)} />
            </label>
            <label className="form-label">
              Height (m)
              <input className="input" type="number" step="0.01" value={physical.heightM} onChange={(e) => setPhysical({ ...physical, heightM: +e.target.value })} />
            </label>
            <label className="form-label">
              Weight (kg)
              <input className="input" type="number" step="0.1" value={physical.weightKg} onChange={(e) => setPhysical({ ...physical, weightKg: +e.target.value })} />
            </label>
            <label className="form-label">
              Body fat %
              <input className="input" type="number" step="0.1" value={physical.fatPercentage} onChange={(e) => setPhysical({ ...physical, fatPercentage: +e.target.value })} />
            </label>
            <label className="form-label">
              Experience level
              <select
                className="select"
                value={physical.experienceLevel}
                onChange={(e) => setPhysical({ ...physical, experienceLevel: e.target.value as ExperienceLevel })}
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </label>
            <label className="form-label">
              Workout frequency (days/week, dataset field)
              <input className="input" type="number" min={1} max={7} value={physical.workoutFrequency} onChange={(e) => setPhysical({ ...physical, workoutFrequency: +e.target.value })} />
            </label>
            <label className="form-label">
              Average session duration (minutes)
              <input className="input" type="number" value={physical.sessionDurationMinutes} onChange={(e) => setPhysical({ ...physical, sessionDurationMinutes: +e.target.value })} />
            </label>
          </div>
        </div>

        <div className="card" style={{ marginTop: 13 }}>
          <h3 className="section-title">Fitness goals and restrictions</h3>
          <div className="form-grid">
            <label className="form-label">
              Primary fitness goal
              <select className="select" value={goals.goal} onChange={(e) => setGoals({ ...goals, goal: e.target.value as FitnessGoal })}>
                <option value="weight_loss">Weight loss</option>
                <option value="muscle_gain">Muscle gain</option>
                <option value="endurance">Endurance</option>
                <option value="general_fitness">General fitness</option>
                <option value="flexibility">Flexibility</option>
              </select>
            </label>
            <label className="form-label">
              Target weight (kg)
              <input className="input" type="number" step="0.1" value={goals.targetWeightKg} onChange={(e) => setGoals({ ...goals, targetWeightKg: +e.target.value })} />
            </label>
            <label className="form-label">
              Plan days per week
              <input className="input" type="number" min={1} max={7} value={goals.daysPerWeek} onChange={(e) => setGoals({ ...goals, daysPerWeek: +e.target.value })} />
            </label>
            <label className="form-label">
              Preferred workout days
              <input className="input" value={goals.preferredDays} onChange={(e) => setGoals({ ...goals, preferredDays: e.target.value })} />
            </label>
            <label className="form-label">
              Available workout time
              <input className="input" value={goals.availableTime} onChange={(e) => setGoals({ ...goals, availableTime: e.target.value })} />
            </label>
            <label className="form-label">
              Available equipment (comma separated)
              <input className="input" placeholder="dumbbells, barbell" value={goals.equipment} onChange={(e) => setGoals({ ...goals, equipment: e.target.value })} />
            </label>
            <label className="form-label">
              Injuries / physical restrictions (comma separated tags)
              <input className="input" placeholder="knee_high_load" value={goals.restrictions} onChange={(e) => setGoals({ ...goals, restrictions: e.target.value })} />
            </label>
            <label className="form-label" style={{ gridColumn: "span 3" }}>
              Trainer notes
              <textarea className="textarea" value={goals.trainerNotes} onChange={(e) => setGoals({ ...goals, trainerNotes: e.target.value })} />
            </label>
          </div>
          <div className="info-banner" style={{ marginTop: 13 }}>
            <strong>Account flow:</strong> the trainer creates the member record. A one-time temporary password is shown once and
            must be handed to the member out of band.
          </div>
        </div>

        {error && <p style={{ color: "var(--red)" }}>{error}</p>}
        <div className="action-row" style={{ marginTop: 13 }}>
          <button type="submit" className="button primary" disabled={pending}>
            {pending ? "Saving..." : "Save Member"}
          </button>
        </div>
      </form>
    </div>
  );
}
