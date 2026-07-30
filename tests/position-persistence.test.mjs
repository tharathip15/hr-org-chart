import assert from "node:assert/strict";
import { test } from "node:test";

import "../position-persistence.js";
import { syncPositionRows } from "../api/_helpers/position_storage.js";

test("failed candidate persistence keeps the active position list unchanged", async () => {
  const current = [{ id: 1, title: "Current" }];
  const candidate = [{ id: 1, title: "Changed" }];

  const result = await globalThis.PositionPersistence.commitCandidate(
    current,
    candidate,
    async () => false
  );

  assert.equal(result.saved, false);
  assert.equal(result.positions, current);
});

test("successful candidate persistence commits the candidate list", async () => {
  const current = [{ id: 1, title: "Current" }];
  const candidate = [{ id: 1, title: "Changed" }];

  const result = await globalThis.PositionPersistence.commitCandidate(
    current,
    candidate,
    async received => received === candidate
  );

  assert.equal(result.saved, true);
  assert.equal(result.positions, candidate);
});

test("position storage upserts candidates before deleting obsolete rows", async () => {
  const calls = [];
  const client = {
    from(table) {
      assert.equal(table, "positions");
      return {
        async upsert(rows) {
          calls.push({ operation: "upsert", rows });
          return { error: null };
        },
        delete() {
          calls.push({ operation: "delete" });
          return {
            async not(column, operator, value) {
              calls.push({ operation: "not", column, operator, value });
              return { error: null };
            }
          };
        }
      };
    }
  };

  await syncPositionRows(client, [
    { id: 1, title: "One" },
    { id: 2, title: "Two" }
  ]);

  assert.deepEqual(
    calls.map(call => call.operation),
    ["upsert", "delete", "not"]
  );
  assert.equal(calls[2].value, "(1,2)");
});

test("position storage never deletes rows after an upsert failure", async () => {
  let deleteCalled = false;
  const client = {
    from() {
      return {
        async upsert() {
          return { error: new Error("upsert failed") };
        },
        delete() {
          deleteCalled = true;
          return {
            async not() {
              return { error: null };
            }
          };
        }
      };
    }
  };

  await assert.rejects(
    syncPositionRows(client, [{ id: 1, title: "One" }]),
    /upsert failed/
  );
  assert.equal(deleteCalled, false);
});

test("automatic reconciliation only persists remote repairs for editors", () => {
  assert.equal(
    globalThis.PositionPersistence.shouldPersistAutomaticRepair("remote", true),
    true
  );
  assert.equal(
    globalThis.PositionPersistence.shouldPersistAutomaticRepair("remote-save", true),
    true
  );
  assert.equal(
    globalThis.PositionPersistence.shouldPersistAutomaticRepair("remote", false),
    false
  );
  assert.equal(
    globalThis.PositionPersistence.shouldPersistAutomaticRepair("local-save", true),
    false
  );
});
