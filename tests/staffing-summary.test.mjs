import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

await import("../employee-utils.js");
const directory = globalThis.EmployeeDirectory;

test("summarizes employees, positions, and sorted vacant positions", () => {
    assert.equal(typeof directory.getStaffingSummary, "function");

    const summary = directory.getStaffingSummary(
        [{ id: 7, name: "Filled" }],
        [
            { id: 12, employeeId: null, title: "Operator", department: "Zeta" },
            { id: 11, employeeId: 7, title: "Director", department: "Alpha" },
            { id: 13, employeeId: 999, title: "Analyst", department: "Alpha" }
        ]
    );

    assert.equal(summary.employeeCount, 1);
    assert.equal(summary.positionCount, 3);
    assert.equal(summary.vacantCount, 2);
    assert.deepEqual(summary.vacantPositions, [
        { id: 13, title: "Analyst", department: "Alpha" },
        { id: 12, title: "Operator", department: "Zeta" }
    ]);
});

test("returns zero counts and a stable empty list for missing collections", () => {
    assert.equal(typeof directory.getStaffingSummary, "function");

    const summary = directory.getStaffingSummary();
    assert.deepEqual(summary, {
        employeeCount: 0,
        positionCount: 0,
        vacantCount: 0,
        vacantPositions: []
    });
});

const appSource = readFileSync(new URL("../app.js", import.meta.url), "utf8");
const htmlSource = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const styleSource = readFileSync(new URL("../style.css", import.meta.url), "utf8");
