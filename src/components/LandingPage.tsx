// Patch: Extend Window interface to allow window.supabase
declare global {
  interface Window {
    supabase: typeof supabase;
  }
}
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { StarField } from '@/components/StarField';
import Link from 'next/link';
import Image from 'next/image';
import {
  TrendingUp,
  Shield,
  Zap,
  ArrowRight,
  Sparkles,
  Target,
  Award,
  Users,
  CheckCircle,
  CreditCard,
  Lock,
  DollarSign,
  BarChart3,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

if (typeof window !== 'undefined') {
  // Expose supabase for browser console debugging
  window.supabase = supabase;
}

export function LandingPage() {
  const router = useRouter();
  const [referralCode, setReferralCode] = useState<string | null>(null);

  // Unified handler for main CTAs (except affiliate)
  const handleUnifiedSignup = async () => {
    let isAdminUser = false;
    try {
      const adminModule = await import('@/services/adminService');
      isAdminUser = await adminModule.isAdmin();
    } catch {}
    let refCode = referralCode;
    if (!refCode && typeof window !== 'undefined') {
      refCode = localStorage.getItem('pendingReferralCode') || undefined;
    }
    const signupHref = refCode
      ? `/signup?ref=${encodeURIComponent(refCode)}`
      : '/signup';
    if (isAdminUser) {
      router.push('/admin/admin-emails');
      return;
    }
    router.push(signupHref);
  };
  // ...existing code...
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const ref = params.get('ref');
      if (ref) setReferralCode(ref);
    }
  }, [router.query]);

  const signupHref = referralCode
    ? `/signup?ref=${encodeURIComponent(referralCode)}`
    : '/signup';

  const boosterPlans = [
    {
      name: 'Starter Boost',
      price: '$25',
      limit: '$3,000',
      features: ['Credit Tracking', 'Email Support'],
    },
    {
      name: 'Power Boost',
      price: '$50',
      limit: '$6,000',
      features: ['Credit Tracking', 'Priority Support'],
    },
    {
      name: 'Max Boost',
      price: '$70',
      limit: '$10,000',
      features: ['Credit Tracking', '24/7 Support'],
    },
    {
      name: 'Blaster Boost',
      price: '$90',
      limit: '$15,000',
      features: [
        'Multi-Bureau Reporting',
        'Premium Tracking',
        'Dedicated Support',
      ],
    },
    {
      name: 'Super Boost',
      price: '$125',
      limit: '$25,000',
      features: ['Credit Tracking', 'VIP Support'],
    },
    {
      name: 'Star Boost',
      price: '$150',
      limit: '$30,000',
      features: ['Credit Tracking', 'Concierge Service'],
    },
  ];

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-brand-midnight via-brand-charcoal to-brand-midnight">
      <StarField />

      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-brand-sky-blue/20 via-transparent to-transparent opacity-60" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-brand-sky-blue-light/10 via-transparent to-transparent opacity-40" />

      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-brand-sky-blue/5 rounded-full blur-3xl animate-pulse-slow" />
      <div
        className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-brand-sky-blue-light/5 rounded-full blur-3xl animate-pulse-slow"
        style={{ animationDelay: '1.5s' }}
      />

      <style jsx>{`
        @keyframes float {
          0%,
          100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-20px) rotate(3deg);
          }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
      `}</style>

      <div className="relative z-10">
        <nav className="w-full py-1 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto flex justify-between items-center mb-[-1.5rem] sm:mb-[-2.5rem] lg:mb-[-3.5rem]">
            <Link
              href="/"
              className="flex items-center transition-transform hover:scale-105 duration-300"
            >
              <Image
                src="/Take_off_FullLogo_Transparent_1_.png"
                alt="Take Off Credit Builder"
                width={1400}
                height={1400}
                className="!h-[240px] sm:!h-[280px] lg:!h-[320px] w-auto object-contain"
                priority
              />
            </Link>
          </div>
        </nav>

        <main className="px-4 sm:px-6 lg:px-8">
          <section className="max-w-7xl mx-auto pt-0 pb-20">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <div className="space-y-3">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-sky-blue/10 border border-brand-sky-blue/20 backdrop-blur-sm mb-6">
                    <span className="flex flex-col w-full">
                      <span className="block w-full text-center text-xs sm:text-sm font-semibold text-brand-white mb-1">
                        Welcome to the Smart Credit Building Platform
                      </span>
                      {referralCode && (
                        <>
                          <span className="block w-full text-center text-xs sm:text-sm font-semibold text-brand-sky-blue mb-0.5">
                            <span role="img" aria-label="party">
                              🎉
                            </span>{' '}
                            You were invited by a Take Off Credit affiliate!
                          </span>
                          <span className="block w-full text-center text-xs sm:text-sm font-medium text-brand-white">
                            <Sparkles className="inline w-4 h-4 text-brand-sky-blue align-middle mr-1" />
                            Your signup will help them earn rewards.
                          </span>
                        </>
                      )}
                    </span>
                  </div>

                  <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6">
                    <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-brand-white leading-tight tracking-tight flex-1">
                      Take Your Credit
                      <span className="block mt-2 bg-gradient-to-r from-brand-sky-blue via-brand-sky-blue-light to-brand-sky-blue bg-clip-text text-transparent animate-gradient">
                        to the Moon with Take Off
                      </span>
                    </h1>

                    <div className="lg:hidden w-48 h-48 relative animate-float">
                      <Image
                        src="/my_rocket.PNG"
                        alt="Astronaut riding rocket to the moon"
                        width={192}
                        height={192}
                        className="object-contain drop-shadow-2xl"
                        priority
                      />
                    </div>
                  </div>

                  <p className="text-xl text-brand-white/70 leading-relaxed max-w-lg">
                    Your journey to financial independence starts here. <br />{' '}
                    Build credit intelligently with personalized strategies.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-n4">
                  <Link href={signupHref} className="group">
                    <Button
                      size="lg"
                      className="w-full sm:w-auto h-14 px-8 text-lg font-semibold bg-gradient-to-r from-brand-sky-blue to-brand-sky-blue-light hover:from-brand-sky-blue-light hover:to-brand-sky-blue text-white shadow-2xl shadow-brand-sky-blue/40 hover:shadow-brand-sky-blue/60 transition-all duration-300 hover:scale-105 hover:-translate-y-1"
                    >
                      Start Building Credit
                      <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                  <Link href="/signin">
                    <Button
                      size="lg"
                      variant="outline"
                      className="w-full sm:w-auto h-14 px-8 text-lg font-semibold border-2 border-brand-sky-blue/30 text-brand-white hover:bg-brand-sky-blue/10 hover:border-brand-sky-blue backdrop-blur-sm transition-all duration-300"
                    >
                      Sign In
                    </Button>
                  </Link>
                </div>

                <div className="flex flex-wrap gap-6 pt-4">
                  <div className="flex items-center gap-2 text-brand-white/60">
                    <div className="w-8 h-8 rounded-lg bg-brand-sky-blue/10 flex items-center justify-center">
                      <Shield className="w-4 h-4 text-brand-sky-blue" />
                    </div>
                    <span className="text-sm font-medium">
                      Bank-Level Security
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-brand-white/60">
                    <div className="w-8 h-8 rounded-lg bg-brand-sky-blue/10 flex items-center justify-center">
                      <Zap className="w-4 h-4 text-brand-sky-blue" />
                    </div>
                    <span className="text-sm font-medium">Instant Reports</span>
                  </div>
                  <div className="flex items-center gap-2 text-brand-white/60">
                    <div className="w-8 h-8 rounded-lg bg-brand-sky-blue/10 flex items-center justify-center">
                      <TrendingUp className="w-4 h-4 text-brand-sky-blue" />
                    </div>
                    <span className="text-sm font-medium">
                      Credit Score Growth
                    </span>
                  </div>
                </div>
              </div>

              <div className="hidden lg:block relative">
                <div className="absolute inset-0 bg-gradient-to-r from-brand-sky-blue/20 to-brand-sky-blue-light/20 rounded-full blur-3xl animate-pulse-slow" />
                <div className="relative w-full max-w-lg mx-auto animate-float">
                  <Image
                    src="/my_rocket.PNG"
                    alt="Astronaut riding rocket to the moon"
                    width={500}
                    height={500}
                    className="object-contain drop-shadow-2xl"
                    priority
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="max-w-7xl mx-auto py-20">
            <div className="text-center mb-16 space-y-4">
              <div className="inline-flex items-center gap-2 text-4xl sm:text-5xl font-bold text-brand-white">
                <span className="text-brand-sky-blue">🚀</span>
                The Credit Builder That Outperforms the Rest
              </div>
              <p className="text-xl text-brand-white/70 max-w-3xl mx-auto">
                We don't just help you build credit — we help you build{' '}
                <span className="text-brand-sky-blue font-semibold italic">
                  strong credit
                </span>
                . With Take Off, you get access to the industry's highest
                limits, more tradelines, and faster results — all backed by real
                TransUnion reporting.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <Card className="bg-brand-charcoal/50 backdrop-blur-sm border-brand-sky-blue/20 hover:border-brand-sky-blue/40 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-brand-sky-blue/20">
                <CardContent className="p-8 space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-sky-blue to-brand-sky-blue-light flex items-center justify-center">
                    <TrendingUp className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-brand-white">
                    Higher Limits
                  </h3>
                  <p className="text-brand-white/70 leading-relaxed">
                    Build credit with more buying power and lower utilization.
                  </p>
                  <div className="flex items-center gap-2 text-brand-sky-blue font-semibold">
                    <CheckCircle className="w-5 h-5" />
                    Industry-leading limits up to $20,000
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-brand-charcoal/50 backdrop-blur-sm border-brand-sky-blue/20 hover:border-brand-sky-blue/40 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-brand-sky-blue/20">
                <CardContent className="p-8 space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-sky-blue to-brand-sky-blue-light flex items-center justify-center">
                    <CreditCard className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-brand-white">
                    More Tradelines
                  </h3>
                  <p className="text-brand-white/70 leading-relaxed">
                    Add multiple Booster Accounts to multiply your credit power.
                  </p>
                  <div className="flex items-center gap-2 text-brand-sky-blue font-semibold">
                    <CheckCircle className="w-5 h-5" />
                    Reported monthly to TransUnion
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-brand-charcoal/50 backdrop-blur-sm border-brand-sky-blue/20 hover:border-brand-sky-blue/40 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-brand-sky-blue/20">
                <CardContent className="p-8 space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-sky-blue to-brand-sky-blue-light flex items-center justify-center">
                    <Zap className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-brand-white">
                    Faster Results
                  </h3>
                  <p className="text-brand-white/70 leading-relaxed">
                    See measurable improvement every 30 days.
                  </p>
                  <div className="flex items-center gap-2 text-brand-sky-blue font-semibold">
                    <CheckCircle className="w-5 h-5" />
                    Credit tracking built into your dashboard
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          <section className="max-w-7xl mx-auto py-20">
            <div className="text-center mb-16 space-y-4">
              <div className="inline-flex items-center gap-2 text-4xl sm:text-5xl font-bold text-brand-white">
                <span className="text-brand-sky-blue">📈</span>
                Simple Steps to Stronger Credit
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-brand-sky-blue/20 to-brand-sky-blue-light/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300" />
                <Card className="relative bg-brand-charcoal/70 backdrop-blur-sm border-brand-sky-blue/30 hover:border-brand-sky-blue/50 transition-all duration-300">
                  <CardContent className="p-8 space-y-4 text-center">
                    <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-brand-sky-blue to-brand-sky-blue-light flex items-center justify-center text-3xl font-bold text-white shadow-lg shadow-brand-sky-blue/50">
                      1
                    </div>
                    <h3 className="text-2xl font-bold text-brand-white">
                      Choose Your Plan
                    </h3>
                    <p className="text-brand-white/70 leading-relaxed">
                      Pick from 6 powerful Booster Plans — designed for every
                      credit level.
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-brand-sky-blue/20 to-brand-sky-blue-light/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300" />
                <Card className="relative bg-brand-charcoal/70 backdrop-blur-sm border-brand-sky-blue/30 hover:border-brand-sky-blue/50 transition-all duration-300">
                  <CardContent className="p-8 space-y-4 text-center">
                    <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-brand-sky-blue to-brand-sky-blue-light flex items-center justify-center text-3xl font-bold text-white shadow-lg shadow-brand-sky-blue/50">
                      2
                    </div>
                    <h3 className="text-2xl font-bold text-brand-white">
                      Set Up & Verify
                    </h3>
                    <p className="text-brand-white/70 leading-relaxed">
                      Complete your quick setup with secure payment info.
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-brand-sky-blue/20 to-brand-sky-blue-light/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300" />
                <Card className="relative bg-brand-charcoal/70 backdrop-blur-sm border-brand-sky-blue/30 hover:border-brand-sky-blue/50 transition-all duration-300">
                  <CardContent className="p-8 space-y-4 text-center">
                    <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-brand-sky-blue to-brand-sky-blue-light flex items-center justify-center text-3xl font-bold text-white shadow-lg shadow-brand-sky-blue/50">
                      3
                    </div>
                    <h3 className="text-2xl font-bold text-brand-white">
                      Watch Your Credit Take Off
                    </h3>
                    <p className="text-brand-white/70 leading-relaxed">
                      We report your Booster Account to TransUnion every 30
                      days.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="text-center mt-12">
              <Button
                size="lg"
                className="h-14 px-10 text-lg font-semibold bg-gradient-to-r from-brand-sky-blue to-brand-sky-blue-light hover:from-brand-sky-blue-light hover:to-brand-sky-blue text-white shadow-2xl shadow-brand-sky-blue/40 hover:shadow-brand-sky-blue/60 transition-all duration-300 hover:scale-105"
                onClick={handleUnifiedSignup}
              >
                Get Started Now
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </section>

          <section
            id="flexible-booster-plans-section"
            className="max-w-7xl mx-auto py-20"
          >
            <div className="text-center mb-16 space-y-4">
              <div className="inline-flex items-center gap-2 text-4xl sm:text-5xl font-bold text-brand-white">
                <span className="text-brand-sky-blue">💳</span>
                Flexible Booster Plans Built for You
              </div>
              <p className="text-xl text-brand-white/70 max-w-3xl mx-auto">
                No matter where you're starting, Take Off Credit has a plan to
                match your goals — from first-time builders to serious credit
                optimizers.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {boosterPlans.map((plan, index) => (
                <Card
                  key={index}
                  className="bg-brand-charcoal/50 backdrop-blur-sm border-brand-sky-blue/20 hover:border-brand-sky-blue/50 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-brand-sky-blue/30"
                >
                  <CardContent className="p-6 space-y-4">
                    <div className="space-y-2">
                      <h3 className="text-2xl font-bold text-brand-white">
                        {plan.name}
                      </h3>
                      <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-bold text-brand-sky-blue">
                          {plan.price}
                        </span>
                        <span className="text-brand-white/60">/month</span>
                      </div>
                      <p className="text-brand-sky-blue-light font-semibold text-lg">
                        {plan.limit} Credit Limit
                      </p>
                    </div>

                    <div className="space-y-2 pt-4 border-t border-brand-sky-blue/20">
                      {plan.features.map((feature, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-2 text-brand-white/70"
                        >
                          <CheckCircle className="w-4 h-4 text-brand-sky-blue flex-shrink-0" />
                          <span className="text-sm">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="text-center mt-12"></div>
          </section>

          <section
            id="booster-plans-section"
            className="max-w-7xl mx-auto py-20"
          >
            <div className="text-center mb-16 space-y-4">
              <div className="inline-flex items-center gap-2 text-4xl sm:text-5xl font-bold text-brand-white">
                <span className="text-brand-sky-blue">⭐</span>
                Real Members. Real Growth.
              </div>
              <p className="text-xl text-brand-white/70 max-w-3xl mx-auto">
                Thousands of users trust Take Off Credit to help improve their
                credit scores faster than any other platform.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mb-12">
              <Card className="bg-brand-charcoal/50 backdrop-blur-sm border-brand-sky-blue/20">
                <CardContent className="p-8 space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-sky-blue to-brand-sky-blue-light flex items-center justify-center text-white font-bold text-lg">
                      M
                    </div>
                    <div>
                      <p className="text-brand-white font-semibold">
                        Michael R.
                      </p>
                      <p className="text-brand-white/60 text-sm">
                        Member since 2024
                      </p>
                    </div>
                  </div>
                  <p className="text-brand-white/80 leading-relaxed italic">
                    "Take Off helped me increase my credit score by 65 points in
                    just 3 months. The dashboard makes tracking progress so
                    easy!"
                  </p>
                  <div className="flex items-center gap-2 text-brand-sky-blue font-semibold">
                    <TrendingUp className="w-5 h-5" />
                    +65 points in 90 days
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-brand-charcoal/50 backdrop-blur-sm border-brand-sky-blue/20">
                <CardContent className="p-8 space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-sky-blue to-brand-sky-blue-light flex items-center justify-center text-white font-bold text-lg">
                      S
                    </div>
                    <div>
                      <p className="text-brand-white font-semibold">Sarah K.</p>
                      <p className="text-brand-white/60 text-sm">
                        Member since 2024
                      </p>
                    </div>
                  </div>
                  <p className="text-brand-white/80 leading-relaxed italic">
                    "I've tried other credit builders, but Take Off's higher
                    limits and multiple tradelines make a real difference.
                    Highly recommend!"
                  </p>
                  <div className="flex items-center gap-2 text-brand-sky-blue font-semibold">
                    <Award className="w-5 h-5" />
                    5-star experience
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="text-center">
              <Card className="inline-block bg-brand-charcoal/50 backdrop-blur-sm border-brand-sky-blue/20">
                <CardContent className="p-8">
                  <div className="text-5xl font-bold text-brand-white mb-2">
                    +42
                  </div>
                  <p className="text-brand-white/80 text-lg">
                    Average score improvement in 90 days
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="text-center mt-12">
              <Button
                size="lg"
                className="h-14 px-10 text-lg font-semibold bg-gradient-to-r from-brand-sky-blue to-brand-sky-blue-light hover:from-brand-sky-blue-light hover:to-brand-sky-blue text-white shadow-2xl shadow-brand-sky-blue/40 hover:shadow-brand-sky-blue/60 transition-all duration-300 hover:scale-105"
                onClick={handleUnifiedSignup}
              >
                Join Now – Start Building Credit Today
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </section>

          <section className="max-w-7xl mx-auto py-20">
            <div className="text-center mb-16 space-y-4">
              <div className="inline-flex items-center gap-2 text-4xl sm:text-5xl font-bold text-brand-white">
                <span className="text-brand-sky-blue">💰</span>
                Earn by Helping Others Take Off
              </div>
              <p className="text-xl text-brand-white/70 max-w-3xl mx-auto">
                Join our Affiliate Program and earn{' '}
                <span className="text-brand-sky-blue font-bold">
                  $10 per signup
                </span>{' '}
                when you share Take Off Credit with your audience.
              </p>
              <div className="grid md:grid-cols-3 gap-8 mb-12">
                <Card className="bg-brand-charcoal/50 backdrop-blur-sm border-brand-sky-blue/20 hover:border-brand-sky-blue/40 transition-all duration-300">
                  <CardContent className="p-8 space-y-4 text-center">
                    <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-brand-sky-blue to-brand-sky-blue-light flex items-center justify-center">
                      <DollarSign className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-brand-white">
                      Instant affiliate link generation
                    </h3>
                  </CardContent>
                </Card>
                <Card className="bg-brand-charcoal/50 backdrop-blur-sm border-brand-sky-blue/20 hover:border-brand-sky-blue/40 transition-all duration-300">
                  <CardContent className="p-8 space-y-4 text-center">
                    <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-brand-sky-blue to-brand-sky-blue-light flex items-center justify-center">
                      <BarChart3 className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-brand-white">
                      Real-time earnings tracking
                    </h3>
                  </CardContent>
                </Card>
                <Card className="bg-brand-charcoal/50 backdrop-blur-sm border-brand-sky-blue/20 hover:border-brand-sky-blue/40 transition-all duration-300">
                  <CardContent className="p-8 space-y-4 text-center">
                    <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-brand-sky-blue to-brand-sky-blue-light flex items-center justify-center">
                      <Target className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-brand-white">
                      Payout dashboard
                    </h3>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Button moved outside .mb-16 for consistent spacing */}
            <div className="flex justify-center mt-8 mb-0">
              <button
                type="button"
                className="h-14 px-10 text-lg font-semibold bg-gradient-to-r from-brand-sky-blue to-brand-sky-blue-light text-white shadow-2xl shadow-brand-sky-blue/40 hover:shadow-brand-sky-blue/60 transition-all duration-300 hover:scale-105 group rounded-lg flex items-center justify-center"
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    window.location.href = '/affiliate-explainer';
                  }
                }}
              >
                Become an Affiliate
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </section>

          <section className="max-w-7xl mx-auto py-20">
            <div className="text-center mb-16 space-y-4">
              <div className="inline-flex items-center gap-2 text-4xl sm:text-5xl font-bold text-brand-white">
                <span className="text-brand-sky-blue">🔒</span>
                Your Data. Your Privacy. Always Protected.
              </div>
              <p className="text-xl text-brand-white/70 max-w-3xl mx-auto">
                We use industry-leading encryption and fraud protection
                technology to keep your information safe — always.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <Card className="bg-brand-charcoal/50 backdrop-blur-sm border-brand-sky-blue/20 hover:border-brand-sky-blue/40 transition-all duration-300">
                <CardContent className="p-8 space-y-4 text-center">
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-brand-sky-blue to-brand-sky-blue-light flex items-center justify-center">
                    <Lock className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex items-center justify-center gap-2 text-brand-sky-blue font-semibold">
                    <CheckCircle className="w-5 h-5" />
                    <span>Bank-level data encryption</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-brand-charcoal/50 backdrop-blur-sm border-brand-sky-blue/20 hover:border-brand-sky-blue/40 transition-all duration-300">
                <CardContent className="p-8 space-y-4 text-center">
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-brand-sky-blue to-brand-sky-blue-light flex items-center justify-center">
                    <Shield className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex items-center justify-center gap-2 text-brand-sky-blue font-semibold">
                    <CheckCircle className="w-5 h-5" />
                    <span>Identity monitoring options</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-brand-charcoal/50 backdrop-blur-sm border-brand-sky-blue/20 hover:border-brand-sky-blue/40 transition-all duration-300">
                <CardContent className="p-8 space-y-4 text-center">
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-brand-sky-blue to-brand-sky-blue-light flex items-center justify-center">
                    <Users className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex items-center justify-center gap-2 text-brand-sky-blue font-semibold">
                    <CheckCircle className="w-5 h-5" />
                    <span>Transparent data policies</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          <section className="max-w-7xl mx-auto py-20">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-brand-sky-blue/20 to-brand-sky-blue-light/20 rounded-3xl blur-2xl" />
              <Card className="relative bg-gradient-to-br from-brand-charcoal/80 to-brand-midnight/80 backdrop-blur-sm border-brand-sky-blue/30">
                <CardContent className="p-12 text-center space-y-8">
                  <h2 className="text-4xl sm:text-5xl font-bold text-brand-white">
                    Your Credit Journey Starts Here.
                  </h2>
                  <p className="text-xl text-brand-white/70 max-w-2xl mx-auto">
                    Join the credit revolution. Build faster. Go higher. Take
                    Off.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                    <Button
                      size="lg"
                      className="h-14 px-10 text-lg font-semibold bg-gradient-to-r from-brand-sky-blue to-brand-sky-blue-light hover:from-brand-sky-blue-light hover:to-brand-sky-blue text-white shadow-2xl shadow-brand-sky-blue/40 hover:shadow-brand-sky-blue/60 transition-all duration-300 hover:scale-105"
                      onClick={handleUnifiedSignup}
                    >
                      Start Building Now
                      <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </Button>

                    <Button
                      size="lg"
                      variant="outline"
                      className="h-14 px-10 text-lg font-semibold border-2 border-brand-sky-blue/30 text-brand-white hover:bg-brand-sky-blue/10 hover:border-brand-sky-blue backdrop-blur-sm transition-all duration-300"
                      onClick={() => {
                        const el = document.getElementById(
                          'flexible-booster-plans-section'
                        );
                        if (el) {
                          el.scrollIntoView({ behavior: 'smooth' });
                        }
                      }}
                    >
                      View Booster Plans
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          <footer className="max-w-7xl mx-auto py-12 border-t border-brand-sky-blue/20">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
              <div className="space-y-4">
                <h3 className="text-brand-white font-semibold text-lg">
                  Legal
                </h3>
                <div className="space-y-2">
                  <Link
                    href="/terms-of-service"
                    className="block text-brand-white/60 hover:text-brand-sky-blue transition-colors"
                  >
                    Terms & Conditions
                  </Link>
                  <Link
                    href="/privacy-policy"
                    className="block text-brand-white/60 hover:text-brand-sky-blue transition-colors"
                  >
                    Privacy Policy
                  </Link>
                  <Link
                    href="/consumer-disclosure"
                    className="block text-brand-white/60 hover:text-brand-sky-blue transition-colors"
                  >
                    Consumer Disclosure
                  </Link>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-brand-white font-semibold text-lg">
                  Support
                </h3>
                <div className="space-y-2">
                  <a
                    href="mailto:support@takeoffcredit.com"
                    className="block text-brand-white/60 hover:text-brand-sky-blue transition-colors"
                  >
                    Contact Support
                  </a>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-brand-white font-semibold text-lg">
                  Features
                </h3>
                <div className="space-y-2">
                  <Link
                    href="/affiliate"
                    className="block text-brand-white/60 hover:text-brand-sky-blue transition-colors"
                  >
                    Affiliate Login
                  </Link>
                  <Link
                    href="/credit-report"
                    className="block text-brand-white/60 hover:text-brand-sky-blue transition-colors"
                  >
                    Credit Reports
                  </Link>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-brand-white font-semibold text-lg">
                  Company
                </h3>
                <p className="text-brand-white/60 text-sm">
                  Take Off Credit Inc.
                  <br />
                  Building stronger credit futures
                </p>
              </div>
            </div>

            <div className="border-t border-brand-sky-blue/20 pt-8 text-center">
              <p className="text-brand-white/60 text-sm">
                © 2025 Take Off Credit Inc. All Rights Reserved.
              </p>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}
