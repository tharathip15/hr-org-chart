import { readFileSync } from "node:fs";
import { test } from "node:test";
import assert from "node:assert/strict";

const appSource = readFileSync(new URL("../app.js", import.meta.url), "utf8");

test("app supports free-form canvas coordinates calculation", () => {
    assert.match(appSource, /function calculateInitialCoordinates\(\)/);
    assert.match(appSource, /subtreeWidths\[empId\] = Math\.max\(260, width\)/);
});

test("app renders visible employees with absolute CSS positioning", () => {
    assert.match(appSource, /position: absolute; left: \$\{employee\.x\}px; top: \$\{employee\.y\}px;/);
});

test("app updates employee coordinates on drag move", () => {
    assert.match(appSource, /function handleCardDragMove\(e\)/);
    assert.match(appSource, /emp\.x = newX;/);
    assert.match(appSource, /emp\.y = newY;/);
});
