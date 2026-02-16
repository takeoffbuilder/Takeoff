import { useRouter } from 'next/router';
import { Button } from '@/components/ui/button';

export default function AffiliateExplainerPage() {
  const router = useRouter();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-brand-sky-blue to-brand-charcoal">
      <div className="bg-brand-midnight/80 rounded-xl shadow-lg p-8 max-w-md w-full text-center">
        <h1 className="text-3xl font-bold text-green-400 mb-4">
          Become a TakeOff Affiliate
        </h1>
        <p className="text-lg text-white mb-6">
          Earn money by referring new users to TakeOff Credit!
          <br />
          <br />
          <span className="font-semibold text-yellow-300">How it works:</span>
          <br />
          - Share your unique referral link.
          <br />
          - Earn $10 for each new user who signs up.
          <br />
          - Track your referrals and payouts in your dashboard.
          <br />
          <br />
          Ready to join?
        </p>
        <Button
          size="lg"
          className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold text-lg"
          onClick={() => router.push('/affiliate-application')}
        >
          Apply Now
        </Button>
      </div>
    </div>
  );
}
