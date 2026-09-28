import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ACTION_LABELS, describeTarget } from "@/lib/adminLabels";
import { TrainerActions } from "./trainers/TrainerActions";

export default async function AdminDashboard() {
  await requireAdmin();
  const supabase = await createClient();

  const { data: profiles } = await supabase.from("profiles").select("id, role, status, full_name, email, phone, specialisation, created_at");
  const { data: members } = await supabase.from("members").select("profile_id, trainer_id, created_at");
  const { data: exercises } = await supabase.from("exercises").select("id, is_active");
  const { data: activity } = await supabase
    .from("admin_audit_log")
    .select("id, action, target_id, details, created_at")
    .order("created_at", { ascending: false })
    .limit(8);

  const trainers = (profiles ?? []).filter((p) => p.role === "trainer");
  const pending = trainers.filter((t) => t.status === "pending");
  const active = trainers.filter((t) => t.status === "active");
  const disabled = trainers.filter((t) => t.status === "disabled");
  const names = new Map((profiles ?? []).map((p) => [p.id, p.full_name ?? p.email ?? "Unknown"]));
  const activeOptions = active.map((t) => ({ id: t.id, name: t.full_name ?? t.email ?? t.id }));

  const kpis: Array<[string, number | string, string?]> = [
    ["Active trainers", active.length],
    ["Pending applications", pending.length, pending.length ? "Needs review" : undefined],
    ["Deactivated trainers", disabled.length],
    ["Members", (members ?? []).length],
    ["Active exercises", `${(exercises ?? []).filter((e) => e.is_active).length} / ${(exercises ?? []).length}`],
    ["Admins", (profiles ?? []).filter((p) => p.role === "admin").length],
  ];

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="breadcrumbs">FitWise / Administration</div>
          <h2>Gym Administration</h2>
          <div className="muted small">Trainer accounts, member assignments and the shared exercise catalogue.</div>
        </div>
        <div className="action-row">
          <Link href="/admin/trainers/new" className="button primary small-button">
            + Add Trainer
          </Link>
        </div>
      </div>

      <div className="grid six">
        {kpis.map(([label, value, sub]) => (
          <div className="card" key={label}>
            <span className="kpi-label">{label}</span>
            <span className="kpi-value">{value}</span>
            {sub && <span className="trend down">{sub}</span>}
          </div>
        ))}
      </div>

      <div className="grid two" style={{ marginTop: 13, alignItems: "start" }}>
        <div className="card">
          <h3>Trainer applications</h3>
          {pending.length === 0 ? (
            <p className="muted small">No applications waiting. New trainers apply at /signup.</p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Applicant</th>
                    <th>Specialisation</th>
                    <th>Applied</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pending.map((t) => (
                    <tr key={t.id}>
                      <td>
                        {t.full_name ?? "—"}
                        <br />
                        <span className="muted small">{t.email}</span>
                      </td>
                      <td>{t.specialisation ?? "—"}</td>
                      <td>{new Date(t.created_at).toLocaleDateString()}</td>
                      <td>
                        <TrainerActions trainerId={t.id} status="pending" memberCount={0} otherTrainers={activeOptions} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <div className="card">
          <h3>Recent activity</h3>
          {(activity ?? []).length === 0 ? (
            <p className="muted small">No administrative actions recorded yet.</p>
          ) : (
            <div className="grid" style={{ gap: 8 }}>
              {(activity ?? []).map((a) => (
                <div key={a.id} className="settings-row">
                  <span>
                    <strong>{ACTION_LABELS[a.action] ?? a.action}</strong>
                    <br />
                    <span className="muted small">{describeTarget(a.details, names, a.target_id)}</span>
                  </span>
                  <span className="muted small">{new Date(a.created_at).toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
          <Link href="/admin/activity" className="button secondary small-button" style={{ marginTop: 12 }}>
            View full log
          </Link>
        </div>
      </div>
    </div>
  );
}
