import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export type AdminAction =
  | "trainer_created"
  | "trainer_approved"
  | "trainer_rejected"
  | "trainer_deactivated"
  | "trainer_reactivated"
  | "member_reassigned"
  | "exercise_updated";

// admin_audit_log has no insert policy, so entries can only come from the
// server; a failed write is reported but never blocks the admin action.
export async function logAdminAction(actorId: string, action: AdminAction, targetId: string | null, details?: Record<string, unknown>) {
  const { error } = await createAdminClient()
    .from("admin_audit_log")
    .insert({ actor_id: actorId, action, target_id: targetId, details: details ?? null });
  if (error) console.error("admin_audit_log insert failed:", error.message);
}
