import { NextResponse } from "next/server";
import { generateRuleBasedPlan } from "@/lib/ruleBased";
import { validatePlan } from "@/lib/validator";
import { MemberProfile } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const profile = (await request.json()) as MemberProfile;
    const started = performance.now();
    const plan = generateRuleBasedPlan(profile);
    const latencyMs = Math.round((performance.now() - started) * 100) / 100;
    const validation = validatePlan(plan, profile);
    return NextResponse.json({ plan, validation, latencyMs });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Rule generation failed" }, { status: 400 });
  }
}
