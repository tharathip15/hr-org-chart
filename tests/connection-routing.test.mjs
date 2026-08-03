import assert from "node:assert/strict";
import { test } from "node:test";

await import(new URL("../connection-routing.js", import.meta.url)).catch(error => {
  if (error?.code !== "ERR_MODULE_NOT_FOUND") throw error;
});

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
