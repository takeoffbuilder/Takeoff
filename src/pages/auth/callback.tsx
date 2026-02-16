import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StarField } from '@/components/StarField';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';

export default function AuthCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>(
    'loading'
  );
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const hashParams = new URLSearchParams(
          window.location.hash.substring(1)
        );
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');

        if (!accessToken) {
          setStatus('error');
          setErrorMessage('No access token found in URL');
          return;
        }

        const { data: sessionData, error: sessionError } =
          await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || '',
          });

        if (sessionError) {
          setStatus('error');
          setErrorMessage(sessionError.message);
          return;
        }

        if (sessionData.user) {
          if (typeof window !== 'undefined') {
            localStorage.setItem('userEmail', sessionData.user.email || '');
            localStorage.setItem('isAuthenticated', 'true');
            localStorage.removeItem('pendingEmailVerification');

            // Referral code tracking and routing
            const urlParams = new URLSearchParams(window.location.search);
            const referralCode = urlParams.get('ref');
            const attached = sessionStorage.getItem('referral_attached');
            if (referralCode && !attached) {
              try {
                await fetch('/api/referral/attach', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ referralCode }),
                });
                sessionStorage.setItem('referral_attached', '1');
              } catch {
                // Optionally handle error
              }
            }

            setStatus('success');

            setTimeout(() => {
              router.push('/dashboard');
            }, 2000);
          }
        }
      } catch (error) {
        console.error('Callback error:', error);
        setStatus('error');
        setErrorMessage('An unexpected error occurred');
      }
    };
    handleCallback();
  }, [router]);

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-sky-blue via-brand-sky-blue-light to-brand-purple">
      <StarField />
      <div className="relative z-10 w-full max-w-md mx-auto">
        <Card className="bg-gradient-to-br from-brand-sky-blue/80 to-brand-purple/80 border-none shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center text-white">
              {status === 'loading' && 'Verifying Email...'}
              {status === 'success' && 'Email Verified!'}
              {status === 'error' && 'Verification Failed'}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center space-y-6">
            {status === 'loading' && (
              <>
                <Loader2 className="h-16 w-16 text-brand-sky-blue animate-spin" />
                <p className="text-gray-400 text-center">
                  Please wait while we verify your email...
                </p>
              </>
            )}

            {status === 'success' && (
              <>
                <div className="p-4 rounded-full bg-green-500/10 border border-green-500/30">
                  <CheckCircle2 className="h-16 w-16 text-green-400" />
                </div>
                <div className="text-center space-y-2">
                  <p className="text-white font-semibold text-lg">
                    Your email has been verified!
                  </p>
                  <p className="text-gray-400 text-sm">
                    Redirecting to your dashboard...
                  </p>
                </div>
              </>
            )}

            {status === 'error' && (
              <>
                <div className="p-4 rounded-full bg-red-500/10 border border-red-500/30">
                  <AlertCircle className="h-16 w-16 text-red-400" />
                </div>
                <div className="text-center space-y-2">
                  <p className="text-white font-semibold text-lg">
                    Verification Failed
                  </p>
                  <p className="text-red-400 text-sm">{errorMessage}</p>
                </div>
                <Button
                  onClick={() => router.push('/signup')}
                  className="w-full bg-gradient-to-r from-brand-sky-blue to-brand-sky-blue-light hover:from-brand-sky-blue-light hover:to-brand-sky-blue text-white font-semibold"
                >
                  Back to Sign Up
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
