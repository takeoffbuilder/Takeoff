
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type BoosterPlan = Database["public"]["Tables"]["booster_plans"]["Row"];
type UserBoosterAccount = Database["public"]["Tables"]["user_booster_accounts"]["Row"];
type UserBoosterAccountInsert = Database["public"]["Tables"]["user_booster_accounts"]["Insert"];

export const boosterPlanService = {
  async getAllPlans(): Promise<BoosterPlan[]> {
    const { data, error } = await supabase
      .from("booster_plans")
      .select("*")
      .eq("is_active", true)
      .order("display_order", { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async getPlanBySlug(slug: string): Promise<BoosterPlan | null> {
    const { data, error } = await supabase
      .from("booster_plans")
      .select("*")
      .eq("plan_slug", slug)
      .eq("is_active", true)
      .single();

    if (error) throw error;
    return data;
  },

  async getUserBoosterAccounts(userId: string): Promise<UserBoosterAccount[]> {
    const { data, error } = await supabase
      .from("user_booster_accounts")
      .select(`
        *,
        booster_plans!user_booster_accounts_plan_id_fkey (*)
      `)
      .eq("user_id", userId)
      .order("date_added", { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getActiveBoosterAccounts(userId: string): Promise<UserBoosterAccount[]> {
    const { data, error } = await supabase
      .from("user_booster_accounts")
      .select(`
        *,
        booster_plans!user_booster_accounts_plan_id_fkey (*)
      `)
      .eq("user_id", userId)
      .eq("status", "active")
      .order("date_added", { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async addBoosterAccount(accountData: UserBoosterAccountInsert): Promise<UserBoosterAccount> {
    const { data, error } = await supabase
      .from("user_booster_accounts")
      .insert([accountData])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateBoosterAccountStatus(
    accountId: string,
    status: "active" | "pending" | "cancelled" | "suspended"
  ): Promise<void> {
    const updates: Partial<UserBoosterAccountInsert> & { status: "active" | "pending" | "cancelled" | "suspended" } = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (status === "cancelled") {
      updates.date_cancelled = new Date().toISOString();
    }

    const { error } = await supabase
      .from("user_booster_accounts")
      .update(updates)
      .eq("id", accountId);

    if (error) throw error;
  },

  async cancelBoosterAccount(accountId: string): Promise<void> {
    await this.updateBoosterAccountStatus(accountId, "cancelled");
  }
};
