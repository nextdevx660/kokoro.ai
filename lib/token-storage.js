import { getBillingProfile } from "@/lib/billing-storage";
import { buildTokenState, FREE_DAILY_TOKENS } from "@/lib/token-system";
import {
  ensureUserProfile,
  getUserProfile,
  updateUserProfile,
} from "@/lib/user-storage-server";

function getTodayUtcDate() {
  return new Date().toISOString().slice(0, 10);
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

async function readUserTokenRow({ userId }) {
  const profile = await getUserProfile(userId);

  if (!profile) {
    throw new Error("User profile not found.");
  }

  return applyBillingPlan(userId, profile);
}

async function updateUserTokens({
  userId,
  dailyTokensRemaining,
  tokenLastResetAt,
}) {
  const profile = await updateUserProfile(userId, {
    daily_tokens_remaining: dailyTokensRemaining,
    token_last_reset_at: tokenLastResetAt,
  });

  return applyBillingPlan(userId, profile);
}

async function syncDailyReset({ userId }) {
  const todayUtc = getTodayUtcDate();
  const profile = await readUserTokenRow({ userId });

  if (profile.token_last_reset_at === todayUtc) {
    return profile;
  }

  return updateUserTokens({
    userId,
    dailyTokensRemaining: FREE_DAILY_TOKENS,
    tokenLastResetAt: todayUtc,
  });
}

export async function getDailyChatTokenStatus({ userId }) {
  const profile = await syncDailyReset({ userId });

  return buildTokenState({
    plan: profile.plan,
    remainingTokens:
      typeof profile.daily_tokens_remaining === "number"
        ? profile.daily_tokens_remaining
        : FREE_DAILY_TOKENS,
  });
}

export async function consumeDailyChatToken({ userId }) {
  const tokenState = await getDailyChatTokenStatus({ userId });

  if (tokenState.isPremium || tokenState.isBlocked) {
    return tokenState;
  }

  const updatedProfile = await updateUserTokens({
    userId,
    dailyTokensRemaining: tokenState.remainingTokens - 1,
    tokenLastResetAt: getTodayUtcDate(),
  });

  return buildTokenState({
    plan: updatedProfile.plan,
    remainingTokens: updatedProfile.daily_tokens_remaining,
  });
}
