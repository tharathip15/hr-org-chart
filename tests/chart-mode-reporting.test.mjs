import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const appSource = readFileSync(new URL("../app.js", import.meta.url), "utf8");

test("hidden lifecycle managers promote visible reports to the nearest visible manager", () => {
    assert.match(appSource, /function getVisibleReportingManagerId\(position, visiblePositionIds\)/);
    assert.match(appSource, /PositionLifecycle\.getNearestVisibleManagerId\(position, positions, visiblePositionIds\)/);
    assert.match(appSource, /const effectiveManagerByRealId = new Map\(realVisiblePositions\.map/);
    assert.match(appSource, /getVisibleReportingManagerId\(position, realVisibleIds, realPositionById\)/);
    assert.match(appSource, /renderContext\.effectiveManagerByDisplayId\.get\(positionId\)/);
    assert.match(appSource, /const parentCard = cardById\.get\(visibleManagerId\)/);
    assert.match(appSource, /path\.dataset\.parentId = String\(visibleManagerId\)/);
    assert.match(appSource, /path\.dataset\.childId = String\(positionId\)/);
    assert.match(appSource, /renderContext\.effectiveManagerByDisplayId\.get\(position\.id\)/);
});

test("a collapsed future manager cannot hide active descendants from the current chart", () => {
    assert.match(appSource, /function getCollapsedHiddenPositionIds\(renderContext\)/);
    assert.match(appSource, /renderContext\.effectiveManagerByDisplayId\.forEach/);
    assert.match(appSource, /const hiddenIds = getCollapsedHiddenPositionIds\(renderContext\)/);
});

test("annotations are scoped independently to current and future chart modes", () => {
    assert.match(appSource, /function normalizeAnnotationChartMode\(value\)/);
    assert.match(appSource, /getAnnotationChartMode\(annotation\) === chartMode/);
    assert.match(appSource, /department: selectedDept,\s*chartMode/g);
    assert.match(appSource, /const currentDeptsAnnots = getVisibleAnnotations\(\)/);
});
