import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase-server";

const DEFAULT_SETTINGS = {
  emailAnnouncements: true,
  productUpdates: true,
  privateProfile: false,
  safeMode: true,
  language: "English",
  theme: "System default",
};

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

function sanitizeSettings(input) {
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

async function ensureUserRow(supabase, user) {
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
    return {
      ...existingProfile,
      settings: sanitizeSettings(existingProfile?.settings),
    };
  }

  const { data, error } = await supabase
    .from("users")
    .insert({
      id: user.id,
      email: user.email,
      name: fallbackName,
      settings: DEFAULT_SETTINGS,
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return {
    ...data,
    settings: sanitizeSettings(data?.settings),
  };
}

export async function GET(request) {
  try {
    const context = await getAuthenticatedContext(request);

    if (context.error) {
      return context.error;
    }

    const { supabase, user } = context;
    const profile = await ensureUserRow(supabase, user);

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
    const context = await getAuthenticatedContext(request);

    if (context.error) {
      return context.error;
    }

    const { supabase, user } = context;
    const currentProfile = await ensureUserRow(supabase, user);
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

    const { data, error } = await supabase
      .from("users")
      .update({ settings })
      .eq("id", user.id)
      .select("*")
      .single();

    if (error) {
      throw error;
    }

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
