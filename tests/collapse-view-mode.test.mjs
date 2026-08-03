import { readFileSync } from "node:fs";
import { test } from "node:test";
import assert from "node:assert/strict";

const appSource = readFileSync(new URL("../app.js", import.meta.url), "utf8");

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
        /function isDisplayPositionCollapsed\(positionId, renderContext[\s\S]*realToDisplayId/
    );
    assert.match(
        appSource,
        /function toggleNode\(id\)[\s\S]*realToDisplayId[\s\S]*collapsedNodes\.delete/
    );
});
