import { supabase } from "./_helpers/supabase.js";
import { requireEditorWithCsrf } from "./_helpers/session.js";

const MAX_BODY_SIZE = 256 * 1024;
const OPERATION_COLLAPSE_SCOPES = new Set([
  "__operation_current__",
  "__operation_future__"
]);
const KNOWN_PREFERENCE_KEYS = new Set([
  "collapsedNodeIds",
  "collapsedNodeIdsByScope",
  "layoutLocked",
  "operationRootPositionId"
]);

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
    const value = await readStoredPreferences();
    response.setHeader("Cache-Control", "no-store");
    response.status(200).json(normalizePreferences(value));
  } catch (error) {
    console.error("Failed to load preferences from Supabase:", error);
    response.status(500).json({
      ok: false,
      error: "Failed to load preferences from database"
    });
  }
}

async function handlePut(request, response) {
  try {
    const [storedValue, requestValue] = await Promise.all([
      readStoredPreferences(),
      readJsonBody(request)
    ]);
    const body = normalizePreferences({
      ...getPreferenceRecord(requestValue),
      ...getUnknownPreferenceFields(storedValue)
    });
    
    const { error } = await supabase
      .from("preferences")
      .upsert({
        key: "collapsed_nodes",
        value: body,
        updated_at: new Date().toISOString()
      });

    if (error) throw error;

    response.status(200).json({ ok: true });
  } catch (error) {
    console.error("Failed to save preferences to Supabase:", error);
    response.status(500).json({
      ok: false,
      error: "Failed to save preferences to database"
    });
  }
}

async function readStoredPreferences() {
  const { data, error } = await supabase
    .from("preferences")
    .select("value")
    .eq("key", "collapsed_nodes")
    .single();

  if (error) {
    if (error.code === "PGRST116") return null; // PostgREST code for "no rows returned"
    throw error;
  }
  return data?.value;
}

function normalizePreferences(value) {
  return {
    ...getUnknownPreferenceFields(value),
    collapsedNodeIds: normalizeIdList(value?.collapsedNodeIds),
    collapsedNodeIdsByScope: normalizeCollapsedNodeIdsByScope(value?.collapsedNodeIdsByScope),
    layoutLocked: value?.layoutLocked === true,
    operationRootPositionId: normalizePositionId(value?.operationRootPositionId)
  };
}

function getPreferenceRecord(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function getUnknownPreferenceFields(value) {
  return Object.fromEntries(Object.entries(getPreferenceRecord(value))
    .filter(([key]) => !KNOWN_PREFERENCE_KEYS.has(key)));
}

function normalizeIdList(value) {
  return [...new Set((Array.isArray(value) ? value : [])
    .map(id => parseInt(id, 10))
    .filter(Number.isInteger))].sort((a, b) => a - b);
}

function normalizeCollapsedNodeIdsByScope(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value).flatMap(([scope, ids]) =>
    OPERATION_COLLAPSE_SCOPES.has(scope) ? [[scope, normalizeIdList(ids)]] : []
  ));
}

function normalizePositionId(value) {
  if (value === null || value === undefined || value === "") return null;
  const id = Number(value);
  return Number.isInteger(id) ? id : null;
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
