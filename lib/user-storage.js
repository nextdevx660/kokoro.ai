"use client";

import { db } from "@/lib/firebase";
import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { FREE_DAILY_TOKENS } from "@/lib/token-system";

const DEFAULT_SETTINGS = {
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

function getUserRef(userId) {
  return doc(db, "users", userId);
}

function normalizeUserData(snapshot) {
  if (!snapshot.exists()) {
    return null;
  }

  return {
    id: snapshot.id,
    ...snapshot.data(),
    settings: {
      ...DEFAULT_SETTINGS,
      ...(snapshot.data()?.settings || {}),
    },
  };
}

export async function getUserProfile(userId) {
  if (!userId) {
    return null;
  }

  const snapshot = await getDoc(getUserRef(userId));
  return normalizeUserData(snapshot);
}

export async function getUserNameById(userId) {
  const profile = await getUserProfile(userId);
  return profile?.name || "System";
}

export async function ensureUserProfile(user, overrides = {}) {
  if (!user?.uid) {
    return null;
  }

  const userRef = getUserRef(user.uid);
  const snapshot = await getDoc(userRef);

  if (!snapshot.exists()) {
    const displayName = user.displayName || user.email || "User";

    await setDoc(
      userRef,
      {
        id: user.uid,
        email: user.email || "",
        name: displayName,
        avatar_url: user.photoURL || "",
        isBan: false,
        isSuspend: false,
        isVerified: Boolean(user.emailVerified),
        plan: "free",
        daily_tokens_remaining: FREE_DAILY_TOKENS,
        token_last_reset_at: getTodayUtcDate(),
        chat_id: null,
        settings: DEFAULT_SETTINGS,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...overrides,
      },
      { merge: true }
    );
  } else {
    await setDoc(
      userRef,
      {
        email: user.email || snapshot.data()?.email || "",
        name: snapshot.data()?.name || user.displayName || user.email || "User",
        avatar_url: snapshot.data()?.avatar_url || user.photoURL || "",
        isVerified: Boolean(user.emailVerified),
        updated_at: new Date().toISOString(),
        ...overrides,
      },
      { merge: true }
    );
  }

  const refreshed = await getDoc(userRef);
  return normalizeUserData(refreshed);
}

export async function updateUserProfile(userId, updates) {
  const userRef = getUserRef(userId);
  await setDoc(
    userRef,
    {
      ...updates,
      updated_at: new Date().toISOString(),
    },
    { merge: true }
  );

  const snapshot = await getDoc(userRef);
  return normalizeUserData(snapshot);
}
