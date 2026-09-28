import { GoogleGenAI } from "@google/genai";
import { EXERCISES } from "./exercises";
import { Exercise, MemberProfile, WorkoutPlan } from "./types";

const workoutPlanSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    planName: { type: "string" },
    predictedWorkoutType: { type: "string", enum: ["Cardio", "Strength", "HIIT", "Yoga"] },
    daysPerWeek: { type: "integer", minimum: 1, maximum: 7 },
    explanation: { type: "string" },
    days: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          day: { type: "integer" },
          title: { type: "string" },
          focus: { type: "string" },
          estimatedDurationMinutes: { type: "integer" },
          exercises: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              properties: {
                exerciseId: { type: "string" },
                sets: { type: "integer" },
                reps: { type: "integer" },
                durationMinutes: { type: "integer" },
                restSeconds: { type: "integer" }
              },
              required: ["exerciseId", "restSeconds"]
            }
          }
        },
        required: ["day", "title", "focus", "estimatedDurationMinutes", "exercises"]
      }
    }
  },
  required: ["planName", "predictedWorkoutType", "daysPerWeek", "explanation", "days"]
};

export async function generateGeminiPlan(profile: MemberProfile, exercises: Exercise[] = EXERCISES): Promise<WorkoutPlan> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured.");
  if (!profile.predictedWorkoutType) throw new Error("ML predictedWorkoutType is required before Gemini generation.");

  const model = process.env.GEMINI_MODEL ?? "gemini-3.6-flash";
  const ai = new GoogleGenAI({ apiKey });

  const approvedExercises = exercises.map((e) => ({
    id: e.id,
    name: e.name,
    category: e.category,
    difficulty: e.difficulty,
    equipment: e.equipment,
    impact: e.impact,
    contraindicationTags: e.contraindicationTags,
    estimatedMinutes: e.estimatedMinutes,
  }));

  const prompt = `
You are generating a GENERAL FITNESS workout-plan prototype for an academic software project.
This is not medical advice and you must not diagnose or treat conditions.

Generate a weekly workout plan from the supplied profile.

CRITICAL CONSTRAINTS:
1. Use ONLY exercise IDs from APPROVED_EXERCISES. Never invent an exercise ID or name.
2. Preserve the ML predicted workout category as predictedWorkoutType.
3. Produce exactly the requested number of workout days.
4. Every day must be <= the requested sessionDurationMinutes.
5. Do not choose an exercise if its required equipment is not in the user's equipment list.
6. Do not choose an exercise if any contraindicationTag appears in the user's restrictions.
7. Choose only exercises approved for the user's experience level.
8. Keep the plan practical, varied and explainable.
9. Return JSON only using the response schema.

PROFILE:
${JSON.stringify(profile, null, 2)}

APPROVED_EXERCISES:
${JSON.stringify(approvedExercises, null, 2)}
`;

  const interaction = await ai.interactions.create({
    model,
    input: prompt,
    response_format: {
      type: "text",
      mime_type: "application/json",
      schema: workoutPlanSchema,
    },
  });

  const raw = interaction.output_text;
  if (!raw) throw new Error("Gemini returned no output text.");

  const parsed = JSON.parse(raw) as Omit<WorkoutPlan, "generator">;
  return {
    ...parsed,
    generator: "gemini",
    predictedWorkoutType: profile.predictedWorkoutType,
  };
}
