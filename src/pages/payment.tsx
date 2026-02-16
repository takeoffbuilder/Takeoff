import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { StarField } from '@/components/StarField';
import { ArrowLeft, CreditCard, Check, X } from 'lucide-react';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { accountStore } from '@/lib/account-store';
import { boosterAccountService } from '@/services/boosterAccountService';
import { BoosterAccount } from '@/types/user';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { getStripe } from '@/lib/stripe-client';
import { authService } from '@/services/authService';
import { useToast } from '@/hooks/use-toast';

type SelectedPlan = { planName: string; monthlyAmount: number; planId: string };

export default function PaymentPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [boosterAccounts, setBoosterAccounts] = useState<BoosterAccount[]>([]);
  const [newlyAddedPlan, setNewlyAddedPlan] = useState<SelectedPlan | null>(
    null
  );
  // Treat Stripe as the source of truth when configured
  const stripeConfigured = Boolean(
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  );
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPaymentCard, setShowPaymentCard] = useState(false);
  // Minimal flow: no debug panel/state

  useEffect(() => {
    (async () => {
      // Keep local/demo data for fallback
      const localAccounts = accountStore.getBoosterAccounts().map((a) => ({
        ...a,
        currentBalance: a.currentBalance ?? a.monthlyAmount,
      }));
      setBoosterAccounts(localAccounts);

      // Load active accounts from Supabase for real users
      try {
        const user = await authService.getCurrentUser();
        if (user) {
          const active = await boosterAccountService.getUserAccountsByStatus(
            user.id,
            'active'
          );
          type SupaAcc = {
            id: string;
            created_at: string;
            monthly_amount: string | number;
            credit_limit: string | number;
            booster_plans?: { plan_name?: string | null } | null;
          };
          const toNumber = (v: string | number | null | undefined) =>
            typeof v === 'number' ? v : v ? Number(v) : 0;
          const mapped = (active as SupaAcc[]).map((acc) => ({
            id: acc.id,
            planName: acc.booster_plans?.plan_name || 'Booster Plan',
            monthlyAmount: toNumber(acc.monthly_amount),
            creditLimit: toNumber(acc.credit_limit),
            dateAdded: acc.created_at,
            status: 'Active' as const,
            currentBalance: toNumber(acc.monthly_amount),
          }));
          if (mapped.length > 0) {
            setBoosterAccounts(mapped);
          }
        }
      } catch (e) {
        console.warn(
          'Payment page: failed to load active accounts from Supabase',
          e
        );
      }

      // Pending plan (selectedPlan) for add flow
      const newPlanData = sessionStorage.getItem('selectedPlan');
      if (newPlanData) {
        try {
          const plan = JSON.parse(newPlanData);
          setNewlyAddedPlan(plan);
        } catch (error) {
          console.error(
            'Failed to parse selected plan from sessionStorage',
            error
          );
        }
      }
    })();
  }, []);

  const totalAmountDue =
    boosterAccounts.reduce(
      (sum, account) => sum + (account.currentBalance || 0),
      0
    ) + (newlyAddedPlan?.monthlyAmount || 0);

  const handlePayNowClick = () => {
    if (boosterAccounts.length === 0 && !newlyAddedPlan) {
      toast({
        title: 'No active accounts',
        description: 'You don’t have any active Booster accounts to pay.',
      });
      return;
    }
    setShowPaymentCard(true);
  };

  const handleClosePaymentCard = () => {
    setShowPaymentCard(false);
  };

  const handleProceedToPayment = async () => {
    if (isProcessing) return;

    if (newlyAddedPlan) {
      setIsProcessing(true);
      try {
        const user = await authService.getCurrentUser();
        if (!user) {
          toast({
            title: 'Authentication Error',
            description: 'You must be signed in to add a plan.',
            variant: 'destructive',
          });
          setIsProcessing(false);
          router.push('/signin');
          return;
        }

        // Step 1: Create Stripe customer and sync to Supabase
        const customerRes = await fetch('/api/stripe/create-customer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            name: user.name || '',
            email: user.email,
          }),
        });
        if (!customerRes.ok) {
          const errorData = await customerRes.json();
          setIsProcessing(false);
          toast({
            title: 'Customer Error',
            description: errorData.error || 'Failed to create Stripe customer',
            variant: 'destructive',
            duration: 8000,
          });
          return;
        }
        const { customerId } = await customerRes.json();

        // Step 2: Proceed to create checkout session
        const response = await fetch('/api/stripe/create-checkout-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            planId: newlyAddedPlan.planId,
            userId: user.id,
            email: user.email,
            customerId,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          setIsProcessing(false);
          toast({
            title: 'Checkout Error',
            description: errorData.error || 'Failed to create checkout session',
            variant: 'destructive',
            duration: 8000,
          });
          return;
        }

        const { sessionId, url } = await response.json();
        if (!sessionId && !url) {
          setIsProcessing(false);
          toast({
            title: 'Session Error',
            description: 'Missing checkout session from server.',
            variant: 'destructive',
          });
          return;
        }

        // Clear selected plan before redirect
        sessionStorage.removeItem('selectedPlan');

        // Chrome-hardening: prefer direct URL navigation first to avoid
        // any potential user-gesture or popup-policy edge cases.
        if (url) {
          window.location.assign(url);
          return; // stop here if we have a URL
        }

        // Fallback: Stripe JS redirect when only sessionId is returned
        try {
          if (sessionId) {
            const stripe = await getStripe();
            if (!stripe) throw new Error('Failed to load Stripe');

            // Try the redirect; if it doesn't happen quickly, fall back to URL
            const timeout = new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error('redirect-timeout')), 2000)
            );

            await Promise.race([
              stripe.redirectToCheckout({ sessionId }).then((res) => {
                if (res.error) throw new Error(res.error.message);
                // If navigation succeeds, this code path won't continue
                return undefined as never;
              }),
              timeout,
            ]);
          }
        } catch (e) {
          // Final fallback to direct URL if available
          if (url) {
            window.location.assign(url);
          } else {
            setIsProcessing(false);
            toast({
              title: 'Redirect Error',
              description:
                e instanceof Error ? e.message : 'Failed to start checkout.',
              variant: 'destructive',
            });
          }
        }
      } catch (error: unknown) {
        setIsProcessing(false);
        toast({
          title: 'Payment Error',
          description:
            error instanceof Error
              ? error.message
              : 'Unexpected error occurred.',
          variant: 'destructive',
        });
      }
    } else {
      // No pending plan: For Stripe, subscriptions are billed automatically
      if (stripeConfigured) {
        toast({
          title: 'Billed automatically',
          description:
            'Your active subscriptions are billed automatically by Stripe each cycle. To update your payment method, go to Account Settings.',
        });
        router.push('/settings');
        return;
      }
      // Local/demo flow only when Stripe is not configured
      setShowConfirmation(true);
    }
  };

  const handleConfirmPayment = () => {
    setShowConfirmation(false);
    setIsProcessing(true);

    setTimeout(() => {
      accountStore.processPayment(
        boosterAccounts.map((acc) => acc.id),
        totalAmountDue
      );

      setIsProcessing(false);
      setShowSuccess(true);

      setTimeout(() => {
        router.push('/dashboard');
      }, 2500);
    }, 1500);
  };

  const handleBackToDashboard = () => {
    router.push('/dashboard');
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-b from-brand-midnight via-brand-charcoal to-brand-midnight">
      <StarField />

      <div className="absolute inset-0 bg-gradient-radial from-brand-sky-blue/5 via-transparent to-transparent opacity-50" />

      <div className="relative z-10 min-h-screen">
        <header className="border-b border-brand-sky-blue/20 bg-brand-charcoal/50 backdrop-blur-xl">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <Button
              onClick={handleBackToDashboard}
              variant="ghost"
              className="text-white hover:text-brand-sky-blue-light hover:bg-brand-sky-blue/10"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </div>
        </header>

        <main className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="text-center space-y-4">
              <h1 className="text-4xl font-bold text-white">
                {newlyAddedPlan ? 'Confirm Your New Plan' : 'Make a Payment'}
              </h1>
              <p className="text-xl text-gray-400">
                {newlyAddedPlan
                  ? 'Review and complete the payment for your new Booster account.'
                  : 'Review your active Booster accounts and pay your total balance below.'}
              </p>
            </div>

            {boosterAccounts.length === 0 && !newlyAddedPlan ? (
              <Card className="border-brand-sky-blue/20 bg-brand-charcoal/50 backdrop-blur-xl shadow-xl shadow-brand-sky-blue/5">
                <CardContent className="py-12 text-center">
                  <p className="text-gray-400 text-lg">
                    No active booster accounts found.
                  </p>
                  <p className="text-gray-500 text-sm mt-2">
                    Add a booster account to get started.
                  </p>
                  <Button
                    onClick={() => router.push('/dashboard')}
                    className="mt-6 bg-gradient-to-r from-brand-sky-blue to-brand-sky-blue-light hover:from-brand-sky-blue-light hover:to-brand-sky-blue text-white"
                  >
                    Go to Dashboard
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <>
                <Card className="border-brand-sky-blue/20 bg-brand-charcoal/50 backdrop-blur-xl shadow-xl shadow-brand-sky-blue/5">
                  <CardHeader>
                    <CardTitle className="text-white">
                      {newlyAddedPlan
                        ? 'New & Active Accounts'
                        : 'Active Booster Accounts'}
                    </CardTitle>
                    <CardDescription className="text-gray-400">
                      {boosterAccounts.length + (newlyAddedPlan ? 1 : 0)} active
                      and pending{' '}
                      {boosterAccounts.length + (newlyAddedPlan ? 1 : 0) === 1
                        ? 'account'
                        : 'accounts'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {newlyAddedPlan && (
                        <div className="flex items-center justify-between p-6 rounded-lg bg-brand-sky-blue/10 border border-brand-sky-blue/30 transition-all">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-white font-semibold text-lg">
                                {newlyAddedPlan.planName}
                              </h3>
                              <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30">
                                Pending Payment
                              </Badge>
                            </div>
                            <p className="text-gray-400 text-sm">
                              Monthly Amount: $
                              {newlyAddedPlan.monthlyAmount.toFixed(2)}/month
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-gray-400 text-sm mb-1">
                              Amount Due
                            </p>
                            <p className="text-2xl font-bold text-white">
                              ${(newlyAddedPlan.monthlyAmount || 0).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      )}

                      {boosterAccounts.map((account) => (
                        <div
                          key={account.id}
                          className="flex items-center justify-between p-6 rounded-lg bg-brand-midnight/50 border border-brand-sky-blue/10 hover:border-brand-sky-blue/30 transition-all"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-white font-semibold text-lg">
                                {account.planName}
                              </h3>
                              <Badge
                                className={
                                  account.status === 'Active'
                                    ? 'bg-green-500/20 text-green-300 border-green-500/30'
                                    : 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
                                }
                              >
                                {account.status}
                              </Badge>
                            </div>
                            <p className="text-gray-400 text-sm">
                              Monthly Amount: $
                              {account.monthlyAmount.toFixed(2)}/month
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-gray-400 text-sm mb-1">
                              Current Balance
                            </p>
                            <p className="text-2xl font-bold text-white">
                              ${(account.currentBalance || 0).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {!showPaymentCard ? (
                  <div className="text-center">
                    <Button
                      onClick={handlePayNowClick}
                      className="h-14 px-12 text-lg font-semibold bg-gradient-to-r from-brand-sky-blue to-brand-sky-blue-light hover:from-brand-sky-blue-light hover:to-brand-sky-blue text-white shadow-lg shadow-brand-sky-blue/50 transition-all duration-300 hover:scale-105"
                    >
                      <CreditCard className="mr-2 h-5 w-5" />
                      {newlyAddedPlan
                        ? 'Continue to Stripe'
                        : 'View Payment Details'}
                    </Button>
                  </div>
                ) : (
                  <Card className="border-brand-sky-blue/20 bg-brand-midnight/90 backdrop-blur-xl shadow-2xl shadow-brand-sky-blue/10 relative">
                    <Button
                      onClick={handleClosePaymentCard}
                      variant="ghost"
                      size="icon"
                      className="absolute top-4 right-4 text-gray-400 hover:text-white hover:bg-brand-sky-blue/20 transition-colors z-10"
                    >
                      <X className="h-5 w-5" />
                    </Button>

                    <CardContent className="py-8">
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <h3 className="text-2xl font-bold text-white mb-2">
                            Total Amount Due
                          </h3>
                          <p className="text-gray-400 text-sm">
                            {newlyAddedPlan
                              ? 'This amount reflects the combined total after adding your new plan.'
                              : 'Combined payment for all accounts'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-5xl font-bold bg-gradient-to-r from-brand-sky-blue to-brand-sky-blue-light bg-clip-text text-transparent">
                            ${totalAmountDue.toFixed(2)}
                          </p>
                        </div>
                      </div>

                      <Button
                        onClick={handleProceedToPayment}
                        onMouseDown={(e) => {
                          // Prevent multiple rapid clicks
                          if (isProcessing) {
                            e.preventDefault();
                            e.stopPropagation();
                          }
                        }}
                        disabled={isProcessing}
                        className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-brand-sky-blue to-brand-sky-blue-light hover:from-brand-sky-blue-light hover:to-brand-sky-blue text-white shadow-lg shadow-brand-sky-blue/50 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                      >
                        {isProcessing ? (
                          <div className="flex items-center gap-2">
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>Processing...</span>
                          </div>
                        ) : (
                          <>
                            <CreditCard className="mr-2 h-5 w-5" />
                            {newlyAddedPlan ? 'Continue to Stripe' : 'Pay Now'}
                          </>
                        )}
                      </Button>

                      <p className="text-center text-gray-500 text-sm mt-4">
                        Secure payment processing via Stripe
                      </p>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </div>
        </main>
      </div>

      <AlertDialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <AlertDialogContent className="border-brand-sky-blue/20 bg-brand-charcoal/95 backdrop-blur-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white text-2xl">
              Confirm Payment
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400 text-base">
              You are about to pay{' '}
              <span className="font-bold text-brand-sky-blue">
                ${totalAmountDue.toFixed(2)}
              </span>{' '}
              for{' '}
              <span className="font-bold text-brand-sky-blue">
                {boosterAccounts.length + (newlyAddedPlan ? 1 : 0)}
              </span>{' '}
              active and pending{' '}
              {boosterAccounts.length + (newlyAddedPlan ? 1 : 0) === 1
                ? 'plan'
                : 'plans'}
              .
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <div className="space-y-2">
              {newlyAddedPlan && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">
                    {newlyAddedPlan.planName} (New)
                  </span>
                  <span className="text-white font-medium">
                    ${(newlyAddedPlan.monthlyAmount || 0).toFixed(2)}
                  </span>
                </div>
              )}
              {boosterAccounts.map((account) => (
                <div key={account.id} className="flex justify-between text-sm">
                  <span className="text-gray-400">{account.planName}</span>
                  <span className="text-white font-medium">
                    ${(account.currentBalance || 0).toFixed(2)}
                  </span>
                </div>
              ))}
              <div className="border-t border-brand-sky-blue/20 pt-2 mt-2 flex justify-between font-bold">
                <span className="text-white">Total</span>
                <span className="text-brand-sky-blue">
                  ${totalAmountDue.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-brand-sky-blue/30 text-white hover:bg-brand-sky-blue/10">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmPayment}
              className="bg-gradient-to-r from-brand-sky-blue to-brand-sky-blue-light hover:from-brand-sky-blue-light hover:to-brand-sky-blue text-white"
            >
              Confirm Payment
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showSuccess} onOpenChange={setShowSuccess}>
        <AlertDialogContent className="border-green-500/20 bg-brand-charcoal/95 backdrop-blur-xl">
          <AlertDialogHeader>
            <div className="flex justify-center mb-4">
              <div className="h-16 w-16 rounded-full bg-green-500/20 flex items-center justify-center">
                <Check className="h-8 w-8 text-green-400" />
              </div>
            </div>
            <AlertDialogTitle className="text-white text-2xl text-center">
              Payment Successful!
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400 text-base text-center">
              Your payment of{' '}
              <span className="font-bold text-green-400">
                ${totalAmountDue.toFixed(2)}
              </span>{' '}
              has been processed successfully. Your account balances have been
              updated.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-center">
            <AlertDialogAction
              onClick={() => router.push('/dashboard')}
              className="bg-gradient-to-r from-brand-sky-blue to-brand-sky-blue-light hover:from-brand-sky-blue-light hover:to-brand-sky-blue text-white"
            >
              Return to Dashboard
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Minimal flow: no debug panel */}
    </div>
  );
}
