import assert from "node:assert/strict";
import { test } from "node:test";

await import("../hierarchy-utils.js");
const overviewConsumer = await import("../overview-group-consumer.js")
  .then(() => globalThis.OverviewGroupConsumer)
  .catch(error => {
    if (error?.code === "ERR_MODULE_NOT_FOUND") return {};
    throw error;
  });

const allPositions = [
  { id: 1, managerId: null, employeeId: 1 },
  { id: 2, managerId: 1, status: "future" },
  {
    id: 3,
    managerId: 2,
    employeeId: 75,
    overviewGroupId: "g",
    overviewGroupTitle: "Combined",
    overviewPrimaryPositionId: 3
  },
  {
    id: 5,
    managerId: 2,
    employeeId: 75,
    status: "future",
    overviewGroupId: "g",
    overviewGroupTitle: "Combined",
    overviewPrimaryPositionId: 3
  },
  { id: 6, managerId: 5, employeeId: 6 }
];
const visiblePositions = allPositions.filter(position => [1, 3, 6].includes(position.id));

function buildConsumerModel() {
  assert.equal(typeof overviewConsumer?.buildRenderModel, "function");
  return overviewConsumer.buildRenderModel(allPositions, visiblePositions);
}

test("Overview rendering resolves only lifecycle-visible group members", () => {
  assert.equal(typeof overviewConsumer?.getVisibleMembers, "function");
  const model = buildConsumerModel();

  assert.deepEqual(
    overviewConsumer.getVisibleMembers(model, 3, allPositions[2]).map(position => position.id),
    [3]
  );
});

test("Overview profile membership resolves every real member including hidden positions", () => {
  assert.equal(typeof overviewConsumer?.getProfileMembers, "function");
  const model = buildConsumerModel();

  assert.deepEqual(
    overviewConsumer.getProfileMembers(model, 3, allPositions[2]).map(position => position.id),
    [3, 5]
  );
});

test("Overview grouped drag planning includes hidden members and their descendants", () => {
  assert.equal(typeof overviewConsumer?.getGroupedDragPositionIds, "function");
  const model = buildConsumerModel();

  assert.deepEqual(
    overviewConsumer.getGroupedDragPositionIds(allPositions, model, 3),
    [3, 5, 6]
  );
});
