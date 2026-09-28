# Experiment results

Store exported comparison results here. Do not manually invent final dissertation metrics.

## Running the batch comparison

`scripts/run-batch-comparison.mjs` runs every profile in `sample_profiles.json` through the ML model, both generators, and the validator -- **one profile at a time**, with a delay and retry/backoff between calls. Gemini's free tier caps at 20 requests/day with a low per-minute limit, so firing profiles concurrently reliably burns through the quota partway through a run; this script never has more than one Gemini request in flight.

With the FastAPI ML server (`ml/`) and the Next.js dev server (`npm run dev -- -p 3001`) both running:

```bash
npm run batch
# or with custom pacing:
node scripts/run-batch-comparison.mjs --delay 8000 --max-retries 5
node scripts/run-batch-comparison.mjs --limit 3   # smoke-test a few profiles first
```

Results are written to `batch_comparison_results.json` after every profile, so a quota cutoff or crash partway through still leaves usable partial results on disk.
