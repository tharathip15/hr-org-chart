import { supabase } from "./_helpers/supabase.js";
import { validateToken, requireEditor } from "./_helpers/auth.js";
import { normalizePhotoRows } from "./_helpers/photo_storage.js";

const MAX_BODY_SIZE = 1024; // Small body limit for POST requests

export default async function handler(request, response) {
  if (request.method !== "GET" && !validateToken(request)) {
    response.status(401).json({ ok: false, error: "Unauthorized" });
    return;
  }

  if (request.method === "GET") {
    await handleGet(response);
    return;
  }

  if (request.method === "POST") {
    if (!requireEditor(request, response)) return;
    await handlePost(request, response);
    return;
  }

  response.setHeader("Allow", "GET, POST");
  response.status(405).json({ ok: false, error: "Method not allowed" });
}

// 1. GET: Return list of history entries (without the large state payloads)
async function handleGet(response) {
  try {
    const { data: row, error } = await supabase
      .from("preferences")
      .select("value")
      .eq("key", "audit_logs")
      .single();

    if (error) {
      if (error.code === "PGRST116") { // no rows
        response.status(200).json([]);
        return;
      }
      throw error;
    }

    const logs = Array.isArray(row?.value) ? row.value : [];
    // Strip payload to keep log list response small
    const lightLogs = logs.map(l => ({
      id: l.id,
      action: l.action,
      summary: l.summary,
      timestamp: l.timestamp
    }));

    response.setHeader("Cache-Control", "no-store");
    response.status(200).json(lightLogs);
  } catch (error) {
    console.error("Failed to load history list:", error);
    response.status(500).json({ ok: false, error: "Failed to load history" });
  }
}

// 2. POST: Restore a specific historical state payload
async function handlePost(request, response) {
  try {
    const body = await readJsonBody(request);
    const { id } = body || {};

    if (!id) {
      response.status(400).json({ ok: false, error: "ID is required" });
      return;
    }

    // Load full logs
    const { data: row, error: getError } = await supabase
      .from("preferences")
      .select("value")
      .eq("key", "audit_logs")
      .single();

    if (getError) throw getError;
    const logs = Array.isArray(row?.value) ? row.value : [];
    const targetLog = logs.find(l => l.id === id);

    if (!targetLog || !targetLog.payload) {
      response.status(404).json({ ok: false, error: "History log or backup state not found" });
      return;
    }

    const { employees, positions, annotations } = targetLog.payload;

    // A. RESTORE EMPLOYEES
    if (Array.isArray(employees)) {
      // Delete existing
      await supabase.from("employees").delete().neq("id", 0);
      // Upsert historical
      if (employees.length > 0) {
        let dbRows = employees.map(emp => ({
          id: parseInt(emp.id, 10),
          person_id: emp.personId || "",
          name: emp.name || "",
          role: emp.role || "",
          department: emp.department || "",
          manager_id: emp.managerId ? parseInt(emp.managerId, 10) : null,
          email: emp.email || null,
          phone: emp.phone || null,
          bio: emp.bio || null,
          photo_url: emp.photoUrl || null,
          avatar_color: emp.avatarColor || null,
          x: emp.x !== undefined && emp.x !== null ? parseInt(emp.x, 10) : null,
          y: emp.y !== undefined && emp.y !== null ? parseInt(emp.y, 10) : null
        }));
        dbRows = await normalizePhotoRows(dbRows, row => row.person_id || row.id);
        const { error: upsertErr } = await supabase.from("employees").upsert(dbRows);
        if (upsertErr) throw upsertErr;
      }
    }

    // B. RESTORE POSITIONS
    if (Array.isArray(positions)) {
      // Delete existing
      await supabase.from("positions").delete().neq("id", 0);
      // Upsert historical
      if (positions.length > 0) {
        const dbRows = positions.map(pos => ({
          id: parseInt(pos.id, 10),
          title: pos.title || "",
          department: pos.department || "",
          manager_id: pos.managerId ? parseInt(pos.managerId, 10) : null,
          employee_id: pos.employeeId ? parseInt(pos.employeeId, 10) : null,
          x: pos.x !== undefined && pos.x !== null ? parseInt(pos.x, 10) : null,
          y: pos.y !== undefined && pos.y !== null ? parseInt(pos.y, 10) : null,
          notes: pos.notes || null
        }));
        const { error: upsertErr } = await supabase.from("positions").upsert(dbRows);
        if (upsertErr) throw upsertErr;
      }
    }

    // C. RESTORE ANNOTATIONS
    if (Array.isArray(annotations)) {
      await supabase
        .from("preferences")
        .upsert({
          key: "canvas_annotations",
          value: annotations,
          updated_at: new Date().toISOString()
        });
    }

    // D. WRITE NEW RESTORE AUDIT LOG ENTRY
    const formattedDate = new Date(targetLog.timestamp).toLocaleString("th-TH");
    const restoreSummary = `Restored org chart to version from ${formattedDate} (${targetLog.summary})`;
    
    // Add restore log to logs history
    const newLog = {
      id: `hist-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      action: "restore",
      summary: restoreSummary,
      timestamp: new Date().toISOString(),
      payload: targetLog.payload // Keep the backup payload here as well
    };
    logs.unshift(newLog);
    if (logs.length > 30) logs.pop();

    await supabase
      .from("preferences")
      .upsert({
        key: "audit_logs",
        value: logs,
        updated_at: new Date().toISOString()
      });

    response.status(200).json({ ok: true, restoredTimestamp: targetLog.timestamp });
  } catch (error) {
    console.error("Failed to restore history log:", error);
    response.status(500).json({ ok: false, error: "Failed to restore history log" });
  }
}

function readJsonBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";
    request.on("data", chunk => {
      body += chunk;
      if (body.length > MAX_BODY_SIZE) {
        reject(new Error("Request body too large"));
        request.destroy();
      }
    });
    request.on("end", () => {
      try {
        resolve(JSON.parse(body || "null"));
      } catch (error) {
        reject(error);
      }
    });
    request.on("error", reject);
  });
}
