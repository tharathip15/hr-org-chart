import assert from "node:assert/strict";
import { test } from "node:test";

const historyPositions = await import("../api/_helpers/history_position_mapper.js").catch(error => {
  if (error?.code === "ERR_MODULE_NOT_FOUND") return {};
  throw error;
});

test("history snapshots preserve the complete raw position notes envelope through restore", () => {
  assert.equal(typeof historyPositions.mapPositionRowToSnapshot, "function");
  assert.equal(typeof historyPositions.mapPositionSnapshotToDbRow, "function");

  const rawNotes = JSON.stringify({
    layoutStyle: "vertical",
    isManual: true,
    manualLayouts: {
      Logistics: { x: 410, y: 520 },
      Procurement: { x: 730, y: 520 },
      __operation_current__: { x: 500, y: 600 },
      __operation_future__: { x: 700, y: 800 }
    },
    connectionRoutes: {
      __overview__: { parentId: 12, branchOffsetX: -80, laneOffsetY: 45 },
      Logistics: { parentId: 12, branchOffsetX: 110, laneOffsetY: -30 },
      __operation_current__: { parentId: 2, branchOffsetX: 20, laneOffsetY: 30 },
      __operation_future__: { parentId: 2, branchOffsetX: 40, laneOffsetY: 50 }
    },
    status: "future",
    effectiveDate: "2026-10-01",
    statusReason: "Approved workforce plan",
    overviewGroupId: "overview-75",
    overviewGroupTitle: "Logistics and Procurement Manager",
    overviewPrimaryPositionId: 75,
    text: "Acting assignment"
  });
  const databaseRow = {
    id: 75,
    title: "Logistics Manager",
    department: "Logistics",
    manager_id: 136,
    employee_id: 75,
    x: 240,
    y: 360,
    notes: rawNotes
  };

  const snapshot = historyPositions.mapPositionRowToSnapshot(databaseRow);
  const restored = historyPositions.mapPositionSnapshotToDbRow(snapshot);

  assert.equal(snapshot.notes, rawNotes);
  assert.equal(restored.notes, rawNotes);
  assert.deepEqual(restored, databaseRow);
  assert.deepEqual(JSON.parse(restored.notes).manualLayouts.__operation_current__, { x: 500, y: 600 });
  assert.deepEqual(JSON.parse(restored.notes).manualLayouts.__operation_future__, { x: 700, y: 800 });
  assert.deepEqual(JSON.parse(restored.notes).connectionRoutes.__operation_current__, {
    parentId: 2,
    branchOffsetX: 20,
    laneOffsetY: 30
  });
  assert.deepEqual(JSON.parse(restored.notes).connectionRoutes.__operation_future__, {
    parentId: 2,
    branchOffsetX: 40,
    laneOffsetY: 50
  });
});

test("history restore rebuilds the notes envelope used by legacy flattened snapshots", () => {
  assert.equal(typeof historyPositions.mapPositionSnapshotToDbRow, "function");

  const restored = historyPositions.mapPositionSnapshotToDbRow({
    id: 17,
    title: "Legacy manager",
    department: "Operations",
    managerId: 10,
    employeeId: 6,
    x: 200,
    y: 300,
    layoutStyle: "vertical",
    isManual: true,
    connectionRoutes: {
      __overview__: { parentId: 12, branchOffsetX: -80, laneOffsetY: 45 },
      Logistics: { parentId: 12, branchOffsetX: 110, laneOffsetY: -30 }
    },
    notes: "Legacy audit note"
  });

  assert.deepEqual(JSON.parse(restored.notes), {
    layoutStyle: "vertical",
    isManual: true,
    connectionRoutes: {
      __overview__: { parentId: 12, branchOffsetX: -80, laneOffsetY: 45 },
      Logistics: { parentId: 12, branchOffsetX: 110, laneOffsetY: -30 }
    },
    text: "Legacy audit note"
  });
});

test("legacy flattened JSON-looking note text remains text while every metadata field is rebuilt", () => {
  assert.equal(typeof historyPositions.mapPositionSnapshotToDbRow, "function");

  const humanNoteText = '{"human":"text"}';
  const restored = historyPositions.mapPositionSnapshotToDbRow({
    id: 18,
    title: "Legacy future manager",
    department: "Operations",
    managerId: 10,
    employeeId: 6,
    x: 210,
    y: 310,
    layoutStyle: "vertical",
    isManual: true,
    manualLayouts: {
      Operations: { x: 800, y: 900 }
    },
    status: "future",
    effectiveDate: "2026-10-01",
    statusReason: "Approved plan",
    overviewGroupId: "overview-18",
    overviewGroupTitle: "Operations and Planning Manager",
    overviewPrimaryPositionId: 18,
    notes: humanNoteText
  });

  assert.deepEqual(JSON.parse(restored.notes), {
    layoutStyle: "vertical",
    isManual: true,
    manualLayouts: {
      Operations: { x: 800, y: 900 }
    },
    status: "future",
    effectiveDate: "2026-10-01",
    statusReason: "Approved plan",
    overviewGroupId: "overview-18",
    overviewGroupTitle: "Operations and Planning Manager",
    overviewPrimaryPositionId: 18,
    text: humanNoteText
  });
});
