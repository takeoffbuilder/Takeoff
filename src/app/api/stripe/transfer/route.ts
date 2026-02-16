import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';

export async function POST(req: Request) {
  try {
    const { amount, destination, currency = 'usd', description } = await req.json();
    if (!amount || !destination) {
      return NextResponse.json({ error: 'Missing amount or destination' }, { status: 400 });
    }

    // Amount must be in cents (integer)
    const transfer = await stripe.transfers.create({
      amount: Math.round(Number(amount)),
      currency,
      destination,
      description,
    });

    return NextResponse.json({ success: true, transfer });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error('Stripe transfer API error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
