import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StarField } from '@/components/StarField';
import {
  CheckCircle2,
  Edit,
  Sparkles,
  ExternalLink,
  Loader2,
} from 'lucide-react';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { profileService } from '@/services/profileService';
import { getStripe } from '@/lib/stripe-client';

interface PersonalInfo {
  firstName: string;
  lastName: string;
  streetAddress: string;
  city: string;
  state: string;
  zipCode: string;
  phoneNumber: string;
  email: string;
  ssn: string;
  dateOfBirth: string;
}

interface SelectedPlan {
  planName: string;
  monthlyAmount: number;
  creditLimit: number;
}

export default function ConfirmationPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [personalInfo, setPersonalInfo] = useState<PersonalInfo | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<SelectedPlan | null>(null);

  useEffect(() => {
    const loadData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast({
          title: 'Authentication Required',
          description: 'Please sign in to continue',
          variant: 'destructive',
        });
        router.push('/signin');
        return;
      }

      setUserId(user.id);

      // Load personal info from database instead of localStorage
      const personalInfoFromDb = await profileService.getPersonalInfo(user.id);
      const profileFromDb = await profileService.getProfile(user.id);
      const plan = localStorage.getItem('selectedPlan');

      if (!personalInfoFromDb || !profileFromDb || !plan) {
        toast({
          title: 'Missing Information',
          description: 'Please complete all previous steps',
          variant: 'destructive',
        });
        router.push('/personal-info');
        return;
      }

      try {
        // Helper function to convert ISO format (YYYY-MM-DD) to MM/DD/YYYY
        const convertISOToMMDDYYYY = (isoDate: string): string => {
          if (!isoDate) return '';
          // Check if it's already in MM/DD/YYYY format
          if (isoDate.includes('/')) return isoDate;
          // Convert YYYY-MM-DD to MM/DD/YYYY
          const [year, month, day] = isoDate.split('-');
          return `${month}/${day}/${year}`;
        };

        // Map database fields to PersonalInfo interface
        const personalData: PersonalInfo = {
          firstName: personalInfoFromDb.first_name || '',
          lastName: personalInfoFromDb.last_name || '',
          streetAddress: personalInfoFromDb.address || '',
          city: personalInfoFromDb.city || '',
          state: personalInfoFromDb.state || '',
          zipCode: personalInfoFromDb.zip_code || '',
          phoneNumber: personalInfoFromDb.phone || '',
          email: profileFromDb.email || user.email || '',
          ssn: personalInfoFromDb.ssn_last_four || '', // Only last 4 digits from DB
          dateOfBirth: convertISOToMMDDYYYY(
            personalInfoFromDb.date_of_birth || ''
          ),
        };
        setPersonalInfo(personalData);
        setSelectedPlan(JSON.parse(plan));
      } catch (error) {
        console.error('Error loading data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load your information',
          variant: 'destructive',
        });
      }
    };

    loadData();
  }, [router, toast]);

  // FIXED: Convert MM/DD/YYYY to YYYY-MM-DD for PostgreSQL
  const convertDateToPostgresFormat = (dateString: string): string => {
    try {
      // Handle MM/DD/YYYY format
      const parts = dateString.split('/');

      if (parts.length !== 3) {
        throw new Error('Date must be in MM/DD/YYYY format');
      }

      let [month, day, year] = parts;

      // Handle two-digit years (YY format)
      if (year.length === 2) {
        const yearNum = parseInt(year, 10);
        // Assume 00-30 means 2000-2030, 31-99 means 1931-1999
        year = yearNum <= 30 ? `20${year}` : `19${year}`;
      }

      // Pad month and day with leading zeros if needed
      month = month.padStart(2, '0');
      day = day.padStart(2, '0');

      // Validate date values
      const monthNum = parseInt(month, 10);
      const dayNum = parseInt(day, 10);
      const yearNum = parseInt(year, 10);

      if (monthNum < 1 || monthNum > 12) {
        throw new Error(
          `Month "${monthNum}" is invalid. Must be between 1 and 12`
        );
      }

      if (dayNum < 1 || dayNum > 31) {
        throw new Error(`Day "${dayNum}" is invalid. Must be between 1 and 31`);
      }

      // Check if date is valid (handles leap years, months with different days)
      const testDate = new Date(yearNum, monthNum - 1, dayNum);
      if (
        testDate.getFullYear() !== yearNum ||
        testDate.getMonth() !== monthNum - 1 ||
        testDate.getDate() !== dayNum
      ) {
        // Provide specific error message for common invalid dates
        if (monthNum === 2 && dayNum > 29) {
          throw new Error(
            `February ${dayNum} does not exist. February only has 28 or 29 days`
          );
        } else if (
          (monthNum === 4 ||
            monthNum === 6 ||
            monthNum === 9 ||
            monthNum === 11) &&
          dayNum > 30
        ) {
          const monthNames = [
            '',
            'January',
            'February',
            'March',
            'April',
            'May',
            'June',
            'July',
            'August',
            'September',
            'October',
            'November',
            'December',
          ];
          throw new Error(
            `${monthNames[monthNum]} ${dayNum} does not exist. ${monthNames[monthNum]} only has 30 days`
          );
        } else {
          throw new Error(`${month}/${day}/${year} is not a valid date`);
        }
      }

      // Return in PostgreSQL format: YYYY-MM-DD
      return `${year}-${month}-${day}`;
    } catch (error) {
      console.error('Date conversion error:', error);
      if (error instanceof Error) {
        throw error; // Re-throw with the specific error message
      }
      throw new Error('Invalid date format. Please use MM/DD/YYYY format.');
    }
  };

  const maskSSN = (ssn: string) => {
    const numbers = ssn.replace(/\D/g, '');
    return `***-**-${numbers.slice(-4)}`;
  };

  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 6)
      return `(${numbers.slice(0, 3)}) ${numbers.slice(3)}`;
    return `(${numbers.slice(0, 3)}) ${numbers.slice(3, 6)}-${numbers.slice(6, 10)}`;
  };

  const getPlanFeatures = (planName: string) => {
    const features: { [key: string]: string[] } = {
      'Starter Boost': [
        'Build credit with $25/month',
        'Monthly credit reporting',
        'Basic account management',
      ],
      'Power Boost': [
        'Build credit with $50/month',
        'Bi-weekly credit reporting',
        'Priority support',
        'Credit score insights',
      ],
      'Max Boost': [
        'Build credit with $70/month',
        'Weekly credit reporting',
        'Premium support',
        'Advanced credit analytics',
        'Credit monitoring alerts',
      ],
      'Blaster Boost': [
        'Build credit with $90/month',
        'Daily credit reporting',
        'VIP support',
        'Comprehensive credit suite',
        'Identity theft protection',
      ],
    };
    return features[planName] || [];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan || !userId || !personalInfo) return;

    try {
      setIsSubmitting(true);

      // FIXED: Convert date of birth to PostgreSQL format before saving
      let formattedDateOfBirth: string;
      try {
        formattedDateOfBirth = convertDateToPostgresFormat(
          personalInfo.dateOfBirth
        );
      } catch {
        toast({
          title: 'Invalid Date of Birth',
          description: `The date "${personalInfo.dateOfBirth}" is not valid. Please click Edit on the Personal Information section to correct it.`,
          variant: 'destructive',
          duration: 8000,
        });
        setIsSubmitting(false);
        return;
      }

      // 1. FIXED: Upsert personal information (update if exists, insert if not)
      // This prevents the duplicate key error when user has already submitted personal info
      const existingPersonalInfo = await profileService.getPersonalInfo(userId);

      if (existingPersonalInfo) {
        // Update existing record
        await profileService.updatePersonalInfo(userId, {
          first_name: personalInfo.firstName,
          last_name: personalInfo.lastName,
          address: personalInfo.streetAddress,
          city: personalInfo.city,
          state: personalInfo.state,
          zip_code: personalInfo.zipCode,
          phone: personalInfo.phoneNumber,
          ssn_last_four: personalInfo.ssn, // Already last 4 digits from DB
          date_of_birth: formattedDateOfBirth, // Use converted format
        });
        console.log('✅ Updated existing personal info');
      } else {
        // Create new record
        await profileService.createPersonalInfo({
          user_id: userId,
          first_name: personalInfo.firstName,
          last_name: personalInfo.lastName,
          address: personalInfo.streetAddress,
          city: personalInfo.city,
          state: personalInfo.state,
          zip_code: personalInfo.zipCode,
          phone: personalInfo.phoneNumber,
          ssn_last_four: personalInfo.ssn, // Already last 4 digits from DB
          date_of_birth: formattedDateOfBirth, // Use converted format
        });
        console.log('✅ Created new personal info');
      }

      // 2. Get the plan ID from the database using plan name
      const { data: planData, error: planError } = await supabase
        .from('booster_plans')
        .select('id, plan_slug')
        .eq('plan_name', selectedPlan.planName)
        .single();

      if (planError || !planData) {
        throw new Error('Failed to find the selected plan');
      }

      // 3. Get current user email for Stripe
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user?.email) {
        throw new Error('User email not found');
      }

      // 4. Create Stripe checkout session - account will be created after successful payment
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: planData.plan_slug,
          userId: userId,
          email: user.email,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create checkout session');
      }

      const { sessionId, url, error: stripeError } = await response.json();

      if (stripeError || !sessionId) {
        throw new Error(
          stripeError ||
            'Failed to create checkout session. Please ensure Stripe is properly configured.'
        );
      }

      // Clear stored data from session and local storage
      sessionStorage.removeItem('selectedPlan');
      localStorage.removeItem('selectedPlan');
      localStorage.removeItem(`personalInfo_${userId}`);
      localStorage.removeItem(`paymentInfo_${userId}`);

      // 5. Redirect to Stripe Checkout using Stripe.js (preferred)
      try {
        const stripe = await getStripe();
        if (!stripe) throw new Error('Failed to load Stripe');

        const result = await stripe.redirectToCheckout({ sessionId });
        if (result.error) {
          throw new Error(result.error.message);
        }
        // If navigation succeeds, execution won't reach here
      } catch (redirectErr) {
        // Fallback: use direct URL from the API if available
        if (url) {
          window.location.assign(url);
        } else {
          throw redirectErr instanceof Error
            ? redirectErr
            : new Error('Failed to start Stripe Checkout.');
        }
      }
    } catch (error) {
      console.error('Submission error:', error);

      let errorMessage =
        'There was an error processing your request. Please try again.';

      if (error instanceof Error) {
        if (
          error.message.includes('Configuration Error') ||
          error.message.includes('Invalid Stripe price')
        ) {
          errorMessage =
            'Payment system is not yet configured. Please contact support or check the STRIPE_SETUP.md file for configuration instructions.';
        } else if (error.message.includes('No Stripe price ID')) {
          errorMessage =
            'The selected plan is not yet available for purchase. Please contact support.';
        } else {
          errorMessage = error.message;
        }
      }

      toast({
        title: 'Submission Failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!selectedPlan || !personalInfo) {
    return (
      <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-brand-midnight via-brand-charcoal to-brand-midnight flex items-center justify-center">
        <StarField />
        <Loader2 className="w-10 h-10 text-brand-sky-blue animate-spin" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-brand-midnight via-brand-charcoal to-brand-midnight">
      <StarField />

      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-brand-sky-blue/20 via-transparent to-transparent opacity-60" />

      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-12">
        <Card className="w-full max-w-4xl border-brand-sky-blue/30 bg-brand-charcoal/80 backdrop-blur-xl shadow-2xl shadow-brand-sky-blue/20">
          <CardHeader className="text-center space-y-4 pt-8 pb-6">
            <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-r from-brand-sky-blue to-brand-sky-blue-light flex items-center justify-center shadow-xl shadow-brand-sky-blue/40">
              <CheckCircle2 className="w-8 h-8 text-white" />
            </div>

            <div className="space-y-2">
              <CardTitle className="text-3xl md:text-4xl font-bold text-brand-white">
                Confirm Your Details
              </CardTitle>
              <p className="text-lg text-brand-white/80">
                Review your information before submitting
              </p>
            </div>
          </CardHeader>

          <CardContent className="px-8 pb-8 space-y-6">
            <div className="space-y-6">
              <div className="bg-brand-midnight/50 rounded-xl p-6 border border-brand-sky-blue/20">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-brand-white flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-brand-sky-blue" />
                    Personal Information
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push('/personal-info')}
                    className="text-brand-sky-blue hover:text-brand-sky-blue-light hover:bg-brand-sky-blue/10"
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-brand-white/80">
                  <div>
                    <p className="text-brand-white/60 text-sm">Name</p>
                    <p className="font-medium">
                      {personalInfo.firstName} {personalInfo.lastName}
                    </p>
                  </div>
                  <div>
                    <p className="text-brand-white/60 text-sm">Email</p>
                    <p className="font-medium">{personalInfo.email}</p>
                  </div>
                  <div>
                    <p className="text-brand-white/60 text-sm">Address</p>
                    <p className="font-medium">{personalInfo.streetAddress}</p>
                    <p className="font-medium">
                      {personalInfo.city}, {personalInfo.state}{' '}
                      {personalInfo.zipCode}
                    </p>
                  </div>
                  <div>
                    <p className="text-brand-white/60 text-sm">Phone</p>
                    <p className="font-medium">
                      {formatPhoneNumber(personalInfo.phoneNumber)}
                    </p>
                  </div>
                  <div>
                    <p className="text-brand-white/60 text-sm">Date of Birth</p>
                    <p className="font-medium">{personalInfo.dateOfBirth}</p>
                  </div>
                  <div>
                    <p className="text-brand-white/60 text-sm">SSN</p>
                    <p className="font-medium">{maskSSN(personalInfo.ssn)}</p>
                  </div>
                </div>
              </div>

              <div className="bg-brand-midnight/50 rounded-xl p-6 border border-brand-sky-blue/20">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-brand-white flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-brand-sky-blue" />
                    Booster Plan Information
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push('/choose-plan')}
                    className="text-brand-sky-blue hover:text-brand-sky-blue-light hover:bg-brand-sky-blue/10"
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-brand-white font-semibold text-lg">
                        {selectedPlan.planName}
                      </p>
                      <p className="text-brand-white/60 text-sm">
                        ${selectedPlan.monthlyAmount}/month
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-brand-white/60 text-sm">
                        Monthly Amount
                      </p>
                      <p className="text-2xl font-bold bg-gradient-to-r from-brand-sky-blue to-brand-sky-blue-light bg-clip-text text-transparent">
                        ${selectedPlan.monthlyAmount}
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-brand-white/10 pt-4">
                    <p className="text-brand-white/60 text-sm mb-2">
                      Plan Features:
                    </p>
                    <ul className="space-y-2">
                      {getPlanFeatures(selectedPlan.planName).map(
                        (feature, index) => (
                          <li
                            key={index}
                            className="flex items-start gap-2 text-brand-white/80 text-sm"
                          >
                            <CheckCircle2 className="w-4 h-4 text-brand-sky-blue mt-0.5 flex-shrink-0" />
                            <span>{feature}</span>
                          </li>
                        )
                      )}
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-brand-midnight/50 rounded-xl p-6 border border-brand-sky-blue/20">
                <div className="bg-brand-sky-blue/10 border border-brand-sky-blue/30 rounded-lg p-4">
                  <p className="text-brand-white/80 text-sm">
                    <strong>
                      Payment will be collected securely through Stripe
                      Checkout.
                    </strong>
                    <br />
                    After submitting, you'll be redirected to enter your payment
                    information on Stripe's secure payment page.
                  </p>
                </div>
              </div>

              <div className="bg-gradient-to-r from-brand-sky-blue/20 to-brand-sky-blue-light/20 rounded-xl p-6 border border-brand-sky-blue/40">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-brand-white/80 text-sm">
                      Total Payment Due
                    </p>
                    <p className="text-brand-white/60 text-xs mt-1">
                      First month payment
                    </p>
                  </div>
                  <p className="text-4xl font-bold bg-gradient-to-r from-brand-sky-blue to-brand-sky-blue-light bg-clip-text text-transparent">
                    ${selectedPlan.monthlyAmount}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-brand-sky-blue/10 border border-brand-sky-blue/30 rounded-lg p-4 mt-6">
              <p className="text-brand-white/80 text-sm">
                By submitting, you agree to our{' '}
                <a
                  href="/terms-of-service"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-sky-blue hover:text-brand-sky-blue-light underline inline-flex items-center gap-1 font-semibold transition-colors"
                >
                  Terms of Service
                  <ExternalLink className="w-3 h-3" />
                </a>
                ,{' '}
                <a
                  href="/privacy-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-sky-blue hover:text-brand-sky-blue-light underline inline-flex items-center gap-1 font-semibold transition-colors"
                >
                  Privacy Policy
                  <ExternalLink className="w-3 h-3" />
                </a>
                , and{' '}
                <a
                  href="/consumer-disclosure"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-sky-blue hover:text-brand-sky-blue-light underline inline-flex items-center gap-1 font-semibold transition-colors"
                >
                  Consumer Disclosure
                  <ExternalLink className="w-3 h-3" />
                </a>
                , and authorize us to charge your payment method $
                {selectedPlan.monthlyAmount} monthly for your credit building
                service.
              </p>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !userId}
              className="w-full h-16 text-xl font-semibold bg-gradient-to-r from-brand-sky-blue to-brand-sky-blue-light hover:from-brand-sky-blue-light hover:to-brand-sky-blue text-white shadow-xl shadow-brand-sky-blue/40 hover:shadow-brand-sky-blue/60 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span>Processing...</span>
                </div>
              ) : (
                'Submit & Complete Setup'
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
