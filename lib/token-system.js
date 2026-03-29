const FREE_DAILY_TOKENS = 20;

function normalizePlan(plan) {
  return typeof plan === "string" ? plan.toLowerCase() : "free";
}

export function buildTokenState(payload) {
  const plan = normalizePlan(payload?.plan);
  const remainingTokens =
    typeof payload?.remainingTokens === "number"
      ? payload.remainingTokens
      : FREE_DAILY_TOKENS;

  return {
    plan,
    remainingTokens,
    isPremium: plan === "pro" || plan === "premium",
    isBlocked:
      (plan === "free" || plan === "basic") && remainingTokens <= 0,
  };
}

export { FREE_DAILY_TOKENS };
