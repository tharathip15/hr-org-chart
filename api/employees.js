import { get, put } from "@vercel/blob";

const DATA_PATH = "employees.json";
const VERSION_PREFIX = "versions/employees";
const MAX_BODY_SIZE = 8 * 1024 * 1024;

export default async function handler(request, response) {
  if (request.method === "GET") {
    await handleGet(response);
    return;
  }

  if (request.method === "PUT") {
    await handlePut(request, response);
    return;
  }

  response.setHeader("Allow", "GET, PUT");
  response.status(405).json({ ok: false, error: "Method not allowed" });
}

async function handleGet(response) {
  try {
    const blob = await get(DATA_PATH, { access: "private" });

    if (!blob || blob.statusCode === 404) {
      response.status(200).json([]);
      return;
    }

    const text = await new Response(blob.stream).text();
    response.setHeader("Cache-Control", "no-store");
    response.status(200).json(JSON.parse(text));
  } catch (error) {
    if (isNotFound(error)) {
      response.status(200).json([]);
      return;
    }

    response.status(500).json({
      ok: false,
      error: "Failed to load employees from Blob storage"
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

    const payload = JSON.stringify(body);
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

    await put(DATA_PATH, payload, {
      access: "private",
      allowOverwrite: true,
      contentType: "application/json"
    });

    await put(`${VERSION_PREFIX}-${timestamp}.json`, payload, {
      access: "private",
      contentType: "application/json"
    });

    response.status(200).json({ ok: true, count: body.length });
  } catch (error) {
    response.status(500).json({
      ok: false,
      error: "Failed to save employees to Blob storage"
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

function isNotFound(error) {
  return error?.status === 404 || error?.statusCode === 404;
}
