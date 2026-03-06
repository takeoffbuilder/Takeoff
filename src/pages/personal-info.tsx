import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { StarField } from '@/components/StarField';
import { ArrowRight, User } from 'lucide-react';
import { useRouter } from 'next/router';
import { useState, useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { addressService } from '@/services/addressService';
import AddressAutocomplete from '@/components/AddressAutocomplete';
import { profileService } from '@/services/profileService';
import type { Database } from '@/integrations/supabase/types';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const US_STATES = [
  'AL',
  'AK',
  'AZ',
  'AR',
  'CA',
  'CO',
  'CT',
  'DE',
  'FL',
  'GA',
  'HI',
  'ID',
  'IL',
  'IN',
  'IA',
  'KS',
  'KY',
  'LA',
  'ME',
  'MD',
  'MA',
  'MI',
  'MN',
  'MS',
  'MO',
  'MT',
  'NE',
  'NV',
  'NH',
  'NJ',
  'NM',
  'NY',
  'NC',
  'ND',
  'OH',
  'OK',
  'OR',
  'PA',
  'RI',
  'SC',
  'SD',
  'TN',
  'TX',
  'UT',
  'VT',
  'VA',
  'WA',
  'WV',
  'WI',
  'WY',
];

interface PersonalInfoForm {
  firstName: string;
  lastName: string;
  middleInitial?: string;
  generationCode?: string;
  streetAddress: string;
  address2?: string;
  city: string;
  state: string;
  zipCode: string;
  phoneNumber: string;
  email: string;
  ssn: string;
  dateOfBirth: string;
}

const EMPTY_FORM: PersonalInfoForm = {
  firstName: '',
  lastName: '',
  middleInitial: '',
  generationCode: '',
  streetAddress: '',
  address2: '',
  city: '',
  state: '',
  zipCode: '',
  phoneNumber: '',
  email: '',
  ssn: '',
  dateOfBirth: '',
};

export default function PersonalInfoPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [formData, setFormData] = useState<PersonalInfoForm>(EMPTY_FORM);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [addrDialogOpen, setAddrDialogOpen] = useState(false);
  const [showSSN, setShowSSN] = useState(false);
  const ssnTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [proposedAddress, setProposedAddress] = useState<{
    street1: string;
    street2?: string | null;
    city: string;
    state: string;
    zip5: string;
    zip4?: string | null;
    dpv?: string | null;
    notes?: string;
  } | null>(null);

  // Attach referral if pending in localStorage
  useEffect(() => {
    async function maybeAttachReferral() {
      const referralCode = localStorage.getItem('pendingReferralCode');
      if (!referralCode) return;
      if (!userId) return;
      const payload = { userId, referralCode };
      try {
        const response = await fetch('/api/referral/attach', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const result = await response.json();
        console.log('Referral attach response:', result);
        localStorage.removeItem('pendingReferralCode');
      } catch (e) {
        console.error('Failed to attach referral:', e);
      }
    }
    maybeAttachReferral();
  }, [userId]);

  useEffect(() => {
    const loadUserData = async () => {
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

      // Always use auth.users.id as user_id for user_personal_info
      setUserId(user.id);

      const newFormData = { ...EMPTY_FORM };
      newFormData.email = user.email || '';

      // Prefill from DB if available
      try {
        const existing = await profileService.getPersonalInfo(user.id);
        if (existing) {
          type UserPersonalInfoRowExt =
            Database['public']['Tables']['user_personal_info']['Row'] & {
              address2?: string | null;
              middle_initial?: string | null;
              generation_code?: string | null;
            };
          const ext = existing as UserPersonalInfoRowExt;
          newFormData.firstName = existing.first_name || '';
          newFormData.lastName = existing.last_name || '';
          newFormData.middleInitial = ext.middle_initial || '';
          newFormData.generationCode = ext.generation_code || '';
          newFormData.streetAddress = existing.address || '';
          newFormData.address2 = ext.address2 || '';
          newFormData.city = existing.city || '';
          newFormData.state = existing.state || '';
          newFormData.zipCode = existing.zip_code || '';
          newFormData.phoneNumber = existing.phone || '';
          newFormData.dateOfBirth = existing.date_of_birth || '';
          // We only store last four in DB; leave SSN empty for security
          if (existing.ssn_last_four && existing.ssn_last_four.length > 0) {
            newFormData.ssn = formatSSN(existing.ssn_last_four);
            setShowSSN(true);
            if (ssnTimerRef.current) clearTimeout(ssnTimerRef.current);
            ssnTimerRef.current = setTimeout(() => setShowSSN(false), 1500);
          }
        }
      } catch (e) {
        console.warn('Could not prefill personal info from DB:', e);
      }

      setFormData(newFormData);
      setDataLoaded(true);
    };

    loadUserData();
  }, [router, toast]);

  const handleInputChange = (field: keyof PersonalInfoForm, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 6)
      return `(${numbers.slice(0, 3)}) ${numbers.slice(3)}`;
    return `(${numbers.slice(0, 3)}) ${numbers.slice(3, 6)}-${numbers.slice(6, 10)}`;
  };

  const formatSSN = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 5)
      return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 5)}-${numbers.slice(5, 9)}`;
  };

  // maskSSN function removed (unused)

  const formatDateOfBirth = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 4)
      return `${numbers.slice(0, 2)}/${numbers.slice(2)}`;
    return `${numbers.slice(0, 2)}/${numbers.slice(2, 4)}/${numbers.slice(4, 8)}`;
  };

  // FIXED: Add date validation to check if the date is actually valid
  const isValidDate = (dateString: string): boolean => {
    // Check format MM/DD/YYYY
    const dateRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
    const match = dateString.match(dateRegex);

    if (!match) {
      return false;
    }

    const month = parseInt(match[1], 10);
    const day = parseInt(match[2], 10);
    const year = parseInt(match[3], 10);

    // Check if month is valid (1-12)
    if (month < 1 || month > 12) {
      return false;
    }

    // Check if day is valid (1-31)
    if (day < 1 || day > 31) {
      return false;
    }

    // Check if year is reasonable (1900-current year)
    const currentYear = new Date().getFullYear();
    if (year < 1900 || year > currentYear) {
      return false;
    }

    // Create a date object and check if it's valid
    // This will catch invalid dates like February 30th, April 31st, etc.
    const testDate = new Date(year, month - 1, day);

    // Verify the date components match what we set
    // If JavaScript adjusted the date (e.g., Feb 30 -> Mar 2), this will fail
    if (
      testDate.getFullYear() !== year ||
      testDate.getMonth() !== month - 1 ||
      testDate.getDate() !== day
    ) {
      return false;
    }

    return true;
  };

  const validateForm = () => {
    const requiredFields: (keyof PersonalInfoForm)[] = [
      'firstName',
      'lastName',
      'streetAddress',
      'city',
      'state',
      'zipCode',
      'phoneNumber',
      'ssn',
      'dateOfBirth',
    ];

    for (const field of requiredFields) {
      if (!formData[field]?.trim()) {
        toast({
          title: 'Missing Information',
          description: `Please fill in your ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`,
          variant: 'destructive',
        });
        return false;
      }
    }

    if (formData.zipCode.length !== 5) {
      toast({
        title: 'Invalid ZIP Code',
        description: 'ZIP code must be 5 digits',
        variant: 'destructive',
      });
      return false;
    }

    const phoneNumbers = formData.phoneNumber.replace(/\D/g, '');
    if (phoneNumbers.length !== 10) {
      toast({
        title: 'Invalid Phone Number',
        description: 'Phone number must be 10 digits',
        variant: 'destructive',
      });
      return false;
    }

    const ssnNumbers = formData.ssn.replace(/\D/g, '');
    if (ssnNumbers.length !== 9) {
      toast({
        title: 'Invalid SSN',
        description: 'SSN must be 9 digits',
        variant: 'destructive',
      });
      return false;
    }

    // FIXED: Add date of birth validation
    if (!isValidDate(formData.dateOfBirth)) {
      toast({
        title: 'Invalid Date of Birth',
        description:
          'Please enter a valid date in MM/DD/YYYY format (e.g., February only has 28 or 29 days)',
        variant: 'destructive',
        duration: 5000,
      });
      return false;
    }

    // FIXED: Check if user is at least 18 years old
    const dobParts = formData.dateOfBirth.split('/');
    const birthDate = new Date(
      parseInt(dobParts[2], 10),
      parseInt(dobParts[0], 10) - 1,
      parseInt(dobParts[1], 10)
    );

    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    const dayDiff = today.getDate() - birthDate.getDate();

    const actualAge =
      monthDiff < 0 || (monthDiff === 0 && dayDiff < 0) ? age - 1 : age;

    if (actualAge < 18) {
      toast({
        title: 'Age Requirement',
        description: 'You must be at least 18 years old to use this service',
        variant: 'destructive',
      });
      return false;
    }

    return true;
  };

  const saveToDbAndNext = async (finalData: PersonalInfoForm) => {
    if (!userId) return;

    // Build DB payload
    const onlyDigits = (s: string) => s.replace(/\D/g, '');
    const ssnLast4 = onlyDigits(finalData.ssn).slice(-4);

    type UPIInsertExt =
      Database['public']['Tables']['user_personal_info']['Insert'] & {
        address2?: string | null;
        middle_initial?: string | null;
        generation_code?: string | null;
      };
    type UPIUpdateExt =
      Database['public']['Tables']['user_personal_info']['Update'] & {
        address2?: string | null;
        middle_initial?: string | null;
        generation_code?: string | null;
      };

    const insertPayload: UPIInsertExt = {
      first_name: finalData.firstName,
      last_name: finalData.lastName,
      middle_initial: finalData.middleInitial || null,
      generation_code: finalData.generationCode || null,
      address: finalData.streetAddress,
      address2: finalData.address2 || null,
      city: finalData.city,
      state: finalData.state,
      zip_code: finalData.zipCode,
      phone: onlyDigits(finalData.phoneNumber),
      date_of_birth: finalData.dateOfBirth,
      ssn_last_four: ssnLast4,
      user_id: userId,
    };

    const updatePayload: UPIUpdateExt = {
      first_name: finalData.firstName,
      last_name: finalData.lastName,
      middle_initial: finalData.middleInitial || null,
      generation_code: finalData.generationCode || null,
      address: finalData.streetAddress,
      address2: finalData.address2 || null,
      city: finalData.city,
      state: finalData.state,
      zip_code: finalData.zipCode,
      phone: onlyDigits(finalData.phoneNumber),
      date_of_birth: finalData.dateOfBirth,
      ssn_last_four: ssnLast4,
    };

    try {
      // Always use userId (from auth.users.id) for all personal info DB operations
      const existing = await profileService.getPersonalInfo(userId);
      if (existing) {
        await profileService.updatePersonalInfo(userId, updatePayload);
      } else {
        await profileService.createPersonalInfo({
          ...insertPayload,
          user_id: userId,
        });
      }

      // Upsert into profiles table as well
      const profile = await profileService.getProfile(userId);
      const profilePayload = {
        full_name: `${finalData.firstName} ${finalData.lastName}`.trim(),
        first_name: finalData.firstName,
        last_name: finalData.lastName,
        email: finalData.email,
        phone: finalData.phoneNumber,
        address: finalData.streetAddress,
        city: finalData.city,
        state: finalData.state,
        postal_code: finalData.zipCode,
        updated_at: new Date().toISOString(),
      };
      if (profile) {
        await profileService.updateProfile(userId, profilePayload);
      } else {
        await profileService.createProfile(userId, profilePayload);
      }

      toast({
        title: 'Success!',
        description:
          'Personal information saved successfully. Redirecting you to the next step...',
        duration: 2000,
      });
      setTimeout(() => {
        router.push('/confirmation');
      }, 2000);
    } catch (error: unknown) {
      console.error('Failed saving personal info:', error);
      toast({
        title: 'Save failed',
        description:
          'We could not save your info to the database. Please try again.',
        variant: 'destructive',
        duration: 5000,
      });
    }
  };

  const handleContinue = async () => {
    if (!validateForm() || !userId) return;

    setLoading(true);

    try {
      // Address verification via server. If not configured, we'll proceed without blocking.
      const result = await addressService.verify({
        streetAddress: formData.streetAddress,
        address2: formData.address2 || '',
        city: formData.city,
        state: formData.state,
        zipCode: formData.zipCode,
      });

      if (!result.configured) {
        // Proceed as before but persist to DB
        await saveToDbAndNext(formData);
        return;
      }

      if (result.error && result.deliverable === false) {
        toast({
          title: 'Oops!!',
          description:
            'Check the address for correct entry. Address validation failed.',
          variant: 'destructive',
          duration: 5000,
        });
        setLoading(false);
        return;
      }

      if (result.deliverable === false) {
        toast({
          title: 'Oops!!',
          description:
            'Check the address for correct entry. Address validation failed.',
          variant: 'destructive',
          duration: 5000,
        });
        setLoading(false);
        return;
      }

      // Compare normalized address to entered
      const n = result.normalized;
      const dpv = result.dpv?.confirmation;
      if (n) {
        const differs =
          n.street1.trim().toLowerCase() !==
            formData.streetAddress.trim().toLowerCase() ||
          (n.street2 || '').trim().toLowerCase() !==
            (formData.address2 || '').trim().toLowerCase() ||
          n.city.trim().toLowerCase() !== formData.city.trim().toLowerCase() ||
          n.state.trim().toUpperCase() !==
            formData.state.trim().toUpperCase() ||
          n.zip5.trim() !== formData.zipCode.trim();

        if (differs || dpv === 'S') {
          setProposedAddress({
            street1: n.street1,
            street2: n.street2 || undefined,
            city: n.city,
            state: n.state,
            zip5: n.zip5,
            zip4: n.zip4 || undefined,
            dpv: dpv || null,
            notes: result.notes,
          });
          setAddrDialogOpen(true);
          setLoading(false);
          return;
        }
      }

      // No differences; proceed
      await saveToDbAndNext(formData);
    } catch {
      // On any error, proceed without blocking but inform user
      toast({
        title: 'Note',
        description:
          'Address validation was unavailable; continuing without it.',
        duration: 3000,
      });
      await saveToDbAndNext(formData);
    } finally {
      // If we opened a dialog, loading was already cleared.
      setLoading(false);
    }
  };

  if (!dataLoaded) {
    return (
      <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-brand-midnight via-brand-charcoal to-brand-midnight flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-sky-blue border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-brand-midnight via-brand-charcoal to-brand-midnight">
      <StarField />

      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-brand-sky-blue/20 via-transparent to-transparent opacity-60" />

      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-12">
        <Card className="w-full max-w-3xl border-brand-sky-blue/30 bg-brand-charcoal/80 backdrop-blur-xl shadow-2xl shadow-brand-sky-blue/20">
          <CardHeader className="text-center space-y-4 pt-8">
            <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-r from-brand-sky-blue to-brand-sky-blue-light flex items-center justify-center shadow-xl shadow-brand-sky-blue/40">
              <User className="w-8 h-8 text-white" />
            </div>

            <div className="space-y-2">
              <CardTitle className="text-3xl md:text-4xl font-bold text-brand-white">
                Add Personal Information
              </CardTitle>
              <p className="text-xl text-brand-white/80">Almost Ready!</p>
            </div>
          </CardHeader>

          <CardContent className="px-8 pb-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-brand-white">
                  First Name
                </Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) =>
                    handleInputChange('firstName', e.target.value)
                  }
                  className="bg-brand-midnight/50 border-brand-sky-blue/30 text-brand-white focus:border-brand-sky-blue"
                  placeholder="John"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="middleInitial" className="text-brand-white">
                  Middle Initial{' '}
                  <span className="text-brand-white/60 text-xs">
                    (optional)
                  </span>
                </Label>
                <Input
                  id="middleInitial"
                  value={formData.middleInitial || ''}
                  onChange={(e) =>
                    handleInputChange(
                      'middleInitial',
                      e.target.value.slice(0, 1).toUpperCase()
                    )
                  }
                  className="bg-brand-midnight/50 border-brand-sky-blue/30 text-brand-white focus:border-brand-sky-blue"
                  placeholder="M"
                />
                <p className="text-xs text-gray-400">
                  One letter (e.g., M). Leave blank if not applicable.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName" className="text-brand-white">
                  Last Name
                </Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) =>
                    handleInputChange('lastName', e.target.value)
                  }
                  className="bg-brand-midnight/50 border-brand-sky-blue/30 text-brand-white focus:border-brand-sky-blue"
                  placeholder="Doe"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="generationCode" className="text-brand-white">
                Generation Code{' '}
                <span className="text-brand-white/60 text-xs">(optional)</span>
              </Label>
              <Input
                id="generationCode"
                value={formData.generationCode || ''}
                onChange={(e) =>
                  handleInputChange('generationCode', e.target.value)
                }
                className="bg-brand-midnight/50 border-brand-sky-blue/30 text-brand-white focus:border-brand-sky-blue"
                placeholder="Jr, Sr, II, III"
              />
              <p className="text-xs text-gray-400">
                Examples: Jr, Sr, II, III. Leave blank if not applicable.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="streetAddress" className="text-brand-white">
                Street Address
              </Label>
              <AddressAutocomplete
                onSelect={({ street, city, state, zip }) => {
                  handleInputChange('streetAddress', street);
                  handleInputChange('city', city);
                  handleInputChange('state', state);
                  handleInputChange('zipCode', zip);
                }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address2" className="text-brand-white">
                Address 2 (Apt, Unit, Suite)
              </Label>
              <Input
                id="address2"
                value={formData.address2 || ''}
                onChange={(e) => handleInputChange('address2', e.target.value)}
                className="bg-brand-midnight/50 border-brand-sky-blue/30 text-brand-white focus:border-brand-sky-blue"
                placeholder="Apt 4B"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="city" className="text-brand-white">
                  City
                </Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  className="bg-brand-midnight/50 border-brand-sky-blue/30 text-brand-white focus:border-brand-sky-blue"
                  placeholder="New York"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="state" className="text-brand-white">
                  State
                </Label>
                <Select
                  value={formData.state}
                  onValueChange={(value) => handleInputChange('state', value)}
                >
                  <SelectTrigger className="bg-brand-midnight/50 border-brand-sky-blue/30 text-brand-white focus:border-brand-sky-blue">
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent className="bg-brand-charcoal border-brand-sky-blue/30 max-h-60">
                    {US_STATES.map((state) => (
                      <SelectItem
                        key={state}
                        value={state}
                        className="text-brand-white hover:bg-brand-sky-blue/20"
                      >
                        {state}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="zipCode" className="text-brand-white">
                  ZIP Code
                </Label>
                <Input
                  id="zipCode"
                  value={formData.zipCode}
                  onChange={(e) =>
                    handleInputChange(
                      'zipCode',
                      e.target.value.replace(/\D/g, '').slice(0, 5)
                    )
                  }
                  className="bg-brand-midnight/50 border-brand-sky-blue/30 text-brand-white focus:border-brand-sky-blue"
                  placeholder="10001"
                  maxLength={5}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phoneNumber" className="text-brand-white">
                Phone Number
              </Label>
              <Input
                id="phoneNumber"
                value={formData.phoneNumber}
                onChange={(e) =>
                  handleInputChange(
                    'phoneNumber',
                    formatPhoneNumber(e.target.value)
                  )
                }
                className="bg-brand-midnight/50 border-brand-sky-blue/30 text-brand-white focus:border-brand-sky-blue"
                placeholder="(555) 555-5555"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-brand-white">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                disabled
                className="bg-brand-midnight/30 border-brand-sky-blue/20 text-brand-white/60 cursor-not-allowed"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="ssn" className="text-brand-white">
                  Social Security Number
                </Label>
                <Input
                  id="ssn"
                  type={showSSN ? 'text' : 'password'}
                  value={formData.ssn}
                  onChange={(e) => {
                    handleInputChange('ssn', formatSSN(e.target.value));
                    setShowSSN(true);
                    if (ssnTimerRef.current) clearTimeout(ssnTimerRef.current);
                    ssnTimerRef.current = setTimeout(
                      () => setShowSSN(false),
                      1500
                    );
                  }}
                  className="bg-brand-midnight/50 border-brand-sky-blue/30 text-brand-white focus:border-brand-sky-blue"
                  placeholder="XXX-XX-XXXX"
                  maxLength={11}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dateOfBirth" className="text-brand-white">
                  Date of Birth
                </Label>
                <Input
                  id="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={(e) =>
                    handleInputChange(
                      'dateOfBirth',
                      formatDateOfBirth(e.target.value)
                    )
                  }
                  className="bg-brand-midnight/50 border-brand-sky-blue/30 text-brand-white focus:border-brand-sky-blue"
                  placeholder="MM/DD/YYYY"
                  maxLength={10}
                />
              </div>
            </div>

            <Button
              onClick={handleContinue}
              disabled={loading || !userId}
              className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-brand-sky-blue to-brand-sky-blue-light hover:from-brand-sky-blue-light hover:to-brand-sky-blue text-white shadow-xl shadow-brand-sky-blue/40 hover:shadow-brand-sky-blue/60 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 mt-8"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Saving...</span>
                </div>
              ) : (
                <>
                  Continue
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Suggested Address Confirmation */}
      <AlertDialog open={addrDialogOpen} onOpenChange={setAddrDialogOpen}>
        <AlertDialogContent className="bg-brand-charcoal border-brand-sky-blue/30 text-brand-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Use standardized address?</AlertDialogTitle>
            <AlertDialogDescription className="text-brand-white/80">
              {proposedAddress?.dpv === 'S' && (
                <div className="mb-2 text-amber-300">
                  This address may require an apartment/unit/suite.
                </div>
              )}
              We found a standardized version of your address. You can use it
              as-is or keep what you entered.
              <div className="mt-4 rounded-md bg-brand-midnight/60 p-3">
                <div className="font-medium">Suggested</div>
                <div className="text-sm opacity-90">
                  <div>{proposedAddress?.street1}</div>
                  {proposedAddress?.street2 && (
                    <div>{proposedAddress.street2}</div>
                  )}
                  <div>
                    {proposedAddress?.city}, {proposedAddress?.state}{' '}
                    {proposedAddress?.zip5}
                    {proposedAddress?.zip4 ? `-${proposedAddress.zip4}` : ''}
                  </div>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                // Keep entered
                saveToDbAndNext(formData);
              }}
              className="border-brand-sky-blue/30"
            >
              Keep entered
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!proposedAddress) return;
                const updated: PersonalInfoForm = {
                  ...formData,
                  streetAddress: proposedAddress.street1,
                  address2: proposedAddress.street2 || formData.address2 || '',
                  city: proposedAddress.city,
                  state: proposedAddress.state,
                  zipCode: proposedAddress.zip5,
                };
                setFormData(updated);
                saveToDbAndNext(updated);
              }}
              className="bg-brand-sky-blue text-white hover:bg-brand-sky-blue-light"
            >
              Use suggested
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
