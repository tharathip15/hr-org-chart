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

test("adds a manual employee at runtime without changing positions", () => {
    const employees = [
        { id: 4, name: "Existing Employee" },
        { id: 12, name: "Highest ID Employee" }
    ];
    const positions = [
        { id: 20, employeeId: 4, title: "Officer" },
        { id: 21, employeeId: null, title: "Manager" }
    ];
    const originalEmployees = structuredClone(employees);
    const originalPositions = structuredClone(positions);
    const result = directory.addManualEmployee(employees, positions, {
        name: "Jane Doe", role: "Officer", department: "HR"
    });

    assert.equal(result.employees.length, 3);
    assert.equal(result.employee.id, 13);
    assert.equal(typeof result.employee.id, "number");
    assert.equal(result.employee.personId, "manual-jane-doe-13");
    assert.deepEqual(employees, originalEmployees);
    assert.equal(result.positions, positions);
    assert.deepEqual(positions, originalPositions);
    assert.equal(positions.length, 2);
    assert.match(appSource, /EmployeeDirectory\.addManualEmployee\(/);
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

test("deleting an employee detaches assigned positions without changing position details", () => {
    const positions = [
        {
            id: 20,
            managerId: null,
            employeeId: 7,
            title: "Officer",
            department: "HR",
            layoutStyle: "vertical",
            notes: "Backfill planned"
        },
        {
            id: 21,
            managerId: 20,
            employeeId: 8,
            title: "Coordinator",
            department: "HR",
            layoutStyle: "horizontal",
            notes: "Keeps reporting line"
        }
    ];

    assert.deepEqual(directory.detachEmployeeFromPositions(7, positions), [
        { ...positions[0], employeeId: null },
        { ...positions[1] }
    ]);
    assert.match(appSource, /async function deleteEmployee\(id\)/);
    assert.match(appSource, /positions = EmployeeDirectory\.detachEmployeeFromPositions\(id, positions\);/);
    assert.match(appSource, /await saveData\(\);/);
    assert.match(appSource, /await savePositions\(\);/);
    assert.doesNotMatch(appSource, /const parentManagerId = employeeToDelete\.managerId;/);
});

test("exposes Employee Management separately from Position Management", () => {
    assert.match(htmlSource, /id="btn-manage-employees"/);
    assert.match(htmlSource, /id="employee-management-modal"/);
    assert.match(htmlSource, /id="employee-search"/);
    assert.match(htmlSource, /id="employee-list"/);
    assert.match(appSource, /function openEmployeeManagementModal\(\)/);
    assert.match(appSource, /function renderEmployeeList\(/);
});
