import { createCharacterReply } from "@/lib/chat";
import { getVisibleCharacterById } from "@/lib/characters";
import { db } from "@/lib/firebase";
import {
  createAdminSupabaseClient,
  createServerSupabaseClient,
} from "@/lib/supabase-server";
import {
  consumeDailyChatToken,
  getDailyChatTokenStatus,
} from "@/lib/token-storage";
import { doc, getDoc } from "firebase/firestore";

async function requireAuthenticatedUser(request) {
  const authorization = request.headers.get("authorization") || "";
  const accessToken = authorization.startsWith("Bearer ")
    ? authorization.slice(7).trim()
    : "";

  if (!accessToken) {
    return {
      error: Response.json(
        { error: "Please sign in to continue chatting." },
        { status: 401 }
      ),
    };
  }

  const supabase = createServerSupabaseClient(accessToken);
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return {
      error: Response.json(
        { error: "Your session is invalid. Please sign in again." },
        { status: 401 }
      ),
    };
  }

  return { supabase, user };
}

async function getCharacter({ supabase, userId, characterId }) {
  const firestoreSnapshot = await getDoc(doc(db, "characters", characterId));

  if (firestoreSnapshot.exists()) {
    const firestoreCharacter = {
      id: firestoreSnapshot.id,
      ...firestoreSnapshot.data(),
    };

    if (
      firestoreCharacter.visibility === "private" &&
      firestoreCharacter.userId &&
      firestoreCharacter.userId !== userId
    ) {
      return null;
    }

    return firestoreCharacter;
  }

  return getVisibleCharacterById({
    supabase,
    userId,
    id: characterId,
  });
}

function formatTokenError(error) {
  const message = error?.message || "";

  if (
    message.includes("daily_tokens_remaining") ||
    message.includes("token_last_reset_at") ||
    message.includes("User profile not found")
  ) {
    return "Token system database columns are missing. Run the SQL in supabase/chat_system.sql first.";
  }

  return message || "Failed to load token status.";
}

export async function GET(request) {
  try {
    const authResult = await requireAuthenticatedUser(request);

    if (authResult.error) {
      return authResult.error;
    }

    const { supabase, user } = authResult;
    const tokenState = await getDailyChatTokenStatus({
      adminSupabase: createAdminSupabaseClient(),
      supabase,
      userId: user.id,
    });

    return Response.json(tokenState);
  } catch (error) {
    console.error("Chat token status error:", error);

    return Response.json(
      { error: formatTokenError(error) },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const authResult = await requireAuthenticatedUser(request);

    if (authResult.error) {
      return authResult.error;
    }

    const { supabase, user } = authResult;
    const body = await request.json();
    const characterId = body?.characterId;
    const messages = Array.isArray(body?.messages) ? body.messages : [];

    if (!characterId) {
      return Response.json(
        { error: "characterId is required" },
        { status: 400 }
      );
    }

    const character = await getCharacter({
      supabase,
      userId: user.id,
      characterId,
    });

    if (!character) {
      return Response.json(
        { error: "Character not found" },
        { status: 404 }
      );
    }

    const tokenState = await consumeDailyChatToken({
      adminSupabase: createAdminSupabaseClient(),
      supabase,
      userId: user.id,
    });

    if (tokenState.isBlocked) {
      return Response.json(
        {
          error: "Your 20 free daily messages are finished. Buy a membership to continue.",
          redirectTo: "/premium",
          ...tokenState,
        },
        { status: 402 }
      );
    }

    const reply = await createCharacterReply(character, messages);

    if (!reply) {
      return Response.json(
        { error: "Empty response from Groq" },
        { status: 502 }
      );
    }

    return Response.json({
      reply,
      tokenState,
      character: {
        id: character.id,
        name: character.name,
        avatarUrl: character.avatarUrl,
      },
    });
  } catch (error) {
    console.error("Chat route error:", error);

    return Response.json(
      { error: formatTokenError(error) },
      { status: 500 }
    );
  }
}
