import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

const BILLING_COLLECTION = "user_billing";

function getBillingDocRef(userId) {
  return doc(db, BILLING_COLLECTION, userId);
}

export async function getBillingProfile(userId) {
  if (!userId) {
    return null;
  }

  const snapshot = await getDoc(getBillingDocRef(userId));

  if (!snapshot.exists()) {
    return null;
  }

  return {
    id: snapshot.id,
    ...snapshot.data(),
  };
}

export async function saveBillingProfile(userId, payload) {
  if (!userId) {
    throw new Error("User ID is required for billing storage.");
  }

  await setDoc(
    getBillingDocRef(userId),
    {
      ...payload,
      updatedAt: new Date().toISOString(),
    },
    { merge: true }
  );
}
