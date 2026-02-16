import { useEffect, useState } from 'react';
import Image from 'next/image';
import {
  ensureReferrer,
  getMyReferrer,
  buildReferralLink,
  fetchReferredUsers,
  fetchReferrerStats,
} from '@/services/referralService';
import { useMemo } from 'react';
import QRCodeLib from 'qrcode';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
// Supabase client not directly needed here; API helper functions handle auth.

interface ReferredUserRow {
  id: string;
  referral_code: string;
  referred_user_id: string;
  signup_at: string;
  converted: boolean;
  conversion_at?: string | null;
  payout_amount?: number | null;
  payout_status?: string | null;
  paid_at?: string | null;
}

export default function ReferralsPage() {
  const [loading, setLoading] = useState(true);
  interface ReferrerProfile {
    id: string;
    referral_code: string;
    is_affiliate: boolean;
    affiliate_signup_count?: number;
    affiliate_conversion_count?: number;
  }
  interface PendingStats {
    pending_count?: number;
    pending_total_amount?: number;
    referrer?: ReferrerProfile;
    affiliate_signup_count?: number;
    affiliate_conversion_count?: number;
    referral_code?: string;
    is_affiliate?: boolean;
  }
  const [referrer, setReferrer] = useState<ReferrerProfile | null>(null);
  const [stats, setStats] = useState<PendingStats | null>(null);
  const [referredUsers, setReferredUsers] = useState<ReferredUserRow[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      try {
        const ref = await getMyReferrer();
        if (!active) return;
        setReferrer(ref);
        if (ref) {
          const st = await fetchReferrerStats();
          if (active) setStats(st);
          const list = await fetchReferredUsers(page, pageSize);
          if (active) {
            setReferredUsers(list.items || []);
            setTotal(list.total || 0);
          }
        }
      } catch (e) {
        if (active) setError(e instanceof Error ? e.message : 'Failed to load');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [page, pageSize]);

  async function becomeReferrer() {
    setCreating(true);
    setError(null);
    try {
      const created = await ensureReferrer();
      if (created) {
        const ref = await getMyReferrer();
        setReferrer(ref);
        const st = await fetchReferrerStats();
        setStats(st);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create referrer');
    } finally {
      setCreating(false);
    }
  }

  const referral_code = referrer?.referral_code;
  const referral_link = referral_code ? buildReferralLink(referral_code) : '';

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(referral_link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }

  function shareEmail(link: string) {
    const subject = encodeURIComponent('Join me');
    const body = encodeURIComponent(`Sign up with my referral: ${link}`);
    window.open(`mailto:?subject=${subject}&body=${body}`);
  }
  function shareX(link: string) {
    const text = encodeURIComponent('Check this out');
    window.open(
      `https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(link)}`,
      '_blank'
    );
  }
  function shareLinkedIn(link: string) {
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(link)}`,
      '_blank'
    );
  }

  function formatDate(dt?: string | null) {
    if (!dt) return '';
    return dt.slice(0, 10);
  }

  function pendingPayoutDisplay() {
    if (!stats) return '—';
    const amt = stats.pending_total_amount || 0;
    return `$${amt.toFixed(2)} (${stats.pending_count || 0})`;
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Referrals</h1>
      {error && <div className="text-sm text-red-600">{error}</div>}

      {!loading && !referrer && (
        <Card>
          <CardHeader>
            <CardTitle>Become a Referrer</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              Earn a one-time payout for each new user who purchases a plan
              through your referral link.
            </p>
            <ul className="text-xs list-disc pl-5 text-gray-500 space-y-1">
              <li>No spam or misleading advertising.</li>
              <li>Payout issued after qualifying purchase.</li>
              <li>Monitor status directly on this page.</li>
            </ul>
            <Button disabled={creating} onClick={becomeReferrer}>
              {creating ? 'Creating…' : 'Generate Referral Code'}
            </Button>
          </CardContent>
        </Card>
      )}

      {referrer && (
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle>Your Referral Link</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-xs font-mono break-all bg-gray-50 border rounded p-2">
                {referral_link}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" onClick={copyLink}>
                  {copied ? 'Copied!' : 'Copy'}
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => window.open(referral_link, '_blank')}
                >
                  Open
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => shareEmail(referral_link)}
                >
                  Email
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => shareX(referral_link)}
                >
                  X
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => shareLinkedIn(referral_link)}
                >
                  LinkedIn
                </Button>
              </div>
              <p className="text-xs text-gray-500">
                Share this link. Signup page will attach the code automatically.
              </p>
              <div className="mt-4">
                <QRCode value={referral_link} />
              </div>
            </CardContent>
          </Card>
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <Metric label="Clicks" value={referrer.total_clicks} />
                <Metric label="Signups" value={referrer.total_signups} />
                <Metric
                  label="Conversions"
                  value={referrer.lifetime_conversions}
                />
                <Metric label="Pending Payout" value={pendingPayoutDisplay()} />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {referrer && (
        <Card>
          <CardHeader>
            <CardTitle>Referred Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left bg-gray-50">
                    <th className="px-3 py-2">User ID</th>
                    <th className="px-3 py-2">Signup</th>
                    <th className="px-3 py-2">Converted</th>
                    <th className="px-3 py-2">Conversion At</th>
                    <th className="px-3 py-2">Payout Amount</th>
                    <th className="px-3 py-2">Payout Status</th>
                  </tr>
                </thead>
                <tbody>
                  {referredUsers.length === 0 && (
                    <tr>
                      <td className="px-3 py-4 text-gray-500" colSpan={6}>
                        No referred users yet.
                      </td>
                    </tr>
                  )}
                  {referredUsers.map((r) => (
                    <tr key={r.id} className="border-t">
                      <td className="px-3 py-2 font-mono text-xs">
                        {(
                          r as unknown as {
                            anonymized_id?: string;
                            referred_user_id: string;
                          }
                        ).anonymized_id || r.referred_user_id.slice(0, 6) + '…'}
                      </td>
                      <td className="px-3 py-2">{formatDate(r.signup_at)}</td>
                      <td className="px-3 py-2">
                        {r.converted ? 'Yes' : 'No'}
                      </td>
                      <td className="px-3 py-2">
                        {formatDate(r.conversion_at)}
                      </td>
                      <td className="px-3 py-2">
                        {r.payout_amount
                          ? `$${Number(r.payout_amount).toFixed(2)}`
                          : ''}
                      </td>
                      <td className="px-3 py-2">{r.payout_status || ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {total > pageSize && (
              <div className="mt-4 flex items-center gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={page === 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Prev
                </Button>
                <div className="text-xs text-gray-600">
                  Page {page} / {Math.ceil(total / pageSize)}
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={page >= Math.ceil(total / pageSize)}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {loading && <div className="text-sm text-gray-500">Loading…</div>}
    </div>
  );
}

function Metric({
  label,
  value,
}: {
  label: string;
  value: string | number | null | undefined;
}) {
  return (
    <div className="rounded border p-3 bg-white">
      <div className="text-xs uppercase tracking-wide text-gray-500 mb-1">
        {label}
      </div>
      <div className="font-semibold">{value ?? '—'}</div>
    </div>
  );
}

function QRCode({ value }: { value: string }) {
  const dataUrl = useMemo(() => {
    try {
      return QRCodeLib.toDataURL(value, { margin: 1, width: 128 });
    } catch {
      return null;
    }
  }, [value]);
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    (async () => {
      if (typeof dataUrl === 'string') {
        setUrl(dataUrl);
        return;
      }
      try {
        const generated = await QRCodeLib.toDataURL(value, {
          margin: 1,
          width: 128,
        });
        if (active) setUrl(generated);
      } catch {}
    })();
    return () => {
      active = false;
    };
  }, [dataUrl, value]);
  if (!url) return <div className="text-xs text-gray-400">Generating QR…</div>;
  // Using img for data URL; Next/Image optimization not needed for inline QR.
  return (
    <Image
      src={url}
      alt="Referral QR"
      width={128}
      height={128}
      className="border rounded p-1 bg-white"
    />
  );
}
