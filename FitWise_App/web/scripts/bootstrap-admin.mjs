#!/usr/bin/env node
// One-off bootstrap: creates the first gym administrator (or promotes an
// existing account). After this, admins add and approve trainers from /admin,
// so this script is only needed once per Supabase project. Uses the admin API
// (service-role key), so it must be run locally/server-side only.
//
// Usage: node scripts/bootstrap-admin.mjs <email> <password> "<full name>"
//        (password is ignored when the email already has an account)
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

async function findUserByEmail(supabase, email) {
  for (let page = 1; page <= 50; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const hit = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (hit) return hit;
    if (data.users.length < 200) return null;
  }
  return null;
}

async function main() {
  loadEnvLocal();
  const [email, password, fullName] = process.argv.slice(2);
  if (!email || !password) {
    console.error('Usage: node scripts/bootstrap-admin.mjs <email> <password> "<full name>"');
    process.exit(1);
  }

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  let userId;
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName ?? null },
  });
  if (error) {
    const existing = await findUserByEmail(supabase, email);
    if (!existing) {
      console.error("Failed to create user:", error.message);
      process.exit(1);
    }
    userId = existing.id;
    console.log(`Account already exists for ${email}; promoting it to admin.`);
  } else {
    userId = data.user.id;
  }

  const update = { role: "admin", status: "active" };
  if (fullName) update.full_name = fullName;
  const { error: updateError } = await supabase.from("profiles").update(update).eq("id", userId);
  if (updateError) {
    console.error("Could not set the admin role (has migration 0011 been applied?):", updateError.message);
    process.exit(1);
  }

  console.log(`Admin ready: ${email} (id: ${userId}). Sign in at /login.`);
}

main();
