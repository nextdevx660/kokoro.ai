import "server-only";

import { requireFirebaseUser } from "@/lib/firebase-server-auth";
import {
  ensureUserProfile,
  sanitizeSettings,
  updateUserProfile,
} from "@/lib/user-storage-server";

export async function GET(request) {
  try {
    const context = await requireFirebaseUser(request);

    if (context.error) {
      return context.error;
    }

    const { user } = context;
    const profile = await ensureUserProfile(user);

    return Response.json({ settings: profile.settings, profile });
  } catch (error) {
    console.error("Settings fetch error:", error);

    return Response.json(
      { error: error.message || "Failed to fetch settings." },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const context = await requireFirebaseUser(request);

    if (context.error) {
      return context.error;
    }

    const { user } = context;
    const currentProfile = await ensureUserProfile(user);
    const body = await request.json().catch(() => null);

    if (!body || typeof body !== "object") {
      return Response.json(
        { error: "A settings payload is required." },
        { status: 400 }
      );
    }

    const settings = sanitizeSettings({
      ...currentProfile.settings,
      ...body.settings,
    });

    const data = await updateUserProfile(user.id, { settings });

    return Response.json({
      settings,
      profile: {
        ...data,
        settings,
      },
    });
  } catch (error) {
    console.error("Settings update error:", error);

    return Response.json(
      { error: error.message || "Failed to update settings." },
      { status: 500 }
    );
  }
}
