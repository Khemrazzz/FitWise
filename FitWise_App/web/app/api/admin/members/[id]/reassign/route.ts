import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/authApi";
import { logAdminAction } from "@/lib/adminAudit";

export const runtime = "nodejs";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminApi();
  if ("error" in auth) return auth.error;
  const { id } = await params;

  const { trainerId }: { trainerId?: string } = await request.json().catch(() => ({}));
  if (!trainerId) return NextResponse.json({ error: "trainerId is required" }, { status: 400 });

  // Reads and the update run under the admin's own session, so RLS
  // ("admin reads all profiles", "admin reassigns members") applies.
  const { data: target } = await auth.supabase.from("profiles").select("role, status").eq("id", trainerId).single();
  if (target?.role !== "trainer" || target.status !== "active") {
    return NextResponse.json({ error: "Members can only be assigned to an active trainer." }, { status: 400 });
  }

  const { data: member } = await auth.supabase.from("members").select("trainer_id").eq("profile_id", id).single();
  if (!member) return NextResponse.json({ error: "Member not found" }, { status: 404 });
  if (member.trainer_id === trainerId) return NextResponse.json({ ok: true });

  const { error } = await auth.supabase.from("members").update({ trainer_id: trainerId }).eq("profile_id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  await logAdminAction(auth.userId, "member_reassigned", id, { from: member.trainer_id, to: trainerId });
  return NextResponse.json({ ok: true });
}
