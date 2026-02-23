/**
 * DEPRECATED: This page has been removed from the signup flow.
 * Payment is now handled entirely by Stripe Checkout (hosted page).
 * 
 * SECURITY NOTICE: This file previously stored raw card data in localStorage (PCI violation).
 * The payment flow now goes: personal-info → confirmation → Stripe Checkout
 * 
 * This file is kept for reference only and should not be linked in the app.
 * TODO: Consider deleting this file entirely.
 */

import { useRouter } from 'next/router';
import { useEffect } from 'react';

export default function PaymentInfoPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to proper flow if someone manually navigates here
    router.push('/personal-info');
  }, [router]);

  return null;
}

/*
 * LEGACY CODE REMOVED - DO NOT RESTORE
 * 
 * Previous PCI compliance violations:
 * - localStorage.setItem(`paymentInfo_${userId}`, JSON.stringify({ cardNumber, cvv, expirationDate }))
 * - Stored full card numbers, CVV, expiration in plain text browser storage
 * - Accessible via browser dev tools
 * - Violates PCI DSS requirement 3.2 (Do not store sensitive authentication data after authorization)
 * 
 * Current secure implementation:
 * - All payment data collected via Stripe Checkout (hosted, PCI-compliant page)
 * - No card data ever touches our client or server code
 * - Tokens only, never raw card details
 */
