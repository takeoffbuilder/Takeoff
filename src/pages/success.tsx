import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { StarField } from "@/components/StarField";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Loader2, AlertCircle } from "lucide-react";

export default function SuccessPage() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(5);
  const [isProcessing, setIsProcessing] = useState(true);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [error] = useState<string | null>(null);

  useEffect(() => {
    // Get session_id from URL query parameters
    const { session_id } = router.query;
    
    if (session_id && typeof session_id === "string") {
      setSessionId(session_id);
      console.log("✅ Stripe session ID captured:", session_id);
    }

    // Give webhook 3-5 seconds to process before showing success
    const processingTimer = setTimeout(() => {
      setIsProcessing(false);
    }, 3000);

    // Start countdown after processing completes
    const countdownTimer = setTimeout(() => {
      const countdownInterval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(countdownInterval);
            router.push("/dashboard");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(countdownInterval);
    }, 3000);

    return () => {
      clearTimeout(processingTimer);
      clearTimeout(countdownTimer);
    };
  }, [router]);

  const handleGoToDashboard = () => {
    router.push("/dashboard");
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-b from-brand-midnight via-brand-charcoal to-brand-midnight">
      <StarField />
      
      <div className="absolute inset-0 bg-gradient-radial from-brand-sky-blue/5 via-transparent to-transparent opacity-50" />
      
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4">
        <Card className="w-full max-w-2xl border-brand-sky-blue/20 bg-brand-charcoal/50 backdrop-blur-xl shadow-xl shadow-brand-sky-blue/5">
          <CardHeader className="text-center space-y-4 pb-2">
            {isProcessing ? (
              <>
                <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-r from-brand-sky-blue to-brand-sky-blue-light flex items-center justify-center animate-pulse">
                  <Loader2 className="w-10 h-10 text-white animate-spin" />
                </div>
                <CardTitle className="text-3xl font-bold text-white">
                  Processing Your Payment...
                </CardTitle>
                <CardDescription className="text-gray-400 text-lg">
                  Please wait while we set up your account
                </CardDescription>
              </>
            ) : error ? (
              <>
                <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-r from-red-500 to-red-600 flex items-center justify-center">
                  <AlertCircle className="w-10 h-10 text-white" />
                </div>
                <CardTitle className="text-3xl font-bold text-red-400">
                  Payment Issue Detected
                </CardTitle>
                <CardDescription className="text-gray-400 text-lg">
                  {error}
                </CardDescription>
              </>
            ) : (
              <>
                <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 flex items-center justify-center">
                  <CheckCircle className="w-10 h-10 text-white animate-bounce" />
                </div>
                <CardTitle className="text-3xl font-bold bg-gradient-to-r from-brand-sky-blue to-brand-sky-blue-light bg-clip-text text-transparent">
                  Payment Successful! 🎉
                </CardTitle>
                <CardDescription className="text-gray-400 text-lg">
                  Your account is being activated
                </CardDescription>
              </>
            )}
          </CardHeader>
          
          <CardContent className="space-y-6 pt-6">
            {isProcessing ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-gray-300">
                  <div className="w-2 h-2 rounded-full bg-brand-sky-blue animate-pulse"></div>
                  <span>Verifying payment details...</span>
                </div>
                <div className="flex items-center gap-3 text-gray-300">
                  <div className="w-2 h-2 rounded-full bg-brand-sky-blue animate-pulse" style={{ animationDelay: "200ms" }}></div>
                  <span>Creating your booster account...</span>
                </div>
                <div className="flex items-center gap-3 text-gray-300">
                  <div className="w-2 h-2 rounded-full bg-brand-sky-blue animate-pulse" style={{ animationDelay: "400ms" }}></div>
                  <span>Setting up credit reporting...</span>
                </div>
                
                {sessionId && (
                  <div className="mt-4 pt-4 border-t border-brand-sky-blue/10">
                    <p className="text-xs text-gray-500 text-center">
                      Session: {sessionId.slice(0, 20)}...
                    </p>
                  </div>
                )}
              </div>
            ) : error ? (
              <div className="space-y-4">
                <div className="bg-red-500/10 rounded-lg p-4 border border-red-500/20">
                  <p className="text-sm text-gray-300 text-center">
                    We detected an issue with your payment session. Please check your dashboard to see if your account was created.
                  </p>
                </div>
                
                <Button
                  onClick={handleGoToDashboard}
                  className="w-full bg-gradient-to-r from-brand-sky-blue to-brand-sky-blue-light hover:from-brand-sky-blue-light hover:to-brand-sky-blue text-white"
                  size="lg"
                >
                  Go to Dashboard
                </Button>
              </div>
            ) : (
              <>
                <div className="bg-brand-midnight/30 rounded-lg p-6 border border-brand-sky-blue/10 space-y-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-white font-medium">Payment Processed</p>
                      <p className="text-gray-400 text-sm mt-1">
                        Your subscription has been activated and will renew monthly
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-white font-medium">Account Created</p>
                      <p className="text-gray-400 text-sm mt-1">
                        Your booster account is now active and ready to build credit
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-white font-medium">Credit Reporting Active</p>
                      <p className="text-gray-400 text-sm mt-1">
                        Your payment history will be reported to TransUnion monthly
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-brand-sky-blue/10 to-brand-sky-blue-light/10 rounded-lg p-4 border border-brand-sky-blue/20">
                  <p className="text-center text-white">
                    Redirecting to your dashboard in{" "}
                    <span className="font-bold text-brand-sky-blue text-xl">
                      {countdown}
                    </span>{" "}
                    seconds...
                  </p>
                </div>

                <Button
                  onClick={handleGoToDashboard}
                  className="w-full bg-gradient-to-r from-brand-sky-blue to-brand-sky-blue-light hover:from-brand-sky-blue-light hover:to-brand-sky-blue text-white shadow-lg shadow-brand-sky-blue/30 transition-all duration-300 hover:scale-105"
                  size="lg"
                >
                  Go to Dashboard Now
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
