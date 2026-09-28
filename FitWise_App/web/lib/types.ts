export type WorkoutCategory = "Cardio" | "Strength" | "HIIT" | "Yoga";
export type ExperienceLevel = "beginner" | "intermediate" | "advanced";
export type FitnessGoal = "weight_loss" | "muscle_gain" | "endurance" | "general_fitness" | "flexibility";

export interface MemberProfile {
  age: number;
  gender: "Male" | "Female";
  weightKg: number;
  heightM: number;
  fatPercentage: number;
  workoutFrequency: number;
  experienceLevelNumber: 1 | 2 | 3;
  experienceLevel: ExperienceLevel;
  bmi: number;
  goal: FitnessGoal;
  daysPerWeek: number;
  sessionDurationMinutes: number;
  equipment: string[];
  restrictions: string[];
  predictedWorkoutType?: WorkoutCategory;
}

export interface Exercise {
  id: string;
  name: string;
  category: WorkoutCategory;
  difficulty: ExperienceLevel[];
  equipment: string[];
  muscles: string[];
  impact: "low" | "medium" | "high";
  contraindicationTags: string[];
  estimatedMinutes: number;
}

export interface PlannedExercise {
  exerciseId: string;
  sets?: number;
  reps?: number;
  durationMinutes?: number;
  restSeconds: number;
}

export interface WorkoutDay {
  day: number;
  title: string;
  focus: string;
  estimatedDurationMinutes: number;
  exercises: PlannedExercise[];
}

export interface WorkoutPlan {
  generator: "rule_based" | "gemini";
  planName: string;
  predictedWorkoutType: WorkoutCategory;
  daysPerWeek: number;
  explanation: string;
  days: WorkoutDay[];
  rulesApplied?: string[];
}

export interface ValidationResult {
  valid: boolean;
  score: number;
  checksPassed: number;
  totalChecks: number;
  violations: string[];
}
