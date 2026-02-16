import { NextResponse } from 'next/server';
import { createAdminClient } from '@/integrations/supabase/admin-client';


async function ensureAdmin(token: string | null): Promise<{ email: string } | null> {
  const admin = createAdminClient();
  const { data } = await admin.auth.getUser(token || undefined);
  const user = data?.user || null;
  const email = user?.email || null;
  if (!email) return null;
  try {
    const { data: isAdminFromTable } = await admin.rpc('is_admin', { p_email: email });
    if (!isAdminFromTable) return null;
    return { email };
  } catch {
    return null;
  }
}


// GET: List all admin emails
export async function GET(req: Request) {
  const token = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '') || null;
  const adminUser = await ensureAdmin(token);
  if (!adminUser) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const admin = createAdminClient();
  const { data, error } = await admin.from('admin_emails').select('email,created_at').order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ items: data || [] });
}

// POST: Add a new admin email
export async function POST(req: Request) {
  const token = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '') || null;
  const adminUser = await ensureAdmin(token);
  if (!adminUser) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const admin = createAdminClient();
  const body = await req.json();
  const email = (body.email || '').trim().toLowerCase();
  if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 });
  const { error } = await admin.from('admin_emails').insert([{ email }]);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

// DELETE: Remove an admin email
export async function DELETE(req: Request) {
  const token = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '') || null;
  const adminUser = await ensureAdmin(token);
  if (!adminUser) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const admin = createAdminClient();
  const body = await req.json();
  const email = (body.email || '').trim().toLowerCase();
  if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 });
  const { error } = await admin.from('admin_emails').delete().eq('email', email);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
