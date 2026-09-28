import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Next.js 16 renamed `middleware.ts` to `proxy.ts` (same mechanics, new file
// name and export name) -- see node_modules/next/dist/docs/.../proxy.md.
// This refreshes the Supabase auth cookie on every request so server
// components always see a valid session without each one refreshing it.
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  // Supabase isn't configured until Phase 1 (a fresh project must be created
  // first) -- skip the session refresh rather than crashing every route.
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_PUBLISHABLE_KEY) {
    return response;
  }

  const supabase = createServerClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Required by @supabase/ssr even though the value isn't used here -- this
  // call is what actually refreshes an expiring session and rewrites the
  // cookie via setAll above.
  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
