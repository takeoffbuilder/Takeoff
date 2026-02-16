
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type DownloadedCourse = Database["public"]["Tables"]["downloaded_courses"]["Row"];
type DownloadedCourseInsert = Database["public"]["Tables"]["downloaded_courses"]["Insert"];

export interface Course {
  slug: string;
  title: string;
  description: string;
  filename: string;
}

export const AVAILABLE_COURSES: Course[] = [
  {
    slug: "credit-optimization-101",
    title: "Credit Optimization 101",
    description: "Learn the fundamentals of building and maintaining a strong credit score.",
    filename: "CreditOpt.pdf"
  },
  {
    slug: "advanced-credit-optimization",
    title: "Advanced Credit Optimization Strategies",
    description: "Master advanced tactics for faster credit growth and utilization management.",
    filename: "Advanced Credit Optimization Strategies.pdf"
  },
  {
    slug: "understanding-credit-reports",
    title: "Understanding Credit Reports",
    description: "Decode your credit report and identify errors that could affect your score.",
    filename: "Understanding Your Credit Report.pdf"
  },
  {
    slug: "building-credit-responsibly",
    title: "Building Credit Responsibly",
    description: "Learn responsible credit practices that open doors to long-term success.",
    filename: "Building Your Credit Responsibly.pdf"
  },
  {
    slug: "credit-utilization-management",
    title: "Credit Utilization & Management",
    description: "Keep your utilization low and your score high with smart credit management.",
    filename: "Credit Utilization & Management.pdf"
  },
  {
    slug: "financial-education-basics",
    title: "Financial Education Basics",
    description: "Budget, save, and spend smarter to maintain a healthy financial foundation.",
    filename: "Financial Education Basics.pdf"
  },
  {
    slug: "budgeting-for-better-credit",
    title: "Budgeting for Better Credit",
    description: "Master your budget to stay current on payments and build stability.",
    filename: "Budgeting for Better Credit.pdf"
  },
  {
    slug: "smart-borrowing-techniques",
    title: "Smart Borrowing Techniques",
    description: "Use loans and credit strategically to grow your credit mix and score.",
    filename: "Smart Borrowing Techniques.pdf"
  },
  {
    slug: "debt-reduction-recovery",
    title: "Debt Reduction & Recovery",
    description: "Learn how to pay off debt faster and rebuild your credit health.",
    filename: "Debt Reduction & Recovery.pdf"
  },
  {
    slug: "using-credit-to-invest",
    title: "Using Credit to Invest",
    description: "Turn strong credit into opportunity by leveraging it for investments.",
    filename: "Using Credit To Invest.pdf"
  },
  {
    slug: "leveraging-business-credit",
    title: "Leveraging Business Credit",
    description: "Build business credit separate from personal credit for growth and funding.",
    filename: "Leveraging Business Credit.pdf"
  },
  {
    slug: "financial-freedom-through-credit",
    title: "Financial Freedom Through Credit",
    description: "Combine all strategies to create lasting financial independence.",
    filename: "Financial Freedom Through Credit.pdf"
  }
];

export const courseService = {
  async getDownloadedCourses(userId: string): Promise<DownloadedCourse[]> {
    const { data, error } = await supabase
      .from("downloaded_courses")
      .select("*")
      .eq("user_id", userId)
      .order("downloaded_at", { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async markCourseAsDownloaded(courseData: DownloadedCourseInsert): Promise<DownloadedCourse> {
    const { data, error } = await supabase
      .from("downloaded_courses")
      .insert([courseData])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async hasUserDownloadedCourse(userId: string, courseSlug: string): Promise<boolean> {
    const { data, error } = await supabase
      .from("downloaded_courses")
      .select("id")
      .eq("user_id", userId)
      .eq("course_slug", courseSlug)
      .single();

    if (error && error.code !== "PGRST116") throw error;
    return !!data;
  },

  async getAvailableCoursesCount(activeBoosterCount: number): Promise<number> {
    return Math.min(activeBoosterCount, AVAILABLE_COURSES.length);
  }
};
