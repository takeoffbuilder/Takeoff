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
import { DollarSign, Users, Trophy } from 'lucide-react';
import { StarField } from '@/components/StarField';

import { useRouter } from 'next/router';
import { authService } from '@/services/authService';
import { isAdmin as checkIsAdmin } from '@/services/adminService';

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
  const [isSubscriber, setIsSubscriber] = useState(false);

  useEffect(() => {
    async function fetchDashboardData() {
      const user = await authService.getCurrentUser();
      if (!user) return;
      // Fetch affiliate status and referral link
      const statusRes = await fetch(`/api/affiliate/status?userId=${user.id}`);
      const statusData = await statusRes.json();
      setReferralLink(statusData.referralLink || '');
      setStatus(statusData.status || '');
      // Fetch referrals for metrics
      const referralsRes = await fetch(
        `/api/affiliate/referrals?userId=${user.id}`
      );
      const referralsData = await referralsRes.json();
      setReferrals(referralsData.referrals || []);
      // Check admin status
      if (user.email) {
        const admin = await checkIsAdmin(user.email);
        setIsAdmin(!!admin);
      }
    }
    fetchDashboardData();
  }, []);
  useEffect(() => {
    async function fetchReferralLink() {
      // Replace with your actual API/user logic
      const user = await authService.getCurrentUser();
      if (!user) return;
      // Example: fetch affiliate status
      const res = await fetch(`/api/affiliate/status?userId=${user.id}`);
      const data = await res.json();
      setReferralLink(data.referralLink || '');
    }
    fetchReferralLink();
  }, []);

  useEffect(() => {
    async function checkSubscription() {
      const user = await authService.getCurrentUser();
      if (!user) return;
      // Replace with your actual API/user logic
      const res = await fetch(`/api/subscription/status?userId=${user.id}`);
      const data = await res.json();
      setIsSubscriber(data.isSubscriber || false);
    }
    checkSubscription();
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
    <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-b from-brand-midnight via-brand-charcoal to-brand-midnight">
      <StarField />
      <div className="absolute inset-0 bg-gradient-radial from-brand-sky-blue/5 via-transparent to-transparent opacity-50 pointer-events-none" />
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center">
        <div className="bg-brand-charcoal/80 rounded-xl shadow-lg p-8 max-w-2xl w-full text-center relative mt-8">
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
            <div className="flex flex-col items-start">
              {isSubscriber && (
                <>
                  <Button
                    variant="secondary"
                    onClick={() => router.push('/dashboard')}
                    className="bg-brand-sky-blue/10 text-brand-sky-blue border border-brand-sky-blue/30 rounded px-4 py-2 hover:bg-brand-sky-blue/20 hover:text-brand-sky-blue-light transition-colors"
                  >
                    Back to Dashboard
                  </Button>
                  <span className="text-brand-sky-blue text-2xl mt-1 ml-2">
                    &#8592;
                  </span>
                </>
              )}
            </div>
            <div className="flex flex-col items-end gap-2">
              {isAdmin && (
                <Button
                  variant="secondary"
                  onClick={() => router.push('/admin')}
                  className="bg-brand-sky-blue/20 text-brand-sky-blue border border-brand-sky-blue/30 rounded px-4 py-2 hover:bg-brand-sky-blue/30 hover:text-brand-sky-blue-light transition-colors"
                >
                  Admin
                </Button>
              )}
              <Button
                variant="outline"
                onClick={openAccountModal}
                className="border-brand-sky-blue/30 text-white hover:bg-brand-sky-blue/10"
              >
                Account Details
              </Button>
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
              <div className="bg-brand-charcoal rounded-xl shadow-lg p-8 w-full max-w-lg relative">
                <h2 className="text-xl font-bold text-brand-sky-blue mb-4">
                  Account Details
                </h2>
                {profileLoading ? (
                  <div className="text-brand-sky-blue">Loading...</div>
                ) : profileError ? (
                  <div className="text-red-400">{profileError}</div>
                ) : (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleProfileSave();
                    }}
                    className="flex flex-col gap-4"
                  >
                    <label className="text-left text-white text-sm">Name</label>
                    <input
                      className="bg-brand-midnight/50 border border-brand-sky-blue/30 text-white rounded px-3 py-2 opacity-60 cursor-not-allowed"
                      value={profileEdit.full_name || ''}
                      readOnly
                      disabled
                    />
                    <label className="text-left text-white text-sm">
                      Email
                    </label>
                    <input
                      className="bg-brand-midnight/50 border border-brand-sky-blue/30 text-white rounded px-3 py-2 opacity-60 cursor-not-allowed"
                      value={profileEdit.email || ''}
                      readOnly
                      disabled
                    />
                    <label className="text-left text-white text-sm">
                      Phone
                    </label>
                    <input
                      className="bg-brand-midnight/50 border border-brand-sky-blue/30 text-white rounded px-3 py-2"
                      value={profileEdit.phone || ''}
                      onChange={(e) =>
                        setProfileEdit({
                          ...profileEdit,
                          phone: e.target.value,
                        })
                      }
                    />
                    <label className="text-left text-white text-sm">
                      Address
                    </label>
                    <input
                      className="bg-brand-midnight/50 border border-brand-sky-blue/30 text-white rounded px-3 py-2"
                      value={profileEdit.address || ''}
                      onChange={(e) =>
                        setProfileEdit({
                          ...profileEdit,
                          address: e.target.value,
                        })
                      }
                      placeholder="Street Address"
                    />
                    <label className="text-left text-white text-sm">City</label>
                    <input
                      className="bg-brand-midnight/50 border border-brand-sky-blue/30 text-white rounded px-3 py-2"
                      value={profileEdit.city || ''}
                      onChange={(e) =>
                        setProfileEdit({
                          ...profileEdit,
                          city: e.target.value,
                        })
                      }
                      placeholder="City"
                    />
                    <label className="text-left text-white text-sm">
                      State
                    </label>
                    <input
                      className="bg-brand-midnight/50 border border-brand-sky-blue/30 text-white rounded px-3 py-2"
                      value={profileEdit.state || ''}
                      onChange={(e) =>
                        setProfileEdit({
                          ...profileEdit,
                          state: e.target.value,
                        })
                      }
                      placeholder="State"
                    />
                    <label className="text-left text-white text-sm">
                      Zip Code
                    </label>
                    <input
                      className="bg-brand-midnight/50 border border-brand-sky-blue/30 text-white rounded px-3 py-2"
                      value={profileEdit.zip || ''}
                      onChange={(e) =>
                        setProfileEdit({
                          ...profileEdit,
                          zip: e.target.value,
                        })
                      }
                      placeholder="Zip Code"
                    />
                    <div className="flex flex-col gap-2 mt-4">
                      <div className="flex gap-2">
                        <Button
                          type="submit"
                          disabled={profileSaving}
                          className="bg-brand-sky-blue text-white"
                        >
                          {profileSaving ? 'Saving...' : 'Save'}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setShowAccountModal(false)}
                          className="border-brand-sky-blue/30 text-white"
                        >
                          Cancel
                        </Button>
                      </div>
                      <Button
                        variant="destructive"
                        className="mt-2"
                        onClick={async () => {
                          if (
                            window.confirm(
                              'Are you sure you want to close your affiliate account? This action cannot be undone.'
                            )
                          ) {
                            const user = await authService.getCurrentUser();
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
                      >
                        Close Affiliate Account
                      </Button>
                    </div>
                  </form>
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
