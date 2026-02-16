
export interface CreditReport {
  personalInfo: PersonalInfo;
  creditSummary: CreditSummary;
  accountHistory: AccountHistory[];
  publicRecords: PublicRecord[];
  creditInquiries: CreditInquiries;
  alerts: Alert[];
  reportDate: string;
}

export interface PersonalInfo {
  fullName: string;
  currentAddress: Address;
  previousAddresses: Address[];
  dateOfBirth: string;
  ssnLastFour: string;
  employmentInfo: EmploymentInfo;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  fromDate?: string;
  toDate?: string;
}

export interface EmploymentInfo {
  employer: string;
  position: string;
  employedSince: string;
}

export interface CreditSummary {
  totalOpenAccounts: number;
  totalClosedAccounts: number;
  totalCreditLimit: number;
  totalBalanceOwed: number;
  averageAccountAge: string;
  latePayments: {
    thirtyDays: number;
    sixtyDays: number;
    ninetyDays: number;
  };
  derogatoryAccounts: number;
}

export interface AccountHistory {
  id: string;
  creditorName: string;
  accountType: "Credit Card" | "Auto Loan" | "Mortgage" | "Personal Loan" | "Student Loan" | "Other";
  accountNumber: string;
  dateOpened: string;
  currentBalance: number;
  creditLimit: number;
  paymentStatus: "Current" | "Late" | "Charged-Off" | "Paid" | "Closed";
  lastPaymentDate: string;
  paymentHistory: PaymentHistoryMonth[];
}

export interface PaymentHistoryMonth {
  month: string;
  status: "on-time" | "late-30" | "late-60" | "late-90" | "no-data";
}

export interface PublicRecord {
  id: string;
  type: "Bankruptcy" | "Tax Lien" | "Judgment";
  dateFiled: string;
  status: string;
  courtName: string;
  location: string;
}

export interface CreditInquiries {
  hardInquiries: Inquiry[];
  softInquiries: Inquiry[];
}

export interface Inquiry {
  id: string;
  company: string;
  date: string;
  purpose?: string;
}

export interface Alert {
  id: string;
  type: "Fraud Alert" | "Consumer Statement" | "Dispute Note";
  message: string;
  dateAdded: string;
}
