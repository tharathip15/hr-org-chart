import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

await import("../employee-utils.js");
const directory = globalThis.EmployeeDirectory;
const appSource = readFileSync(new URL("../app.js", import.meta.url), "utf8");
const htmlSource = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const styleSource = readFileSync(new URL("../style.css", import.meta.url), "utf8");

test("department counts follow planned positions instead of employee department labels", () => {
    assert.deepEqual(directory.getDepartmentCounts([
        { id: 1, department: "การตลาด", employeeId: null },
        { id: 2, department: "การตลาด", employeeId: 10 },
        { id: 3, department: "ฝ่ายขาย", employeeId: 11 }
    ]), {
        "การตลาด": 2,
        "ฝ่ายขาย": 1
    });
});

test("Acting statistic opens a report with position and employee details", () => {
    assert.match(htmlSource, /id="acting-positions-card"/);
    assert.match(htmlSource, /id="acting-report-modal"/);
    assert.match(htmlSource, /id="acting-report-list"/);
    assert.match(appSource, /function getActingPositions\(\)/);
    assert.match(appSource, /EmployeeDirectory\.isActingPosition\(position\)/);
    assert.match(appSource, /function renderActingReport\(\)/);
    assert.match(appSource, /getElementById\("acting-positions-card"\)\.addEventListener/);
    assert.match(appSource, /getElementById\("acting-report-list"\)/);
    assert.match(styleSource, /\.acting-report-card\s*\{/);
});
