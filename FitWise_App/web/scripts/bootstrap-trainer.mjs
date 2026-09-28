#!/usr/bin/env node
// One-off bootstrap: creates the very first trainer account. There's no
// public signup page by design (Phase 2+: trainers create member accounts,
// not the other way round) -- this script is the only way to get the first
// trainer into the system. Uses the admin API (service-role key), so it
// must be run server-side/locally, never exposed to the browser.
//
// Usage: node scripts/bootstrap-trainer.mjs <email> <password> "<full name>"

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function loadEnvLocal() {
  const envPath = path.join(__dirname, "..", ".env.local");
  const lines = readFileSync(envPath, "utf-8").split("\n");
  for (const line of lines) {
    const match = /^([A-Z_][A-Z0-9_]*)=(.*)$/.exec(line.trim());
    if (match) process.env[match[1]] ??= match[2];
  }
}

async function main() {
  loadEnvLocal();
  const [email, password, fullName] = process.argv.slice(2);
  if (!email || !password) {
    console.error('Usage: node scripts/bootstrap-trainer.mjs <email> <password> "<full name>"');
    process.exit(1);
  }

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName ?? null },
  });

  if (error) {
    console.error("Failed to create user:", error.message);
    process.exit(1);
  }

  // The on_auth_user_created trigger just inserted a profiles row with the
  // default role='member' -- promote it.
  const { error: updateError } = await supabase
    .from("profiles")
    .update({ role: "trainer" })
    .eq("id", data.user.id);

  if (updateError) {
    console.error("User created but failed to promote to trainer:", updateError.message);
    process.exit(1);
  }

  console.log(`Trainer created: ${email} (id: ${data.user.id})`);
}

main();
