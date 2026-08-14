import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

process.env.SUPABASE_URL ||= "https://example.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY ||= "test-only-service-role-key";

const { default: preferences } = await import("../api/preferences.js");
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

test("browser preference persistence carries operation state through every recovery path", () => {
  assert.match(appSource, /let operationRootPositionId = null;/);
  assert.match(appSource, /let operationCollapsedNodesByScope = new Map\(\);/);
  assert.match(appSource, /function getOperationCollapseScopeKey\(\)/);
  assert.match(appSource, /function getActiveCollapsedNodes\(\)/);
  assert.match(appSource, /collapsedNodeIdsByScope/);
  assert.match(appSource, /operationRootPositionId/);

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

  const importHandler = appSource.slice(
    appSource.indexOf("async function handleImportFileChange"),
    appSource.indexOf("function getAutoPositionForNode")
  );
  assert.match(importHandler, /applyPreferences\(parsed\.preferences/);
  assert.match(appSource, /preferences: getPreferencesPayload\(\)/);
  assert.match(appSource, /localStorage\.setItem\("hr_org_preferences", JSON\.stringify\(preferences\)\)/);
  assert.match(appSource, /applyPreferences\(JSON\.parse\(saved\)\)/);
  assert.match(appSource, /restoreConfirmedMutationState\("preferences"\)/);
});
