
interface AffiliateData {
  userId: string;
  affiliateId: string;
  referralLink: string;
  totalReferrals: number;
  totalEarnings: number;
  pendingPayout: number;
  isAffiliate: boolean;
  dateJoined: string;
  referrals: Array<{
    id: string;
    email: string;
    signupDate: string;
    status: "completed" | "pending";
    earnings: number;
  }>;
}

class AffiliateStore {
  private storageKey = "takeoff_affiliate_data";

  private generateAffiliateId(email: string): string {
    const hash = email.split("").reduce((acc, char) => {
      return char.charCodeAt(0) + ((acc << 5) - acc);
    }, 0);
    return Math.abs(hash).toString(36).toUpperCase().substring(0, 8);
  }

  getAffiliateData(): AffiliateData | null {
    if (typeof window === "undefined") return null;
    
    const userEmail = localStorage.getItem("userEmail");
    if (!userEmail) return null;

    const stored = localStorage.getItem(this.storageKey);
    if (!stored) return null;

    const allData = JSON.parse(stored);
    return allData[userEmail] || null;
  }

  becomeAffiliate(): AffiliateData {
    if (typeof window === "undefined") {
      throw new Error("Cannot become affiliate on server");
    }

    const userEmail = localStorage.getItem("userEmail");
    if (!userEmail) {
      throw new Error("User email not found");
    }

    const affiliateId = this.generateAffiliateId(userEmail);
    const referralLink = `https://takeoffcreditbuilder.com/ref/${affiliateId}`;

    const affiliateData: AffiliateData = {
      userId: userEmail,
      affiliateId,
      referralLink,
      totalReferrals: 0,
      totalEarnings: 0,
      pendingPayout: 0,
      isAffiliate: true,
      dateJoined: new Date().toISOString(),
      referrals: []
    };

    const stored = localStorage.getItem(this.storageKey);
    const allData = stored ? JSON.parse(stored) : {};
    allData[userEmail] = affiliateData;
    localStorage.setItem(this.storageKey, JSON.stringify(allData));

    return affiliateData;
  }

  addMockReferral(): AffiliateData {
    const affiliateData = this.getAffiliateData();
    if (!affiliateData) {
      throw new Error("Not an affiliate");
    }

    const mockEmails = [
      "john.doe@example.com",
      "sarah.smith@example.com",
      "mike.johnson@example.com",
      "emily.davis@example.com",
      "david.wilson@example.com",
      "lisa.anderson@example.com",
      "james.taylor@example.com",
      "maria.garcia@example.com"
    ];

    const unusedEmails = mockEmails.filter(
      email => !affiliateData.referrals.some(r => r.email === email)
    );

    if (unusedEmails.length === 0) {
      throw new Error("All mock referrals have been added");
    }

    const randomEmail = unusedEmails[Math.floor(Math.random() * unusedEmails.length)];
    const isCompleted = Math.random() > 0.3;

    const newReferral = {
      id: `ref_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      email: randomEmail,
      signupDate: new Date().toISOString(),
      status: isCompleted ? "completed" as const : "pending" as const,
      earnings: isCompleted ? 10 : 0
    };

    affiliateData.referrals.push(newReferral);
    affiliateData.totalReferrals = affiliateData.referrals.filter(r => r.status === "completed").length;
    affiliateData.totalEarnings = affiliateData.referrals.reduce((sum, r) => sum + r.earnings, 0);
    affiliateData.pendingPayout = affiliateData.totalEarnings * 0.33;

    const userEmail = localStorage.getItem("userEmail");
    if (!userEmail) throw new Error("User email not found");

    const stored = localStorage.getItem(this.storageKey);
    const allData = stored ? JSON.parse(stored) : {};
    allData[userEmail] = affiliateData;
    localStorage.setItem(this.storageKey, JSON.stringify(allData));

    return affiliateData;
  }

  clearAffiliateData(): void {
    if (typeof window === "undefined") return;

    const userEmail = localStorage.getItem("userEmail");
    if (!userEmail) return;

    const stored = localStorage.getItem(this.storageKey);
    if (!stored) return;

    const allData = JSON.parse(stored);
    delete allData[userEmail];
    localStorage.setItem(this.storageKey, JSON.stringify(allData));
  }
}

export const affiliateStore = new AffiliateStore();
