import type { FitnessGoal } from "@/lib/types";

// Scenario-based projection, NOT a fitted forecast. The dataset backing the
// ML model has no longitudinal observations of the same member over time, so
// there is no data to fit a real trend model against -- per the
// dissertation's own framing (Ch3.7), this is a transparent, documented
// scenario using a conservative assumed monthly rate, not a prediction.
//
// Only weight_loss and muscle_gain have a meaningful weight-based scenario;
// endurance/general_fitness/flexibility aren't primarily about body weight,
// so their projection is flat (baseline held constant) rather than a
// fabricated number.
const BASE_MONTHLY_CHANGE_KG: Record<FitnessGoal, number> = {
  weight_loss: -2, // conservative, sustainable rate at full adherence
  muscle_gain: 0.25, // conservative lean-mass gain rate at full adherence
  endurance: 0,
  general_fitness: 0,
  flexibility: 0,
};

export interface ProgressScenario {
  baselineWeightKg: number;
  goal: FitnessGoal;
  adherenceFactor: number; // 0..1, from completions vs. expected plan days
  monthlyChangeRateKg: number; // at full adherence
  projections: {
    month1: number;
    month2: number;
    month3: number;
  };
  targetWeightKg: number; // month3 projection, the scenario's stated goalpost
  assumptions: string[];
  disclaimer: string;
}

export function computeProgress(baselineWeightKg: number, goal: FitnessGoal, adherenceFactor: number): ProgressScenario {
  const clampedAdherence = Math.max(0, Math.min(1, adherenceFactor));
  const monthlyChangeRateKg = BASE_MONTHLY_CHANGE_KG[goal];
  const projectedChange = (months: number) => monthlyChangeRateKg * clampedAdherence * months;

  const projections = {
    month1: round1(baselineWeightKg + projectedChange(1)),
    month2: round1(baselineWeightKg + projectedChange(2)),
    month3: round1(baselineWeightKg + projectedChange(3)),
  };

  return {
    baselineWeightKg,
    goal,
    adherenceFactor: clampedAdherence,
    monthlyChangeRateKg,
    projections,
    targetWeightKg: projections.month3,
    assumptions: [
      `Assumes a conservative ${monthlyChangeRateKg} kg/month change at full (100%) adherence to the approved plan.`,
      `This member's adherence factor is ${Math.round(clampedAdherence * 100)}%, scaling the projected change proportionally.`,
      "Does not account for nutrition, sleep, individual physiology or measurement error.",
    ],
    disclaimer:
      "This is a scenario projection based on a configurable assumed rate, not a fitted forecast or a clinical prescription -- the underlying dataset has no longitudinal data to forecast from.",
  };
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
