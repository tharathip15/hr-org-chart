import { readFileSync } from "node:fs";
import { test } from "node:test";
import assert from "node:assert/strict";

const appSource = readFileSync(new URL("../app.js", import.meta.url), "utf8");

test("app supports free-form canvas coordinates calculation", () => {
    assert.match(appSource, /function calculateInitialCoordinates\(\)/);
    assert.match(appSource, /subtreeWidths\[positionId\] = Math\.max\(/);
});

test("app renders visible positions with absolute CSS positioning", () => {
    assert.match(appSource, /position: absolute; left: \$\{position\.x\}px; top: \$\{position\.y\}px;/);
});

test("app updates position coordinates on drag move", () => {
    assert.match(appSource, /function handleCardDragMove\(e\)/);
    assert.match(appSource, /position\.x = snappedX;/);
    assert.match(appSource, /position\.y = snappedY;/);
});
