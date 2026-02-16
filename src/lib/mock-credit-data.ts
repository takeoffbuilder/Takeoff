
import { CreditReport } from "@/types/credit-report";

export const mockCreditReport: CreditReport = {
  reportDate: "2025-01-11",
  personalInfo: {
    fullName: "John Michael Smith",
    currentAddress: {
      street: "1234 Main Street, Apt 5B",
      city: "Los Angeles",
      state: "CA",
      zipCode: "90001"
    },
    previousAddresses: [
      {
        street: "5678 Oak Avenue",
        city: "San Diego",
        state: "CA",
        zipCode: "92101",
        fromDate: "2020-03",
        toDate: "2023-06"
      },
      {
        street: "9101 Pine Drive",
        city: "Sacramento",
        state: "CA",
        zipCode: "94203",
        fromDate: "2018-01",
        toDate: "2020-02"
      }
    ],
    dateOfBirth: "1990-05-15",
    ssnLastFour: "4567",
    employmentInfo: {
      employer: "Tech Solutions Inc.",
      position: "Software Engineer",
      employedSince: "2021-03-01"
    }
  },
  creditSummary: {
    totalOpenAccounts: 8,
    totalClosedAccounts: 4,
    totalCreditLimit: 45000,
    totalBalanceOwed: 12500,
    averageAccountAge: "4 years 7 months",
    latePayments: {
      thirtyDays: 2,
      sixtyDays: 0,
      ninetyDays: 0
    },
    derogatoryAccounts: 0
  },
  accountHistory: [
    {
      id: "acc1",
      creditorName: "Chase Bank",
      accountType: "Credit Card",
      accountNumber: "****1234",
      dateOpened: "2019-03-15",
      currentBalance: 2500,
      creditLimit: 10000,
      paymentStatus: "Current",
      lastPaymentDate: "2025-01-05",
      paymentHistory: [
        { month: "Dec 2024", status: "on-time" },
        { month: "Nov 2024", status: "on-time" },
        { month: "Oct 2024", status: "on-time" },
        { month: "Sep 2024", status: "on-time" },
        { month: "Aug 2024", status: "on-time" },
        { month: "Jul 2024", status: "on-time" }
      ]
    },
    {
      id: "acc2",
      creditorName: "Capital One",
      accountType: "Credit Card",
      accountNumber: "****5678",
      dateOpened: "2020-08-22",
      currentBalance: 1800,
      creditLimit: 7500,
      paymentStatus: "Current",
      lastPaymentDate: "2025-01-03",
      paymentHistory: [
        { month: "Dec 2024", status: "on-time" },
        { month: "Nov 2024", status: "on-time" },
        { month: "Oct 2024", status: "late-30" },
        { month: "Sep 2024", status: "on-time" },
        { month: "Aug 2024", status: "on-time" },
        { month: "Jul 2024", status: "on-time" }
      ]
    },
    {
      id: "acc3",
      creditorName: "Toyota Financial",
      accountType: "Auto Loan",
      accountNumber: "****9012",
      dateOpened: "2021-06-10",
      currentBalance: 18000,
      creditLimit: 30000,
      paymentStatus: "Current",
      lastPaymentDate: "2025-01-01",
      paymentHistory: [
        { month: "Dec 2024", status: "on-time" },
        { month: "Nov 2024", status: "on-time" },
        { month: "Oct 2024", status: "on-time" },
        { month: "Sep 2024", status: "on-time" },
        { month: "Aug 2024", status: "on-time" },
        { month: "Jul 2024", status: "on-time" }
      ]
    },
    {
      id: "acc4",
      creditorName: "American Express",
      accountType: "Credit Card",
      accountNumber: "****3456",
      dateOpened: "2018-11-05",
      currentBalance: 0,
      creditLimit: 5000,
      paymentStatus: "Current",
      lastPaymentDate: "2024-12-28",
      paymentHistory: [
        { month: "Dec 2024", status: "on-time" },
        { month: "Nov 2024", status: "on-time" },
        { month: "Oct 2024", status: "on-time" },
        { month: "Sep 2024", status: "on-time" },
        { month: "Aug 2024", status: "on-time" },
        { month: "Jul 2024", status: "on-time" }
      ]
    },
    {
      id: "acc5",
      creditorName: "Wells Fargo",
      accountType: "Personal Loan",
      accountNumber: "****7890",
      dateOpened: "2022-02-18",
      currentBalance: 5000,
      creditLimit: 15000,
      paymentStatus: "Current",
      lastPaymentDate: "2025-01-02",
      paymentHistory: [
        { month: "Dec 2024", status: "on-time" },
        { month: "Nov 2024", status: "on-time" },
        { month: "Oct 2024", status: "on-time" },
        { month: "Sep 2024", status: "on-time" },
        { month: "Aug 2024", status: "late-30" },
        { month: "Jul 2024", status: "on-time" }
      ]
    }
  ],
  publicRecords: [],
  creditInquiries: {
    hardInquiries: [
      {
        id: "inq1",
        company: "Chase Bank",
        date: "2024-11-15",
        purpose: "Credit Card Application"
      },
      {
        id: "inq2",
        company: "Toyota Financial",
        date: "2024-09-03",
        purpose: "Auto Loan"
      },
      {
        id: "inq3",
        company: "Capital One",
        date: "2024-06-22",
        purpose: "Credit Card Application"
      }
    ],
    softInquiries: [
      {
        id: "soft1",
        company: "Credit Karma",
        date: "2025-01-08",
        purpose: "Account Review"
      },
      {
        id: "soft2",
        company: "Experian",
        date: "2025-01-05",
        purpose: "Pre-qualification Check"
      },
      {
        id: "soft3",
        company: "American Express",
        date: "2024-12-20",
        purpose: "Account Monitoring"
      }
    ]
  },
  alerts: [
    {
      id: "alert1",
      type: "Consumer Statement",
      message: "This account was paid in full and closed at consumer's request.",
      dateAdded: "2024-08-15"
    }
  ]
};
