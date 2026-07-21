import assert from "node:assert/strict";
import { test } from "node:test";

import { buildPositionSyncUpdates } from "../api/_helpers/position_sync.js";

test("updates occupied positions that still mirror the employee's Microsoft role", () => {
    const updates = buildPositionSyncUpdates(
        [
            { id: 10, title: "Manager", department: "Sales", employee_id: 7 },
            { id: 11, title: "Planned Lead", department: "Sales", employee_id: 7 },
            { id: 12, title: "Officer", department: "Sales", employee_id: null }
        ],
        [
            { id: 7, person_id: "ms-7", role: "Manager", department: "Sales" }
        ],
        [
            { id: 7, person_id: "ms-7", role: "Senior Manager", department: "Corporate Sales" }
        ],
        new Set(["ms-7"])
    );

    assert.deepEqual(updates, [
        { id: 10, title: "Senior Manager", department: "Corporate Sales" }
    ]);
});
