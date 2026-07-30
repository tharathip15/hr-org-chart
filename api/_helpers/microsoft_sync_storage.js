export async function upsertMicrosoftEmployeeRows(client, rows = []) {
  const payload = (Array.isArray(rows) ? rows : []).map(row => {
    const copy = { ...row };
    delete copy.x;
    delete copy.y;
    return copy;
  });

  if (payload.length === 0) return 0;

  const { error } = await client
    .from("employees")
    .upsert(payload);

  if (error) throw error;
  return payload.length;
}
