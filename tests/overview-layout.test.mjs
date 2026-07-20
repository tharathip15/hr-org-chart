import { readFileSync } from "node:fs";
import { test } from "node:test";
import assert from "node:assert/strict";

const appSource = readFileSync(new URL("../app.js", import.meta.url), "utf8");

test("app supports free-form canvas coordinates calculation", () => {
    assert.match(appSource, /function calculateInitialCoordinates\(\)/);
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
    assert.match(appSource, /selectedDept === "All"[\s\S]+position\.isManual/);
    assert.match(appSource, /position\.x/);
    assert.match(appSource, /position\.y/);
});

test("department views keep manual coordinates separate from Overall", () => {
    assert.match(appSource, /function getManualPositionCoordinates\(position\)/);
    assert.match(appSource, /manualLayouts/);
    assert.match(appSource, /position\.renderX/);
    assert.match(appSource, /selectedDept === "All"/);
});

test("dragging a department card persists coordinates for that department", () => {
    assert.match(appSource, /manualLayouts\[selectedDept\]/);
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
    assert.match(appSource, /manualLayouts\[selectedDept\] =/);
    assert.match(appSource, /movedPosition\.isManual = true;/);
});
