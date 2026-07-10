import { test } from "node:test";
import assert from "node:assert/strict";

await import("../hierarchy-utils.js");

const {
    repairPositionHierarchy,
    repairEmployeeManagers,
    isPrimaryEmployeePosition
} = globalThis.OrgHierarchy || {};

test("repairs self-reporting and multi-position cycles without dropping positions", () => {
    assert.equal(typeof repairPositionHierarchy, "function");

    const source = [
        { id: 1, managerId: null },
        { id: 2, managerId: 2 },
        { id: 3, managerId: 4 },
        { id: 4, managerId: 3 },
        { id: 5, managerId: 999 }
    ];

    const result = repairPositionHierarchy(source);

    assert.equal(result.changed, true);
    assert.equal(result.positions.length, source.length);
    assert.equal(result.positions.find(position => position.id === 2).managerId, null);
    assert.equal(result.positions.find(position => position.id === 3).managerId, null);
    assert.equal(result.positions.find(position => position.id === 4).managerId, 3);
    assert.equal(result.positions.find(position => position.id === 5).managerId, null);
    assert.deepEqual(source.map(position => position.managerId), [null, 2, 4, 3, 999]);
});

test("repairs employee self-managers while preserving valid reporting lines", () => {
    assert.equal(typeof repairEmployeeManagers, "function");

    const result = repairEmployeeManagers([
        { id: 10, managerId: 10 },
        { id: 11, managerId: 10 },
        { id: 12, managerId: 999 }
    ]);

    assert.equal(result.changed, true);
    assert.deepEqual(result.employees.map(employee => employee.managerId), [null, 10, null]);
});

test("only the first assigned seat is the employee primary position", () => {
    assert.equal(typeof isPrimaryEmployeePosition, "function");

    const positions = [
        { id: 74, employeeId: 74 },
        { id: 102, employeeId: 74 }
    ];

    assert.equal(isPrimaryEmployeePosition(positions, 74, 74), true);
    assert.equal(isPrimaryEmployeePosition(positions, 102, 74), false);
});
