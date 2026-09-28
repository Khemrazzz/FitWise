import "server-only";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Route Handler equivalent of verifySession()/requireTrainer() in auth.ts --
// pages redirect, but a Route Handler must return a Response instead (per
// the Next.js auth guide's Route Handler pattern).
async function requireRoleApi(role: "trainer" | "admin") {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) } as const;
  }

  const { data: profile } = await supabase.from("profiles").select("role, status").eq("id", user.id).single();
  if (profile?.role !== role || profile?.status !== "active") {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) } as const;
  }

  return { supabase, userId: user.id } as const;
}

export function requireTrainerApi() {
  return requireRoleApi("trainer");
}

export function requireAdminApi() {
  return requireRoleApi("admin");
}
