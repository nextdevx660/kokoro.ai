import "server-only";

import { adminAuth, hasFirebaseAdmin } from "@/lib/firebase-admin";

function getAccessToken(request) {
  const authorization = request.headers.get("authorization") || "";

  if (!authorization.startsWith("Bearer ")) {
    return "";
  }

  return authorization.slice(7).trim();
}

function mapDecodedTokenToUser(decodedToken) {
  const name = decodedToken.name || decodedToken.email || "User";

  return {
    id: decodedToken.uid,
    email: decodedToken.email || "",
    email_verified: Boolean(decodedToken.email_verified),
    user_metadata: {
      name,
      full_name: decodedToken.name || name,
      picture: decodedToken.picture || "",
    },
  };
}

export async function getOptionalFirebaseUser(request) {
  const accessToken = getAccessToken(request);

  if (!accessToken) {
    return { accessToken: "", user: null, decodedToken: null };
  }

  try {
    const decodedToken = hasFirebaseAdmin
      ? await adminAuth.verifyIdToken(accessToken)
      : await verifyFirebaseTokenWithRest(accessToken);
    return {
      accessToken,
      decodedToken,
      user: mapDecodedTokenToUser(decodedToken),
    };
  } catch {
    return { accessToken, user: null, decodedToken: null };
  }
}

export async function requireFirebaseUser(request, message) {
  const { accessToken, decodedToken, user } = await getOptionalFirebaseUser(
    request
  );

  if (!accessToken) {
    return {
      error: Response.json(
        { error: message || "Please sign in first." },
        { status: 401 }
      ),
    };
  }

  if (!user) {
    return {
      error: Response.json(
        { error: "Your session is invalid. Please sign in again." },
        { status: 401 }
      ),
    };
  }

  return { accessToken, decodedToken, user };
}

async function verifyFirebaseTokenWithRest(accessToken) {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.replace(/^['"]|['"]$/g, "");

  if (!apiKey) {
    throw new Error("Missing NEXT_PUBLIC_FIREBASE_API_KEY for Firebase token verification.");
  }

  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        idToken: accessToken,
      }),
      cache: "no-store",
    }
  );

  const payload = await response.json().catch(() => null);
  const user = payload?.users?.[0];

  if (!response.ok || !user?.localId) {
    throw new Error(payload?.error?.message || "Failed to verify Firebase token.");
  }

  return {
    uid: user.localId,
    email: user.email || "",
    email_verified: Boolean(user.emailVerified),
    name: user.displayName || user.email || "User",
    picture: user.photoUrl || "",
  };
}
