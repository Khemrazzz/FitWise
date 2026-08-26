import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const input = await request.json();
    const url = process.env.ML_API_URL ?? "http://127.0.0.1:8000";

    const response = await fetch(`${url}/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        age: input.age,
        gender: input.gender,
        weight_kg: input.weightKg,
        height_m: input.heightM,
        fat_percentage: input.fatPercentage,
        workout_frequency: input.workoutFrequency,
        experience_level: input.experienceLevelNumber,
        bmi: input.bmi,
      }),
      cache: "no-store",
    });

    const body = await response.json();
    if (!response.ok) return NextResponse.json(body, { status: response.status });
    return NextResponse.json(body);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Prediction failed" }, { status: 500 });
  }
}
