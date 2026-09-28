import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ReassignMember } from "./ReassignMember";

// Admins see who each member is and which trainer owns them, but no fitness
// data: RLS gives the admin role no access to assessments, plans or completions.
export default async function AdminMembersPage() {
  await requireAdmin();
  const supabase = await createClient();

  const { data: members } = await supabase.from("members").select("profile_id, trainer_id, phone, created_at").order("created_at", { ascending: false });
  const { data: profiles } = await supabase.from("profiles").select("id, role, status, full_name, email");

  const byId = new Map((profiles ?? []).map((p) => [p.id, p]));
  const activeTrainers = (profiles ?? [])
    .filter((p) => p.role === "trainer" && p.status === "active")
    .map((p) => ({ id: p.id, name: p.full_name ?? p.email ?? p.id }));

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="breadcrumbs">FitWise / Administration / Members</div>
          <h2>Members</h2>
          <div className="muted small">Every gym member and their assigned trainer. Fitness records stay private to the member and their trainer.</div>
        </div>
      </div>
      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Member</th>
                <th>Phone</th>
                <th>Joined</th>
                <th>Assigned trainer</th>
              </tr>
            </thead>
            <tbody>
              {(members ?? []).length === 0 ? (
                <tr>
                  <td colSpan={4} className="muted">
                    No members yet. Trainers register members from their workspace.
                  </td>
                </tr>
              ) : (
                (members ?? []).map((m) => {
                  const p = byId.get(m.profile_id);
                  return (
                    <tr key={m.profile_id}>
                      <td>
                        {p?.full_name ?? "—"}
                        <br />
                        <span className="muted small">{p?.email}</span>
                      </td>
                      <td>{m.phone ?? "—"}</td>
                      <td>{new Date(m.created_at).toLocaleDateString()}</td>
                      <td>
                        <ReassignMember memberId={m.profile_id} currentTrainerId={m.trainer_id} trainers={activeTrainers} />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="muted small" style={{ marginTop: 12 }}>
          {(members ?? []).length} members across {activeTrainers.length} active trainers
        </div>
      </div>
    </div>
  );
}
