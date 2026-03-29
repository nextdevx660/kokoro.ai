import { mapCharacterRow } from "@/lib/characters";
import { uploadImageToCloudinary } from "@/lib/cloudinary";
import { db } from "@/lib/firebase";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { collection, getDocs, limit, orderBy, query } from "firebase/firestore";

function getAccessToken(request) {
  const authorization = request.headers.get("authorization") || "";

  if (!authorization.startsWith("Bearer ")) {
    return "";
  }

  return authorization.slice(7).trim();
}

async function getOptionalUser(accessToken) {
  const supabase = createServerSupabaseClient(accessToken);

  if (!accessToken) {
    return { supabase, user: null };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { supabase, user: user || null };
}

export async function GET() {
  try {
    const charactersQuery = query(
      collection(db, "characters"),
      orderBy("generatedAt", "desc"),
      limit(120)
    );
    const [firestoreSnapshot, supabaseResult] = await Promise.all([
      getDocs(charactersQuery),
      createServerSupabaseClient()
        .from("characters")
        .select("*")
        .eq("visibility", "public")
        .order("created_at", { ascending: false })
        .limit(120),
    ]);

    if (supabaseResult.error) {
      throw supabaseResult.error;
    }

    const firestoreCharacters = firestoreSnapshot.docs
      .map((characterDoc) => ({
        id: characterDoc.id,
        ...characterDoc.data(),
      }))
      .filter((character) => !character.isScene);
    const publicSupabaseCharacters = (supabaseResult.data || []).map(mapCharacterRow);
    const characters = [...firestoreCharacters, ...publicSupabaseCharacters].sort(
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
    const accessToken = getAccessToken(request);

    if (!accessToken) {
      return Response.json(
        { error: "Please sign in to create a character." },
        { status: 401 }
      );
    }

    const { supabase, user } = await getOptionalUser(accessToken);

    if (!user) {
      return Response.json(
        { error: "Your session is invalid. Please sign in again." },
        { status: 401 }
      );
    }

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

    const { data, error } = await supabase
      .from("characters")
      .insert({
        user_id: user.id,
        visibility,
        name,
        description,
        tag,
        prompt,
        avatar_url: upload.url,
      })
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    return Response.json(mapCharacterRow(data), { status: 201 });
  } catch (error) {
    console.error("Character create error:", error);

    return Response.json(
      { error: error.message || "Failed to create character" },
      { status: 500 }
    );
  }
}
