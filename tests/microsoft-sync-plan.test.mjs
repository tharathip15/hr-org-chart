import assert from "node:assert/strict";
import test from "node:test";

const planModule = await import("../api/_helpers/microsoft_sync_plan.js").catch(() => ({}));
const storageModule = await import("../api/_helpers/microsoft_sync_storage.js").catch(() => ({}));
const {
  buildMicrosoftSyncPlan,
  evaluateMicrosoftSyncSafety,
  executeMicrosoftSyncPlan
} = planModule;
const { upsertMicrosoftEmployeeRows } = storageModule;

test("Microsoft sync preserves stable employee IDs and every unmatched existing employee", () => {
  assert.equal(typeof buildMicrosoftSyncPlan, "function");
  const existing = [
    {
      id: 101,
      person_id: "ms-a",
      name: "Old A",
      role: "Manager",
      department: "Sales",
      manager_id: null,
      email: "a@example.com",
      bio: "keep-a",
      photo_url: "photo-a"
    },
    {
      id: 202,
      person_id: "ms-b",
      name: "Old B",
      role: "Officer",
      department: "Sales",
      manager_id: 101,
      email: "b@example.com",
      bio: "keep-b",
      photo_url: "photo-b"
    },
    {
      id: 900,
      person_id: "manual-local-900",
      name: "Local",
      role: "Advisor",
      department: "Corporate",
      manager_id: null,
      email: "local@example.com",
      bio: "keep-local",
      photo_url: null
    }
  ];
  const microsoftUsers = [
    {
      id: "ms-b",
      displayName: "New B",
      jobTitle: "Senior Officer",
      department: "Operations",
      mail: "b@example.com",
      mobilePhone: "222",
      manager: { id: "ms-a" }
    },
    {
      id: "ms-a",
      displayName: "New A",
      jobTitle: "Director",
      department: "Sales",
      mail: "a@example.com",
      mobilePhone: "111",
      manager: null
    },
    {
      id: "ms-c",
      displayName: "New C",
      jobTitle: "Analyst",
      department: "Finance",
      mail: "c@example.com",
      mobilePhone: null,
      manager: { id: "ms-a" }
    }
  ];

  const plan = buildMicrosoftSyncPlan(existing, microsoftUsers);
  const byPersonId = new Map(plan.rows.map(row => [row.person_id, row]));

  assert.equal(byPersonId.get("ms-a").id, 101);
  assert.equal(byPersonId.get("ms-b").id, 202);
  assert.equal(byPersonId.get("ms-c").id, 901);
  assert.equal(byPersonId.get("ms-b").manager_id, 101);
  assert.equal(byPersonId.get("ms-c").manager_id, 101);
  assert.deepEqual(byPersonId.get("manual-local-900"), existing[2]);
  assert.deepEqual(plan.stats, {
    existing: 3,
    microsoft: 3,
    matched: 2,
    added: 1,
    preserved: 1,
    final: 4,
    removed: 0
  });
});

test("directory ID ownership wins over a reused email regardless of Graph order", () => {
  assert.equal(typeof buildMicrosoftSyncPlan, "function");
  const existing = [
    {
      id: 50,
      person_id: "ms-owner",
      name: "Owner",
      role: "Manager",
      department: "Sales",
      manager_id: null,
      email: "shared@example.com"
    }
  ];
  const microsoftUsers = [
    {
      id: "ms-other",
      displayName: "Other",
      jobTitle: "Officer",
      department: "Sales",
      mail: "shared@example.com"
    },
    {
      id: "ms-owner",
      displayName: "Owner",
      jobTitle: "Director",
      department: "Sales",
      mail: "owner-new@example.com"
    }
  ];

  const plan = buildMicrosoftSyncPlan(existing, microsoftUsers);
  const byPersonId = new Map(plan.rows.map(row => [row.person_id, row]));

  assert.equal(byPersonId.get("ms-owner").id, 50);
  assert.equal(byPersonId.get("ms-other").id, 51);
  assert.equal(new Set(plan.rows.map(row => row.id)).size, plan.rows.length);
});

test("Microsoft sync safety blocks empty or identity-replacing plans", () => {
  assert.equal(typeof evaluateMicrosoftSyncSafety, "function");
  assert.deepEqual(
    evaluateMicrosoftSyncSafety({
      existing: 45,
      microsoft: 0,
      matched: 0,
      added: 0,
      preserved: 45,
      final: 45,
      removed: 0
    }),
    {
      safe: false,
      reasons: ["Microsoft Graph returned no employees."]
    }
  );

  assert.deepEqual(
    evaluateMicrosoftSyncSafety({
      existing: 45,
      microsoft: 41,
      matched: 0,
      added: 41,
      preserved: 0,
      final: 41,
      removed: 45
    }),
    {
      safe: false,
      reasons: [
        "The plan would remove existing employees.",
        "Existing Microsoft identities were not matched."
      ]
    }
  );
});

test("Microsoft employee persistence upserts without deleting and omits legacy coordinates", async () => {
  assert.equal(typeof upsertMicrosoftEmployeeRows, "function");
  const calls = [];
  const client = {
    from(table) {
      assert.equal(table, "employees");
      return {
        async upsert(rows) {
          calls.push({ operation: "upsert", rows });
          return { error: null };
        },
        delete() {
          throw new Error("employee sync must never delete rows");
        }
      };
    }
  };

  await upsertMicrosoftEmployeeRows(client, [
    {
      id: 1,
      person_id: "ms-1",
      name: "One",
      role: "Officer",
      department: "Sales",
      manager_id: null,
      x: 100,
      y: 200
    }
  ]);

  assert.equal(calls.length, 1);
  assert.equal(calls[0].operation, "upsert");
  assert.equal("x" in calls[0].rows[0], false);
  assert.equal("y" in calls[0].rows[0], false);
});

test("preview returns the reviewed diff without performing persistence", async () => {
  assert.equal(typeof executeMicrosoftSyncPlan, "function");
  let persisted = false;
  const result = await executeMicrosoftSyncPlan({
    mode: "preview",
    plan: {
      rows: [{ id: 1 }],
      stats: {
        existing: 1,
        microsoft: 1,
        matched: 1,
        added: 0,
        preserved: 0,
        final: 1,
        removed: 0
      }
    },
    positionUpdates: [{ id: 10 }],
    persist: async () => {
      persisted = true;
    }
  });

  assert.equal(persisted, false);
  assert.deepEqual(result, {
    ok: true,
    mode: "preview",
    safe: true,
    reasons: [],
    stats: {
      existing: 1,
      microsoft: 1,
      matched: 1,
      added: 0,
      preserved: 0,
      final: 1,
      removed: 0
    },
    positionUpdates: 1
  });
});

test("unsafe apply is blocked before persistence", async () => {
  assert.equal(typeof executeMicrosoftSyncPlan, "function");
  let persisted = false;
  const result = await executeMicrosoftSyncPlan({
    mode: "apply",
    plan: {
      rows: [],
      stats: {
        existing: 45,
        microsoft: 0,
        matched: 0,
        added: 0,
        preserved: 45,
        final: 45,
        removed: 0
      }
    },
    positionUpdates: [],
    persist: async () => {
      persisted = true;
    }
  });

  assert.equal(persisted, false);
  assert.deepEqual(result, {
    ok: false,
    mode: "apply",
    safe: false,
    reasons: ["Microsoft Graph returned no employees."],
    stats: {
      existing: 45,
      microsoft: 0,
      matched: 0,
      added: 0,
      preserved: 45,
      final: 45,
      removed: 0
    },
    positionUpdates: 0
  });
});

test("safe apply persists once and reports completion", async () => {
  assert.equal(typeof executeMicrosoftSyncPlan, "function");
  let persistenceCalls = 0;
  const result = await executeMicrosoftSyncPlan({
    mode: "apply",
    plan: {
      rows: [{ id: 1 }],
      stats: {
        existing: 1,
        microsoft: 1,
        matched: 1,
        added: 0,
        preserved: 0,
        final: 1,
        removed: 0
      }
    },
    positionUpdates: [],
    persist: async () => {
      persistenceCalls += 1;
    }
  });

  assert.equal(persistenceCalls, 1);
  assert.equal(result.ok, true);
  assert.equal(result.mode, "apply");
  assert.equal(result.applied, true);
});
