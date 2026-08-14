import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import vm from "node:vm";

const appSource = readFileSync(new URL("../app.js", import.meta.url), "utf8");
const chartViewScopeSource = readFileSync(new URL("../chart-view-scope.js", import.meta.url), "utf8");

function extractFunction(name) {
  const marker = `function ${name}(`;
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

const positionFixture = {
  id: 3,
  x: 100,
  y: 200,
  isManual: true,
  manualLayouts: {
    Sales: { x: 300, y: 400 },
    __operation_current__: { x: 500, y: 600 },
    __operation_future__: { x: 700, y: 800 }
  },
  connectionRoutes: {
    __operation_current__: { parentId: 2, branchOffsetX: 20, laneOffsetY: 30 },
    __operation_future__: { parentId: 2, branchOffsetX: 40, laneOffsetY: 50 }
  }
};

test("OPERATION Current, Future, and Overview read independent manual coordinates", () => {
  const context = vm.createContext({ position: structuredClone(positionFixture) });
  vm.runInContext(`
    ${chartViewScopeSource}
    let selectedDept = ChartViewScope.OPERATION_VIEW_ID;
    let chartMode = "current";
    ${extractFunction("toNullableInteger")}
    ${extractFunction("isOverallView")}
    ${extractFunction("getActiveStorageScopeKey")}
    ${extractFunction("getManualPositionCoordinates")}
    globalThis.readCoordinates = (department, mode) => {
      selectedDept = department;
      chartMode = mode;
      return getManualPositionCoordinates(position);
    };
  `, context);

  assert.deepEqual(structuredClone(context.readCoordinates("__operation__", "current")), { x: 500, y: 600 });
  assert.deepEqual(structuredClone(context.readCoordinates("__operation__", "future")), { x: 700, y: 800 });
  assert.deepEqual(structuredClone(context.readCoordinates("All", "future")), { x: 100, y: 200 });
  assert.deepEqual(structuredClone(context.readCoordinates("Sales", "current")), { x: 300, y: 400 });
});

test("dragging OPERATION Current persists only its active manual-layout scope", () => {
  const context = vm.createContext({
    initialPosition: { ...structuredClone(positionFixture), renderX: 520, renderY: 620 },
    structuredClone
  });
  vm.runInContext(`
    ${chartViewScopeSource}
    let selectedDept = ChartViewScope.OPERATION_VIEW_ID;
    let chartMode = "current";
    let positions = [initialPosition];
    let dragDropCombineTargetId = null;
    let draggedId = 3;
    let draggedPositionIds = [3];
    let dragStartCoordinates = new Map([[3, { x: 500, y: 600 }]]);
    let activeDragCard = { classList: { remove() {} } };
    let dragPointerCaptured = false;
    let cardDragMoved = true;
    let suppressCardClickId = null;
    let dragStartClientX = 0;
    let dragStartClientY = 0;
    let latestPositionsSavePromise = Promise.resolve(true);
    const window = { removeEventListener() {} };
    const handleCardDragMove = () => {};
    const clearCombineDropZones = () => {};
    const clearAlignmentGuides = () => {};
    const isLayoutEditingBlocked = () => false;
    const savePositions = () => Promise.resolve(true);
    ${extractFunction("toNullableInteger")}
    ${extractFunction("normalizeManualLayouts")}
    ${extractFunction("isOverallView")}
    ${extractFunction("getActiveStorageScopeKey")}
    ${extractFunction("getRenderedPositionCoordinates")}
    ${extractFunction("handleCardDragEnd").replaceAll("handleCardDragEnd", "finishCardDrag")}
    finishCardDrag({ pointerId: 1 });
    globalThis.result = positions[0];
  `, context);

  const result = structuredClone(context.result);
  assert.deepEqual(result.manualLayouts.__operation_current__, { x: 520, y: 620 });
  assert.deepEqual(result.manualLayouts.__operation_future__, { x: 700, y: 800 });
  assert.deepEqual(result.manualLayouts.Sales, { x: 300, y: 400 });
  assert.equal(result.manualLayouts.__operation__, undefined);
  assert.deepEqual({ x: result.x, y: result.y }, { x: 100, y: 200 });
});

test("OPERATION Current and Future select independent connection routes", async () => {
  vm.runInThisContext(chartViewScopeSource);
  await import(new URL("../connection-routing.js", import.meta.url));

  const currentScope = ConnectionRouting.getScopeKey("__operation__", "current");
  const futureScope = ConnectionRouting.getScopeKey("__operation__", "future");

  assert.equal(currentScope, "__operation_current__");
  assert.equal(futureScope, "__operation_future__");
  assert.deepEqual(
    ConnectionRouting.getScopedRoute(positionFixture.connectionRoutes, currentScope, 2),
    { parentId: 2, branchOffsetX: 20, laneOffsetY: 30 }
  );
  assert.deepEqual(
    ConnectionRouting.getScopedRoute(positionFixture.connectionRoutes, futureScope, 2),
    { parentId: 2, branchOffsetX: 40, laneOffsetY: 50 }
  );
});

test("OPERATION annotations use the sentinel department and chart mode as separate filters", () => {
  const annotations = [
    { id: "current-operation", department: "__operation__", chartMode: "current" },
    { id: "future-operation", department: "__operation__", chartMode: "future" },
    { id: "current-sales", department: "Sales", chartMode: "current" }
  ];
  const context = vm.createContext({ annotations });
  vm.runInContext(`
    let selectedDept = "__operation__";
    let chartMode = "current";
    ${extractFunction("normalizeAnnotationChartMode")}
    ${extractFunction("getAnnotationChartMode")}
    ${extractFunction("getVisibleAnnotations")}
    globalThis.visibleIds = mode => {
      chartMode = mode;
      return getVisibleAnnotations().map(annotation => annotation.id);
    };
  `, context);

  assert.deepEqual(context.visibleIds("current"), ["current-operation"]);
  assert.deepEqual(context.visibleIds("future"), ["future-operation"]);
});

test("expanding OPERATION Current leaves Future and Overview collapse state unchanged", () => {
  const context = vm.createContext({});
  vm.runInContext(`
    ${chartViewScopeSource}
    let selectedDept = ChartViewScope.OPERATION_VIEW_ID;
    let chartMode = "current";
    let collapsedNodes = new Set([1]);
    let operationCollapsedNodesByScope = new Map([
      ["__operation_current__", new Set([2])],
      ["__operation_future__", new Set([3])]
    ]);
    let currentChartRenderContext = { realToDisplayId: new Map() };
    const savePreferences = () => Promise.resolve(true);
    const renderAll = () => {};
    const fitToScreen = () => {};
    ${extractFunction("getActiveStorageScopeKey")}
    ${extractFunction("getOperationCollapseScopeKey")}
    ${extractFunction("getActiveCollapsedNodes")}
    ${extractFunction("getCollapsedRealPositionIdsForDisplayId")}
    ${extractFunction("toggleNode")}
    toggleNode(2);
    globalThis.result = {
      overview: [...collapsedNodes],
      current: [...operationCollapsedNodesByScope.get("__operation_current__")],
      future: [...operationCollapsedNodesByScope.get("__operation_future__")]
    };
  `, context);

  assert.deepEqual(structuredClone(context.result), {
    overview: [1],
    current: [],
    future: [3]
  });
});

test("aggregate chart cards do not expose structural actions", () => {
  const context = vm.createContext({});
  vm.runInContext(`
    ${chartViewScopeSource}
    let selectedDept = "All";
    const canEditHr = () => true;
    ${extractFunction("chartStructuralActionsAllowed")}
    globalThis.allowedFor = department => {
      selectedDept = department;
      return chartStructuralActionsAllowed();
    };
  `, context);

  assert.equal(context.allowedFor("All"), false);
  assert.equal(context.allowedFor("__operation__"), false);
  assert.equal(context.allowedFor("Sales"), true);
});
