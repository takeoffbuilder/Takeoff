import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function AffiliateEmailSetupPage() {
  const router = useRouter();

  // Simulate email setup completion
  const handleEmailSetup = () => {
    // Here you would handle actual email setup logic
    // For now, just redirect to verify-email page
    router.push('/verify-email?affiliate=1');
  };

  useEffect(() => {
    // Set affiliateOnly flag in localStorage for flow tracking
    if (typeof window !== 'undefined') {
      localStorage.setItem('affiliateOnly', '1');
    }
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-brand-midnight via-brand-charcoal to-brand-midnight">
      <div className="bg-brand-charcoal/80 rounded-xl shadow-lg p-8 max-w-md w-full text-center">
        <h1 className="text-3xl font-bold text-brand-sky-blue mb-4">
          Awesome!!
        </h1>
        <p className="text-lg text-brand-white mb-6">
          First, let's get your email set up ...
        </p>
        <Button
          onClick={handleEmailSetup}
          className="w-full h-12 text-lg font-semibold"
        >
          Set Up Email
        </Button>
      </div>
    </div>
  );
}
