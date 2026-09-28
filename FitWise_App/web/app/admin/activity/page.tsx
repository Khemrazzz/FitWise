import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ACTION_LABELS, describeTarget } from "@/lib/adminLabels";

export default async function AdminActivityPage() {
  await requireAdmin();
  const supabase = await createClient();
  const { data: entries } = await supabase
    .from("admin_audit_log")
    .select("id, actor_id, action, target_id, details, created_at")
    .order("created_at", { ascending: false })
    .limit(200);
  const { data: profiles } = await supabase.from("profiles").select("id, full_name, email");
  const names = new Map((profiles ?? []).map((p) => [p.id, p.full_name ?? p.email ?? "Unknown"]));

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="breadcrumbs">FitWise / Administration / Activity Log</div>
          <h2>Activity Log</h2>
          <div className="muted small">Every administrative change, newest first. Entries are written by the server and cannot be edited.</div>
        </div>
      </div>
      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>When</th>
                <th>Action</th>
                <th>Details</th>
                <th>By</th>
              </tr>
            </thead>
            <tbody>
              {(entries ?? []).length === 0 ? (
                <tr>
                  <td colSpan={4} className="muted">
                    No administrative actions recorded yet.
                  </td>
                </tr>
              ) : (
                (entries ?? []).map((a) => (
                  <tr key={a.id}>
                    <td>{new Date(a.created_at).toLocaleString()}</td>
                    <td>{ACTION_LABELS[a.action] ?? a.action}</td>
                    <td>{describeTarget(a.details, names, a.target_id)}</td>
                    <td>{a.actor_id ? names.get(a.actor_id) ?? "—" : "—"}</td>
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
