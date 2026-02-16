//deprecated page replaced it with affiliate-application.tsx
import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/router';
import { profileService } from '@/services/profileService';
import { authService } from '@/services/authService';

export default function BecomeAffiliatePage() {
  const { toast } = useToast();
  const router = useRouter();
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    dob: '',
    ssn_last_four: '',
    address: '',
    address2: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'US',
    phone: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [showSSN, setShowSSN] = useState(false);

  useEffect(() => {
    async function backfillForm() {
      // Require Supabase auth
      const user = await authService.getCurrentUser();
      console.log('[Affiliate] Current user:', user);
      if (!user || !user.id) {
        setAuthError(
          'You must be signed in to apply as an affiliate. Please sign in and try again.'
        );
        setTimeout(() => {
          router.replace('/signin?redirect=/become-affiliate');
        }, 2000);
        return;
      }
      const updates: Partial<typeof form> = {};
      updates.email = user.email || '';

      // Fetch profile
      const profile = await profileService.getProfile(user.id);
      console.log('[Affiliate] Profile:', profile);
      if (profile) {
        // Use first_name and last_name if available
        if (profile.first_name) {
          updates.first_name = profile.first_name;
        }
        if (profile.last_name) {
          updates.last_name = profile.last_name;
        }
        // Fallback to full_name if needed
        if ((!updates.first_name || !updates.last_name) && profile.full_name) {
          const names = profile.full_name.split(' ');
          updates.first_name = updates.first_name || names[0] || '';
          updates.last_name =
            updates.last_name || names.slice(1).join(' ') || '';
        }
        updates.phone = profile.phone || updates.phone || '';
        updates.address = profile.address || updates.address || '';
        updates.address2 = profile.address2 || updates.address2 || '';
        updates.city = profile.city || updates.city || '';
        updates.state = profile.state || updates.state || '';
        updates.postal_code = profile.postal_code || updates.postal_code || '';
        updates.website = profile.website || updates.website || '';
      }

      // Fetch personal info
      const personalInfo = await profileService.getPersonalInfo(user.id);
      console.log('[Affiliate] Personal info:', personalInfo);
      if (personalInfo) {
        updates.firstName = personalInfo.first_name || updates.firstName || '';
        updates.lastName = personalInfo.last_name || updates.lastName || '';
        updates.dob = personalInfo.date_of_birth || '';
        updates.street = personalInfo.address || updates.street || '';
        updates.city = personalInfo.city || updates.city || '';
        updates.state = personalInfo.state || updates.state || '';
        updates.zip = personalInfo.zip_code || updates.zip || '';
        updates.country = personalInfo.country || updates.country || 'US';
        updates.ssnLast4 = personalInfo.ssn_last_four || '';
        updates.phone = personalInfo.phone || updates.phone || '';
      }

      console.log('[Affiliate] Backfill updates:', updates);
      setForm((prev) => ({ ...prev, ...updates }));
    }
    backfillForm();
  }, [router]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Removed handleSocialCheckbox and handleSocialUrlChange

  // Email validation helper
  const validateEmail = (email: string) => {
    return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
  };

  // US ZIP code validation helper
  const validateZip = (zip: string) => {
    return /^\d{5}(-\d{4})?$/.test(zip);
  };

  // US state abbreviation validation helper
  const validateState = (state: string) => {
    return /^[A-Z]{2}$/.test(state.trim().toUpperCase());
  };

  // Address validation helper
  const validateAddress = (form: typeof form) => {
    return (
      form.address.trim() !== '' &&
      form.city.trim() !== '' &&
      validateState(form.state) &&
      validateZip(form.postal_code) &&
      form.country.trim() !== ''
    );
  };

  // Duplicate email check
  const checkEmailDuplicate = async (email: string) => {
    const res = await fetch('/api/affiliate/check-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    return data.exists === true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    // Guard: Ensure user is authenticated before submit
    const user = await authService.getCurrentUser();
    if (!user || !user.id) {
      toast({
        title: 'Not signed in',
        description:
          'You must be signed in to submit an affiliate application.',
        variant: 'destructive',
      });
      setSubmitting(false);
      return;
    }
    // Validate required Stripe fields
    if (!form.firstName.trim() || !form.lastName.trim()) {
      toast({
        title: 'Missing Name',
        description: 'First and last name are required.',
        variant: 'destructive',
      });
      setSubmitting(false);
      return;
    }
    if (!form.email.trim() || !validateEmail(form.email)) {
      toast({
        title: 'Invalid Email',
        description: 'A valid email is required.',
        variant: 'destructive',
      });
      setSubmitting(false);
      return;
    }
    if (!form.dob.trim()) {
      toast({
        title: 'Missing DOB',
        description: 'Date of birth is required.',
        variant: 'destructive',
      });
      setSubmitting(false);
      return;
    }
    if (!form.ssnLast4.trim()) {
      toast({
        title: 'Missing SSN',
        description: 'SSN last 4 digits are required.',
        variant: 'destructive',
      });
      setSubmitting(false);
      return;
    }
    if (!form.phone.trim()) {
      toast({
        title: 'Missing Phone',
        description: 'Phone number is required.',
        variant: 'destructive',
      });
      setSubmitting(false);
      return;
    }
    if (!validateAddress(form)) {
      toast({
        title: 'Invalid Address',
        description: 'A valid address is required.',
        variant: 'destructive',
      });
      setSubmitting(false);
      return;
    }
    // Removed payoutType and socials validation
    // Check for duplicate email
    if (await checkEmailDuplicate(form.email)) {
      toast({
        title: 'Email Already Registered',
        description:
          'This email is already associated with an affiliate account.',
        variant: 'destructive',
      });
      setSubmitting(false);
      return;
    }
    try {
      // Require Supabase auth and get user ID
      // Map frontend fields to backend keys, include user.id
      const payload = {
        id: user.id,
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email,
        dob: form.dob,
        ssn_last_four: form.ssn_last_four,
        address: form.address,
        address2: form.address2,
        city: form.city,
        state: form.state,
        postal_code: form.postal_code,
        country: form.country,
        phone: form.phone,
      };
      console.log('[Affiliate] Submit payload:', payload);
      const res = await fetch('/api/affiliate/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to submit application');
      }
      toast({
        title: 'Application submitted!',
        description:
          'Your affiliate status is now Pending. Please add a Stripe account to activate.',
      });
      setForm({
        first_name: '',
        last_name: '',
        email: '',
        dob: '',
        ssn_last_four: '',
        address: '',
        address2: '',
        city: '',
        state: '',
        postal_code: '',
        country: 'US',
        phone: '',
      });
      router.push('/affiliate-success');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-b from-brand-midnight via-brand-charcoal to-brand-midnight">
      {authError && (
        <div className="fixed top-0 left-0 w-full z-50 flex justify-center">
          <div className="bg-red-600 text-white px-6 py-3 rounded-b shadow-lg font-semibold">
            {authError}
          </div>
        </div>
      )}
      {/* Remove Affiliate Status display above header */}
      {/* <div className="absolute top-4 left-0 w-full flex justify-center z-20">
        <div className="px-4 py-2 rounded bg-brand-sky-blue text-white font-semibold shadow-lg inline-block">
          Affiliate Status: {affiliateStatus}
        </div>
      </div> */}
      <div className="absolute inset-0 bg-gradient-radial from-brand-sky-blue/5 via-transparent to-transparent opacity-50" />
      <div className="relative z-10 min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-lg border-brand-sky-blue/20 bg-brand-charcoal/70 backdrop-blur-xl shadow-2xl shadow-brand-sky-blue/10">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center text-white">
              Become a TakeOff Affiliate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="flex gap-4">
                <Input
                  name="first_name"
                  placeholder="First Name"
                  value={form.first_name}
                  onChange={handleChange}
                  className="bg-transparent text-white"
                />
                <Input
                  name="last_name"
                  placeholder="Last Name"
                  value={form.last_name}
                  onChange={handleChange}
                  className="bg-transparent text-white"
                />
              </div>
              <Input
                name="email"
                type="email"
                placeholder="Email"
                value={form.email}
                onChange={handleChange}
                className="bg-transparent text-white"
                disabled
              />
              <Input
                name="dob"
                type="date"
                value={form.dob}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 rounded bg-brand-midnight text-white"
              />
              <p className="text-xs text-brand-sky-blue mt-1">
                Format: MM/DD/YYYY
              </p>
              <div className="relative">
                <Input
                  name="ssn_last_four"
                  type={showSSN ? 'text' : 'password'}
                  placeholder="SSN Last 4 Digits"
                  value={form.ssn_last_four}
                  onChange={handleChange}
                  required
                  className="bg-transparent text-white pr-16"
                  maxLength={4}
                />
                <button
                  type="button"
                  onClick={() => setShowSSN((prev) => !prev)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 text-xs font-semibold rounded bg-brand-sky-blue text-brand-midnight shadow hover:bg-brand-sky-blue/90 focus:outline focus:outline-2 focus:outline-brand-sky-blue"
                  tabIndex={0}
                  aria-label={showSSN ? 'Hide SSN' : 'Show SSN'}
                >
                  {showSSN ? 'Hide' : 'Show'}
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  name="address"
                  placeholder="Street Address"
                  value={form.address}
                  onChange={handleChange}
                  className="bg-transparent text-white"
                />
                <Input
                  name="address2"
                  type="text"
                  placeholder="Apt, Suite, Unit (optional)"
                  value={form.address2}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded bg-brand-midnight text-white mb-2"
                />
                <Input
                  name="city"
                  placeholder="City"
                  value={form.city}
                  onChange={handleChange}
                  className="bg-transparent text-white"
                />
                <Input
                  name="state"
                  placeholder="State"
                  value={form.state}
                  onChange={handleChange}
                  className="bg-transparent text-white"
                />
                <Input
                  name="postal_code"
                  placeholder="Postal Code"
                  value={form.postal_code}
                  onChange={handleChange}
                  className="bg-transparent text-white"
                />
                <Input
                  name="country"
                  placeholder="Country"
                  value={form.country}
                  onChange={handleChange}
                  className="bg-transparent text-white"
                />
              </div>
              {/* Removed website, socials, subscriberMethod, payoutType fields */}
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-brand-sky-blue to-brand-sky-blue-light text-white"
                disabled={submitting}
              >
                {submitting ? 'Submitting...' : 'Submit Application'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
