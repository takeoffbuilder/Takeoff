import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StarField } from '@/components/StarField';
import { useRouter } from 'next/router';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mail, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { authService } from '@/services/authService';
import { attachReferralIfPresent } from '@/services/referralService';

export default function VerifyEmailPage() {
  const router = useRouter();
  const { email } = router.query;
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  useEffect(() => {
    if (!email) {
      router.push('/signup');
    }
  }, [email, router]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!code || code.length !== 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }

    setIsVerifying(true);

    try {
      const { user, error: verifyError } = await authService.verifyEmailOTP(
        email as string,
        code
      );

      if (verifyError) {
        setError(verifyError.message);
        setIsVerifying(false);
        return;
      }

      if (user) {
        if (typeof window !== 'undefined') {
          // Auth state managed by Supabase session
        }
        // Attach referral if present (after verification and authentication)
        attachReferralIfPresent().finally(() => {
          setTimeout(() => {
            // Check if affiliate flow via URL param
            const isAffiliateFlow = router.query.affiliate === '1';
            if (isAffiliateFlow) {
              router.push('/affiliate-application');
            } else {
              router.push('/choose-plan');
            }
          }, 1500);
        });
      }
    } catch {
      setError('Network error. Please try again.');
      setIsVerifying(false);
    }
  };

  const handleResendCode = async () => {
    setError('');
    setResendSuccess(false);
    setResendLoading(true);

    try {
      const { error: resendError } = await authService.resendVerificationEmail(
        email as string
      );

      if (resendError) {
        setError(resendError.message);
      } else {
        setResendSuccess(true);
        setTimeout(() => setResendSuccess(false), 5000);
      }
    } catch {
      setError('Failed to resend code. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  if (!email) {
    return null;
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-b from-brand-midnight via-brand-charcoal to-brand-midnight">
      <StarField />

      <div className="absolute inset-0 bg-gradient-radial from-brand-sky-blue/5 via-transparent to-transparent opacity-50" />

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8">
          <Card className="border-brand-sky-blue/20 bg-brand-charcoal/50 backdrop-blur-xl shadow-2xl shadow-brand-sky-blue/10">
            <CardHeader className="space-y-1">
              <div className="flex justify-center mb-4">
                <div className="p-4 rounded-full bg-brand-sky-blue/10 border border-brand-sky-blue/30">
                  <Mail className="h-8 w-8 text-brand-sky-blue" />
                </div>
              </div>
              <CardTitle className="text-2xl font-bold text-center text-white">
                Verify Your Email
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isVerifying ? (
                <Alert className="bg-green-500/10 border-green-500/30 mb-6">
                  <CheckCircle2 className="h-5 w-5 text-green-400" />
                  <AlertDescription className="text-green-300 ml-2">
                    <div className="flex items-center space-x-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Verifying your email...</span>
                    </div>
                  </AlertDescription>
                </Alert>
              ) : (
                <form onSubmit={handleVerify} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="code" className="text-white text-sm">
                      Verification Code
                    </Label>
                    <Input
                      id="code"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      placeholder="000000"
                      value={code}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '');
                        setCode(value);
                        setError('');
                      }}
                      className="bg-brand-midnight/50 border-brand-sky-blue/30 text-white text-center text-2xl font-mono tracking-widest placeholder:text-gray-600 focus:border-brand-sky-blue focus:ring-brand-sky-blue/50 transition-all duration-300"
                      autoComplete="off"
                      autoFocus
                    />
                    {error && (
                      <Alert className="bg-red-500/10 border-red-500/30">
                        <AlertCircle className="h-4 w-4 text-red-400" />
                        <AlertDescription className="text-red-300 ml-2 text-sm">
                          {error}
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>

                  <Button
                    type="submit"
                    disabled={isVerifying || code.length !== 6}
                    className="w-full bg-gradient-to-r from-brand-sky-blue to-brand-sky-blue-light hover:from-brand-sky-blue-light hover:to-brand-sky-blue text-white font-semibold py-3 rounded-lg shadow-lg shadow-brand-sky-blue/50 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-brand-sky-blue/70 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    {isVerifying ? (
                      <span className="flex items-center justify-center space-x-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Verifying...</span>
                      </span>
                    ) : (
                      'Verify Email'
                    )}
                  </Button>

                  {resendSuccess && (
                    <Alert className="bg-green-500/10 border-green-500/30">
                      <CheckCircle2 className="h-4 w-4 text-green-400" />
                      <AlertDescription className="text-green-300 ml-2 text-sm">
                        Verification code resent! Check your inbox.
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="text-center space-y-2">
                    <p className="text-sm text-gray-400">
                      Didn't receive the code?
                    </p>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={handleResendCode}
                      disabled={resendLoading}
                      className="text-brand-sky-blue hover:text-brand-sky-blue-light hover:bg-brand-sky-blue/10 transition-all duration-300"
                    >
                      {resendLoading ? (
                        <span className="flex items-center space-x-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Resending...</span>
                        </span>
                      ) : (
                        'Resend Code'
                      )}
                    </Button>
                  </div>

                  <div className="bg-brand-sky-blue/5 border border-brand-sky-blue/20 rounded-lg p-4 space-y-2">
                    <p className="text-xs text-gray-400">
                      <strong className="text-gray-300">
                        📧 Check your spam folder
                      </strong>{' '}
                      if you don't see the email within a few minutes
                    </p>
                    <p className="text-xs text-gray-400">
                      <strong className="text-gray-300">🔒 Secure:</strong> The
                      verification code expires after 24 hours
                    </p>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push('/signup')}
                    className="w-full border-brand-sky-blue/30 bg-brand-midnight/30 hover:bg-brand-midnight/50 text-gray-300 hover:text-white transition-all duration-300"
                  >
                    Back to Sign Up
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>

          <p className="text-center text-xs text-gray-500">
            By verifying your email, you confirm you have access to this address
          </p>
        </div>
      </div>
    </div>
  );
}
