import { supabase } from "./_helpers/supabase.js";
import { requireEditorWithCsrf } from "./_helpers/session.js";

const MAX_BODY_SIZE = 512 * 1024;

export default async function handler(request, response) {
  if (request.method === "GET") {
    await handleGet(response);
    return;
  }

  if (request.method === "PUT") {
    if (!requireEditorWithCsrf(request, response)) return;
    await handlePut(request, response);
    return;
  }

  response.setHeader("Allow", "GET, PUT");
  response.status(405).json({ ok: false, error: "Method not allowed" });
}

async function handleGet(response) {
  try {
    const { data, error } = await supabase
      .from("preferences")
      .select("value")
      .eq("key", "canvas_annotations")
      .single();

    if (error) {
      if (error.code === "PGRST116") { // no rows returned
        response.status(200).json([]);
        return;
      }
      throw error;
    }

    response.setHeader("Cache-Control", "no-store");
    response.status(200).json(data?.value || []);
  } catch (error) {
    console.error("Failed to load annotations from Supabase:", error);
    response.status(500).json({
      ok: false,
      error: "Failed to load annotations from database"
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
    
    const { error } = await supabase
      .from("preferences")
      .upsert({
        key: "canvas_annotations",
        value: body,
        updated_at: new Date().toISOString()
      });

    if (error) throw error;

    response.status(200).json({ ok: true });
  } catch (error) {
    console.error("Failed to save annotations to Supabase:", error);
    response.status(500).json({
      ok: false,
      error: "Failed to save annotations to database"
    });
  }
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
