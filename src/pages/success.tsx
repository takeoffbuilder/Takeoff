import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { authService } from '@/services/authService';
import { StarField } from '@/components/StarField';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Loader2, AlertCircle } from 'lucide-react';

type SubscriptionStatusResponse = {
  status?: string;
  isSubscriber?: boolean;
  hasActiveSubscription?: boolean;
  pendingAuth?: boolean;
  account?: { status?: string | null } | null;
  accounts?: Array<{ status?: string | null }>;
};

export default function SuccessPage() {
  const router = useRouter();
  const sessionIdQuery = router.query.session_id as string | undefined;
  const [isProcessing, setIsProcessing] = useState(true);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    if (!router.isReady) return;

    const session_id = sessionIdQuery;

    if (!session_id || typeof session_id !== 'string') {
      setError('Missing payment session. Please check your dashboard.');
      setIsProcessing(false);
      return;
    }

    setSessionId(session_id);
    console.log('✅ Stripe session ID captured:', session_id);

    let cancelled = false;
    let authRetryCount = 0;
    const maxAuthRetries = 5;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let currentAttempt = 0;
    const maxAttempts = 10;
    const delayMs = 2000;

    const isAccountReady = (data: SubscriptionStatusResponse) => {
      return (
        data?.isSubscriber === true ||
        data?.hasActiveSubscription === true ||
        data?.status === 'active' ||
        data?.status === 'pending' ||
        data?.account?.status === 'active' ||
        data?.account?.status === 'pending' ||
        (Array.isArray(data?.accounts) &&
          data.accounts.some(
            (acct) => acct?.status === 'active' || acct?.status === 'pending'
          ))
      );
    };

    const checkSubscriptionStatus = async () => {
      currentAttempt += 1;
      setAttempts(currentAttempt);

      try {
        const user = await authService.getCurrentUser();

        if (!user?.id) {
          authRetryCount += 1;
          console.warn(
            `⏳ Auth/session not ready yet (attempt ${authRetryCount}/${maxAuthRetries}).`
          );

          if (cancelled) return;

          if (
            authRetryCount >= maxAuthRetries &&
            currentAttempt >= maxAttempts
          ) {
            setIsProcessing(false);
            setError(
              'Your payment succeeded, but we could not confirm your session yet. Please sign in again and go to your dashboard.'
            );
            return;
          }

          timeoutId = setTimeout(checkSubscriptionStatus, delayMs);
          return;
        }

        const res = await fetch(
          `/api/subscription/status?userId=${encodeURIComponent(user.id)}`,
          {
            method: 'GET',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        if (!res.ok) {
          throw new Error(`Status check failed with ${res.status}`);
        }

        const data: SubscriptionStatusResponse = await res.json();
        console.log('📦 Subscription status response:', data);

        if (cancelled) return;

        if (isAccountReady(data)) {
          console.log('✅ Account is ready. Redirecting to dashboard.');
          setIsProcessing(false);
          setError(null);
          // Auto-redirect to dashboard after a brief moment
          setTimeout(() => {
            if (!cancelled) router.push('/dashboard?fromCheckout=1');
          }, 2000);
          return;
        }

        if (data?.pendingAuth === true) {
          console.warn('⏳ Subscription status reports pending auth/session.');
          timeoutId = setTimeout(checkSubscriptionStatus, delayMs);
          return;
        }

        if (currentAttempt >= maxAttempts) {
          console.warn('⌛ Account not ready after max attempts.');
          setIsProcessing(false);
          setError(
            'Your payment succeeded, but your account is still finishing setup. Please go to your dashboard in a moment.'
          );
          return;
        }

        timeoutId = setTimeout(checkSubscriptionStatus, delayMs);
      } catch (err) {
        console.error('❌ Error checking subscription status:', err);

        if (cancelled) return;

        if (currentAttempt >= maxAttempts) {
          setIsProcessing(false);
          setError(
            'Your payment succeeded, but we could not confirm account activation yet. Please go to your dashboard.'
          );
          return;
        }

        timeoutId = setTimeout(checkSubscriptionStatus, delayMs);
      }
    };

    timeoutId = setTimeout(checkSubscriptionStatus, 3000);

    return () => {
      cancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [router.isReady, sessionIdQuery]);

  const handleGoToDashboard = () => {
    router.push('/dashboard?fromCheckout=1');
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-b from-brand-midnight via-brand-charcoal to-brand-midnight">
      <StarField />

      <div className="absolute inset-0 bg-gradient-radial from-brand-sky-blue/5 via-transparent to-transparent opacity-50" />

      <div className="relative z-10 min-h-screen flex items-center justify-center px-4">
        <Card className="w-full max-w-2xl border-brand-sky-blue/20 bg-brand-charcoal/50 backdrop-blur-xl shadow-xl shadow-brand-sky-blue/5">
          <CardHeader className="text-center space-y-4 pb-2">
            {isProcessing ? (
              <>
                <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-r from-brand-sky-blue to-brand-sky-blue-light flex items-center justify-center animate-pulse">
                  <Loader2 className="w-10 h-10 text-white animate-spin" />
                </div>
                <CardTitle className="text-3xl font-bold text-white">
                  Processing Your Payment...
                </CardTitle>
                <CardDescription className="text-gray-400 text-lg">
                  Please wait while we activate your account
                </CardDescription>
              </>
            ) : error ? (
              <>
                <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-r from-red-500 to-red-600 flex items-center justify-center">
                  <AlertCircle className="w-10 h-10 text-white" />
                </div>
                <CardTitle className="text-3xl font-bold text-red-400">
                  Setup Still In Progress
                </CardTitle>
                <CardDescription className="text-gray-400 text-lg">
                  {error}
                </CardDescription>
              </>
            ) : (
              <>
                <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 flex items-center justify-center">
                  <CheckCircle className="w-10 h-10 text-white animate-bounce" />
                </div>
                <CardTitle className="text-3xl font-bold bg-gradient-to-r from-brand-sky-blue to-brand-sky-blue-light bg-clip-text text-transparent">
                  Payment Successful! 🎉
                </CardTitle>
                <CardDescription className="text-gray-400 text-lg">
                  Your account is ready
                </CardDescription>
              </>
            )}
          </CardHeader>

          <CardContent className="space-y-6 pt-6">
            {isProcessing ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-gray-300">
                  <div className="w-2 h-2 rounded-full bg-brand-sky-blue animate-pulse"></div>
                  <span>Verifying payment details...</span>
                </div>
                <div className="flex items-center gap-3 text-gray-300">
                  <div
                    className="w-2 h-2 rounded-full bg-brand-sky-blue animate-pulse"
                    style={{ animationDelay: '200ms' }}
                  ></div>
                  <span>Creating your booster account...</span>
                </div>
                <div className="flex items-center gap-3 text-gray-300">
                  <div
                    className="w-2 h-2 rounded-full bg-brand-sky-blue animate-pulse"
                    style={{ animationDelay: '400ms' }}
                  ></div>
                  <span>Checking subscription activation...</span>
                </div>

                <div className="bg-brand-midnight/30 rounded-lg p-4 border border-brand-sky-blue/10">
                  <p className="text-sm text-gray-300 text-center">
                    Checking activation status
                    {attempts > 0 ? ` (attempt ${attempts}/10)` : '...'}
                  </p>
                </div>

                {sessionId && (
                  <div className="mt-4 pt-4 border-t border-brand-sky-blue/10">
                    <p className="text-xs text-gray-500 text-center">
                      Session: {sessionId.slice(0, 20)}...
                    </p>
                  </div>
                )}
              </div>
            ) : error ? (
              <div className="space-y-4">
                <div className="bg-red-500/10 rounded-lg p-4 border border-red-500/20">
                  <p className="text-sm text-gray-300 text-center">
                    Your payment appears to have succeeded, but the dashboard
                    may need another moment to reflect your active plan.
                  </p>
                </div>

                <Button
                  onClick={handleGoToDashboard}
                  className="w-full bg-gradient-to-r from-brand-sky-blue to-brand-sky-blue-light hover:from-brand-sky-blue-light hover:to-brand-sky-blue text-white"
                  size="lg"
                >
                  Go to Dashboard
                </Button>
              </div>
            ) : (
              <>
                <div className="bg-brand-midnight/30 rounded-lg p-6 border border-brand-sky-blue/10 space-y-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-white font-medium">
                        Payment Processed
                      </p>
                      <p className="text-gray-400 text-sm mt-1">
                        Your subscription has been activated and will renew
                        monthly
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-white font-medium">Account Created</p>
                      <p className="text-gray-400 text-sm mt-1">
                        Your booster account is now active and ready to build
                        credit
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-white font-medium">
                        Redirecting to Dashboard
                      </p>
                      <p className="text-gray-400 text-sm mt-1">
                        Your account has been verified successfully
                      </p>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handleGoToDashboard}
                  className="w-full bg-gradient-to-r from-brand-sky-blue to-brand-sky-blue-light hover:from-brand-sky-blue-light hover:to-brand-sky-blue text-white shadow-lg shadow-brand-sky-blue/30 transition-all duration-300 hover:scale-105"
                  size="lg"
                >
                  Go to Dashboard Now
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
