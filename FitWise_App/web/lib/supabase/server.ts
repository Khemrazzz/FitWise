import "server-only";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

// RLS-scoped client: use this everywhere a request needs to read/write as the
// logged-in user (Server Components, Route Handlers, Server Actions). Never
// use this for cross-tenant reads -- for that, see admin.ts.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component during render, where cookies
            // can't be set. Safe to ignore as long as proxy.ts refreshes the
            // session on every request (see proxy.ts).
          }
        },
      },
    }
  );
}
