import { getBillingProfile } from "@/lib/billing-storage";
import { buildTokenState, FREE_DAILY_TOKENS } from "@/lib/token-system";

function getTodayUtcDate() {
  return new Date().toISOString().slice(0, 10);
}

function getUsersTableClient(adminSupabase, supabase) {
  return adminSupabase || supabase;
}

async function applyBillingPlan(userId, profile) {
  const billingProfile = await getBillingProfile(userId);

  return {
    ...profile,
    plan:
      billingProfile?.plan === "pro" || billingProfile?.plan === "premium"
        ? billingProfile.plan
        : profile.plan,
  };
}

async function readUserTokenRow({ adminSupabase, supabase, userId }) {
  const client = getUsersTableClient(adminSupabase, supabase);
  const query = client
    .from("users")
    .select("plan, daily_tokens_remaining, token_last_reset_at")
    .eq("id", userId)
    .maybeSingle();

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error("User profile not found.");
  }

  return applyBillingPlan(userId, data);
}

async function updateUserTokens({
  adminSupabase,
  supabase,
  userId,
  dailyTokensRemaining,
  tokenLastResetAt,
}) {
  const client = getUsersTableClient(adminSupabase, supabase);
  const { data, error } = await client
    .from("users")
    .update({
      daily_tokens_remaining: dailyTokensRemaining,
      token_last_reset_at: tokenLastResetAt,
    })
    .eq("id", userId)
    .select("plan, daily_tokens_remaining, token_last_reset_at")
    .single();

  if (error) {
    throw error;
  }

  return applyBillingPlan(userId, data);
}

async function syncDailyReset({ adminSupabase, supabase, userId }) {
  const todayUtc = getTodayUtcDate();
  const profile = await readUserTokenRow({ adminSupabase, supabase, userId });

  if (profile.token_last_reset_at === todayUtc) {
    return profile;
  }

  return updateUserTokens({
    adminSupabase,
    supabase,
    userId,
    dailyTokensRemaining: FREE_DAILY_TOKENS,
    tokenLastResetAt: todayUtc,
  });
}

export async function getDailyChatTokenStatus({
  adminSupabase,
  supabase,
  userId,
}) {
  const profile = await syncDailyReset({ adminSupabase, supabase, userId });

  return buildTokenState({
    plan: profile.plan,
    remainingTokens:
      typeof profile.daily_tokens_remaining === "number"
        ? profile.daily_tokens_remaining
        : FREE_DAILY_TOKENS,
  });
}

export async function consumeDailyChatToken({
  adminSupabase,
  supabase,
  userId,
}) {
  const tokenState = await getDailyChatTokenStatus({
    adminSupabase,
    supabase,
    userId,
  });

  if (tokenState.isPremium || tokenState.isBlocked) {
    return tokenState;
  }

  const updatedProfile = await updateUserTokens({
    adminSupabase,
    supabase,
    userId,
    dailyTokensRemaining: tokenState.remainingTokens - 1,
    tokenLastResetAt: getTodayUtcDate(),
  });

  return buildTokenState({
    plan: updatedProfile.plan,
    remainingTokens: updatedProfile.daily_tokens_remaining,
  });
}
