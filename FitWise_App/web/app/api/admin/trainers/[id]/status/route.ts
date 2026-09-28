import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/authApi";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAdminAction } from "@/lib/adminAudit";

export const runtime = "nodejs";

// A ban blocks sign-in and token refresh, so a deactivated trainer loses
// access at the auth layer too, not only in the app's own checks.
const BAN_FOREVER = "876000h";

type Action = "approve" | "reject" | "deactivate" | "reactivate";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminApi();
  if ("error" in auth) return auth.error;
  const { id } = await params;

  const { action, reassignTo }: { action?: Action; reassignTo?: string } = await request.json().catch(() => ({}));
  const admin = createAdminClient();

  const { data: trainer } = await admin.from("profiles").select("id, role, status, full_name, email").eq("id", id).single();
  if (!trainer || trainer.role !== "trainer") return NextResponse.json({ error: "Trainer not found" }, { status: 404 });

  const expected: Record<Action, string> = { approve: "pending", reject: "pending", deactivate: "active", reactivate: "disabled" };
  if (!action || !(action in expected)) return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  if (trainer.status !== expected[action]) {
    return NextResponse.json({ error: `Cannot ${action} a trainer whose status is ${trainer.status}.` }, { status: 409 });
  }

  if (action === "approve") {
    const { error } = await admin.from("profiles").update({ status: "active" }).eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    await logAdminAction(auth.userId, "trainer_approved", id, { email: trainer.email });
  }

  if (action === "reject") {
    // A pending application owns no members or plans, so the account is removed.
    const { error } = await admin.auth.admin.deleteUser(id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    await logAdminAction(auth.userId, "trainer_rejected", id, { email: trainer.email, fullName: trainer.full_name });
  }

  if (action === "deactivate") {
    const { count } = await admin.from("members").select("profile_id", { count: "exact", head: true }).eq("trainer_id", id);
    if ((count ?? 0) > 0) {
      if (!reassignTo || reassignTo === id) {
        return NextResponse.json({ error: "This trainer has members. Choose another active trainer to take them over." }, { status: 400 });
      }
      const { data: target } = await admin.from("profiles").select("role, status").eq("id", reassignTo).single();
      if (target?.role !== "trainer" || target.status !== "active") {
        return NextResponse.json({ error: "Members can only be moved to an active trainer." }, { status: 400 });
      }
      const { error: moveError } = await admin.from("members").update({ trainer_id: reassignTo }).eq("trainer_id", id);
      if (moveError) return NextResponse.json({ error: moveError.message }, { status: 500 });
    }
    const { error: banError } = await admin.auth.admin.updateUserById(id, { ban_duration: BAN_FOREVER });
    if (banError) return NextResponse.json({ error: banError.message }, { status: 500 });
    const { error } = await admin.from("profiles").update({ status: "disabled" }).eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    await logAdminAction(auth.userId, "trainer_deactivated", id, { email: trainer.email, membersMoved: count ?? 0, reassignTo: reassignTo ?? null });
  }

  if (action === "reactivate") {
    const { error: unbanError } = await admin.auth.admin.updateUserById(id, { ban_duration: "none" });
    if (unbanError) return NextResponse.json({ error: unbanError.message }, { status: 500 });
    const { error } = await admin.from("profiles").update({ status: "active" }).eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    await logAdminAction(auth.userId, "trainer_reactivated", id, { email: trainer.email });
  }

  return NextResponse.json({ ok: true });
}
