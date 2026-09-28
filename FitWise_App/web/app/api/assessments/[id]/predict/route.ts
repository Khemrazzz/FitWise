import { NextResponse } from "next/server";
import { requireTrainerApi } from "@/lib/authApi";

export const runtime = "nodejs";

// Ports the field-mapping from FitWise_Prototype_Lab/web/app/api/model/predict/route.ts,
// adding an ownership check (via RLS on the assessments select) and a DB write.
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireTrainerApi();
  if ("error" in auth) return auth.error;
  const { id } = await params;

  // RLS scopes this to assessments belonging to one of this trainer's
  // members -- an assessment ID for another trainer's member simply won't
  // be found, rather than needing a separate ownership check here.
  const { data: assessment, error: assessmentError } = await auth.supabase
    .from("assessments")
    .select("*")
    .eq("id", id)
    .single();
  if (assessmentError || !assessment) {
    return NextResponse.json({ error: "Assessment not found" }, { status: 404 });
  }

  const mlUrl = process.env.ML_API_URL ?? "http://127.0.0.1:8000";
  const mlResponse = await fetch(`${mlUrl}/predict`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      age: assessment.age,
      gender: assessment.gender,
      weight_kg: assessment.weight_kg,
      height_m: assessment.height_m,
      fat_percentage: assessment.fat_percentage,
      workout_frequency: assessment.workout_frequency,
      experience_level: assessment.experience_level,
      bmi: assessment.bmi,
    }),
    cache: "no-store",
  });

  const mlBody = await mlResponse.json();
  if (!mlResponse.ok) return NextResponse.json(mlBody, { status: mlResponse.status });

  const { data: prediction, error: insertError } = await auth.supabase
    .from("predictions")
    .insert({
      assessment_id: id,
      predicted_category: mlBody.predictedWorkoutType,
      confidence: mlBody.confidence,
      probabilities: mlBody.probabilities,
      model_name: mlBody.modelName,
      model_version: mlBody.modelVersion,
      feature_profile: mlBody.featureProfile,
    })
    .select()
    .single();
  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 400 });

  return NextResponse.json({ prediction });
}
