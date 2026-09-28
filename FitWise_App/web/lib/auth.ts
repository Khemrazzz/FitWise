import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type Role = "admin" | "trainer" | "member";
export type AccountStatus = "pending" | "active" | "disabled";

export interface Session {
  userId: string;
  email: string | undefined;
  role: Role;
  status: AccountStatus;
}

// Data Access Layer entry point (per Next.js's own auth guide): every
// server-side data request/action that needs an authenticated user should
// call this rather than reading the session directly, so the auth check
// can't be forgotten in a new route.
export async function verifySession(): Promise<Session> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, status")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/login");

  return { userId: user.id, email: user.email, role: profile.role, status: profile.status ?? "active" };
}

// Where a signed-in account belongs, used by the login page and by guards
// that bounce an account out of an area it can't use.
export function homeFor(session: Pick<Session, "role" | "status">): string {
  if (session.status !== "active") return "/pending";
  if (session.role === "admin") return "/admin";
  if (session.role === "trainer") return "/trainer";
  return "/member";
}

export async function requireTrainer(): Promise<Session> {
  const session = await verifySession();
  if (session.role !== "trainer" || session.status !== "active") redirect(homeFor(session));
  return session;
}

export async function requireAdmin(): Promise<Session> {
  const session = await verifySession();
  if (session.role !== "admin" || session.status !== "active") redirect(homeFor(session));
  return session;
}
