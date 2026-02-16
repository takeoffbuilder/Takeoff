import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

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
