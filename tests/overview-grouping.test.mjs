import { test } from "node:test";
import assert from "node:assert/strict";

await import("../hierarchy-utils.js");

const { groupPositionsForOverview, ungroupOverviewPositions, getOverviewDragPositionIds } = globalThis.OrgHierarchy;

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

test("all real group members map to the visible representative when the configured primary is filtered out", () => {
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
  assert.equal(model.realToDisplayId.get(75), 183);
  assert.equal(model.realToDisplayId.get(183), 183);
});

test("group drag includes every member and descendant exactly once", () => {
  const positions = [
    { id: 75, managerId: 136 },
    { id: 183, managerId: 136 },
    { id: 200, managerId: 75 },
    { id: 201, managerId: 183 },
    { id: 202, managerId: 200 }
  ];
  const ids = getOverviewDragPositionIds(positions, 75, [75, 183]);
  assert.deepEqual(ids.sort((a, b) => a - b), [75, 183, 200, 201, 202]);
});

test("Overview effective managers resolve every real position against mode-visible IDs", () => {
  assert.equal(typeof OrgHierarchy.buildEffectiveManagerByRealId, "function");
  const all = [
    { id: 1, managerId: null, department: "Executive" },
    { id: 2, managerId: 1, department: "Logistics", status: "future" },
    { id: 3, managerId: 2, employeeId: 75, department: "Logistics" },
    { id: 4, managerId: 1, employeeId: 75, department: "Procurement" },
    { id: 5, managerId: 2, employeeId: 75, department: "Planning", status: "future" }
  ];

  const managers = OrgHierarchy.buildEffectiveManagerByRealId(all, new Set([1, 3, 4]));

  assert.equal(managers.size, 5);
  assert.equal(managers.get(1), null);
  assert.equal(managers.get(2), 1);
  assert.equal(managers.get(3), 1);
  assert.equal(managers.get(4), 1);
  assert.equal(managers.get(5), 1);
});

test("group mutation and compatible-position discovery share effective managers across departments", () => {
  assert.equal(typeof OrgHierarchy.buildEffectiveManagerByRealId, "function");
  assert.equal(typeof OrgHierarchy.getCompatibleOverviewPositions, "function");
  const all = [
    { id: 1, managerId: null, department: "Executive" },
    { id: 2, managerId: 1, department: "Logistics", status: "future" },
    { id: 3, managerId: 2, employeeId: 75, department: "Logistics" },
    { id: 4, managerId: 1, employeeId: 75, department: "Procurement" },
    { id: 5, managerId: 2, employeeId: 75, department: "Planning", status: "future" },
    { id: 6, managerId: 1, employeeId: 90, department: "Procurement" }
  ];
  const managers = OrgHierarchy.buildEffectiveManagerByRealId(all, new Set([1, 3, 4, 6]));

  assert.deepEqual(
    OrgHierarchy.getCompatibleOverviewPositions(all, 75, 3, managers).map(position => position.id),
    [3, 4, 5]
  );
  const result = OrgHierarchy.groupPositionsForOverview(all, [3, 4], {
    title: "Logistics and Procurement Manager",
    primaryPositionId: 3,
    effectiveManagerByRealId: managers
  });
  assert.equal(result.changed, true);
});

test("display model separates visible members from every valid hidden group member", () => {
  assert.equal(typeof OrgHierarchy.buildEffectiveManagerByRealId, "function");
  const all = [
    { id: 1, managerId: null, employeeId: 1 },
    { id: 2, managerId: 1, status: "future" },
    { id: 3, managerId: 2, employeeId: 75, overviewGroupId: "g", overviewGroupTitle: "Combined", overviewPrimaryPositionId: 3 },
    { id: 5, managerId: 2, employeeId: 75, status: "future", overviewGroupId: "g", overviewGroupTitle: "Combined", overviewPrimaryPositionId: 3 },
    { id: 6, managerId: 5, employeeId: 6 }
  ];
  const visible = all.filter(position => [1, 3, 6].includes(position.id));
  const managers = OrgHierarchy.buildEffectiveManagerByRealId(all, new Set(visible.map(position => position.id)));
  const model = OrgHierarchy.buildOverviewDisplayModel(all, visible, managers);

  assert.deepEqual(model.membersByDisplayId.get(3).map(position => position.id), [3]);
  assert.deepEqual(model.allMembersByDisplayId.get(3).map(position => position.id), [3, 5]);
  assert.deepEqual(
    OrgHierarchy.getOverviewDragPositionIds(
      all,
      3,
      model.allMembersByDisplayId.get(3).map(position => position.id)
    ),
    [3, 5, 6]
  );
});
