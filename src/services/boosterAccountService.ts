import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type BoosterAccount = Database["public"]["Tables"]["user_booster_accounts"]["Row"];
type BoosterAccountInsert = Database["public"]["Tables"]["user_booster_accounts"]["Insert"];

export const boosterAccountService = {
  /**
   * Get ALL booster accounts for a user (regardless of status)
   * This allows you to see complete purchase history in the database
   */
  async getUserAccounts(userId: string): Promise<BoosterAccount[]> {
    try {
      const { data, error } = await supabase
        .from("user_booster_accounts")
        .select(`
          *,
          booster_plans!plan_id (
            plan_name,
            plan_slug,
            monthly_amount,
            credit_limit
          )
        `)
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching user booster accounts:", error);
        throw error;
      }

      console.log(`✅ Retrieved ${data?.length || 0} total accounts for user ${userId}`);
      return data || [];
    } catch (error) {
      console.error("Error in getUserAccounts:", error);
      return [];
    }
  },

  /**
   * Get booster accounts filtered by status
   * Use this when you only want to see accounts with a specific status
   */
  async getUserAccountsByStatus(
    userId: string, 
    status: "active" | "cancelled" | "pending"
  ): Promise<BoosterAccount[]> {
    try {
      const { data, error } = await supabase
        .from("user_booster_accounts")
        .select(`
          *,
          booster_plans!plan_id (
            plan_name,
            plan_slug,
            monthly_amount,
            credit_limit
          )
        `)
        .eq("user_id", userId)
        .eq("status", status)
        .order("created_at", { ascending: false });

      if (error) {
        console.error(`Error fetching ${status} accounts:`, error);
        throw error;
      }

      console.log(`✅ Retrieved ${data?.length || 0} ${status} accounts for user ${userId}`);
      return data || [];
    } catch (error) {
      console.error(`Error in getUserAccountsByStatus (${status}):`, error);
      return [];
    }
  },

  /**
   * Get active booster accounts only (for dashboard display)
   */
  async getActiveAccounts(userId: string): Promise<BoosterAccount[]> {
    return this.getUserAccountsByStatus(userId, "active");
  },

  /**
   * Create a new booster account for the user
   */
  async createAccount(userId: string, planId: string): Promise<BoosterAccount | null> {
    try {
      // First, get the plan details
      const { data: plan, error: planError } = await supabase
        .from("booster_plans")
        .select("*")
        .eq("id", planId)
        .single();

      if (planError || !plan) {
        console.error("Error fetching plan details:", planError);
        throw planError;
      }

      // Calculate next payment date (30 days from now)
      const nextPaymentDate = new Date();
      nextPaymentDate.setDate(nextPaymentDate.getDate() + 30);

      const accountData: BoosterAccountInsert = {
        user_id: userId,
        plan_id: planId,
        monthly_amount: plan.monthly_amount,
        credit_limit: plan.credit_limit,
        status: "active",
        next_payment_date: nextPaymentDate.toISOString().split("T")[0],
      };

      const { data, error } = await supabase
        .from("user_booster_accounts")
        .insert([accountData])
        .select()
        .single();

      if (error) {
        console.error("Error creating booster account:", error);
        throw error;
      }

      console.log(`✅ Created booster account ${data.id} for user ${userId}`);
      return data;
    } catch (error) {
      console.error("Error in createAccount:", error);
      return null;
    }
  },

  /**
   * Cancel a booster account
   */
  async cancelAccount(accountId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("user_booster_accounts")
        .update({
          status: "cancelled",
          date_cancelled: new Date().toISOString(),
        })
        .eq("id", accountId);

      if (error) {
        console.error("Error cancelling account:", error);
        throw error;
      }

      console.log(`✅ Cancelled account ${accountId}`);
      return true;
    } catch (error) {
      console.error("Error in cancelAccount:", error);
      return false;
    }
  },

  /**
   * Get upcoming payments for user's active accounts
   */
  async getUpcomingPayments(userId: string) {
    try {
      const { data, error } = await supabase
        .from("user_booster_accounts")
        .select(`
          id,
          monthly_amount,
          next_payment_date,
          booster_plans!plan_id (
            plan_name
          )
        `)
        .eq("user_id", userId)
        .eq("status", "active")
        .not("next_payment_date", "is", null)
        .order("next_payment_date", { ascending: true });

      if (error) {
        console.error("Error fetching upcoming payments:", error);
        throw error;
      }

      type UpcomingPaymentAccount = {
        id: string;
        monthly_amount: string | number;
        next_payment_date: string;
        booster_plans?: {
          plan_name?: string;
        } | null;
      };

      return (data || []).map((account: UpcomingPaymentAccount) => ({
        id: `payment_${account.id}`,
        planName: account.booster_plans?.plan_name || "Unknown Plan",
        dueDate: account.next_payment_date,
        amount: parseFloat(account.monthly_amount as string),
        accountId: account.id,
      }));
    } catch (error) {
      console.error("Error in getUpcomingPayments:", error);
      return [];
    }
  },

  /**
   * Get a single booster account by ID
   */
  async getAccountById(accountId: string): Promise<BoosterAccount | null> {
    try {
      const { data, error } = await supabase
        .from("user_booster_accounts")
        .select(`
          *,
          booster_plans!plan_id (
            plan_name,
            plan_slug,
            monthly_amount,
            credit_limit
          )
        `)
        .eq("id", accountId)
        .single();

      if (error) {
        console.error("Error fetching account:", error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error("Error in getAccountById:", error);
      return null;
    }
  },

  /**
   * Get account statistics for a user
   * Useful for admin/debugging purposes
   */
  async getUserAccountStats(userId: string): Promise<{
    total: number;
    active: number;
    cancelled: number;
    pending: number;
  }> {
    try {
      const allAccounts = await this.getUserAccounts(userId);
      
      const stats = {
        total: allAccounts.length,
        active: allAccounts.filter(acc => acc.status === "active").length,
        cancelled: allAccounts.filter(acc => acc.status === "cancelled").length,
        pending: allAccounts.filter(acc => acc.status === "pending").length,
      };

      console.log(`📊 Account stats for user ${userId}:`, stats);
      return stats;
    } catch (error) {
      console.error("Error getting account stats:", error);
      return { total: 0, active: 0, cancelled: 0, pending: 0 };
    }
  },
};
