import test from "node:test";
import assert from "node:assert/strict";

await import("../position-lifecycle.js");
const lifecycle = globalThis.PositionLifecycle;

test("normalizes lifecycle fields without changing position identity", () => {
    assert.equal(lifecycle.normalizeStatus("FUTURE"), "future");
    assert.equal(lifecycle.normalizeStatus("unknown"), "active");
    assert.equal(lifecycle.normalizeDate("2026-02-29"), "");
    assert.equal(lifecycle.normalizeDate("2026-07-21"), "2026-07-21");
});

test("active positions appear in current and future charts", () => {
    const position = { id: 1, status: "active" };
    assert.equal(lifecycle.isPositionVisible(position, "current", "2026-07-21"), true);
    assert.equal(lifecycle.isPositionVisible(position, "future", "2026-07-21"), true);
});

test("future positions appear in the current chart once effective", () => {
    const position = { id: 2, status: "future", effectiveDate: "2026-08-01" };
    assert.equal(lifecycle.isPositionVisible(position, "current", "2026-07-21"), false);
    assert.equal(lifecycle.isPositionVisible(position, "future", "2026-07-21"), true);
    assert.equal(lifecycle.isPositionVisible(position, "current", "2026-08-01"), true);
});

test("scheduled closures stay current until their effective date and remain in history", () => {
    const positions = [
        { id: 1, status: "active" },
        { id: 2, status: "closed", effectiveDate: "2026-08-01" },
        { id: 3, status: "closed", effectiveDate: "2026-07-01" }
    ];

    assert.deepEqual(
        lifecycle.filterVisiblePositions(positions, "current", "2026-07-21").map(position => position.id),
        [1, 2]
    );
    assert.deepEqual(
        lifecycle.filterVisiblePositions(positions, "future", "2026-07-21").map(position => position.id),
        [1]
    );
    assert.equal(positions.length, 3);
});

test("a position closed today is hidden from the current chart immediately", () => {
    const closedToday = { id: 4, status: "closed", effectiveDate: "2026-07-21" };

    assert.equal(lifecycle.isPositionVisible(closedToday, "current", "2026-07-21"), false);
    assert.equal(lifecycle.isPositionVisible(closedToday, "future", "2026-07-21"), false);
});

test("active children reconnect to the nearest visible manager when their direct manager is future", () => {
    const positions = [
        { id: 1, managerId: null, status: "active" },
        { id: 2, managerId: 1, status: "future", effectiveDate: "2026-08-01" },
        { id: 3, managerId: 2, status: "active" }
    ];
    const currentPositions = lifecycle.filterVisiblePositions(positions, "current", "2026-07-21");
    const currentIds = new Set(currentPositions.map(position => position.id));

    assert.deepEqual(currentPositions.map(position => position.id), [1, 3]);
    assert.equal(lifecycle.getNearestVisibleManagerId(positions[2], positions, currentIds), 1);
});

test("active children become roots when every manager above them is hidden", () => {
    const positions = [
        { id: 1, managerId: null, status: "future", effectiveDate: "2026-08-01" },
        { id: 2, managerId: 1, status: "active" }
    ];
    const currentIds = new Set([2]);

    assert.equal(lifecycle.getNearestVisibleManagerId(positions[1], positions, currentIds), null);
});
