import { NextResponse } from "next/server";
import { generateRuleBasedPlan } from "@/lib/ruleBased";
import { generateGeminiPlan } from "@/lib/geminiGenerator";
import { validatePlan } from "@/lib/validator";
import { MemberProfile } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const profile = (await request.json()) as MemberProfile;

    const ruleStart = performance.now();
    const rulePlan = generateRuleBasedPlan(profile);
    const ruleLatencyMs = Math.round((performance.now() - ruleStart) * 100) / 100;
    const ruleValidation = validatePlan(rulePlan, profile);

    const aiStart = performance.now();
    const aiPlan = await generateGeminiPlan(profile);
    const aiLatencyMs = Math.round((performance.now() - aiStart) * 100) / 100;
    const aiValidation = validatePlan(aiPlan, profile);

    return NextResponse.json({
      profile,
      ruleBased: { plan: rulePlan, validation: ruleValidation, latencyMs: ruleLatencyMs },
      gemini: { plan: aiPlan, validation: aiValidation, latencyMs: aiLatencyMs },
      comparison: {
        ruleConstraintScore: ruleValidation.score,
        geminiConstraintScore: aiValidation.score,
        ruleLatencyMs,
        geminiLatencyMs: aiLatencyMs,
        note: "Constraint score and latency are objective prototype measures. Personalisation/usability ratings require later human evaluation.",
      },
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Comparison failed" }, { status: 400 });
  }
}
