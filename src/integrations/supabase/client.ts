import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

/**
 * Supabase Browser Client - Session Management
 * 
 * SECURITY: Auth tokens are managed automatically by Supabase SDK.
 * - Session tokens stored in localStorage with key: sb-{project-ref}-auth-token
 * - Access tokens retrieved via supabase.auth.getSession() - NEVER manually stored
 * - Refresh tokens handled by SDK automatically
 * - Session persistence configured to 'local' storage by default (secure)
 * 
 * DO NOT manually store or retrieve tokens from localStorage.
 * Always use: await supabase.auth.getSession() or supabase.auth.getUser()
 */

// Prefer environment-based configuration so we can switch between local and remote projects.
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const SUPABASE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
	console.warn(
		'[supabase] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. Set them in .env.local.'
	);
}

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(
	SUPABASE_URL || '',
	SUPABASE_PUBLISHABLE_KEY || ''
);
