import mailchimp from "@mailchimp/mailchimp_marketing";
import * as crypto from "crypto";

// Initialize Mailchimp with configuration from environment variables
mailchimp.setConfig({
  apiKey: process.env.MAILCHIMP_API_KEY || "",
  server: process.env.MAILCHIMP_SERVER_PREFIX || "us1",
});

export interface MailchimpSubscriber {
  email: string;
  firstName?: string;
  lastName?: string;
  tags?: string[];
  mergeFields?: Record<string, string>;
}

export const mailchimpService = {
  /**
   * Add a new subscriber to the Mailchimp audience
   */
  async addSubscriber(subscriber: MailchimpSubscriber): Promise<boolean> {
    const audienceId = process.env.MAILCHIMP_AUDIENCE_ID;

    if (!audienceId) {
      console.error("MAILCHIMP_AUDIENCE_ID is not configured");
      return false;
    }

    try {
      await mailchimp.lists.addListMember(audienceId, {
        email_address: subscriber.email,
        status: "subscribed",
        merge_fields: {
          FNAME: subscriber.firstName || "",
          LNAME: subscriber.lastName || "",
          ...subscriber.mergeFields,
        },
        tags: subscriber.tags || [],
      });

      console.log("✅ Successfully added subscriber to Mailchimp:", subscriber.email);
      return true;
    } catch (error: unknown) {
      // Handle "Member Exists" error gracefully
      if (
        typeof error === "object" &&
        error !== null &&
        "status" in error &&
        (error as { status: number }).status === 400 &&
        "response" in error &&
        (error as { response?: { body?: { title?: string } } }).response?.body?.title === "Member Exists"
      ) {
        console.log("ℹ️ Subscriber already exists in Mailchimp:", subscriber.email);
        // Try to update the subscriber instead
        return await this.updateSubscriber(subscriber);
      }

      console.error("❌ Failed to add subscriber to Mailchimp:", error);
      return false;
    }
  },

  /**
   * Update an existing subscriber's information
   */
  async updateSubscriber(subscriber: MailchimpSubscriber): Promise<boolean> {
    const audienceId = process.env.MAILCHIMP_AUDIENCE_ID;

    if (!audienceId) {
      console.error("MAILCHIMP_AUDIENCE_ID is not configured");
      return false;
    }

    try {
      const subscriberHash = this.getSubscriberHash(subscriber.email);

      await mailchimp.lists.updateListMember(audienceId, subscriberHash, {
        merge_fields: {
          FNAME: subscriber.firstName || "",
          LNAME: subscriber.lastName || "",
          ...subscriber.mergeFields,
        },
      });

      // Update tags if provided
      if (subscriber.tags && subscriber.tags.length > 0) {
        await this.updateSubscriberTags(subscriber.email, subscriber.tags);
      }

      console.log("✅ Successfully updated subscriber in Mailchimp:", subscriber.email);
      return true;
    } catch (error) {
      console.error("❌ Failed to update subscriber in Mailchimp:", error);
      return false;
    }
  },

  /**
   * Add or update tags for a subscriber
   */
  async updateSubscriberTags(email: string, tags: string[]): Promise<boolean> {
    const audienceId = process.env.MAILCHIMP_AUDIENCE_ID;

    if (!audienceId) {
      console.error("MAILCHIMP_AUDIENCE_ID is not configured");
      return false;
    }

    try {
      const subscriberHash = this.getSubscriberHash(email);

      await mailchimp.lists.updateListMemberTags(audienceId, subscriberHash, {
        tags: tags.map((tag) => ({ name: tag, status: "active" })),
      });

      console.log("✅ Successfully updated tags for subscriber:", email);
      return true;
    } catch (error) {
      console.error("❌ Failed to update tags in Mailchimp:", error);
      return false;
    }
  },

  /**
   * Remove a subscriber from the audience
   */
  async unsubscribeUser(email: string): Promise<boolean> {
    const audienceId = process.env.MAILCHIMP_AUDIENCE_ID;

    if (!audienceId) {
      console.error("MAILCHIMP_AUDIENCE_ID is not configured");
      return false;
    }

    try {
      const subscriberHash = this.getSubscriberHash(email);

      await mailchimp.lists.updateListMember(audienceId, subscriberHash, {
        status: "unsubscribed",
      });

      console.log("✅ Successfully unsubscribed user from Mailchimp:", email);
      return true;
    } catch (error) {
      console.error("❌ Failed to unsubscribe user from Mailchimp:", error);
      return false;
    }
  },

  /**
   * Get subscriber hash (MD5 of lowercase email)
   */
  getSubscriberHash(email: string): string {
    return crypto.createHash("md5").update(email.toLowerCase()).digest("hex");
  },

  /**
   * Check if Mailchimp is properly configured
   */
  isConfigured(): boolean {
    return !!(
      process.env.MAILCHIMP_API_KEY &&
      process.env.MAILCHIMP_SERVER_PREFIX &&
      process.env.MAILCHIMP_AUDIENCE_ID
    );
  },

  /**
   * Get plan-specific tag for segmentation
   */
  getPlanTag(planName: string): string {
    const planTags: Record<string, string> = {
      "Starter Boost": "Plan: Starter",
      "Power Boost": "Plan: Power",
      "Max Boost": "Plan: Max",
      "Blaster Boost": "Plan: Blaster",
      "Super Boost": "Plan: Super",
      "Star Boost": "Plan: Star",
    };

    return planTags[planName] || "Plan: Unknown";
  },
};
