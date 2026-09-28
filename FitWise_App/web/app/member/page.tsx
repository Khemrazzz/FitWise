import { verifySession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { computeProgress } from "@/lib/progress";
import { CompleteDayButton } from "./CompleteDayButton";
import type { WorkoutDay } from "@/lib/types";

export default async function MemberPage() {
  const session = await verifySession();
  const supabase = await createClient();

  // RLS ("member reads own approved plans") transparently scopes this to
  // the signed-in member's own approved plans -- no explicit filter needed.
  const { data: plans } = await supabase.from("plans").select("*").order("created_at", { ascending: false });
  const { data: completions } = await supabase.from("completions").select("plan_id, day_number");

  const completedKeys = new Set((completions ?? []).map((c) => `${c.plan_id}:${c.day_number}`));

  const { data: latestAssessment } = await supabase
    .from("assessments")
    .select("weight_kg, goal")
    .eq("member_id", session.userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  const totalDays = (plans ?? []).reduce((sum, p) => sum + (p.days as WorkoutDay[]).length, 0);
  const adherenceFactor = totalDays > 0 ? (completions?.length ?? 0) / totalDays : 0;
  const progress = latestAssessment ? computeProgress(latestAssessment.weight_kg, latestAssessment.goal, adherenceFactor) : null;
  const adherencePct = Math.round(adherenceFactor * 100);

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="breadcrumbs">FitWise / My Plan</div>
          <h2>My Plan</h2>
          <div className="muted small">Signed in as {session.email}</div>
        </div>
      </div>

      {progress && (
        <div className="grid two" style={{ marginBottom: 13, alignItems: "stretch" }}>
          <div className="card" style={{ textAlign: "center" }}>
            <h3>Adherence</h3>
            <div
              className="progress-ring"
              style={{ background: `conic-gradient(var(--blue) 0 ${adherencePct}%, #e3ebf5 ${adherencePct}% 100%)` }}
              data-label={`${adherencePct}%\nAdherence`}
            />
            <p className="muted small">
              {completions?.length ?? 0} of {totalDays} planned days completed
            </p>
          </div>
          <div className="card">
            <h3>Progress scenario</h3>
            <div className="grid two">
              {[
                ["Baseline", `${progress.baselineWeightKg} kg`],
                ["1-month estimate", `${progress.projections.month1} kg`],
                ["2-month estimate", `${progress.projections.month2} kg`],
                ["3-month estimate", `${progress.projections.month3} kg`],
              ].map(([label, value]) => (
                <div key={label}>
                  <span className="kpi-label">{label}</span>
                  <span className="kpi-value" style={{ fontSize: 18 }}>
                    {value}
                  </span>
                </div>
              ))}
            </div>
            <p className="muted small" style={{ marginTop: 10 }}>
              {progress.disclaimer}
            </p>
          </div>
        </div>
      )}

      {!plans || plans.length === 0 ? (
        <div className="card">
          <p className="muted small">No approved plan yet -- check back once your trainer approves one.</p>
        </div>
      ) : (
        plans.map((plan) => (
          <div className="card" key={plan.id} style={{ marginBottom: 13 }}>
            <h3 style={{ margin: 0 }}>{plan.plan_name}</h3>
            <p className="muted small">{plan.explanation}</p>
            <div className="week-grid">
              {(plan.days as WorkoutDay[]).map((day) => {
                const key = `${plan.id}:${day.day}`;
                const done = completedKeys.has(key);
                return (
                  <div className="day-card" key={day.day}>
                    <b>Day {day.day}</b>
                    <h4 style={{ color: "var(--blue)", margin: "6px 0 8px" }}>{day.title}</h4>
                    {day.exercises.map((ex, i) => (
                      <div className="exercise-item" key={i}>
                        {ex.exerciseId}
                      </div>
                    ))}
                    <p className="muted small">{day.estimatedDurationMinutes} min</p>
                    {done ? (
                      <span className="status">Completed</span>
                    ) : (
                      <CompleteDayButton planId={plan.id} dayNumber={day.day} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
