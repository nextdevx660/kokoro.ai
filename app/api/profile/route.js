import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase-server";
import { uploadImageToCloudinary } from "@/lib/cloudinary";

function getAccessToken(request) {
  const authorization = request.headers.get("authorization") || "";

  if (!authorization.startsWith("Bearer ")) {
    return "";
  }

  return authorization.slice(7).trim();
}

async function getAuthenticatedContext(request) {
  const accessToken = getAccessToken(request);

  if (!accessToken) {
    return {
      error: Response.json({ error: "Please sign in first." }, { status: 401 }),
    };
  }

  const supabase = createServerSupabaseClient(accessToken);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      error: Response.json(
        { error: "Your session is invalid. Please sign in again." },
        { status: 401 }
      ),
    };
  }

  return { supabase, user };
}

async function ensureProfileRow(supabase, user) {
  const fallbackName =
    user.user_metadata?.name ||
    user.user_metadata?.full_name ||
    user.email ||
    "User";

  const { data: existingProfile, error: existingError } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (existingError) {
    throw existingError;
  }

  if (existingProfile) {
    return existingProfile;
  }

  const { data, error } = await supabase
    .from("users")
    .insert({
      id: user.id,
      email: user.email,
      name: fallbackName,
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function GET(request) {
  try {
    const context = await getAuthenticatedContext(request);

    if (context.error) {
      return context.error;
    }

    const { supabase, user } = context;
    const profile = await ensureProfileRow(supabase, user);

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
    const context = await getAuthenticatedContext(request);

    if (context.error) {
      return context.error;
    }

    const { supabase, user } = context;
    await ensureProfileRow(supabase, user);
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

    const { data, error } = await supabase
      .from("users")
      .update(updates)
      .eq("id", user.id)
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    return Response.json({ profile: data });
  } catch (error) {
    console.error("Profile update error:", error);

    return Response.json(
      { error: error.message || "Failed to update profile." },
      { status: 500 }
    );
  }
}
