import { EXERCISES } from "./exercises";
import { Exercise, MemberProfile, PlannedExercise, WorkoutCategory, WorkoutDay, WorkoutPlan } from "./types";

// Every list must include all 4 categories -- Array.indexOf returns -1 for a
// missing entry, which sorts it *ahead* of every present entry (since -1 < 0).
// Omitting HIIT here previously caused HIIT exercises to be prioritised above
// the actual predicted category in every non-HIIT plan.
const categoryFallback: Record<WorkoutCategory, WorkoutCategory[]> = {
  Strength: ["Strength", "HIIT", "Yoga", "Cardio"],
  Cardio: ["Cardio", "HIIT", "Strength", "Yoga"],
  HIIT: ["HIIT", "Cardio", "Strength", "Yoga"],
  Yoga: ["Yoga", "Strength", "Cardio", "HIIT"],
};

function equipmentAllowed(exercise: Exercise, profile: MemberProfile): boolean {
  return exercise.equipment.every((item) => profile.equipment.includes(item));
}

function restrictionAllowed(exercise: Exercise, profile: MemberProfile): boolean {
  return !exercise.contraindicationTags.some((tag) => profile.restrictions.includes(tag));
}

function difficultyAllowed(exercise: Exercise, profile: MemberProfile): boolean {
  return exercise.difficulty.includes(profile.experienceLevel);
}

function eligibleExercises(profile: MemberProfile, exercises: Exercise[]): Exercise[] {
  const predicted = profile.predictedWorkoutType ?? "Strength";
  const categoryRank = categoryFallback[predicted];

  return exercises.filter((e) =>
    equipmentAllowed(e, profile) && restrictionAllowed(e, profile) && difficultyAllowed(e, profile)
  ).sort((a, b) => {
    const categoryDiff = categoryRank.indexOf(a.category) - categoryRank.indexOf(b.category);
    if (categoryDiff !== 0) return categoryDiff;
    return a.id.localeCompare(b.id);
  });
}

function prescription(exercise: Exercise, profile: MemberProfile): PlannedExercise {
  const levels = {
    beginner: { sets: 2, reps: 10, rest: 75 },
    intermediate: { sets: 3, reps: 10, rest: 60 },
    advanced: { sets: 4, reps: 8, rest: 60 },
  } as const;
  const p = levels[profile.experienceLevel];

  if (exercise.category === "Cardio" || exercise.category === "HIIT" || exercise.category === "Yoga") {
    return {
      exerciseId: exercise.id,
      durationMinutes: exercise.estimatedMinutes,
      restSeconds: exercise.category === "HIIT" ? 45 : 30,
    };
  }

  return {
    exerciseId: exercise.id,
    sets: p.sets,
    reps: p.reps,
    restSeconds: p.rest,
  };
}

function buildDay(day: number, profile: MemberProfile, pool: Exercise[]): WorkoutDay {
  const selected: Exercise[] = [];
  const usedPrimaryMuscles = new Set<string>();
  let estimated = 8; // warm-up allowance

  for (const exercise of pool) {
    if (estimated + exercise.estimatedMinutes > profile.sessionDurationMinutes - 5) continue;
    const primary = exercise.muscles[0];
    if (usedPrimaryMuscles.has(primary) && selected.length < 4) continue;

    selected.push(exercise);
    usedPrimaryMuscles.add(primary);
    estimated += exercise.estimatedMinutes;
    if (selected.length >= 6) break;
  }

  if (selected.length < 3) {
    for (const exercise of pool) {
      if (selected.some((s) => s.id === exercise.id)) continue;
      if (estimated + exercise.estimatedMinutes > profile.sessionDurationMinutes - 3) continue;
      selected.push(exercise);
      estimated += exercise.estimatedMinutes;
      if (selected.length >= 3) break;
    }
  }

  return {
    day,
    title: `${profile.predictedWorkoutType ?? "Fitness"} Session ${day}`,
    focus: profile.goal.replaceAll("_", " "),
    estimatedDurationMinutes: Math.min(profile.sessionDurationMinutes, estimated + 5),
    exercises: selected.map((e) => prescription(e, profile)),
  };
}

// `exercises` defaults to the static prototype catalogue so existing callers
// (and the prototype itself) keep working unchanged; FitWise_App's routes
// pass the `exercises` table's contents explicitly so a trainer editing the
// catalogue is reflected without a redeploy.
export function generateRuleBasedPlan(profile: MemberProfile, exercises: Exercise[] = EXERCISES): WorkoutPlan {
  if (!profile.predictedWorkoutType) {
    throw new Error("ML predictedWorkoutType is required before plan generation.");
  }

  const pool = eligibleExercises(profile, exercises);
  if (pool.length < 3) {
    throw new Error("Not enough approved exercises satisfy this profile's equipment/restrictions.");
  }

  const days = Array.from({ length: profile.daysPerWeek }, (_, i) => {
    // Deterministically rotate pool so each day is not identical while remaining reproducible.
    const offset = (i * 3) % pool.length;
    const rotated = [...pool.slice(offset), ...pool.slice(0, offset)];
    return buildDay(i + 1, profile, rotated);
  });

  return {
    generator: "rule_based",
    planName: `Deterministic ${profile.predictedWorkoutType} Plan`,
    predictedWorkoutType: profile.predictedWorkoutType,
    daysPerWeek: profile.daysPerWeek,
    explanation: "Generated deterministically from the ML category, approved exercise catalogue, experience, equipment, time and restriction rules.",
    rulesApplied: [
      "RULE-01: use ML-predicted workout category as primary category",
      "RULE-02: exclude exercises requiring unavailable equipment",
      "RULE-03: exclude exercises matching restriction tags",
      "RULE-04: restrict exercise difficulty to the member experience level",
      "RULE-05: keep each session within the requested duration",
      "RULE-06: rotate approved exercises deterministically across training days",
    ],
    days,
  };
}
