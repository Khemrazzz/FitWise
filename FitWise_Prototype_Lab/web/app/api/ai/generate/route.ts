import { NextResponse } from "next/server";
import { generateGeminiPlan } from "@/lib/geminiGenerator";
import { validatePlan } from "@/lib/validator";
import { MemberProfile } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const profile = (await request.json()) as MemberProfile;
    const started = performance.now();
    const plan = await generateGeminiPlan(profile);
    const latencyMs = Math.round((performance.now() - started) * 100) / 100;
    const validation = validatePlan(plan, profile);
    return NextResponse.json({ plan, validation, latencyMs });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Gemini generation failed" }, { status: 400 });
  }
}
