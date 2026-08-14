import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { Readable } from "node:stream";
import vm from "node:vm";
import test from "node:test";

process.env.SUPABASE_URL ||= "https://example.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY ||= "test-only-service-role-key";
process.env.HR_SESSION_SECRET ||= "operation-preferences-test-secret-123456";

const { default: preferences } = await import("../api/preferences.js");
const session = await import("../api/_helpers/session.js");
const appSource = readFileSync(new URL("../app.js", import.meta.url), "utf8");

function responseRecorder() {
  return {
    headers: {},
    statusCode: null,
    payload: undefined,
    setHeader(name, value) {
      this.headers[name.toLowerCase()] = value;
    },
    status(statusCode) {
      this.statusCode = statusCode;
      return this;
    },
    json(payload) {
      this.payload = payload;
      return this;
    }
  };
}

async function loadStoredPreferences(value) {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({ value }), {
    status: 200,
    headers: { "content-type": "application/json" }
  });

  try {
    const response = responseRecorder();
    await preferences({ method: "GET", headers: {} }, response);
    return response;
  } finally {
    globalThis.fetch = originalFetch;
  }
}

function jsonRequest(method, body, headers = {}) {
  const request = Readable.from([JSON.stringify(body)]);
  request.method = method;
  request.headers = headers;
  return request;
}

async function savePreferences(body, storedValue) {
  const originalFetch = globalThis.fetch;
  const requests = [];
  globalThis.fetch = async (input, init = {}) => {
    requests.push({ input: String(input), init });
    return new Response(JSON.stringify(
      requests.length === 1 ? { value: storedValue } : {}
    ), {
      status: 200,
      headers: { "content-type": "application/json" }
    });
  };

  const editor = session.createSession({
    oid: "11111111-1111-4111-8111-111111111111",
    tid: "22222222-2222-4222-8222-222222222222",
    roles: ["PFIG.HR.Admin"]
  });
  const response = responseRecorder();
  try {
    await preferences(jsonRequest("PUT", body, {
      cookie: `${session.SESSION_COOKIE_NAME}=${encodeURIComponent(editor.token)}`,
      "x-csrf-token": editor.payload.csrf
    }), response);
    return { response, requests };
  } finally {
    globalThis.fetch = originalFetch;
  }
}

function extractFunction(source, name, nextName) {
  const start = source.indexOf(`function ${name}`);
  const end = [
    source.indexOf(`function ${nextName}`, start),
    source.indexOf(`async function ${nextName}`, start)
  ].filter(index => index >= 0).sort((left, right) => left - right)[0];
  return source.slice(start, end);
}

function browserPreferenceRoundTrip(preferences) {
  const context = vm.createContext({
    positions: [{ id: 2 }, { id: 3 }, { id: 4 }, { id: 8 }],
    employees: [],
    collapsedNodes: new Set(),
    operationCollapsedNodesByScope: new Map(),
    operationRootPositionId: null,
    isLayoutLocked: false,
    OPERATION_COLLAPSE_SCOPE_KEYS: ["__operation_current__", "__operation_future__"],
    KNOWN_PREFERENCE_KEYS: new Set([
      "collapsedNodeIds",
      "collapsedNodeIdsByScope",
      "layoutLocked",
      "operationRootPositionId"
    ]),
    updateLayoutLockUI() {}
  });
  vm.runInContext([
    extractFunction(appSource, "getOperationCollapsedNodeIdsByScope", "sanitizeOperationRootPositionId"),
    extractFunction(appSource, "sanitizeOperationRootPositionId", "removeCollapsedPositionId"),
    extractFunction(appSource, "getAdditionalPreferences", "removeCollapsedPositionId"),
    extractFunction(appSource, "sanitizeCollapsedNodeIds", "applyPreferences"),
    extractFunction(appSource, "applyPreferences", "getPreferencesPayload"),
    extractFunction(appSource, "getPreferencesPayload", "loadPreferences"),
    "globalThis.roundTrip = preferences => { applyPreferences(preferences); return getPreferencesPayload(); };"
  ].join("\n"), context);
  return context.roundTrip(preferences);
}

test("normalizes persisted overview and operation preferences", async () => {
  const response = await loadStoredPreferences({
    collapsedNodeIds: [4, "2", 4],
    collapsedNodeIdsByScope: {
      __operation_current__: [3, "3"],
      __operation_future__: [8, 3, 8]
    },
    layoutLocked: true,
    operationRootPositionId: "2"
  });

  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.payload, {
    collapsedNodeIds: [2, 4],
    collapsedNodeIdsByScope: {
      __operation_current__: [3],
      __operation_future__: [3, 8]
    },
    layoutLocked: true,
    operationRootPositionId: 2
  });
});

test("rejects invalid operation preference values while preserving valid scopes", async () => {
  const response = await loadStoredPreferences({
    collapsedNodeIdsByScope: {
      __operation_current__: ["5", 5, "invalid"],
      Sales: [1, 2]
    },
    operationRootPositionId: "2.5"
  });

  assert.deepEqual(response.payload, {
    collapsedNodeIds: [],
    collapsedNodeIdsByScope: {
      __operation_current__: [5]
    },
    layoutLocked: false,
    operationRootPositionId: null
  });
});

test("retains unknown compatible preference fields on API reads and mutations", async () => {
  const storedValue = {
    collapsedNodeIds: [2],
    layoutLocked: false,
    dashboardDensity: "compact",
    featureFlags: { showVacancies: true }
  };
  const loaded = await loadStoredPreferences(storedValue);
  assert.deepEqual(loaded.payload, {
    collapsedNodeIds: [2],
    collapsedNodeIdsByScope: {},
    layoutLocked: false,
    operationRootPositionId: null,
    dashboardDensity: "compact",
    featureFlags: { showVacancies: true }
  });

  const { response, requests } = await savePreferences({
    collapsedNodeIds: [4],
    collapsedNodeIdsByScope: {},
    layoutLocked: true,
    operationRootPositionId: null
  }, storedValue);
  assert.equal(response.statusCode, 200);
  const persistedRequest = requests.find(request => request.init.body);
  const persisted = JSON.parse(persistedRequest.init.body);
  assert.deepEqual(persisted.value, {
    collapsedNodeIds: [4],
    collapsedNodeIdsByScope: {},
    layoutLocked: true,
    operationRootPositionId: null,
    dashboardDensity: "compact",
    featureFlags: { showVacancies: true }
  });
});

test("browser preference round trips unknown fields with recognized state", () => {
  assert.deepEqual(JSON.parse(JSON.stringify(browserPreferenceRoundTrip({
    collapsedNodeIds: [4, 2],
    collapsedNodeIdsByScope: { __operation_current__: [3] },
    layoutLocked: true,
    operationRootPositionId: 999,
    dashboardDensity: "compact",
    featureFlags: { showVacancies: true }
  }))), {
    collapsedNodeIds: [2, 4],
    collapsedNodeIdsByScope: {
      __operation_current__: [3],
      __operation_future__: []
    },
    layoutLocked: true,
    operationRootPositionId: 999,
    dashboardDensity: "compact",
    featureFlags: { showVacancies: true }
  });
});

test("browser preference persistence uses the complete payload at every bounded recovery path", () => {
  assert.match(appSource, /let operationRootPositionId = null;/);
  assert.match(appSource, /let operationCollapsedNodesByScope = new Map\(\);/);
  assert.match(appSource, /function getOperationCollapseScopeKey\(\)/);
  assert.match(appSource, /function getActiveCollapsedNodes\(\)/);
  const currentState = appSource.slice(
    appSource.indexOf("function getCurrentMutationState"),
    appSource.indexOf("function applyMutationState")
  );
  assert.match(currentState, /return getPreferencesPayload\(\)/);

  const preferencesPayload = appSource.slice(
    appSource.indexOf("function getPreferencesPayload"),
    appSource.indexOf("async function loadPreferences")
  );
  assert.match(preferencesPayload, /collapsedNodeIdsByScope/);
  assert.match(preferencesPayload, /operationRootPositionId/);

  const snapshotState = appSource.slice(
    appSource.indexOf("function captureMutationSnapshot"),
    appSource.indexOf("function restoreMutationSnapshot")
  );
  assert.match(snapshotState, /preferences: getPreferencesPayload\(\)/);

  const mutationApplication = appSource.slice(
    appSource.indexOf("function applyMutationState"),
    appSource.indexOf("function writeMutationBackup")
  );
  assert.match(mutationApplication, /applyPreferences\(restored\)/);
  const confirmedRestore = appSource.slice(
    appSource.indexOf("function restoreConfirmedMutationState"),
    appSource.indexOf("function captureMutationSnapshot")
  );
  assert.match(confirmedRestore, /applyMutationState\(collection, confirmedMutationState\.get\(collection\)\)/);

  const importHandler = appSource.slice(
    appSource.indexOf("async function handleImportFileChange"),
    appSource.indexOf("function getAutoPositionForNode")
  );
  assert.match(importHandler, /applyPreferences\(parsed\.preferences/);
  const exportHandler = appSource.slice(
    appSource.indexOf('document.getElementById("btn-export-data")'),
    appSource.indexOf('// Import Backup data trigger')
  );
  assert.match(exportHandler, /preferences: getPreferencesPayload\(\)/);
  const loadAndSave = appSource.slice(
    appSource.indexOf("async function loadPreferences"),
    appSource.indexOf("function normalizePersonKey")
  );
  assert.match(loadAndSave, /applyPreferences\(await response\.json\(\)\)/);
  assert.match(loadAndSave, /applyPreferences\(JSON\.parse\(saved\)\)/);
  assert.match(loadAndSave, /localStorage\.setItem\("hr_org_preferences", JSON\.stringify\(preferences\)\)/);
  assert.match(loadAndSave, /restoreConfirmedMutationState\("preferences"\)/);
});
