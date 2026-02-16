import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { authService } from '@/services/authService';

export default function AffiliateSuccessPage() {
  const [onboardingUrl, setOnboardingUrl] = useState<string | null>(null);

  useEffect(() => {
    // Fetch Stripe onboarding link from profiles with auth
    async function fetchOnboardingUrl() {
      try {
        // Get Supabase access token from client-side auth
        const {
          data: { session },
        } = await import('@/integrations/supabase/client').then((m) =>
          m.supabase.auth.getSession()
        );
        const accessToken = session?.access_token;
        if (!accessToken) return;
        const res = await fetch('/api/profile/stripe-info', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (res.ok) {
          const data = await res.json();
          setOnboardingUrl(data.stripe_onboarding_url);
        }
      } catch {
        // Optionally handle error
      }
    }
    fetchOnboardingUrl();

    // Poll for affiliate status change
    let interval: NodeJS.Timeout | null = null;
    let cancelled = false;
    async function pollAffiliateStatus() {
      try {
        const user = await authService.getCurrentUser();
        if (!user) return;
        const res = await fetch(`/api/affiliate/status?userId=${user.id}`);
        if (res.ok) {
          const data = await res.json();
          if (data.status === 'active') {
            if (!cancelled) {
              window.location.href = '/affiliate-dashboard';
            }
            return;
          }
        }
      } catch {}
    }
    interval = setInterval(pollAffiliateStatus, 4000);
    return () => {
      cancelled = true;
      if (interval) clearInterval(interval);
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-brand-sky-blue to-brand-charcoal">
      <div className="bg-brand-midnight/80 rounded-xl shadow-lg p-8 max-w-md w-full text-center">
        <h1 className="text-3xl font-bold text-green-400 mb-4">
          Affiliate Application Submitted!
        </h1>
        <p className="text-lg text-white mb-6">
          Your affiliate status is now{' '}
          <span className="font-semibold text-yellow-300">Pending</span>.<br />
          To activate your account and receive payouts, please complete Stripe
          onboarding.
        </p>
        {onboardingUrl ? (
          <Button
            size="lg"
            className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold text-lg"
            onClick={() => window.open(onboardingUrl, '_blank')}
          >
            Complete Stripe Onboarding
          </Button>
        ) : (
          <p className="text-gray-300">Loading Stripe onboarding link...</p>
        )}
      </div>
    </div>
  );
}
