import { NextResponse } from "next/server";
import { requireTrainerApi } from "@/lib/authApi";
import { generateRuleBasedPlan } from "@/lib/ruleBased";
import { generateGeminiPlan } from "@/lib/geminiGenerator";
import { validatePlan } from "@/lib/validator";
import { profileFromAssessment } from "@/lib/profileFromAssessment";
import { exercisesFromDb } from "@/lib/exercisesFromDb";
import type { WorkoutPlan } from "@/lib/types";

export const runtime = "nodejs";

// Ports the pattern from FitWise_Prototype_Lab/web/app/api/compare/route.ts:
// same profile + prediction into both generators, validated identically, so
// the comparison stays fair. As of Phase 8, the exercise catalogue comes
// from the `exercises` table (editable by a trainer) rather than the static
// lib/exercises.ts array, so a catalogue edit is reflected without a
// redeploy -- generateRuleBasedPlan/generateGeminiPlan/validatePlan still
// default to the static array for any caller that doesn't pass one.
export async function POST(request: Request) {
  const auth = await requireTrainerApi();
  if ("error" in auth) return auth.error;

  const { assessmentId } = await request.json();
  if (!assessmentId) return NextResponse.json({ error: "assessmentId is required" }, { status: 400 });

  const { data: exerciseRows, error: exercisesError } = await auth.supabase
    .from("exercises")
    .select("*")
    .eq("is_active", true);
  if (exercisesError) return NextResponse.json({ error: exercisesError.message }, { status: 400 });
  const exercises = exercisesFromDb(exerciseRows ?? []);

  const { data: assessment, error: assessmentError } = await auth.supabase
    .from("assessments")
    .select("*")
    .eq("id", assessmentId)
    .single();
  if (assessmentError || !assessment) return NextResponse.json({ error: "Assessment not found" }, { status: 404 });

  const { data: prediction, error: predictionError } = await auth.supabase
    .from("predictions")
    .select("*")
    .eq("assessment_id", assessmentId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();
  if (predictionError || !prediction) {
    return NextResponse.json({ error: "Run an ML prediction for this assessment first." }, { status: 400 });
  }

  const profile = profileFromAssessment(assessment, prediction.predicted_category);

  const results: Array<{ plan?: WorkoutPlan; error?: string }> = [];
  try {
    results.push({ plan: generateRuleBasedPlan(profile, exercises) });
  } catch (error) {
    results.push({ error: error instanceof Error ? error.message : "Rule-based generation failed" });
  }
  try {
    results.push({ plan: await generateGeminiPlan(profile, exercises) });
  } catch (error) {
    results.push({ error: error instanceof Error ? error.message : "Gemini generation failed" });
  }

  const inserted = [];
  for (const result of results) {
    if (!result.plan) continue;
    const validation = validatePlan(result.plan, profile, exercises);
    const { data, error } = await auth.supabase
      .from("plans")
      .insert({
        assessment_id: assessmentId,
        prediction_id: prediction.id,
        generator: result.plan.generator,
        plan_name: result.plan.planName,
        days_per_week: result.plan.daysPerWeek,
        explanation: result.plan.explanation,
        days: result.plan.days,
        rules_applied: result.plan.rulesApplied ?? null,
        validation,
        status: "draft",
      })
      .select()
      .single();
    if (!error) inserted.push(data);
  }

  return NextResponse.json({
    plans: inserted,
    errors: results.filter((r) => r.error).map((r) => r.error),
  });
}
