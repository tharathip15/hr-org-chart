import assert from "node:assert/strict";
import { test } from "node:test";

await import(new URL("../chart-view-scope.js", import.meta.url));
await import(new URL("../connection-routing.js", import.meta.url));

test("operation and overview views receive stable storage scope keys", () => {
  assert.equal(globalThis.ChartViewScope.OPERATION_VIEW_ID, "__operation__");
  assert.equal(globalThis.ChartViewScope.getStorageScopeKey("All", "future"), "__overview__");
  assert.equal(globalThis.ChartViewScope.getStorageScopeKey("Sales", "future"), "Sales");
  assert.equal(globalThis.ChartViewScope.getStorageScopeKey("__operation__", "current"), "__operation_current__");
  assert.equal(globalThis.ChartViewScope.getStorageScopeKey("__operation__", "future"), "__operation_future__");
});

test("operation view capabilities support collapsing and block structural actions", () => {
  assert.equal(globalThis.ChartViewScope.supportsCollapse("__operation__"), true);
  assert.equal(globalThis.ChartViewScope.blocksStructuralActions("__operation__"), true);
});

test("connection routing delegates operation scopes without changing department routes", () => {
  assert.equal(globalThis.ConnectionRouting.getScopeKey("__operation__", "future"), "__operation_future__");
  assert.equal(globalThis.ConnectionRouting.getScopeKey("Sales"), "Sales");
});
