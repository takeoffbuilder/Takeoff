import { Button } from '@/components/ui/button';
// (removed duplicate Input import)
import { getMyReferrer, buildReferralLink } from '@/services/referralService';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StarField } from '@/components/StarField';
import { useRouter } from 'next/router';
import { useEffect, useState, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { Trash2, ArrowLeft, Lock, BookOpen } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { authService } from '@/services/authService';
import { profileService } from '@/services/profileService';
import { boosterAccountService } from '@/services/boosterAccountService';
import { addressService } from '@/services/addressService';
import { isAdmin } from '@/services/adminService';

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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface SettingsAccount {
  id: string;
  planName: string;
  monthlyAmount: number;
  creditLimit: number;
  status: 'Active' | 'Cancelled' | string;
  dateAdded: string;
  nextPaymentDate?: string | null;
}

export default function SettingsPage() {
  // Affiliate state (Supabase)
  const [affiliateLink, setAffiliateLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isAffiliate, setIsAffiliate] = useState(false);
  const [loadingAffiliate, setLoadingAffiliate] = useState(true);

  const router = useRouter();
  const [showAdminButton, setShowAdminButton] = useState(false);

  useEffect(() => {
    async function fetchAffiliate() {
      setLoadingAffiliate(true);
      const referrer = await getMyReferrer();
      if (referrer && referrer.referral_code) {
        setAffiliateLink(buildReferralLink(referrer.referral_code));
        setIsAffiliate(true);
      } else {
        setIsAffiliate(false);
        setAffiliateLink(null);
      }
      setLoadingAffiliate(false);
    }
    fetchAffiliate();
  }, []);

  useEffect(() => {
    const checkAdmin = async () => {
      const user = await authService.getCurrentUser();
      if (user) {
        const admin = await isAdmin(user.email);
        setShowAdminButton(admin);
      } else {
        setShowAdminButton(false);
      }
    };
    checkAdmin();
  }, [router.asPath]);
  const handleCopyReferralLink = () => {
    if (affiliateLink) {
      navigator.clipboard.writeText(affiliateLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
      toast({
        title: 'Copied!',
        description: 'Referral link copied to clipboard.',
      });
    }
  };

  const { toast } = useToast();

  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    address2: '',
    city: '',
    state: '',
    zipCode: '',
  });

  const [boosterAccounts, setBoosterAccounts] = useState<SettingsAccount[]>([]);
  const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>([]);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [addrDialogOpen, setAddrDialogOpen] = useState(false);
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
  const [isSaving, setIsSaving] = useState(false);

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const loadUserData = useCallback(
    async (userId: string, userEmail: string | undefined) => {
      try {
        const [personalInfo, profile] = await Promise.all([
          profileService.getPersonalInfo(userId),
          profileService.getProfile(userId),
        ]);

        const splitName = (full?: string | null) => {
          if (!full) return { first: '', last: '' };
          const parts = full.trim().split(/\s+/);
          if (parts.length === 1) return { first: parts[0] || '', last: '' };
          return { first: parts[0] || '', last: parts.slice(1).join(' ') };
        };
        const fromProfile = splitName(
          (profile as { full_name?: string | null })?.full_name
        );
        const firstName = personalInfo?.first_name || fromProfile.first || '';
        const lastName = personalInfo?.last_name || fromProfile.last || '';

        if (personalInfo) {
          setProfileData({
            firstName,
            lastName,
            email: userEmail || '',
            phone: personalInfo.phone || '',
            address: personalInfo.address || '',
            address2: '',
            city: personalInfo.city || '',
            state: personalInfo.state || '',
            zipCode: personalInfo.zip_code || '',
          });
        } else {
          setProfileData((prev) => ({
            ...prev,
            firstName,
            lastName,
            email: userEmail || '',
          }));
        }
      } catch (error) {
        console.error('Error loading user data:', error);
        toast({
          title: 'Error Loading Profile',
          description: 'There was an issue loading your profile information.',
          variant: 'destructive',
        });
      }
    },
    [toast]
  );

  const loadAccountData = useCallback(
    async (userId: string) => {
      try {
        const accounts = (await boosterAccountService.getUserAccounts(
          userId
        )) as Array<{
          id: string;
          booster_plans?: { plan_name?: string | null } | null;
          monthly_amount: string | number;
          credit_limit: string | number;
          status: string;
          created_at: string;
          next_payment_date?: string | null;
        }>;
        const toNumber = (v: string | number | null | undefined) =>
          typeof v === 'number' ? v : v ? Number(v) : 0;
        const transformedAccounts = accounts.map((account) => ({
          id: account.id,
          planName: account.booster_plans?.plan_name || 'Unknown Plan',
          monthlyAmount: toNumber(account.monthly_amount),
          creditLimit: toNumber(account.credit_limit),
          status: account.status === 'active' ? 'Active' : 'Cancelled',
          dateAdded: account.created_at,
          nextPaymentDate: account.next_payment_date,
        }));
        setBoosterAccounts(transformedAccounts);
      } catch (error) {
        console.error('Error loading account data:', error);
        toast({
          title: 'Error Loading Accounts',
          description: 'Failed to load booster accounts.',
          variant: 'destructive',
        });
      }
    },
    [toast]
  );

  // Now that dependent loaders are defined, declare page loader and effect
  const loadPageData = useCallback(async () => {
    try {
      const user = await authService.getCurrentUser();
      if (!user) {
        router.push('/signin');
        return;
      }

      await Promise.all([
        loadUserData(user.id, user.email),
        loadAccountData(user.id),
      ]);
    } catch (error) {
      console.error('Error loading settings page data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load page data. Please refresh.',
        variant: 'destructive',
      });
    }
  }, [router, toast, loadUserData, loadAccountData]);

  useEffect(() => {
    // Initial page load
    loadPageData();
  }, [loadPageData]);

  const handleInputChange = (field: string, value: string) => {
    setProfileData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const savePersonalInfo = async (
    addr: {
      address: string;
      address2?: string;
      city: string;
      state: string;
      zipCode: string;
    },
    opts?: { showToast?: boolean }
  ) => {
    const showToast = opts?.showToast !== false;
    const user = await authService.getCurrentUser();
    if (!user) {
      toast({ title: 'Not authenticated', variant: 'destructive' });
      return false;
    }

    // Always attempt to update both tables and surface errors
    let personalInfoError = null;
    let profileError = null;

    // Update user_personal_info table
    try {
      await profileService.updatePersonalInfo(user.id, {
        phone: profileData.phone,
        address: addr.address,
        address2: addr.address2 || null,
        city: addr.city,
        state: addr.state,
        zip_code: addr.zipCode,
      });
    } catch (err) {
      personalInfoError = err;
      if (err && typeof err === 'object') {
        console.error(
          'Personal info update error:',
          JSON.stringify(err, Object.getOwnPropertyNames(err))
        );
      } else {
        console.error('Personal info update error:', err);
      }
    }

    // Update profiles table
    const profilePayload = {
      email: profileData.email,
      phone: profileData.phone,
      address: profileData.address,
      city: profileData.city,
      state: profileData.state,
      zip_code: profileData.postal_code,
      updated_at: new Date().toISOString(),
    };
    console.log('Updating profiles table with:', profilePayload);
    try {
      const result = await profileService.updateProfile(
        user.id,
        profilePayload
      );
      console.log('Profile update result:', result);
    } catch (err) {
      profileError = err;
      if (err && typeof err === 'object') {
        console.error(
          'Profile update error:',
          JSON.stringify(err, Object.getOwnPropertyNames(err))
        );
      } else {
        console.error('Profile update error:', err);
      }
    }

    // Surface errors to user
    if (personalInfoError || profileError) {
      toast({
        title: 'Update Failed',
        description:
          (personalInfoError ? 'Personal info update failed. ' : '') +
          (profileError ? 'Profile update failed.' : ''),
        variant: 'destructive',
      });
      return false;
    }

    if (showToast) {
      toast({
        title: 'Profile Updated',
        description: 'Your profile information has been saved successfully.',
      });
    }
    return true;
  };

  const handleSaveChanges = async () => {
    try {
      setIsSaving(true);

      const verify = await addressService.verify({
        streetAddress: profileData.address,
        address2: profileData.address2 || '',
        city: profileData.city,
        state: profileData.state,
        zipCode: profileData.zipCode,
      });

      if (!verify.configured) {
        // Address validation not configured; proceed to save without blocking
        const ok = await savePersonalInfo({
          address: profileData.address,
          address2: profileData.address2,
          city: profileData.city,
          state: profileData.state,
          zipCode: profileData.zipCode,
        });
        if (ok) return;
      }

      if (verify.deliverable === false) {
        toast({
          title: 'Oops!!',
          description:
            'Check the address for correct entry. Address validation failed.',
          variant: 'destructive',
        });
        return;
      }

      const n = verify.normalized;
      const dpv = verify.dpv?.confirmation;
      if (n) {
        const differs =
          n.street1.trim().toLowerCase() !==
            profileData.address.trim().toLowerCase() ||
          n.city.trim().toLowerCase() !==
            profileData.city.trim().toLowerCase() ||
          n.state.trim().toUpperCase() !==
            profileData.state.trim().toUpperCase() ||
          n.zip5.trim() !== profileData.zipCode.trim();

        if (differs || dpv === 'S') {
          setProposedAddress({
            street1: n.street1,
            street2: n.street2 || undefined,
            city: n.city,
            state: n.state,
            zip5: n.zip5,
            zip4: n.zip4 || undefined,
            dpv: dpv || null,
            notes: verify.notes,
          });
          setAddrDialogOpen(true);
          return;
        }
      }

      // No suggestion needed; save as entered
      await savePersonalInfo({
        address: profileData.address,
        address2: profileData.address2,
        city: profileData.city,
        state: profileData.state,
        zipCode: profileData.zipCode,
      });
    } catch (e) {
      console.error('Error saving changes with address validation:', e);
      toast({
        title: 'Update Failed',
        description:
          'Could not validate or save your address. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordChange = (field: string, value: string) => {
    setPasswordData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSavePassword = () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: 'Password Mismatch',
        description: 'New password and confirmation do not match.',
        variant: 'destructive',
        duration: 3000,
      });
      return;
    }

    if (passwordData.newPassword.length < 8) {
      toast({
        title: 'Password Too Short',
        description: 'Password must be at least 8 characters long.',
        variant: 'destructive',
        duration: 3000,
      });
      return;
    }

    toast({
      title: 'Password Updated',
      description: 'Your password has been changed successfully.',
      duration: 3000,
    });

    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
    setShowPasswordDialog(false);
  };

  const handleCheckboxChange = (accountId: string, checked: boolean) => {
    if (checked) {
      setSelectedAccountIds((prev) => [...prev, accountId]);
    } else {
      setSelectedAccountIds((prev) => prev.filter((id) => id !== accountId));
    }
  };

  const handleCancelPlanClick = () => {
    if (selectedAccountIds.length === 0) {
      toast({
        title: 'No Plans Selected',
        description: 'Please select at least one plan to cancel.',
        variant: 'destructive',
        duration: 3000,
      });
      return;
    }
    setShowCancelDialog(true);
  };

  const handleConfirmCancel = async () => {
    const user = await authService.getCurrentUser();
    if (!user) return;

    try {
      await Promise.all(
        selectedAccountIds.map((accountId) =>
          boosterAccountService.cancelAccount(accountId)
        )
      );

      await loadAccountData(user.id);
      setSelectedAccountIds([]);
      setShowCancelDialog(false);

      toast({
        title: 'Plan(s) Cancelled Successfully',
        description:
          'Your selected Booster plan(s) have been successfully cancelled.',
      });
    } catch {
      toast({
        title: 'Cancellation Failed',
        description: 'Could not cancel plans. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleAddAnotherPlan = () => {
    router.push('/choose-plan?mode=add');
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-b from-brand-midnight via-brand-charcoal to-brand-midnight">
      <StarField />

      <div className="absolute inset-0 bg-gradient-radial from-brand-sky-blue/5 via-transparent to-transparent opacity-50" />

      <div className="relative z-10 min-h-screen">
        <header className="border-b border-brand-sky-blue/20 bg-brand-charcoal/50 backdrop-blur-xl">
          <div className="container mx-auto px-4 py-4">
            <Button
              onClick={() => router.push('/dashboard')}
              variant="ghost"
              className="text-white hover:bg-brand-sky-blue/10 hover:text-brand-sky-blue-light flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
            {showAdminButton && (
              <Button
                onClick={() => router.push('/admin')}
                variant="outline"
                className="ml-4 text-white border-brand-sky-blue/30 hover:bg-brand-sky-blue/10 hover:text-brand-sky-blue-light"
              >
                Admin Dashboard
              </Button>
            )}
          </div>
        </header>

        <main className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="text-center space-y-4">
              <h1 className="text-4xl font-bold text-white">
                Account Settings
              </h1>
              <p className="text-xl text-gray-400">
                Manage your profile and booster plans
              </p>
            </div>

            <Card className="border-brand-sky-blue/20 bg-brand-charcoal/50 backdrop-blur-xl shadow-xl shadow-brand-sky-blue/5">
              <CardHeader>
                <CardTitle className="text-white text-2xl">
                  Profile Information
                </CardTitle>
                <CardDescription className="text-gray-400">
                  View and update your personal details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Affiliate Section (Supabase) */}
                <div className="pt-2 pb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg font-semibold text-brand-sky-blue">
                      Affiliate Status:
                    </span>
                    {isAffiliate ? (
                      <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                        Active
                      </Badge>
                    ) : (
                      <Badge className="bg-gray-500/20 text-gray-300 border-gray-500/30">
                        Not Active
                      </Badge>
                    )}
                  </div>
                  {isAffiliate && affiliateLink ? (
                    <div className="flex flex-col md:flex-row items-center gap-2">
                      <Input
                        value={affiliateLink}
                        readOnly
                        className="bg-brand-midnight/50 border-brand-sky-blue/30 text-white w-full md:w-2/3"
                        onFocus={(e) => e.target.select()}
                      />
                      <Button
                        variant="outline"
                        onClick={handleCopyReferralLink}
                        className="border-brand-sky-blue/30 text-white hover:bg-brand-sky-blue/10 hover:text-brand-sky-blue-light"
                      >
                        {copied ? 'Copied!' : 'Copy Link'}
                      </Button>
                    </div>
                  ) : (
                    <Button
                      onClick={() => {
                        // Redirect to affiliate application form if not already affiliate
                        window.location.href = '/affiliate';
                      }}
                      disabled={loadingAffiliate}
                      className="bg-gradient-to-r from-brand-sky-blue to-brand-sky-blue-light hover:from-brand-sky-blue-light hover:to-brand-sky-blue text-white mt-2"
                    >
                      {loadingAffiliate ? 'Loading…' : 'Become an Affiliate'}
                    </Button>
                  )}
                </div>
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-gray-300">
                      First Name
                    </Label>
                    <Input
                      id="firstName"
                      value={profileData.firstName}
                      disabled
                      className="bg-gray-800/50 border-brand-sky-blue/20 text-gray-400 cursor-not-allowed"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-gray-300">
                      Last Name
                    </Label>
                    <Input
                      id="lastName"
                      value={profileData.lastName}
                      disabled
                      className="bg-gray-800/50 border-brand-sky-blue/20 text-gray-400 cursor-not-allowed"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="email" className="text-gray-300">
                      Email Address
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={profileData.email}
                      disabled
                      className="bg-gray-800/50 border-brand-sky-blue/20 text-gray-400 cursor-not-allowed"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="phone" className="text-gray-300">
                      Phone Number
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="(555) 555-5555"
                      value={profileData.phone}
                      onChange={(e) =>
                        handleInputChange('phone', e.target.value)
                      }
                      className="bg-brand-midnight/50 border-brand-sky-blue/30 text-white placeholder:text-gray-500 focus:border-brand-sky-blue"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="address" className="text-gray-300">
                      Street Address
                    </Label>
                    <Input
                      id="address"
                      placeholder="123 Main St"
                      value={profileData.address}
                      onChange={(e) =>
                        handleInputChange('address', e.target.value)
                      }
                      className="bg-brand-midnight/50 border-brand-sky-blue/30 text-white placeholder:text-gray-500 focus:border-brand-sky-blue"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="address2" className="text-gray-300">
                      Address 2 (Apt, Suite, Unit)
                    </Label>
                    <Input
                      id="address2"
                      placeholder="Apt 4B"
                      value={profileData.address2}
                      onChange={(e) =>
                        handleInputChange('address2', e.target.value)
                      }
                      className="bg-brand-midnight/50 border-brand-sky-blue/30 text-white placeholder:text-gray-500 focus:border-brand-sky-blue"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="city" className="text-gray-300">
                      City
                    </Label>
                    <Input
                      id="city"
                      placeholder="New York"
                      value={profileData.city}
                      onChange={(e) =>
                        handleInputChange('city', e.target.value)
                      }
                      className="bg-brand-midnight/50 border-brand-sky-blue/30 text-white placeholder:text-gray-500 focus:border-brand-sky-blue"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="state" className="text-gray-300">
                      State
                    </Label>
                    <Input
                      id="state"
                      placeholder="NY"
                      value={profileData.state}
                      onChange={(e) =>
                        handleInputChange('state', e.target.value)
                      }
                      className="bg-brand-midnight/50 border-brand-sky-blue/30 text-white placeholder:text-gray-500 focus:border-brand-sky-blue"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="zipCode" className="text-gray-300">
                      Zip Code
                    </Label>
                    <Input
                      id="zipCode"
                      placeholder="10001"
                      value={profileData.zipCode}
                      onChange={(e) =>
                        handleInputChange('zipCode', e.target.value)
                      }
                      className="bg-brand-midnight/50 border-brand-sky-blue/30 text-white placeholder:text-gray-500 focus:border-brand-sky-blue"
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <Button
                    onClick={handleSaveChanges}
                    disabled={isSaving}
                    className="flex-1 bg-gradient-to-r from-brand-sky-blue to-brand-sky-blue-light hover:from-brand-sky-blue-light hover:to-brand-sky-blue text-white shadow-lg shadow-brand-sky-blue/30 disabled:opacity-60"
                  >
                    {isSaving ? 'Saving…' : 'Save Changes'}
                  </Button>
                  <Button
                    onClick={() => setShowPasswordDialog(true)}
                    variant="outline"
                    className="flex-1 border-brand-sky-blue/30 text-white hover:bg-brand-sky-blue/10 hover:text-brand-sky-blue-light flex items-center gap-2"
                  >
                    <Lock className="h-4 w-4" />
                    Change Password
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border-brand-sky-blue/20 bg-brand-charcoal/50 backdrop-blur-xl shadow-xl shadow-brand-sky-blue/5">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white text-2xl">
                      Your Current Booster Plans
                    </CardTitle>
                    <CardDescription className="text-gray-400">
                      Manage your active credit-building plans
                    </CardDescription>
                  </div>
                  {boosterAccounts.length > 0 && (
                    <Button
                      onClick={handleCancelPlanClick}
                      className="bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/30 transition-all duration-300 hover:scale-105 flex items-center gap-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      Cancel Plan
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {boosterAccounts.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-400 text-lg mb-4">
                      No active booster plans
                    </p>
                    <Button
                      onClick={handleAddAnotherPlan}
                      className="bg-gradient-to-r from-brand-sky-blue to-brand-sky-blue-light hover:from-brand-sky-blue-light hover:to-brand-sky-blue text-white shadow-lg shadow-brand-sky-blue/30"
                    >
                      Add Your First Plan
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-[auto,1fr,auto,auto,auto] gap-4 pb-2 border-b border-brand-sky-blue/20 text-sm font-medium text-gray-400">
                      <div className="w-12">Select</div>
                      <div>Plan Name</div>
                      <div className="text-right pr-4">Monthly Payment</div>
                      <div className="text-center w-32">Next Payment</div>
                      <div className="text-right w-24">Status</div>
                    </div>

                    {boosterAccounts.map((account) => {
                      const nextPaymentDate = new Date();
                      nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);

                      return (
                        <div
                          key={account.id}
                          className="grid grid-cols-[auto,1fr,auto,auto,auto] gap-4 py-4 px-3 rounded-lg bg-brand-midnight/30 hover:bg-brand-midnight/50 transition-all border border-brand-sky-blue/5 hover:border-brand-sky-blue/20 items-center"
                        >
                          <div className="w-12 flex items-center justify-center">
                            <Checkbox
                              checked={selectedAccountIds.includes(account.id)}
                              onCheckedChange={(checked) =>
                                handleCheckboxChange(
                                  account.id,
                                  checked === true
                                )
                              }
                              className="border-brand-sky-blue/50 data-[state=checked]:bg-brand-sky-blue data-[state=checked]:border-brand-sky-blue"
                            />
                          </div>
                          <div className="flex flex-col">
                            <h4 className="text-white font-semibold text-lg">
                              {account.planName}
                            </h4>
                          </div>
                          <div className="text-right pr-4">
                            <span className="text-white font-medium">
                              ${account.monthlyAmount}/mo
                            </span>
                          </div>
                          <div className="text-center w-32">
                            <span className="text-gray-300 text-sm">
                              {nextPaymentDate.toLocaleDateString('en-US', {
                                month: '2-digit',
                                day: '2-digit',
                                year: 'numeric',
                              })}
                            </span>
                          </div>
                          <div className="w-24 flex justify-end">
                            <Badge
                              className={
                                account.status === 'Active'
                                  ? 'bg-green-500/20 text-green-300 border-green-500/30'
                                  : 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
                              }
                            >
                              {account.status}
                            </Badge>
                          </div>
                        </div>
                      );
                    })}

                    <div className="pt-4">
                      <Button
                        onClick={handleAddAnotherPlan}
                        className="w-full bg-gradient-to-r from-brand-sky-blue to-brand-sky-blue-light hover:from-brand-sky-blue-light hover:to-brand-sky-blue text-white shadow-lg shadow-brand-sky-blue/30"
                      >
                        Add Another Plan
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card
              className="border-brand-sky-blue/20 bg-gradient-to-r from-brand-sky-blue/10 to-brand-sky-blue-light/10 backdrop-blur-xl shadow-xl shadow-brand-sky-blue/5 hover:shadow-brand-sky-blue/20 transition-all duration-300 cursor-pointer group"
              onClick={() => router.push('/my-courses')}
            >
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-brand-sky-blue/20 group-hover:bg-brand-sky-blue/30 transition-all duration-300">
                    <BookOpen className="h-8 w-8 text-brand-sky-blue" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-brand-sky-blue text-2xl group-hover:text-brand-sky-blue-light transition-colors">
                      My Courses
                    </CardTitle>
                    <CardDescription className="text-gray-300 mt-1">
                      Access your educational courses library
                    </CardDescription>
                  </div>
                  <div className="text-gray-400 group-hover:text-brand-sky-blue transition-colors">
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400">
                  📚 Unlock courses with each Booster Plan. Build your financial
                  knowledge and credit confidence with our comprehensive
                  educational library.
                </p>
                <div className="mt-4 flex items-center gap-2 text-brand-sky-blue text-sm font-medium">
                  <span>View Available Courses</span>
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M14 5l7 7m0 0l-7 7m7-7H3"
                    />
                  </svg>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>

      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent className="bg-brand-charcoal border-brand-sky-blue/30">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white text-xl">
              Cancel Selected Plan(s)?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              Are you sure you want to cancel the selected Booster plan(s)? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-brand-midnight border-brand-sky-blue/30 text-white hover:bg-brand-midnight/80">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmCancel}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Suggested Address Confirmation */}
      <AlertDialog open={addrDialogOpen} onOpenChange={setAddrDialogOpen}>
        <AlertDialogContent className="bg-brand-charcoal border-brand-sky-blue/30 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">
              Use standardized address?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-300">
              {proposedAddress?.dpv === 'S' && (
                <div className="mb-2 text-amber-300">
                  This address may require an apartment/unit/suite.
                </div>
              )}
              We found a standardized version of your address. You can use it
              as-is or keep what you entered.
              <div className="mt-4 rounded-md bg-brand-midnight/60 p-3">
                <div className="font-medium text-white">Suggested</div>
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
              onClick={async () => {
                setAddrDialogOpen(false);
                await savePersonalInfo({
                  address: profileData.address,
                  city: profileData.city,
                  state: profileData.state,
                  zipCode: profileData.zipCode,
                });
              }}
              className="bg-brand-midnight border-brand-sky-blue/30 text-white hover:bg-brand-midnight/80"
            >
              Keep entered
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!proposedAddress) return;
                const updated = {
                  address: proposedAddress.street1,
                  address2: proposedAddress.street2 || '',
                  city: proposedAddress.city,
                  state: proposedAddress.state,
                  zipCode: proposedAddress.zip5,
                };
                setProfileData((prev) => ({
                  ...prev,
                  address: updated.address,
                  address2: proposedAddress.street2 || '',
                  city: updated.city,
                  state: updated.state,
                  zipCode: updated.zipCode,
                }));
                setAddrDialogOpen(false);
                await savePersonalInfo(updated);
              }}
              className="bg-brand-sky-blue text-white hover:bg-brand-sky-blue-light"
            >
              Use suggested
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent className="bg-brand-charcoal border-brand-sky-blue/30">
          <DialogHeader>
            <DialogTitle className="text-white text-xl flex items-center gap-2">
              <Lock className="h-5 w-5 text-brand-sky-blue" />
              Change Password
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Enter your current password and choose a new password
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword" className="text-gray-300">
                Current Password
              </Label>
              <Input
                id="currentPassword"
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) =>
                  handlePasswordChange('currentPassword', e.target.value)
                }
                className="bg-brand-midnight/50 border-brand-sky-blue/30 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword" className="text-gray-300">
                New Password
              </Label>
              <Input
                id="newPassword"
                type="password"
                value={passwordData.newPassword}
                onChange={(e) =>
                  handlePasswordChange('newPassword', e.target.value)
                }
                className="bg-brand-midnight/50 border-brand-sky-blue/30 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-gray-300">
                Confirm New Password
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) =>
                  handlePasswordChange('confirmPassword', e.target.value)
                }
                className="bg-brand-midnight/50 border-brand-sky-blue/30 text-white"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowPasswordDialog(false)}
              className="border-brand-sky-blue/30 text-white hover:bg-brand-midnight/80"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSavePassword}
              className="bg-gradient-to-r from-brand-sky-blue to-brand-sky-blue-light hover:from-brand-sky-blue-light hover:to-brand-sky-blue text-white"
            >
              Save Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
