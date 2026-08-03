import { readFileSync } from "node:fs";
import { test } from "node:test";
import assert from "node:assert/strict";
import { runInNewContext } from "node:vm";

const cssSource = readFileSync(new URL("../style.css", import.meta.url), "utf8");
const appSource = readFileSync(new URL("../app.js", import.meta.url), "utf8");
const htmlSource = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const alignmentSource = readFileSync(new URL("../alignment-utils.js", import.meta.url), "utf8");

const alignmentSandbox = {};
runInNewContext(alignmentSource, alignmentSandbox);

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
    assert.match(htmlSource, /alignment-utils\.js\?v=2/);
    assert.match(appSource, /function renderCombineDropZones\(/);
    assert.match(appSource, /function clearCombineDropZones\(/);
    assert.match(appSource, /querySelectorAll\("\.combine-drop-zone"\)/);
    assert.match(appSource, /zone\.dataset\.positionId/);
    assert.match(cssSource, /\.combine-drop-zone\s*\{/);
});

test("an overlapping same-person card must leave its starting drop zone before combine activates", () => {
    const { getCombineDropDecision } = alignmentSandbox.AlignmentAssist;

    const startingOverlap = getCombineDropDecision({
        distance: 0,
        targetWidth: 36,
        targetHeight: 12,
        suppressed: true
    });
    assert.deepEqual(
        { active: startingOverlap.active, suppressed: startingOverlap.suppressed },
        { active: false, suppressed: true }
    );

    const movedAway = getCombineDropDecision({
        distance: 60,
        targetWidth: 36,
        targetHeight: 12,
        suppressed: startingOverlap.suppressed
    });
    assert.deepEqual(
        { active: movedAway.active, suppressed: movedAway.suppressed },
        { active: false, suppressed: false }
    );

    const intentionalReentry = getCombineDropDecision({
        distance: 10,
        targetWidth: 36,
        targetHeight: 12,
        suppressed: movedAway.suppressed
    });
    assert.deepEqual(
        { active: intentionalReentry.active, suppressed: intentionalReentry.suppressed },
        { active: true, suppressed: false }
    );

    assert.match(appSource, /let suppressedCombineDropTargetIds = new Set\(\);/);
    assert.match(appSource, /AlignmentAssist\.getCombineDropDecision\(/);
});
