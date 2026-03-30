import "server-only";

import { uploadImageToCloudinary } from "@/lib/cloudinary";
import { requireFirebaseUser } from "@/lib/firebase-server-auth";
import {
  ensureUserProfile,
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

    return Response.json({ profile });
  } catch (error) {
    console.error("Profile fetch error:", error);

    return Response.json(
      { error: error.message || "Failed to fetch profile." },
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
    await ensureUserProfile(user);
    const formData = await request.formData();
    const name = String(formData.get("name") || "").trim();
    const image = formData.get("image");

    if (!name) {
      return Response.json(
        { error: "Name is required." },
        { status: 400 }
      );
    }

    const updates = {
      name,
    };

    if (image instanceof File && image.size > 0) {
      const upload = await uploadImageToCloudinary(image, {
        folder: "profiles",
      });

      updates.avatar_url = upload.url;
    }

    const data = await updateUserProfile(user.id, updates);

    return Response.json({ profile: data });
  } catch (error) {
    console.error("Profile update error:", error);

    return Response.json(
      { error: error.message || "Failed to update profile." },
      { status: 500 }
    );
  }
}
