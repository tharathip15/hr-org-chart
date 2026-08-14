import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import vm from "node:vm";

const appSource = readFileSync(new URL("../app.js", import.meta.url), "utf8");
const operationViewSource = readFileSync(new URL("../operation-view.js", import.meta.url), "utf8");
const chartViewScopeSource = readFileSync(new URL("../chart-view-scope.js", import.meta.url), "utf8");

function extractFunction(name) {
  const marker = `function ${name}(`;
  let start = appSource.indexOf(marker);
  assert.notEqual(start, -1, `${name} must exist`);
  if (appSource.slice(Math.max(0, start - 6), start) === "async ") start -= 6;

  const bodyStart = appSource.indexOf("{", start);
  let depth = 0;
  for (let index = bodyStart; index < appSource.length; index += 1) {
    if (appSource[index] === "{") depth += 1;
    if (appSource[index] === "}") depth -= 1;
    if (depth === 0) return appSource.slice(start, index + 1);
  }
  throw new Error(`Could not extract ${name}`);
}

test("OPERATION is a dedicated navigation and render-context branch", () => {
  assert.match(appSource, /ChartViewScope\.OPERATION_VIEW_ID/);
  assert.match(appSource, /<span>OPERATION<\/span>/);
  assert.match(appSource, /Operation Organization/);
  assert.match(appSource, /OperationView\.buildSubtree\(positions, modePositions, operationRootPositionId\)/);
  assert.match(appSource, /OrgHierarchy\.buildEffectiveManagerByRealId\(positions, operationVisibleIds\)/);
  assert.match(appSource, /renderOperationEmptyState\(renderContext\.operationStatus/);
});

test("every active connector route uses the chart-mode-aware OPERATION scope", () => {
  assert.equal(
    (appSource.match(/ConnectionRouting\.getScopeKey\(\s*selectedDept,\s*typeof chartMode === "string" \? chartMode : "current"\s*\)/g) || []).length,
    4
  );
  assert.doesNotMatch(appSource, /ConnectionRouting\.getScopeKey\(selectedDept\)/);
});

test("sidebar orders Overall, OPERATION, then sorted departments and counts the visible Operation subtree", () => {
  const list = {
    innerHTML: "",
    querySelectorAll() {
      return [];
    }
  };
  const positions = [
    { id: 1, title: "CEO", managerId: null, department: "Executive" },
    { id: 2, title: "COO", managerId: 1, department: "Executive" },
    { id: 3, title: "Hidden Manager", managerId: 2, department: "Sales" },
    { id: 4, title: "Visible Officer", managerId: 3, department: "Sales" },
    { id: 5, title: "Accountant", managerId: 1, department: "Accounting" }
  ];
  const modePositions = positions.filter(position => position.id !== 3);
  const context = vm.createContext({
    positions,
    operationRootPositionId: 2,
    selectedDept: "All",
    document: {
      getElementById(id) {
        assert.equal(id, "sidebar-dept-list");
        return list;
      }
    },
    EmployeeDirectory: {
      getDepartmentCounts(items) {
        return items.reduce((counts, position) => ({
          ...counts,
          [position.department]: (counts[position.department] || 0) + 1
        }), {});
      }
    },
    getChartModePositions: () => modePositions,
    escapeHTML: value => value,
    selectDepartment() {}
  });

  vm.runInContext([
    chartViewScopeSource,
    operationViewSource,
    extractFunction("isOverallView"),
    extractFunction("isOperationView"),
    extractFunction("getOperationRenderState"),
    extractFunction("renderSidebarDeptList"),
    "renderSidebarDeptList();"
  ].join("\n"), context);

  const items = [...list.innerHTML.matchAll(
    /<li[^>]*data-dept="([^"]+)"[^>]*>\s*<span>([^<]+)<\/span>\s*<span class="department-count">(\d+)<\/span>/g
  )].map(match => ({ scope: match[1], label: match[2], count: Number(match[3]) }));

  assert.deepEqual(items, [
    { scope: "All", label: "Overall View", count: 4 },
    { scope: "__operation__", label: "OPERATION", count: 2 },
    { scope: "Accounting", label: "Accounting", count: 1 },
    { scope: "Executive", label: "Executive", count: 2 },
    { scope: "Sales", label: "Sales", count: 1 }
  ]);
});

test("Operation empty states explain unconfigured, missing, and hidden roots", () => {
  const treeContainer = { innerHTML: "" };
  const context = vm.createContext({
    treeContainer,
    chartMode: "current",
    canEditHr: () => false,
    escapeHTML: value => value,
    getPositionTitle: position => position.title,
    window: {}
  });
  vm.runInContext(`${extractFunction("renderOperationEmptyState")}\n` +
    "globalThis.renderEmpty = (status, root) => { renderOperationEmptyState(status, root); return treeContainer.innerHTML; };",
  context);

  assert.match(context.renderEmpty("unconfigured", null), /Operation root has not been configured/i);
  assert.match(context.renderEmpty("missing", null), /configured Operation root could not be found/i);
  assert.match(
    context.renderEmpty("hidden", { title: "Future Operations Director" }),
    /Future Operations Director[^]*not visible in the Current Chart/i
  );
});

test("only editors receive the Select Operation Root empty-state action", () => {
  function renderFor(canEdit) {
    const treeContainer = { innerHTML: "" };
    const context = vm.createContext({
      treeContainer,
      chartMode: "future",
      canEditHr: () => canEdit,
      escapeHTML: value => value,
      getPositionTitle: position => position.title,
      window: {}
    });
    vm.runInContext(`${extractFunction("renderOperationEmptyState")}\nrenderOperationEmptyState("unconfigured", null);`, context);
    return treeContainer.innerHTML;
  }

  const editorHtml = renderFor(true);
  assert.match(editorHtml, /Select Operation Root/);
  assert.match(editorHtml, /openPositionsModal\(\)/);
  assert.doesNotMatch(renderFor(false), /Select Operation Root/);
});

test("an editor receives one stable cycle warning until leaving OPERATION", () => {
  const notifications = [];
  const context = vm.createContext({
    notifications,
    ChartViewScope: { isOperation: value => value === "__operation__" },
    canEditHr: () => true,
    showNotification: (...args) => notifications.push(args)
  });
  vm.runInContext(`
    let selectedDept = "__operation__";
    let chartMode = "current";
    let operationRootPositionId = 99;
    let operationCycleWarningKey = null;
    ${extractFunction("isOperationView")}
    ${extractFunction("notifyOperationCycleWarning")}
    const renderContext = { operationCyclePositionIds: new Set([7, 3]) };
    notifyOperationCycleWarning(renderContext);
    notifyOperationCycleWarning(renderContext);
    selectedDept = "Sales";
    notifyOperationCycleWarning(renderContext);
    globalThis.clearedKey = operationCycleWarningKey;
    selectedDept = "__operation__";
    notifyOperationCycleWarning(renderContext);
  `, context);

  assert.equal(notifications.length, 2);
  assert.equal(context.clearedKey, null);
  assert.match(notifications[0][0], /#3, #7/);
  assert.equal(notifications[0][1], "error");
});

test("resolving a cycle clears its warning key so the same recurring cycle warns again", () => {
  const notifications = [];
  const context = vm.createContext({
    notifications,
    ChartViewScope: { isOperation: value => value === "__operation__" },
    canEditHr: () => true,
    showNotification: (...args) => notifications.push(args)
  });
  vm.runInContext(`
    let selectedDept = "__operation__";
    let chartMode = "current";
    let operationRootPositionId = 99;
    let operationCycleWarningKey = null;
    ${extractFunction("isOperationView")}
    ${extractFunction("notifyOperationCycleWarning")}
    const cycleContext = { operationCyclePositionIds: new Set([7, 3]) };
    notifyOperationCycleWarning(cycleContext);
    notifyOperationCycleWarning({ operationCyclePositionIds: new Set() });
    globalThis.clearedKey = operationCycleWarningKey;
    notifyOperationCycleWarning(cycleContext);
  `, context);

  assert.equal(context.clearedKey, null);
  assert.equal(notifications.length, 2);
});

test("Overall, OPERATION modes, and a department restore independent view state", () => {
  const annotations = [
    { id: "overall-current", department: "All", chartMode: "current" },
    { id: "operation-current", department: "__operation__", chartMode: "current" },
    { id: "operation-future", department: "__operation__", chartMode: "future" },
    { id: "sales-future", department: "Sales", chartMode: "future" }
  ];
  const context = vm.createContext({ annotations });
  vm.runInContext(`
    ${chartViewScopeSource}
    let selectedDept = "All";
    let chartMode = "current";
    let selectedAnnotationId = null;
    let collapsedNodes = new Set([1]);
    let operationCollapsedNodesByScope = new Map([
      ["__operation_current__", new Set([2])],
      ["__operation_future__", new Set([3])]
    ]);
    const clearConnectionRouteEditing = () => {};
    const updateChartModeControls = () => {};
    const renderSidebarDeptList = () => {};
    const updateCollapseControls = () => {};
    const renderTree = () => {};
    const renderAll = () => {};
    const fitToScreen = () => {};
    const closePositionLifecycleDrawer = () => {};
    const requestAnimationFrame = callback => callback();
    ${extractFunction("getActiveStorageScopeKey")}
    ${extractFunction("getOperationCollapseScopeKey")}
    ${extractFunction("getActiveCollapsedNodes")}
    ${extractFunction("normalizeAnnotationChartMode")}
    ${extractFunction("getAnnotationChartMode")}
    ${extractFunction("getVisibleAnnotations")}
    ${extractFunction("setSelectedDepartment")}
    ${extractFunction("selectDepartment")}
    ${extractFunction("setChartMode")}
    const snapshot = label => ({
      label,
      department: selectedDept,
      mode: chartMode,
      storageScope: getActiveStorageScopeKey(),
      collapsed: [...getActiveCollapsedNodes()],
      annotationIds: getVisibleAnnotations().map(annotation => annotation.id)
    });
    const states = [snapshot("Overall Current")];
    selectDepartment(ChartViewScope.OPERATION_VIEW_ID);
    states.push(snapshot("OPERATION Current"));
    setChartMode("future");
    states.push(snapshot("OPERATION Future"));
    selectDepartment("Sales");
    states.push(snapshot("Sales Future"));
    setChartMode("current");
    selectDepartment(ChartViewScope.OPERATION_VIEW_ID);
    states.push(snapshot("OPERATION Current restored"));
    globalThis.states = states;
  `, context);

  assert.deepEqual(JSON.parse(JSON.stringify(context.states)), [
    {
      label: "Overall Current",
      department: "All",
      mode: "current",
      storageScope: "__overview__",
      collapsed: [1],
      annotationIds: ["overall-current"]
    },
    {
      label: "OPERATION Current",
      department: "__operation__",
      mode: "current",
      storageScope: "__operation_current__",
      collapsed: [2],
      annotationIds: ["operation-current"]
    },
    {
      label: "OPERATION Future",
      department: "__operation__",
      mode: "future",
      storageScope: "__operation_future__",
      collapsed: [3],
      annotationIds: ["operation-future"]
    },
    {
      label: "Sales Future",
      department: "Sales",
      mode: "future",
      storageScope: "Sales",
      collapsed: [1],
      annotationIds: ["sales-future"]
    },
    {
      label: "OPERATION Current restored",
      department: "__operation__",
      mode: "current",
      storageScope: "__operation_current__",
      collapsed: [2],
      annotationIds: ["operation-current"]
    }
  ]);
});

test("changing the Operation root preserves layouts, routes, annotations, and collapse scopes", async () => {
  const positions = [
    {
      id: 2,
      title: "Old Operation Root",
      manualLayouts: {
        __operation_current__: { x: 100, y: 200 },
        __operation_future__: { x: 300, y: 400 }
      },
      connectionRoutes: {
        __operation_current__: { parentId: 1, laneOffsetY: 20 },
        __operation_future__: { parentId: 1, laneOffsetY: 40 }
      }
    },
    {
      id: 3,
      title: "New Operation Root",
      manualLayouts: { Sales: { x: 500, y: 600 } },
      connectionRoutes: { Sales: { parentId: 2, branchOffsetX: 30 } }
    }
  ];
  const annotations = [
    { id: "current-frame", department: "__operation__", chartMode: "current", x: 10, y: 20 },
    { id: "future-text", department: "__operation__", chartMode: "future", x: 30, y: 40 }
  ];
  const collapseScopes = new Map([
    ["__operation_current__", new Set([2])],
    ["__operation_future__", new Set([3])]
  ]);
  const before = {
    positions: structuredClone(positions),
    annotations: structuredClone(annotations),
    collapseScopes: [...collapseScopes].map(([scope, ids]) => [scope, [...ids]])
  };
  const context = vm.createContext({
    positions,
    annotations,
    operationCollapsedNodesByScope: collapseScopes,
    operationRootPositionId: 2,
    requireEditorAction: () => true,
    window: { confirm: () => true },
    getPositionTitle: position => position.title,
    savePreferences: async () => true,
    renderAll() {},
    renderPositionsList() {},
    resetPositionForm() {},
    showNotification() {},
    writeMutationBackup() {}
  });
  vm.runInContext(extractFunction("setOperationRootPosition"), context);

  assert.equal(await context.setOperationRootPosition(3), true);
  assert.equal(context.operationRootPositionId, 3);
  assert.deepEqual(JSON.parse(JSON.stringify(context.positions)), before.positions);
  assert.deepEqual(JSON.parse(JSON.stringify(context.annotations)), before.annotations);
  assert.deepEqual(
    [...context.operationCollapsedNodesByScope].map(([scope, ids]) => [scope, [...ids]]),
    before.collapseScopes
  );
});

test("anonymous startup renders a configured cross-department Operation subtree using reads only", async () => {
  const requests = [];
  const apiPayloads = {
    "/api/employees": [{
      id: 10,
      name: "Operations Lead",
      role: "Operations Lead",
      department: "Operations",
      managerId: null
    }],
    "/api/positions": [
      { id: 2, title: "Operations Lead", department: "Operations", managerId: null, employeeId: 10, status: "active" },
      { id: 3, title: "Finance Partner", department: "Finance", managerId: 2, employeeId: null, status: "active" },
      { id: 4, title: "Technology Partner", department: "Technology", managerId: 3, employeeId: null, status: "active" }
    ],
    "/api/preferences": {
      dashboardDensity: "compact",
      collapsedNodeIds: [],
      collapsedNodeIdsByScope: {
        __operation_current__: [3],
        __operation_future__: [4]
      },
      layoutLocked: false,
      operationRootPositionId: 2
    },
    "/api/annotations": []
  };
  const context = vm.createContext({
    employees: [],
    positions: [],
    annotations: [],
    authSession: null,
    positionsNeedEmployeeReconciliation: false,
    operationRootPositionId: null,
    collapsedNodes: new Set(),
    operationCollapsedNodesByScope: new Map(),
    additionalPreferences: {},
    isLayoutLocked: false,
    selectedDept: "All",
    chartMode: "current",
    selectedAnnotationId: null,
    EMPLOYEES_API_URL: "/api/employees",
    POSITIONS_API_URL: "/api/positions",
    PREFERENCES_API_URL: "/api/preferences",
    ANNOTATIONS_API_URL: "/api/annotations",
    OPERATION_COLLAPSE_SCOPE_KEYS: ["__operation_current__", "__operation_future__"],
    KNOWN_PREFERENCE_KEYS: new Set([
      "collapsedNodeIds",
      "collapsedNodeIdsByScope",
      "layoutLocked",
      "operationRootPositionId"
    ]),
    authenticatedFetch: async (url, options = {}) => {
      const method = options.method || "GET";
      requests.push({ url, method });
      if (method !== "GET") throw new Error(`Protected write attempted: ${method} ${url}`);
      return { ok: true, status: 200, json: async () => structuredClone(apiPayloads[url]) };
    },
    normalizeEmployeeProfiles: () => false,
    normalizePositionsList: value => structuredClone(value),
    OrgHierarchy: { repairPositionHierarchy: value => ({ positions: value, changed: false }) },
    PositionLifecycle: { normalizeStatus: value => value || "active" },
    PositionPersistence: { shouldPersistAutomaticRepair: () => false },
    recordConfirmedMutationState() {},
    updateLayoutLockUI() {},
    saveData: async () => { throw new Error("saveData must not run for an anonymous startup"); },
    savePositions: async () => { throw new Error("savePositions must not run for an anonymous startup"); },
    savePreferences: async () => { throw new Error("savePreferences must not run for an anonymous startup"); },
    saveAnnotations: async () => { throw new Error("saveAnnotations must not run for an anonymous startup"); },
    loadAnnotations: async () => {
      const response = await context.authenticatedFetch("/api/annotations");
      context.annotations = await response.json();
    },
    setLoaderProgress() {},
    setupEventListeners() {},
    renderAll() {},
    hideLoader() {},
    requestAnimationFrame: callback => callback(),
    fitToScreen() {},
    clearConnectionRouteEditing() {},
    updateChartModeControls() {},
    renderSidebarDeptList() {},
    updateCollapseControls() {},
    getChartModePositions: () => context.positions,
    renderTree() {
      context.renderedOperationState = context.getOperationRenderState(context.getChartModePositions());
    },
    localStorage: { setItem() {}, getItem() { return null; } },
    console: { log() {}, warn() {}, error() {} }
  });

  vm.runInContext([
    chartViewScopeSource,
    operationViewSource,
    extractFunction("getOperationCollapsedNodeIdsByScope"),
    extractFunction("sanitizeOperationRootPositionId"),
    extractFunction("getAdditionalPreferences"),
    extractFunction("sanitizeCollapsedNodeIds"),
    extractFunction("applyPreferences"),
    extractFunction("loadData"),
    extractFunction("reconcilePositionsWithEmployees"),
    extractFunction("loadPositions"),
    extractFunction("loadPreferences"),
    extractFunction("init"),
    extractFunction("isOperationView"),
    extractFunction("getOperationRenderState"),
    extractFunction("setSelectedDepartment"),
    extractFunction("selectDepartment")
  ].join("\n"), context);

  await context.init();
  context.selectDepartment("__operation__");

  const state = context.renderedOperationState;
  assert.equal(state.status, "ready");
  assert.equal(state.rootPosition.id, 2);
  assert.deepEqual([...state.visiblePositions].map(position => position.id), [2, 3, 4]);
  assert.deepEqual(requests, [
    { url: "/api/employees", method: "GET" },
    { url: "/api/positions", method: "GET" },
    { url: "/api/preferences", method: "GET" },
    { url: "/api/annotations", method: "GET" }
  ]);
});
