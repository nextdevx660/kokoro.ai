import "server-only";

import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { db } from "@/lib/firebase";

function readEnvValue(value) {
  if (typeof value !== "string") {
    return value;
  }

  return value.replace(/^['"]|['"]$/g, "");
}

function getPrivateKey() {
  const privateKey =
    process.env.FIREBASE_ADMIN_PRIVATE_KEY ||
    process.env.FIREBASE_PRIVATE_KEY ||
    "";

  return readEnvValue(privateKey)?.replace(/\\n/g, "\n");
}

function getFirebaseAdminApp() {
  if (getApps().length) {
    return getApps()[0];
  }

  const projectId =
    readEnvValue(process.env.FIREBASE_ADMIN_PROJECT_ID) ||
    readEnvValue(process.env.FIREBASE_PROJECT_ID) ||
    readEnvValue(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);
  const clientEmail =
    readEnvValue(process.env.FIREBASE_ADMIN_CLIENT_EMAIL) ||
    readEnvValue(process.env.FIREBASE_CLIENT_EMAIL);
  const privateKey = getPrivateKey();

  if (projectId && clientEmail && privateKey) {
    return initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
      projectId,
    });
  }

  return null;
}

const adminApp = getFirebaseAdminApp();

export const hasFirebaseAdmin = Boolean(adminApp);
export const adminAuth = adminApp ? getAuth(adminApp) : null;
export const adminDb = adminApp ? getFirestore(adminApp) : null;
export const serverDb = adminDb || db;
