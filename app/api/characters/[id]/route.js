import { getVisibleCharacterById } from "@/lib/characters";
import { db } from "@/lib/firebase";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { doc, getDoc } from "firebase/firestore";

function getAccessToken(request) {
  const authorization = request.headers.get("authorization") || "";

  if (!authorization.startsWith("Bearer ")) {
    return "";
  }

  return authorization.slice(7).trim();
}

export async function GET(request, context) {
  try {
    const { id } = await context.params;
    const accessToken = getAccessToken(request);
    let userId = null;

    if (accessToken) {
      const supabase = createServerSupabaseClient(accessToken);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      userId = user?.id || null;
    }

    const firestoreSnapshot = await getDoc(doc(db, "characters", id));

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
        return Response.json(
          { error: "Character not found" },
          { status: 404 }
        );
      }

      return Response.json(firestoreCharacter);
    }

    const supabase = createServerSupabaseClient(accessToken);

    const character = await getVisibleCharacterById({
      supabase,
      userId,
      id,
    });

    if (!character) {
      return Response.json(
        { error: "Character not found" },
        { status: 404 }
      );
    }

    return Response.json(character);
  } catch (error) {
    console.error("Character fetch error:", error);

    return Response.json(
      { error: "Failed to fetch character" },
      { status: 500 }
    );
  }
}
