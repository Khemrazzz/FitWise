import Link from "next/link";
import { requireTrainer } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { WorkoutDay } from "@/lib/types";
import { Donut, LineChart } from "./Charts";

export default async function TrainerDashboard() {
  const session = await requireTrainer();
  const supabase = await createClient();

  const { data: members } = await supabase.from("members").select("profile_id, created_at");
  const { data: approvedPlans } = await supabase.from("plans").select("id, status, assessment_id, days").eq("status", "approved");
  const { data: allPlans } = await supabase.from("plans").select("id, status");
  const { count: predictionsCount } = await supabase.from("predictions").select("id", { count: "exact", head: true });
  const { count: completionsCount } = await supabase.from("completions").select("id", { count: "exact", head: true });
  const { data: predictions } = await supabase.from("predictions").select("predicted_category");
  const { data: completions } = await supabase.from("completions").select("plan_id");
  const { data: assessments } = await supabase.from("assessments").select("id, member_id");

  const memberIdByAssessment = new Map((assessments ?? []).map((a) => [a.id, a.member_id]));
  const completionCountByPlan = new Map<string, number>();
  for (const c of completions ?? []) completionCountByPlan.set(c.plan_id, (completionCountByPlan.get(c.plan_id) ?? 0) + 1);

  const adherenceByMember = new Map<string, { completed: number; total: number }>();
  for (const plan of approvedPlans ?? []) {
    const memberId = memberIdByAssessment.get(plan.assessment_id);
    if (!memberId) continue;
    const totalDays = (plan.days as WorkoutDay[]).length;
    const completed = completionCountByPlan.get(plan.id) ?? 0;
    const prev = adherenceByMember.get(memberId) ?? { completed: 0, total: 0 };
    adherenceByMember.set(memberId, { completed: prev.completed + completed, total: prev.total + totalDays });
  }
  const adherenceValues = [...adherenceByMember.values()].map((a) => (a.total > 0 ? a.completed / a.total : 0));
  const avgAdherence = adherenceValues.length > 0 ? Math.round((adherenceValues.reduce((s, v) => s + v, 0) / adherenceValues.length) * 100) : 0;
  const needAttention = [...adherenceByMember.values()].filter((a) => a.total > 0 && a.completed / a.total < 0.6).length;

  const categoryCounts = new Map<string, number>();
  for (const p of predictions ?? []) categoryCounts.set(p.predicted_category, (categoryCounts.get(p.predicted_category) ?? 0) + 1);
  const totalPredictions = predictions?.length ?? 0;
  const categories = ["Strength", "Cardio", "HIIT", "Yoga"];
  const categoryColors: Record<string, string> = { Strength: "var(--blue)", Cardio: "var(--teal)", HIIT: "var(--green)", Yoga: "#f5aa4f" };

  // Cumulative member growth by join date -- real data, whatever exists.
  const sortedMembers = [...(members ?? [])].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  const growth = sortedMembers.map((_, i) => i + 1);

  const kpis: [string, string | number, string][] = [
    ["Total members", members?.length ?? 0, ""],
    ["Active plans", approvedPlans?.length ?? 0, ""],
    ["Avg. adherence", `${avgAdherence}%`, ""],
    ["Predictions", predictionsCount ?? 0, ""],
    ["Completed workouts", completionsCount ?? 0, ""],
    ["Need attention", needAttention, needAttention > 0 ? "below 60% adherence" : ""],
  ];

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="breadcrumbs">FitWise / Trainer Dashboard</div>
          <h2>Trainer Dashboard</h2>
          <div className="muted small">Operational overview of members, predictions, plans and progress.</div>
        </div>
        <div className="action-row">
          <Link href="/trainer/members/new" className="button primary small-button">
            + Register Member
          </Link>
        </div>
      </div>

      <div className="grid six">
        {kpis.map(([label, value, sub]) => (
          <div className="card" key={label}>
            <span className="kpi-label">{label}</span>
            <span className="kpi-value">{value}</span>
            {sub && <span className="trend">{sub}</span>}
          </div>
        ))}
      </div>

      <div className="grid two" style={{ marginTop: 13 }}>
        <div className="card">
          <h3>Member growth</h3>
          <LineChart points={growth.length ? growth : [0]} color="#1657d8" />
        </div>
        <div className="card">
          <h3>Workout-type distribution</h3>
          {totalPredictions === 0 ? (
            <p className="muted small">No predictions recorded yet.</p>
          ) : (
            <div className="grid two" style={{ alignItems: "center" }}>
              <Donut
                segments={categories.map((cat) => ({ value: categoryCounts.get(cat) ?? 0, color: categoryColors[cat] }))}
                centerValue={String(totalPredictions)}
                centerLabel="Predictions"
              />
              <div className="small">
                {categories.map((cat) => {
                  const count = categoryCounts.get(cat) ?? 0;
                  const pct = Math.round((count / totalPredictions) * 100);
                  return (
                    <p key={cat}>
                      <b style={{ color: categoryColors[cat] }}>●</b> {cat} {pct}%
                    </p>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid three" style={{ marginTop: 13 }}>
        <div className="card">
          <h3>Members</h3>
          <p className="muted small">{members?.length ?? 0} registered</p>
          <Link href="/trainer/members" className="button secondary small-button">
            View all
          </Link>
        </div>
        <div className="card">
          <h3>Plans awaiting review</h3>
          <p className="muted small">{(allPlans ?? []).filter((p) => p.status === "draft").length} drafts pending</p>
          <Link href="/trainer/plans" className="button secondary small-button">
            Review plans
          </Link>
        </div>
        <div className="card">
          <h3>Priority alerts</h3>
          {needAttention > 0 ? (
            <p>
              <span className="status warning">Medium</span> {needAttention} member(s) below 60% adherence
            </p>
          ) : (
            <p className="muted small">No alerts right now.</p>
          )}
          <Link href="/trainer/alerts" className="button secondary small-button">
            Review alerts
          </Link>
        </div>
      </div>
    </div>
  );
}
