import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { StarField } from '@/components/StarField';
import { Rocket, Sparkles, ArrowRight, Check } from 'lucide-react';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';

export default function CongratulationsPage() {
  const router = useRouter();
  const { plan, price, mode } = router.query;
  const [loading, setLoading] = useState(false);
  const isAddingAccount = mode === 'add';

  useEffect(() => {
    // Only store the selected plan in localStorage, don't create accounts yet
    if (plan && price) {
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('selectedPlan', plan as string);
        sessionStorage.setItem('selectedPrice', price as string);
      }
    }
  }, [plan, price]);

  const handleContinue = () => {
    setLoading(true);

    // Route to payment info page to collect payment details BEFORE creating account
    if (isAddingAccount) {
      router.push('/payment-info?mode=add');
    } else {
      router.push('/personal-info');
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-brand-midnight via-brand-charcoal to-brand-midnight">
      <StarField />

      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-brand-sky-blue/20 via-transparent to-transparent opacity-60" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-brand-sky-blue-light/10 via-transparent to-transparent opacity-40" />

      <div className="absolute top-1/4 left-10 w-96 h-96 bg-brand-sky-blue/10 rounded-full blur-3xl animate-pulse-slow" />
      <div
        className="absolute bottom-1/4 right-10 w-80 h-80 bg-brand-sky-blue-light/10 rounded-full blur-3xl animate-pulse-slow"
        style={{ animationDelay: '1s' }}
      />

      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-12">
        <Card className="w-full max-w-2xl border-brand-sky-blue/30 bg-brand-charcoal/80 backdrop-blur-xl shadow-2xl shadow-brand-sky-blue/20">
          <CardHeader className="text-center space-y-6 pt-12">
            <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-r from-brand-sky-blue to-brand-sky-blue-light flex items-center justify-center shadow-xl shadow-brand-sky-blue/40 animate-pulse-slow">
              <Rocket className="w-10 h-10 text-white" />
            </div>

            <div className="space-y-3">
              <h1 className="text-4xl md:text-5xl font-bold text-brand-white">
                {isAddingAccount ? 'Account Added!' : 'Congratulations!'}
              </h1>
              <p className="text-xl text-brand-white/80">
                {isAddingAccount
                  ? "You've successfully added a new booster account"
                  : "You've chosen to take control of your credit journey"}
              </p>
            </div>
          </CardHeader>

          <CardContent className="px-8 pb-8 space-y-8">
            <div className="bg-brand-midnight/50 rounded-xl p-6 border border-brand-sky-blue/20 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-brand-white/70">Selected Plan</span>
                <Badge className="bg-gradient-to-r from-brand-sky-blue to-brand-sky-blue-light text-white border-0 px-3 py-1">
                  {plan}
                </Badge>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-brand-white/10">
                <span className="text-brand-white font-semibold text-lg">
                  Monthly Investment
                </span>
                <span className="text-3xl font-bold bg-gradient-to-r from-brand-sky-blue to-brand-sky-blue-light bg-clip-text text-transparent">
                  ${price}
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-brand-white font-semibold text-lg flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-brand-sky-blue" />
                {isAddingAccount ? 'Account Benefits' : "What's Next?"}
              </h3>

              <ul className="space-y-3">
                {isAddingAccount ? (
                  <>
                    <li className="flex items-start gap-3 text-brand-white/80">
                      <Check className="w-5 h-5 text-brand-sky-blue mt-0.5 flex-shrink-0" />
                      <span>
                        Additional credit builder account added to your profile
                      </span>
                    </li>
                    <li className="flex items-start gap-3 text-brand-white/80">
                      <Check className="w-5 h-5 text-brand-sky-blue mt-0.5 flex-shrink-0" />
                      <span>
                        Increased credit building power across all accounts
                      </span>
                    </li>
                    <li className="flex items-start gap-3 text-brand-white/80">
                      <Check className="w-5 h-5 text-brand-sky-blue mt-0.5 flex-shrink-0" />
                      <span>
                        View and manage all accounts in your dashboard
                      </span>
                    </li>
                  </>
                ) : (
                  <>
                    <li className="flex items-start gap-3 text-brand-white/80">
                      <Check className="w-5 h-5 text-brand-sky-blue mt-0.5 flex-shrink-0" />
                      <span>Complete your personal information</span>
                    </li>
                    <li className="flex items-start gap-3 text-brand-white/80">
                      <Check className="w-5 h-5 text-brand-sky-blue mt-0.5 flex-shrink-0" />
                      <span>Set up your payment method securely</span>
                    </li>
                    <li className="flex items-start gap-3 text-brand-white/80">
                      <Check className="w-5 h-5 text-brand-sky-blue mt-0.5 flex-shrink-0" />
                      <span>Start building your credit immediately</span>
                    </li>
                  </>
                )}
              </ul>
            </div>

            <Button
              onClick={handleContinue}
              disabled={loading}
              className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-brand-sky-blue to-brand-sky-blue-light hover:from-brand-sky-blue-light hover:to-brand-sky-blue text-white shadow-xl shadow-brand-sky-blue/40 hover:shadow-brand-sky-blue/60 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Loading...</span>
                </div>
              ) : (
                <>
                  {isAddingAccount
                    ? 'Return to Dashboard'
                    : 'Continue with Account Setup'}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </Button>

            {!isAddingAccount && (
              <p className="text-center text-sm text-brand-white/50">
                By continuing, you agree to our Terms of Service and Privacy
                Policy
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
