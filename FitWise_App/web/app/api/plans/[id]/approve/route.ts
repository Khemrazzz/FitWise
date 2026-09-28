import { NextResponse } from "next/server";
import { requireTrainerApi } from "@/lib/authApi";
import { validatePlan } from "@/lib/validator";
import { profileFromAssessment } from "@/lib/profileFromAssessment";
import { exercisesFromDb } from "@/lib/exercisesFromDb";
import type { WorkoutDay } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireTrainerApi();
  if ("error" in auth) return auth.error;
  const { id } = await params;

  const { editedDays, overrideReason }: { editedDays?: WorkoutDay[]; overrideReason?: string } = await request
    .json()
    .catch(() => ({}));

  const { data: plan, error: planError } = await auth.supabase.from("plans").select("*").eq("id", id).single();
  if (planError || !plan) return NextResponse.json({ error: "Plan not found" }, { status: 404 });

  let finalDays = plan.days;
  let finalValidation = plan.validation;

  if (editedDays) {
    const { data: assessment } = await auth.supabase.from("assessments").select("*").eq("id", plan.assessment_id).single();
    const { data: prediction } = await auth.supabase.from("predictions").select("*").eq("id", plan.prediction_id).single();
    const profile = profileFromAssessment(assessment, prediction.predicted_category);

    const editedPlan = {
      generator: plan.generator,
      planName: plan.plan_name,
      predictedWorkoutType: prediction.predicted_category,
      daysPerWeek: plan.days_per_week,
      explanation: plan.explanation,
      days: editedDays,
    };
    const { data: exerciseRows } = await auth.supabase.from("exercises").select("*").eq("is_active", true);
    const editedValidation = validatePlan(editedPlan, profile, exercisesFromDb(exerciseRows ?? []));

    if (!editedValidation.valid && !overrideReason) {
      return NextResponse.json(
        { error: "Edited plan fails validation -- approval requires overrideReason.", violations: editedValidation.violations },
        { status: 400 }
      );
    }

    await auth.supabase.from("plan_audit_log").insert({
      plan_id: id,
      action: "edited",
      reason: overrideReason ?? null,
      previous_days: plan.days,
      previous_validation: plan.validation,
      changed_by: auth.userId,
    });

    finalDays = editedDays;
    finalValidation = editedValidation;
  }

  // The UI disables Approve for invalid plans, but the route must enforce it too:
  // an unedited plan that failed validation can only be approved with an override reason.
  if (!finalValidation?.valid && !overrideReason) {
    return NextResponse.json(
      { error: "Plan fails validation -- approval requires overrideReason.", violations: finalValidation?.violations ?? [] },
      { status: 400 }
    );
  }

  const { data: approved, error: approveError } = await auth.supabase
    .from("plans")
    .update({
      days: finalDays,
      validation: finalValidation,
      status: "approved",
      approved_by: auth.userId,
      approved_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();
  if (approveError) return NextResponse.json({ error: approveError.message }, { status: 400 });

  await auth.supabase.from("plan_audit_log").insert({
    plan_id: id,
    action: "approved",
    reason: overrideReason ?? null,
    changed_by: auth.userId,
  });

  return NextResponse.json({ plan: approved });
}
