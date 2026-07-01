import { get, put } from "@vercel/blob";

const DATA_PATH = "preferences.json";
const MAX_BODY_SIZE = 256 * 1024;

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
      response.status(200).json({ collapsedNodeIds: [] });
      return;
    }

    const text = await new Response(blob.stream).text();
    response.setHeader("Cache-Control", "no-store");
    response.status(200).json(normalizePreferences(JSON.parse(text)));
  } catch (error) {
    if (isNotFound(error)) {
      response.status(200).json({ collapsedNodeIds: [] });
      return;
    }

    response.status(500).json({
      ok: false,
      error: "Failed to load preferences from Blob storage"
    });
  }
}

async function handlePut(request, response) {
  try {
    const body = normalizePreferences(await readJsonBody(request));
    const payload = JSON.stringify(body);

    await put(DATA_PATH, payload, {
      access: "private",
      allowOverwrite: true,
      contentType: "application/json"
    });

    response.status(200).json({ ok: true });
  } catch (error) {
    response.status(500).json({
      ok: false,
      error: "Failed to save preferences to Blob storage"
    });
  }
}

function normalizePreferences(value) {
  const collapsedNodeIds = Array.isArray(value?.collapsedNodeIds)
    ? value.collapsedNodeIds
        .map(id => parseInt(id, 10))
        .filter(Number.isInteger)
    : [];

  return {
    collapsedNodeIds: [...new Set(collapsedNodeIds)].sort((a, b) => a - b)
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

function isNotFound(error) {
  return error?.status === 404 || error?.statusCode === 404;
}
