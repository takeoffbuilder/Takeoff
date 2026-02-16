import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

// This admin client should only be used in server-side code (e.g., API routes)
// It bypasses Row Level Security (RLS) and should be used with caution.
export function createAdminClient() {
  // Prefer server-only URL var; fall back to public URL if necessary
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error("Supabase URL or Service Role Key is missing in environment variables.");
  }

  return createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
