import Link from "next/link";
import { requireTrainer } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { WorkoutDay } from "@/lib/types";
import { MembersTable, type MemberRow } from "./MembersTable";

export default async function MembersPage() {
  await requireTrainer();
  const supabase = await createClient();

  const { data: members } = await supabase.from("members").select("profile_id, created_at");
  const memberIds = (members ?? []).map((m) => m.profile_id);

  const { data: profiles } = memberIds.length
    ? await supabase.from("profiles").select("id, full_name").in("id", memberIds)
    : { data: [] };
  const { data: assessments } = memberIds.length
    ? await supabase.from("assessments").select("id, member_id, goal, created_at").in("member_id", memberIds).order("created_at", { ascending: false })
    : { data: [] };
  const { data: plans } = await supabase.from("plans").select("id, assessment_id, plan_name, status");
  const { data: completions } = await supabase.from("completions").select("id, plan_id, member_id, completed_at");

  const nameById = new Map((profiles ?? []).map((p) => [p.id, p.full_name]));
  const latestAssessmentByMember = new Map<string, { id: string; goal: string }>();
  for (const a of assessments ?? []) if (!latestAssessmentByMember.has(a.member_id)) latestAssessmentByMember.set(a.member_id, a);

  const assessmentIdToMember = new Map((assessments ?? []).map((a) => [a.id, a.member_id]));
  const approvedPlanByMember = new Map<string, { name: string; id: string }>();
  const planDaysCount = new Map<string, number>();
  for (const p of plans ?? []) {
    if (p.status !== "approved") continue;
    const memberId = assessmentIdToMember.get(p.assessment_id);
    if (memberId && !approvedPlanByMember.has(memberId)) approvedPlanByMember.set(memberId, { name: p.plan_name, id: p.id });
  }

  const completionCountByPlan = new Map<string, number>();
  const lastActiveByMember = new Map<string, string>();
  for (const c of completions ?? []) {
    completionCountByPlan.set(c.plan_id, (completionCountByPlan.get(c.plan_id) ?? 0) + 1);
    const prev = lastActiveByMember.get(c.member_id);
    if (!prev || c.completed_at > prev) lastActiveByMember.set(c.member_id, c.completed_at);
  }

  const rows: MemberRow[] = (members ?? []).map((m) => {
    const plan = approvedPlanByMember.get(m.profile_id);
    const totalDays = plan ? (plans?.find((p) => p.id === plan.id) as { days?: WorkoutDay[] } | undefined)?.days?.length : undefined;
    const completed = plan ? completionCountByPlan.get(plan.id) ?? 0 : 0;
    const adherence = plan && totalDays ? Math.round((completed / totalDays) * 100) : null;
    return {
      id: m.profile_id,
      fullName: nameById.get(m.profile_id) ?? null,
      goal: latestAssessmentByMember.get(m.profile_id)?.goal ?? null,
      planName: plan?.name ?? null,
      adherence,
      lastActive: lastActiveByMember.get(m.profile_id) ?? null,
    };
  });

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="breadcrumbs">FitWise / Members</div>
          <h2>Members List</h2>
          <div className="muted small">Search, filter and manage registered gym members.</div>
        </div>
        <div className="action-row">
          <Link href="/trainer/members/new" className="button primary small-button">
            + Add Member
          </Link>
        </div>
      </div>
      <MembersTable rows={rows} />
    </div>
  );
}
