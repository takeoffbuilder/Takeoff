import { createAdminClient } from "@/integrations/supabase/admin-client";
import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/services/adminService";

// Temporary: log to server console for debugging
function logDebug(...args: unknown[]) {
   
  console.log("[is-admin]", ...args);
}

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();
    logDebug("Received token:", token ? token.slice(0, 12) + "..." : "<none>");
    if (!token) {
      logDebug("No token provided");
      return NextResponse.json({ isAdmin: false, error: "No token provided" }, { status: 401 });
    }

    const supabase = createAdminClient();
    const { data: { user }, error } = await supabase.auth.getUser(token);
    logDebug("Supabase getUser result:", { user, error });
    if (error || !user) {
      logDebug("Invalid token or user not found", { error });
      return NextResponse.json({ isAdmin: false, error: "Invalid token" }, { status: 401 });
    }

    const email = user.email?.toLowerCase();
    logDebug("Resolved email:", email);
    if (!email) {
      logDebug("No email found in user object");
      return NextResponse.json({ isAdmin: false, error: "No email found" }, { status: 401 });
    }

    const admin = await isAdmin(email);
    logDebug("Admin check for email", email, ":", admin);
    return NextResponse.json({ isAdmin: admin });
  } catch (err) {
    logDebug("Exception in is-admin route:", err);
    return NextResponse.json({ isAdmin: false, error: "Internal error" }, { status: 500 });
  }
}


export async function GET(req: Request) {
  try {
    const admin = createAdminClient();
    const token = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '') || null;
    const { data: userResp } = await admin.auth.getUser(token || undefined);
    const email = userResp?.user?.email ?? null;

    let allowed = false;
    if (email) {
      try {
        const { data } = await admin.rpc('is_admin', { p_email: email });
        allowed = Boolean(data);
      } catch {
        allowed = false;
      }
    }
  //removed fallback

    return NextResponse.json({ isAdmin: allowed });
  } catch {
    return NextResponse.json({ isAdmin: false });
  }
}
