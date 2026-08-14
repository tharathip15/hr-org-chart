import { readFileSync } from "node:fs";
import vm from "node:vm";
import test from "node:test";
import assert from "node:assert/strict";

const source = readFileSync(new URL("../operation-view.js", import.meta.url), "utf8");
const context = vm.createContext({});
vm.runInContext(source, context);
const { buildSubtree } = context.OperationView;

const positions = [
  { id: 1, title: "CEO", managerId: null, department: "Corporate" },
  { id: 2, title: "COO", managerId: 1, department: "Corporate" },
  { id: 3, title: "Logistics Manager", managerId: 2, department: "Logistics" },
  { id: 4, title: "Warehouse Officer", managerId: 3, department: "Warehouse" },
  { id: 5, title: "CMO", managerId: 1, department: "Marketing" }
];

test("collects the selected root and every descendant across departments", () => {
  const result = buildSubtree(positions, positions, 2);
  assert.equal(result.status, "ready");
  assert.deepEqual([...result.realPositionIds], [2, 3, 4]);
  assert.deepEqual(result.visiblePositions.map(position => position.id), [2, 3, 4]);
});

test("keeps visible descendants when an intermediate real position is lifecycle-hidden", () => {
  const visible = positions.filter(position => position.id !== 3);
  const result = buildSubtree(positions, visible, 2);
  assert.equal(result.status, "ready");
  assert.deepEqual(result.visiblePositions.map(position => position.id), [2, 4]);
});

test("reports unconfigured, missing, and mode-hidden roots explicitly", () => {
  assert.equal(buildSubtree(positions, positions, null).status, "unconfigured");
  assert.equal(buildSubtree(positions, positions, 999).status, "missing");
  assert.equal(buildSubtree(positions, positions.filter(position => position.id !== 2), 2).status, "hidden");
});

test("terminates a cycle and returns every reached position once", () => {
  const cyclic = [
    { id: 2, managerId: 4 },
    { id: 3, managerId: 2 },
    { id: 4, managerId: 3 }
  ];
  const result = buildSubtree(cyclic, cyclic, 2);
  assert.deepEqual([...result.realPositionIds], [2, 3, 4]);
  assert.deepEqual([...result.cyclePositionIds].sort((a, b) => a - b), [2, 4]);
});

test("roots a cyclic Operation subtree with an acyclic display manager map", () => {
  const cyclic = [
    { id: 2, managerId: 4 },
    { id: 3, managerId: 2 },
    { id: 4, managerId: 3 }
  ];

  const result = buildSubtree(cyclic, cyclic, 3);

  assert.deepEqual([...result.realPositionIds], [3, 4, 2]);
  assert.deepEqual(JSON.parse(JSON.stringify([...result.displayManagerByRealId])), [
    [3, null],
    [4, 3],
    [2, 4]
  ]);
  assert.deepEqual([...result.cyclePositionIds].sort((a, b) => a - b), [2, 3]);
});
