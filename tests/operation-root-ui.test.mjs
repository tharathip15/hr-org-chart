import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";

const appSource = readFileSync(new URL("../app.js", import.meta.url), "utf8");
const htmlSource = readFileSync(new URL("../index.html", import.meta.url), "utf8");

function extractFunction(name) {
  const marker = `${name.startsWith("async ") ? "async function" : "function"} ${name.replace("async ", "")}(`;
  const start = appSource.indexOf(marker);
  assert.notEqual(start, -1, `${name} must exist`);

  const bodyStart = appSource.indexOf("{", start);
  let depth = 0;
  for (let index = bodyStart; index < appSource.length; index += 1) {
    if (appSource[index] === "{") depth += 1;
    if (appSource[index] === "}") depth -= 1;
    if (depth === 0) return appSource.slice(start, index + 1);
  }
  throw new Error(`Could not extract ${name}`);
}

function createElements() {
  const elements = new Map();
  for (const id of [
    "position-form",
    "form-position-id",
    "form-position-status",
    "form-position-effective-date",
    "form-position-status-reason",
    "btn-delete-position",
    "btn-open-position-actions",
    "btn-set-operation-root",
    "operation-root-button-label",
    "form-position-title",
    "form-position-department",
    "form-position-layout",
    "form-position-notes",
    "form-position-manager",
    "form-position-employee",
    "position-department-list",
    "position-manager-list",
    "position-employee-list",
    "position-list-search-input",
    "positions-list",
    "positions-summary"
  ]) {
    elements.set(id, {
      disabled: false,
      innerHTML: "",
      innerText: "",
      value: "",
      textContent: "",
      title: "",
      attributes: new Map(),
      setAttribute(name, value) { this.attributes.set(name, String(value)); },
      reset() {},
      querySelectorAll() { return []; }
    });
  }
  return elements;
}

function createContext({ editor = true, saveResult = true, rootId = 1, locked = false } = {}) {
  const elements = createElements();
  const calls = { renderAll: 0, renderPositionsList: 0, resetPositionForm: [] };
  const notifications = [];
  const context = vm.createContext({
    positions: [
      { id: 1, title: "Chief Executive", department: "Executive", managerId: null, status: "active" },
      { id: 2, title: "Operations Director", department: "Operations", managerId: 1, status: "active" },
      { id: 3, title: "Operations Analyst", department: "Operations", managerId: 2, status: "active" }
    ],
    employees: [],
    chartMode: "current",
    isLayoutLocked: locked,
    operationRootPositionId: rootId,
    document: {
      body: { classList: { contains: () => !editor } },
      getElementById(id) { return elements.get(id); }
    },
    window: { confirm: () => true },
    confirm: () => true,
    canEditHr: () => editor,
    requireEditorAction: () => editor,
    isLayoutEditingBlocked: () => locked || !editor,
    savePreferences: async () => {
      if (!saveResult) context.operationRootPositionId = rootId;
      return saveResult;
    },
    showNotification: (...args) => notifications.push(args),
    renderAll: () => { calls.renderAll += 1; },
    renderPositionsList: () => { calls.renderPositionsList += 1; },
    resetPositionForm: id => { calls.resetPositionForm.push(id); },
    getPositionTitle: position => position.title,
    getPositionDepartment: position => position.department,
    getPositionOptionLabel: position => position.title,
    getEmployeeOptionLabel: employee => employee.name,
    getAssignedEmployee: () => null,
    isActingPosition: () => false,
    escapeHTML: value => value,
    PositionLifecycle: {
      normalizeStatus: status => status || "active",
      getStatusLabel: status => status || "Active",
      normalizeDate: value => value || ""
    },
    populatePositionFormLookups() {},
    updatePositionFormLifecycleGuidance() {},
    removeCollapsedPositionId() {},
    savePositions: async () => true,
    writeMutationBackup() {}
  });

  return { context, elements, calls, notifications };
}

test("Operation root form action is disabled for a new position and enabled for an editor-selected position", () => {
  const { context, elements } = createContext();
  vm.runInContext([
    extractFunction("updateOperationRootButtonState"),
    extractFunction("resetPositionForm")
  ].join("\n"), context);

  context.resetPositionForm();
  assert.equal(elements.get("btn-set-operation-root").disabled, true);
  assert.equal(elements.get("operation-root-button-label").textContent, "Set as Operation Root");

  context.resetPositionForm(2);
  assert.equal(elements.get("btn-set-operation-root").disabled, false);
  assert.equal(elements.get("operation-root-button-label").textContent, "Set as Operation Root");
  assert.equal(elements.get("btn-set-operation-root").title, "Set this position as the OPERATION root");
});

test("shared layout lock disables Operation root selection with an accessible explanation", () => {
  const { context, elements } = createContext({ locked: true });
  vm.runInContext([
    extractFunction("updateOperationRootButtonState"),
    extractFunction("resetPositionForm")
  ].join("\n"), context);

  context.resetPositionForm(2);

  assert.equal(elements.get("btn-set-operation-root").disabled, true);
  assert.equal(
    elements.get("btn-set-operation-root").title,
    "Unlock the shared layout to change the OPERATION root"
  );
  assert.equal(
    elements.get("btn-set-operation-root").attributes.get("aria-label"),
    "Unlock the shared layout to change the OPERATION root"
  );
});

test("Operation root button preserves its network icon while its label changes", () => {
  assert.match(
    htmlSource,
    /id="btn-set-operation-root"[^>]*>[\s\S]*?<i data-lucide="network"><\/i>[\s\S]*?<span id="operation-root-button-label">Set as Operation Root<\/span>/
  );
  const buttonStateSource = extractFunction("updateOperationRootButtonState");
  assert.match(buttonStateSource, /document\.getElementById\("operation-root-button-label"\)/);
  assert.match(buttonStateSource, /label\.textContent/);
  assert.doesNotMatch(buttonStateSource, /button\.textContent/);
});

test("Operation root form action is inert for a Viewer", async () => {
  const { context, calls } = createContext({ editor: false });
  vm.runInContext(extractFunction("async setOperationRootPosition"), context);

  assert.equal(await context.setOperationRootPosition(2), false);
  assert.equal(context.operationRootPositionId, 1);
  assert.equal(calls.renderAll, 0);
});

test("shared layout lock guards Operation root reconfiguration before confirmation or persistence", async () => {
  const { context, notifications } = createContext({ locked: true });
  let confirmations = 0;
  let saves = 0;
  context.window.confirm = () => { confirmations += 1; return true; };
  context.savePreferences = async () => { saves += 1; return true; };
  vm.runInContext(extractFunction("async setOperationRootPosition"), context);

  assert.equal(await context.setOperationRootPosition(2), false);
  assert.equal(context.operationRootPositionId, 1);
  assert.equal(confirmations, 0);
  assert.equal(saves, 0);
  assert.deepEqual(notifications, [[
    "Unlock the shared layout before changing the OPERATION root.",
    "error"
  ]]);
});

test("setting an Operation root confirms with the selected position name", async () => {
  const { context } = createContext();
  let confirmation = "";
  context.window.confirm = message => { confirmation = message; return false; };
  vm.runInContext(extractFunction("async setOperationRootPosition"), context);

  assert.equal(await context.setOperationRootPosition(2), false);
  assert.equal(confirmation, 'Set "Operations Director" as the OPERATION root?');
});

test("a persisted Operation root rerenders the sidebar, list, and chart", async () => {
  const { context, calls, notifications } = createContext();
  vm.runInContext(extractFunction("async setOperationRootPosition"), context);

  assert.equal(await context.setOperationRootPosition(2), true);
  assert.equal(context.operationRootPositionId, 2);
  assert.deepEqual(calls, { renderAll: 1, renderPositionsList: 1, resetPositionForm: [2] });
  assert.deepEqual(notifications, [["OPERATION now starts at Operations Director.", "success"]]);
});

test("a failed Operation root save restores the prior root", async () => {
  const { context, notifications } = createContext({ saveResult: false, rootId: 2 });
  vm.runInContext(extractFunction("async setOperationRootPosition"), context);

  const returned = await context.setOperationRootPosition(3);
  const result = {
    returned,
    rootAfterSave: context.operationRootPositionId,
    notifications: notifications.map(([message]) => message)
  };
  assert.deepEqual(result, {
    returned: false,
    rootAfterSave: 2,
    notifications: ["Could not change the OPERATION root; the previous root was restored."]
  });
});

test("a failed Operation root save restores the local preference fallback with unknown fields", async () => {
  const storage = new Map();
  const context = vm.createContext({
    positions: [
      { id: 2, title: "Operations Director" },
      { id: 3, title: "Operations Analyst" }
    ],
    operationRootPositionId: 2,
    preferencesSaveQueue: Promise.resolve(true),
    preferencesSaveSequence: 0,
    PREFERENCES_API_URL: "/api/preferences",
    requireEditorAction: () => true,
    isLayoutEditingBlocked: () => false,
    window: { confirm: () => true },
    getPositionTitle: position => position.title,
    renderAll() {},
    renderPositionsList() {},
    resetPositionForm() {},
    showNotification() {},
    localStorage: {
      setItem(key, value) { storage.set(key, value); },
      getItem(key) { return storage.get(key) || null; }
    },
    setSyncStatus() {},
    authenticatedFetch: async () => ({ ok: false, status: 503 }),
    confirmMutationState() {},
    restoreConfirmedMutationState() {
      context.operationRootPositionId = 2;
      context.localStorage.setItem("hr_org_preferences", JSON.stringify(context.getPreferencesPayload()));
      return true;
    },
    cloneMutationState: value => JSON.parse(JSON.stringify(value)),
    console: { warn() {}, error() {} }
  });
  context.getPreferencesPayload = () => ({
    dashboardDensity: "compact",
    featureFlags: { showVacancies: true },
    collapsedNodeIds: [7],
    collapsedNodeIdsByScope: { __operation_current__: [8] },
    layoutLocked: false,
    operationRootPositionId: context.operationRootPositionId
  });

  vm.runInContext([
    "const MUTATION_STORAGE_KEYS = { preferences: 'hr_org_preferences' };",
    extractFunction("getCurrentMutationState"),
    extractFunction("writeMutationBackup"),
    extractFunction("preferencesEqual"),
    extractFunction("canApplyPreferenceSave"),
    extractFunction("async persistPreferences"),
    extractFunction("queuePreferencesSave"),
    extractFunction("savePreferences"),
    extractFunction("async setOperationRootPosition")
  ].join("\n"), context);

  assert.equal(await context.setOperationRootPosition(3), false);
  const fallbackPreferences = JSON.parse(context.localStorage.getItem("hr_org_preferences"));
  assert.deepEqual(fallbackPreferences, {
    dashboardDensity: "compact",
    featureFlags: { showVacancies: true },
    collapsedNodeIds: [7],
    collapsedNodeIdsByScope: { __operation_current__: [8] },
    layoutLocked: false,
    operationRootPositionId: 2
  });
});

test("the Position Management list marks exactly one Operation root", () => {
  const { context, elements } = createContext();
  context.operationRootPositionId = 2;
  vm.runInContext(extractFunction("renderPositionsList"), context);
  context.renderPositionsList();

  assert.equal((elements.get("positions-list").innerHTML.match(/OPERATION ROOT/g) || []).length, 1);
});

test("deleting an Operation root reparents children without selecting a replacement root", async () => {
  const { context } = createContext();
  context.operationRootPositionId = 2;
  vm.runInContext(extractFunction("async deletePosition"), context);

  await context.deletePosition(2);

  assert.equal(context.operationRootPositionId, 2);
  assert.deepEqual(
    JSON.parse(JSON.stringify(context.positions)),
    [
      { id: 1, title: "Chief Executive", department: "Executive", managerId: null, status: "active" },
      { id: 3, title: "Operations Analyst", department: "Operations", managerId: 1, status: "active" }
    ]
  );
});
