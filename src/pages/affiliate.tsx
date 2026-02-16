import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { StarField } from '@/components/StarField';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  CheckCircle2,
  DollarSign,
  Users,
  TrendingUp,
  Loader2,
  ArrowLeft,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface AffiliateData {
  userId: string;
  affiliateId: string;
  referralLink: string;
  totalReferrals: number;
  totalEarnings: number;
  pendingPayout: number;
  isAffiliate: boolean;
  dateJoined: string;
  referrals: Array<{
    id: string;
    email: string;
    signupDate: string;
    status: 'completed' | 'pending';
    earnings: number;
  }>;
}

export default function AffiliatePage() {
  const router = useRouter();
  const [affiliateData, setAffiliateData] = useState<AffiliateData | null>(
    null
  );
  const [formLoaded, setFormLoaded] = useState(false);

  // Form change and submit handlers
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setShowStripeLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      try {
        const { profileService } = await import('@/services/profileService');
        await profileService.updateProfile(user.id, {
          instagram: form.instagram,
          youtube: form.youtube,
          facebook: form.facebook,
          tiktok: form.tiktok,
        });
      } catch (err) {
        console.warn('Could not update user profile with social links', err);
      }

      await fetch('/app/api/affiliate/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: user.id,
          first_name: form.firstName,
          last_name: form.lastName,
          email: form.email,
          phone: form.phone,
          dob: form.dob,
          ssn_last_4: form.ssnLast4,
          address: form.address,
          city: form.city,
          state: form.state,
          postal_code: form.postalCode,
          country: form.country,
          website: form.website,
          instagram: form.instagram,
          youtube: form.youtube,
          facebook: form.facebook,
          tiktok: form.tiktok,
          payout_type: form.payoutType,
        }),
      });
      // ...handle response...
    } finally {
      setSubmitting(false);
      setShowStripeLoading(false);
    }
  };

  // Move form and submitting hooks to top level
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    line1: '', // address line1
    city: '',
    state: '',
    postal_code: '',
    country: 'US',
    ssn_last_4: '',
    dobDay: '',
    dobMonth: '',
    dobYear: '',
    website: '',
    instagram: '',
    youtube: '',
    facebook: '',
    tiktok: '',
    payoutType: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [showStripeLoading, setShowStripeLoading] = useState(false);

  useEffect(() => {
    // Load affiliate data
    loadAffiliateData();
  }, []);

  const loadAffiliateData = async () => {
    setFormLoaded(false);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setFormLoaded(true);
        return;
      }
      // Fetch affiliate status
      const { data: affiliateRow } = await supabase
        .from('affiliates')
        .select('*')
        .eq('user_id', user.id)
        .single();
      // Fetch personal info
      const { data: personalInfo } = await supabase
        .from('user_personal_info')
        .select(
          'first_name, last_name, address, city, state, postal_code, country, date_of_birth, phone, ssn_last_4, email'
        )
        .eq('user_id', user.id)
        .single();
      console.log('Affiliate form personalInfo:', personalInfo);
      // Parse date_of_birth to day/month/year
      let dobDay = '',
        dobMonth = '',
        dobYear = '';
      if (personalInfo?.date_of_birth) {
        const dob = new Date(personalInfo.date_of_birth);
        dobDay = String(dob.getUTCDate()).padStart(2, '0');
        dobMonth = String(dob.getUTCMonth() + 1).padStart(2, '0');
        dobYear = String(dob.getUTCFullYear());
      }
      // Backfill form fields
      setForm((prev) => ({
        ...prev,
        firstName: personalInfo?.first_name || prev.firstName,
        lastName: personalInfo?.last_name || prev.lastName,
        line1: personalInfo?.address || prev.line1,
        city: personalInfo?.city || prev.city,
        state: personalInfo?.state || prev.state,
        postal_code: personalInfo?.postal_code || prev.postal_code,
        country: personalInfo?.country || prev.country,
        phone: personalInfo?.phone || prev.phone,
        ssn_last_4: personalInfo?.ssn_last_4 || prev.ssn_last_4,
        email: personalInfo?.email || user.email || prev.email,
        dobDay,
        dobMonth,
        dobYear,
      }));
      setFormLoaded(true);

      // Set affiliate data if exists
      if (affiliateRow) {
        setAffiliateData({
          userId: affiliateRow.user_id,
          affiliateId: affiliateRow.id,
          referralLink: affiliateRow.referral_link,
          totalReferrals: affiliateRow.total_referrals || 0,
          totalEarnings: affiliateRow.total_earnings || 0,
          pendingPayout: affiliateRow.pending_payout || 0,
          isAffiliate: true,
          dateJoined: affiliateRow.date_joined,
          referrals: affiliateRow.referrals || [],
        });
      } else {
        setAffiliateData(null);
      }
    } catch (err) {
      console.error('Error loading affiliate/personal info:', err);
      setFormLoaded(true);
    }
  };

  // Not yet an affiliate - show join page
  if (!affiliateData) {
    if (!formLoaded) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-brand-midnight via-brand-charcoal to-brand-midnight">
          <Loader2 className="h-10 w-10 animate-spin text-green-500" />
          <span className="ml-4 text-green-300 text-lg">
            Loading your info...
          </span>
        </div>
      );
    }
    return (
      <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-b from-brand-midnight via-brand-charcoal to-brand-midnight flex items-center justify-center">
        <StarField />
        <main className="container mx-auto px-4 py-12">
          <div className="max-w-2xl mx-auto">
            <Card className="border-green-500/20 bg-brand-charcoal/50 backdrop-blur-xl shadow-xl shadow-green-500/5">
              <CardHeader>
                <CardTitle className="text-white">
                  Become an Affiliate
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Fill out the form below to join the Take Off Affiliate
                  Program.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="text-red-400 text-sm mb-2">
                    * Required fields
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Required fields */}
                    <div>
                      <label className="block text-white mb-1">
                        First Name <span className="text-red-400">*</span>
                      </label>
                      <input
                        name="firstName"
                        type="text"
                        className={`w-full px-3 py-2 rounded bg-brand-midnight/50 text-white border ${!form.firstName ? 'border-red-400' : 'border-green-500/20'}`}
                        value={form.firstName}
                        onChange={handleChange}
                      />
                    </div>
                    <div>
                      <label className="block text-white mb-1">
                        Last Name <span className="text-red-400">*</span>
                      </label>
                      <input
                        name="lastName"
                        type="text"
                        className={`w-full px-3 py-2 rounded bg-brand-midnight/50 text-white border ${!form.lastName ? 'border-red-400' : 'border-green-500/20'}`}
                        value={form.lastName}
                        onChange={handleChange}
                      />
                    </div>
                    <div>
                      <label className="block text-white mb-1">
                        Email <span className="text-red-400">*</span>
                      </label>
                      <input
                        name="email"
                        type="email"
                        className={`w-full px-3 py-2 rounded bg-brand-midnight/50 text-white border ${!form.email ? 'border-red-400' : 'border-green-500/20'}`}
                        value={form.email}
                        onChange={handleChange}
                      />
                    </div>
                    <div>
                      <label className="block text-white mb-1">
                        Phone <span className="text-red-400">*</span>
                      </label>
                      <input
                        name="phone"
                        type="text"
                        className={`w-full px-3 py-2 rounded bg-brand-midnight/50 text-white border ${!form.phone ? 'border-red-400' : 'border-green-500/20'}`}
                        value={form.phone}
                        onChange={handleChange}
                      />
                    </div>
                    <div>
                      <label className="block text-white mb-1">
                        Address Line 1 <span className="text-red-400">*</span>
                      </label>
                      <input
                        name="line1"
                        type="text"
                        className={`w-full px-3 py-2 rounded bg-brand-midnight/50 text-white border ${!form.line1 ? 'border-red-400' : 'border-green-500/20'}`}
                        value={form.line1}
                        onChange={handleChange}
                      />
                    </div>
                    <div>
                      <label className="block text-white mb-1">
                        City <span className="text-red-400">*</span>
                      </label>
                      <input
                        name="city"
                        type="text"
                        className={`w-full px-3 py-2 rounded bg-brand-midnight/50 text-white border ${!form.city ? 'border-red-400' : 'border-green-500/20'}`}
                        value={form.city}
                        onChange={handleChange}
                      />
                    </div>
                    <div>
                      <label className="block text-white mb-1">
                        State <span className="text-red-400">*</span>
                      </label>
                      <input
                        name="state"
                        type="text"
                        className={`w-full px-3 py-2 rounded bg-brand-midnight/50 text-white border ${!form.state ? 'border-red-400' : 'border-green-500/20'}`}
                        value={form.state}
                        onChange={handleChange}
                      />
                    </div>
                    <div>
                      <label className="block text-white mb-1">
                        Postal Code <span className="text-red-400">*</span>
                      </label>
                      <input
                        name="postal_code"
                        type="text"
                        className={`w-full px-3 py-2 rounded bg-brand-midnight/50 text-white border ${!form.postal_code ? 'border-red-400' : 'border-green-500/20'}`}
                        value={form.postal_code}
                        onChange={handleChange}
                      />
                    </div>
                    <div>
                      <label className="block text-white mb-1">
                        SSN Last 4 <span className="text-red-400">*</span>
                      </label>
                      <input
                        name="ssn_last_4"
                        type="text"
                        maxLength={4}
                        className={`w-full px-3 py-2 rounded bg-brand-midnight/50 text-white border ${!form.ssn_last_4 ? 'border-red-400' : 'border-green-500/20'}`}
                        value={form.ssn_last_4}
                        onChange={handleChange}
                      />
                    </div>
                    <div>
                      <label className="block text-white mb-1">
                        Date of Birth <span className="text-red-400">*</span>
                      </label>
                      <div className="flex gap-2">
                        <input
                          name="dobMonth"
                          type="text"
                          placeholder="MM"
                          className={`w-1/3 px-3 py-2 rounded bg-brand-midnight/50 text-white border ${!form.dobMonth ? 'border-red-400' : 'border-green-500/20'}`}
                          value={form.dobMonth}
                          onChange={handleChange}
                        />
                        <input
                          name="dobDay"
                          type="text"
                          placeholder="DD"
                          className={`w-1/3 px-3 py-2 rounded bg-brand-midnight/50 text-white border ${!form.dobDay ? 'border-red-400' : 'border-green-500/20'}`}
                          value={form.dobDay}
                          onChange={handleChange}
                        />
                        <input
                          name="dobYear"
                          type="text"
                          placeholder="YYYY"
                          className={`w-1/3 px-3 py-2 rounded bg-brand-midnight/50 text-white border ${!form.dobYear ? 'border-red-400' : 'border-green-500/20'}`}
                          value={form.dobYear}
                          onChange={handleChange}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-white mb-1">
                        Country <span className="text-red-400">*</span>
                      </label>
                      <input
                        name="country"
                        type="text"
                        className={`w-full px-3 py-2 rounded bg-brand-midnight/50 text-white border ${!form.country ? 'border-red-400' : 'border-green-500/20'}`}
                        value={form.country}
                        onChange={handleChange}
                      />
                    </div>
                    <div>
                      <label className="block text-white mb-1">
                        Payout Type <span className="text-red-400">*</span>
                      </label>
                      <select
                        name="payoutType"
                        className={`w-full px-3 py-2 rounded bg-brand-midnight/50 text-white border ${!form.payoutType ? 'border-red-400' : 'border-green-500/20'}`}
                        value={form.payoutType}
                        onChange={handleChange}
                      >
                        <option value="">Select...</option>
                        <option value="bank">Bank Transfer</option>
                        <option value="paypal">PayPal</option>
                      </select>
                    </div>
                    {/* Optional fields */}
                    <div>
                      <label className="block text-white mb-1">Website</label>
                      <input
                        name="website"
                        type="text"
                        className="w-full px-3 py-2 rounded bg-brand-midnight/50 text-white border border-green-500/20"
                        value={form.website}
                        onChange={handleChange}
                      />
                    </div>
                    <div>
                      <label className="block text-white mb-1">YouTube</label>
                      <input
                        name="youtube"
                        type="text"
                        className="w-full px-3 py-2 rounded bg-brand-midnight/50 text-white border border-green-500/20"
                        value={form.youtube}
                        onChange={handleChange}
                      />
                    </div>
                    <div>
                      <label className="block text-white mb-1">Facebook</label>
                      <input
                        name="facebook"
                        type="text"
                        className="w-full px-3 py-2 rounded bg-brand-midnight/50 text-white border border-green-500/20"
                        value={form.facebook}
                        onChange={handleChange}
                      />
                    </div>
                    <div>
                      <label className="block text-white mb-1">TikTok</label>
                      <input
                        name="tiktok"
                        type="text"
                        className="w-full px-3 py-2 rounded bg-brand-midnight/50 text-white border border-green-500/20"
                        value={form.tiktok}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                  <div className="text-center pt-6">
                    <Button
                      type="submit"
                      disabled={submitting}
                      size="lg"
                      className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg shadow-green-500/30 px-12 py-6 text-lg disabled:opacity-50"
                    >
                      {submitting ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-5 w-5 animate-spin" />
                          <span>Registering...</span>
                        </div>
                      ) : (
                        'Become an Affiliate Now'
                      )}
                    </Button>
                    <p className="text-gray-500 text-sm mt-4">
                      Free to join • No monthly fees • Start earning immediately
                    </p>
                  </div>
                  {/* Loader for Stripe setup */}
                  {showStripeLoading && (
                    <div className="flex flex-col items-center justify-center py-6">
                      <Loader2 className="h-8 w-8 animate-spin text-green-500 mb-2" />
                      <p className="text-green-300 text-lg font-semibold">
                        Setting up your Stripe account, please wait...
                      </p>
                      <p className="text-gray-400 text-sm mt-2">
                        This may take up to 30 seconds. Please do not close this
                        window.
                      </p>
                    </div>
                  )}
                </form>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  // Already an affiliate - show dashboard
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-b from-brand-midnight via-brand-charcoal to-brand-midnight">
      <StarField />
      <div className="absolute inset-0 bg-gradient-radial from-green-500/5 via-transparent to-transparent opacity-50" />
      <div className="relative z-10 min-h-screen">
        <header className="border-b border-brand-sky-blue/20 bg-brand-charcoal/50 backdrop-blur-xl">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <Button
              onClick={() => router.push('/dashboard')}
              variant="ghost"
              className="text-white hover:text-brand-sky-blue"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
        </header>
        <main className="container mx-auto px-4 py-12">
          <div className="max-w-6xl mx-auto space-y-8">
            <div className="text-center space-y-4">
              <div className="w-20 h-20 mx-auto bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="h-10 w-10 text-white" />
              </div>
              <h1 className="text-4xl font-bold text-white">
                Welcome to the Take Off Affiliate Program
              </h1>
              <p className="text-xl text-gray-300">
                Earn money by promoting the Take Off Credit Builder App
              </p>
              <p className="text-gray-400">
                Congratulations on becoming a Take Off Affiliate! You can earn
                $5 for every new user who signs up using your unique referral
                link.
              </p>
              <p className="text-xs text-gray-400 mt-2">
                Choose how you want to receive payouts. Bank Transfer (ACH)
                deposits to your bank account, Debit Card payouts are instant to
                your card.
              </p>
            </div>
            {/* Now the Card blocks follow after the div is closed */}
            <Card className="border-yellow-500/30 bg-yellow-500/5 backdrop-blur-xl shadow-xl shadow-yellow-500/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Users className="h-5 w-5 text-green-400" />
                  Total Referrals
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-5xl font-bold text-green-400">
                    {affiliateData.totalReferrals}
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    Completed signups
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-green-500/20 bg-brand-charcoal/50 backdrop-blur-xl shadow-xl shadow-green-500/5">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-green-400" />
                  Total Earnings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-5xl font-bold text-green-400">
                    ${affiliateData.totalEarnings}
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    ${affiliateData.totalReferrals} × $5 per signup
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-green-500/20 bg-brand-charcoal/50 backdrop-blur-xl shadow-xl shadow-green-500/5">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-400" />
                  Pending Payout
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-5xl font-bold text-green-400">
                    ${affiliateData.pendingPayout.toFixed(2)}
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    Available to withdraw
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-green-500/20 bg-brand-charcoal/50 backdrop-blur-xl shadow-xl shadow-green-500/5">
              <CardHeader>
                <CardTitle className="text-white">Referral History</CardTitle>
                <CardDescription className="text-gray-400">
                  Track your referrals and earnings
                </CardDescription>
              </CardHeader>
              <CardContent>
                {affiliateData.referrals.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                    <p className="text-gray-400 text-lg mb-2">
                      No referrals yet
                    </p>
                    <p className="text-gray-500 text-sm">
                      Start sharing your link to see your referrals here
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="grid grid-cols-4 gap-4 pb-2 border-b border-green-500/20 text-sm font-medium text-gray-400">
                      <div>Email</div>
                      <div className="text-center">Signup Date</div>
                      <div className="text-center">Status</div>
                      <div className="text-right">Earnings</div>
                    </div>
                    {affiliateData.referrals.map((referral) => (
                      <div
                        key={referral.id}
                        className="grid grid-cols-4 gap-4 py-3 px-3 rounded-lg bg-brand-midnight/30 hover:bg-brand-midnight/50 transition-colors border border-green-500/5 hover:border-green-500/20"
                      >
                        <div className="flex items-center">
                          <span className="text-white text-sm truncate">
                            {referral.email}
                          </span>
                        </div>
                        <div className="flex items-center justify-center">
                          <span className="text-gray-300 text-sm">
                            {new Date(referral.signupDate).toLocaleDateString(
                              'en-US',
                              {
                                month: '2-digit',
                                day: '2-digit',
                                year: 'numeric',
                              }
                            )}
                          </span>
                        </div>
                        <div className="flex items-center justify-center">
                          <Badge
                            className={
                              referral.status === 'completed'
                                ? 'bg-green-500/20 text-green-300 border-green-500/30'
                                : 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
                            }
                          >
                            {referral.status}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-end">
                          <span className="text-green-400 font-semibold">
                            ${referral.earnings.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    ))}
                    <div className="pt-3 mt-2 border-t border-green-500/20">
                      <div className="flex items-center justify-between px-3 py-2">
                        <span className="text-white font-semibold text-lg">
                          Total Earnings:
                        </span>
                        <span className="text-2xl font-bold text-green-400">
                          ${affiliateData.totalEarnings.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            <Card className="border-green-500/20 bg-brand-charcoal/50 backdrop-blur-xl shadow-xl shadow-green-500/5">
              <CardHeader>
                <CardTitle className="text-white">Request Payout</CardTitle>
                <CardDescription className="text-gray-400">
                  Withdraw your earnings when you reach the minimum payout
                  threshold
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-brand-midnight/50 rounded-lg border border-green-500/20">
                    <div>
                      <p className="text-white font-medium">
                        Available Balance
                      </p>
                      <p className="text-gray-500 text-sm">
                        Minimum payout: $50
                      </p>
                    </div>
                    <div className="text-2xl font-bold text-green-400">
                      ${affiliateData.pendingPayout.toFixed(2)}
                    </div>
                  </div>
                  <Button
                    disabled={affiliateData.pendingPayout < 50}
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white"
                  >
                    {affiliateData.pendingPayout >= 50
                      ? 'Request Payout'
                      : 'Minimum $50 Required'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
