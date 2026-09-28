import { NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { computeProgress } from "@/lib/progress";
import type { WorkoutDay } from "@/lib/types";

export const runtime = "nodejs";

// This route is authenticated by an explicit `Authorization: Bearer <token>`
// header, not ambient cookies, so allowing any origin doesn't expose
// cross-site credential replay the way it would for a cookie-authenticated
// route -- it just lets the Flutter Web build (a real browser, unlike its
// Android/iOS builds) call this API cross-origin at all.
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

// The web app authenticates via cookies (lib/supabase/server.ts), but the
// Flutter app has no cookie jar shared with a browser -- it sends the
// Supabase access token as `Authorization: Bearer <token>` instead. A client
// built with that header attached makes PostgREST evaluate RLS as that user,
// same as the cookie-based client does for the web.
async function resolveClient(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice("Bearer ".length);
    const bearerClient = createSupabaseClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const {
      data: { user },
    } = await bearerClient.auth.getUser(token);
    return { supabase: bearerClient, user };
  }

  const cookieClient = await createClient();
  const {
    data: { user },
  } = await cookieClient.auth.getUser();
  return { supabase: cookieClient, user };
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, user } = await resolveClient(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: CORS_HEADERS });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  // A member may only view their own progress; a trainer may view any of
  // theirs -- RLS on the queries below already scopes trainer access to
  // their own members, so this check just rules out a member viewing
  // someone else's id.
  if (profile?.role === "member" && user.id !== id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403, headers: CORS_HEADERS });
  }

  const { data: assessment } = await supabase
    .from("assessments")
    .select("weight_kg, goal")
    .eq("member_id", id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();
  if (!assessment) return NextResponse.json({ error: "No assessment found for this member" }, { status: 404, headers: CORS_HEADERS });

  const { data: approvedPlans } = await supabase
    .from("plans")
    .select("id, days, assessments!inner(member_id)")
    .eq("status", "approved")
    .eq("assessments.member_id", id);

  const planIds = (approvedPlans ?? []).map((p) => p.id);
  const totalDays = (approvedPlans ?? []).reduce((sum, p) => sum + (p.days as WorkoutDay[]).length, 0);

  let completedDays = 0;
  if (planIds.length > 0) {
    const { count } = await supabase
      .from("completions")
      .select("id", { count: "exact", head: true })
      .in("plan_id", planIds);
    completedDays = count ?? 0;
  }

  const adherenceFactor = totalDays > 0 ? completedDays / totalDays : 0;
  const scenario = computeProgress(assessment.weight_kg, assessment.goal, adherenceFactor);

  return NextResponse.json({ ...scenario, completedDays, totalDays }, { headers: CORS_HEADERS });
}
