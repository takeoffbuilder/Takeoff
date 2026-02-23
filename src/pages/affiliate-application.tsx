import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { authService } from '@/services/authService';
import AddressAutocomplete from '@/components/AddressAutocomplete';

export default function AffiliateApplicationPage() {
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    dob: '', // MM/DD/YYYY
    phone: '',
    ssn_last_four: '',
    address: '',
    address2: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'US',
    email: '',
  });
  const [showSSN, setShowSSN] = useState(false);
  // Address validation helper (ported from become-affiliate)
  const validateState = (state: string) =>
    /^[A-Z]{2}$/.test(state.trim().toUpperCase());
  const validateZip = (zip: string) => /^\d{5}(-\d{4})?$/.test(zip);
  const validateAddress = (form: typeof form) => {
    if (!form.address.trim()) return 'Street address is required.';
    if (!form.city.trim()) return 'City is required.';
    if (!validateState(form.state)) return 'State must be a 2-letter code.';
    if (!validateZip(form.postal_code)) return 'Postal code is invalid.';
    if (!form.country.trim()) return 'Country is required.';
    return '';
  };

  // MM/DD/YYYY validation
  // US phone validation
  const validatePhone = (phone: string) => {
    // Accept (xxx) xxx-xxxx, xxx-xxx-xxxx, xxx.xxx.xxxx, xxx xxx xxxx, or just digits
    return /^(\(\d{3}\)\s?|\d{3}[-.\s]?)\d{3}[-.\s]?\d{4}$/.test(phone.trim());
  };
  const validateDOB = (dob: string) => {
    // Accept MM/DD/YYYY only
    return /^\d{2}\/\d{2}\/\d{4}$/.test(dob.trim());
  };
  // ...existing code...
  useEffect(() => {
    async function fetchEmail() {
      const user = await authService.getCurrentUser();
      if (user && user.email) {
        setForm((prev) => ({ ...prev, email: user.email }));
      }
    }
    fetchEmail();
  }, []);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    if (name === 'dob') {
      // Remove all non-digits
      let digits = value.replace(/[^\d]/g, '');
      // Insert slashes as needed
      if (digits.length > 2)
        digits = digits.slice(0, 2) + '/' + digits.slice(2);
      if (digits.length > 5)
        digits = digits.slice(0, 5) + '/' + digits.slice(5);
      // Limit to 10 chars (MM/DD/YYYY)
      digits = digits.slice(0, 10);
      setForm({ ...form, dob: digits });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    // Phone validation
    if (!validatePhone(form.phone)) {
      setError(
        'Phone number must be valid (e.g., (123) 456-7890 or 123-456-7890).'
      );
      setSubmitting(false);
      return;
    }
    e.preventDefault();
    setSubmitting(true);
    setError('');
    // Address validation
    const addressError = validateAddress(form);
    if (addressError) {
      setError(addressError);
      setSubmitting(false);
      return;
    }
    // DOB validation
    if (!validateDOB(form.dob)) {
      setError('Date of birth must be in MM/DD/YYYY format.');
      setSubmitting(false);
      return;
    }
    // Validate DOB for 18+
    const [month, day, year] = form.dob.split('/').map(Number);
    const dobDate = new Date(year, month - 1, day);
    const today = new Date();
    let age = today.getFullYear() - dobDate.getFullYear();
    const m = today.getMonth() - dobDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dobDate.getDate())) {
      age--;
    }
    if (isNaN(age) || age < 18) {
      setError('You must be at least 18 years old to apply.');
      setSubmitting(false);
      return;
    }
    // Validate phone number (US 10 digits)
    const phonePattern = /^\d{10}$/;
    if (!phonePattern.test(form.phone.replace(/\D/g, ''))) {
      setError('Phone number must be 10 digits.');
      setSubmitting(false);
      return;
    }
    try {
      console.log('Affiliate application form submission', form);
      const res = await fetch('/api/affiliate/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error('Failed to submit application');
      const { onboardingUrl } = await res.json();
      // Redirect user to Stripe onboarding
      window.location.href = onboardingUrl;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-brand-midnight via-brand-charcoal to-brand-midnight">
      <form
        onSubmit={handleSubmit}
        className="bg-brand-charcoal/80 rounded-xl shadow-lg p-8 max-w-md w-full text-center space-y-6"
      >
        <h1 className="text-2xl font-bold text-brand-sky-blue mb-2">
          Affiliate Application
        </h1>
        <input
          id="email"
          name="email"
          type="email"
          placeholder="Email (verified)"
          value={form.email}
          disabled
          autoComplete="email"
          className="w-full px-4 py-2 rounded bg-brand-midnight text-white mb-2 opacity-70 cursor-not-allowed"
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <input
            id="first_name"
            name="first_name"
            type="text"
            placeholder="First Name"
            value={form.first_name}
            onChange={handleChange}
            required
            autoComplete="given-name"
            className="w-full px-4 py-2 rounded bg-brand-midnight text-white mb-2"
          />
          <input
            id="last_name"
            name="last_name"
            type="text"
            placeholder="Last Name"
            value={form.last_name}
            onChange={handleChange}
            required
            autoComplete="family-name"
            className="w-full px-4 py-2 rounded bg-brand-midnight text-white mb-2"
          />
        </div>
        <div className="mb-2">
          <input
            id="dob"
            name="dob"
            type="text"
            placeholder="MM/DD/YYYY"
            value={form.dob}
            onChange={handleChange}
            required
            autoComplete="bday"
            pattern="\d{2}/\d{2}/\d{4}"
            title="MM/DD/YYYY"
            className="w-full px-4 py-2 rounded bg-brand-midnight text-white"
          />
          <p className="text-xs text-brand-sky-blue mt-1">Format: MM/DD/YYYY</p>
        </div>
        <div className="mb-2">
          <input
            id="phone"
            name="phone"
            type="text"
            placeholder="Phone Number"
            value={form.phone}
            onChange={handleChange}
            required
            autoComplete="tel"
            pattern="(\\(\\d{3}\\)\\s?|\\d{3}[-.\\s]?)\\d{3}[-.\\s]?\\d{4}"
            title="Phone number (e.g., (123) 456-7890 or 123-456-7890)"
            className="w-full px-4 py-2 rounded bg-brand-midnight text-white mb-2"
          />
        </div>
        <div className="relative mb-2">
          <input
            id="ssn_last_four"
            name="ssn_last_four"
            type={showSSN ? 'text' : 'password'}
            placeholder="SSN Last 4 Digits"
            value={form.ssn_last_four}
            onChange={handleChange}
            required
            maxLength={4}
            pattern="\d{4}"
            autoComplete="off"
            className="w-full px-4 py-2 rounded bg-brand-midnight text-white pr-16"
          />
          <button
            type="button"
            onClick={() => setShowSSN(!showSSN)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-brand-sky-blue text-sm hover:underline"
          >
            {showSSN ? 'Hide' : 'Show'}
          </button>
        </div>
        <AddressAutocomplete
          onSelect={({ street, city, state, zip }) => {
            setForm((prev) => ({
              ...prev,
              address: street || prev.address,
              city: city || prev.city,
              state: state || prev.state,
              postal_code: zip || prev.postal_code,
            }));
          }}
        />
        <input
          id="address2"
          name="address2"
          type="text"
          placeholder="Apt, Suite, Unit (optional)"
          value={form.address2}
          onChange={handleChange}
          autoComplete="address-line2"
          className="w-full px-4 py-2 rounded bg-brand-midnight text-white mb-2"
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <input
            id="city"
            name="city"
            type="text"
            placeholder="City"
            value={form.city}
            onChange={handleChange}
            required
            autoComplete="address-level2"
            className="w-full px-4 py-2 rounded bg-brand-midnight text-white mb-2"
          />
          <input
            id="state"
            name="state"
            type="text"
            placeholder="State"
            value={form.state}
            onChange={handleChange}
            required
            autoComplete="address-level1"
            className="w-full px-4 py-2 rounded bg-brand-midnight text-white mb-2"
          />
          <input
            id="postal_code"
            name="postal_code"
            type="text"
            placeholder="Postal Code"
            value={form.postal_code}
            onChange={handleChange}
            required
            autoComplete="postal-code"
            className="w-full px-4 py-2 rounded bg-brand-midnight text-white mb-2"
          />
        </div>
        <input
          id="country"
          name="country"
          type="text"
          placeholder="Country"
          value={form.country}
          onChange={handleChange}
          required
          autoComplete="country"
          className="w-full px-4 py-2 rounded bg-brand-midnight text-white mb-2"
        />
        {/* Stripe Account Email field removed */}
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <Button
          type="submit"
          className="w-full h-12 text-lg font-semibold"
          disabled={submitting}
        >
          {submitting ? 'Submitting...' : 'Submit Application'}
        </Button>
      </form>
    </div>
  );
}
