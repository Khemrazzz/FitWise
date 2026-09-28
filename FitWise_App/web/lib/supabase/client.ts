import { createBrowserClient } from "@supabase/ssr";

// Browser-side client for Client Components (e.g. the login form). Uses the
// publishable key only -- safe to expose, RLS still applies.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );
}
