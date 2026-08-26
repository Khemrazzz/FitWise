import { Exercise } from "./types";

export const EXERCISES: Exercise[] = [
  { id: "STR-001", name: "Bodyweight Squat", category: "Strength", difficulty: ["beginner", "intermediate"], equipment: [], muscles: ["quadriceps", "glutes"], impact: "medium", contraindicationTags: ["knee_high_load"], estimatedMinutes: 5 },
  { id: "STR-002", name: "Goblet Squat", category: "Strength", difficulty: ["beginner", "intermediate"], equipment: ["dumbbells"], muscles: ["quadriceps", "glutes"], impact: "medium", contraindicationTags: ["knee_high_load"], estimatedMinutes: 6 },
  { id: "STR-003", name: "Dumbbell Chest Press", category: "Strength", difficulty: ["beginner", "intermediate", "advanced"], equipment: ["dumbbells"], muscles: ["chest", "triceps"], impact: "low", contraindicationTags: [], estimatedMinutes: 6 },
  { id: "STR-004", name: "Standing Dumbbell Row", category: "Strength", difficulty: ["beginner", "intermediate", "advanced"], equipment: ["dumbbells"], muscles: ["back", "biceps"], impact: "low", contraindicationTags: ["lower_back_bending"], estimatedMinutes: 6 },
  { id: "STR-005", name: "Seated Cable Row", category: "Strength", difficulty: ["beginner", "intermediate", "advanced"], equipment: ["cable_machine"], muscles: ["back", "biceps"], impact: "low", contraindicationTags: [], estimatedMinutes: 6 },
  { id: "STR-006", name: "Lat Pulldown", category: "Strength", difficulty: ["beginner", "intermediate", "advanced"], equipment: ["lat_pulldown"], muscles: ["back", "biceps"], impact: "low", contraindicationTags: [], estimatedMinutes: 6 },
  { id: "STR-007", name: "Seated Dumbbell Shoulder Press", category: "Strength", difficulty: ["beginner", "intermediate", "advanced"], equipment: ["dumbbells"], muscles: ["shoulders", "triceps"], impact: "low", contraindicationTags: [], estimatedMinutes: 6 },
  { id: "STR-008", name: "Glute Bridge", category: "Strength", difficulty: ["beginner", "intermediate", "advanced"], equipment: [], muscles: ["glutes", "hamstrings"], impact: "low", contraindicationTags: [], estimatedMinutes: 5 },
  { id: "STR-009", name: "Leg Press", category: "Strength", difficulty: ["beginner", "intermediate", "advanced"], equipment: ["leg_press"], muscles: ["quadriceps", "glutes"], impact: "medium", contraindicationTags: ["knee_high_load"], estimatedMinutes: 6 },
  { id: "STR-010", name: "Romanian Deadlift", category: "Strength", difficulty: ["intermediate", "advanced"], equipment: ["barbell"], muscles: ["hamstrings", "glutes", "back"], impact: "medium", contraindicationTags: ["lower_back_bending"], estimatedMinutes: 7 },
  { id: "STR-011", name: "Incline Push-Up", category: "Strength", difficulty: ["beginner", "intermediate"], equipment: [], muscles: ["chest", "triceps"], impact: "low", contraindicationTags: [], estimatedMinutes: 5 },
  { id: "STR-012", name: "Plank", category: "Strength", difficulty: ["beginner", "intermediate", "advanced"], equipment: [], muscles: ["core"], impact: "low", contraindicationTags: [], estimatedMinutes: 4 },

  { id: "CAR-001", name: "Brisk Walking", category: "Cardio", difficulty: ["beginner", "intermediate", "advanced"], equipment: [], muscles: ["full_body"], impact: "low", contraindicationTags: [], estimatedMinutes: 10 },
  { id: "CAR-002", name: "Stationary Cycling", category: "Cardio", difficulty: ["beginner", "intermediate", "advanced"], equipment: ["stationary_bike"], muscles: ["legs"], impact: "low", contraindicationTags: [], estimatedMinutes: 10 },
  { id: "CAR-003", name: "Elliptical Trainer", category: "Cardio", difficulty: ["beginner", "intermediate", "advanced"], equipment: ["elliptical"], muscles: ["full_body"], impact: "low", contraindicationTags: [], estimatedMinutes: 10 },
  { id: "CAR-004", name: "Treadmill Jog", category: "Cardio", difficulty: ["intermediate", "advanced"], equipment: ["treadmill"], muscles: ["legs"], impact: "medium", contraindicationTags: ["avoid_high_impact"], estimatedMinutes: 10 },
  { id: "CAR-005", name: "Rowing Machine", category: "Cardio", difficulty: ["intermediate", "advanced"], equipment: ["rowing_machine"], muscles: ["full_body"], impact: "low", contraindicationTags: ["lower_back_bending"], estimatedMinutes: 10 },

  { id: "HIT-001", name: "Low-Impact Step Jacks", category: "HIIT", difficulty: ["beginner", "intermediate"], equipment: [], muscles: ["full_body"], impact: "low", contraindicationTags: [], estimatedMinutes: 5 },
  { id: "HIT-002", name: "Mountain Climbers", category: "HIIT", difficulty: ["intermediate", "advanced"], equipment: [], muscles: ["core", "shoulders", "legs"], impact: "medium", contraindicationTags: ["knee_high_load"], estimatedMinutes: 5 },
  { id: "HIT-003", name: "High Knees", category: "HIIT", difficulty: ["intermediate", "advanced"], equipment: [], muscles: ["legs", "core"], impact: "high", contraindicationTags: ["knee_high_load", "avoid_high_impact"], estimatedMinutes: 5 },
  { id: "HIT-004", name: "Burpees", category: "HIIT", difficulty: ["advanced"], equipment: [], muscles: ["full_body"], impact: "high", contraindicationTags: ["knee_high_load", "avoid_high_impact", "lower_back_bending"], estimatedMinutes: 5 },
  { id: "HIT-005", name: "Bike Intervals", category: "HIIT", difficulty: ["beginner", "intermediate", "advanced"], equipment: ["stationary_bike"], muscles: ["legs"], impact: "low", contraindicationTags: [], estimatedMinutes: 8 },

  { id: "YOG-001", name: "Cat-Cow Mobility", category: "Yoga", difficulty: ["beginner", "intermediate", "advanced"], equipment: [], muscles: ["spine", "core"], impact: "low", contraindicationTags: [], estimatedMinutes: 4 },
  { id: "YOG-002", name: "Child's Pose", category: "Yoga", difficulty: ["beginner", "intermediate", "advanced"], equipment: [], muscles: ["back", "hips"], impact: "low", contraindicationTags: [], estimatedMinutes: 4 },
  { id: "YOG-003", name: "Standing Forward Fold", category: "Yoga", difficulty: ["beginner", "intermediate", "advanced"], equipment: [], muscles: ["hamstrings", "back"], impact: "low", contraindicationTags: ["lower_back_bending"], estimatedMinutes: 4 },
  { id: "YOG-004", name: "Warrior II", category: "Yoga", difficulty: ["beginner", "intermediate", "advanced"], equipment: [], muscles: ["legs", "hips"], impact: "low", contraindicationTags: ["knee_high_load"], estimatedMinutes: 5 },
  { id: "YOG-005", name: "Supine Hamstring Stretch", category: "Yoga", difficulty: ["beginner", "intermediate", "advanced"], equipment: [], muscles: ["hamstrings"], impact: "low", contraindicationTags: [], estimatedMinutes: 4 },
  { id: "YOG-006", name: "Bird Dog", category: "Yoga", difficulty: ["beginner", "intermediate", "advanced"], equipment: [], muscles: ["core", "back"], impact: "low", contraindicationTags: [], estimatedMinutes: 5 },
];
