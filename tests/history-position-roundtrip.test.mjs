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
      Procurement: { x: 730, y: 520 }
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
    notes: "Legacy audit note"
  });

  assert.deepEqual(JSON.parse(restored.notes), {
    layoutStyle: "vertical",
    isManual: true,
    text: "Legacy audit note"
  });
});
