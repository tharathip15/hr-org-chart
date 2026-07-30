export async function syncPositionRows(supabaseClient, rows) {
  const positionRows = Array.isArray(rows) ? rows : [];
  const payloadIds = positionRows
    .map(position => parseInt(position.id, 10))
    .filter(Number.isInteger);

  if (payloadIds.length === 0) {
    const { error: deleteError } = await supabaseClient
      .from("positions")
      .delete()
      .neq("id", 0);
    if (deleteError) throw deleteError;
    return;
  }

  const { error: upsertError } = await supabaseClient
    .from("positions")
    .upsert(positionRows);
  if (upsertError) throw upsertError;

  const { error: deleteError } = await supabaseClient
    .from("positions")
    .delete()
    .not("id", "in", `(${payloadIds.join(",")})`);
  if (deleteError) throw deleteError;
}
