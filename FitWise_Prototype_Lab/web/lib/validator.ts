import { EXERCISES } from "./exercises";
import { MemberProfile, ValidationResult, WorkoutPlan } from "./types";

const exerciseMap = new Map(EXERCISES.map((e) => [e.id, e]));

// VAL-07 bounds -- structured output (e.g. from Gemini) can be syntactically
// valid JSON while containing semantically nonsensical numbers (observed live:
// a "sets" value of ~4 quintillion). These bounds catch that class of error.
const MAX_SETS = 10;
const MAX_REPS = 50;
const MAX_REST_SECONDS = 300;

export function validatePlan(plan: WorkoutPlan, profile: MemberProfile): ValidationResult {
  const violations: string[] = [];
  let passed = 0;
  let total = 0;

  const check = (ok: boolean, message: string) => {
    total += 1;
    if (ok) passed += 1;
    else violations.push(message);
  };

  check(plan.predictedWorkoutType === profile.predictedWorkoutType, "Plan does not preserve the ML-predicted workout category.");
  check(plan.days.length === profile.daysPerWeek, `Expected ${profile.daysPerWeek} workout days but received ${plan.days.length}.`);

  plan.days.forEach((day) => {
    check(day.estimatedDurationMinutes <= profile.sessionDurationMinutes, `Day ${day.day} exceeds requested session duration.`);
    check(day.exercises.length >= 2, `Day ${day.day} contains too few exercises.`);

    const ids = day.exercises.map((e) => e.exerciseId);
    check(new Set(ids).size === ids.length, `Day ${day.day} contains duplicate exercise IDs.`);

    day.exercises.forEach((item) => {
      const exercise = exerciseMap.get(item.exerciseId);
      check(Boolean(exercise), `Unknown exercise ID returned: ${item.exerciseId}`);
      if (!exercise) return;

      check(exercise.difficulty.includes(profile.experienceLevel), `${exercise.name} is not approved for ${profile.experienceLevel}.`);
      check(exercise.equipment.every((e) => profile.equipment.includes(e)), `${exercise.name} requires unavailable equipment.`);
      check(!exercise.contraindicationTags.some((tag) => profile.restrictions.includes(tag)), `${exercise.name} violates a restriction tag.`);

      if (item.sets !== undefined) {
        check(
          Number.isInteger(item.sets) && item.sets >= 1 && item.sets <= MAX_SETS,
          `${exercise.name} has an out-of-range sets value (${item.sets}).`
        );
      }
      if (item.reps !== undefined) {
        check(
          Number.isInteger(item.reps) && item.reps >= 1 && item.reps <= MAX_REPS,
          `${exercise.name} has an out-of-range reps value (${item.reps}).`
        );
      }
      if (item.durationMinutes !== undefined) {
        check(
          Number.isFinite(item.durationMinutes) && item.durationMinutes > 0 && item.durationMinutes <= profile.sessionDurationMinutes,
          `${exercise.name} has an out-of-range duration value (${item.durationMinutes} minutes).`
        );
      }
      check(
        Number.isFinite(item.restSeconds) && item.restSeconds >= 0 && item.restSeconds <= MAX_REST_SECONDS,
        `${exercise.name} has an out-of-range rest value (${item.restSeconds} seconds).`
      );
    });
  });

  const score = total === 0 ? 0 : Math.round((passed / total) * 10000) / 100;
  return {
    valid: violations.length === 0,
    score,
    checksPassed: passed,
    totalChecks: total,
    violations,
  };
}
