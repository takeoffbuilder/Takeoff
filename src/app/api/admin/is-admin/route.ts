import { NextResponse } from 'next/server';
import { createAdminClient } from '@/integrations/supabase/admin-client';

function isAdminByEnv(email?: string | null): boolean {
  const allowed = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  if (!allowed.length) return false;
  return !!email && allowed.includes(email.toLowerCase());
}

export async function GET(req: Request) {
  try {
    const admin = createAdminClient();
    const token = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '') || null;
    const { data: userResp } = await admin.auth.getUser(token || undefined);
    const email = userResp?.user?.email ?? null;

    let allowed = false;
    if (email) {
      try {
        const { data } = await admin.rpc('is_admin', { p_email: email });
        allowed = Boolean(data);
      } catch {
        allowed = false;
      }
    }
    if (!allowed) {
      allowed = isAdminByEnv(email);
    }

    return NextResponse.json({ isAdmin: allowed });
  } catch {
    return NextResponse.json({ isAdmin: false });
  }
}
