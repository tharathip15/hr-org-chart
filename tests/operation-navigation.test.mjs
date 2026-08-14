import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import vm from "node:vm";

const appSource = readFileSync(new URL("../app.js", import.meta.url), "utf8");
const operationViewSource = readFileSync(new URL("../operation-view.js", import.meta.url), "utf8");
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
