import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { planId, dayNumber, notes } = await request.json();
  if (!planId || !dayNumber) return NextResponse.json({ error: "planId and dayNumber are required" }, { status: 400 });

  // RLS ("member manages own completions") enforces member_id = auth.uid()
  // regardless of what's sent, but setting it explicitly keeps the insert
  // payload self-documenting.
  const { data, error } = await supabase
    .from("completions")
    .insert({ plan_id: planId, member_id: user.id, day_number: dayNumber, notes: notes ?? null })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ completion: data });
}
