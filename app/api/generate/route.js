import { db } from "@/lib/firebase";
import { generateNewCharacter } from "@/lib/system";
import { doc, setDoc } from "firebase/firestore";

export async function GET() {
          try {
                    const character = await generateNewCharacter();

                    // Save to Firebase (document ID = character.id)
                    const docRef = doc(db, "characters", character.id);   // Collection name "characters" better hai

                    await setDoc(docRef, {
                              ...character,
                              createdAt: new Date().toISOString(),   // extra useful field
                              generatedAt: Date.now(),
                    });

                    console.log(`✅ Saved Waifu: ${character.name} (${character.id}) | Free: ${character.isFree}`);

                    return Response.json({
                              success: true,
                              character: character
                    });

          } catch (error) {
                    console.error("❌ Generate & Save Error:", error);

                    return Response.json({
                              success: false,
                              error: error.message || "Failed to generate character"
                    }, { status: 500 });
          }
}
