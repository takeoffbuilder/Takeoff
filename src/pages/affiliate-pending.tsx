import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

export default function AffiliatePendingPage() {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-b from-brand-midnight via-brand-charcoal to-brand-midnight flex items-center justify-center">
      <Card className="w-full max-w-lg border-brand-sky-blue/20 bg-brand-charcoal/70 backdrop-blur-xl shadow-2xl shadow-brand-sky-blue/10">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center text-white">
            Affiliate Application Pending
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center py-8">
            <Loader2 className="h-10 w-10 animate-spin text-brand-sky-blue mb-4" />
            <p className="text-white text-lg font-semibold text-center mb-2">
              Your application is being processed.
            </p>
            <p className="text-gray-300 text-center">
              You will receive a Stripe onboarding link via email or on this
              page once it's ready.
              <br />
              Please check back soon or watch your inbox for updates.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
