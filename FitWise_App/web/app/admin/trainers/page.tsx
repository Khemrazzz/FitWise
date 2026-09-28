import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { TrainerActions } from "./TrainerActions";

const STATUS_LABEL = { pending: "pending approval", active: "active", disabled: "deactivated" } as const;
const STATUS_CLASS = { pending: " warning", active: "", disabled: " danger" } as const;
const ORDER = { pending: 0, active: 1, disabled: 2 } as const;

export default async function AdminTrainersPage() {
  await requireAdmin();
  const supabase = await createClient();

  const { data: trainers } = await supabase
    .from("profiles")
    .select("id, status, full_name, email, phone, specialisation, created_at")
    .eq("role", "trainer");
  const { data: members } = await supabase.from("members").select("trainer_id");

  const countByTrainer = new Map<string, number>();
  for (const m of members ?? []) countByTrainer.set(m.trainer_id, (countByTrainer.get(m.trainer_id) ?? 0) + 1);

  const rows = (trainers ?? []).sort(
    (a, b) =>
      ORDER[a.status as keyof typeof ORDER] - ORDER[b.status as keyof typeof ORDER] ||
      (a.full_name ?? "").localeCompare(b.full_name ?? "")
  );
  const activeOptions = rows.filter((t) => t.status === "active").map((t) => ({ id: t.id, name: t.full_name ?? t.email ?? t.id }));

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="breadcrumbs">FitWise / Administration / Trainers</div>
          <h2>Trainers</h2>
          <div className="muted small">Approve applications, add trainers and deactivate accounts. Deactivating moves the trainer's members first.</div>
        </div>
        <div className="action-row">
          <Link href="/admin/trainers/new" className="button primary small-button">
            + Add Trainer
          </Link>
        </div>
      </div>
      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Trainer</th>
                <th>Phone</th>
                <th>Specialisation</th>
                <th>Status</th>
                <th>Members</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="muted">
                    No trainers yet. Add one, or share the /signup link so trainers can apply.
                  </td>
                </tr>
              ) : (
                rows.map((t) => {
                  const status = t.status as keyof typeof STATUS_LABEL;
                  return (
                    <tr key={t.id}>
                      <td>
                        {t.full_name ?? "—"}
                        <br />
                        <span className="muted small">{t.email}</span>
                      </td>
                      <td>{t.phone ?? "—"}</td>
                      <td>{t.specialisation ?? "—"}</td>
                      <td>
                        <span className={`status${STATUS_CLASS[status]}`}>{STATUS_LABEL[status]}</span>
                      </td>
                      <td>{countByTrainer.get(t.id) ?? 0}</td>
                      <td>{new Date(t.created_at).toLocaleDateString()}</td>
                      <td>
                        <TrainerActions
                          trainerId={t.id}
                          status={status}
                          memberCount={countByTrainer.get(t.id) ?? 0}
                          otherTrainers={activeOptions}
                        />
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
