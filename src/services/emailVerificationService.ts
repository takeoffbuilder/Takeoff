import { authService } from './authService';

/**
 * Check if the current user's email is verified
 * Derives from Supabase session, not localStorage
 */
export const emailVerificationService = {
  /**
   * Check if current user has verified their email
   * Returns true if email_confirmed_at is set in Supabase auth
   */
  async isEmailVerified(): Promise<boolean> {
    const session = await authService.getCurrentSession();
    if (!session?.user) return false;
    
    // Supabase sets email_confirmed_at when email is verified
    return !!session.user.email_confirmed_at;
  },

  /**
   * Check if user needs to verify email
   * Returns true if user exists but email is not confirmed
   */
  async needsEmailVerification(): Promise<boolean> {
    const session = await authService.getCurrentSession();
    if (!session?.user) return false;
    
    return !session.user.email_confirmed_at;
  }
};
