function stripMarkdown(text = "") {
  return text
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/_([^_]+)_/g, "$1")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/^>\s?/gm, "")
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/^\s*\d+\.\s+/gm, "")
    .replace(/\n{2,}/g, "\n")
    .trim();
}

export async function POST(request) {
  try {
    const body = await request.json();
    const text = typeof body?.text === "string" ? body.text : "";
    const voiceId =
      body?.voiceId ||
      process.env.ELEVENLABS_VOICE_ID ||
      process.env.NEXT_PUBLIC_ELEVENLABS_VOICE_ID;

    if (!process.env.ELEVENLABS_API_KEY) {
      return Response.json(
        { error: "ELEVENLABS_API_KEY is not configured" },
        { status: 500 }
      );
    }

    if (!voiceId) {
      return Response.json(
        { error: "No ElevenLabs voice id configured" },
        { status: 500 }
      );
    }

    const normalizedText = stripMarkdown(text).slice(0, 3500);

    if (!normalizedText) {
      return Response.json(
        { error: "Text is required for speech synthesis" },
        { status: 400 }
      );
    }

    const elevenLabsResponse = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "xi-api-key": process.env.ELEVENLABS_API_KEY,
        },
        body: JSON.stringify({
          text: normalizedText,
          model_id: process.env.ELEVENLABS_MODEL_ID || "eleven_multilingual_v2",
          voice_settings: {
            stability: 0.45,
            similarity_boost: 0.8,
          },
        }),
      }
    );

    if (!elevenLabsResponse.ok) {
      const errorText = await elevenLabsResponse.text();

      return Response.json(
        {
          error: errorText || "Failed to generate speech",
        },
        { status: elevenLabsResponse.status }
      );
    }

    const audioBuffer = await elevenLabsResponse.arrayBuffer();

    return new Response(audioBuffer, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("TTS route error:", error);

    return Response.json(
      { error: error.message || "Failed to generate speech" },
      { status: 500 }
    );
  }
}
