import { supabase } from "@/lib/supabase";

export async function getStoredChat({ userId, characterId }) {
  const { data: userRecord, error: userError } = await supabase
    .from("users")
    .select("chat_id")
    .eq("id", userId)
    .maybeSingle();

  if (userError) {
    throw userError;
  }

  if (userRecord?.chat_id) {
    const { data: activeChat, error: activeChatError } = await supabase
      .from("chats")
      .select("id, character_id, messages")
      .eq("id", userRecord.chat_id)
      .eq("user_id", userId)
      .maybeSingle();

    if (activeChatError) {
      throw activeChatError;
    }

    if (activeChat?.character_id === characterId) {
      return activeChat;
    }
  }

  const { data: chats, error: chatsError } = await supabase
    .from("chats")
    .select("id, character_id, messages")
    .eq("user_id", userId)
    .eq("character_id", characterId)
    .order("updated_at", { ascending: false })
    .limit(1);

  if (chatsError) {
    throw chatsError;
  }

  return chats?.[0] || null;
}

export async function saveChatSession({
  chatId,
  userId,
  character,
  messages,
}) {
  const payload = {
    user_id: userId,
    character_id: character.id,
    character_name: character.name,
    character_avatar_url: character.avatarUrl || null,
    messages,
    updated_at: new Date().toISOString(),
  };

  if (chatId) {
    const { data, error } = await supabase
      .from("chats")
      .update(payload)
      .eq("id", chatId)
      .eq("user_id", userId)
      .select("id")
      .single();

    if (error) {
      throw error;
    }

    return data.id;
  }

  const { data, error } = await supabase
    .from("chats")
    .insert({
      ...payload,
      created_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error) {
    throw error;
  }

  return data.id;
}

export async function saveActiveChatId(userId, chatId) {
  const { error } = await supabase
    .from("users")
    .update({ chat_id: chatId })
    .eq("id", userId);

  if (error) {
    throw error;
  }
}
