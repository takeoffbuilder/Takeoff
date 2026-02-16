import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import AffiliateSignup from '@/components/AffiliateSignup';
import { Button } from '@/components/ui/button';

export default function AffiliateStatusPage() {
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [onboardingUrl, setOnboardingUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchStatus = async () => {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setStatus(null);
        setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from('affiliate_applications')
        .select(
          'affiliate_status, payout_setup_complete, stripe_onboarding_url'
        )
        .eq('id', user.id)
        .single();
      if (error || !data) {
        setStatus(null);
      } else {
        setStatus(data.affiliate_status);
        if (data.stripe_onboarding_url)
          setOnboardingUrl(data.stripe_onboarding_url);
      }
      setLoading(false);
    };
    fetchStatus();
  }, []);

  if (loading) {
    return (
      <div className="p-8 text-center text-gray-400">
        Loading affiliate status...
      </div>
    );
  }

  if (!status) {
    return (
      <div className="max-w-xl mx-auto p-8">
        <h2 className="text-2xl font-bold mb-4 text-white">Affiliate Signup</h2>
        <AffiliateSignup />
      </div>
    );
  }

  if (status === 'pending') {
    return (
      <div className="max-w-xl mx-auto p-8 text-center">
        <h2 className="text-2xl font-bold mb-4 text-yellow-400">
          Onboarding Incomplete
        </h2>
        <p className="mb-4 text-gray-300">
          Please complete your Stripe onboarding to activate your affiliate
          account.
        </p>
        {onboardingUrl ? (
          <Button
            onClick={() => (window.location.href = onboardingUrl)}
            className="bg-yellow-500 text-white px-6 py-3 rounded"
          >
            Resume Stripe Onboarding
          </Button>
        ) : (
          <p className="mb-4 text-gray-400">Onboarding link not available.</p>
        )}
        <Button
          variant="outline"
          className="mt-4"
          onClick={async () => {
            setLoading(true);
            const {
              data: { user },
            } = await supabase.auth.getUser();
            if (!user) {
              setLoading(false);
              return;
            }
            const { data, error } = await supabase
              .from('affiliate_applications')
              .select('stripe_onboarding_url')
              .eq('id', user.id)
              .single();
            if (!error && data?.stripe_onboarding_url) {
              setOnboardingUrl(data.stripe_onboarding_url);
            }
            setLoading(false);
          }}
        >
          Refresh Onboarding Link
        </Button>
      </div>
    );
  }

  if (status === 'pending_verification') {
    return (
      <div className="max-w-xl mx-auto p-8 text-center">
        <h2 className="text-2xl font-bold mb-4 text-blue-400">
          Pending Verification
        </h2>
        <p className="mb-4 text-gray-300">
          Your affiliate account is pending verification. You will be notified
          when it is active.
        </p>
      </div>
    );
  }

  if (status === 'active') {
    return (
      <div className="max-w-2xl mx-auto p-8 text-center">
        <h2 className="text-2xl font-bold mb-4 text-green-400">
          Affiliate Dashboard
        </h2>
        <p className="mb-4 text-gray-300">
          Welcome! Your affiliate account is active. You can now refer users and
          earn payouts.
        </p>
        {/* Add dashboard details here */}
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto p-8 text-center">
      <h2 className="text-2xl font-bold mb-4 text-gray-400">Unknown Status</h2>
      <p className="mb-4 text-gray-300">Please contact support for help.</p>
    </div>
  );
}
