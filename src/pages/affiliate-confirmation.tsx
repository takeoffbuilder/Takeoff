import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Button } from '@/components/ui/button';
import { authService } from '@/services/authService';
import { useToast } from '../hooks/use-toast';

export default function AffiliateConfirmationPage() {
  // ...existing code...
  // Get current user from authService
  type CurrentUser = { id: string } | null;
  const [currentUser, setCurrentUser] = useState<CurrentUser>(null);
  useEffect(() => {
    authService.getCurrentUser().then(setCurrentUser);
  }, []);
  // Integrate Stripe polling status
  const stripePollingStatus = useStripeAccountPolling(currentUser?.id || null);
  const router = useRouter();
  const [status, setStatus] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [onboardingUrl, setOnboardingUrl] = useState<string | null>(null);
  const [isAffiliateOnly, setIsAffiliateOnly] = useState(false);
  // ...existing code...

  useEffect(() => {
    async function fetchStatus() {
      setLoading(true);
      // Get current user from authService
      const currentUser = await authService.getCurrentUser();
      if (!currentUser?.id) {
        setLoading(false);
        return;
      }
      // Fetch affiliate status
      const res = await fetch(`/api/affiliate/status?userId=${currentUser.id}`);
      const data = await res.json();
      setStatus(data.status || 'pending');
      setIsAffiliateOnly(!!data.isAffiliateOnly);
      // Only fetch referral data if active
      if (data.status === 'active') {
        // Optionally, fetch referral info here if needed
      } else {
        // Fetch onboarding link from profile if needed
        const profileRes = await fetch(
          `/api/profile/stripe-info?userId=${currentUser.id}`
        );
        const profileData = await profileRes.json();
        setOnboardingUrl(profileData.stripe_onboarding_url || null);
      }
      setLoading(false);
    }
    fetchStatus();
  }, []);

  // Stripe account status polling logic
  function useStripeAccountPolling(userId: string | null) {
    const [pollingStatus, setPollingStatus] = useState<
      'pending' | 'complete' | 'error'
    >('pending');
    const { toast } = useToast();

    useEffect(() => {
      if (!userId) return;
      let attempts = 0;
      const poll = async () => {
        attempts++;
        try {
          const res = await fetch(
            `/api/profile/stripe-account-status?userId=${userId}`
          );
          const data = await res.json();
          if (data.status === 'complete') {
            setPollingStatus('complete');
            toast({
              title: 'Stripe account verified!',
              description: 'Your account is ready.',
              variant: 'default',
            });
            clearInterval(interval);
          } else if (attempts > 30) {
            setPollingStatus('error');
            toast({
              title: 'Timeout',
              description: 'Stripe verification took too long.',
              variant: 'destructive',
            });
            clearInterval(interval);
          }
        } catch {
          setPollingStatus('error');
          toast({
            title: 'Error',
            description: 'Could not verify Stripe account.',
            variant: 'destructive',
          });
          clearInterval(interval);
        }
      };
      const interval: NodeJS.Timeout = setInterval(poll, 3000);
      poll();
      return () => clearInterval(interval);
    }, [userId, toast]);

    return pollingStatus;
  }

  // If you need to use the polling status, use:
  // const stripePollingStatus = useStripeAccountPolling(currentUser?.id || null);
  // Make sure to use stripePollingStatus in your component logic, not stripeStatus.

  const handleStripeOnboarding = () => {
    if (onboardingUrl) {
      window.location.href = onboardingUrl;
    }
  };

  // Auto-redirect to dashboard or affiliate-dashboard after 3 seconds
  useEffect(() => {
    if (status === 'active') {
      const timeout = setTimeout(() => {
        if (isAffiliateOnly) {
          router.push('/affiliate-dashboard');
        } else {
          router.push('/dashboard');
        }
      }, 3000);
      return () => clearTimeout(timeout);
    }
  }, [status, isAffiliateOnly, router]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-brand-midnight via-brand-charcoal to-brand-midnight">
        <div className="bg-brand-charcoal/80 rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <p className="text-lg text-brand-white mb-6">Loading status...</p>
        </div>
      </div>
    );
  }

  if (status !== 'active') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-brand-midnight via-brand-charcoal to-brand-midnight">
        <div className="bg-brand-charcoal/80 rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <h1 className="text-3xl font-bold text-brand-sky-blue mb-4">
            Complete Your Payout Setup
          </h1>
          <p className="text-lg text-brand-white mb-6">
            Please finish your Stripe onboarding to activate your affiliate
            account.
          </p>
          <p className="text-sm text-brand-white mb-2">
            Stripe onboarding status:{' '}
            <span className="font-mono">{stripePollingStatus}</span>
          </p>
          <Button
            onClick={handleStripeOnboarding}
            className="w-full h-12 text-lg font-semibold"
            disabled={!onboardingUrl}
          >
            {onboardingUrl
              ? 'Continue Stripe Onboarding'
              : 'Waiting for onboarding link...'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-brand-midnight via-brand-charcoal to-brand-midnight">
      <div className="bg-brand-charcoal/80 rounded-xl shadow-lg p-8 max-w-md w-full text-center">
        <h1 className="text-3xl font-bold text-brand-sky-blue mb-4">
          Application Complete!
        </h1>
        <p className="text-lg text-brand-white mb-6">
          Thank you for completing your affiliate onboarding.
          <br />
          Your account is now active and you can start earning!
        </p>
        <button
          className="w-full h-12 text-lg font-semibold bg-brand-sky-blue text-brand-midnight rounded-lg mt-2 hover:bg-brand-sky-blue/90 transition-colors"
          onClick={() =>
            isAffiliateOnly
              ? router.push('/affiliate-dashboard')
              : router.push('/dashboard')
          }
        >
          {isAffiliateOnly ? 'Go to Affiliate Dashboard' : 'Go to Dashboard'}
        </button>
        <p className="text-brand-white text-sm mt-2 opacity-70">
          Redirecting in 3 seconds...
        </p>
      </div>
    </div>
  );
}
