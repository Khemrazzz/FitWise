import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Service-role client: BYPASSES ROW-LEVEL SECURITY. Server-only, and only
// import this from code that runs exclusively on the server (Route Handlers,
// Server Actions) -- never from a Client Component or anything bundled to
// the browser. Used for actions RLS can't express, e.g. a trainer creating a
// new Supabase Auth user for a member (auth.admin.createUser).
export function createAdminClient() {
  return createSupabaseClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
