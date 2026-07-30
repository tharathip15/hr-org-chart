import { supabase } from "../api/_helpers/supabase.js";
import {
  getChangedPhotoRows,
  isDataImageUrl,
  normalizePhotoRows
} from "../api/_helpers/photo_storage.js";

async function migrateEmployeePhotos() {
  const { data, error } = await supabase
    .from("employees")
    .select("*")
    .order("id", { ascending: true });

  if (error) throw error;

  const sourceRows = data || [];
  const normalizedRows = await normalizePhotoRows(
    sourceRows,
    row => row.person_id || row.id
  );
  const changedRows = getChangedPhotoRows(sourceRows, normalizedRows);

  if (changedRows.length > 0) {
    const { error: updateError } = await supabase
      .from("employees")
      .upsert(changedRows);

    if (updateError) throw updateError;
  }

  return {
    scanned: sourceRows.length,
    changed: changedRows.length,
    remainingBase64: normalizedRows.filter(row => isDataImageUrl(row.photo_url)).length
  };
}

try {
  const result = await migrateEmployeePhotos();
  console.log(JSON.stringify(result));
} catch (error) {
  console.error(JSON.stringify({
    ok: false,
    error: error?.message || "Employee photo migration failed"
  }));
  process.exitCode = 1;
}
