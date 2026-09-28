#!/usr/bin/env node
// Runs the ML -> Rule-Based/Gemini -> Compare pipeline for every profile in
// results/sample_profiles.json, ONE AT A TIME, with a fixed delay and
// retry/backoff between calls. Gemini's free tier is 20 requests/day and has
// a low per-minute rate limit, so firing profiles concurrently (Promise.all)
// reliably exhausts the quota partway through a run. This script exists so a
// batch never fires more than one Gemini request at once.
//
// Usage (from FitWise_Prototype_Lab/web, with the Next.js dev server and the
// FastAPI ML server already running):
//   node scripts/run-batch-comparison.mjs
//   node scripts/run-batch-comparison.mjs --delay 8000 --max-retries 5
//   node scripts/run-batch-comparison.mjs --limit 3   (smoke-test a few first)

import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROFILES_PATH = path.join(__dirname, "..", "results", "sample_profiles.json");
const OUTPUT_PATH = path.join(__dirname, "..", "results", "batch_comparison_results.json");

function parseArgs(argv) {
  const args = { baseUrl: "http://localhost:3001", delayMs: 5000, maxRetries: 4, limit: Infinity };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--base-url") args.baseUrl = argv[++i];
    else if (a === "--delay") args.delayMs = Number(argv[++i]);
    else if (a === "--max-retries") args.maxRetries = Number(argv[++i]);
    else if (a === "--limit") args.limit = Number(argv[++i]);
  }
  return args;
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Gemini 429 bodies include a hint like "Please retry in 21.5s" -- honour it
// when present instead of guessing, otherwise fall back to exponential backoff.
function retryDelayMs(error, attempt, baseDelayMs) {
  const match = /retry in ([\d.]+)\s*s/i.exec(String(error?.message ?? error));
  if (match) return Math.ceil(parseFloat(match[1]) * 1000) + 500;
  return baseDelayMs * 2 ** attempt;
}

async function postJson(url, body) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({ error: `HTTP ${res.status} with a non-JSON body` }));
  if (!res.ok) throw new Error(json.error ?? json.detail ?? `Request failed with status ${res.status}`);
  return json;
}

async function withRetries(fn, maxRetries, baseDelayMs, label) {
  let lastError;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt === maxRetries) break;
      const delay = retryDelayMs(error, attempt, baseDelayMs);
      console.log(`  [${label}] attempt ${attempt + 1}/${maxRetries + 1} failed: ${error.message} -- retrying in ${Math.round(delay / 1000)}s`);
      await sleep(delay);
    }
  }
  throw lastError;
}

async function runOne(profileEntry, args) {
  const { id, description, profile } = profileEntry;
  console.log(`\n[${id}] ${description}`);

  const prediction = await withRetries(
    () => postJson(`${args.baseUrl}/api/model/predict`, profile),
    args.maxRetries,
    args.delayMs,
    `${id} predict`
  );

  const enrichedProfile = { ...profile, predictedWorkoutType: prediction.predictedWorkoutType };

  const compareResult = await withRetries(
    () => postJson(`${args.baseUrl}/api/compare`, enrichedProfile),
    args.maxRetries,
    args.delayMs,
    `${id} compare`
  );

  console.log(`  ok: rule ${compareResult.comparison.ruleConstraintScore}% / gemini ${compareResult.comparison.geminiConstraintScore}%`);

  return {
    id,
    description,
    prediction,
    ruleBased: { ...compareResult.ruleBased.validation, latencyMs: compareResult.ruleBased.latencyMs },
    gemini: { ...compareResult.gemini.validation, latencyMs: compareResult.gemini.latencyMs },
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const profiles = JSON.parse(await readFile(PROFILES_PATH, "utf-8")).slice(0, args.limit);

  console.log(`Running ${profiles.length} profile(s) sequentially against ${args.baseUrl}`);
  console.log(`Delay between profiles: ${args.delayMs}ms, max retries per call: ${args.maxRetries}\n`);

  const results = [];
  for (const [index, profileEntry] of profiles.entries()) {
    try {
      results.push(await runOne(profileEntry, args));
    } catch (error) {
      console.log(`  FAILED: ${error.message}`);
      results.push({ id: profileEntry.id, description: profileEntry.description, error: error.message });
    }

    // Save after every profile so a crash or a quota cutoff partway through
    // still leaves usable partial results on disk.
    await writeFile(OUTPUT_PATH, JSON.stringify(results, null, 2), "utf-8");

    const isLast = index === profiles.length - 1;
    if (!isLast) await sleep(args.delayMs);
  }

  const succeeded = results.filter((r) => !r.error).length;
  console.log(`\nDone: ${succeeded}/${results.length} profiles succeeded. Results written to ${OUTPUT_PATH}`);
}

main().catch((error) => {
  console.error("Batch run crashed:", error);
  process.exit(1);
});
