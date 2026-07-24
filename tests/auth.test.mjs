import assert from "node:assert/strict";
import crypto from "node:crypto";
import test from "node:test";

const TEST_SESSION_SECRET =
  "test-only-hr-session-secret-with-at-least-32-characters";
process.env.HR_SESSION_SECRET = TEST_SESSION_SECRET;

const sessionModulePromise = import("../api/_helpers/session.js");

function signedToken(payload) {
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", TEST_SESSION_SECRET)
    .update(encoded)
    .digest("base64url");
  return `${encoded}.${signature}`;
}

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

test("arbitrary configured roles cannot become HR editors", async () => {
  const session = await sessionModulePromise;
  const originalEditorRoles = process.env.EDITOR_ROLES;
  process.env.EDITOR_ROLES = "PFIG.Employee";

  try {
    assert.equal(session.hasEditorRole(["PFIG.Employee"]), false);
    assert.equal(session.createSession({
      oid: "11111111-1111-4111-8111-111111111111",
      tid: "22222222-2222-4222-8222-222222222222",
      roles: ["PFIG.Employee"],
    }).payload.canEdit, false);
  } finally {
    if (originalEditorRoles === undefined) delete process.env.EDITOR_ROLES;
    else process.env.EDITOR_ROLES = originalEditorRoles;
  }
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

test("correctly signed sessions issued in the future are rejected", async () => {
  const session = await sessionModulePromise;
  const now = Math.floor(Date.now() / 1000);
  const futureToken = signedToken({
    oid: "11111111-1111-4111-8111-111111111111",
    tid: "22222222-2222-4222-8222-222222222222",
    roles: [],
    csrf: "known-csrf",
    iat: now + 1,
    exp: now + 3600,
  });

  assert.equal(session.parseSessionToken(futureToken), null);
});

test("correctly signed sessions require a nonempty CSRF claim", async () => {
  const session = await sessionModulePromise;
  const now = Math.floor(Date.now() / 1000);

  for (const csrf of [undefined, ""]) {
    const token = signedToken({
      oid: "11111111-1111-4111-8111-111111111111",
      tid: "22222222-2222-4222-8222-222222222222",
      roles: [],
      csrf,
      iat: now,
      exp: now + 3600,
    });
    assert.equal(session.parseSessionToken(token), null);
  }
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

test("CSRF guards reject empty and missing claims", async () => {
  const session = await sessionModulePromise;

  for (const [request, editor] of [
    [{ headers: {} }, {}],
    [{ headers: { "x-csrf-token": "" } }, { csrf: "" }],
    [{ headers: { "x-csrf-token": "known-csrf" } }, {}],
  ]) {
    const response = responseRecorder();
    assert.equal(session.requireCsrf(request, response, editor), false);
    assert.equal(response.statusCode, 403);
  }
});

test("session secrets need 32 characters and cookies have secure defaults", async () => {
  const session = await sessionModulePromise;
  const originalSecret = process.env.HR_SESSION_SECRET;
  process.env.HR_SESSION_SECRET = "too-short";

  try {
    assert.throws(
      () => session.createSession({ oid: "oid", tid: "tid", roles: [] }),
      /HR_SESSION_SECRET must contain at least 32 characters/,
    );
  } finally {
    process.env.HR_SESSION_SECRET = originalSecret;
  }

  assert.match(
    session.sessionCookie("signed.token"),
    /^pfig_hr_session=signed.token; Path=\/; HttpOnly; SameSite=Lax; Max-Age=28800(?:; Secure)?$/,
  );
  assert.match(
    session.expiredSessionCookie(),
    /^pfig_hr_session=; Path=\/; HttpOnly; SameSite=Lax; Max-Age=0(?:; Secure)?$/,
  );
});
