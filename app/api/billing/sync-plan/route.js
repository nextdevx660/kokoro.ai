import "server-only";

import { getBillingProfile } from "@/lib/billing-storage";
import {
  createAdminSupabaseClient,
  createServerSupabaseClient,
} from "@/lib/supabase-server";

function getAccessToken(request) {
  const authorization = request.headers.get("authorization") || "";

  if (!authorization.startsWith("Bearer ")) {
    return "";
  }

  return authorization.slice(7).trim();
}

async function requireUser(request) {
  const accessToken = getAccessToken(request);

  if (!accessToken) {
    return {
      error: Response.json({ error: "Please sign in first." }, { status: 401 }),
    };
  }

  const supabase = createServerSupabaseClient(accessToken);
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return {
      error: Response.json(
        { error: "Your session is invalid. Please sign in again." },
        { status: 401 }
      ),
    };
  }

  return { supabase, user };
}

async function ensureUserRow(supabase, user) {
  const { data: existingProfile, error: existingError } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (existingError) {
    throw existingError;
  }

  if (existingProfile) {
    return existingProfile;
  }

  const fallbackName =
    user.user_metadata?.name ||
    user.user_metadata?.full_name ||
    user.email ||
    "User";

  const { data, error } = await supabase
    .from("users")
    .insert({
      id: user.id,
      email: user.email,
      name: fallbackName,
      plan: "free",
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function POST(request) {
  try {
    const authResult = await requireUser(request);

    if (authResult.error) {
      return authResult.error;
    }

    const { supabase: userSupabase, user } = authResult;
    const writeSupabase = createAdminSupabaseClient() || userSupabase;
    const billingProfile = await getBillingProfile(user.id);
    const currentProfile = await ensureUserRow(writeSupabase, user);

    if (!billingProfile?.plan || billingProfile.plan === currentProfile.plan) {
      return Response.json({
        synced: false,
        profile: currentProfile,
      });
    }

    const { data: profile, error } = await writeSupabase
      .from("users")
      .update({
        plan: billingProfile.plan,
      })
      .eq("id", user.id)
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    return Response.json({
      synced: true,
      profile,
    });
  } catch (error) {
    console.error("Billing sync error:", error);

    return Response.json(
      { error: error.message || "Failed to sync billing plan." },
      { status: 500 }
    );
  }
}
