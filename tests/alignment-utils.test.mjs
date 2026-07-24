import { readFileSync } from "node:fs";
import { test } from "node:test";
import assert from "node:assert/strict";

await import(new URL("../alignment-utils.js", import.meta.url));

test("alignment assist snaps matching card anchors", () => {
    const result = globalThis.AlignmentAssist.findSnap({
        bounds: { id: 1, x: 207, y: 97, width: 100, height: 80 },
        candidates: [{ id: 2, x: 200, y: 100, width: 100, height: 80 }]
    });

    assert.equal(result.x, 200);
    assert.equal(result.y, 100);
    assert.equal(result.guides.filter(guide => guide.kind === "alignment").length, 2);
});

test("alignment assist centers a card between two same-row cards for equal gaps", () => {
    const result = globalThis.AlignmentAssist.findSnap({
        bounds: { id: 2, x: 240, y: 120, width: 100, height: 80 },
        candidates: [
            { id: 1, x: 0, y: 120, width: 100, height: 80 },
            { id: 3, x: 500, y: 120, width: 100, height: 80 }
        ]
    });

    assert.equal(result.x, 250);
    assert.ok(result.equalGap);
    assert.equal(result.measurement.equal, true);
    assert.equal(result.measurement.left.gap, 150);
    assert.equal(result.measurement.right.gap, 150);
});

test("alignment assist provides a horizontal gap measurement without an equal-gap snap", () => {
    const measurement = globalThis.AlignmentAssist.getHorizontalMeasurement(
        { id: 2, x: 260, y: 120, width: 100, height: 80 },
        [
            { id: 1, x: 0, y: 120, width: 100, height: 80 },
            { id: 3, x: 520, y: 120, width: 100, height: 80 }
        ]
    );

    assert.equal(measurement.left.gap, 160);
    assert.equal(measurement.right.gap, 160);
    assert.equal(measurement.equal, true);
});

test("chart wires alignment guides into the drag workflow", () => {
    const appSource = readFileSync(new URL("../app.js", import.meta.url), "utf8");
    const htmlSource = readFileSync(new URL("../index.html", import.meta.url), "utf8");
    const cssSource = readFileSync(new URL("../style.css", import.meta.url), "utf8");

    assert.match(appSource, /const alignmentGuidesOverlay = document\.getElementById\("alignment-guides-overlay"\)/);
    assert.match(appSource, /AlignmentAssist\.findSnap/);
    assert.match(appSource, /renderAlignmentGuides\(snapResult\)/);
    assert.match(appSource, /clearAlignmentGuides\(\)/);
    assert.match(htmlSource, /id="alignment-guides-overlay"/);
    assert.match(htmlSource, /alignment-utils\.js\?v=1/);
    assert.match(cssSource, /\.alignment-guides-overlay/);
    assert.match(cssSource, /\.alignment-measure-line/);
});
