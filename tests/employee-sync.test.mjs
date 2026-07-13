import { test } from "node:test";
import assert from "node:assert/strict";
import {
  findExistingEmployee,
  isManualEmployee,
  normalizeEmail
} from "../api/_helpers/employee_merge.js";

test("normalizes email values for matching", () => {
  assert.equal(normalizeEmail(" Jane@Example.com "), "jane@example.com");
  assert.equal(normalizeEmail(null), "");
});

test("matches Microsoft users to Manual employee by normalized email", () => {
  const existing = [{ id: 900, email: "Jane@Example.com", person_id: "manual-jane-900" }];
  const match = findExistingEmployee(existing, { mail: " jane@example.com " });

  assert.equal(match.id, 900);
});

test("matches Microsoft users by directory ID when no email matches", () => {
  const existing = [{ id: 901, email: "other@example.com", person_id: "ms-guid-1" }];
  const match = findExistingEmployee(existing, { id: "MS-GUID-1", mail: "new@example.com" });

  assert.equal(match.id, 901);
});

test("retains Manual employees not returned by Microsoft", () => {
  assert.equal(isManualEmployee({ person_id: "manual-jane-900" }, new Set(["ms-guid-1"])), true);
  assert.equal(isManualEmployee({ person_id: "ms-guid-1" }, new Set(["ms-guid-1"])), false);
});
