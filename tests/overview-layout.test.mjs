import { readFileSync } from "node:fs";
import { test } from "node:test";
import assert from "node:assert/strict";

const appSource = readFileSync(new URL("../app.js", import.meta.url), "utf8");
const cssSource = readFileSync(new URL("../style.css", import.meta.url), "utf8");

test("overall view uses a grouped overview renderer", () => {
    assert.match(appSource, /function renderOverview\(\)/);
    assert.match(appSource, /if \(selectedDept === "All"\) \{\s*treeContainer\.classList\.add\("overview-mode"\);\s*renderOverview\(\);\s*return;\s*\}/s);
});

test("overview keeps the original node-card format inside Front and Operation frames", () => {
    assert.match(appSource, /overview-front-frame/);
    assert.match(appSource, /overview-operation-frame/);
    assert.match(appSource, /buildOverviewFrame\("Front", "overview-front-frame"[\s\S]+buildOverviewFrame\("Operation", "overview-operation-frame"/);
    assert.match(appSource, /overview-direct-frame/);
    assert.match(appSource, /overview-special-frame/);
    assert.match(appSource, /buildOverviewNodeHTML/);
    assert.match(appSource, /node-card/);
    assert.doesNotMatch(appSource, /overview-person-card/);
});

test("overview frame styles are present without replacing card styling", () => {
    assert.match(cssSource, /\.tree-container\.overview-mode/);
    assert.match(cssSource, /\.overview-frame/);
    assert.match(cssSource, /\.overview-front-frame/);
    assert.match(cssSource, /\.overview-operation-frame/);
    assert.match(cssSource, /\.overview-direct-frame/);
    assert.match(cssSource, /\.overview-special-frame/);
    assert.doesNotMatch(cssSource, /\.overview-person-card/);
});
