import { supabase } from "@/integrations/supabase/client";
import { getStripe } from "@/lib/stripe-client";

export interface Payment {
  id: string;
  user_id: string;
  amount: number;
  status: string;
  payment_date: string;
  stripe_invoice_id?: string;
  created_at: string;
}

export const paymentService = {
  async createCheckoutSession(planId: string, userId: string, email: string) {
    try {
      const response = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          planId,
          userId,
          email,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create checkout session");
      }

      const { sessionId } = await response.json();

      const stripe = await getStripe();
      if (!stripe) {
        throw new Error("Failed to load Stripe");
      }

      const { error } = await stripe.redirectToCheckout({ sessionId });

      if (error) {
        throw new Error(error.message);
      }

      return sessionId;
    } catch (error: unknown) {
      console.error("Checkout session error:", error);
      throw error;
    }
  },

  async getUserPayments(userId: string) {
    const { data, error } = await supabase
      .from("payments")
      .select("*")
      .eq("user_id", userId)
      .order("payment_date", { ascending: false });

    if (error) throw error;
    return data as Payment[];
  },

  async getUpcomingPayments(userId: string) {
    const { data, error } = await supabase
      .from("user_booster_accounts")
      .select(`
        *,
        booster_plans (
          plan_name
        )
      `)
      .eq("user_id", userId)
      .eq("status", "active");

    if (error) throw error;

    type BoosterPlan = { plan_name: string } | null;
    return data.map((account: { id: string; booster_plans: BoosterPlan; monthly_amount: number; next_payment_date: string }) => ({
      id: account.id,
      plan_name: account.booster_plans?.plan_name || 'Booster Plan',
      amount: account.monthly_amount,
      due_date: account.next_payment_date,
    }));
  },

  async cancelSubscription(userBoosterAccountId: string) {
    const { data: account, error: fetchError } = await supabase
      .from("user_booster_accounts")
      .select("stripe_subscription_id")
      .eq("id", userBoosterAccountId)
      .single();

    if (fetchError) throw fetchError;

    if (account?.stripe_subscription_id) {
      const response = await fetch("/api/stripe/cancel-subscription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subscriptionId: account.stripe_subscription_id,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to cancel subscription with Stripe");
      }
    } else {
        // If no stripe subscription ID, just update status locally
        const { error } = await supabase
          .from("user_booster_accounts")
          .update({ status: "cancelled", date_cancelled: new Date().toISOString() })
          .eq("id", userBoosterAccountId);

        if (error) throw error;
    }
    
    return true;
  },
};
