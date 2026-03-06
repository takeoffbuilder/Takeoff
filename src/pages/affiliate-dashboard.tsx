//
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DollarSign, Users, Trophy, Edit2 } from 'lucide-react';
import { StarField } from '@/components/StarField';

import { useRouter } from 'next/router';
import { authService } from '@/services/authService';
import { isAdmin as checkIsAdmin } from '@/services/adminService';
import {
  getMyReferrer,
  buildReferralLink,
  ensureReferrer,
} from '@/services/referralService';

// Referral type is used inline in state, so no need to export separately if not reused

export default function AffiliateDashboardPage() {
  const [showAccountModal, setShowAccountModal] = useState(false);
  // Removed unused 'profile' state
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileEdit, setProfileEdit] = useState<Record<string, unknown>>({});
  const [profileSaving, setProfileSaving] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  async function fetchProfile() {
    setProfileLoading(true);
    setProfileError(null);
    try {
      const user = await authService.getCurrentUser();
      if (!user) return;
      const res = await fetch(`/api/profile?userId=${user.id}`);
      const data = await res.json();
      // setProfile(data.profile || {}); // No longer needed
      setProfileEdit(data.profile || {});
    } catch {
      setProfileError('Failed to load profile');
    } finally {
      setProfileLoading(false);
    }
  }

  function openAccountModal() {
    fetchProfile();
    setShowAccountModal(true);
  }

  async function handleProfileSave() {
    setProfileSaving(true);
    setProfileError(null);
    try {
      const user = await authService.getCurrentUser();
      if (!user) return;
      const res = await fetch(`/api/profile?userId=${user.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileEdit),
      });
      if (!res.ok) throw new Error('Failed to update profile');
      setShowAccountModal(false);
      fetchProfile();
    } catch {
      setProfileError('Failed to update profile');
    } finally {
      setProfileSaving(false);
    }
  }
  async function handleSignOut() {
    await authService.signOut();
    router.push('/signin');
  }
  const [status, setStatus] = useState('');
  const [referrals, setReferrals] = useState([]);
  const [referralLink, setReferralLink] = useState('');
  // Removed unused payout demo state
  // Removed unused isSubscriber state
  const [isAffiliateOnly, setIsAffiliateOnly] = useState(false);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);

  useEffect(() => {
    async function fetchInitialData() {
      const user = await authService.getCurrentUser();
      if (!user) {
        console.log('No user in fetchInitialData, skipping');
        return;
      }

      try {
        // Fetch affiliate status once on mount
        const statusRes = await fetch(
          `/api/affiliate/status?userId=${user.id}`
        );
        const statusData = await statusRes.json();
        console.log('Affiliate status response:', statusData);
        let computedReferralLink = statusData.referralLink || '';
        if (!computedReferralLink) {
          const referrer = await getMyReferrer();
          if (
            referrer &&
            typeof referrer === 'object' &&
            'referral_code' in referrer &&
            typeof referrer.referral_code === 'string'
          ) {
            computedReferralLink = buildReferralLink(referrer.referral_code);
          } else {
            const ensured = await ensureReferrer();
            computedReferralLink = ensured?.link || '';
          }
        }
        setReferralLink(computedReferralLink);
        setStatus(statusData.status || '');
        setIsAffiliateOnly(!!statusData.isAffiliateOnly);
        console.log('Set isAffiliateOnly to:', !!statusData.isAffiliateOnly);
      } catch (e) {
        console.error('Error fetching affiliate status:', e);
      }

      // Removed unused subscription status fetch logic

      // Check admin status
      if (user && user.email) {
        try {
          const admin = await checkIsAdmin(user.email);
          setIsAdmin(admin);
        } catch {
          setIsAdmin(false);
        }
      }
    }
    fetchInitialData();
  }, []);

  useEffect(() => {
    let pollInterval: NodeJS.Timeout | null = null;

    async function setupPolling() {
      const user = await authService.getCurrentUser();
      if (!user) {
        console.log('No user found, not setting up polling');
        return;
      }

      async function fetchReferralMetrics() {
        const user = await authService.getCurrentUser();
        if (!user) return;

        console.log('Polling referral metrics...');
        // Only fetch referrals for metrics - don't update affiliate status or subscription
        const referralsRes = await fetch(
          `/api/affiliate/referrals?userId=${user.id}`
        );
        const referralsData = await referralsRes.json();
        setReferrals(referralsData.referrals || []);
      }

      // Initial fetch
      await fetchReferralMetrics();

      // Poll for referral updates every 5 seconds to catch webhook updates
      pollInterval = setInterval(fetchReferralMetrics, 5000);
    }

    setupPolling();

    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  }, []);
  const router = useRouter();

  // Example metric helpers (replace with real logic as needed)
  // Restore old logic: count referred_users directly for all metrics
  function getNewSubscribersCount(referrals) {
    // Count all referred_users for this affiliate
    return referrals.length;
  }
  function getQualifiedReferralCount(referrals) {
    // All-time qualified referrals (converted, regardless of payout status)
    return referrals.filter((r) => r.converted).length;
  }
  function getQualifiedPayoutAmount(referrals) {
    // Total payout for qualified referrals
    return referrals
      .filter((r) => r.converted && r.payout_status === 'approved')
      .reduce((sum, r) => sum + (parseFloat(r.payout_amount || '0') || 0), 0);
  }
  function getPayoutHistory(referrals) {
    // Paid out referrals, most recent first, limit to 12 (approx. 90 days)
    return referrals
      .filter((r) => r.payout_status === 'paid')
      .sort((a, b) =>
        b.paid_at && a.paid_at ? b.paid_at.localeCompare(a.paid_at) : 0
      )
      .slice(0, 12);
  }

  return (
    <div className="relative w-full min-h-screen overflow-hidden bg-gradient-to-b from-brand-midnight via-brand-charcoal to-brand-midnight">
      <StarField />
      <div className="absolute inset-0 bg-gradient-radial from-brand-sky-blue/5 via-transparent to-transparent opacity-50 pointer-events-none" />
      <div className="relative z-10 w-full flex flex-col items-center">
        <div className="bg-brand-charcoal/80 rounded-xl shadow-lg p-8 max-w-2xl w-full text-center relative mt-8 mb-8">
          {/* Affiliate Status */}
          {status && (
            <div className="mb-4">
              <span className="text-lg text-brand-white">
                Affiliate status:{' '}
                <span className="font-bold text-green-400">{status}</span>
              </span>
            </div>
          )}
          {/* Navigation Row */}
          <div className="flex flex-row justify-between items-start mb-2 w-full">
            <div className="flex flex-col items-start gap-2">
              {!isAffiliateOnly && (
                <>
                  <Button
                    variant="secondary"
                    onClick={() => router.push('/dashboard?fromAffiliate=1')}
                    className="bg-brand-sky-blue/10 text-brand-sky-blue border border-brand-sky-blue/30 rounded px-4 py-2 hover:bg-brand-sky-blue/20 hover:text-brand-sky-blue-light transition-colors"
                  >
                    Back to Dashboard
                  </Button>
                  <span className="text-brand-sky-blue text-2xl mt-1 ml-2">
                    &#8592;
                  </span>
                </>
              )}
              <Button
                variant="outline"
                onClick={openAccountModal}
                className="border-brand-sky-blue/30 text-white hover:bg-brand-sky-blue/10"
              >
                Account Details
              </Button>
            </div>
            <div className="flex flex-col items-end gap-2">
              {isAdmin && (
                <Button
                  variant="secondary"
                  onClick={() => router.push('/admin/admin-emails')}
                  className="bg-brand-sky-blue/20 text-brand-sky-blue border border-brand-sky-blue/30 rounded px-4 py-2 hover:bg-brand-sky-blue/30 hover:text-brand-sky-blue-light transition-colors"
                >
                  Admin
                </Button>
              )}
              <Button
                variant="outline"
                onClick={handleSignOut}
                className="border-brand-sky-blue/30 text-white hover:bg-brand-midnight/80"
              >
                Sign Out
              </Button>
            </div>
          </div>

          {/* Account Details Modal */}
          {showAccountModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
              <div className="bg-brand-charcoal rounded-xl shadow-lg p-8 w-full max-w-2xl max-h-96 overflow-y-auto relative">
                <h2 className="text-2xl font-bold text-brand-sky-blue mb-6">
                  Account Details
                </h2>
                {profileLoading ? (
                  <div className="text-brand-sky-blue">Loading...</div>
                ) : profileError ? (
                  <div className="text-red-400">{profileError}</div>
                ) : (
                  <>
                    {/* Advanced Options - Collapsible */}
                    <div className="mb-6">
                      <button
                        onClick={() =>
                          setShowAdvancedOptions(!showAdvancedOptions)
                        }
                        className="flex items-center justify-between w-full mb-4 pb-3 border-b border-brand-sky-blue/10 hover:border-brand-sky-blue/20 transition-colors"
                      >
                        <h3 className="text-brand-sky-blue font-semibold text-sm flex items-center gap-2">
                          <span>{showAdvancedOptions ? '▼' : '▶'}</span>{' '}
                          Advanced Options
                        </h3>
                      </button>

                      {showAdvancedOptions && (
                        <div className="bg-brand-midnight/30 border border-brand-sky-blue/15 rounded-lg p-4 space-y-3">
                          <div>
                            <p className="text-gray-400 text-sm mb-3">
                              Start using Take Off Credit to build your credit
                              while earning from referrals.
                            </p>
                            <Button
                              onClick={() => router.push('/choose-plan')}
                              className="w-full bg-gradient-to-r from-green-400 to-green-500 hover:from-green-500 hover:to-green-600 text-brand-midnight font-semibold"
                            >
                              Start a Booster Account
                            </Button>
                          </div>
                          <div>
                            <p className="text-gray-400 text-sm mb-4">
                              You can deactivate your affiliate account if you
                              need to step back. This action cannot be undone.
                            </p>
                            <Button
                              variant="outline"
                              onClick={async () => {
                                if (
                                  window.confirm(
                                    'Are you absolutely sure you want to deactivate your affiliate account? This action cannot be undone and you will lose access to your referral link.'
                                  )
                                ) {
                                  const user =
                                    await authService.getCurrentUser();
                                  if (!user) return;
                                  await fetch(
                                    `/api/affiliate/close-account?userId=${user.id}`,
                                    { method: 'POST' }
                                  );
                                  setShowAccountModal(false);
                                  // Refresh affiliate status only
                                  const statusRes = await fetch(
                                    `/api/affiliate/status?userId=${user.id}`
                                  );
                                  const statusData = await statusRes.json();
                                  setStatus(statusData.status || 'inactive');
                                }
                              }}
                              className="w-full border-brand-sky-blue/40 text-brand-sky-blue hover:bg-brand-sky-blue/10"
                            >
                              Deactivate Affiliate Account
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Account Info Section */}
                    <div className="mb-6">
                      <h3 className="text-brand-sky-blue font-semibold text-sm mb-3">
                        Account Information
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        {/* Read-only fields as info cards */}
                        <div className="bg-brand-midnight/50 rounded-lg p-3 border border-brand-sky-blue/10">
                          <label className="text-gray-400 text-xs uppercase tracking-wide block mb-1">
                            Name
                          </label>
                          <p className="text-white text-sm font-medium">
                            {profileEdit.full_name || '—'}
                          </p>
                        </div>
                        <div className="bg-brand-midnight/50 rounded-lg p-3 border border-brand-sky-blue/10">
                          <label className="text-gray-400 text-xs uppercase tracking-wide block mb-1">
                            Email
                          </label>
                          <p className="text-white text-sm font-medium break-all">
                            {profileEdit.email || '—'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Editable Contact Information */}
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleProfileSave();
                      }}
                      className="flex flex-col gap-4"
                    >
                      <div>
                        <h3 className="text-brand-sky-blue font-semibold text-sm mb-3 flex items-center gap-2">
                          <Edit2 className="h-4 w-4" />
                          Contact Information
                        </h3>
                        <div className="space-y-3">
                          <div>
                            <label className="text-gray-300 text-xs uppercase tracking-wide block mb-1">
                              Phone
                            </label>
                            <input
                              className="w-full bg-brand-midnight/50 border border-brand-sky-blue/30 text-white rounded px-3 py-2 focus:border-brand-sky-blue/60 transition-colors"
                              value={profileEdit.phone || ''}
                              onChange={(e) =>
                                setProfileEdit({
                                  ...profileEdit,
                                  phone: e.target.value,
                                })
                              }
                              placeholder="(123) 456-7890"
                            />
                          </div>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-brand-sky-blue font-semibold text-sm mb-3 flex items-center gap-2">
                          <Edit2 className="h-4 w-4" />
                          Address
                        </h3>
                        <div className="space-y-3">
                          <div>
                            <label className="text-gray-300 text-xs uppercase tracking-wide block mb-1">
                              Street Address
                            </label>
                            <input
                              className="w-full bg-brand-midnight/50 border border-brand-sky-blue/30 text-white rounded px-3 py-2 focus:border-brand-sky-blue/60 transition-colors"
                              value={profileEdit.address || ''}
                              onChange={(e) =>
                                setProfileEdit({
                                  ...profileEdit,
                                  address: e.target.value,
                                })
                              }
                              placeholder="123 Main Street"
                            />
                          </div>
                          <div className="grid grid-cols-3 gap-3">
                            <div>
                              <label className="text-gray-300 text-xs uppercase tracking-wide block mb-1">
                                City
                              </label>
                              <input
                                className="w-full bg-brand-midnight/50 border border-brand-sky-blue/30 text-white rounded px-3 py-2 focus:border-brand-sky-blue/60 transition-colors"
                                value={profileEdit.city || ''}
                                onChange={(e) =>
                                  setProfileEdit({
                                    ...profileEdit,
                                    city: e.target.value,
                                  })
                                }
                                placeholder="City"
                              />
                            </div>
                            <div>
                              <label className="text-gray-300 text-xs uppercase tracking-wide block mb-1">
                                State
                              </label>
                              <input
                                className="w-full bg-brand-midnight/50 border border-brand-sky-blue/30 text-white rounded px-3 py-2 focus:border-brand-sky-blue/60 transition-colors"
                                value={profileEdit.state || ''}
                                onChange={(e) =>
                                  setProfileEdit({
                                    ...profileEdit,
                                    state: e.target.value,
                                  })
                                }
                                placeholder="MI"
                              />
                            </div>
                            <div>
                              <label className="text-gray-300 text-xs uppercase tracking-wide block mb-1">
                                Zip Code
                              </label>
                              <input
                                className="w-full bg-brand-midnight/50 border border-brand-sky-blue/30 text-white rounded px-3 py-2 focus:border-brand-sky-blue/60 transition-colors"
                                value={profileEdit.zip || ''}
                                onChange={(e) =>
                                  setProfileEdit({
                                    ...profileEdit,
                                    zip: e.target.value,
                                  })
                                }
                                placeholder="12345"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2 mt-6 pt-4 border-t border-brand-sky-blue/10">
                        <Button
                          type="submit"
                          disabled={profileSaving}
                          className="flex-1 bg-brand-sky-blue hover:bg-brand-sky-blue-light text-white"
                        >
                          {profileSaving ? 'Saving...' : 'Save Changes'}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setShowAccountModal(false)}
                          className="flex-1 border-brand-sky-blue/30 text-white hover:bg-brand-sky-blue/10"
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </>
                )}
              </div>
            </div>
          )}
          {/* How this works Explainer */}
          <div className="mb-6 mt-2">
            <h1 className="text-2xl font-bold text-brand-sky-blue mb-2">
              How the affiliate program works
            </h1>
            <p className="text-brand-white text-base">
              Share your unique referral link below. When someone starts a{' '}
              <span className="font-semibold text-yellow-300">
                new subscription
              </span>{' '}
              using your link and pays for their{' '}
              <span className="font-semibold text-yellow-300">
                second month
              </span>
              , you earn a payout.
              <br />
              <span className="font-semibold text-green-400">
                Payouts are processed weekly, every Friday.
              </span>
              <br />
              Track your progress and payouts below.
            </p>
          </div>
          {/* Metrics Cards */}
          <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* New Subscribers Card */}
            <Card className="border-brand-sky-blue/20 bg-brand-charcoal/70 backdrop-blur-xl shadow-xl shadow-brand-sky-blue/10 flex flex-col items-center justify-center">
              <CardHeader className="flex flex-col items-center">
                <CardTitle className="flex items-center gap-2 text-yellow-300 text-2xl">
                  <Users className="h-7 w-7 text-yellow-300 animate-float" />
                  New Subscribers
                </CardTitle>
                <CardDescription className="text-gray-400 text-center">
                  Total NEW subscriptions using your referral code
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center">
                <span
                  className="text-5xl font-bold text-yellow-300 animate-pulse-glow"
                  style={{
                    minHeight: '3.5rem',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  {getNewSubscribersCount(referrals)}
                </span>
              </CardContent>
            </Card>
            {/* Qualified Referrals Card */}
            <Card className="border-brand-sky-blue/20 bg-brand-charcoal/70 backdrop-blur-xl shadow-xl shadow-brand-sky-blue/10 flex flex-col items-center justify-center">
              <CardHeader className="flex flex-col items-center">
                <CardTitle className="flex items-center gap-2 text-yellow-300 text-2xl">
                  <Trophy className="h-7 w-7 text-yellow-300 animate-float" />
                  Qualified Referrals
                </CardTitle>
                <CardDescription className="text-gray-400 text-center">
                  Total referrals who qualified for a payout
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center">
                <span
                  className="text-5xl font-bold text-yellow-300 animate-pulse-glow"
                  style={{
                    minHeight: '3.5rem',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  {getQualifiedReferralCount(referrals)}
                </span>
              </CardContent>
            </Card>
            {/* Payout Amount Card */}
            <Card className="border-brand-sky-blue/20 bg-brand-charcoal/70 backdrop-blur-xl shadow-xl shadow-yellow-400/10 flex flex-col items-center justify-center">
              <CardHeader className="flex flex-col items-center">
                <CardTitle className="flex items-center gap-2 text-yellow-300 text-2xl">
                  <DollarSign className="h-7 w-7 text-green-400 animate-float" />
                  <span className="text-green-400">Payout to Expect</span>
                </CardTitle>
                <CardDescription className="text-gray-400 text-center">
                  Pending Payout for qualified referrals
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center">
                <span className="text-5xl font-bold text-green-400 animate-pulse-glow">
                  ${getQualifiedPayoutAmount(referrals).toFixed(2)}
                </span>
                <span className="text-xs text-green-300 mt-2">
                  Keep referring to level up!
                </span>
              </CardContent>
            </Card>
          </div>
          {/* Referral Link Section */}
          {referralLink && (
            <div className="mt-2 mb-6 flex flex-col items-center">
              <div className="mb-2 text-lg font-bold text-brand-white w-full flex justify-center">
                Your referral link is
              </div>
              <div className="flex flex-wrap items-center gap-3 mb-2 w-full justify-center">
                <a
                  href={referralLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-base font-mono bg-brand-sky-blue/10 border border-brand-sky-blue/40 rounded px-3 py-1 text-brand-sky-blue font-bold tracking-widest hover:bg-brand-sky-blue/30 hover:text-brand-sky-blue-light transition-colors shadow whitespace-nowrap overflow-auto max-w-full"
                  style={{ textDecoration: 'none' }}
                >
                  {referralLink}
                </a>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() =>
                    referralLink && navigator.clipboard.writeText(referralLink)
                  }
                  className="px-4 py-1 rounded border border-brand-sky-blue/40 text-brand-sky-blue bg-brand-charcoal hover:bg-brand-sky-blue/10 hover:text-brand-sky-blue-light transition-colors font-semibold"
                >
                  Copy Link
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({
                        title: 'Join Take Off Credit',
                        text: 'Sign up with my referral code!',
                        url: referralLink,
                      });
                    } else {
                      navigator.clipboard.writeText(referralLink);
                    }
                  }}
                  className="px-4 py-1 rounded border border-brand-sky-blue/40 text-brand-sky-blue bg-brand-charcoal hover:bg-brand-sky-blue/10 hover:text-brand-sky-blue-light transition-colors font-semibold"
                >
                  Share
                </Button>
              </div>
            </div>
          )}
          {/* Payout History Section */}
          <div className="mt-10">
            <h2 className="text-xl font-bold text-green-400 mb-2 flex items-center gap-2">
              <DollarSign className="h-6 w-6 text-green-400" /> Payout History
            </h2>

            {getPayoutHistory(referrals).length === 0 ? (
              <div className="text-gray-400 text-sm">
                No payouts yet. Earn more by referring!
              </div>
            ) : (
              <div className="space-y-3">
                {getPayoutHistory(referrals).map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center gap-4 bg-brand-midnight/40 border border-brand-sky-blue/10 rounded-lg px-4 py-3"
                  >
                    <Trophy className="h-5 w-5 text-yellow-400 animate-float" />
                    <div className="flex-1">
                      <div className="text-green-400 font-semibold">
                        ${r.payout_amount || '0.00'} paid
                      </div>
                      <div className="text-xs text-gray-400">
                        {r.referred_email} &middot;{' '}
                        {r.paid_at
                          ? new Date(r.paid_at).toLocaleDateString()
                          : ''}
                      </div>
                    </div>
                    <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                      Paid
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
