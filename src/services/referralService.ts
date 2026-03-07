import { supabase } from '@/integrations/supabase/client';

// Client-side helper (uses RLS policies) for referral interactions.
// Sensitive operations (aggregation, clicks logging) are server-side via API routes.

export async function getMyReferrer() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;
  const { data, error } = await supabase
    .from('profiles')
    .select('id, referral_code, is_affiliate')
    .eq('id', session.user.id)
    .maybeSingle();
  if (error) return null;
  return data;
}

export async function ensureReferrer(): Promise<{ referral_code: string; link: string } | null> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;
  const token = session.access_token;
  const res = await fetch('/api/referrer/create', { method: 'POST', headers: { Authorization: `Bearer ${token}` } }); // This endpoint will be patched to use 'profiles'
  if (!res.ok) return null;
  return res.json();
}

export function buildReferralLink(code: string) {
  const base = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  return `${base}/?ref=${encodeURIComponent(code)}`;
}

export async function attachReferralIfPresent() {
  // Called after signup flow completes client-side.
  const params = new URLSearchParams(window.location.search);
  const code = params.get('ref');
  if (!code) return { attached: false };
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return { attached: false };
  const userId = session.user.id;
  const res = await fetch('/api/referral/attach', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
    body: JSON.stringify({ referralCode: code, userId })
  });
  if (!res.ok) return { attached: false };
  return res.json();
}

export async function markConverted() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return { converted: false };
  const res = await fetch('/api/referral/convert', { method: 'POST', headers: { Authorization: `Bearer ${session.access_token}` } });
  if (!res.ok) return { converted: false };
  return res.json();
}

export async function fetchReferredUsers(page = 1, pageSize = 25) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return { items: [], page, pageSize, total: 0 };
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
  const res = await fetch(`/api/referrer/referred-users?${params.toString()}`, {
    headers: { Authorization: `Bearer ${session.access_token}` },
  });
  if (!res.ok) return { items: [], page, pageSize, total: 0 };
  return res.json();
}

export async function fetchReferrerStats() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;
  const res = await fetch('/api/referrer/me', { headers: { Authorization: `Bearer ${session.access_token}` } });
  if (!res.ok) return null;
  return res.json();
}
