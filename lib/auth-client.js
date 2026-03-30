"use client";

import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  updateProfile,
} from "firebase/auth";
import { auth, ensureAuthPersistence, googleProvider } from "@/lib/firebase";

export async function getFirebaseAccessToken(forceRefresh = false) {
  await ensureAuthPersistence();
  const user = auth.currentUser;

  if (!user) {
    return "";
  }

  return user.getIdToken(forceRefresh);
}

export async function signInWithGoogle() {
  await ensureAuthPersistence();
  return signInWithPopup(auth, googleProvider);
}

export async function signUpWithEmail({ email, password, name }) {
  await ensureAuthPersistence();
  const credential = await createUserWithEmailAndPassword(auth, email, password);

  if (name?.trim()) {
    await updateProfile(credential.user, {
      displayName: name.trim(),
    });
  }

  return credential;
}

export function subscribeToAuthChanges(callback) {
  return onAuthStateChanged(auth, callback);
}

export async function signOutUser() {
  await signOut(auth);
}
