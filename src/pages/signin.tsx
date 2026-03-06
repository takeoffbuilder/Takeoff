import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { StarField } from '@/components/StarField';
import { authService } from '@/services/authService';
import { useToast } from '@/hooks/use-toast';

export default function SignInPage() {
  const router = useRouter();
  const affiliateParam = router.query.affiliate === '1' ? '?affiliate=1' : '';
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Use Supabase authentication service
      const { user, error } = await authService.signIn(
        formData.email,
        formData.password
      );

      if (error) {
        throw error;
      }

      if (!user) {
        throw new Error('Sign in failed. Please check your credentials.');
      }

      // Auth state is managed by Supabase session - no localStorage needed

      toast({
        title: 'Welcome back!',
        description: 'Successfully signed in to your account.',
        duration: 3000,
      });

      // Fetch affiliate and subscriber status
      const statusRes = await fetch(`/api/affiliate/status?userId=${user.id}`);
      const statusData = await statusRes.json();
      const isAffiliate =
        statusData.status &&
        (statusData.status.toLowerCase() === 'approved' ||
          statusData.status.toLowerCase() === 'active');
      const isAffiliateOnly = !!statusData.isAffiliateOnly;
      let isSubscriber = false;
      try {
        const subStatusRes = await fetch(
          `/api/subscription/status?userId=${user.id}`
        );
        const subStatusData = await subStatusRes.json();
        isSubscriber = !!subStatusData.isSubscriber;
      } catch {}

      // Redirect logic: dual-role users always go to dashboard first
      if (isSubscriber) {
        router.push('/dashboard');
      } else if (isAffiliateOnly) {
        router.push('/affiliate-dashboard');
      } else {
        router.push('/');
      }
    } catch (error: unknown) {
      console.error('Sign in error:', error);

      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Invalid email or password. Please try again.';

      toast({
        title: 'Sign In Failed',
        description: errorMessage,
        variant: 'destructive',
        duration: 5000,
      });

      setErrors({
        email: ' ',
        password: 'Invalid email or password. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange =
    (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData((prev) => ({ ...prev, [field]: e.target.value }));
      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: '' }));
      }
    };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <StarField />

      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center space-y-4 animate-float">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-sky-400 to-blue-500 bg-clip-text text-transparent">
              Welcome Back
            </h1>
            <p className="text-slate-400 text-lg">
              Sign in to continue your journey
            </p>
          </div>

          <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-sm shadow-2xl">
            <CardHeader>
              <CardTitle className="text-2xl text-white">Sign In</CardTitle>
              <CardDescription className="text-slate-400">
                Enter your credentials to access your account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-slate-300">
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={handleChange('email')}
                    className={`bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-sky-500 focus:ring-sky-500/20 transition-all duration-300 ${
                      errors.email
                        ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                        : ''
                    }`}
                  />
                  {errors.email && (
                    <p className="text-red-400 text-sm">{errors.email}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-slate-300">
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleChange('password')}
                    className={`bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-sky-500 focus:ring-sky-500/20 transition-all duration-300 ${
                      errors.password
                        ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                        : ''
                    }`}
                  />
                  {errors.password && (
                    <p className="text-red-400 text-sm">{errors.password}</p>
                  )}
                </div>

                <div className="space-y-3">
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-semibold py-6 rounded-lg shadow-lg shadow-sky-500/20 hover:shadow-sky-500/40 transition-all duration-300 disabled:opacity-50"
                  >
                    {isSubmitting ? 'Signing In...' : 'Sign In'}
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push('/')}
                    className="w-full border-slate-700 bg-slate-800/50 hover:bg-slate-800 text-slate-300 hover:text-white py-6 rounded-lg transition-all duration-300"
                  >
                    Back to Landing Page
                  </Button>
                </div>

                <div className="text-center pt-4">
                  <p className="text-slate-400 text-sm">
                    Don&apos;t have an account?{' '}
                    <Link
                      href={`/signup${affiliateParam}`}
                      className="text-sky-400 hover:text-sky-300 font-semibold transition-colors"
                    >
                      Sign up
                    </Link>
                  </p>
                </div>
              </form>
            </CardContent>
          </Card>

          <p className="text-center text-slate-500 text-sm">
            &copy; 2025 Take Off Credit. All Rights Reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
