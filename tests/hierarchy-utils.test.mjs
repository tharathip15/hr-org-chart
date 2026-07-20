import { test } from "node:test";
import assert from "node:assert/strict";

await import("../hierarchy-utils.js");

const {
    repairPositionHierarchy,
    repairEmployeeManagers,
    isPrimaryEmployeePosition,
    getDescendantPositionIds
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

test("only the first assigned seat is primary when an employee holds three positions", () => {
    assert.equal(typeof isPrimaryEmployeePosition, "function");

    const positions = [
        { id: 74, employeeId: 74 },
        { id: 102, employeeId: 74 },
        { id: 103, employeeId: 74 }
    ];

    assert.equal(isPrimaryEmployeePosition(positions, 74, 74), true);
    assert.equal(isPrimaryEmployeePosition(positions, 102, 74), false);
    assert.equal(isPrimaryEmployeePosition(positions, 103, 74), false);
});

test("collects a position subtree without duplicates or cycle loops", () => {
    assert.equal(typeof getDescendantPositionIds, "function");

    const positions = [
        { id: 10, managerId: null },
        { id: 20, managerId: 10 },
        { id: 30, managerId: 20 },
        { id: 40, managerId: 10 },
        { id: 50, managerId: 40 },
        { id: 60, managerId: 50 },
        { id: 70, managerId: 70 },
        { id: 99, managerId: null }
    ];

    assert.deepEqual(getDescendantPositionIds(positions, 10), [10, 20, 30, 40, 50, 60]);
    assert.deepEqual(getDescendantPositionIds(positions, 70), [70]);
    assert.deepEqual(getDescendantPositionIds(positions, 999), []);
});

test("accepts top-level and unrelated position parents", () => {
    assert.equal(typeof OrgHierarchy.validatePositionParent, "function");

    const positions = [
        { id: 1, managerId: null },
        { id: 2, managerId: 1 },
        { id: 3, managerId: null }
    ];

    assert.deepEqual(OrgHierarchy.validatePositionParent(positions, 2, null), {
        valid: true,
        reason: null
    });
    assert.deepEqual(OrgHierarchy.validatePositionParent(positions, 2, 3), {
        valid: true,
        reason: null
    });
});

test("rejects self, descendant, and missing position parents", () => {
    const positions = [
        { id: 1, managerId: null },
        { id: 2, managerId: 1 },
        { id: 3, managerId: 2 }
    ];

    assert.deepEqual(OrgHierarchy.validatePositionParent(positions, 2, 2), {
        valid: false,
        reason: "self"
    });
    assert.deepEqual(OrgHierarchy.validatePositionParent(positions, 1, 3), {
        valid: false,
        reason: "descendant"
    });
    assert.deepEqual(OrgHierarchy.validatePositionParent(positions, 3, 999), {
        valid: false,
        reason: "missing"
    });
});
