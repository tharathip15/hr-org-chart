import { readFileSync } from "node:fs";
import { test } from "node:test";
import assert from "node:assert/strict";

const cssSource = readFileSync(new URL("../style.css", import.meta.url), "utf8");
const appSource = readFileSync(new URL("../app.js", import.meta.url), "utf8");
const htmlSource = readFileSync(new URL("../index.html", import.meta.url), "utf8");

function getRule(selector) {
    return cssSource.match(new RegExp(`${selector} \\{[\\s\\S]*?\\}`))?.[0] || "";
}

test("dragging a card does not change its visual position", () => {
    const hoverRule = getRule("\\.node-card:hover");
    const draggingRule = getRule("\\.node-card\\.dragging");

    assert.ok(hoverRule);
    assert.ok(draggingRule);
    assert.doesNotMatch(hoverRule, /transform:/);
    assert.match(draggingRule, /transform:\s*none;/);
    assert.match(draggingRule, /transition:\s*none;/);
});

test("dragging exposes stationary same-person combine drop zones", () => {
    assert.match(htmlSource, /id="combine-drop-zones-overlay"/);
    assert.match(appSource, /function renderCombineDropZones\(/);
    assert.match(appSource, /function clearCombineDropZones\(/);
    assert.match(appSource, /querySelectorAll\("\.combine-drop-zone"\)/);
    assert.match(appSource, /zone\.dataset\.positionId/);
    assert.match(cssSource, /\.combine-drop-zone\s*\{/);
});
