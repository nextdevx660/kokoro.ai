import "server-only";

import { getBillingProfile } from "@/lib/billing-storage";
import { requireFirebaseUser } from "@/lib/firebase-server-auth";
import {
  ensureUserProfile,
  updateUserProfile,
} from "@/lib/user-storage-server";

export async function POST(request) {
  try {
    const authResult = await requireFirebaseUser(request);

    if (authResult.error) {
      return authResult.error;
    }

    const { user } = authResult;
    const billingProfile = await getBillingProfile(user.id);
    const currentProfile = await ensureUserProfile(user);

    if (!billingProfile?.plan || billingProfile.plan === currentProfile.plan) {
      return Response.json({
        synced: false,
        profile: currentProfile,
      });
    }

    const profile = await updateUserProfile(user.id, {
      plan: billingProfile.plan,
    });

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
