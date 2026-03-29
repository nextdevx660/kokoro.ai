import crypto from "node:crypto";
import { db } from "@/lib/firebase";
import { uploadImageToCloudinary } from "@/lib/cloudinary";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { doc, setDoc } from "firebase/firestore";

function buildSceneRecord({
  userId,
  playerName,
  worldName,
  genre,
  setting,
  tone,
  promptDescription,
  visibility,
  avatarUrl,
}) {
  const name = worldName;
  const description = `${tone} ${genre} world set in ${setting}. You live as ${playerName}.`;

  return {
    id: `scene-${crypto.randomUUID().slice(0, 8)}`,
    userId,
    visibility,
    name,
    description,
    tag: genre,
    avatarUrl,
    isFree: true,
    isScene: true,
    isListed: visibility === "public",
    playerName,
    worldName,
    sceneGenre: genre,
    sceneSetting: setting,
    sceneTone: tone,
    prompt: [
      `You are the immersive narrator, world engine, environment, and every side character inside the scene "${name}".`,
      `The user is roleplaying as ${playerName}.`,
      `World name: ${worldName}.`,
      `Scene genre: ${genre}.`,
      `Scene setting: ${setting}.`,
      `Scene tone: ${tone}.`,
      `Scene visibility: ${visibility}.`,
      promptDescription ? `Scene brief: ${promptDescription}` : "",
      "Let the user do anything that fits the world and react dynamically.",
      "Never speak for the user, never control the user's choices, and never break immersion.",
      "Respond with vivid worldbuilding, dialogue, consequences, opportunities, and sensory detail.",
    ]
      .filter(Boolean)
      .join("\n\n"),
    createdAt: new Date().toISOString(),
    generatedAt: Date.now(),
  };
}

export async function POST(request) {
  try {
    const authorization = request.headers.get("authorization") || "";
    const accessToken = authorization.startsWith("Bearer ")
      ? authorization.slice(7).trim()
      : "";

    if (!accessToken) {
      return Response.json(
        { error: "Please sign in to create a world." },
        { status: 401 }
      );
    }

    const supabase = createServerSupabaseClient(accessToken);
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return Response.json(
        { error: "Your session is invalid. Please sign in again." },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const playerName = String(formData.get("playerName") || "").trim();
    const worldName = String(formData.get("worldName") || "").trim();
    const genre = String(formData.get("genre") || "").trim();
    const setting = String(formData.get("setting") || "").trim();
    const tone = String(formData.get("tone") || "").trim();
    const promptDescription = String(formData.get("promptDescription") || "").trim();
    const visibilityInput = String(formData.get("visibility") || "private").trim();
    const visibility = visibilityInput === "public" ? "public" : "private";
    const image = formData.get("image");

    if (
      !playerName ||
      !worldName ||
      !genre ||
      !setting ||
      !tone ||
      !promptDescription
    ) {
      return Response.json(
        {
          error:
            "Character name, world name, scene genre, when the scene is set, tone, and prompt description are required.",
        },
        { status: 400 }
      );
    }

    if (!(image instanceof File) || image.size === 0) {
      return Response.json(
        { error: "World image is required." },
        { status: 400 }
      );
    }

    const upload = await uploadImageToCloudinary(image, {
      folder: "scenes",
    });

    const scene = buildSceneRecord({
      userId: user.id,
      playerName,
      worldName,
      genre,
      setting,
      tone,
      promptDescription,
      visibility,
      avatarUrl: upload.url,
    });

    await setDoc(doc(db, "characters", scene.id), scene);

    return Response.json(scene, { status: 201 });
  } catch (error) {
    console.error("Scene create error:", error);

    return Response.json(
      { error: error.message || "Failed to create scene" },
      { status: 500 }
    );
  }
}
