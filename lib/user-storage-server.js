import "server-only";

import { serverDb } from "@/lib/firebase-admin";
import { FREE_DAILY_TOKENS } from "@/lib/token-system";

export const DEFAULT_SETTINGS = {
  emailAnnouncements: true,
  productUpdates: true,
  privateProfile: false,
  safeMode: true,
  language: "English",
  theme: "System default",
};

function getTodayUtcDate() {
  return new Date().toISOString().slice(0, 10);
}

function getUsersCollection() {
  return serverDb.collection("users");
}

export function sanitizeSettings(input) {
  const raw = input && typeof input === "object" ? input : {};

  return {
    emailAnnouncements: Boolean(
      raw.emailAnnouncements ?? DEFAULT_SETTINGS.emailAnnouncements
    ),
    productUpdates: Boolean(
      raw.productUpdates ?? DEFAULT_SETTINGS.productUpdates
    ),
    privateProfile: Boolean(
      raw.privateProfile ?? DEFAULT_SETTINGS.privateProfile
    ),
    safeMode: Boolean(raw.safeMode ?? DEFAULT_SETTINGS.safeMode),
    language:
      typeof raw.language === "string" && raw.language.trim()
        ? raw.language.trim()
        : DEFAULT_SETTINGS.language,
    theme:
      typeof raw.theme === "string" && raw.theme.trim()
        ? raw.theme.trim()
        : DEFAULT_SETTINGS.theme,
  };
}

function buildDefaultProfile(user) {
  const fallbackName =
    user?.user_metadata?.name ||
    user?.user_metadata?.full_name ||
    user?.email ||
    "User";

  return {
    id: user.id,
    email: user.email || "",
    name: fallbackName,
    avatar_url: user?.user_metadata?.picture || "",
    isBan: false,
    isSuspend: false,
    isVerified: Boolean(user?.email_verified ?? true),
    plan: "free",
    daily_tokens_remaining: FREE_DAILY_TOKENS,
    token_last_reset_at: getTodayUtcDate(),
    chat_id: null,
    settings: DEFAULT_SETTINGS,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

function normalizeProfile(snapshot) {
  if (!snapshot?.exists) {
    return null;
  }

  const data = snapshot.data();

  return {
    id: snapshot.id,
    ...data,
    settings: sanitizeSettings(data?.settings),
  };
}

export async function getUserProfile(userId) {
  if (!userId) {
    return null;
  }

  const snapshot = await getUsersCollection().doc(userId).get();
  return normalizeProfile(snapshot);
}

export async function ensureUserProfile(user, overrides = {}) {
  const userRef = getUsersCollection().doc(user.id);
  const snapshot = await userRef.get();

  if (snapshot.exists) {
    const current = normalizeProfile(snapshot);
    const nextSettings = sanitizeSettings(current?.settings);
    const nextAvatar =
      current?.avatar_url || user?.user_metadata?.picture || current?.avatar_url;

    await userRef.set(
      {
        email: user.email || current?.email || "",
        name: current?.name || user?.user_metadata?.name || user.email || "User",
        avatar_url: nextAvatar || "",
        settings: nextSettings,
        updated_at: new Date().toISOString(),
        ...overrides,
      },
      { merge: true }
    );

    const refreshed = await userRef.get();
    return normalizeProfile(refreshed);
  }

  const initialProfile = {
    ...buildDefaultProfile(user),
    ...overrides,
  };

  await userRef.set(initialProfile, { merge: true });
  const created = await userRef.get();
  return normalizeProfile(created);
}

export async function updateUserProfile(userId, updates) {
  const userRef = getUsersCollection().doc(userId);
  const payload = {
    ...updates,
    updated_at: new Date().toISOString(),
  };

  if (Object.prototype.hasOwnProperty.call(payload, "settings")) {
    payload.settings = sanitizeSettings(payload.settings);
  }

  await userRef.set(payload, { merge: true });
  const snapshot = await userRef.get();
  return normalizeProfile(snapshot);
}
