import { supabase } from "./_helpers/supabase.js";
import { validateToken, requireEditor } from "./_helpers/auth.js";
import { createSnapshotAndLog } from "./_helpers/history_helper.js";

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
      .from("employees")
      .select("*")
      .order("id", { ascending: true });

    if (error) {
      throw error;
    }

    const employees = (data || []).map(mapDbToEmployee);
    response.setHeader("Cache-Control", "no-store");
    response.status(200).json(employees);
  } catch (error) {
    console.error("Failed to load employees from Supabase:", error);
    response.status(500).json({
      ok: false,
      error: "Failed to load employees from database"
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

    const payloadIds = body.map(emp => parseInt(emp.id, 10)).filter(Number.isInteger);

    // 1. Delete employees that are no longer in the payload
    if (payloadIds.length === 0) {
      const { error: deleteError } = await supabase
        .from("employees")
        .delete()
        .neq("id", 0);
      if (deleteError) throw deleteError;
    } else {
      const { error: deleteError } = await supabase
        .from("employees")
        .delete()
        .not("id", "in", `(${payloadIds.join(",")})`);
      if (deleteError) throw deleteError;
    }

    // 2. Upsert the current list of employees
    if (body.length > 0) {
      const dbRows = body.map(mapEmployeeToDb);
      const { error: upsertError } = await supabase
        .from("employees")
        .upsert(dbRows);
      
      if (upsertError) {
        // Fallback: if columns x or y are missing in database, retry upsert without coordinates
        const isMissingColumns = upsertError.message && (
          upsertError.message.includes("column") || 
          upsertError.message.includes("schema cache")
        );
        if (isMissingColumns) {
          console.warn("x/y columns missing in Supabase, retrying upsert without coordinates...");
          const fallbackRows = dbRows.map(row => {
            const copy = { ...row };
            delete copy.x;
            delete copy.y;
            return copy;
          });
          const { error: retryError } = await supabase
            .from("employees")
            .upsert(fallbackRows);
          if (retryError) throw retryError;
        } else {
          throw upsertError;
        }
      }
    }

    // Write audit log with snapshot
    await createSnapshotAndLog("employees_update", `Updated employees (${body.length} items)`);

    response.status(200).json({ ok: true, count: body.length });
  } catch (error) {
    console.error("Failed to save employees to Supabase:", error);
    response.status(500).json({
      ok: false,
      error: "Failed to save employees to database"
    });
  }
}

function mapDbToEmployee(row) {
  return {
    id: row.id,
    personId: row.person_id,
    name: row.name,
    role: row.role,
    department: row.department,
    managerId: row.manager_id,
    email: row.email,
    phone: row.phone,
    bio: row.bio,
    photoUrl: row.photo_url,
    avatarColor: row.avatar_color,
    x: row.x,
    y: row.y
  };
}

function mapEmployeeToDb(emp) {
  return {
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
  };
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
