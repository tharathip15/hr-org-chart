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
    assert.equal(summary.actingCount, 0);
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
        actingCount: 0,
        vacantPositions: []
    });
});

test("counts only positions marked Acting in their notes", () => {
    const summary = directory.getStaffingSummary(
        [{ id: 7, name: "Shared employee" }],
        [
            { id: 12, employeeId: 7, title: "Primary", department: "Alpha", notes: "Regular assignment" },
            { id: 13, employeeId: 7, title: "Temporary lead", department: "Beta", notes: "ACTING until replacement starts" },
            { id: 14, employeeId: 7, title: "Interim manager", department: "Gamma", notes: '{"text":"รักษาการแทน"}' },
            { id: 15, employeeId: null, title: "Vacant", department: "Gamma", notes: "" }
        ]
    );

    assert.equal(summary.actingCount, 2);
    assert.equal(directory.isActingPosition({ notes: "Acting assignment" }), true);
    assert.equal(directory.isActingPosition({ notes: "Regular assignment" }), false);
});

const appSource = readFileSync(new URL("../app.js", import.meta.url), "utf8");
const htmlSource = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const styleSource = readFileSync(new URL("../style.css", import.meta.url), "utf8");

test("defines distinct sidebar statistics and an interactive vacancy card", () => {
    assert.match(htmlSource, /id="total-employees"/);
    assert.match(htmlSource, /id="total-positions"/);
    assert.match(htmlSource, /id="total-acting-positions"/);
    assert.match(htmlSource, /id="total-vacant-positions"/);
    assert.match(htmlSource, /<span class="stat-label">Acting<\/span>/);
    assert.match(htmlSource, /<span class="stat-label">Vacant<\/span>/);
    assert.doesNotMatch(htmlSource, /data-lucide="chevron-right"/);
    assert.match(htmlSource, /<button[^>]+id="vacant-positions-card"/);
    assert.match(htmlSource, /aria-controls="vacancy-report-modal"/);
    assert.match(htmlSource, /id="vacancy-report-modal"/);
    assert.match(htmlSource, /id="vacancy-report-modal-overlay"/);
    assert.match(htmlSource, /id="vacancy-report-list"/);
});

test("styles the vacancy statistic as an accessible interactive card", () => {
    assert.match(styleSource, /\.stat-card-action\s*\{/);
    assert.match(styleSource, /\.stat-card-action:focus-visible\s*\{/);
    assert.match(styleSource, /\.stat-card-vacant\s*\{[^}]*text-align:\s*center/);
    assert.doesNotMatch(styleSource, /\.stat-card-vacant\s*\{[^}]*grid-column/);
    assert.match(styleSource, /\.vacancy-report-list\s*\{/);
    assert.match(styleSource, /\.vacancy-report-empty\s*\{/);
});

test("wires sidebar counts and the vacancy report into the app", () => {
    assert.match(appSource, /EmployeeDirectory\.getStaffingSummary\(employees, positions\)/);
    assert.match(appSource, /total-acting-positions/);
    assert.match(appSource, /employees\.length/);
    assert.match(appSource, /getPositionDepartment\(position\)/);
    assert.match(appSource, /function renderVacancyReport\(\)/);
    assert.match(appSource, /function openVacancyReportModal\(\)/);
    assert.match(appSource, /function closeVacancyReportModal\(\)/);
    assert.match(appSource, /getElementById\("vacant-positions-card"\)/);
    assert.match(appSource, /getElementById\("close-vacancy-report-modal"\)/);
    assert.match(appSource, /getElementById\("vacancy-report-modal-overlay"\)/);
    assert.match(appSource, /event\.key === "Escape"/);
});

test("refreshes an open vacancy report from renderAll", () => {
    assert.match(appSource, /function renderAll\(\)[\s\S]*?vacancy-report-modal[\s\S]*?renderVacancyReport\(\)/);
});
