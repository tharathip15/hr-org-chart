import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import vm from "node:vm";

await import(new URL("../connection-routing.js", import.meta.url)).catch(error => {
  if (error?.code !== "ERR_MODULE_NOT_FOUND") throw error;
});

const appSource = readFileSync(new URL("../app.js", import.meta.url), "utf8");

function extractFunction(name) {
  const marker = `function ${name}(`;
  const functionStart = appSource.indexOf(marker);
  assert.notEqual(functionStart, -1, `${name} must exist`);
  const start = appSource.slice(Math.max(0, functionStart - 6), functionStart) === "async "
    ? functionStart - 6
    : functionStart;

  const bodyStart = appSource.indexOf("{", functionStart);
  let depth = 0;
  for (let index = bodyStart; index < appSource.length; index += 1) {
    if (appSource[index] === "{") depth += 1;
    if (appSource[index] === "}") depth -= 1;
    if (depth === 0) return appSource.slice(start, index + 1);
  }
  throw new Error(`Could not extract ${name}`);
}

function extractConnectionRouteDragFunctions() {
  return [
    "getCanvasPoint",
    "hasActiveConnectionRouteEdge",
    "clearActiveConnectionRouteDrag",
    "handleConnectionRoutePointerDown",
    "handleConnectionRoutePointerMove",
    "handleConnectionRoutePointerUp",
    "handleConnectionRoutePointerCancel",
  ].map(extractFunction).join("\n");
}

test("manual offsets separate one horizontal connection from the shared automatic bus", () => {
  assert.equal(typeof globalThis.ConnectionRouting?.calculateRoute, "function");
  const result = globalThis.ConnectionRouting.calculateRoute({
    parentRect: { x: 500, y: 100, width: 200, height: 80 },
    childRect: { x: 900, y: 400, width: 200, height: 80 },
    minChildY: 400,
    layoutStyle: "horizontal",
    parentId: 10,
    route: { parentId: 10, branchOffsetX: 120, laneOffsetY: -35 }
  });

  assert.deepEqual(result.branchHandle, { x: 720, y: 200 });
  assert.deepEqual(result.laneHandle, { x: 720, y: 255 });
  assert.equal(result.pathData, "M 600 180 L 600 200 L 720 200 L 720 255 L 1000 255 L 1000 400");
  assert.equal(result.automatic, false);
});

test("a stale parent route falls back to the automatic path", () => {
  const result = globalThis.ConnectionRouting.calculateRoute({
    parentRect: { x: 500, y: 100, width: 200, height: 80 },
    childRect: { x: 900, y: 400, width: 200, height: 80 },
    minChildY: 400,
    layoutStyle: "horizontal",
    parentId: 11,
    route: { parentId: 10, branchOffsetX: 120, laneOffsetY: -35 }
  });

  assert.equal(result.pathData, "M 600 180 L 600 200 L 600 200 L 600 290 L 1000 290 L 1000 400");
  assert.equal(result.automatic, true);
});

test("route scope updates do not mutate routes saved for another view", () => {
  const source = {
    __overview__: { parentId: 1, branchOffsetX: 40, laneOffsetY: 10 },
    Sales: { parentId: 1, branchOffsetX: -20, laneOffsetY: 30 }
  };
  const updated = globalThis.ConnectionRouting.setScopedRoute(source, "Sales", {
    parentId: 1,
    branchOffsetX: 90,
    laneOffsetY: -15
  });
  const cleared = globalThis.ConnectionRouting.clearScopedRoute(updated, "Sales");

  assert.deepEqual(source.Sales, { parentId: 1, branchOffsetX: -20, laneOffsetY: 30 });
  assert.deepEqual(updated.__overview__, source.__overview__);
  assert.equal(cleared.Sales, undefined);
  assert.deepEqual(cleared.__overview__, source.__overview__);
});

test("vertical routes end at the child left-center", () => {
  const result = globalThis.ConnectionRouting.calculateRoute({
    parentRect: { x: 100, y: 100, width: 200, height: 80 },
    childRect: { x: 500, y: 400, width: 200, height: 80 },
    minChildY: 400,
    layoutStyle: "vertical",
    parentId: 10,
    route: { parentId: 10, branchOffsetX: 30, laneOffsetY: -10 }
  });

  assert.deepEqual(result.points.at(-1), { x: 500, y: 440 });
  assert.deepEqual(result.branchHandle, { x: 430, y: 140 });
  assert.deepEqual(result.laneHandle, { x: 430, y: 430 });
  assert.equal(result.automatic, false);
});

test("normalization uses finite offsets clamped to plus or minus 4000", () => {
  assert.deepEqual(globalThis.ConnectionRouting.normalizeRoutes({
    Sales: { parentId: "10", branchOffsetX: Infinity, laneOffsetY: -5000 },
    Invalid: { parentId: "bad", branchOffsetX: 10, laneOffsetY: 10 },
    Engineering: { parentId: 11, branchOffsetX: 5000, laneOffsetY: "not-a-number" }
  }), {
    Sales: { parentId: 10, branchOffsetX: 0, laneOffsetY: -4000 },
    Engineering: { parentId: 11, branchOffsetX: 4000, laneOffsetY: 0 }
  });
});

test("All selects the overview scope", () => {
  assert.equal(globalThis.ConnectionRouting.getScopeKey("All"), "__overview__");
  assert.equal(globalThis.ConnectionRouting.getScopeKey(" Sales "), "Sales");
});

test("clearing a scope from positions preserves unrelated routes", () => {
  const positions = [{
    id: 1,
    connectionRoutes: {
      __overview__: { parentId: 1, branchOffsetX: 1, laneOffsetY: 2 },
      Sales: { parentId: 1, branchOffsetX: 3, laneOffsetY: 4 }
    }
  }];

  const cleared = globalThis.ConnectionRouting.clearScopeFromPositions(positions, "Sales");
  assert.deepEqual(cleared, [{
    id: 1,
    connectionRoutes: { __overview__: { parentId: 1, branchOffsetX: 1, laneOffsetY: 2 } }
  }]);
  assert.deepEqual(positions[0].connectionRoutes.Sales, { parentId: 1, branchOffsetX: 3, laneOffsetY: 4 });
});

test("editing capabilities distinguish selection from mutation while locked", () => {
  assert.deepEqual(
    globalThis.ConnectionRouting.getCapabilities({ canEdit: true, locked: true, presentation: false }),
    { selectable: true, draggable: false, resettable: false }
  );
  assert.deepEqual(
    globalThis.ConnectionRouting.getCapabilities({ canEdit: false, locked: false, presentation: false }),
    { selectable: false, draggable: false, resettable: false }
  );
  assert.deepEqual(
    globalThis.ConnectionRouting.getCapabilities({ canEdit: true, locked: false, presentation: true }),
    { selectable: false, draggable: false, resettable: false }
  );
});

test("branch and lane handles update only their own offset", () => {
  const baseRoute = { parentId: 10, branchOffsetX: 25, laneOffsetY: -15 };
  const branchDrag = globalThis.ConnectionRouting.beginDrag({
    kind: "branch", pointerId: 7, startPoint: { x: 100, y: 200 }, route: baseRoute
  });
  const laneDrag = globalThis.ConnectionRouting.beginDrag({
    kind: "lane", pointerId: 8, startPoint: { x: 100, y: 200 }, route: baseRoute
  });

  assert.deepEqual(globalThis.ConnectionRouting.updateDrag(branchDrag, { x: 160, y: 260 }), {
    parentId: 10, branchOffsetX: 85, laneOffsetY: -15
  });
  assert.deepEqual(globalThis.ConnectionRouting.updateDrag(laneDrag, { x: 160, y: 260 }), {
    parentId: 10, branchOffsetX: 25, laneOffsetY: 45
  });
});

test("beginDrag captures an immutable nested snapshot", () => {
  const startPoint = { x: 100, y: 200 };
  const route = { parentId: 10, branchOffsetX: 25, laneOffsetY: -15 };
  const dragState = globalThis.ConnectionRouting.beginDrag({
    kind: "branch", pointerId: 7, startPoint, route
  });

  startPoint.x = 900;
  route.branchOffsetX = 900;
  assert.throws(() => { dragState.startPoint.x = 900; }, TypeError);
  assert.throws(() => { dragState.route.branchOffsetX = 900; }, TypeError);
  assert.deepEqual(globalThis.ConnectionRouting.updateDrag(dragState, { x: 160, y: 260 }), {
    parentId: 10, branchOffsetX: 85, laneOffsetY: -15
  });
});

test("moving both cards keeps manual route offsets unchanged", () => {
  const input = {
    parentRect: { x: 100, y: 100, width: 200, height: 80 },
    childRect: { x: 500, y: 400, width: 200, height: 80 },
    minChildY: 400,
    layoutStyle: "horizontal",
    parentId: 10,
    route: { parentId: 10, branchOffsetX: 75, laneOffsetY: -25 }
  };
  const before = globalThis.ConnectionRouting.calculateRoute(input);
  const after = globalThis.ConnectionRouting.calculateRoute({
    ...input,
    parentRect: { ...input.parentRect, x: 220, y: 160 },
    childRect: { ...input.childRect, x: 620, y: 460 },
    minChildY: 460
  });

  assert.deepEqual(
    { x: after.branchHandle.x - before.branchHandle.x, y: after.branchHandle.y - before.branchHandle.y },
    { x: 120, y: 60 }
  );
});

test("reset all removes only the active scope from every position", () => {
  const result = globalThis.ConnectionRouting.clearScopeFromPositions([
    { id: 1, connectionRoutes: { __overview__: { parentId: 9, branchOffsetX: 10, laneOffsetY: 20 }, Sales: { parentId: 9, branchOffsetX: 30, laneOffsetY: 40 } } },
    { id: 2, connectionRoutes: { Sales: { parentId: 9, branchOffsetX: 50, laneOffsetY: 60 } } }
  ], "Sales");

  assert.deepEqual(result[0].connectionRoutes, { __overview__: { parentId: 9, branchOffsetX: 10, laneOffsetY: 20 } });
  assert.deepEqual(result[1].connectionRoutes, {});
});

test("dragging a route handle converts viewport coordinates and saves only on pointer-up", async () => {
  const events = [];
  const listeners = new Map();
  const handle = {
    dataset: { parentId: "1", childId: "2" },
    classList: { contains: value => value === "is-branch" },
    closest: selector => selector === ".connection-route-handle" ? handle : null,
    setPointerCapture: pointerId => events.push(["capture", pointerId]),
    releasePointerCapture: pointerId => events.push(["release", pointerId]),
  };
  const positions = [{
    id: 2,
    connectionRoutes: {
      __overview__: { parentId: 1, branchOffsetX: 5, laneOffsetY: 6 },
      Sales: { parentId: 1, branchOffsetX: 30, laneOffsetY: -10 },
    },
  }];
  const context = vm.createContext({
    ConnectionRouting: globalThis.ConnectionRouting,
    canvas: { getBoundingClientRect: () => ({ left: 20, top: 20 }) },
    currentScale: 2,
    selectedDept: "Sales",
    positions,
    activeConnectionRouteDrag: null,
    latestPositionsSavePromise: Promise.resolve(true),
    currentChartRenderContext: {
      displayPositionIds: new Set([2]),
      effectiveManagerByDisplayId: new Map([[2, 1]]),
    },
    getConnectionRouteCapabilities: () => ({ draggable: true }),
    getConnectionRouteStoragePosition: childId => positions.find(position => position.id === Number(childId)),
    requestConnectionDraw: () => events.push(["redraw"]),
    renderTree: () => events.push(["render"]),
    savePositions: async (...args) => {
      events.push(["save", args.length]);
      return true;
    },
    structuredClone,
    handle,
    window: {
      addEventListener: (type, listener) => listeners.set(type, listener),
      removeEventListener: type => listeners.delete(type),
    },
    events,
    listeners,
  });

  vm.runInContext(`${extractConnectionRouteDragFunctions()}\n    globalThis.runDrag = async () => {
      const down = {
        target: handle, pointerId: 7, clientX: 120, clientY: 220,
        preventDefault: () => events.push(["prevent"]),
        stopPropagation: () => events.push(["stop"]),
      };
      handleConnectionRoutePointerDown(down);
      handleConnectionRoutePointerMove({ pointerId: 7, clientX: 160, clientY: 260 });
      const beforeUp = { routes: structuredClone(positions[0].connectionRoutes), events: structuredClone(events) };
      await handleConnectionRoutePointerUp({ pointerId: 7 });
      return { beforeUp, routes: positions[0].connectionRoutes, events, listeners: [...listeners.keys()] };
    };`, context);

  const result = JSON.parse(JSON.stringify(await context.runDrag()));
  assert.deepEqual(result.beforeUp.routes.Sales, { parentId: 1, branchOffsetX: 50, laneOffsetY: -10 });
  assert.equal(result.beforeUp.events.some(([type]) => type === "save"), false);
  assert.deepEqual(result.routes.__overview__, { parentId: 1, branchOffsetX: 5, laneOffsetY: 6 });
  assert.deepEqual(result.events, [
    ["stop"], ["prevent"], ["capture", 7], ["redraw"], ["release", 7], ["save", 0], ["redraw"],
  ]);
  assert.deepEqual(result.listeners, []);
});

test("pointer cancel and disappearing edges restore the pre-drag route without saving", async (t) => {
  for (const cancelKind of ["pointercancel", "missing edge"]) {
    await t.test(cancelKind, () => {
      const events = [];
      const handle = {
        dataset: { parentId: "1", childId: "2" },
        classList: { contains: value => value === "is-lane" },
        closest: selector => selector === ".connection-route-handle" ? handle : null,
        setPointerCapture() {},
        releasePointerCapture() {},
      };
      const positions = [{
        id: 2,
        connectionRoutes: { Sales: { parentId: 1, branchOffsetX: 30, laneOffsetY: -10 } },
      }];
      const renderContext = {
        displayPositionIds: new Set([2]),
        effectiveManagerByDisplayId: new Map([[2, 1]]),
      };
      const context = vm.createContext({
        ConnectionRouting: globalThis.ConnectionRouting,
        canvas: { getBoundingClientRect: () => ({ left: 0, top: 0 }) },
        currentScale: 1,
        selectedDept: "Sales",
        positions,
        activeConnectionRouteDrag: null,
        latestPositionsSavePromise: Promise.resolve(true),
        currentChartRenderContext: renderContext,
        getConnectionRouteCapabilities: () => ({ draggable: true }),
        getConnectionRouteStoragePosition: () => positions[0],
        requestConnectionDraw: () => events.push("redraw"),
        renderTree() {},
        savePositions: async () => { events.push("save"); return true; },
        structuredClone,
        handle,
        events,
        window: { addEventListener() {}, removeEventListener() {} },
      });
      vm.runInContext(`${extractConnectionRouteDragFunctions()}\n        const event = { target: handle, pointerId: 4, clientX: 10, clientY: 20, preventDefault() {}, stopPropagation() {} };
        handleConnectionRoutePointerDown(event);
        handleConnectionRoutePointerMove({ pointerId: 4, clientX: 60, clientY: 80 });
        if (${JSON.stringify(cancelKind)} === "missing edge") {
          currentChartRenderContext.displayPositionIds.clear();
          handleConnectionRoutePointerMove({ pointerId: 4, clientX: 70, clientY: 90 });
        } else {
          handleConnectionRoutePointerCancel({ pointerId: 4 });
        }
        globalThis.result = { routes: positions[0].connectionRoutes, events };`, context);

      const result = JSON.parse(JSON.stringify(context.result));
      assert.deepEqual(result.routes, { Sales: { parentId: 1, branchOffsetX: 30, laneOffsetY: -10 } });
      assert.equal(result.events.includes("save"), false);
    });
  }
});

test("scoped resets persist candidates once and leave live positions unchanged on failure", async () => {
  const resetFunctions = ["resetSelectedConnectionRoute", "resetAllConnectionRoutes"].map(extractFunction).join("\n");
  const sourcePositions = [
    { id: 1, connectionRoutes: { Sales: { parentId: 9, branchOffsetX: 10, laneOffsetY: 20 } } },
    { id: 2, connectionRoutes: { __overview__: { parentId: 9, branchOffsetX: 5, laneOffsetY: 6 }, Sales: { parentId: 9, branchOffsetX: 30, laneOffsetY: 40 } } },
  ];
  const calls = [];
  const context = vm.createContext({
    ConnectionRouting: globalThis.ConnectionRouting,
    positions: structuredClone(sourcePositions),
    selectedConnection: { parentId: 9, childId: 2 },
    selectedDept: "Sales",
    isPresentationMode: false,
    latestPositionsSavePromise: Promise.resolve(true),
    requireEditorAction: () => { calls.push("require"); return true; },
    isLayoutEditingBlocked: () => false,
    getConnectionRouteCapabilities: () => ({ resettable: true }),
    savePositions: async candidate => { calls.push(structuredClone(candidate)); return false; },
    requestConnectionDraw: () => calls.push("redraw"),
    updateConnectionRouteToolbar: () => calls.push("toolbar"),
    window: { confirm: message => { calls.push(message); return true; } },
    structuredClone,
  });
  vm.runInContext(`${resetFunctions}\n    globalThis.runReset = async () => {
      const saved = await resetSelectedConnectionRoute();
      return { saved, positions };
    };`, context);

  const result = JSON.parse(JSON.stringify(await context.runReset()));
  assert.equal(result.saved, false);
  assert.deepEqual(result.positions, sourcePositions);
  assert.equal(calls.filter(Array.isArray).length, 1);
  assert.deepEqual(calls.find(Array.isArray)[1].connectionRoutes, {
    __overview__: { parentId: 9, branchOffsetX: 5, laneOffsetY: 6 },
  });
  assert.equal(calls.includes("redraw"), false);
  assert.equal(calls.includes("toolbar"), false);
});

test("reset all confirms the active scope and redraws only after a successful save", async () => {
  const resetFunctions = ["resetSelectedConnectionRoute", "resetAllConnectionRoutes"].map(extractFunction).join("\n");
  const calls = [];
  const context = vm.createContext({
    ConnectionRouting: globalThis.ConnectionRouting,
    positions: [{
      id: 1,
      connectionRoutes: {
        __overview__: { parentId: 9, branchOffsetX: 5, laneOffsetY: 6 },
        Sales: { parentId: 9, branchOffsetX: 30, laneOffsetY: 40 },
      },
    }],
    selectedConnection: null,
    selectedDept: "Sales",
    isPresentationMode: false,
    latestPositionsSavePromise: Promise.resolve(true),
    requireEditorAction: () => { calls.push("require"); return true; },
    isLayoutEditingBlocked: () => false,
    getConnectionRouteCapabilities: () => ({ resettable: true }),
    savePositions: async candidate => { calls.push(structuredClone(candidate)); context.positions = candidate; return true; },
    requestConnectionDraw: () => calls.push("redraw"),
    updateConnectionRouteToolbar: () => calls.push("toolbar"),
    window: { confirm: message => { calls.push(message); return true; } },
    structuredClone,
  });
  vm.runInContext(`${resetFunctions}\n    globalThis.runReset = async () => resetAllConnectionRoutes();`, context);

  assert.equal(await context.runReset(), true);
  assert.equal(calls.filter(Array.isArray).length, 1);
  assert.equal(calls.includes("Reset all customized connector lines in this view?"), true);
  assert.deepEqual(JSON.parse(JSON.stringify(context.positions[0].connectionRoutes)), {
    __overview__: { parentId: 9, branchOffsetX: 5, laneOffsetY: 6 },
  });
  assert.deepEqual(calls.slice(-2), ["redraw", "toolbar"]);
});
