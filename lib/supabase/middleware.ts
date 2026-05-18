import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export type CookieEntry = { name: string; value: string; options?: CookieOptions };

/**
 * Refresh the Supabase auth session cookie on every request. Authorization
 * (who can see which page) is enforced inside route-group layouts:
 *   - app/(app)/layout.tsx  → requireUser()  redirects to /login
 *   - app/(auth)/layout.tsx → redirects authed users to /dashboard
 *
 * Keeping the middleware free of path-matching avoids drift when routes
 * are added or renamed.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieEntry[]) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          supabaseResponse = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            supabaseResponse.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  // IMPORTANT: getUser() re-validates the JWT with Supabase. Never use
  // getSession() — it trusts the cookie value as-is, which an attacker
  // could spoof.
  await supabase.auth.getUser();

  return supabaseResponse;
}
