import React from 'react';
import Link from 'next/link';

export default function AffiliateOnboardingComplete() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white">
      <h1 className="text-3xl font-bold mb-4">
        Affiliate Onboarding Complete!
      </h1>
      <p className="mb-6 text-lg text-gray-700">
        Thank you for completing your onboarding. Your affiliate account is now
        being reviewed or is active.
      </p>
      <Link
        href="/affiliate-dashboard"
        className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
      >
        Go to Affiliate Dashboard
      </Link>
    </div>
  );
}
