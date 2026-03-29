export function mapCharacterRow(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    userId: row.user_id,
    visibility: row.visibility,
    name: row.name,
    description: row.description || "",
    tag: row.tag || "",
    prompt: row.prompt || "",
    avatarUrl: row.avatar_url || "",
    isFree: true,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function applyCharacterAccessFilter(query, userId) {
  if (!userId) {
    return query.eq("visibility", "public");
  }

  return query.or(`visibility.eq.public,user_id.eq.${userId}`);
}

export async function listVisibleCharacters({ supabase, userId }) {
  const { data, error } = await applyCharacterAccessFilter(
    supabase.from("characters").select("*"),
    userId
  ).order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data || []).map(mapCharacterRow);
}

export async function getVisibleCharacterById({ supabase, userId, id }) {
  const { data, error } = await applyCharacterAccessFilter(
    supabase.from("characters").select("*").eq("id", id),
    userId
  ).maybeSingle();

  if (error) {
    throw error;
  }

  return mapCharacterRow(data);
}
