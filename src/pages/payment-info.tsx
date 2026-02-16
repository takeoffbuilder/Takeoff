import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { StarField } from '@/components/StarField';
import { ArrowRight, CreditCard } from 'lucide-react';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface PaymentInfoForm {
  cardholderName: string;
  cardNumber: string;
  expirationDate: string;
  cvv: string;
  autoPayEnabled: boolean;
}

const EMPTY_FORM: PaymentInfoForm = {
  cardholderName: '',
  cardNumber: '',
  expirationDate: '',
  cvv: '',
  autoPayEnabled: false,
};

export default function PaymentInfoPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [formData, setFormData] = useState<PaymentInfoForm>(EMPTY_FORM);
  const [dataLoaded, setDataLoaded] = useState(false);

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

      setUserId(user.id);

      const newFormData = { ...EMPTY_FORM };

      const savedData = localStorage.getItem(`paymentInfo_${user.id}`);
      if (savedData) {
        try {
          const parsed = JSON.parse(savedData);
          Object.assign(newFormData, parsed);
        } catch (error) {
          console.error('Error loading saved data:', error);
        }
      }

      setFormData(newFormData);
      setDataLoaded(true);
    };

    loadUserData();
  }, [router, toast]);

  const handleInputChange = (
    field: keyof PaymentInfoForm,
    value: string | boolean
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const formatCardNumber = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    const chunks = numbers.match(/.{1,4}/g) || [];
    return chunks.join(' ').slice(0, 19);
  };

  const formatExpirationDate = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 2) return numbers;
    return `${numbers.slice(0, 2)}/${numbers.slice(2, 4)}`;
  };

  const validateForm = () => {
    if (!formData.cardholderName.trim()) {
      toast({
        title: 'Missing Information',
        description: 'Please enter the cardholder name',
        variant: 'destructive',
      });
      return false;
    }

    const cardNumbers = formData.cardNumber.replace(/\D/g, '');
    if (cardNumbers.length !== 16) {
      toast({
        title: 'Invalid Card Number',
        description: 'Card number must be 16 digits',
        variant: 'destructive',
      });
      return false;
    }

    const expNumbers = formData.expirationDate.replace(/\D/g, '');
    if (expNumbers.length !== 4) {
      toast({
        title: 'Invalid Expiration Date',
        description: 'Please enter a valid expiration date (MM/YY)',
        variant: 'destructive',
      });
      return false;
    }

    const month = parseInt(expNumbers.slice(0, 2));
    if (month < 1 || month > 12) {
      toast({
        title: 'Invalid Expiration Date',
        description: 'Month must be between 01 and 12',
        variant: 'destructive',
      });
      return false;
    }

    if (formData.cvv.length < 3 || formData.cvv.length > 4) {
      toast({
        title: 'Invalid CVV',
        description: 'CVV must be 3 or 4 digits',
        variant: 'destructive',
      });
      return false;
    }

    return true;
  };

  const handleContinue = () => {
    if (!validateForm() || !userId) return;

    setLoading(true);

    localStorage.setItem(`paymentInfo_${userId}`, JSON.stringify(formData));

    toast({
      title: 'Success!',
      description:
        'Payment information saved successfully. Redirecting you to the next step...',
      duration: 2000,
    });

    setTimeout(() => {
      router.push('/confirmation');
    }, 2000);
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
        <Card className="w-full max-w-2xl border-brand-sky-blue/30 bg-brand-charcoal/80 backdrop-blur-xl shadow-2xl shadow-brand-sky-blue/20">
          <CardHeader className="text-center space-y-4 pt-8">
            <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-r from-brand-sky-blue to-brand-sky-blue-light flex items-center justify-center shadow-xl shadow-brand-sky-blue/40">
              <CreditCard className="w-8 h-8 text-white" />
            </div>

            <div className="space-y-2">
              <CardTitle className="text-3xl md:text-4xl font-bold text-brand-white">
                Add Payment Information
              </CardTitle>
              <p className="text-lg text-brand-white/80">
                Secure your account setup
              </p>
            </div>
          </CardHeader>

          <CardContent className="px-8 pb-8 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="cardholderName" className="text-brand-white">
                Cardholder Name
              </Label>
              <Input
                id="cardholderName"
                value={formData.cardholderName}
                onChange={(e) =>
                  handleInputChange('cardholderName', e.target.value)
                }
                className="bg-brand-midnight/50 border-brand-sky-blue/30 text-brand-white focus:border-brand-sky-blue"
                placeholder="John Doe"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cardNumber" className="text-brand-white">
                Card Number
              </Label>
              <Input
                id="cardNumber"
                value={formData.cardNumber}
                onChange={(e) =>
                  handleInputChange(
                    'cardNumber',
                    formatCardNumber(e.target.value)
                  )
                }
                className="bg-brand-midnight/50 border-brand-sky-blue/30 text-brand-white focus:border-brand-sky-blue"
                placeholder="1234 5678 9012 3456"
                maxLength={19}
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="expirationDate" className="text-brand-white">
                  Expiration Date
                </Label>
                <Input
                  id="expirationDate"
                  value={formData.expirationDate}
                  onChange={(e) =>
                    handleInputChange(
                      'expirationDate',
                      formatExpirationDate(e.target.value)
                    )
                  }
                  className="bg-brand-midnight/50 border-brand-sky-blue/30 text-brand-white focus:border-brand-sky-blue"
                  placeholder="MM/YY"
                  maxLength={5}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cvv" className="text-brand-white">
                  CVV
                </Label>
                <Input
                  id="cvv"
                  value={formData.cvv}
                  onChange={(e) =>
                    handleInputChange(
                      'cvv',
                      e.target.value.replace(/\D/g, '').slice(0, 4)
                    )
                  }
                  className="bg-brand-midnight/50 border-brand-sky-blue/30 text-brand-white focus:border-brand-sky-blue"
                  placeholder="123"
                  maxLength={4}
                />
              </div>
            </div>

            <div className="flex items-center space-x-3 bg-brand-midnight/30 p-4 rounded-lg border border-brand-sky-blue/20">
              <Checkbox
                id="autoPay"
                checked={formData.autoPayEnabled}
                onCheckedChange={(checked) =>
                  handleInputChange('autoPayEnabled', checked === true)
                }
                className="border-brand-sky-blue/50 data-[state=checked]:bg-brand-sky-blue data-[state=checked]:border-brand-sky-blue"
              />
              <Label
                htmlFor="autoPay"
                className="text-brand-white cursor-pointer flex-1"
              >
                Enable Auto Pay
                <p className="text-sm text-brand-white/60 mt-1">
                  Automatically process payments each month to keep your credit
                  building on track
                </p>
              </Label>
            </div>

            <div className="bg-brand-sky-blue/10 border border-brand-sky-blue/30 rounded-lg p-4 mt-6">
              <p className="text-brand-white/80 text-sm">
                🔒 Your payment information is encrypted and secure. We use
                industry-standard security measures to protect your data.
              </p>
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
    </div>
  );
}
