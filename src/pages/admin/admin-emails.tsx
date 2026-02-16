import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

type Item = { email: string; created_at?: string };

export default function AdminEmailsPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const [unauthorized, setUnauthorized] = useState(false);
  const now = new Date();
  const [year, setYear] = useState<number>(now.getFullYear());
  const [month, setMonth] = useState<number>(now.getMonth() + 1);
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(100);
  const [csvLoading, setCsvLoading] = useState<boolean>(false);

  async function getAccessToken(): Promise<string | null> {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token || null;
  }

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await getAccessToken();
      const res = await fetch('/api/admin/admin-emails', {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (res.status === 401 || res.status === 403) {
        setUnauthorized(true);
        throw new Error(await res.text());
      }
      if (!res.ok) throw new Error(await res.text());
      const data = (await res.json()) as { items: Item[] };
      setItems(data.items || []);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to load';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (active) setCurrentUserEmail(user?.email || null);
      if (active) await refresh();
    })();
    return () => {
      active = false;
    };
  }, [refresh]);

  async function addEmail() {
    const value = email.trim().toLowerCase();
    if (!value) return;
    setLoading(true);
    setError(null);
    try {
      const token = await getAccessToken();
      const res = await fetch('/api/admin/admin-emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ email: value }),
      });
      if (!res.ok) throw new Error(await res.text());
      setEmail('');
      await refresh();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to add';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  async function removeEmail(value: string) {
    setLoading(true);
    setError(null);
    try {
      const token = await getAccessToken();
      const res = await fetch('/api/admin/admin-emails', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ email: value }),
      });
      if (!res.ok) throw new Error(await res.text());
      await refresh();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to remove';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  async function downloadCsvWith(y: number, m: number, p: number, ps: number) {
    setLoading(true);
    setCsvLoading(true);
    setError(null);
    try {
      const token = await getAccessToken();
      const params = new URLSearchParams({ year: String(y), month: String(m) });
      if (p && p > 0) params.set('page', String(p));
      if (ps && ps > 0) params.set('pageSize', String(ps));
      const url = `/api/admin/reports/monthly-csv?${params.toString()}`;
      const res = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (res.status === 401 || res.status === 403) {
        setUnauthorized(true);
        throw new Error(await res.text());
      }
      if (!res.ok) throw new Error(await res.text());
      const blob = await res.blob();
      const fname = `monthly-report-${y}-${String(m).padStart(2, '0')}.csv`;
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = fname;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(link.href), 1000);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to download CSV';
      setError(msg);
    } finally {
      setLoading(false);
      setCsvLoading(false);
    }
  }

  async function downloadCsv() {
    return downloadCsvWith(year, month, page, pageSize);
  }

  async function downloadLastMonth() {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    // Update UI to reflect what we are downloading
    setYear(y);
    setMonth(m);
    return downloadCsvWith(y, m, page, pageSize);
  }

  async function downloadCurrentMonth() {
    const d = new Date();
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    setYear(y);
    setMonth(m);
    return downloadCsvWith(y, m, page, pageSize);
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Admin Emails</h1>
      {currentUserEmail && (
        <div className="mb-3 text-sm text-gray-600">
          Logged in as <span className="font-medium">{currentUserEmail}</span>{' '}
          {unauthorized && (
            <span className="text-red-600 font-semibold">(not an admin)</span>
          )}
        </div>
      )}
      <p className="text-sm text-muted-foreground mb-4">
        Only these emails are allowed to access admin endpoints (CSV, etc.).
      </p>

      {/* Link to Referral Payouts Admin */}
      <div className="mb-6">
        <Button
          asChild
          className="px-4 py-2 bg-brand-sky-blue text-white rounded hover:bg-brand-sky-blue-light transition-colors font-semibold shadow"
        >
          <Link href="/admin/referral-payouts">
            Go to Referral Payouts Admin
          </Link>
        </Button>
      </div>

      {/* CSV Download Controls */}
      <div className="mb-6 rounded-md border p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs text-gray-600 mb-1">Year</label>
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value || '0', 10))}
              className="w-28 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
              min={2000}
              max={9999}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Month</label>
            <input
              type="number"
              value={month}
              onChange={(e) => setMonth(parseInt(e.target.value || '0', 10))}
              className="w-24 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
              min={1}
              max={12}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Page</label>
            <input
              type="number"
              value={page}
              onChange={(e) =>
                setPage(Math.max(1, parseInt(e.target.value || '1', 10)))
              }
              className="w-24 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
              min={1}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">
              Page Size
            </label>
            <input
              type="number"
              value={pageSize}
              onChange={(e) =>
                setPageSize(Math.max(1, parseInt(e.target.value || '1', 10)))
              }
              className="w-28 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
              min={1}
            />
          </div>
          <Button onClick={downloadCsv} disabled={loading || unauthorized}>
            Download CSV
          </Button>
          <Button
            variant="secondary"
            onClick={downloadLastMonth}
            disabled={loading || unauthorized}
          >
            Last Month
          </Button>
          <Button
            variant="secondary"
            onClick={downloadCurrentMonth}
            disabled={loading || unauthorized}
          >
            Current Month
          </Button>
        </div>
        <p className="mt-2 text-xs text-gray-500">
          Exports the monthly admin CSV for the selected year and month.
        </p>
        {csvLoading && (
          <div className="mt-3 flex items-center gap-2 text-xs text-gray-600">
            <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
            <span>Generating CSV…</span>
          </div>
        )}
      </div>

      <div className="flex gap-2 mb-4">
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="name@example.com"
          className="flex-1 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
        />
        <Button onClick={addEmail} disabled={loading || !email.trim()}>
          Add
        </Button>
      </div>

      {error && <div className="mb-3 text-sm text-red-600">{error}</div>}

      <div className="rounded-md border">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left">
              <th className="px-3 py-2">Email</th>
              <th className="px-3 py-2">Added</th>
              <th className="px-3 py-2 w-24">Actions</th>
            </tr>
          </thead>
          <tbody>
            {!unauthorized && items.length === 0 && (
              <tr>
                <td className="px-3 py-3 text-gray-500" colSpan={3}>
                  No admin emails yet.
                </td>
              </tr>
            )}
            {unauthorized && (
              <tr>
                <td className="px-3 py-3 text-red-600" colSpan={3}>
                  You are not authorized. Add your email to admin_emails in the
                  database or set ADMIN_EMAILS env and restart.
                </td>
              </tr>
            )}
            {items.map((it) => (
              <tr key={it.email} className="border-t">
                <td className="px-3 py-2">{it.email}</td>
                <td className="px-3 py-2">
                  {it.created_at?.slice(0, 19) || ''}
                </td>
                <td className="px-3 py-2">
                  <Button
                    variant="destructive"
                    onClick={() => removeEmail(it.email)}
                    disabled={loading}
                  >
                    Remove
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Sign Out Button */}
      {currentUserEmail && (
        <div className="mb-4 flex justify-end">
          <Button
            variant="outline"
            className="border-brand-sky-blue/30 text-brand-sky-blue hover:bg-brand-sky-blue/10 hover:text-brand-sky-blue-light"
            onClick={async () => {
              await supabase.auth.signOut();
              window.location.href = '/';
            }}
          >
            Sign Out
          </Button>
        </div>
      )}
    </div>
  );
}
