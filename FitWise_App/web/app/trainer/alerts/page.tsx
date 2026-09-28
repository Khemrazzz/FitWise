import Link from "next/link";
import { requireTrainer } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { WorkoutDay } from "@/lib/types";

// There's no stored notifications table (yet) -- these are derived live from
// real data (adherence, plan status, registration dates) rather than a
// fabricated feed. Genuinely computed, just not persisted/dismissable yet.
export default async function AlertsPage() {
  await requireTrainer();
  const supabase = await createClient();

  const { data: members } = await supabase.from("members").select("profile_id, created_at");
  const { data: profiles } = members?.length
    ? await supabase.from("profiles").select("id, full_name").in("id", members.map((m) => m.profile_id))
    : { data: [] };
  const nameById = new Map((profiles ?? []).map((p) => [p.id, p.full_name]));

  const { data: approvedPlans } = await supabase.from("plans").select("id, assessment_id, days").eq("status", "approved");
  const { data: draftPlans } = await supabase.from("plans").select("id, assessment_id, plan_name").eq("status", "draft");
  const { data: completions } = await supabase.from("completions").select("plan_id");
  const { data: assessments } = await supabase.from("assessments").select("id, member_id");
  const memberByAssessment = new Map((assessments ?? []).map((a) => [a.id, a.member_id]));

  const completionCountByPlan = new Map<string, number>();
  for (const c of completions ?? []) completionCountByPlan.set(c.plan_id, (completionCountByPlan.get(c.plan_id) ?? 0) + 1);

  const adherenceByMember = new Map<string, { completed: number; total: number }>();
  for (const p of approvedPlans ?? []) {
    const memberId = memberByAssessment.get(p.assessment_id);
    if (!memberId) continue;
    const total = (p.days as WorkoutDay[]).length;
    const completed = completionCountByPlan.get(p.id) ?? 0;
    const prev = adherenceByMember.get(memberId) ?? { completed: 0, total: 0 };
    adherenceByMember.set(memberId, { completed: prev.completed + completed, total: prev.total + total });
  }

  type Alert = { severity: "High" | "Medium" | "Information"; title: string; detail: string; memberId?: string };
  const alerts: Alert[] = [];

  for (const [memberId, a] of adherenceByMember) {
    if (a.total > 0 && a.completed / a.total < 0.6) {
      alerts.push({
        severity: "Medium",
        title: "Low adherence",
        detail: `${nameById.get(memberId) ?? memberId} is at ${Math.round((a.completed / a.total) * 100)}% adherence.`,
        memberId,
      });
    }
  }
  for (const p of draftPlans ?? []) {
    const memberId = memberByAssessment.get(p.assessment_id);
    alerts.push({
      severity: "Information",
      title: "Plan awaiting review",
      detail: `${p.plan_name} for ${nameById.get(memberId ?? "") ?? "a member"} needs approval or rejection.`,
      memberId: memberId ?? undefined,
    });
  }
  const recentMembers = (members ?? []).filter((m) => Date.now() - new Date(m.created_at).getTime() < 7 * 24 * 3600 * 1000);
  for (const m of recentMembers) {
    alerts.push({ severity: "Information", title: "New member registration", detail: `${nameById.get(m.profile_id) ?? m.profile_id} was registered this week.`, memberId: m.profile_id });
  }

  const highCount = alerts.filter((a) => a.severity === "High").length;
  const mediumCount = alerts.filter((a) => a.severity === "Medium").length;

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="breadcrumbs">FitWise / Alerts</div>
          <h2>Alerts &amp; Notifications</h2>
          <div className="muted small">Derived from live adherence, plan and registration data.</div>
        </div>
      </div>

      <div className="grid two">
        <div className="card">
          <div className="tabs">
            <button className="tab active">All ({alerts.length})</button>
          </div>
          {alerts.length === 0 ? (
            <p className="muted small">No alerts right now.</p>
          ) : (
            alerts.map((a, i) => (
              <div className="alert-item" key={i}>
                <span className="alert-dot" />
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                    <b>{a.title}</b>
                    <span className={`status${a.severity === "High" ? " danger" : a.severity === "Medium" ? " warning" : ""}`}>{a.severity}</span>
                  </div>
                  <div className="muted small">
                    {a.detail} {a.memberId && <Link href={`/trainer/members/${a.memberId}`}>View member</Link>}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="card">
          <h3>Alert summary</h3>
          <div className="grid two">
            <div>
              <span className="kpi-value">{highCount}</span>
              <span className="kpi-label">High priority</span>
            </div>
            <div>
              <span className="kpi-value">{mediumCount}</span>
              <span className="kpi-label">Medium priority</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
