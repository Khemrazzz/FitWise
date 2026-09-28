// Human-readable text for admin_audit_log entries, shared by the dashboard and activity log.
export const ACTION_LABELS: Record<string, string> = {
  trainer_created: "Trainer added",
  trainer_approved: "Trainer approved",
  trainer_rejected: "Application rejected",
  trainer_deactivated: "Trainer deactivated",
  trainer_reactivated: "Trainer reactivated",
  member_reassigned: "Member reassigned",
  exercise_updated: "Exercise updated",
};

export function describeTarget(details: Record<string, unknown> | null, names: Map<string, string>, targetId: string | null): string {
  if (!details) return targetId ? names.get(targetId) ?? "" : "";
  if (typeof details.email === "string") return String(details.fullName ?? names.get(targetId ?? "") ?? details.email);
  if (typeof details.exerciseId === "string") {
    const changes = Object.entries(details)
      .filter(([k]) => k !== "exerciseId")
      .map(([k, v]) => `${k.replaceAll("_", " ")}: ${Array.isArray(v) ? v.join(", ") : String(v)}`);
    return `${details.exerciseId}${changes.length ? ` (${changes.join("; ")})` : ""}`;
  }
  if (typeof details.to === "string") {
    return `${names.get(targetId ?? "") ?? "Member"} → ${names.get(details.to) ?? "trainer"}`;
  }
  return targetId ? names.get(targetId) ?? "" : "";
}
