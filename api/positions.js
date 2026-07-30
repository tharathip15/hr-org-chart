import { supabase } from "./_helpers/supabase.js";
import { validateToken, requireEditor } from "./_helpers/auth.js";
import { createSnapshotAndLog } from "./_helpers/history_helper.js";
import { syncPositionRows } from "./_helpers/position_storage.js";

const MAX_BODY_SIZE = 8 * 1024 * 1024;

export default async function handler(request, response) {
  if (request.method !== "GET" && !validateToken(request)) {
    response.status(401).json({ ok: false, error: "Unauthorized" });
    return;
  }

  if (request.method === "GET") {
    await handleGet(response);
    return;
  }

  if (request.method === "PUT") {
    if (!requireEditor(request, response)) return;
    await handlePut(request, response);
    return;
  }

  response.setHeader("Allow", "GET, PUT");
  response.status(405).json({ ok: false, error: "Method not allowed" });
}

async function handleGet(response) {
  try {
    const { data, error } = await supabase
      .from("positions")
      .select("*")
      .order("id", { ascending: true });

    if (error) {
      if (isMissingTableError(error)) {
        response.setHeader("Cache-Control", "no-store");
        response.status(200).json([]);
        return;
      }
      throw error;
    }

    response.setHeader("Cache-Control", "no-store");
    response.status(200).json((data || []).map(mapDbToPosition));
  } catch (error) {
    console.error("Failed to load positions from Supabase:", error);
    response.status(500).json({
      ok: false,
      error: "Failed to load positions from database"
    });
  }
}

async function handlePut(request, response) {
  try {
    const body = await readJsonBody(request);

    if (!Array.isArray(body)) {
      response.status(400).json({ ok: false, error: "Expected a JSON array" });
      return;
    }

    await syncPositionRows(supabase, body.map(mapPositionToDb));

    // Write audit log with snapshot
    await createSnapshotAndLog("positions_update", `Updated positions (${body.length} items)`);

    response.status(200).json({ ok: true, count: body.length });
  } catch (error) {
    console.error("Failed to save positions to Supabase:", error);
    response.status(500).json({
      ok: false,
      error: "Failed to save positions to database"
    });
  }
}

function mapDbToPosition(row) {
  return {
    id: row.id,
    title: row.title,
    department: row.department,
    managerId: row.manager_id,
    employeeId: row.employee_id,
    x: row.x,
    y: row.y,
    notes: row.notes || ""
  };
}

function mapPositionToDb(position) {
  return {
    id: parseInt(position.id, 10),
    title: position.title || "",
    department: position.department || "",
    manager_id: position.managerId ? parseInt(position.managerId, 10) : null,
    employee_id: position.employeeId ? parseInt(position.employeeId, 10) : null,
    x: position.x !== undefined && position.x !== null ? parseInt(position.x, 10) : null,
    y: position.y !== undefined && position.y !== null ? parseInt(position.y, 10) : null,
    notes: position.notes || null
  };
}

function isMissingTableError(error) {
  const message = `${error?.message || ""} ${error?.details || ""}`.toLowerCase();
  return message.includes("schema cache") || message.includes("does not exist");
}

function readJsonBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";

    request.on("data", chunk => {
      body += chunk;
      if (body.length > MAX_BODY_SIZE) {
        reject(new Error("Request body is too large"));
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
