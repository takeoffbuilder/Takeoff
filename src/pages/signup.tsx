import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StarField } from '@/components/StarField';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mail, AlertCircle, Loader2 } from 'lucide-react';
import { authService } from '@/services/authService';
import { useEffect } from 'react';
interface FormErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
}

export default function SignUpPage() {
  const router = useRouter();
  // Capture referral code from URL if present
  const referralCode = router.query.ref as string | undefined;
  // Store referral code in localStorage if present and changes
  useEffect(() => {
    if (referralCode && typeof window !== 'undefined') {
      localStorage.setItem('pendingReferralCode', referralCode);
      console.log('Stored referral code in localStorage:', referralCode);
    }
  }, [referralCode]);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState('');

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Normalize email before validation
    const normalizedEmail = formData.email.trim().toLowerCase();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!normalizedEmail) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(normalizedEmail)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password =
        'Password must contain uppercase, lowercase, and a number';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError('');

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Normalize email before any API calls
      const normalizedEmail = formData.email.trim().toLowerCase();

      // First, check if email already exists
      const { exists, error: checkError } =
        await authService.checkEmailExists(normalizedEmail);

      if (checkError) {
        console.warn('Email check warning:', checkError.message);
        // Continue with signup attempt even if check fails
      }

      if (exists) {
        setApiError(
          'This email is already registered. Please sign in or use a different email address.'
        );
        setIsSubmitting(false);
        return;
      }

      // Proceed with signup using normalized email
      const { error } = await authService.signUp(
        normalizedEmail,
        formData.password
      );

      if (error) {
        // Enhanced duplicate email detection
        const errorMsg = error.message.toLowerCase();
        if (
          errorMsg.includes('already registered') ||
          errorMsg.includes('already exists') ||
          errorMsg.includes('user already registered') ||
          errorMsg.includes('duplicate') ||
          errorMsg.includes('email taken') ||
          errorMsg.includes('email already in use')
        ) {
          setApiError(
            'This email is already registered. Please sign in or use a different email address.'
          );
        } else if (
          errorMsg.includes('invalid email') ||
          (errorMsg.includes('email address') && errorMsg.includes('invalid'))
        ) {
          setApiError(
            'The email address format is invalid. Please check and try again.'
          );
        } else if (errorMsg.includes('password')) {
          setApiError(
            'Password does not meet requirements. Please try a stronger password.'
          );
        } else {
          setApiError(
            error.message || 'Unable to create account. Please try again.'
          );
        }
        setIsSubmitting(false);
        return;
      }

      // After successful signup, attach referral if code exists
      if (referralCode && typeof window !== 'undefined') {
        localStorage.setItem('pendingReferralCode', referralCode);
        // Try to get the userId from the current session
        const user = await authService.getCurrentUser();
        if (user?.id) {
          const payload = {
            referralCode: referralCode,
            userId: user.id,
          };
          console.log('calling referral attach API with payload:', payload);
          const response = await fetch('/api/referral/attach', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
          const result = await response.json();
          console.log('referral attach response:', result);
        }
      }

      // Success - store normalized email and redirect to verification
      if (typeof window !== 'undefined') {
        // Auth state managed by Supabase session
        // Mark that email verification is pending via user metadata/state
      }

      setTimeout(() => {
        router.push(
          `/verify-email?email=${encodeURIComponent(normalizedEmail)}`
        );
      }, 1000);
    } catch (error) {
      console.error('Signup error:', error);
      setApiError('Network error. Please check your connection and try again.');
      setIsSubmitting(false);
    }
  };

  const handleChange =
    (field: keyof typeof formData) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      let value = e.target.value;

      // Auto-normalize email as user types (trim on blur would be better UX, but this ensures clean data)
      if (field === 'email') {
        value = value.trim().toLowerCase();
      }

      setFormData((prev) => ({ ...prev, [field]: value }));
      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: undefined }));
      }
      if (apiError) {
        setApiError('');
      }
    };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-b from-brand-midnight via-brand-charcoal to-brand-midnight">
      <StarField />

      <div className="absolute inset-0 bg-gradient-radial from-brand-sky-blue/5 via-transparent to-transparent opacity-50" />

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8">
          <Card className="border-brand-sky-blue/20 bg-brand-charcoal/50 backdrop-blur-xl shadow-2xl shadow-brand-sky-blue/10">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-bold text-center text-white">
                Let's Get Started!
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {apiError && (
                  <Alert className="bg-red-500/10 border-red-500/30">
                    <AlertCircle className="h-4 w-4 text-red-400" />
                    <AlertDescription className="text-red-300 ml-2 text-sm">
                      {apiError}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white">
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="john@example.com"
                    value={formData.email}
                    onChange={handleChange('email')}
                    disabled={isSubmitting}
                    className={`bg-brand-midnight/50 border-brand-sky-blue/30 text-white placeholder:text-gray-500 focus:border-brand-sky-blue focus:ring-brand-sky-blue/50 transition-all duration-300 ${
                      errors.email
                        ? 'border-red-500 focus:border-red-500 focus:ring-red-500/50'
                        : ''
                    }`}
                  />
                  {errors.email && (
                    <p className="text-xs text-red-400 animate-fade-in">
                      {errors.email}
                    </p>
                  )}
                  <p className="text-xs text-gray-500">
                    This will be your username
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-white">
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange('password')}
                    disabled={isSubmitting}
                    className={`bg-brand-midnight/50 border-brand-sky-blue/30 text-white placeholder:text-gray-500 focus:border-brand-sky-blue focus:ring-brand-sky-blue/50 transition-all duration-300 ${
                      errors.password
                        ? 'border-red-500 focus:border-red-500 focus:ring-red-500/50'
                        : ''
                    }`}
                  />
                  {errors.password && (
                    <p className="text-xs text-red-400 animate-fade-in">
                      {errors.password}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-white">
                    Confirm Password
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={handleChange('confirmPassword')}
                    disabled={isSubmitting}
                    className={`bg-brand-midnight/50 border-brand-sky-blue/30 text-white placeholder:text-gray-500 focus:border-brand-sky-blue focus:ring-brand-sky-blue/50 transition-all duration-300 ${
                      errors.confirmPassword
                        ? 'border-red-500 focus:border-red-500 focus:ring-red-500/50'
                        : ''
                    }`}
                  />
                  {errors.confirmPassword && (
                    <p className="text-xs text-red-400 animate-fade-in">
                      {errors.confirmPassword}
                    </p>
                  )}
                </div>

                <div className="bg-brand-sky-blue/5 border border-brand-sky-blue/20 rounded-lg p-3">
                  <div className="flex items-start space-x-2">
                    <Mail className="h-4 w-4 text-brand-sky-blue mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-gray-400">
                      You'll receive a verification email to activate your
                      account
                    </p>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-brand-sky-blue to-brand-sky-blue-light hover:from-brand-sky-blue-light hover:to-brand-sky-blue text-white font-semibold py-3 rounded-lg shadow-lg shadow-brand-sky-blue/50 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-brand-sky-blue/70 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center space-x-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Creating Account...</span>
                    </span>
                  ) : (
                    'Create Account'
                  )}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/')}
                  disabled={isSubmitting}
                  className="w-full border-brand-sky-blue/30 bg-brand-midnight/30 hover:bg-brand-midnight/50 text-gray-300 hover:text-white transition-all duration-300"
                >
                  Back to Landing Page
                </Button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-gray-400">
                  Already have an account?{' '}
                  <Link
                    href="/signin"
                    className="text-brand-sky-blue hover:text-brand-sky-blue-light transition-colors duration-200 font-medium hover:underline"
                  >
                    Sign in
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>

          <p className="text-center text-xs text-gray-500">
            By creating an account, you agree to our Terms of Service and
            Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
}
