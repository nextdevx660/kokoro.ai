import { db } from "@/lib/firebase";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";

function resolveUserId(userId) {
  if (typeof userId === "string" && userId.trim()) {
    return userId.trim();
  }

  return "";
}

export async function getStoredChat({ userId, characterId }) {
  const resolvedUserId = resolveUserId(userId);

  if (!resolvedUserId || !characterId) {
    return null;
  }

  const userSnapshot = await getDoc(doc(db, "users", resolvedUserId));
  const userRecord = userSnapshot.exists() ? userSnapshot.data() : null;

  if (userRecord?.chat_id) {
    const activeChatSnapshot = await getDoc(doc(db, "chats", userRecord.chat_id));

    if (activeChatSnapshot.exists()) {
      const activeChat = {
        id: activeChatSnapshot.id,
        ...activeChatSnapshot.data(),
      };

      if (
        activeChat.user_id === resolvedUserId &&
        activeChat.character_id === characterId
      ) {
        return activeChat;
      }
    }
  }

  const chatsQuery = query(
    collection(db, "chats"),
    where("user_id", "==", resolvedUserId),
    where("character_id", "==", characterId),
    orderBy("updated_at", "desc"),
    limit(1)
  );
  const chatsSnapshot = await getDocs(chatsQuery);

  if (chatsSnapshot.empty) {
    return null;
  }

  const chatDoc = chatsSnapshot.docs[0];
  return {
    id: chatDoc.id,
    ...chatDoc.data(),
  };
}

export async function saveChatSession({
  chatId,
  userId,
  character,
  messages,
}) {
  const resolvedUserId = resolveUserId(userId);

  if (!resolvedUserId) {
    throw new Error("A valid user ID is required to save chat history.");
  }

  const payload = {
    user_id: resolvedUserId,
    character_id: character.id,
    character_name: character.name,
    character_avatar_url: character.avatarUrl || null,
    messages,
    updated_at: new Date().toISOString(),
  };

  if (chatId) {
    await setDoc(doc(db, "chats", chatId), payload, { merge: true });
    return chatId;
  }

  const newChatRef = await addDoc(collection(db, "chats"), {
    ...payload,
    created_at: new Date().toISOString(),
  });

  return newChatRef.id;
}

export async function saveActiveChatId(userId, chatId) {
  const resolvedUserId = resolveUserId(userId);

  if (!resolvedUserId) {
    throw new Error("A valid user ID is required to save the active chat.");
  }

  await setDoc(
    doc(db, "users", resolvedUserId),
    { chat_id: chatId, updated_at: new Date().toISOString() },
    { merge: true }
  );
}
