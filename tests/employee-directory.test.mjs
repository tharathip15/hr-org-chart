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
const styleSource = readFileSync(new URL("../style.css", import.meta.url), "utf8");

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
    const deleteEmployeeFunction = appSource.match(
        /async function deleteEmployee\(id\) \{[\s\S]*?\n\}/
    )?.[0];
    assert.ok(deleteEmployeeFunction);
    assert.match(deleteEmployeeFunction, /const linkedPositionIds = positions[\s\S]*?\.map\(position => position\.id\);/);
    assert.match(deleteEmployeeFunction, /linkedPositionIds\.forEach\(positionId => collapsedNodes\.delete\(positionId\)\);/);
    assert.match(deleteEmployeeFunction, /const employeesSnapshot = structuredClone\(employees\);/);
    assert.match(deleteEmployeeFunction, /const positionsSnapshot = structuredClone\(positions\);/);
    assert.match(deleteEmployeeFunction, /const collapsedNodesSnapshot = new Set\(collapsedNodes\);/);
    assert.match(deleteEmployeeFunction, /const \[employeesSaved, positionsSaved, preferencesSaved\] = await Promise\.all\(\[\s*saveSafely\(saveData\),\s*saveSafely\(savePositions\),\s*saveSafely\(savePreferences\)\s*\]\);/);
    assert.match(deleteEmployeeFunction, /if \(!employeesSaved \|\| !positionsSaved \|\| !preferencesSaved\)/);
    assert.match(deleteEmployeeFunction, /employees = employeesSnapshot;/);
    assert.match(deleteEmployeeFunction, /positions = positionsSnapshot;/);
    assert.match(deleteEmployeeFunction, /collapsedNodes = collapsedNodesSnapshot;/);
    assert.match(deleteEmployeeFunction, /return false;/);
    assert.doesNotMatch(appSource, /const parentManagerId = employeeToDelete\.managerId;/);
    assert.match(appSource, /Delete employee \"\$\{employeeToDelete\.name\}\"\? Assigned positions will remain vacant\./);

    const deleteDrawerHandler = appSource.match(
        /document\.getElementById\("btn-delete-employee"\)\.addEventListener\("click", \(\) => \{[\s\S]*?\n    \}\);/
    )?.[0];
    assert.ok(deleteDrawerHandler);
    assert.doesNotMatch(deleteDrawerHandler, /confirm\(/);
    assert.equal((deleteDrawerHandler.match(/deleteEmployee\(id\)/g) || []).length, 1);
    assert.match(deleteDrawerHandler, /deleteEmployee\(id\)\s*\.then\(/);
    assert.match(deleteDrawerHandler, /\.catch\(error => \{/);
});

test("deleting an employee clears collapse state for linked positions with different IDs", () => {
    const assignment = directory.getAssignmentSummary(7, [
        { id: 41, employeeId: 7 },
        { id: 42, employeeId: 8 }
    ]);

    assert.deepEqual(assignment.positionIds, [41]);
    assert.notEqual(assignment.positionIds[0], 7);
    assert.match(appSource, /linkedPositionIds\.forEach\(positionId => collapsedNodes\.delete\(positionId\)\);/);
});

test("save helpers report persistence failures and delete rolls back partial saves", () => {
    for (const functionName of ["saveData", "savePositions", "savePreferences"]) {
        const source = appSource.match(new RegExp(`async function ${functionName}\\(\\) \\{[\\s\\S]*?\\n\\}`))?.[0];
        assert.ok(source, `${functionName} source was found`);
        assert.match(source, /return true;/);
        assert.match(source, /return false;/);
    }

    const deleteEmployeeFunction = appSource.match(
        /async function deleteEmployee\(id\) \{[\s\S]*?\n\}/
    )?.[0];
    assert.match(deleteEmployeeFunction, /const saveSafely = async save => \{[\s\S]*?return false;/);
    assert.match(deleteEmployeeFunction, /await Promise\.allSettled\(/);
    assert.match(deleteEmployeeFunction, /renderAll\(\);[\s\S]*renderPositionsList\(\);[\s\S]*showNotification\("Could not delete employee; changes were restored\.", "error"\);/);
});

test("exposes Employee Management separately from Position Management", () => {
    assert.match(htmlSource, /id="btn-manage-employees"/);
    assert.match(htmlSource, /id="employee-management-modal"/);
    assert.match(htmlSource, /id="employee-search"/);
    assert.match(htmlSource, /id="employee-list"/);
    assert.match(appSource, /function openEmployeeManagementModal\(\)/);
    assert.match(appSource, /function renderEmployeeList\(/);
});

test("provides a separate, keyboard-accessible delete action for each employee row", () => {
    assert.match(appSource, /class="employee-row-shell"/);
    assert.match(appSource, /<button type="button" class="employee-row" data-employee-id="\$\{employee\.id\}">/);
    assert.match(appSource, /<button type="button" class="employee-row-delete" data-employee-id="\$\{employee\.id\}" aria-label="Delete \$\{escapeHTML\(employee\.name \|\| "Unnamed employee"\)\}">/);
    assert.match(appSource, /list\.querySelectorAll\("\.employee-row"\)\.forEach\(row => \{\s*row\.addEventListener\("click", \(\) => openEmployeeForm\(parseInt\(row\.dataset\.employeeId, 10\)\)\);/);

    const deleteRowHandler = appSource.match(
        /list\.querySelectorAll\("\.employee-row-delete"\)\.forEach\(button => \{[\s\S]*?\n    \}\);/
    )?.[0];
    assert.ok(deleteRowHandler);
    assert.match(deleteRowHandler, /event\.stopPropagation\(\);/);
    assert.equal((deleteRowHandler.match(/deleteEmployee\(parseInt\(button\.dataset\.employeeId, 10\)\)/g) || []).length, 1);
    assert.doesNotMatch(deleteRowHandler, /confirm\(/);
    assert.match(styleSource, /\.employee-row-shell\s*\{/);
    assert.match(styleSource, /\.employee-row-delete:focus-visible\s*\{/);
    assert.match(styleSource, /body\.role-viewer \.employee-row-delete\s*,/);
});

test("position assignment labels identify source and assignment state while preserving ID selection", () => {
    const labelFunction = appSource.match(/function getEmployeeOptionLabel\(employee\) \{[\s\S]*?\n\}/)?.[0];
    assert.ok(labelFunction);
    assert.match(labelFunction, /EmployeeDirectory\.getEmployeeSource\(employee\)/);
    assert.match(labelFunction, /EmployeeDirectory\.getAssignmentSummary\(employee\.id, positions\)/);
    assert.match(labelFunction, /Manual/);
    assert.match(labelFunction, /Microsoft/);
    assert.match(labelFunction, /#\$\{employee\.id\}/);
    assert.match(appSource, /const idMatch = trimmed\.match\(\/#\(\\d\+\)\/\);/);
});

test("viewer mode keeps employee browsing available but blocks employee mutations", () => {
    assert.match(styleSource, /body\.role-viewer #btn-new-employee\s*,/);
    assert.match(appSource, /function openEmployeeManagementModal\(\)/);
    assert.match(appSource, /function renderEmployeeList\(query = ""\)/);

    for (const functionName of ["openEmployeeForm", "handleFormSubmit", "deleteEmployee"]) {
        const source = appSource.match(new RegExp(`(?:async )?function ${functionName}\\([^)]*\\) \\{[\\s\\S]*?\\n\\}`))?.[0];
        assert.ok(source, `${functionName} source was found`);
        assert.match(source, /document\.body\.classList\.contains\("role-viewer"\)/);
    }
});

test("profile link copy describes reusing an employee profile", () => {
    assert.match(htmlSource, /Choose an existing employee profile to reuse their details/);
    assert.doesNotMatch(htmlSource, /Choose existing employee to link this position/);
});

test("employee editing no longer exposes a person-based Reports To control", () => {
    assert.doesNotMatch(htmlSource, /id="form-manager"/);
    assert.doesNotMatch(appSource, /const managerInputVal = document\.getElementById\("form-manager"\)/);
    assert.doesNotMatch(appSource, /employees\[empIndex\]\.managerId = managerId/);
});

test("employee detail reporting is derived from position hierarchy", () => {
    assert.match(appSource, /getPrimaryPositionForEmployee\(id\)/);
    assert.match(appSource, /primaryPosition\.managerId/);
    assert.match(appSource, /Reports To Position/);
});
