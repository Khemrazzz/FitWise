import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Public trainer application. The account is created as a *pending* trainer:
// it can sign in but only reaches /pending until an admin approves it, and
// current_app_role() returns null for it, so no trainer RLS policy applies.
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const fullName = String(body.fullName ?? "").trim();
  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");
  const phone = String(body.phone ?? "").trim() || null;
  const specialisation = String(body.specialisation ?? "").trim() || null;

  if (fullName.length < 2) return NextResponse.json({ error: "Enter your full name." }, { status: 400 });
  if (!EMAIL.test(email)) return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  if (password.length < 8) return NextResponse.json({ error: "Use a password of at least 8 characters." }, { status: 400 });

  const admin = createAdminClient();
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });
  if (createError) {
    const taken = /already|registered|exists/i.test(createError.message);
    return NextResponse.json(
      { error: taken ? "An account with this email already exists. Sign in instead." : createError.message },
      { status: taken ? 409 : 400 }
    );
  }

  // The on_auth_user_created trigger inserted a 'member' profile; turn it into
  // a pending trainer application (only the service role may change these).
  const { error: profileError } = await admin
    .from("profiles")
    .update({ role: "trainer", status: "pending", full_name: fullName, phone, specialisation })
    .eq("id", created.user.id);
  if (profileError) {
    await admin.auth.admin.deleteUser(created.user.id);
    return NextResponse.json({ error: "Could not create the application. Try again." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
