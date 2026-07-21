import { readFileSync } from "node:fs";
import { test } from "node:test";
import assert from "node:assert/strict";

const appSource = readFileSync(new URL("../app.js", import.meta.url), "utf8");

test("collapse controls are restricted to the Overall view", () => {
    assert.match(appSource, /function isOverallView\(\)\s*\{\s*return selectedDept === "All";/);
    assert.match(appSource, /if \(hasReports && isOverallView\(\)\) \{/);
    assert.match(appSource, /if \(selectedDept !== "All"\) return;/);
});

test("department views ignore saved collapsed nodes", () => {
    assert.match(appSource, /if \(isOverallView\(\)\) \{\s*collapsedNodes\.forEach\(id => markHidden\(id\)\);/);
    assert.match(appSource, /btnExpandAll\.disabled = !isOverallView\(\);/);
    assert.match(appSource, /function selectDepartment\(dept\)[\s\S]+updateCollapseControls\(\);/);
});
