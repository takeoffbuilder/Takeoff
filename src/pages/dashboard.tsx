/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/exhaustive-deps */
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getMyReferrer, buildReferralLink } from '@/services/referralService';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { StarField } from '@/components/StarField';
import { useRouter } from 'next/router';
import { useEffect, useRef, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import {
  Calendar,
  DollarSign,
  AlertCircle,
  CreditCard,
  TrendingUp,
  Download as DownloadIcon,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { profileService } from '@/services/profileService';
import { authService } from '@/services/authService';
import { boosterAccountService } from '@/services/boosterAccountService';
import { paymentService } from '@/services/paymentService';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { ToastAction } from '@/components/ui/toast';
import { AVAILABLE_COURSES } from '@/services/courseService';
import { activityService } from '@/services/activityService';
import {
  getBalanceMetrics,
  getTrueLimit,
  getFirstAndRegular,
  getPlanUtilizationRate,
} from '@/lib/payment-schedule';
import { AdminLink } from '@/components/AdminLink';
import { isAdmin } from '@/services/adminService';
import { supabase } from '@/integrations/supabase/client';

interface BoosterAccount {
  id: string;
  planName: string;
  monthlyAmount: number;
  creditLimit: number;
  status: string;
  dateAdded: string;
  nextPaymentDate?: string;
  availableCredit?: number; // computed (highest credit / available credit)
  utilizationPct?: number; // computed utilization percentage
}

interface UpcomingPayment {
  id: string;
  planName: string;
  dueDate: string;
  amount: number;
  accountId: string;
}

export default function DashboardPage() {
  // Affiliate state (Supabase)
  // Removed unused affiliateCode
  const [affiliateLink, setAffiliateLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isAffiliate, setIsAffiliate] = useState(false);
  const router = useRouter();
  const [showAdminButton, setShowAdminButton] = useState(false);
  // Removed unused loadingAffiliate

  useEffect(() => {
    async function fetchAffiliate() {
      const referrer = await getMyReferrer();
      if (referrer && referrer.referral_code) {
        setAffiliateLink(buildReferralLink(referrer.referral_code));
        setIsAffiliate(true);
      } else {
        setIsAffiliate(false);
        setAffiliateLink(null);
      }
    }
    fetchAffiliate();
  }, []);

  // More robust admin check: runs on route change and on auth state change
  useEffect(() => {
    let mounted = true;
    const checkAdmin = async () => {
      const user = await authService.getCurrentUser();
      if (user) {
        const admin = await isAdmin(user.email);
        if (mounted) setShowAdminButton(admin);
      } else {
        if (mounted) setShowAdminButton(false);
      }
    };
    checkAdmin();
    // Listen for auth state changes (login, logout, signup)
    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      checkAdmin();
    });
    return () => {
      mounted = false;
      listener?.subscription.unsubscribe();
    };
  }, [router.asPath]);

  const handleCopyReferralLink = () => {
    if (affiliateLink) {
      navigator.clipboard.writeText(affiliateLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
      toast({
        title: 'Copied!',
        description: 'Referral link copied to clipboard.',
      });
    }
  };

  const { toast } = useToast();
  const [firstName, setFirstName] = useState<string>('');
  // const [userId, setUserId] = useState<string | null>(null);
  const [boosterAccounts, setBoosterAccounts] = useState<BoosterAccount[]>([]);
  const [upcomingPayments, setUpcomingPayments] = useState<UpcomingPayment[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isNavigating, setIsNavigating] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<BoosterAccount | null>(
    null
  );
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false);
  const [accountToCancel, setAccountToCancel] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activities, setActivities] = useState<
    Array<{
      id: string;
      activity_type: string;
      description: string;
      created_at: string;
    }>
  >([]);

  // Track toast visibility and last allowance to avoid repetition and enable increments
  const prevActiveCountRef = useRef<number>(0);
  const hasShownActivationToastRef = useRef<boolean>(false);
  const activationToastKeyRef = useRef<string | null>(null);
  const lastAllowanceKeyRef = useRef<string | null>(null);
  const lastAllowanceShownRef = useRef<number>(0);

  const planAllowance = (planName: string): number => {
    const name = (planName || '').toLowerCase();
    if (name.includes('starter')) return 1;
    if (name.includes('power')) return 2;
    if (name.includes('max')) return 3;
    if (name.includes('blaster')) return 4;
    if (name.includes('super')) return 5;
    if (name.includes('star')) return 6;
    return 0;
  };

  useEffect(() => {
    loadDashboardData();

    // FIXED: Poll for account updates for 30 seconds after mount
    // This catches accounts created by Stripe webhook after payment redirect
    let pollCount = 0;
    const maxPolls = 10; // Poll 10 times (30 seconds total)

    const pollInterval = setInterval(async () => {
      pollCount++;

      if (pollCount >= maxPolls) {
        clearInterval(pollInterval);
        return;
      }

      // Silently refresh data in background
      try {
        const user = await authService.getCurrentUser();
        if (user) {
          // Initialize per-session key to remember if we already showed the activation toast
          if (!activationToastKeyRef.current) {
            activationToastKeyRef.current = `activation_toast_shown_${user.id}`;
            try {
              hasShownActivationToastRef.current =
                sessionStorage.getItem(activationToastKeyRef.current) === '1';
            } catch {}
          }
          if (!lastAllowanceKeyRef.current) {
            lastAllowanceKeyRef.current = `last_allowance_shown_${user.id}`;
            try {
              const stored = sessionStorage.getItem(
                lastAllowanceKeyRef.current
              );
              lastAllowanceShownRef.current = stored ? parseInt(stored, 10) : 0;
            } catch {}
          }
          const accounts = await boosterAccountService.getUserAccounts(user.id);

          // Log account statistics for database inspection
          const stats = await boosterAccountService.getUserAccountStats(
            user.id
          );
          console.log('📊 Current Account Statistics:', stats);

          const activeOnly = accounts.filter(
            (account: any) => account.status === 'active'
          );
          // Also pull payments to compute per-account metrics during polling
          let userPayments: any[] = [];
          try {
            userPayments = await paymentService.getUserPayments(user.id);
          } catch {}
          const paymentAgg: Record<string, { count: number }> = {};
          (userPayments || []).forEach((p: any) => {
            if (
              p.status === 'completed' &&
              p.payment_type === 'subscription' &&
              p.booster_account_id
            ) {
              const key = p.booster_account_id as string;
              if (!paymentAgg[key]) paymentAgg[key] = { count: 0 };
              paymentAgg[key].count += 1;
            }
          });

          const displayAccounts: BoosterAccount[] = accounts
            .filter(
              (account: any) =>
                account.status === 'active' || account.status === 'pending'
            )
            .map((account: any) => {
              const creditLimit = parseFloat(account.credit_limit) || 0;
              const completedCount = paymentAgg[account.id]?.count || 0;
              const planName = account.booster_plans?.plan_name || '';
              const rate = getPlanUtilizationRate(planName);
              const { availableCredit, utilizationPct } = getBalanceMetrics(
                creditLimit,
                completedCount,
                rate
              );
              return {
                id: account.id,
                planName: account.booster_plans?.plan_name || 'Unknown Plan',
                monthlyAmount: parseFloat(account.monthly_amount),
                creditLimit,
                status: account.status === 'pending' ? 'Pending' : 'Active',
                dateAdded: account.created_at,
                nextPaymentDate: account.next_payment_date,
                availableCredit,
                utilizationPct,
              } as BoosterAccount;
            });

          // Update UI list on every poll to keep metrics fresh
          setBoosterAccounts(displayAccounts);

          const currentAllowance = activeOnly
            .map((acc: any) => ({
              planName: acc.booster_plans?.plan_name || 'Unknown Plan',
            }))
            .reduce((sum, acc) => sum + planAllowance(acc.planName), 0);
          const cappedAllowance = Math.min(
            currentAllowance,
            AVAILABLE_COURSES.length
          );
          // Show toast on first activation (per session)
          if (
            prevActiveCountRef.current === 0 &&
            activeOnly.length > 0 &&
            !hasShownActivationToastRef.current
          ) {
            toast({
              title: 'Account Activated! 🎉',
              description: `Your booster account is now active. You’ve unlocked access to up to ${cappedAllowance} educational course${cappedAllowance !== 1 ? 's' : ''}. Visit My Courses to download.`,
              duration: 5000,
              action: (
                <ToastAction
                  altText="Go to My Courses"
                  onClick={() => router.push('/my-courses')}
                >
                  Download now
                </ToastAction>
              ),
            });
            hasShownActivationToastRef.current = true;
            try {
              if (activationToastKeyRef.current) {
                sessionStorage.setItem(activationToastKeyRef.current, '1');
              }
            } catch {}
          }

          // Show toast when allowance increases (e.g., adding a new plan)
          if (cappedAllowance > lastAllowanceShownRef.current) {
            const delta = cappedAllowance - lastAllowanceShownRef.current;
            if (lastAllowanceShownRef.current > 0) {
              toast({
                title: 'New Plan Added ✅',
                description: `You unlocked ${delta} more course${delta !== 1 ? 's' : ''}. Your total entitlement is now ${cappedAllowance}.`,
                duration: 5000,
                action: (
                  <ToastAction
                    altText="Go to My Courses"
                    onClick={() => router.push('/my-courses')}
                  >
                    Download now
                  </ToastAction>
                ),
              });
            }
            lastAllowanceShownRef.current = cappedAllowance;
            try {
              if (lastAllowanceKeyRef.current) {
                sessionStorage.setItem(
                  lastAllowanceKeyRef.current,
                  String(cappedAllowance)
                );
              }
            } catch {}
          }

          // Update previous count for next poll iteration
          prevActiveCountRef.current = activeOnly.length;
        }
      } catch (error) {
        console.error('Background polling error:', error);
      }
    }, 3000); // Poll every 3 seconds

    return () => clearInterval(pollInterval);
  }, []);

  const loadDashboardData = async (opts?: { silent?: boolean }) => {
    try {
      if (!opts?.silent) setIsLoading(true);

      // Get current authenticated user
      const user = await authService.getCurrentUser();

      if (!user) {
        toast({
          title: 'Authentication Required',
          description: 'Please sign in to view your dashboard.',
          variant: 'destructive',
        });
        router.push('/signin');
        return;
      }

      // setUserId(user.id);

      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📊 LOADING DASHBOARD DATA');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('👤 User ID:', user.id);
      console.log('📧 User Email:', user.email);

      // Load user's first name from personal info
      const personalInfo = await profileService.getPersonalInfo(user.id);
      if (personalInfo?.first_name) {
        setFirstName(personalInfo.first_name);
        console.log(
          '✅ User Name:',
          personalInfo.first_name,
          personalInfo.last_name
        );
      }

      // Load ALL booster accounts from database (for inspection)
      const allAccounts = await boosterAccountService.getUserAccounts(user.id);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('💳 ALL BOOSTER ACCOUNTS IN DATABASE');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`📊 Total Accounts: ${allAccounts.length}`);

      if (allAccounts.length > 0) {
        allAccounts.forEach((account: any, index: number) => {
          console.log(`\n🔹 Account ${index + 1}:`);
          console.log(`   ID: ${account.id}`);
          console.log(
            `   Plan: ${account.booster_plans?.plan_name || 'Unknown'}`
          );
          console.log(`   Status: ${account.status}`);
          console.log(`   Monthly Amount: $${account.monthly_amount}`);
          console.log(`   Credit Limit: $${account.credit_limit}`);
          console.log(
            `   Created: ${new Date(account.created_at).toLocaleString()}`
          );
          console.log(
            `   Stripe Subscription: ${account.stripe_subscription_id || 'None'}`
          );
        });
      } else {
        console.log('❌ No accounts found in database for this user');
      }

      // Get account statistics
      const stats = await boosterAccountService.getUserAccountStats(user.id);
      // Load recent activity
      try {
        const logs = await activityService.getUserActivities(user.id, 10);
        setActivities(
          (logs || []).map((l: any) => ({
            id: l.id,
            activity_type: l.activity_type,
            description: l.description,
            created_at: l.created_at,
          }))
        );
        console.log(`📝 Loaded ${logs?.length || 0} recent activities`);
      } catch (e) {
        console.error('Failed to load recent activity:', e);
      }
      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📈 ACCOUNT STATISTICS BY STATUS');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`📊 Total: ${stats.total}`);
      console.log(`✅ Active: ${stats.active}`);
      console.log(`❌ Cancelled: ${stats.cancelled}`);
      console.log(`⏳ Pending: ${stats.pending}`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

      // Fetch all user payments (for utilization + available credit math)
      // We derive current balance within the plan's True Limit (plan-specific utilization rate)
      // Available Credit = Plan Credit Limit - Current Balance
      // Utilization % = Current Balance / Plan Credit Limit
      let userPayments: any[] = [];
      try {
        userPayments = await paymentService.getUserPayments(user.id);
      } catch (e) {
        console.warn('Could not load user payments for utilization calc:', e);
      }

      // Group completed subscription payments by booster_account_id
      const paymentAgg: Record<string, { sum: number; count: number }> = {};
      (userPayments || []).forEach((p: any) => {
        if (
          p.status === 'completed' &&
          p.payment_type === 'subscription' &&
          p.booster_account_id
        ) {
          const key = p.booster_account_id as string;
          if (!paymentAgg[key]) paymentAgg[key] = { sum: 0, count: 0 };
          paymentAgg[key].sum += Number(p.amount) || 0;
          paymentAgg[key].count += 1;
        }
      });

      const displayAccounts: BoosterAccount[] = allAccounts
        .filter(
          (account: any) =>
            account.status === 'active' || account.status === 'pending'
        )
        .map((account: any) => {
          const creditLimit = parseFloat(account.credit_limit) || 0;
          const completedCount = paymentAgg[account.id]?.count || 0;
          // Derive utilization rate from plan name
          const planName = account.booster_plans?.plan_name || '';
          const rate = getPlanUtilizationRate(planName);
          const metrics = getBalanceMetrics(creditLimit, completedCount, rate);

          // Fallback: if no payments counted but a highest_credit_limit exists, recompute from that growth
          let availableCredit = metrics.availableCredit;
          let utilizationPct = metrics.utilizationPct;
          if (
            completedCount === 0 &&
            typeof account.highest_credit_limit === 'number'
          ) {
            const growth = parseFloat(account.highest_credit_limit) || 0;
            // Use plan-specific True Limit rate
            const fallbackRate = getPlanUtilizationRate(
              account.booster_plans?.plan_name || ''
            );
            const trueLimit =
              Math.round((creditLimit * fallbackRate + Number.EPSILON) * 100) /
              100;
            const currentBalance = Math.max(
              0,
              Math.round((trueLimit - growth + Number.EPSILON) * 100) / 100
            );
            availableCredit =
              Math.round(
                (creditLimit - currentBalance + Number.EPSILON) * 100
              ) / 100;
            utilizationPct =
              creditLimit > 0
                ? Math.min(
                    100,
                    Math.max(0, (currentBalance / creditLimit) * 100)
                  )
                : 0;
          }

          console.log('[Account Metrics]', {
            accountId: account.id,
            plan: account.booster_plans?.plan_name,
            creditLimit,
            completedCount,
            highest_credit_limit: account.highest_credit_limit,
            availableCredit,
            utilizationPct,
          });

          return {
            id: account.id,
            planName: account.booster_plans?.plan_name || 'Unknown Plan',
            monthlyAmount: parseFloat(account.monthly_amount),
            creditLimit,
            status: account.status === 'pending' ? 'Pending' : 'Active',
            dateAdded: account.created_at,
            nextPaymentDate: account.next_payment_date,
            availableCredit,
            utilizationPct,
          } as BoosterAccount;
        });

      setBoosterAccounts(displayAccounts);
      console.log(
        `🎯 Displaying ${displayAccounts.length} accounts (active + pending) in dashboard UI`
      );

      // Load upcoming payments
      const payments = await boosterAccountService.getUpcomingPayments(user.id);
      setUpcomingPayments(payments);
      console.log(`💰 Loaded ${payments.length} upcoming payments`);
    } catch (error) {
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.error('❌ ERROR LOADING DASHBOARD DATA');
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.error('Error:', error);
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      toast({
        title: 'Error Loading Dashboard',
        description:
          'Failed to load your dashboard data. Please try refreshing the page.',
        variant: 'destructive',
      });
    } finally {
      if (!opts?.silent) setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await authService.signOut();

      if (typeof window !== 'undefined') {
        localStorage.removeItem('userEmail');
        localStorage.removeItem('isAuthenticated');
        sessionStorage.clear();
      }

      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleAddAccount = () => {
    if (isNavigating) return;
    setIsNavigating(true);
    router.push('/choose-plan?mode=add');
  };

  const handleAccountClick = (account: BoosterAccount) => {
    setSelectedAccount(account);
    setIsAccountModalOpen(true);
  };

  const handleCloseAccountModal = () => {
    setIsAccountModalOpen(false);
    setTimeout(() => setSelectedAccount(null), 300);
  };

  const handleCancelAccount = (accountId: string) => {
    setAccountToCancel(accountId);
    setIsCancelConfirmOpen(true);
  };

  const confirmCancelAccount = async () => {
    if (!accountToCancel) return;

    try {
      const accountIdLocal = accountToCancel;
      const success = await paymentService.cancelSubscription(accountIdLocal);

      if (success) {
        // Close modal and inform user that Stripe cancellation has been requested.
        handleCloseAccountModal();

        toast({
          title: 'Cancellation requested',
          description:
            'We’ll update your dashboard once Stripe confirms the cancellation (may take a few seconds).',
          duration: 4000,
        });

        // Poll briefly to detect webhook-driven DB change for this account
        let attempts = 0;
        const maxAttempts = 10; // ~30s
        const poll = setInterval(async () => {
          attempts++;
          try {
            const acc =
              await boosterAccountService.getAccountById(accountIdLocal);
            const status = acc?.status ?? null;
            if (status === 'cancelled' || status === 'pending') {
              clearInterval(poll);
              // One visible refresh to reflect new state
              await loadDashboardData({ silent: false });
              return;
            }
          } catch (e) {
            console.error('Post-cancel status check error:', e);
          } finally {
            if (attempts >= maxAttempts) {
              clearInterval(poll);
              // Do a silent refresh to avoid jarring reloads if nothing changed
              loadDashboardData({ silent: true });
            }
          }
        }, 3000);
      } else {
        throw new Error('Failed to cancel account');
      }
    } catch (error) {
      console.error('Error cancelling account:', error);
      toast({
        title: 'Cancellation Failed',
        description:
          'Failed to cancel your account. Please try again or contact support.',
        variant: 'destructive',
      });
    } finally {
      setIsCancelConfirmOpen(false);
      setAccountToCancel(null);
    }
  };

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      await loadDashboardData();
      toast({
        title: 'Dashboard Refreshed',
        description: 'Your account data has been updated.',
        duration: 2000,
      });
    } catch (error) {
      console.error('Refresh error:', error);
      toast({
        title: 'Refresh Failed',
        description: 'Failed to refresh dashboard. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-brand-midnight via-brand-charcoal to-brand-midnight">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-brand-sky-blue border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-white text-lg">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-b from-brand-midnight via-brand-charcoal to-brand-midnight">
      <StarField />

      <div className="absolute inset-0 bg-gradient-radial from-brand-sky-blue/5 via-transparent to-transparent opacity-50" />

      <div className="relative z-10 min-h-screen">
        <header className="border-b border-brand-sky-blue/20 bg-brand-charcoal/50 backdrop-blur-xl">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {boosterAccounts.length === 0 && (
                <Button
                  onClick={handleManualRefresh}
                  disabled={isRefreshing}
                  variant="outline"
                  size="sm"
                  className="border-brand-sky-blue/30 text-brand-sky-blue hover:bg-brand-sky-blue/10"
                >
                  {isRefreshing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-brand-sky-blue border-t-transparent rounded-full animate-spin mr-2" />
                      Refreshing...
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-4 h-4 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        />
                      </svg>
                      Refresh Dashboard
                    </>
                  )}
                </Button>
              )}
            </div>
            <div className="flex-1 flex justify-center">
              {showAdminButton && <AdminLink />}
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={handleSignOut}
                variant="outline"
                className="border-brand-sky-blue/30 text-white hover:bg-brand-sky-blue/10 hover:text-brand-sky-blue-light"
              >
                Sign Out
              </Button>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-12">
          <div className="max-w-6xl mx-auto space-y-8">
            {/* Affiliate Status & Link (Supabase) */}
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg font-semibold text-brand-sky-blue">
                  Affiliate Status:
                </span>
                {isAffiliate ? (
                  <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                    Active
                  </Badge>
                ) : (
                  <Badge className="bg-gray-500/20 text-gray-300 border-gray-500/30">
                    Not Active
                  </Badge>
                )}
              </div>
              {isAffiliate && affiliateLink && (
                <div className="flex flex-col md:flex-row items-center gap-2">
                  <Input
                    value={affiliateLink}
                    readOnly
                    className="bg-brand-midnight/50 border-brand-sky-blue/30 text-white w-full md:w-2/3"
                    onFocus={(e) => e.target.select()}
                  />
                  <Button
                    variant="outline"
                    onClick={handleCopyReferralLink}
                    className="border-brand-sky-blue/30 text-white hover:bg-brand-sky-blue/10 hover:text-brand-sky-blue-light"
                  >
                    {copied ? 'Copied!' : 'Copy Link'}
                  </Button>
                </div>
              )}
              <div className="mt-4">{showAdminButton && <AdminLink />}</div>
            </div>
            <div className="text-center space-y-4">
              <h2 className="text-4xl font-bold text-white">
                {firstName
                  ? `Welcome back, ${firstName}!`
                  : 'Welcome to Your Dashboard'}
              </h2>
              <p className="text-xl text-gray-400">
                Your credit-building journey starts here
              </p>
            </div>

            {/* Responsive two-column grid for main dashboard cards */}
            <div className="grid gap-6 md:grid-cols-2">
              {/* Left column: Active Accounts + Booster Accounts */}
              <div className="flex flex-col gap-6">
                <Card className="border-brand-sky-blue/20 bg-brand-charcoal/50 backdrop-blur-xl shadow-xl shadow-brand-sky-blue/5">
                  <CardHeader>
                    <CardTitle className="text-white">
                      Active Accounts
                    </CardTitle>
                    <CardDescription className="text-gray-400">
                      Active Booster Accounts
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8">
                      <div className="text-5xl font-bold text-white">
                        {boosterAccounts.length}
                      </div>
                      <p className="text-sm text-gray-500 mt-2">
                        {boosterAccounts.length === 0
                          ? 'No accounts yet'
                          : `${boosterAccounts.length} booster ${boosterAccounts.length === 1 ? 'account' : 'accounts'}`}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {boosterAccounts.length > 0 && (
                  <Card className="border-brand-sky-blue/20 bg-brand-charcoal/50 backdrop-blur-xl shadow-xl shadow-brand-sky-blue/5">
                    <CardHeader>
                      <div>
                        <CardTitle className="text-white">
                          Your Booster Accounts
                        </CardTitle>
                        <CardDescription className="text-gray-400">
                          Click on any account to view details and manage
                        </CardDescription>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="grid grid-cols-12 gap-2 pb-2 border-b border-brand-sky-blue/20 text-xs font-semibold text-gray-400">
                          <div className="col-span-4 pl-2">Booster Plan</div>
                          <div className="col-span-3 text-right">
                            Monthly Amount
                          </div>
                          <div className="col-span-3 text-right">
                            Available Credit
                          </div>
                          <div className="col-span-2 text-right">
                            Utilization
                          </div>
                        </div>
                        {boosterAccounts.map((account) => (
                          <button
                            key={account.id}
                            onClick={() => handleAccountClick(account)}
                            className="w-full grid grid-cols-12 gap-2 py-4 px-3 rounded-lg bg-brand-midnight/30 hover:bg-brand-midnight/50 transition-all border border-brand-sky-blue/5 hover:border-brand-sky-blue/30 items-center cursor-pointer group"
                          >
                            {/* Plan name and status, stacked */}
                            <div className="col-span-4 flex flex-col items-start">
                              <div className="flex items-center gap-2">
                                <span className="text-white font-semibold text-base group-hover:text-brand-sky-blue transition-colors leading-tight">
                                  {account.planName}
                                </span>
                                {(() => {
                                  if (account.status === 'Active') {
                                    return (
                                      <Badge className="bg-green-500/20 text-green-300 border-green-500/30 text-xs px-2 py-0.5">
                                        Active
                                      </Badge>
                                    );
                                  }
                                  if (account.status === 'Pending') {
                                    return (
                                      <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-xs px-2 py-0.5">
                                        Pending Cancel
                                      </Badge>
                                    );
                                  }
                                  return (
                                    <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30 text-xs px-2 py-0.5">
                                      {account.status}
                                    </Badge>
                                  );
                                })()}
                              </div>
                              <span className="text-gray-500 text-xs mt-1">
                                Added:{' '}
                                {new Date(
                                  account.dateAdded
                                ).toLocaleDateString()}
                              </span>
                            </div>
                            {/* Monthly Amount */}
                            <div className="col-span-3 text-right">
                              <span className="text-white font-medium">
                                $
                                {Number.isFinite(account.monthlyAmount)
                                  ? account.monthlyAmount.toFixed(2)
                                  : '0.00'}
                                <span className="text-xs text-gray-400">
                                  /month
                                </span>
                              </span>
                            </div>
                            {/* Available Credit */}
                            <div className="col-span-3 text-right">
                              <span className="text-white font-medium">
                                $
                                {(() => {
                                  const val = account.availableCredit;
                                  const safe =
                                    typeof val === 'number' &&
                                    Number.isFinite(val)
                                      ? val
                                      : 0;
                                  return safe.toLocaleString(undefined, {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  });
                                })()}
                              </span>
                            </div>
                            {/* Utilization */}
                            <div className="col-span-2 text-right">
                              <span className="text-white font-medium">
                                {(() => {
                                  const val = account.utilizationPct;
                                  const safe =
                                    typeof val === 'number' &&
                                    Number.isFinite(val)
                                      ? val
                                      : 0;
                                  return `${safe.toFixed(1)}%`;
                                })()}
                              </span>
                            </div>
                          </button>
                        ))}
                        <div className="pt-4 mt-4 border-t border-brand-sky-blue/20">
                          <Button
                            onClick={handleAddAccount}
                            className="w-full bg-gradient-to-r from-brand-sky-blue to-brand-sky-blue-light hover:from-brand-sky-blue-light hover:to-brand-sky-blue text-white shadow-lg shadow-brand-sky-blue/30 transition-all duration-300 hover:scale-105"
                          >
                            Add Another Booster Account
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
              {/* Right column: Payment History + Upcoming Payments */}
              <div className="flex flex-col gap-6">
                <Card className="border-brand-sky-blue/20 bg-brand-charcoal/50 backdrop-blur-xl shadow-xl shadow-brand-sky-blue/5">
                  <CardHeader>
                    <CardTitle className="text-white">
                      Payment History
                    </CardTitle>
                    <CardDescription className="text-gray-400">
                      Your payment track record
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8">
                      <div className="text-5xl font-bold text-white">
                        {boosterAccounts.length === 0 ? '0%' : '100%'}
                      </div>
                      <p className="text-sm text-gray-500 mt-2">
                        {boosterAccounts.length === 0
                          ? 'No payment history yet'
                          : 'On-time payments'}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-brand-sky-blue/20 bg-brand-charcoal/50 backdrop-blur-xl shadow-xl shadow-brand-sky-blue/5">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-white flex items-center gap-2">
                          <Calendar className="h-5 w-5 text-brand-sky-blue" />
                          Upcoming Payments
                        </CardTitle>
                        <CardDescription className="text-gray-400">
                          Scheduled payments for your active plans
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {upcomingPayments.length === 0 ? (
                      <div className="text-center py-12">
                        <AlertCircle className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                        <p className="text-gray-400 text-lg mb-2">
                          No upcoming payments
                        </p>
                        {/* Removed verbiage: Add a Booster account to see your payment schedule */}
                        {/* Removed Add Another Account button from Upcoming Payments section */}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="grid grid-cols-3 gap-4 pb-2 border-b border-brand-sky-blue/20 text-sm font-medium text-gray-400">
                          <div>Booster Plan</div>
                          <div className="text-center">Due Date</div>
                          <div className="text-right">Total Due</div>
                        </div>
                        {/* Show next payment due for the first active account, if any */}
                        {upcomingPayments.length > 0 && (
                          <div className="mb-2 px-2 text-xs text-gray-400 flex items-center justify-between">
                            <span>
                              Next payment due for your active account:
                            </span>
                            <span className="text-brand-sky-blue font-semibold">
                              {(() => {
                                const next = upcomingPayments[0];
                                return `${next.planName} – $${next.amount.toFixed(2)} on ${new Date(next.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
                              })()}
                            </span>
                          </div>
                        )}

                        {upcomingPayments.map((payment) => (
                          <div
                            key={payment.id}
                            className="grid grid-cols-3 gap-4 py-3 px-3 rounded-lg bg-brand-midnight/30 hover:bg-brand-midnight/50 transition-colors border border-brand-sky-blue/5 hover:border-brand-sky-blue/20"
                          >
                            <div className="flex items-center">
                              <span className="text-white font-medium">
                                {payment.planName}
                              </span>
                            </div>
                            <div className="flex items-center justify-center">
                              <span className="text-gray-300 text-sm">
                                {new Date(payment.dueDate).toLocaleDateString(
                                  'en-US',
                                  {
                                    month: '2-digit',
                                    day: '2-digit',
                                    year: 'numeric',
                                  }
                                )}
                              </span>
                            </div>
                            <div className="flex items-center justify-end">
                              <span className="text-brand-sky-blue font-semibold">
                                ${payment.amount.toFixed(2)}
                              </span>
                            </div>
                          </div>
                        ))}

                        <div className="pt-3 mt-2 border-t border-brand-sky-blue/20">
                          <div className="flex items-center justify-between px-3 py-2">
                            <div className="flex items-center gap-2">
                              <DollarSign className="h-5 w-5 text-brand-sky-blue" />
                              <span className="text-white font-semibold text-lg">
                                Total Upcoming Payments:
                              </span>
                            </div>
                            <span className="text-2xl font-bold bg-gradient-to-r from-brand-sky-blue to-brand-sky-blue-light bg-clip-text text-transparent">
                              $
                              {upcomingPayments
                                .reduce((sum, p) => sum + p.amount, 0)
                                .toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>

            <Card className="border-brand-sky-blue/20 bg-brand-charcoal/50 backdrop-blur-xl shadow-xl shadow-brand-sky-blue/5">
              <CardHeader>
                <CardTitle className="text-white">Quick Actions</CardTitle>
                {/* Removed CardDescription verbiage under Quick Actions */}
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-4 justify-between">
                  <Button
                    onClick={() => router.push('/settings')}
                    className="flex-1 w-full bg-gradient-to-r from-brand-sky-blue to-brand-sky-blue-light hover:from-brand-sky-blue-light hover:to-brand-sky-blue text-white shadow-lg shadow-brand-sky-blue/30 transition-all duration-300 hover:scale-105"
                  >
                    Account Settings
                  </Button>
                  <Button
                    onClick={() => router.push('/my-courses')}
                    className="flex-1 w-full bg-gradient-to-r from-brand-sky-blue to-brand-sky-blue-light hover:from-brand-sky-blue-light hover:to-brand-sky-blue text-white shadow-lg shadow-brand-sky-blue/30 transition-all duration-300 hover:scale-105"
                  >
                    View Course Material
                  </Button>
                  {!isAffiliate ? (
                    <Button
                      onClick={() => router.push('/become-affiliate')}
                      className="flex-1 w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg shadow-green-500/30 transition-all duration-300 hover:scale-105"
                    >
                      Become an Affiliate
                    </Button>
                  ) : (
                    <Button
                      onClick={() => router.push('/affiliate-dashboard')}
                      className="flex-1 w-full bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-brand-charcoal font-bold shadow-lg shadow-yellow-400/30 transition-all duration-300 hover:scale-105"
                    >
                      Go to Affiliate Dashboard
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="border-brand-sky-blue/20 bg-brand-charcoal/50 backdrop-blur-xl shadow-xl shadow-brand-sky-blue/5">
              <CardHeader>
                <CardTitle className="text-white">Recent Activity</CardTitle>
                <CardDescription className="text-gray-400">
                  Your latest credit-building activities
                </CardDescription>
              </CardHeader>
              <CardContent>
                {activities.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <p>No recent activity</p>
                    <p className="text-sm mt-2">
                      Start building your credit to see activity here
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {activities.slice(0, 5).map((a) => (
                      <div
                        key={a.id}
                        className="flex items-start justify-between py-3 px-3 rounded-lg bg-brand-midnight/30 border border-brand-sky-blue/5"
                      >
                        <div className="flex items-start gap-3">
                          {(() => {
                            const type = a.activity_type;
                            if (type === 'plan_added')
                              return (
                                <TrendingUp className="h-5 w-5 text-brand-sky-blue" />
                              );
                            if (type === 'plan_cancelled')
                              return (
                                <AlertCircle className="h-5 w-5 text-red-400" />
                              );
                            if (type === 'payment_made')
                              return (
                                <CreditCard className="h-5 w-5 text-green-400" />
                              );
                            if (type === 'payment_failed')
                              return (
                                <AlertCircle className="h-5 w-5 text-yellow-400" />
                              );
                            if (type === 'course_downloaded')
                              return (
                                <DownloadIcon className="h-5 w-5 text-brand-sky-blue" />
                              );
                            return (
                              <Calendar className="h-5 w-5 text-gray-400" />
                            );
                          })()}
                          <div>
                            <p className="text-white text-sm">
                              {a.description}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(a.created_at).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>

        {/* Account Detail Modal */}
        <Dialog open={isAccountModalOpen} onOpenChange={setIsAccountModalOpen}>
          <DialogContent className="bg-brand-charcoal border-brand-sky-blue/20 text-white max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-brand-sky-blue">
                Account Details
              </DialogTitle>
              <DialogDescription className="text-gray-400">
                Manage your booster account settings and view payment
                information
              </DialogDescription>
            </DialogHeader>

            {selectedAccount && (
              <div className="space-y-6 mt-4">
                {/* Account Overview */}
                <div className="bg-brand-midnight/50 rounded-lg p-6 border border-brand-sky-blue/10">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-2xl font-bold text-white">
                        {selectedAccount.planName}
                      </h3>
                      <p className="text-sm text-gray-400 mt-1">
                        Account ID: {selectedAccount.id.slice(0, 8)}...
                      </p>
                    </div>
                    <Badge
                      className={
                        selectedAccount.status === 'Active'
                          ? 'bg-green-500/20 text-green-300 border-green-500/30'
                          : 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
                      }
                    >
                      {selectedAccount.status}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-6">
                    <div className="bg-brand-midnight/30 rounded-lg p-4 border border-brand-sky-blue/5">
                      <div className="flex items-center gap-2 mb-2">
                        <DollarSign className="h-4 w-4 text-brand-sky-blue" />
                        <span className="text-sm text-gray-400">
                          Monthly Payment
                        </span>
                      </div>
                      <p className="text-2xl font-bold text-white">
                        ${selectedAccount.monthlyAmount}
                      </p>
                    </div>

                    <div className="bg-brand-midnight/30 rounded-lg p-4 border border-brand-sky-blue/5">
                      <div className="flex items-center gap-2 mb-2">
                        <CreditCard className="h-4 w-4 text-brand-sky-blue" />
                        <span className="text-sm text-gray-400">
                          Credit Limit
                        </span>
                      </div>
                      <p className="text-2xl font-bold text-white">
                        ${(selectedAccount.creditLimit || 0).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-brand-sky-blue/10">
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <Calendar className="h-4 w-4" />
                      <span>
                        Account created:{' '}
                        {new Date(
                          selectedAccount.dateAdded
                        ).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Payment Information */}
                <div className="bg-brand-midnight/50 rounded-lg p-6 border border-brand-sky-blue/10">
                  <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-brand-sky-blue" />
                    Payment Schedule
                  </h4>

                  {/* First vs Next Scheduled Payment */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    {(() => {
                      const creditLimit = Number(
                        selectedAccount.creditLimit || 0
                      );
                      const rate = getPlanUtilizationRate(
                        selectedAccount.planName
                      );
                      const trueLimit = getTrueLimit(creditLimit, rate);
                      const { first, regular } = getFirstAndRegular(trueLimit);
                      return (
                        <>
                          <div className="bg-brand-midnight/30 rounded-lg p-4 border border-brand-sky-blue/5">
                            <div className="text-sm text-gray-400 mb-1">
                              First Payment
                            </div>
                            <div className="text-2xl font-bold text-white">
                              ${first.toFixed(2)}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              Higher first month to handle cents
                            </div>
                          </div>
                          <div className="bg-brand-midnight/30 rounded-lg p-4 border border-brand-sky-blue/5">
                            <div className="text-sm text-gray-400 mb-1">
                              Next Monthly Amount
                            </div>
                            <div className="text-2xl font-bold text-white">
                              ${regular.toFixed(2)}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              Typical payment each following month
                            </div>
                          </div>
                        </>
                      );
                    })()}
                  </div>

                  <div className="space-y-3">
                    {upcomingPayments
                      .filter((p) => p.accountId === selectedAccount.id)
                      .slice(0, 3)
                      .map((payment) => (
                        <div
                          key={payment.id}
                          className="flex items-center justify-between py-2 px-3 rounded bg-brand-midnight/30 border border-brand-sky-blue/5"
                        >
                          <span className="text-sm text-gray-300">
                            {new Date(payment.dueDate).toLocaleDateString(
                              'en-US',
                              {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              }
                            )}
                          </span>
                          <span className="text-sm font-medium text-brand-sky-blue">
                            ${payment.amount.toFixed(2)}
                          </span>
                        </div>
                      ))}

                    {upcomingPayments.filter(
                      (p) => p.accountId === selectedAccount.id
                    ).length === 0 && (
                      <p className="text-sm text-gray-500 text-center py-4">
                        No upcoming payments scheduled
                      </p>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  {selectedAccount.status === 'Active' && (
                    <Button
                      onClick={() => {
                        handleCloseAccountModal();
                        router.push('/payment');
                      }}
                      className="flex-1 bg-gradient-to-r from-brand-sky-blue to-brand-sky-blue-light hover:from-brand-sky-blue-light hover:to-brand-sky-blue text-white"
                    >
                      Make Payment
                    </Button>
                  )}
                  <Button
                    onClick={() => handleCancelAccount(selectedAccount.id)}
                    variant="outline"
                    className={`${selectedAccount.status === 'Active' ? 'flex-1' : 'w-full'} border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500/50`}
                  >
                    Cancel Account
                  </Button>
                </div>

                <Button
                  onClick={handleCloseAccountModal}
                  variant="ghost"
                  className="w-full text-gray-400 hover:text-white"
                >
                  Close
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Cancel Account Confirmation Dialog */}
        <AlertDialog
          open={isCancelConfirmOpen}
          onOpenChange={setIsCancelConfirmOpen}
        >
          <AlertDialogContent className="bg-brand-charcoal border-brand-sky-blue/20 text-white">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-2xl font-bold text-red-400 flex items-center gap-2">
                <AlertCircle className="h-6 w-6" />
                Cancel Booster Account
              </AlertDialogTitle>
              <AlertDialogDescription className="text-gray-300 space-y-3 pt-2">
                <p className="font-semibold text-lg">
                  You are about to cancel your Booster Account.
                </p>
                <div className="bg-brand-midnight/50 rounded-lg p-4 border border-red-500/20 space-y-2">
                  <p className="text-sm">⚠️ This action will:</p>
                  <ul className="list-disc list-inside space-y-1 text-sm text-gray-400 ml-2">
                    <li>Stop all future payments for this account</li>
                    <li>Pause credit reporting for this tradeline</li>
                    <li>Remove this account from your active plans</li>
                    <li>This action cannot be undone</li>
                  </ul>
                </div>
                <p className="text-sm text-gray-400 pt-2">
                  Are you sure you want to proceed with the cancellation?
                </p>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex gap-3 pt-4">
              <AlertDialogCancel
                onClick={() => {
                  setIsCancelConfirmOpen(false);
                  setAccountToCancel(null);
                }}
                className="bg-brand-midnight border-brand-sky-blue/30 text-white hover:bg-brand-midnight/80"
              >
                Keep My Account
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmCancelAccount}
                className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white"
              >
                Confirm Cancellation
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
