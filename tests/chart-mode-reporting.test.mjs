import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const appSource = readFileSync(new URL("../app.js", import.meta.url), "utf8");
await import("../hierarchy-utils.js");

test("hidden lifecycle managers promote visible reports to the nearest visible manager", () => {
    const positions = [
        { id: 1, managerId: null },
        { id: 2, managerId: 1 },
        { id: 3, managerId: 2 }
    ];
    const managers = OrgHierarchy.buildEffectiveManagerByRealId(positions, new Set([1, 3]));

    assert.equal(managers.get(2), 1);
    assert.equal(managers.get(3), 1);
    assert.match(appSource, /const overviewEffectiveManagerByRealId = OrgHierarchy\.buildEffectiveManagerByRealId/);
    assert.match(appSource, /const effectiveManagerByRealId = new Map\(realVisiblePositions\.map/);
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
