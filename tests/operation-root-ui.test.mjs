import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";

const appSource = readFileSync(new URL("../app.js", import.meta.url), "utf8");

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
      reset() {},
      querySelectorAll() { return []; }
    });
  }
  return elements;
}

function createContext({ editor = true, saveResult = true, rootId = 1 } = {}) {
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
    operationRootPositionId: rootId,
    document: {
      body: { classList: { contains: () => !editor } },
      getElementById(id) { return elements.get(id); }
    },
    window: { confirm: () => true },
    confirm: () => true,
    requireEditorAction: () => editor,
    savePreferences: async () => saveResult,
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
    savePositions: async () => true
  });

  return { context, elements, calls, notifications };
}

test("Operation root form action is disabled for a new position and enabled for an editor-selected position", () => {
  const { context, elements } = createContext();
  vm.runInContext(extractFunction("resetPositionForm"), context);

  context.resetPositionForm();
  assert.equal(elements.get("btn-set-operation-root").disabled, true);

  context.resetPositionForm(2);
  assert.equal(elements.get("btn-set-operation-root").disabled, false);
});

test("Operation root form action is inert for a Viewer", async () => {
  const { context, calls } = createContext({ editor: false });
  vm.runInContext(extractFunction("async setOperationRootPosition"), context);

  assert.equal(await context.setOperationRootPosition(2), false);
  assert.equal(context.operationRootPositionId, 1);
  assert.equal(calls.renderAll, 0);
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
