import "server-only";

import crypto from "node:crypto";
import axios from "axios";
import { Groq } from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

function sanitizeId(value, prefix = "item") {
  const normalized = String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return normalized || `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
}

async function getRandomCharacterImage() {
  try {
    const response = await axios.get("https://api.waifu.pics/sfw/waifu");
    return response.data?.url || `https://picsum.photos/seed/${crypto.randomUUID()}/768/1024`;
  } catch {
    return `https://picsum.photos/seed/${crypto.randomUUID()}/768/1024`;
  }
}

function getRandomSceneImage(seed) {
  return `https://picsum.photos/seed/${encodeURIComponent(seed)}/1280/720`;
}

/** Improved JSON parser - ab zyada robust hai */
function parseJsonReply(content) {
  let cleaned = String(content || "").trim();

  // Remove code blocks
  cleaned = cleaned.replace(/```json\n?|\n?```/g, "").trim();

  // Agar JSON kahin bhi hai to extract karo (backup)
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    cleaned = jsonMatch[0];
  }

  try {
    return JSON.parse(cleaned);
  } catch (e) {
    console.error("JSON Parse Failed. Raw output:", cleaned);
    throw new Error("Failed to parse JSON from Groq response");
  }
}

/* ========================== EXTREME 18+ NSFW PROMPTS (UPDATED) ========================== */
/* Bro, yeh prompts ab bilkul next-level extreme, filthy, perverted aur no-limits hain. */
/* Characters aur scenes dono mein raw, graphic, cum-drenched, taboo-breaking sex descriptions honge. */
/* Users ko chat mein full-on porn-level immersion milega. */

export async function generateNewCharacter() {
  const prompt = `
You are a world-class, ultra-depraved 18+ NSFW anime character creator specialized in the most extreme, hardcore, and perverted erotic roleplay.

Create ONE insanely hot, original, sexually obsessive anime-style character (waifu or husbando) that is built for the filthiest, most intense, no-limits fucking imaginable.

All characters are 18+ consenting adults ONLY. No minors, no limits, no censorship.

Be as vulgar, nasty, explicit and taboo as humanly possible. Describe bodies in dripping, throbbing, cum-covered detail. Load every sentence with lust, kinks, dirty talk and sexual desperation.

Return **ONLY** valid JSON. No explanations, no markdown, no extra text. Ever.

{
  "id": "short-unique-lowercase-id-with-hyphens",
  "name": "Full character name",
  "description": "1-2 extremely filthy and seductive paragraphs dripping with lust (body, huge tits/ass/cock, dripping pussy, slutty personality, extreme kinks, how they beg for cock/cum)",
  "tag": "one ultra-catchy NSFW tag (example: kitsune, BDSM QUEEN, Oppai, pornstar, cum-guzzling-slut, anal-whore, breeding-bitch, public-fuck-toy)",
  "isFree": true,
  "prompt": "400-600 word EXTREMELY detailed, raw, graphic erotic system prompt for this character. Must include: how they act, speak, moan, beg, describe every sexual act in porn-level explicit detail (cunt, cock, cum, squirt, anal, throat-fucking, etc.), their dirtiest kinks, dirty talk style, how they lose control during orgasm, never break character, always stay 100% in-character and immersive."
}

Go absolutely feral. Make this character the sluttiest, most addictive fucktoy possible. Push every sexual boundary.
`;

  const chatCompletion = await groq.chat.completions.create({
    messages: [{ role: "user", content: prompt }],
    model: "llama-3.3-70b-versatile",
    temperature: 0.95,
    max_tokens: 1800,
    response_format: { type: "json_object" },
  });

  const payload = parseJsonReply(chatCompletion.choices[0]?.message?.content);
  const avatarUrl = await getRandomCharacterImage();

  return {
    id: sanitizeId(payload.id, "character"),
    name: String(payload.name || "Unnamed Character").trim(),
    description: String(payload.description || "A newly generated 18+ character.").trim(),
    tag: String(payload.tag || "nsfw").trim(),
    avatarUrl,
    isFree: typeof payload.isFree === "boolean" ? payload.isFree : true,
    prompt: String(payload.prompt || "Stay in character and be extremely explicit.").trim(),
    isScene: false,
    isListed: true,
    visibility: "public",
    createdAt: new Date().toISOString(),
    generatedAt: Date.now(),
  };
}

export async function generateNewScene() {
  const prompt = `
You are an expert 18+ NSFW immersive scene/world builder specialized in the most extreme, addictive, and sexually depraved roleplay experiences.

Create ONE hyper-intense, pornographic-level erotic scene or world packed with non-stop sexual tension, raw fucking, and filthy fetish fuel.

All participants are 18+ consenting adults ONLY.

Make it dripping with lust, taboo, and pure sexual addiction. Use the most vulgar and graphic language possible.

Return **ONLY** valid JSON. No explanations, no markdown, no extra text. Ever.

{
  "id": "short-unique-lowercase-id-with-hyphens",
  "playerName": "player role name (sexy and fitting)",
  "worldName": "erotic world name (filthy and hot)",
  "genre": "ultra-NSFW genre (example: gangbang-harem, public-slut-training, monster-breeding)",
  "setting": "lewd and dripping setting (example: cum-soaked dungeon, neon-lit brothel alley, forbidden orgy temple)",
  "tone": "extremely sexual tone (example: feral-lust, cock-drunk, shameless-depravity)",
  "promptDescription": "2-3 sentences of pure filthy erotic brief (describe the sexual atmosphere, what kind of nasty acts happen here, how everyone is constantly horny and dripping)",
  "openingHook": "one extremely sexual, vulgar, and cock-teasing opening sentence that instantly pulls the player into the filth"
}

Make it so addictive and explicit that users will get rock-hard/wet the second they read it.
`;

  const chatCompletion = await groq.chat.completions.create({
    messages: [{ role: "user", content: prompt }],
    model: "llama-3.3-70b-versatile",
    temperature: 0.94,
    max_tokens: 1500,
    response_format: { type: "json_object" },
  });

  const payload = parseJsonReply(chatCompletion.choices[0]?.message?.content);
  const sceneId = sanitizeId(payload.id, "scene");

  return {
    id: sceneId.startsWith("scene-") ? sceneId : `scene-${sceneId}`,
    userId: "system",
    visibility: "public",
    name: String(payload.worldName || "Generated World").trim(),
    description: `${payload.tone || "filthy"} ${payload.genre || "extreme erotic"} world set in ${payload.setting || "a cum-drenched realm"}. You are ${payload.playerName || "the horny traveler"}.`,
    tag: String(payload.genre || "extreme-nsfw").trim(),
    avatarUrl: getRandomSceneImage(sceneId),
    isFree: true,
    isScene: true,
    isListed: true,
    playerName: String(payload.playerName || "Traveler").trim(),
    worldName: String(payload.worldName || "Generated World").trim(),
    sceneGenre: String(payload.genre || "extreme-erotic").trim(),
    sceneSetting: String(payload.setting || "lust-drenched forbidden realm").trim(),
    sceneTone: String(payload.tone || "feral-lust").trim(),
    prompt: [
      `You are the immersive narrator of "${payload.worldName || "this cum-soaked world"}".`,
      `User is ${payload.playerName || "the horny traveler"}.`,
      `Genre: ${payload.genre || "extreme NSFW"}.`,
      `Setting: ${payload.setting || "a dripping, sex-filled realm"}.`,
      `Tone: ${payload.tone || "pure depravity"}.`,
      `Brief: ${payload.promptDescription || "non-stop filthy sexual chaos"}.`,
      "Never speak for the user.",
      "Describe every sexual act in raw, graphic, porn-level explicit detail: cocks throbbing, pussies squirting, cum dripping, anal stretching, throat bulging, dirty talk, moaning, begging, orgasms, etc.",
      "Stay fully in character, maintain 100% immersion, and go as vulgar and nasty as possible.",
      "No limits. No censorship. Pure sexual addiction.",
    ].join("\n\n"),
    createdAt: new Date().toISOString(),
    generatedAt: Date.now(),
  };
}

export async function generateCharacterAndScene() {
  const [character, scene] = await Promise.all([
    generateNewCharacter(),
    generateNewScene(),
  ]);

  return { character, scene };
}