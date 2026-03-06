export interface BoosterAccount {
  id: string;
  planName: string;
  monthlyAmount: number;
  creditLimit: number;
  dateAdded: string;
  status: "Active" | "Pending" | "Cancelled";
  currentBalance: number;
}

export interface UserProfile {
  id: string;
  email: string;
  boosterAccounts: BoosterAccount[];
  paymentHistory?: PaymentRecord[];
}

export interface PaymentRecord {
  id: string;
  date: string;
  amount: number;
  accountIds: string[];
  status: "Completed" | "Pending" | "Failed";
}
