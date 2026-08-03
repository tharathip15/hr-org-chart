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

test("Overview collapses an explicit group and leaves unrelated same-person roles separate", () => {
  const all = [
    { id: 75, title: "Logistics Manager", employeeId: 75, managerId: 136, overviewGroupId: "overview-75", overviewGroupTitle: "Logistics and Procurement Manager", overviewPrimaryPositionId: 75 },
    { id: 183, title: "Procurement Manager", employeeId: 75, managerId: 136, overviewGroupId: "overview-75", overviewGroupTitle: "Logistics and Procurement Manager", overviewPrimaryPositionId: 75 },
    { id: 184, title: "HR Manager", employeeId: 75, managerId: 140 }
  ];
  const managers = new Map(all.map(position => [position.id, position.managerId]));
  const model = OrgHierarchy.buildOverviewDisplayModel(all, all, managers);

  assert.deepEqual(model.displayPositions.map(position => position.id), [75, 184]);
  assert.equal(model.displayPositions[0].displayTitle, "Logistics and Procurement Manager");
  assert.deepEqual(model.displayPositions[0].overviewGroupMemberIds, [75, 183]);
  assert.equal(model.realToDisplayId.get(183), 75);
});

test("children of every group member map to one display parent", () => {
  const all = [
    { id: 75, employeeId: 75, managerId: 136, overviewGroupId: "overview-75", overviewGroupTitle: "Combined", overviewPrimaryPositionId: 75 },
    { id: 183, employeeId: 75, managerId: 136, overviewGroupId: "overview-75", overviewGroupTitle: "Combined", overviewPrimaryPositionId: 75 },
    { id: 200, employeeId: 200, managerId: 75 },
    { id: 201, employeeId: 201, managerId: 183 }
  ];
  const managers = new Map(all.map(position => [position.id, position.managerId]));
  const model = OrgHierarchy.buildOverviewDisplayModel(all, all, managers);

  assert.equal(model.effectiveManagerByDisplayId.get(200), 75);
  assert.equal(model.effectiveManagerByDisplayId.get(201), 75);
  assert.equal([...model.effectiveManagerByDisplayId.values()].filter(id => id === 75).length, 2);
});

test("invalid explicit metadata fails open", () => {
  const invalid = [
    { id: 1, employeeId: 10, managerId: null, overviewGroupId: "g", overviewGroupTitle: "Bad", overviewPrimaryPositionId: 1 },
    { id: 2, employeeId: 11, managerId: null, overviewGroupId: "g", overviewGroupTitle: "Bad", overviewPrimaryPositionId: 1 }
  ];
  const model = OrgHierarchy.buildOverviewDisplayModel(invalid, invalid, new Map([[1, null], [2, null]]));
  assert.deepEqual(model.displayPositions.map(position => position.id), [1, 2]);
});

test("a group remains visible when its configured primary is filtered out", () => {
  const all = [
    { id: 75, employeeId: 75, managerId: 136, overviewGroupId: "overview-75", overviewGroupTitle: "Combined", overviewPrimaryPositionId: 75 },
    { id: 183, employeeId: 75, managerId: 136, overviewGroupId: "overview-75", overviewGroupTitle: "Combined", overviewPrimaryPositionId: 75 }
  ];
  const model = OrgHierarchy.buildOverviewDisplayModel(
    all,
    [all[1]],
    new Map([[183, 136]])
  );
  assert.equal(model.displayPositions.length, 1);
  assert.equal(model.displayPositions[0].id, 183);
  assert.equal(model.displayPositions[0].displayTitle, "Combined");
});
