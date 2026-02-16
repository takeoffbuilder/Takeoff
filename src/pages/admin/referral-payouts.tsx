import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';

interface PayoutRow {
  id: string;
  referral_code: string;
  referred_user_id: string;
  anonymized_id: string;
  signup_at: string;
  converted: boolean;
  conversion_at?: string | null;
  payout_amount?: number | null;
  payout_status: string;
  paid_at?: string | null;
  plan_slug?: string | null;
}

export default function ReferralPayoutsAdminPage() {
  const [rows, setRows] = useState<PayoutRow[]>([]);
  const [statusFilter, setStatusFilter] = useState('pending,approved');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(50);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  async function getAccessToken(): Promise<string | null> {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token || null;
  }

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const token = await getAccessToken();
      const params = new URLSearchParams({
        status: statusFilter,
        page: String(page),
        pageSize: String(pageSize),
      });
      const res = await fetch(
        `/api/admin/referrer/payouts?${params.toString()}`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        }
      );
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setRows(data.items || []);
      setTotal(data.total || 0);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load payouts');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, page]);

  function fmtDate(d?: string | null) {
    return d ? d.slice(0, 10) : '';
  }

  async function doAction(
    referred_user_id: string,
    action: 'approve' | 'pay' | 'reject'
  ) {
    setActionLoading(referred_user_id + ':' + action);
    try {
      const token = await getAccessToken();
      const res = await fetch('/api/referrer/payout/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ referred_user_id, action }),
      });
      if (!res.ok) throw new Error(await res.text());
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Action failed');
    } finally {
      setActionLoading(null);
    }
  }

  const pages = Math.ceil(total / pageSize);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Referral Payouts</h1>
      {error && <div className="text-sm text-red-600">{error}</div>}
      {/* Link to Admin Emails */}
      <div className="mb-6">
        <Button
          asChild
          className="px-4 py-2 bg-brand-sky-blue text-white rounded hover:bg-brand-sky-blue-light transition-colors font-semibold shadow"
        >
          <Link href="/admin/admin-emails">Back to Admin Emails</Link>
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Pending / Approved Payouts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3 items-end">
            <div>
              <label className="block text-xs text-gray-600 mb-1">
                Statuses
              </label>
              <input
                className="w-64 rounded border px-3 py-2 text-sm"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                placeholder="pending,approved"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Page</label>
              <input
                type="number"
                className="w-24 rounded border px-3 py-2 text-sm"
                value={page}
                min={1}
                onChange={(e) =>
                  setPage(Math.max(1, parseInt(e.target.value || '1', 10)))
                }
              />
            </div>
            <Button
              variant="secondary"
              onClick={() => load()}
              disabled={loading}
            >
              Refresh
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="px-3 py-2">Anon User</th>
                  <th className="px-3 py-2">Signup</th>
                  <th className="px-3 py-2">Converted</th>
                  <th className="px-3 py-2">Conversion</th>
                  <th className="px-3 py-2">Plan</th>
                  <th className="px-3 py-2">Amount</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Paid At</th>
                  <th className="px-3 py-2 w-48">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr>
                    <td className="px-3 py-4 text-gray-500" colSpan={9}>
                      No rows
                    </td>
                  </tr>
                )}
                {rows.map((r) => (
                  <tr key={r.id} className="border-t">
                    <td className="px-3 py-2 font-mono text-xs">
                      {r.anonymized_id}
                    </td>
                    <td className="px-3 py-2">{fmtDate(r.signup_at)}</td>
                    <td className="px-3 py-2">{r.converted ? 'Yes' : 'No'}</td>
                    <td className="px-3 py-2">{fmtDate(r.conversion_at)}</td>
                    <td className="px-3 py-2">{r.plan_slug || ''}</td>
                    <td className="px-3 py-2">
                      {r.payout_amount
                        ? `$${Number(r.payout_amount).toFixed(2)}`
                        : ''}
                    </td>
                    <td className="px-3 py-2">{r.payout_status}</td>
                    <td className="px-3 py-2">{fmtDate(r.paid_at)}</td>
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          disabled={actionLoading !== null}
                          onClick={() =>
                            doAction(r.referred_user_id, 'approve')
                          }
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          disabled={actionLoading !== null}
                          onClick={() => doAction(r.referred_user_id, 'reject')}
                        >
                          Reject
                        </Button>
                        <Button
                          size="sm"
                          disabled={actionLoading !== null}
                          onClick={() => doAction(r.referred_user_id, 'pay')}
                        >
                          Pay
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {/* Example dummy row for illustration */}
                <tr className="border-t bg-yellow-50">
                  <td className="px-3 py-2 font-mono text-xs">anon1234</td>
                  <td className="px-3 py-2">2026-01-01</td>
                  <td className="px-3 py-2">Yes</td>
                  <td className="px-3 py-2">2026-01-02</td>
                  <td className="px-3 py-2">starter_boost</td>
                  <td className="px-3 py-2">$10.00</td>
                  <td className="px-3 py-2">approved</td>
                  <td className="px-3 py-2"></td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="secondary" disabled>
                        Approve
                      </Button>
                      <Button size="sm" variant="secondary" disabled>
                        Reject
                      </Button>
                      <Button size="sm" disabled>
                        Pay
                      </Button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          {pages > 1 && (
            <div className="mt-4 flex items-center gap-3">
              <Button
                size="sm"
                variant="secondary"
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Prev
              </Button>
              <div className="text-xs text-gray-600">
                Page {page} / {pages}
              </div>
              <Button
                size="sm"
                variant="secondary"
                disabled={page >= pages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          )}
          {loading && <div className="text-xs text-gray-500">Loading…</div>}
        </CardContent>
      </Card>
    </div>
  );
}
