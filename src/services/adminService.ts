import { supabase } from '@/integrations/supabase/client';

export async function isAdmin(email: string): Promise<boolean> {
  // Calls the is_admin Postgres function
  const { data, error } = await supabase.rpc('is_admin', { p_email: email });
  if (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
  return !!data;
}
