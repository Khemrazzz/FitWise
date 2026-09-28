import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/authApi";
import { logAdminAction } from "@/lib/adminAudit";

export const runtime = "nodejs";

const EDITABLE_FIELDS = ["difficulty", "equipment", "contraindication_tags", "is_active", "estimated_minutes"] as const;

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminApi();
  if ("error" in auth) return auth.error;
  const { id } = await params;

  const body = await request.json();
  const update: Record<string, unknown> = {};
  for (const field of EDITABLE_FIELDS) {
    if (field in body) update[field] = body[field];
  }
  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: `No editable fields provided (allowed: ${EDITABLE_FIELDS.join(", ")})` }, { status: 400 });
  }

  const { data, error } = await auth.supabase.from("exercises").update(update).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  if (!data) return NextResponse.json({ error: "Exercise not found" }, { status: 404 });

  await logAdminAction(auth.userId, "exercise_updated", null, { exerciseId: id, ...update });

  return NextResponse.json({ exercise: data });
}
