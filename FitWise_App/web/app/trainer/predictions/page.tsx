import Link from "next/link";
import { requireTrainer } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function PredictionsPage() {
  await requireTrainer();
  const supabase = await createClient();

  const { data: predictions } = await supabase
    .from("predictions")
    .select("id, predicted_category, confidence, assessment_id, created_at")
    .order("created_at", { ascending: false });
  const { data: assessments } = await supabase.from("assessments").select("id, member_id");
  const memberByAssessment = new Map((assessments ?? []).map((a) => [a.id, a.member_id]));

  const memberIds = [...new Set((predictions ?? []).map((p) => memberByAssessment.get(p.assessment_id)).filter(Boolean))] as string[];
  const { data: profiles } = memberIds.length
    ? await supabase.from("profiles").select("id, full_name").in("id", memberIds)
    : { data: [] };
  const nameById = new Map((profiles ?? []).map((p) => [p.id, p.full_name]));

  const rows = (predictions ?? []).map((p) => ({
    ...p,
    memberId: memberByAssessment.get(p.assessment_id),
    memberName: nameById.get(memberByAssessment.get(p.assessment_id) ?? "") ?? "Unknown member",
  }));

  const avgConfidence = rows.length ? Math.round((rows.reduce((s, r) => s + r.confidence, 0) / rows.length) * 100) : 0;

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="breadcrumbs">FitWise / Predictions</div>
          <h2>Prediction History</h2>
          <div className="muted small">Auditable model results across all members.</div>
        </div>
      </div>

      <div className="grid two">
        <div className="card">
          <span className="kpi-label">Average confidence</span>
          <span className="kpi-value">{avgConfidence}%</span>
        </div>
        <div className="card">
          <span className="kpi-label">Total predictions</span>
          <span className="kpi-value">{rows.length}</span>
        </div>
      </div>

      <div className="card" style={{ marginTop: 13 }}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Member</th>
                <th>Category</th>
                <th>Confidence</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="muted">
                    No predictions recorded yet.
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.id}>
                    <td>{new Date(r.created_at).toLocaleDateString()}</td>
                    <td>{r.memberName}</td>
                    <td>{r.predicted_category}</td>
                    <td>{Math.round(r.confidence * 100)}%</td>
                    <td>
                      {r.memberId && (
                        <Link href={`/trainer/members/${r.memberId}`} className="button secondary small-button">
                          Open
                        </Link>
                      )}
                    </td>
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
