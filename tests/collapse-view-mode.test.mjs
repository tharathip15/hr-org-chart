import { readFileSync } from "node:fs";
import { test } from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";

const appSource = readFileSync(new URL("../app.js", import.meta.url), "utf8");
await import("../hierarchy-utils.js");
await import("../position-lifecycle.js");

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

test("collapse controls are available in Overview and OPERATION only", () => {
    const cardImplementation = appSource.match(
        /function getPositionCardHTML\(position, renderContext = null\)\s*\{[\s\S]*?\n\}/
    )?.[0] || "";

    assert.match(appSource, /function isOverallView\(\)\s*\{\s*return ChartViewScope\.isOverview\(selectedDept\);/);
    assert.match(cardImplementation, /if \(hasReports && ChartViewScope\.supportsCollapse\(selectedDept\)\) \{/);
    assert.match(appSource, /if \(!ChartViewScope\.supportsCollapse\(selectedDept\)\) return;/);
});

test("department views ignore saved collapsed nodes", () => {
    assert.match(appSource, /function getCollapsedHiddenPositionIds\(renderContext\)[\s\S]+if \(!ChartViewScope\.supportsCollapse\(selectedDept\)\) return hiddenIds;/);
    assert.match(appSource, /btnExpandAll\.disabled = !ChartViewScope\.supportsCollapse\(selectedDept\);/);
    assert.match(appSource, /function selectDepartment\(dept\)[\s\S]+updateCollapseControls\(\);/);
});

test("Overview collapse follows the grouped display hierarchy", () => {
    const collapseImplementation = appSource.match(
        /function getCollapsedHiddenPositionIds\(renderContext\)\s*\{[\s\S]*?\n\}/
    )?.[0] || "";

    assert.match(collapseImplementation, /effectiveManagerByDisplayId/);
    assert.doesNotMatch(collapseImplementation, /modePositions\.forEach/);
    assert.doesNotMatch(collapseImplementation, /getVisibleReportingManagerId/);
});

test("grouped collapse state resolves real member IDs to the display card", () => {
    assert.match(
        appSource,
        /function getCollapsedRealPositionIdsForDisplayId\(positionId, renderContext[\s\S]*realToDisplayId/
    );
    assert.match(
        appSource,
        /function isDisplayPositionCollapsed\(positionId, renderContext[\s\S]*getCollapsedRealPositionIdsForDisplayId/
    );
    assert.match(
        appSource,
        /function toggleNode\(id\)[\s\S]*getCollapsedRealPositionIdsForDisplayId\(id\)[\s\S]*activeCollapsedNodes\.delete/
    );
});

test("collapsed configured primary stays mapped when lifecycle filtering changes the representative", () => {
    const allPositions = [
        { id: 75, employeeId: 75, managerId: 136, status: "future", effectiveDate: "2099-01-01", overviewGroupId: "overview-75", overviewGroupTitle: "Combined", overviewPrimaryPositionId: 75 },
        { id: 183, employeeId: 75, managerId: 136, status: "active", overviewGroupId: "overview-75", overviewGroupTitle: "Combined", overviewPrimaryPositionId: 75 }
    ];
    const currentPositions = PositionLifecycle.filterVisiblePositions(allPositions, "current", "2026-08-03");
    const model = OrgHierarchy.buildOverviewDisplayModel(
        allPositions,
        currentPositions,
        new Map([[183, 136]])
    );
    const collapsedRealIds = new Set([75]);
    const collapsedDisplayIds = new Set(
        [...collapsedRealIds].map(positionId => model.realToDisplayId.get(positionId) ?? positionId)
    );

    assert.deepEqual(currentPositions.map(position => position.id), [183]);
    assert.equal(model.displayPositions[0].id, 183);
    assert.equal(model.realToDisplayId.get(75), 183);
    assert.equal(collapsedDisplayIds.has(183), true);
});

test("employee focus clears every stored member ID for a collapsed display group", () => {
    const expandPathImplementation = appSource.match(
        /function expandPathToEmployee\(id\)\s*\{[\s\S]*?\n\}/
    )?.[0] || "";

    assert.match(appSource, /function getCollapsedRealPositionIdsForDisplayId\(/);
    assert.match(
        expandPathImplementation,
        /getCollapsedRealPositionIdsForDisplayId\(managerId[\s\S]*getActiveCollapsedNodes\(\)\.delete/
    );
});

test("collapsing a position in a visible cycle hides descendants without hiding the collapse origin", () => {
    const context = vm.createContext({
        ChartViewScope: { supportsCollapse: () => true },
        selectedDept: "__operation__",
        getActiveCollapsedNodes: () => new Set([1])
    });
    vm.runInContext(`
        ${extractFunction("getCollapsedHiddenPositionIds")}
        const renderContext = {
            displayPositionIds: new Set([1, 2, 3]),
            realToDisplayId: new Map([[1, 1], [2, 2], [3, 3]]),
            effectiveManagerByDisplayId: new Map([[1, 2], [2, 1], [3, 2]])
        };
        globalThis.hiddenIds = [...getCollapsedHiddenPositionIds(renderContext)].sort((a, b) => a - b);
    `, context);

    assert.deepEqual([...context.hiddenIds], [2, 3]);
});
