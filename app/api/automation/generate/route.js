import "server-only";

import { db } from "@/lib/firebase";
import { generateCharacterAndScene } from "@/lib/system";
import { doc, setDoc } from "firebase/firestore";

function isAuthorized(request) {
  const secret = process.env.CRON_SECRET;

  if (!secret) {
    return true;
  }

  return request.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(request) {
  try {
    if (!isAuthorized(request)) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { character, scene } = await generateCharacterAndScene();

    await Promise.all([
      setDoc(doc(db, "characters", character.id), character),
      setDoc(doc(db, "characters", scene.id), scene),
    ]);

    return Response.json({
      success: true,
      generatedAt: new Date().toISOString(),
      character,
      scene,
    });
  } catch (error) {
    console.error("Automation generate error:", error);

    return Response.json(
      {
        success: false,
        error: error.message || "Failed to auto-generate content",
      },
      { status: 500 }
    );
  }
}
