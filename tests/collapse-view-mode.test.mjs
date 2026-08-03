import { readFileSync } from "node:fs";
import { test } from "node:test";
import assert from "node:assert/strict";

const appSource = readFileSync(new URL("../app.js", import.meta.url), "utf8");
await import("../hierarchy-utils.js");
await import("../position-lifecycle.js");

test("collapse controls are restricted to the Overall view", () => {
    assert.match(appSource, /function isOverallView\(\)\s*\{\s*return selectedDept === "All";/);
    assert.match(appSource, /if \(hasReports && isOverallView\(\)\) \{/);
    assert.match(appSource, /if \(selectedDept !== "All"\) return;/);
});

test("department views ignore saved collapsed nodes", () => {
    assert.match(appSource, /function getCollapsedHiddenPositionIds\(renderContext\)[\s\S]+if \(!isOverallView\(\)\) return hiddenIds;/);
    assert.match(appSource, /btnExpandAll\.disabled = !isOverallView\(\);/);
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
        /function toggleNode\(id\)[\s\S]*getCollapsedRealPositionIdsForDisplayId\(id\)[\s\S]*collapsedNodes\.delete/
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
        /getCollapsedRealPositionIdsForDisplayId\(managerId[\s\S]*collapsedNodes\.delete/
    );
});
