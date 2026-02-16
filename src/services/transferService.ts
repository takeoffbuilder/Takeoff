// transferService.ts
// Client-side helper for triggering Stripe Connect transfers via backend API

export async function createTransfer({ amount, destination, currency = 'usd', description }) {
  const res = await fetch('/api/stripe/transfer', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount, destination, currency, description }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to create transfer');
  }
  return res.json();
}
