import { NextResponse } from 'next/server';

export async function GET() {
  // ...existing logic from old handler...
  return NextResponse.json({ migrated: true });
}
