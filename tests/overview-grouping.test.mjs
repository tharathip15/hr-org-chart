import { test } from "node:test";
import assert from "node:assert/strict";

await import("../hierarchy-utils.js");

const { groupPositionsForOverview, ungroupOverviewPositions } = globalThis.OrgHierarchy;

const sourcePositions = [
  { id: 75, title: "Logistics Manager", employeeId: 75, managerId: 136, department: "Logistics" },
  { id: 183, title: "Procurement Manager", employeeId: 75, managerId: 136, department: "Logistics" },
  { id: 184, title: "HR Manager", employeeId: 75, managerId: 140, department: "HR" }
];

test("groups only explicitly selected compatible positions for Overview", () => {
  const result = groupPositionsForOverview(sourcePositions, [75, 183], {
    title: "Logistics and Procurement Manager",
    primaryPositionId: 75
  });

  assert.equal(result.changed, true);
  const members = result.positions.filter(position => [75, 183].includes(position.id));
  assert.equal(new Set(members.map(position => position.overviewGroupId)).size, 1);
  assert.ok(members.every(position => position.overviewGroupTitle === "Logistics and Procurement Manager"));
  assert.ok(members.every(position => position.overviewPrimaryPositionId === 75));
  assert.equal(result.positions.find(position => position.id === 184).overviewGroupId, undefined);
});

test("rejects a presentation group with different employees or managers", () => {
  const differentEmployee = groupPositionsForOverview(
    [...sourcePositions, { id: 185, title: "Other", employeeId: 90, managerId: 136 }],
    [75, 185],
    { title: "Invalid", primaryPositionId: 75 }
  );
  assert.equal(differentEmployee.changed, false);
  assert.equal(differentEmployee.error, "different_employees");

  const differentManager = groupPositionsForOverview(sourcePositions, [75, 184], {
    title: "Invalid",
    primaryPositionId: 75
  });
  assert.equal(differentManager.changed, false);
  assert.equal(differentManager.error, "different_managers");
});

test("ungroup clears presentation metadata without deleting real positions", () => {
  const grouped = groupPositionsForOverview(sourcePositions, [75, 183], {
    title: "Logistics and Procurement Manager",
    primaryPositionId: 75
  });
  const result = ungroupOverviewPositions(grouped.positions, grouped.groupId);

  assert.equal(result.changed, true);
  assert.deepEqual(result.positions.map(position => position.id), [75, 183, 184]);
  assert.ok(result.positions.every(position => position.overviewGroupId === undefined));
});
