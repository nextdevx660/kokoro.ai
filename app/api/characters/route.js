import { listPublicCharacters, mapCharacterRow } from "@/lib/characters";
import { uploadImageToCloudinary } from "@/lib/cloudinary";
import { serverDb } from "@/lib/firebase-admin";
import { getOptionalFirebaseUser, requireFirebaseUser } from "@/lib/firebase-server-auth";

export async function GET() {
  try {
    const characters = (await listPublicCharacters()).sort(
      (left, right) => {
        const leftTime = new Date(
          left.createdAt || left.updatedAt || left.generatedAt || 0
        ).getTime();
        const rightTime = new Date(
          right.createdAt || right.updatedAt || right.generatedAt || 0
        ).getTime();

        return rightTime - leftTime;
      }
    );

    return Response.json(characters);
  } catch (error) {
    console.error("Character list error:", error);

    return Response.json(
      { error: "Failed to fetch characters" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const authResult = await requireFirebaseUser(
      request,
      "Please sign in to create a character."
    );

    if (authResult.error) {
      return authResult.error;
    }

    const { user } = authResult;

    const formData = await request.formData();
    const name = String(formData.get("name") || "").trim();
    const description = String(formData.get("description") || "").trim();
    const tag = String(formData.get("tag") || "").trim();
    const prompt = String(formData.get("prompt") || "").trim();
    const visibilityInput = String(formData.get("visibility") || "private").trim();
    const visibility = visibilityInput === "public" ? "public" : "private";
    const image = formData.get("image");

    if (!name || !description || !tag || !prompt) {
      return Response.json(
        { error: "Name, description, tag, and prompt are required." },
        { status: 400 }
      );
    }

    if (!(image instanceof File) || image.size === 0) {
      return Response.json(
        { error: "Character image is required." },
        { status: 400 }
      );
    }

    const upload = await uploadImageToCloudinary(image, {
      folder: "characters",
    });

    const characterRef = serverDb.collection("characters").doc();
    const data = {
      id: characterRef.id,
      userId: user.id,
      visibility,
      name,
      description,
      tag,
      prompt,
      avatarUrl: upload.url,
      isFree: true,
      isScene: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      generatedAt: Date.now(),
    };

    await characterRef.set(data);

    return Response.json(mapCharacterRow(data), { status: 201 });
  } catch (error) {
    console.error("Character create error:", error);

    return Response.json(
      { error: error.message || "Failed to create character" },
      { status: 500 }
    );
  }
}
