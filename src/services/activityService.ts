import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type ActivityLog = Database["public"]["Tables"]["activity_logs"]["Row"];
type ActivityLogInsert = Database["public"]["Tables"]["activity_logs"]["Insert"];

export const activityService = {
  async getUserActivities(userId: string, limit: number = 10): Promise<ActivityLog[]> {
    const { data, error } = await supabase
      .from("activity_logs")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  },

  async logActivity(activityData: ActivityLogInsert): Promise<ActivityLog> {
    const { data, error } = await supabase
      .from("activity_logs")
      .insert([activityData])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async logAccountCreated(userId: string): Promise<void> {
    await this.logActivity({
      user_id: userId,
      activity_type: "account_created",
      description: "Account successfully created"
    });
  },

  async logPlanAdded(userId: string, planName: string, amount: number): Promise<void> {
    await this.logActivity({
      user_id: userId,
      activity_type: "plan_added",
      description: `Added ${planName} plan`,
      metadata: { plan_name: planName, amount }
    });
  },

  async logPlanCancelled(userId: string, planName: string): Promise<void> {
    await this.logActivity({
      user_id: userId,
      activity_type: "plan_cancelled",
      description: `Cancelled ${planName} plan`,
      metadata: { plan_name: planName }
    });
  },

  async logPaymentMade(userId: string, amount: number, planName?: string): Promise<void> {
    await this.logActivity({
      user_id: userId,
      activity_type: "payment_made",
      description: `Payment of $${amount} processed`,
      metadata: { amount, plan_name: planName }
    });
  },

  async logPaymentFailed(userId: string, amount: number, reason?: string): Promise<void> {
    await this.logActivity({
      user_id: userId,
      activity_type: "payment_failed",
      description: `Payment of $${amount} failed`,
      metadata: { amount, reason }
    });
  },

  async logProfileUpdated(userId: string): Promise<void> {
    await this.logActivity({
      user_id: userId,
      activity_type: "profile_updated",
      description: "Profile information updated"
    });
  },

  async logPasswordChanged(userId: string): Promise<void> {
    await this.logActivity({
      user_id: userId,
      activity_type: "password_changed",
      description: "Password successfully changed"
    });
  },

  async logCourseDownloaded(userId: string, courseTitle: string): Promise<void> {
    await this.logActivity({
      user_id: userId,
      activity_type: "course_downloaded",
      description: `Downloaded course: ${courseTitle}`,
      metadata: { course_title: courseTitle }
    });
  }
};
