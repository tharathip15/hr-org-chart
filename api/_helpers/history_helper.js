import { supabase } from "./supabase.js";
import { isDataImageUrl } from "./photo_storage.js";

export async function createSnapshotAndLog(action, summary) {
  try {
    // 1. Fetch current employees state from database
    const { data: employeesData } = await supabase
      .from("employees")
      .select("*")
      .order("id", { ascending: true });

    // 2. Fetch current positions state from database
    const { data: positionsData } = await supabase
      .from("positions")
      .select("*")
      .order("id", { ascending: true });

    // 3. Fetch current annotations state from preferences
    const { data: annotationsData } = await supabase
      .from("preferences")
      .select("value")
      .eq("key", "canvas_annotations")
      .single();

    // Mapping db properties back to clean camelCase employee schema for client compatibility on restore
    const employees = (employeesData || []).map(row => ({
      id: row.id,
      personId: row.person_id,
      name: row.name,
      role: row.role,
      department: row.department,
      managerId: row.manager_id,
      email: row.email,
      phone: row.phone,
      bio: row.bio,
      // Never add legacy Base64 payloads to new audit snapshots. Blob URLs are
      // small and remain restorable; old snapshots are left untouched.
      photoUrl: isDataImageUrl(row.photo_url) ? null : row.photo_url,
      avatarColor: row.avatar_color,
      x: row.x,
      y: row.y
    }));

    // Mapping db properties back to positions schema for client compatibility on restore
    const positions = (positionsData || []).map(row => {
      let parsedNotes = {};
      try {
        parsedNotes = JSON.parse(row.notes || "{}");
      } catch (e) {}

      return {
        id: row.id,
        title: row.title,
        department: row.department,
        managerId: row.manager_id,
        employeeId: row.employee_id,
        x: row.x,
        y: row.y,
        layoutStyle: parsedNotes.layoutStyle || "horizontal",
        isManual: !!parsedNotes.isManual,
        notes: parsedNotes.text || ""
      };
    });

    const annotations = annotationsData?.value || [];

    // 4. Build complete snapshot payload
    const payload = {
      employees,
      positions,
      annotations
    };

    // 5. Load existing audit logs list
    const { data: auditLogData, error: logError } = await supabase
      .from("preferences")
      .select("value")
      .eq("key", "audit_logs")
      .single();

    let logs = [];
    if (!logError && auditLogData && Array.isArray(auditLogData.value)) {
      logs = auditLogData.value;
    }

    // 6. Prepend new audit log entry
    const newLog = {
      id: `hist-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      action,
      summary,
      timestamp: new Date().toISOString(),
      payload
    };

    logs.unshift(newLog);
    if (logs.length > 30) {
      logs = logs.slice(0, 30);
    }

    // 7. Save updated logs back to Supabase
    await supabase
      .from("preferences")
      .upsert({
        key: "audit_logs",
        value: logs,
        updated_at: new Date().toISOString()
      });
  } catch (error) {
    console.error("Failed to create snapshot and write audit log:", error);
  }
}
