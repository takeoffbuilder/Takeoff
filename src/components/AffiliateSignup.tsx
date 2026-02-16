import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export default function AffiliateSignup() {
  const { toast } = useToast();
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    dob: '',
    ssnLast4: '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'US',
    website: '',
    instagram: '',
    youtube: '',
    facebook: '',
    tiktok: '',
    subscriberMethod: '',
    payoutType: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Always use auth.users.id as user_id for user_personal_info and affiliate flows
      const res = await fetch('/api/affiliate/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id, // <-- always use this for DB foreign key
          first_name: form.firstName,
          last_name: form.lastName,
          email: form.email,
          dob: form.dob,
          ssn_last_4: form.ssnLast4,
          address: form.address,
          city: form.city,
          state: form.state,
          postal_code: form.postalCode,
          country: form.country,
          website: form.website,
          instagram: form.instagram,
          youtube: form.youtube,
          facebook: form.facebook,
          tiktok: form.tiktok,
          subscriber_method: form.subscriberMethod,
          payout_type: form.payoutType,
        }),
      });
      const data = await res.json();
      if (res.ok && data.url) {
        toast({
          title: 'Affiliate Registration Started',
          description: 'Redirecting to Stripe onboarding...',
          duration: 4000,
        });
        window.location.href = data.url;
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Could not start affiliate registration.',
          variant: 'destructive',
          duration: 4000,
        });
      }
    } catch (error: unknown) {
      let message = 'Could not start affiliate registration.';
      if (error instanceof Error) message = error.message;
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
        duration: 4000,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-white mb-1">First Name</label>
          <input
            name="firstName"
            type="text"
            required
            className="w-full px-3 py-2 rounded bg-brand-midnight/50 text-white border border-green-500/20"
            value={form.firstName}
            onChange={handleChange}
          />
        </div>
        <div>
          <label className="block text-white mb-1">Last Name</label>
          <input
            name="lastName"
            type="text"
            required
            className="w-full px-3 py-2 rounded bg-brand-midnight/50 text-white border border-green-500/20"
            value={form.lastName}
            onChange={handleChange}
          />
        </div>
        <div>
          <label className="block text-white mb-1">Email</label>
          <input
            name="email"
            type="email"
            required
            className="w-full px-3 py-2 rounded bg-brand-midnight/50 text-white border border-green-500/20"
            value={form.email}
            onChange={handleChange}
          />
        </div>
        <div>
          <label className="block text-white mb-1">Date of Birth</label>
          <input
            name="dob"
            type="date"
            required
            className="w-full px-3 py-2 rounded bg-brand-midnight/50 text-white border border-green-500/20"
            value={form.dob}
            onChange={handleChange}
          />
        </div>
        <div>
          <label className="block text-white mb-1">Last 4 of SSN</label>
          <input
            name="ssnLast4"
            type="text"
            required
            maxLength={4}
            pattern="[0-9]{4}"
            className="w-full px-3 py-2 rounded bg-brand-midnight/50 text-white border border-green-500/20"
            value={form.ssnLast4}
            onChange={handleChange}
          />
        </div>
        <div>
          <label className="block text-white mb-1">Address</label>
          <input
            name="address"
            type="text"
            required
            className="w-full px-3 py-2 rounded bg-brand-midnight/50 text-white border border-green-500/20"
            value={form.address}
            onChange={handleChange}
          />
        </div>
        <div>
          <label className="block text-white mb-1">City</label>
          <input
            name="city"
            type="text"
            required
            className="w-full px-3 py-2 rounded bg-brand-midnight/50 text-white border border-green-500/20"
            value={form.city}
            onChange={handleChange}
          />
        </div>
        <div>
          <label className="block text-white mb-1">State</label>
          <input
            name="state"
            type="text"
            required
            className="w-full px-3 py-2 rounded bg-brand-midnight/50 text-white border border-green-500/20"
            value={form.state}
            onChange={handleChange}
          />
        </div>
        <div>
          <label className="block text-white mb-1">Postal Code</label>
          <input
            name="postalCode"
            type="text"
            required
            className="w-full px-3 py-2 rounded bg-brand-midnight/50 text-white border border-green-500/20"
            value={form.postalCode}
            onChange={handleChange}
          />
        </div>
        <div>
          <label className="block text-white mb-1">Country</label>
          <input
            name="country"
            type="text"
            required
            className="w-full px-3 py-2 rounded bg-brand-midnight/50 text-white border border-green-500/20"
            value={form.country}
            onChange={handleChange}
          />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-white mb-1">Website</label>
          <input
            name="website"
            type="text"
            className="w-full px-3 py-2 rounded bg-brand-midnight/50 text-white border border-green-500/20"
            value={form.website}
            onChange={handleChange}
          />
        </div>
        <div>
          <label className="block text-white mb-1">Instagram</label>
          <input
            name="instagram"
            type="text"
            className="w-full px-3 py-2 rounded bg-brand-midnight/50 text-white border border-green-500/20"
            value={form.instagram}
            onChange={handleChange}
          />
        </div>
        <div>
          <label className="block text-white mb-1">YouTube</label>
          <input
            name="youtube"
            type="text"
            className="w-full px-3 py-2 rounded bg-brand-midnight/50 text-white border border-green-500/20"
            value={form.youtube}
            onChange={handleChange}
          />
        </div>
        <div>
          <label className="block text-white mb-1">Facebook</label>
          <input
            name="facebook"
            type="text"
            className="w-full px-3 py-2 rounded bg-brand-midnight/50 text-white border border-green-500/20"
            value={form.facebook}
            onChange={handleChange}
          />
        </div>
        <div>
          <label className="block text-white mb-1">TikTok</label>
          <input
            name="tiktok"
            type="text"
            className="w-full px-3 py-2 rounded bg-brand-midnight/50 text-white border border-green-500/20"
            value={form.tiktok}
            onChange={handleChange}
          />
        </div>
        <div>
          <label className="block text-white mb-1">Subscriber Method</label>
          <input
            name="subscriberMethod"
            type="text"
            className="w-full px-3 py-2 rounded bg-brand-midnight/50 text-white border border-green-500/20"
            value={form.subscriberMethod}
            onChange={handleChange}
          />
        </div>
        <div>
          <label className="block text-white mb-1">Payout Method</label>
          <select
            name="payoutType"
            className="w-full px-3 py-2 rounded bg-brand-midnight/50 text-white border border-green-500/20"
            value={form.payoutType}
            onChange={handleChange}
            required
          >
            <option value="">Select...</option>
            <option value="bank">Bank Transfer (ACH)</option>
            <option value="debit">Debit Card (Instant)</option>
          </select>
          <p className="text-xs text-gray-400 mt-2">
            Choose how you want to receive payouts. Bank Transfer (ACH) deposits
            to your bank account, Debit Card payouts are instant to your card.
          </p>
        </div>
      </div>
      <div className="text-center pt-6">
        <Button
          type="submit"
          disabled={submitting}
          size="lg"
          className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg shadow-green-500/30 px-12 py-6 text-lg disabled:opacity-50"
        >
          {submitting ? 'Registering...' : 'Become an Affiliate Now'}
        </Button>
      </div>
    </form>
  );
}
