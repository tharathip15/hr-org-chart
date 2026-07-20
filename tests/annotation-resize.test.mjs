import { readFileSync } from "node:fs";
import { test } from "node:test";
import assert from "node:assert/strict";

const appSource = readFileSync(new URL("../app.js", import.meta.url), "utf8");
const cssSource = readFileSync(new URL("../style.css", import.meta.url), "utf8");

test("keeps the frame resize handle usable when the canvas is zoomed out", () => {
    assert.match(appSource, /canvas\.style\.setProperty\("--canvas-scale", currentScale\)/);
    assert.match(cssSource, /\.annotation-card \.annotation-resize-handle[\s\S]*?width:\s*24px;/);
    assert.match(cssSource, /\.annotation-card \.annotation-resize-handle[\s\S]*?height:\s*24px;/);
    assert.match(cssSource, /transform:\s*scale\(calc\(1 \/ var\(--canvas-scale, 1\)\)\)/);
});
