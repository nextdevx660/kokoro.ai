import { createCharacterReply } from "@/lib/chat";
import { getVisibleCharacterById } from "@/lib/characters";
import { requireFirebaseUser } from "@/lib/firebase-server-auth";
import {
  consumeDailyChatToken,
  getDailyChatTokenStatus,
} from "@/lib/token-storage";

function formatTokenError(error) {
  return error?.message || "Failed to load token status.";
}

export async function GET(request) {
  try {
    const authResult = await requireFirebaseUser(
      request,
      "Please sign in to continue chatting."
    );

    if (authResult.error) {
      return authResult.error;
    }

    const { user } = authResult;
    const tokenState = await getDailyChatTokenStatus({ userId: user.id });

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
    const authResult = await requireFirebaseUser(
      request,
      "Please sign in to continue chatting."
    );

    if (authResult.error) {
      return authResult.error;
    }

    const { user } = authResult;
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
      userId: user.id,
      characterId,
    });

    if (!character) {
      return Response.json(
        { error: "Character not found" },
        { status: 404 }
      );
    }

    const tokenState = await consumeDailyChatToken({ userId: user.id });

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

async function getCharacter({ userId, characterId }) {
  return getVisibleCharacterById({
    userId,
    id: characterId,
  });
}
