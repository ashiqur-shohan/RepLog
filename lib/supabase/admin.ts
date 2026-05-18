import { createClient } from "@supabase/supabase-js";
import "server-only";

/**
 * Service-role Supabase client — bypasses RLS.
 * Use ONLY in webhook handlers and admin Server Actions where ownership is
 * verified by the caller. Never expose this to the browser.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }
  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
