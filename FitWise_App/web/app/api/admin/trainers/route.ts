import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { requireAdminApi } from "@/lib/authApi";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAdminAction } from "@/lib/adminAudit";

export const runtime = "nodejs";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Admin adds a trainer directly: the account is active immediately and gets a
// one-time temporary password, the same hand-over pattern as member creation.
export async function POST(request: Request) {
  const auth = await requireAdminApi();
  if ("error" in auth) return auth.error;

  const body = await request.json().catch(() => ({}));
  const fullName = String(body.fullName ?? "").trim();
  const email = String(body.email ?? "").trim().toLowerCase();
  const phone = String(body.phone ?? "").trim() || null;
  const specialisation = String(body.specialisation ?? "").trim() || null;
  if (fullName.length < 2) return NextResponse.json({ error: "Enter the trainer's full name." }, { status: 400 });
  if (!EMAIL.test(email)) return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });

  const tempPassword = randomUUID().replace(/-/g, "").slice(0, 16);
  const admin = createAdminClient();
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });
  if (createError) return NextResponse.json({ error: createError.message }, { status: 400 });

  const { error: profileError } = await admin
    .from("profiles")
    .update({ role: "trainer", status: "active", full_name: fullName, phone, specialisation })
    .eq("id", created.user.id);
  if (profileError) {
    await admin.auth.admin.deleteUser(created.user.id);
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  await logAdminAction(auth.userId, "trainer_created", created.user.id, { email, fullName });
  return NextResponse.json({ trainerId: created.user.id, email, tempPassword });
}
