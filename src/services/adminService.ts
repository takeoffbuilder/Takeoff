import { supabase } from '@/integrations/supabase/client';

export async function isAdmin(email: string): Promise<boolean> {
  const normalizedEmail = email.trim().toLowerCase();
  console.log('[isAdmin] Checking admin status for:', normalizedEmail);
  // Calls the is_admin Postgres function
  const { data, error } = await supabase.rpc('is_admin', { p_email: normalizedEmail });
  if (error) {
    console.error('[isAdmin] Error checking admin status:', error, 'for email:', normalizedEmail);
    return false;
  }
  console.log('[isAdmin] Result for', normalizedEmail, ':', data);
  return !!data;
}
