import type { Exercise } from "@/lib/types";

// Maps the `exercises` table's snake_case rows back to the camelCase Exercise
// shape lib/ruleBased.ts, lib/validator.ts and lib/geminiGenerator.ts expect.
export function exercisesFromDb(rows: Record<string, unknown>[]): Exercise[] {
  return rows.map((r) => ({
    id: r.id as string,
    name: r.name as string,
    category: r.category as Exercise["category"],
    difficulty: r.difficulty as Exercise["difficulty"],
    equipment: r.equipment as string[],
    muscles: r.muscles as string[],
    impact: r.impact as Exercise["impact"],
    contraindicationTags: r.contraindication_tags as string[],
    estimatedMinutes: r.estimated_minutes as number,
  }));
}
