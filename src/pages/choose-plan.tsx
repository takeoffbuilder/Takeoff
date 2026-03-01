import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StarField } from '@/components/StarField';
import { Check, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useMemo, useRef, useState } from 'react';
import { authService } from '@/services/authService';
import { isAdmin } from '@/services/adminService';
import { boosterAccountService } from '@/services/boosterAccountService';

interface PlanFeature {
  text: string;
  highlighted?: boolean;
}

interface Plan {
  id: string;
  title: string;
  subtitle: string;
  price: number;
  limit: number;
  features: PlanFeature[];
  popular?: boolean;
  premium?: boolean;
}

const plans: Plan[] = [
  {
    id: 'starter_boost',
    title: 'Starter Boost',
    subtitle: 'Perfect for credit building beginners',
    price: 25,
    limit: 3000,
    features: [
      { text: '$3000 Builder Account' },
      { text: 'Tri-bureau reporting' },
      { text: 'Email support' },
      { text: 'Financial education resources' },
    ],
  },
  {
    id: 'power_boost',
    title: 'Power Boost',
    subtitle: 'Most popular for faster credit growth',
    price: 50,
    limit: 6000,
    popular: true,
    features: [
      { text: '$6000 Builder Account' },
      { text: 'Tri-bureau reporting' },
      { text: 'Priority support' },
      { text: 'Advanced credit insights' },
      { text: 'Credit dispute assistance' },
    ],
  },
  {
    id: 'max_boost',
    title: 'Max Boost',
    subtitle: 'Maximum credit building power',
    price: 70,
    limit: 10000,
    features: [
      { text: '$10000 Builder Account' },
      { text: 'Tri-bureau reporting' },
      { text: 'Credit score monitoring' },
      { text: 'Advanced credit insights' },
      { text: 'Credit dispute assistance' },
    ],
  },
  {
    id: 'blaster_boost',
    title: 'Blaster Boost',
    subtitle: 'Accelerated credit building for serious users',
    price: 90,
    limit: 15000,
    features: [
      { text: '$15000 Builder Account' },
      { text: 'Tri-bureau reporting' },
      { text: 'Real-time credit monitoring' },
      { text: 'Advanced credit insights' },
      { text: 'Credit optimization tools' },
    ],
  },
  {
    id: 'super_boost',
    title: 'Super Boost',
    subtitle: 'Premium credit building experience',
    price: 125,
    limit: 25000,
    premium: true,
    features: [
      { text: '$25000 Builder Account' },
      { text: 'Tri-bureau reporting' },
      { text: '24/7 credit monitoring' },
      { text: 'Instant dispute resolution' },
      { text: 'Personal credit strategist' },
    ],
  },
  {
    id: 'star_boost',
    title: 'Star Boost',
    subtitle: 'Ultimate credit building solution',
    price: 150,
    limit: 30000,
    premium: true,
    features: [
      { text: '$30000 Builder Account' },
      { text: 'Tri-bureau reporting' },
      { text: 'Real-time alerts & monitoring' },
      { text: 'Comprehensive reporting suite' },
      { text: 'Executive credit consultant' },
    ],
  },
];

export default function ChoosePlanPage() {
  const router = useRouter();
  const referralAttached = useRef(false);
  const [user, setUser] = useState(null);
  // Redirect affiliate-only users away from this page
  useEffect(() => {
    const isAffiliate = router.query.affiliate === '1';
    if (isAffiliate) {
      router.replace('/affiliate-explainer');
    }
  }, [router]);
  const { toast } = useToast();
  const { mode } = router.query;
  const isAddingAccount = mode === 'add';
  const [ownedPlanSlugs, setOwnedPlanSlugs] = useState<string[]>([]);
  const [showAdminButton, setShowAdminButton] = useState(false);
  useEffect(() => {
    // Attach referral code if present in localStorage and user is loaded
    const attachReferral = async () => {
      try {
        const user = await authService.getCurrentUser();
        if (!user || referralAttached.current) return;
        const referralCode =
          localStorage.getItem('referralCode') ||
          localStorage.getItem('pendingReferralCode');
        if (referralCode) {
          console.log('Attaching referral', { userID: user.id, referralCode });
          await fetch('/api/referral/attach', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.id, referralCode }),
          });
          referralAttached.current = true;
        }
      } catch (e) {
        // Optionally handle error
        console.error('Failed to attach referral code', e);
      }
    };
    attachReferral();
  }, []);
  // Load user's existing active/pending plans to disable duplicates when adding another account
  useEffect(() => {
    const loadOwnedAndAdmin = async () => {
      try {
        const user = await authService.getCurrentUser();
        setUser(user);
        if (!user) return;
        // Check admin status
        const admin = await isAdmin(user.email);
        setShowAdminButton(admin);
        if (isAddingAccount) {
          const [active, pending] = await Promise.all([
            boosterAccountService.getUserAccountsByStatus(user.id, 'active'),
            boosterAccountService.getUserAccountsByStatus(user.id, 'pending'),
          ]);
          interface AccountWithPlanSlug {
            booster_plans?: { plan_slug?: string | null } | null;
          }
          const slugs = [
            ...(active as AccountWithPlanSlug[]),
            ...(pending as AccountWithPlanSlug[]),
          ]
            .map((acc) => acc.booster_plans?.plan_slug || undefined)
            .filter((s): s is string => Boolean(s));
          setOwnedPlanSlugs(Array.from(new Set(slugs)));
        }
      } catch (e) {
        console.error('Failed to load existing plans for disablement', e);
      }
    };
    loadOwnedAndAdmin();
  }, [isAddingAccount]);

  const ownedSet = useMemo(() => new Set(ownedPlanSlugs), [ownedPlanSlugs]);
  const isLoggedIn = !!user; // however you get the user object
  const isSubscriber = ownedPlanSlugs.length > 0; // or your actual logic for active plans

  const backHref = isLoggedIn ? (isSubscriber ? '/dashboard' : '/') : '/';

  const handleSelectPlan = (plan: Plan) => {
    if (ownedSet.has(plan.id)) {
      toast({
        title: 'Plan already active',
        description:
          'You already have this plan on your account. Please cancel the existing subscription first if you want to repurchase it.',
        variant: 'destructive',
      });
      return;
    }
    const accountData = {
      planId: plan.id,
      planName: plan.title,
      monthlyAmount: plan.price,
      creditLimit: plan.limit,
    };

    if (isAddingAccount) {
      // When adding another account, store in sessionStorage and go to payment
      sessionStorage.setItem('selectedPlan', JSON.stringify(accountData));
      toast({
        title: 'Proceed to Payment',
        description: `You are being redirected to complete payment for ${plan.title}.`,
      });
      // Use setTimeout to prevent double-clicks
      setTimeout(() => {
        router.push('/payment');
      }, 100);
    } else {
      // Initial signup flow - store in localStorage and go to personal info
      localStorage.setItem('selectedPlan', JSON.stringify(accountData));
      // Use setTimeout to prevent double-clicks
      setTimeout(() => {
        router.push('/personal-info');
      }, 100);
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-brand-midnight via-brand-charcoal to-brand-midnight">
      <StarField />

      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-brand-sky-blue/20 via-transparent to-transparent opacity-60" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-brand-sky-blue-light/10 via-transparent to-transparent opacity-40" />

      <div className="absolute top-20 left-10 w-96 h-96 bg-brand-sky-blue/5 rounded-full blur-3xl animate-pulse-slow" />
      <div
        className="absolute bottom-20 right-10 w-80 h-80 bg-brand-sky-blue-light/5 rounded-full blur-3xl animate-pulse-slow"
        style={{ animationDelay: '1s' }}
      />

      <div className="relative z-10">
        <nav className="w-full py-4 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            {user !== null ? (
              <Link href={backHref}>
                <Button
                  variant="ghost"
                  className="text-brand-white hover:text-brand-sky-blue hover:bg-brand-sky-blue/10 transition-all"
                >
                  ← Back
                </Button>
              </Link>
            ) : (
              <Button
                variant="ghost"
                className="text-brand-white opacity-50 cursor-not-allowed"
                disabled
              >
                ← Back
              </Button>
            )}
            {!isAddingAccount && (
              <Button
                variant="ghost"
                className="text-brand-white hover:text-brand-sky-blue hover:bg-brand-sky-blue/10 transition-all"
                onClick={async () => {
                  await authService.signOut();
                  router.push('/');
                }}
              >
                Sign Out
              </Button>
            )}
          </div>
        </nav>

        <main className="px-4 sm:px-6 lg:px-8 py-12">
          <div className="max-w-7xl mx-auto">
            <div className="text-center space-y-4 mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-sky-blue/10 border border-brand-sky-blue/20 backdrop-blur-sm">
                <Sparkles className="w-4 h-4 text-brand-sky-blue" />
                <span className="text-sm text-brand-white/80 font-medium">
                  {isAddingAccount
                    ? 'Add Another Booster Account'
                    : 'Flexible Plans for Every Goal'}
                </span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-brand-white leading-tight">
                {isAddingAccount ? 'Add Another Account' : 'Choose Your Plan'}
              </h1>

              <p className="text-lg text-brand-white/70 max-w-2xl mx-auto">
                {isAddingAccount
                  ? 'Select an additional credit-building plan to boost your credit even faster.'
                  : 'Select the credit-building plan that fits your goals.'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {plans.map((plan, index) => {
                const disabled = ownedSet.has(plan.id);
                return (
                  <Card
                    key={index}
                    className={`relative flex flex-col backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:-translate-y-2 ${
                      plan.popular
                        ? 'border-2 border-brand-sky-blue bg-brand-charcoal/80 shadow-2xl shadow-brand-sky-blue/30'
                        : plan.premium
                          ? 'border-2 border-brand-sky-blue-light bg-brand-charcoal/80 shadow-2xl shadow-brand-sky-blue-light/20'
                          : 'border border-brand-white/10 bg-brand-charcoal/60'
                    }`}
                  >
                    {plan.popular && (
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                        <Badge className="bg-gradient-to-r from-brand-sky-blue to-brand-sky-blue-light text-white border-0 px-4 py-1 shadow-lg">
                          Most Popular
                        </Badge>
                      </div>
                    )}

                    {plan.premium && (
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                        <Badge className="bg-gradient-to-r from-brand-sky-blue-light to-brand-sky-blue text-white border-0 px-4 py-1 shadow-lg">
                          Premium
                        </Badge>
                      </div>
                    )}

                    <CardHeader className="space-y-2 pb-4">
                      <CardTitle className="text-2xl font-bold text-brand-white">
                        {plan.title}
                      </CardTitle>
                      <CardDescription className="text-brand-white/60">
                        {plan.subtitle}
                      </CardDescription>
                      <div className="pt-2">
                        <span className="text-4xl font-bold text-brand-white">
                          ${plan.price}
                        </span>
                        <span className="text-brand-white/60 text-lg">
                          /month
                        </span>
                      </div>
                    </CardHeader>

                    <CardContent className="flex-1 space-y-3 pb-6">
                      <ul className="space-y-2.5">
                        {plan.features.map((feature, featureIndex) => (
                          <li
                            key={featureIndex}
                            className="flex items-start gap-2"
                          >
                            <Check
                              className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                                feature.highlighted
                                  ? 'text-brand-sky-blue-light'
                                  : 'text-brand-sky-blue'
                              }`}
                            />
                            <span
                              className={`text-sm leading-relaxed ${
                                feature.highlighted
                                  ? 'text-brand-white font-medium'
                                  : 'text-brand-white/80'
                              }`}
                            >
                              {feature.text}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>

                    <CardFooter className="pt-4">
                      <Button
                        onClick={() => handleSelectPlan(plan)}
                        disabled={disabled}
                        className={`w-full h-12 font-semibold transition-all duration-300 ${
                          disabled
                            ? 'bg-brand-white/10 text-brand-white/50 border border-brand-white/10 cursor-not-allowed'
                            : plan.popular || plan.premium
                              ? 'bg-gradient-to-r from-brand-sky-blue to-brand-sky-blue-light hover:from-brand-sky-blue-light hover:to-brand-sky-blue text-white shadow-xl shadow-brand-sky-blue/40 hover:shadow-brand-sky-blue/60'
                              : 'bg-brand-sky-blue/20 hover:bg-brand-sky-blue/30 text-brand-white border border-brand-sky-blue/30 hover:border-brand-sky-blue'
                        }`}
                      >
                        {disabled ? 'Already Active' : 'Select Plan'}
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>

            <div className="mt-12 text-center">
              <p className="text-brand-white/60 text-sm">
                All plans include a 30-day money-back guarantee. Cancel anytime.
              </p>
              {showAdminButton && (
                <Link href="/admin/admin-emails">
                  <Button className="mt-4 bg-gradient-to-r from-brand-sky-blue to-brand-sky-blue-light text-white">
                    Admin Dashboard
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </main>

        <footer className="w-full py-6 px-4 sm:px-6 lg:px-8 border-t border-brand-white/5 mt-12">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <p className="text-sm text-brand-white/40">
                © 2025 Take Off Credit. All Rights Reserved.
              </p>
              <div className="flex gap-6">
                <a
                  href="#"
                  className="text-sm text-brand-white/40 hover:text-brand-sky-blue transition-colors"
                >
                  Privacy
                </a>
                <a
                  href="#"
                  className="text-sm text-brand-white/40 hover:text-brand-sky-blue transition-colors"
                >
                  Terms
                </a>
                <a
                  href="#"
                  className="text-sm text-brand-white/40 hover:text-brand-sky-blue transition-colors"
                >
                  Contact
                </a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
