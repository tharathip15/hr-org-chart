import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

await import("../employee-utils.js");
const directory = globalThis.EmployeeDirectory;

test("classifies local and Microsoft employee sources", () => {
    assert.equal(directory.getEmployeeSource({ personId: "manual-jane-12" }), "manual");
    assert.equal(directory.getEmployeeSource({ personId: "person-jane-12" }), "manual");
    assert.equal(directory.getEmployeeSource({ personId: "directory-id-12" }), "microsoft");
});

test("summarizes unassigned and multiple-position employees", () => {
    const positions = [
        { id: 10, employeeId: 4 },
        { id: 11, employeeId: 4 },
        { id: 12, employeeId: null }
    ];
    assert.deepEqual(directory.getAssignmentSummary(4, positions), {
        count: 2, positionIds: [10, 11], status: "assigned"
    });
    assert.deepEqual(directory.getAssignmentSummary(5, positions), {
        count: 0, positionIds: [], status: "unassigned"
    });
});

test("creates manual employees without a position link", () => {
    const employee = directory.createManualEmployee({
        id: 12, name: "Jane Doe", role: "Officer", department: "HR"
    });
    assert.equal(employee.personId, "manual-jane-doe-12");
    assert.equal(Object.hasOwn(employee, "positionId"), false);
});

test("detaches an employee while retaining every position", () => {
    const positions = [
        { id: 20, managerId: null, employeeId: 7, title: "Officer" },
        { id: 21, managerId: 20, employeeId: 7, title: "Acting Officer" }
    ];
    assert.deepEqual(directory.detachEmployeeFromPositions(7, positions), [
        { id: 20, managerId: null, employeeId: null, title: "Officer" },
        { id: 21, managerId: 20, employeeId: null, title: "Acting Officer" }
    ]);
});

const htmlSource = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const appSource = readFileSync(new URL("../app.js", import.meta.url), "utf8");

test("exposes Employee Management separately from Position Management", () => {
    assert.match(htmlSource, /id="btn-manage-employees"/);
    assert.match(htmlSource, /id="employee-management-modal"/);
    assert.match(htmlSource, /id="employee-search"/);
    assert.match(htmlSource, /id="employee-list"/);
    assert.match(appSource, /function openEmployeeManagementModal\(\)/);
    assert.match(appSource, /function renderEmployeeList\(/);
});

test("employee CRUD creates manual records without changing positions", () => {
    const submitHandler = appSource.match(
        /async function handleFormSubmit\(e\) \{[\s\S]*?\r?\n\}\r?\n\r?\nfunction deleteEmployee/
    )?.[0] || "";

    assert.match(appSource, /function getNextEmployeeId\(\) \{/);
    assert.match(submitHandler, /EmployeeDirectory\.createManualEmployee\(\{/);
    assert.match(submitHandler, /const newId = getNextEmployeeId\(\)/);
    assert.match(submitHandler, /id:\s*newId/);
    assert.match(submitHandler, /employees\.push\(newEmployee\)/);
    assert.match(submitHandler, /await saveData\(\)/);
    assert.doesNotMatch(submitHandler, /positions\.push\(/);
    assert.doesNotMatch(submitHandler, /savePositions\(\)/);
    assert.doesNotMatch(submitHandler, /syncAssignedPositionFromEmployee\(/);
});
