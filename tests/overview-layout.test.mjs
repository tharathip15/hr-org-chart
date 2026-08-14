import { readFileSync } from "node:fs";
import { test } from "node:test";
import assert from "node:assert/strict";

const appSource = readFileSync(new URL("../app.js", import.meta.url), "utf8");

test("app supports free-form canvas coordinates calculation", () => {
    assert.match(appSource, /function calculateInitialCoordinates\(renderContext\)/);
});

test("Overview cards, layout, and connections consume one grouped render context", () => {
    assert.match(appSource, /function buildChartRenderContext\(\)/);
    assert.match(appSource, /OverviewGroupConsumer\.buildRenderModel\(/);
    assert.match(appSource, /calculateInitialCoordinates\(renderContext\)/);
    assert.match(appSource, /drawConnections\(renderContext = currentChartRenderContext\)/);
    assert.match(appSource, /effectiveManagerByDisplayId/);
    assert.match(appSource, /membersByDisplayId/);
});

test("department views use every real department position", () => {
    assert.match(appSource, /position\.department === selectedDept/);
});

test("sidebar statistics continue to count real positions", () => {
    assert.match(appSource, /EmployeeDirectory\.getStaffingSummary\(employees, positions\)/);
});

test("app renders visible positions with absolute CSS positioning", () => {
    assert.match(appSource, /position: absolute; left: \$\{x\}px; top: \$\{y\}px;/);
});

test("app updates position coordinates on drag move", () => {
    assert.match(appSource, /function handleCardDragMove\(e\)/);
    assert.match(appSource, /draggedPositionIds\.forEach\(positionId =>/);
    assert.match(appSource, /subtreePosition\.renderX = Math\.round\(start\.x \+ deltaX\);/);
    assert.match(appSource, /subtreePosition\.renderY = Math\.round\(start\.y \+ deltaY\);/);
});

test("manual position coordinates remain authoritative in Overall view", () => {
    assert.match(appSource, /function getManualPositionCoordinates\(position\)/);
    assert.match(appSource, /isOverallView\(\)[\s\S]+position\.isManual/);
    assert.match(appSource, /position\.x/);
    assert.match(appSource, /position\.y/);
});

test("department views keep manual coordinates separate from Overall", () => {
    assert.match(appSource, /function getManualPositionCoordinates\(position\)/);
    assert.match(appSource, /manualLayouts/);
    assert.match(appSource, /position\.renderX/);
    assert.match(appSource, /isOverallView\(\)/);
});

test("dragging a department card persists coordinates for that department", () => {
    assert.match(appSource, /manualLayouts\[getActiveStorageScopeKey\(\)\]/);
    assert.match(appSource, /draggedPositionIds\.forEach\(positionId =>/);
    assert.match(appSource, /subtreePosition\.renderX = Math\.round\(start\.x \+ deltaX\);/);
    assert.match(appSource, /subtreePosition\.renderY = Math\.round\(start\.y \+ deltaY\);/);
});

test("dragging a position captures its complete subtree", () => {
    assert.match(appSource, /OrgHierarchy\.getDescendantPositionIds\(positions, draggedId\)/);
    assert.match(appSource, /let draggedPositionIds = \[\];/);
    assert.match(appSource, /let dragStartCoordinates = new Map\(\);/);
    assert.match(appSource, /dragStartCoordinates\.set\(positionId/);
});

test("app delegates Overview membership and drag decisions to the executable consumer", () => {
    assert.match(appSource, /OverviewGroupConsumer\.buildRenderModel\(/);
    assert.match(appSource, /OverviewGroupConsumer\.getVisibleMembers\(/);
    assert.match(appSource, /OverviewGroupConsumer\.getProfileMembers\(/);
    assert.match(appSource, /OverviewGroupConsumer\.getGroupedDragPositionIds\(/);
});

test("Overview group drag gives hidden members representative-card start coordinates", () => {
    assert.match(appSource, /const displayPositionId = currentChartRenderContext\?\.realToDisplayId\.get\(positionId\) \?\? positionId;/);
    assert.match(appSource, /document\.querySelector\(`\.node-card\.absolute-card\[data-id="\$\{displayPositionId\}"\]`\)/);
    assert.match(appSource, /dragStartCoordinates\.set\(positionId, startCoordinates\)[\s\S]*draggedPositionIds\.forEach\(positionId =>[\s\S]*subtreePosition\.renderX = Math\.round\(start\.x \+ deltaX\);[\s\S]*movedPosition\.isManual = true;/);
});

test("dragging a subtree applies one snapped delta to every descendant", () => {
    assert.match(appSource, /const rootStart = dragStartCoordinates\.get\(draggedId\);/);
    assert.match(appSource, /const deltaX = snappedX - rootStart\.x;/);
    assert.match(appSource, /const deltaY = snappedY - rootStart\.y;/);
    assert.match(appSource, /draggedPositionIds\.forEach\(positionId =>/);
    assert.match(appSource, /subtreePosition\.renderX = Math\.round\(start\.x \+ deltaX\);/);
    assert.match(appSource, /subtreePosition\.renderY = Math\.round\(start\.y \+ deltaY\);/);
});

test("dragging persists the subtree in the active coordinate scope", () => {
    assert.match(appSource, /draggedPositionIds\.forEach\(positionId =>/);
    assert.match(appSource, /manualLayouts\[getActiveStorageScopeKey\(\)\] =/);
    assert.match(appSource, /movedPosition\.isManual = true;/);
});

test("dragging cards falls back to DOM coordinates without hijacking controls", () => {
    assert.match(appSource, /function getDragStartCoordinates\(position, card\)/);
    assert.match(appSource, /card\?\.style\?\.left/);
    assert.match(appSource, /card\?\.style\?\.top/);
    assert.match(appSource, /e\.target\.closest\("\.node-toggle-btn"\)/);
    assert.match(appSource, /window\.addEventListener\("pointercancel", handleCardDragEnd\)/);
});

test("auto arrange restores the latest saved layout", () => {
    assert.match(appSource, /async function restoreSavedLayout\(\)/);
    assert.match(appSource, /await latestPositionsSavePromise/);
    assert.match(appSource, /await loadPositions\(\);[\s\S]+renderTree\(\);/);
    assert.doesNotMatch(appSource, /position\.manualLayouts = \{\};/);
});

test("fit to screen keeps oversized charts inside the chart viewport edge", () => {
    assert.match(appSource, /const scaledContentWidth = bounds\.width \* nextScale;/);
    assert.match(appSource, /nextPanX = padding - bounds\.minX \* nextScale;/);
});

test("toggling a position refits the chart after visibility changes", () => {
    assert.match(appSource, /function toggleNode\(id\)[\s\S]+renderAll\(\);\s*fitToScreen\(\);/);
});
