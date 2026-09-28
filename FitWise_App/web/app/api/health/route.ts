import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

// Phase 0 connectivity check: confirms the Supabase project is reachable
// (auth.getSession resolves without a network/DNS error -- that's what
// broke with the old dead project) and the FastAPI ML service is up.
export async function GET() {
  const result: Record<string, unknown> = {};

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.getSession();
    result.supabase = error ? { ok: false, error: error.message } : { ok: true };
  } catch (error) {
    result.supabase = { ok: false, error: error instanceof Error ? error.message : "Unknown error" };
  }

  try {
    const mlUrl = process.env.ML_API_URL ?? "http://127.0.0.1:8000";
    const res = await fetch(`${mlUrl}/health`, { cache: "no-store" });
    result.ml = res.ok ? { ok: true, ...(await res.json()) } : { ok: false, status: res.status };
  } catch (error) {
    result.ml = { ok: false, error: error instanceof Error ? error.message : "Unknown error" };
  }

  return NextResponse.json(result);
}
