import { requireTrainer } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { WorkoutDay } from "@/lib/types";
import { BarChart, Donut, LineChart, Ring } from "../Charts";

const WEEKS = 8;

// Buckets timestamped rows into the last N calendar weeks (oldest first),
// returning one aggregate value per week via `reduce`.
function bucketByWeek<T>(rows: T[], getDate: (row: T) => string, reduce: (rows: T[]) => number): number[] {
  const now = Date.now();
  const buckets: T[][] = Array.from({ length: WEEKS }, () => []);
  for (const row of rows) {
    const weeksAgo = Math.floor((now - new Date(getDate(row)).getTime()) / (7 * 24 * 3600 * 1000));
    if (weeksAgo >= 0 && weeksAgo < WEEKS) buckets[WEEKS - 1 - weeksAgo].push(row);
  }
  return buckets.map(reduce);
}

export default async function AnalyticsPage() {
  await requireTrainer();
  const supabase = await createClient();

  const { data: members } = await supabase.from("members").select("profile_id");
  const { data: approvedPlans } = await supabase.from("plans").select("id, assessment_id, days").eq("status", "approved");
  const { data: completions } = await supabase.from("completions").select("id, plan_id, completed_at");
  const { data: predictions } = await supabase.from("predictions").select("predicted_category, confidence, created_at").order("created_at", { ascending: true });
  const { data: allPlans } = await supabase.from("plans").select("id, validation, created_at").order("created_at", { ascending: true });

  const completionCountByPlan = new Map<string, number>();
  for (const c of completions ?? []) completionCountByPlan.set(c.plan_id, (completionCountByPlan.get(c.plan_id) ?? 0) + 1);

  let totalDays = 0;
  let totalCompleted = 0;
  for (const p of approvedPlans ?? []) {
    totalDays += (p.days as WorkoutDay[]).length;
    totalCompleted += completionCountByPlan.get(p.id) ?? 0;
  }
  const adherence = totalDays > 0 ? Math.round((totalCompleted / totalDays) * 100) : 0;
  const avgConfidence = predictions?.length ? Math.round((predictions.reduce((s, p) => s + p.confidence, 0) / predictions.length) * 100) : 0;
  const avgValidationScore = allPlans?.length
    ? Math.round(allPlans.reduce((s, p) => s + (p.validation as { score: number }).score, 0) / allPlans.length)
    : 0;

  const completionsPerWeek = bucketByWeek(completions ?? [], (c) => c.completed_at, (rows) => rows.length);

  const confidenceByWeek = bucketByWeek(
    predictions ?? [],
    (p) => p.created_at,
    (rows) => (rows.length ? Math.round((rows.reduce((s, r) => s + r.confidence, 0) / rows.length) * 100) : 0),
  );
  // Carry the last known average forward through empty weeks so the trend
  // line doesn't fall to zero for weeks with no predictions run. Seeded at 0
  // (not the array's first non-zero value) so weeks before any prediction
  // ever ran correctly show 0, not a value leaked back from a later week.
  let lastKnownConfidence = 0;
  const confidenceTrend = confidenceByWeek.map((v) => (v > 0 ? (lastKnownConfidence = v) : lastKnownConfidence));

  const categories = ["Strength", "Cardio", "HIIT", "Yoga"];
  const categoryColors: Record<string, string> = { Strength: "var(--blue)", Cardio: "var(--teal)", HIIT: "var(--green)", Yoga: "#f5aa4f" };
  const categoryCounts = new Map<string, number>();
  for (const p of predictions ?? []) categoryCounts.set(p.predicted_category, (categoryCounts.get(p.predicted_category) ?? 0) + 1);

  const validationScores = (allPlans ?? []).map((p) => (p.validation as { score: number }).score);

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="breadcrumbs">FitWise / Analytics</div>
          <h2>Progress Monitoring &amp; Analytics</h2>
          <div className="muted small">Evidence-led overview across every member in your practice.</div>
        </div>
      </div>

      <div className="grid six">
        {[
          ["Members", members?.length ?? 0],
          ["Approved plans", approvedPlans?.length ?? 0],
          ["Overall adherence", `${adherence}%`],
          ["Completed workouts", completions?.length ?? 0],
          ["Avg. prediction confidence", `${avgConfidence}%`],
          ["Avg. plan validation score", `${avgValidationScore}%`],
        ].map(([label, value]) => (
          <div className="card" key={label as string}>
            <span className="kpi-label">{label}</span>
            <span className="kpi-value">{value}</span>
          </div>
        ))}
      </div>

      <div className="grid three" style={{ marginTop: 13 }}>
        <div className="card">
          <h3>Workouts completed over time</h3>
          <LineChart points={completionsPerWeek} color="#1657d8" />
          <p className="muted small" style={{ marginTop: 8 }}>Last {WEEKS} weeks, across all members</p>
        </div>
        <div className="card">
          <h3>Plan validation scores</h3>
          <BarChart values={validationScores} />
          <p className="muted small" style={{ marginTop: 8 }}>Rule engine + Gemini plans, in generation order</p>
        </div>
        <div className="card">
          <h3>Workout-type distribution</h3>
          <Donut
            segments={categories.map((cat) => ({ value: categoryCounts.get(cat) ?? 0, color: categoryColors[cat] }))}
            centerValue={String(predictions?.length ?? 0)}
            centerLabel="Predictions"
          />
        </div>
        <div className="card" style={{ textAlign: "center" }}>
          <h3>Workout completion</h3>
          <Ring percent={adherence} label="Complete" />
        </div>
        <div className="card">
          <h3>Prediction confidence trend</h3>
          <LineChart points={confidenceTrend} color="#0d9b96" />
          <p className="muted small" style={{ marginTop: 8 }}>Weekly average, last {WEEKS} weeks</p>
        </div>
        <div className="card">
          <h3>Trainer insight</h3>
          <p className="muted small">
            {totalDays === 0
              ? "No approved plans with completion data yet."
              : `${totalCompleted} of ${totalDays} planned workout days completed across all approved plans (${adherence}% overall adherence).`}
          </p>
        </div>
      </div>
    </div>
  );
}
