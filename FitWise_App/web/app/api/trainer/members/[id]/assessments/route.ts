import { NextResponse } from "next/server";
import { requireTrainerApi } from "@/lib/authApi";
import type { MemberProfile } from "@/lib/types";

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireTrainerApi();
  if ("error" in auth) return auth.error;
  const { id } = await params;

  const { data, error } = await auth.supabase
    .from("assessments")
    .select("*")
    .eq("member_id", id)
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ assessments: data });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireTrainerApi();
  if ("error" in auth) return auth.error;
  const { id } = await params;

  const profile = (await request.json()) as MemberProfile & {
    targetWeightKg?: number;
    preferredDays?: string;
    availableTime?: string;
    trainerNotes?: string;
  };

  // RLS ("trainer manages own members assessments") is the real enforcement
  // here -- this insert fails at the database level if `id` isn't one of
  // this trainer's members, even if this check were skipped.
  const { data, error } = await auth.supabase
    .from("assessments")
    .insert({
      member_id: id,
      age: profile.age,
      gender: profile.gender,
      weight_kg: profile.weightKg,
      height_m: profile.heightM,
      fat_percentage: profile.fatPercentage,
      workout_frequency: profile.workoutFrequency,
      experience_level: profile.experienceLevelNumber,
      bmi: profile.bmi,
      goal: profile.goal,
      days_per_week: profile.daysPerWeek,
      session_duration_minutes: profile.sessionDurationMinutes,
      equipment: profile.equipment,
      restrictions: profile.restrictions,
      target_weight_kg: profile.targetWeightKg ?? null,
      preferred_days: profile.preferredDays ?? null,
      available_time: profile.availableTime ?? null,
      trainer_notes: profile.trainerNotes ?? null,
      created_by: auth.userId,
    })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ assessment: data });
}
