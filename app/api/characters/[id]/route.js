import { getVisibleCharacterById } from "@/lib/characters";
import { getOptionalFirebaseUser } from "@/lib/firebase-server-auth";

export async function GET(request, context) {
  try {
    const { id } = await context.params;
    const authResult = await getOptionalFirebaseUser(request);

    const character = await getVisibleCharacterById({
      userId: authResult.user?.id || null,
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
