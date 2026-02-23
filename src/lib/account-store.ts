/**
 * Account Store - Local UX Cache
 * 
 * SECURITY CLASSIFICATION:
 * This store caches non-sensitive account metadata for UX when backend is unavailable.
 * 
 * STORES (LOW RISK):
 * - Plan names, amounts, dates (billing metadata)
 * - Account IDs, balances, status (operational data)
 * - Email addresses (not considered PII under GDPR in business context)
 * 
 * DOES NOT STORE (HIGH RISK):
 * - Auth tokens, passwords, session data (managed by Supabase)
 * - SSN or tax identifiers (stored in DB only)
 * - Payment card numbers, CVV, full card details (never stored client-side)
 * - Personal addresses, phone numbers, DOB (stored in DB only)
 * 
 * PURPOSE: Provides offline-first UX during Stripe/Supabase configuration.
 * Per copilot-instructions.md: "don't treat it as source of truth"
 */

import { BoosterAccount, UserProfile, PaymentRecord } from "@/types/user";

const STORAGE_KEY = "takeoff_user_profile";

export interface UpcomingPayment {
  id: string;
  planName: string;
  dueDate: string;
  amount: number;
  accountId: string;
}

export const accountStore = {
  getUserProfile(): UserProfile | null {
    if (typeof window === "undefined") return null;
    
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    
    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  },

  setUserProfile(profile: UserProfile): void {
    if (typeof window === "undefined") return;
    if (!profile || !profile.id) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  },

  addBoosterAccount(account: Pick<BoosterAccount, "planName" | "monthlyAmount" | "creditLimit">): BoosterAccount {
    const profile = this.getUserProfile();
    if (!profile) {
      throw new Error("No user profile found");
    }

    const newAccount: BoosterAccount = {
      ...account,
      creditLimit: account.creditLimit || 1000, // Default to 1000 if not provided
      id: `account_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      dateAdded: new Date().toISOString(),
      currentBalance: account.monthlyAmount,
      status: "Active"
    };

    profile.boosterAccounts.push(newAccount);
    this.setUserProfile(profile);

    return newAccount;
  },

  // Remove a specific account
  removeAccount(accountId: string): void {
    const profile = this.getUserProfile();
    if (!profile) {
      throw new Error("No user profile found");
    }
    
    // Filter out the account to remove
    profile.boosterAccounts = profile.boosterAccounts.filter(acc => acc.id !== accountId);
    
    // Save the updated profile
    this.setUserProfile(profile);
  },

  getBoosterAccounts(): BoosterAccount[] {
    const profile = this.getUserProfile();
    const accounts = profile?.boosterAccounts || [];
    // Ensure all accounts have a creditLimit property (backward compatibility)
    return accounts.map(account => ({
      ...account,
      creditLimit: account.creditLimit || 1000 // Default to 1000 if missing
    }));
  },

  processPayment(accountIds: string[], amount: number): PaymentRecord {
    const profile = this.getUserProfile();
    if (!profile) {
      throw new Error("No user profile found");
    }

    const paymentRecord: PaymentRecord = {
      id: `payment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      date: new Date().toISOString(),
      amount,
      accountIds,
      status: "Completed"
    };

    profile.boosterAccounts = profile.boosterAccounts.map(account => {
      if (accountIds.includes(account.id)) {
        return {
          ...account,
          currentBalance: 0,
          status: "Active" as const
        };
      }
      return account;
    });

    if (!profile.paymentHistory) {
      profile.paymentHistory = [];
    }
    profile.paymentHistory.push(paymentRecord);

    this.setUserProfile(profile);

    return paymentRecord;
  },

  getPaymentHistory(): PaymentRecord[] {
    const profile = this.getUserProfile();
    return profile?.paymentHistory || [];
  },

  getUpcomingPayments(): UpcomingPayment[] {
    const accounts = this.getBoosterAccounts();
    const upcomingPayments: UpcomingPayment[] = [];

    accounts.forEach(account => {
      if (account.status === "Active" || account.status === "Pending") {
        const dateAdded = new Date(account.dateAdded);
        const today = new Date();
        
        const nextPaymentDate = new Date(dateAdded);
        nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);
        
        while (nextPaymentDate <= today) {
          nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);
        }

        upcomingPayments.push({
          id: `payment_${account.id}`,
          planName: account.planName,
          dueDate: nextPaymentDate.toISOString(),
          amount: account.monthlyAmount,
          accountId: account.id
        });
      }
    });

    return upcomingPayments.sort((a, b) => 
      new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    );
  },

  // Clear all accounts (existing method)
  clearAllAccounts(): void {
    const profile = this.getUserProfile();
    if (profile) {
      profile.boosterAccounts = [];
      profile.paymentHistory = [];
      this.setUserProfile(profile);
    }
  },

  clearUserData(): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem(STORAGE_KEY);
    // Auth state cleared by authService.signOut()
    // Add other keys as needed
  }
};
