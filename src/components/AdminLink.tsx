import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@/integrations/supabase/client';

export function AdminLink() {
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const router = useRouter();
  const pathname = router?.pathname || '';
  const isAuthPage =
    pathname === '/signin' ||
    pathname === '/signup' ||
    pathname === '/verify-email' ||
    pathname.startsWith('/auth/');
  // Hide on public landing page as requested
  const isLandingPage = pathname === '/';

  // Always fetch a fresh session and avoid caching
  useEffect(() => {
    let cancelled = false;
    const checkAdmin = async () => {
      try {
        // Always get a fresh session
        await supabase.auth.refreshSession();
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const token = session?.access_token;
        // Never cache: add a cache-busting param
        const res = await fetch(`/api/admin/is-admin?cb=${Date.now()}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        if (!res.ok) return;
        const data = (await res.json()) as { isAdmin?: boolean };
        if (!cancelled) setIsAdmin(Boolean(data.isAdmin));
      } catch {
        // ignore
      }
    };
    checkAdmin();
    // Optionally, re-check on focus to keep session fresh
    const onFocus = () => checkAdmin();
    window.addEventListener('focus', onFocus);
    return () => {
      cancelled = true;
      window.removeEventListener('focus', onFocus);
    };
  }, [pathname]);

  if (!isAdmin || isAuthPage || isLandingPage) return null;

  return (
    <div className="fixed top-4 right-4 z-50">
      <Link
        href="/admin/admin-emails"
        className="px-3 py-2 rounded-md text-sm font-medium bg-brand-sky-blue text-white hover:bg-brand-sky-blue-light border border-brand-sky-blue/50 shadow-lg"
      >
        Admin
      </Link>
    </div>
  );
}

export default AdminLink;
