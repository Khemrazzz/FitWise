import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ExerciseToggle } from "./ExerciseToggle";

const list = (v: string[] | null) => (v && v.length ? v.join(", ").replaceAll("_", " ") : "—");

export default async function AdminExercisesPage() {
  await requireAdmin();
  const supabase = await createClient();
  const { data: exercises } = await supabase
    .from("exercises")
    .select("id, name, category, difficulty, equipment, contraindication_tags, estimated_minutes, is_active")
    .order("category")
    .order("name");

  const active = (exercises ?? []).filter((e) => e.is_active).length;

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="breadcrumbs">FitWise / Administration / Exercise Catalogue</div>
          <h2>Exercise Catalogue</h2>
          <div className="muted small">
            Both plan generators only choose active exercises. Changes apply to the next plan any trainer generates.
          </div>
        </div>
      </div>
      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Exercise</th>
                <th>Category</th>
                <th>Levels</th>
                <th>Equipment</th>
                <th>Avoid for</th>
                <th>Minutes</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {(exercises ?? []).map((e) => (
                <tr key={e.id}>
                  <td>
                    {e.name}
                    <br />
                    <span className="muted small">{e.id}</span>
                  </td>
                  <td>{e.category}</td>
                  <td>{list(e.difficulty)}</td>
                  <td>{list(e.equipment)}</td>
                  <td>{list(e.contraindication_tags)}</td>
                  <td>{e.estimated_minutes}</td>
                  <td>
                    <span className={`status${e.is_active ? "" : " danger"}`}>{e.is_active ? "active" : "inactive"}</span>
                  </td>
                  <td>
                    <ExerciseToggle exerciseId={e.id} isActive={e.is_active} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="muted small" style={{ marginTop: 12 }}>
          {active} of {(exercises ?? []).length} exercises active
        </div>
      </div>
    </div>
  );
}
