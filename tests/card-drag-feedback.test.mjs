import { readFileSync } from "node:fs";
import { test } from "node:test";
import assert from "node:assert/strict";

const cssSource = readFileSync(new URL("../style.css", import.meta.url), "utf8");

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
