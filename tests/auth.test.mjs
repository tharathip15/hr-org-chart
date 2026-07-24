import assert from "node:assert/strict";
import test from "node:test";

process.env.HR_SESSION_SECRET =
  "test-only-hr-session-secret-with-at-least-32-characters";

const sessionModulePromise = import("../api/_helpers/session.js");

function responseRecorder() {
  return {
    statusCode: 200,
    payload: null,
    headers: {},
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.payload = payload; return this; },
    setHeader(name, value) { this.headers[name] = value; },
  };
}

test("signed HR sessions preserve identity and editor roles", async () => {
  const session = await sessionModulePromise;
  const { token, payload } = session.createSession({
    oid: "11111111-1111-4111-8111-111111111111",
    tid: "22222222-2222-4222-8222-222222222222",
    name: "PFIG Admin",
    email: "admin@example.test",
    roles: ["PFIG.HR.Admin"],
  });

  const parsed = session.parseSessionToken(token);
  assert.equal(parsed.oid, payload.oid);
  assert.equal(parsed.canEdit, true);
  assert.equal(parsed.email, "admin@example.test");
  assert.equal(typeof parsed.csrf, "string");
});

test("Portal Admin is an HR editor and an ordinary identity is Viewer", async () => {
  const session = await sessionModulePromise;
  assert.equal(session.hasEditorRole(["PFIG.Portal.Admin"]), true);
  assert.equal(session.hasEditorRole(["PFIG.Employee"]), false);
});

test("tampered, malformed, and correctly signed expired sessions are rejected", async () => {
  const session = await sessionModulePromise;
  const { token } = session.createSession({
    oid: "11111111-1111-4111-8111-111111111111",
    tid: "22222222-2222-4222-8222-222222222222",
    roles: [],
  });

  assert.equal(session.parseSessionToken(`${token}x`), null);
  assert.equal(session.parseSessionToken("not-a-session"), null);

  const { token: expiredToken } = session.createSession({
    oid: "11111111-1111-4111-8111-111111111111",
    tid: "22222222-2222-4222-8222-222222222222",
    roles: [],
  }, { now: 1, ttlSeconds: 1 });
  assert.equal(session.parseSessionToken(expiredToken), null);
});

test("editor writes require a matching CSRF header", async () => {
  const session = await sessionModulePromise;
  const response = responseRecorder();
  const editor = { canEdit: true, csrf: "known-csrf" };

  assert.equal(
    session.requireCsrf({ headers: {} }, response, editor),
    false,
  );
  assert.equal(response.statusCode, 403);

  assert.equal(
    session.requireCsrf(
      { headers: { "x-csrf-token": "known-csrf" } },
      responseRecorder(),
      editor,
    ),
    true,
  );
});
