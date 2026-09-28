import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { requireTrainerApi } from "@/lib/authApi";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function GET() {
  const auth = await requireTrainerApi();
  if ("error" in auth) return auth.error;

  const { data: members, error } = await auth.supabase
    .from("members")
    .select("profile_id, created_at")
    .eq("trainer_id", auth.userId)
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  if (members.length === 0) return NextResponse.json({ members: [] });

  const { data: profiles, error: profilesError } = await auth.supabase
    .from("profiles")
    .select("id, full_name")
    .in(
      "id",
      members.map((m) => m.profile_id)
    );
  if (profilesError) return NextResponse.json({ error: profilesError.message }, { status: 400 });

  const nameById = new Map(profiles.map((p) => [p.id, p.full_name]));
  return NextResponse.json({
    members: members.map((m) => ({ id: m.profile_id, createdAt: m.created_at, fullName: nameById.get(m.profile_id) ?? null })),
  });
}

export async function POST(request: Request) {
  const auth = await requireTrainerApi();
  if ("error" in auth) return auth.error;

  const { email, fullName, phone, dateOfBirth, emergencyContact } = await request.json();
  if (!email) return NextResponse.json({ error: "email is required" }, { status: 400 });

  // Members log in later (web now, Flutter in a later phase), so they need a
  // real Supabase Auth user -- not just a database row. There's no public
  // signup for members by design; the trainer creates the account and hands
  // over this one-time password out of band.
  const tempPassword = randomUUID().replace(/-/g, "").slice(0, 16);
  const admin = createAdminClient();
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
    user_metadata: { full_name: fullName ?? null },
  });
  if (createError) return NextResponse.json({ error: createError.message }, { status: 400 });

  const { error: memberError } = await auth.supabase.from("members").insert({
    profile_id: created.user.id,
    trainer_id: auth.userId,
    phone: phone ?? null,
    date_of_birth: dateOfBirth ?? null,
    emergency_contact: emergencyContact ?? null,
  });
  if (memberError) return NextResponse.json({ error: memberError.message }, { status: 400 });

  return NextResponse.json({ memberId: created.user.id, email, tempPassword });
}
