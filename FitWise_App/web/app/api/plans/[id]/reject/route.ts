import { NextResponse } from "next/server";
import { requireTrainerApi } from "@/lib/authApi";

export const runtime = "nodejs";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireTrainerApi();
  if ("error" in auth) return auth.error;
  const { id } = await params;

  const { reason }: { reason?: string } = await request.json().catch(() => ({}));
  if (!reason) return NextResponse.json({ error: "reason is required to reject a plan" }, { status: 400 });

  const { data: rejected, error } = await auth.supabase
    .from("plans")
    .update({ status: "rejected" })
    .eq("id", id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  if (!rejected) return NextResponse.json({ error: "Plan not found" }, { status: 404 });

  await auth.supabase.from("plan_audit_log").insert({
    plan_id: id,
    action: "rejected",
    reason,
    changed_by: auth.userId,
  });

  return NextResponse.json({ plan: rejected });
}
