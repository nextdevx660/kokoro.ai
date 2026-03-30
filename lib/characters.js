import "server-only";

import { hasFirebaseAdmin, serverDb } from "@/lib/firebase-admin";

function normalizeCharacterRecord(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    userId: row.userId || row.user_id || null,
    visibility: row.visibility,
    name: row.name,
    description: row.description || "",
    tag: row.tag || "",
    prompt: row.prompt || "",
    avatarUrl: row.avatarUrl || row.avatar_url || "",
    isFree: row.isFree ?? true,
    isScene: Boolean(row.isScene),
    playerName: row.playerName || "",
    worldName: row.worldName || "",
    createdAt: row.createdAt || row.created_at || null,
    updatedAt: row.updatedAt || row.updated_at || null,
    generatedAt: row.generatedAt || null,
  };
}

export function mapCharacterRow(row) {
  return normalizeCharacterRecord(row);
}

export async function listPublicCharacters() {
  if (hasFirebaseAdmin) {
    const snapshot = await serverDb.collection("characters").limit(300).get();

    return snapshot.docs
      .map((characterDoc) =>
        normalizeCharacterRecord({
          id: characterDoc.id,
          ...characterDoc.data(),
        })
      )
      .filter((character) => character?.visibility === "public" && !character?.isScene)
      .sort((left, right) => {
        const leftTime = new Date(
          left?.createdAt || left?.updatedAt || left?.generatedAt || 0
        ).getTime();
        const rightTime = new Date(
          right?.createdAt || right?.updatedAt || right?.generatedAt || 0
        ).getTime();

        return rightTime - leftTime;
      })
      .slice(0, 120);
  }

  const documents = await listCharactersViaRest();
  return documents
    .map(normalizeCharacterRecord)
    .filter((character) => character?.visibility === "public" && !character?.isScene)
    .sort((left, right) => {
      const leftTime = new Date(
        left?.createdAt || left?.updatedAt || left?.generatedAt || 0
      ).getTime();
      const rightTime = new Date(
        right?.createdAt || right?.updatedAt || right?.generatedAt || 0
      ).getTime();

      return rightTime - leftTime;
    })
    .slice(0, 120);
}

export async function getVisibleCharacterById({ userId, id }) {
  const character = hasFirebaseAdmin
    ? await getCharacterViaAdmin(id)
    : await getCharacterViaRest(id);

  if (!character) {
    return null;
  }

  if (
    character.visibility === "private" &&
    character.userId &&
    character.userId !== userId
  ) {
    return null;
  }

  return character;
}

async function getCharacterViaAdmin(id) {
  const snapshot = await serverDb.collection("characters").doc(id).get();

  if (!snapshot.exists) {
    return null;
  }

  return normalizeCharacterRecord({
    id: snapshot.id,
    ...snapshot.data(),
  });
}

async function listCharactersViaRest() {
  const payload = await fetchFirestoreRest("characters?pageSize=120");
  const documents = Array.isArray(payload?.documents) ? payload.documents : [];
  return documents.map(deserializeFirestoreDocument);
}

async function getCharacterViaRest(id) {
  const payload = await fetchFirestoreRest(`characters/${encodeURIComponent(id)}`);

  if (!payload?.name) {
    return null;
  }

  return normalizeCharacterRecord(deserializeFirestoreDocument(payload));
}

async function fetchFirestoreRest(pathname) {
  const projectId = sanitizeEnv(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);
  const apiKey = sanitizeEnv(process.env.NEXT_PUBLIC_FIREBASE_API_KEY);

  if (!projectId || !apiKey) {
    throw new Error("Missing Firebase public config for Firestore REST fallback.");
  }

  const separator = pathname.includes("?") ? "&" : "?";
  const response = await fetch(
    `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${pathname}${separator}key=${encodeURIComponent(
      apiKey
    )}`,
    {
      cache: "no-store",
    }
  );

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(payload?.error?.message || "Failed to read Firestore data.");
  }

  return payload;
}

function deserializeFirestoreDocument(document) {
  const name = document?.name || "";
  const id = name.split("/").pop();

  return {
    id,
    ...deserializeFields(document?.fields || {}),
  };
}

function deserializeFields(fields) {
  return Object.fromEntries(
    Object.entries(fields).map(([key, value]) => [key, deserializeValue(value)])
  );
}

function deserializeValue(value) {
  if (!value || typeof value !== "object") {
    return null;
  }

  if ("stringValue" in value) return value.stringValue;
  if ("integerValue" in value) return Number(value.integerValue);
  if ("doubleValue" in value) return Number(value.doubleValue);
  if ("booleanValue" in value) return Boolean(value.booleanValue);
  if ("timestampValue" in value) return value.timestampValue;
  if ("nullValue" in value) return null;
  if ("arrayValue" in value) {
    return Array.isArray(value.arrayValue?.values)
      ? value.arrayValue.values.map(deserializeValue)
      : [];
  }
  if ("mapValue" in value) {
    return deserializeFields(value.mapValue?.fields || {});
  }

  return null;
}

function sanitizeEnv(value) {
  return typeof value === "string" ? value.replace(/^['"]|['"]$/g, "") : value;
}
