import assert from "node:assert/strict";
import test from "node:test";
import {
  canonicalRole,
  createToken,
  getAuthContext,
  isEditorRole,
  requireEditor,
  validateToken
} from "../api/_helpers/auth.js";
import { readFileSync } from "node:fs";

const employeesApiSource = readFileSync(new URL("../api/employees.js", import.meta.url), "utf8");
const positionsApiSource = readFileSync(new URL("../api/positions.js", import.meta.url), "utf8");
const sessionApiSource = readFileSync(new URL("../api/session.js", import.meta.url), "utf8");
const appSource = readFileSync(new URL("../app.js", import.meta.url), "utf8");
const ssoApiSource = readFileSync(new URL("../api/login-sso.js", import.meta.url), "utf8");

function requestFor(token) {
  return { headers: { authorization: `Bearer ${token}` } };
}

test("auth tokens are signed, expire, and preserve the editor role", () => {
  const token = createToken("PFIG.HR.Admin", { sub: "test-user" });
  const auth = getAuthContext(requestFor(token));

  assert.equal(validateToken(requestFor(token)), true);
  assert.equal(auth.role, "PFIG.HR.Admin");
  assert.equal(auth.canEdit, true);
  assert.equal(auth.sub, "test-user");
  assert.equal(isEditorRole("Portal Admin"), true);
  assert.equal(isEditorRole("PFIG.Portal.Admin"), true);
  assert.equal(canonicalRole("unknown-role"), "Viewer");
});

test("viewer tokens validate but cannot pass the editor guard", () => {
  const token = createToken("Viewer");
  const auth = getAuthContext(requestFor(token));
  const response = {
    statusCode: 200,
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.payload = payload; }
  };

  assert.equal(validateToken(requestFor(token)), true);
  assert.equal(auth.role, "Viewer");
  assert.equal(auth.canEdit, false);
  assert.equal(requireEditor(requestFor(token), response), null);
  assert.equal(response.statusCode, 403);
  assert.equal(response.payload.error, "Editor access required");
});

test("tampered and missing bearer tokens are rejected", () => {
  const token = createToken("Viewer");
  const tampered = `${token.slice(0, -1)}${token.endsWith("a") ? "b" : "a"}`;
  assert.equal(validateToken(requestFor(tampered)), false);
  assert.equal(validateToken({ headers: {} }), false);
});

test("anonymous viewers can read while writes stay editor protected", () => {
  assert.match(employeesApiSource, /request\.method !== "GET" && !validateToken\(request\)/);
  assert.match(positionsApiSource, /request\.method !== "GET" && !validateToken\(request\)/);
  assert.match(sessionApiSource, /if \(authorization\)/);
  assert.match(appSource, /applyAuthSession\(\{ role: "Viewer", canEdit: false \}\)/);
  assert.match(appSource, /beginMicrosoftSignIn/);
  assert.match(appSource, /code_challenge_method: "S256"/);
  assert.match(appSource, /codeVerifier/);
  assert.match(appSource, /code_verifier: codeVerifier/);
  assert.match(appSource, /searchParams\.get\("pfig_sso"\) === "1"/);
  assert.match(appSource, /beginMicrosoftSignInAsync\(\{ prompt: "none", silent: true \}\)/);
  assert.doesNotMatch(appSource, /login_hint|idToken.*searchParams|accessToken.*searchParams/);
  assert.match(ssoApiSource, /verifyMicrosoftIdToken/);
  assert.match(ssoApiSource, /discovery\/v2\.0\/keys/);
  assert.match(ssoApiSource, /crypto\.verify/);
  assert.doesNotMatch(ssoApiSource, /client_secret/);
});
