import { getApps, initializeApp } from "firebase/app";
import {
  GoogleAuthProvider,
  browserLocalPersistence,
  getAuth,
  setPersistence,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";

function readEnvValue(value) {
  if (typeof value !== "string") {
    return value;
  }

  return value.replace(/^['"]|['"]$/g, "");
}

const firebaseConfig = {
  apiKey: readEnvValue(process.env.NEXT_PUBLIC_FIREBASE_API_KEY),
  authDomain: readEnvValue(process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN),
  projectId: readEnvValue(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID),
  storageBucket: readEnvValue(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET),
  messagingSenderId: readEnvValue(
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
  ),
  appId: readEnvValue(process.env.NEXT_PUBLIC_FIREBASE_APP_ID),
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

let persistencePromise = null;

export function ensureAuthPersistence() {
  if (typeof window === "undefined") {
    return Promise.resolve();
  }

  if (!persistencePromise) {
    persistencePromise = setPersistence(auth, browserLocalPersistence).catch(
      (error) => {
        persistencePromise = null;
        throw error;
      }
    );
  }

  return persistencePromise;
}
