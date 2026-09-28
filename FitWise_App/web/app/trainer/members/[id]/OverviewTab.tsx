import type { MemberData } from "./page";

export function OverviewTab({ data }: { data: MemberData }) {
  const latestAssessment = data.assessments[0] as Record<string, unknown> | undefined;
  const latestPrediction = data.predictions[0] as Record<string, unknown> | undefined;
  const approvedPlan = data.plans.find((p) => p.status === "approved") as Record<string, unknown> | undefined;

  return (
    <div className="grid three">
      <div className="card">
        <h3>Personal information</h3>
        <p>
          <span className="muted">Phone</span>
          <br />
          <b>{data.phone ?? "Not recorded"}</b>
        </p>
        <p>
          <span className="muted">Date of birth</span>
          <br />
          <b>{data.dateOfBirth ? new Date(data.dateOfBirth).toLocaleDateString() : "Not recorded"}</b>
        </p>
        {latestAssessment && (
          <>
            <p>
              <span className="muted">Age / gender</span>
              <br />
              <b>
                {latestAssessment.age as number} · {latestAssessment.gender as string}
              </b>
            </p>
            <p>
              <span className="muted">Height / weight</span>
              <br />
              <b>
                {latestAssessment.height_m as number} m · {latestAssessment.weight_kg as number} kg
              </b>
            </p>
            {(latestAssessment.restrictions as string[])?.length > 0 && (
              <p>
                <span className="muted">Restrictions</span>
                <br />
                <b>{(latestAssessment.restrictions as string[]).join(", ")}</b>
              </p>
            )}
          </>
        )}
      </div>

      <div className="card">
        <h3>Current fitness plan</h3>
        {latestAssessment ? (
          <>
            <p>
              <span className="muted">Goal</span>
              <br />
              <b>{(latestAssessment.goal as string)?.replaceAll("_", " ")}</b>
            </p>
            <p>
              <span className="muted">Workout plan</span>
              <br />
              <b>{approvedPlan ? (approvedPlan.plan_name as string) : "No approved plan yet"}</b>
            </p>
            {latestPrediction && (
              <p>
                <span className="muted">Predicted type</span>
                <br />
                <b>
                  {latestPrediction.predicted_category as string} · {Math.round((latestPrediction.confidence as number) * 100)}%
                </b>
              </p>
            )}
            {latestAssessment.target_weight_kg != null && (
              <p>
                <span className="muted">Target</span>
                <br />
                <b>{latestAssessment.target_weight_kg as number} kg</b>
              </p>
            )}
          </>
        ) : (
          <p className="muted small">No fitness data recorded yet.</p>
        )}
      </div>

      <div className="card">
        <h3>Predictions &amp; plans</h3>
        <p>
          <span className="muted">Predictions run</span>
          <br />
          <b>{data.predictions.length}</b>
        </p>
        <p>
          <span className="muted">Plans generated</span>
          <br />
          <b>{data.plans.length}</b>
        </p>
        <p>
          <span className="muted">Approved plan</span>
          <br />
          <b>{approvedPlan ? "Yes" : "None yet"}</b>
        </p>
      </div>
    </div>
  );
}
