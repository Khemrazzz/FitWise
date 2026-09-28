import type { ExperienceLevel, MemberProfile, WorkoutCategory } from "@/lib/types";

const EXPERIENCE_LEVELS: Record<1 | 2 | 3, ExperienceLevel> = { 1: "beginner", 2: "intermediate", 3: "advanced" };

// Shared between /api/plans/generate and /api/plans/[id]/approve -- both
// need to reconstruct a MemberProfile (camelCase, matches lib/ruleBased.ts /
// validator.ts) from an `assessments` row (snake_case, matches the DB).
export function profileFromAssessment(
  assessment: Record<string, unknown>,
  predictedCategory: WorkoutCategory
): MemberProfile {
  return {
    age: assessment.age as number,
    gender: assessment.gender as MemberProfile["gender"],
    weightKg: assessment.weight_kg as number,
    heightM: assessment.height_m as number,
    fatPercentage: assessment.fat_percentage as number,
    workoutFrequency: assessment.workout_frequency as number,
    experienceLevelNumber: assessment.experience_level as 1 | 2 | 3,
    experienceLevel: EXPERIENCE_LEVELS[assessment.experience_level as 1 | 2 | 3],
    bmi: assessment.bmi as number,
    goal: assessment.goal as MemberProfile["goal"],
    daysPerWeek: assessment.days_per_week as number,
    sessionDurationMinutes: assessment.session_duration_minutes as number,
    equipment: assessment.equipment as string[],
    restrictions: assessment.restrictions as string[],
    predictedWorkoutType: predictedCategory,
  };
}
