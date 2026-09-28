import Link from "next/link";
import { requireTrainer } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function PlansQueuePage() {
  await requireTrainer();
  const supabase = await createClient();

  const { data: plans } = await supabase
    .from("plans")
    .select("id, plan_name, generator, status, validation, assessment_id, created_at")
    .order("created_at", { ascending: false });
  const { data: assessments } = await supabase.from("assessments").select("id, member_id");
  const memberByAssessment = new Map((assessments ?? []).map((a) => [a.id, a.member_id]));

  const memberIds = [...new Set((plans ?? []).map((p) => memberByAssessment.get(p.assessment_id)).filter(Boolean))] as string[];
  const { data: profiles } = memberIds.length
    ? await supabase.from("profiles").select("id, full_name").in("id", memberIds)
    : { data: [] };
  const nameById = new Map((profiles ?? []).map((p) => [p.id, p.full_name]));

  const rows = (plans ?? []).map((p) => ({
    ...p,
    memberId: memberByAssessment.get(p.assessment_id),
    memberName: nameById.get(memberByAssessment.get(p.assessment_id) ?? "") ?? "Unknown member",
  }));
  const pending = rows.filter((r) => r.status === "draft");

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="breadcrumbs">FitWise / Workout Plans</div>
          <h2>Workout Plans</h2>
          <div className="muted small">Every generated plan across all members, newest first.</div>
        </div>
      </div>

      {pending.length > 0 && (
        <div className="warning-banner" style={{ marginBottom: 13 }}>
          <strong>{pending.length} plan(s) awaiting review.</strong> Open a member's Workout Plans tab to approve or reject.
        </div>
      )}

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Member</th>
                <th>Plan</th>
                <th>Generator</th>
                <th>Validation</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="muted">
                    No plans generated yet.
                  </td>
                </tr>
              ) : (
                rows.map((r) => {
                  const validation = r.validation as { valid: boolean; score: number };
                  return (
                    <tr key={r.id}>
                      <td>{r.memberName}</td>
                      <td>{r.plan_name}</td>
                      <td>{r.generator === "gemini" ? "Gemini" : "Rule-based"}</td>
                      <td>
                        <span className={`status${validation.valid ? "" : " danger"}`}>{validation.score}%</span>
                      </td>
                      <td>
                        <span className={`status${r.status === "rejected" ? " danger" : r.status === "draft" ? " warning" : ""}`}>{r.status}</span>
                      </td>
                      <td>{new Date(r.created_at).toLocaleDateString()}</td>
                      <td>
                        {r.memberId && (
                          <Link href={`/trainer/members/${r.memberId}`} className="button secondary small-button">
                            Open
                          </Link>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
