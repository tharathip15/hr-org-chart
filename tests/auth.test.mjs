import assert from "node:assert/strict";
import crypto from "node:crypto";
import { readFileSync } from "node:fs";
import { Readable } from "node:stream";
import test from "node:test";

const loginSsoSource = readFileSync(
  new URL("../api/login-sso.js", import.meta.url),
  "utf8",
);
const sessionApiSource = readFileSync(
  new URL("../api/session.js", import.meta.url),
  "utf8",
);
const logoutSource = readFileSync(
  new URL("../api/logout.js", import.meta.url),
  "utf8",
);

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

function jsonRequest(method, body, headers = {}) {
  const request = Readable.from([JSON.stringify(body)]);
  request.method = method;
  request.headers = headers;
  return request;
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

test("HR SSO APIs use an HttpOnly cookie and never return a bearer token", () => {
  assert.match(loginSsoSource, /sessionCookie/);
  assert.match(loginSsoSource, /Set-Cookie/);
  assert.doesNotMatch(loginSsoSource, /token:\s*createToken|Bearer/);
  assert.match(sessionApiSource, /getSession/);
  assert.match(logoutSource, /expiredSessionCookie/);
  assert.match(logoutSource, /requireCsrf/);
});

test("HR SSO verifies Microsoft ID tokens before creating a session", () => {
  assert.match(loginSsoSource, /verifyMicrosoftIdToken\(idToken,\s*nonce\)/);
  assert.match(loginSsoSource, /RS256/);
  assert.match(loginSsoSource, /getMicrosoftSigningKeys/);
  assert.match(loginSsoSource, /discovery\/v2\.0\/keys/);
  assert.match(loginSsoSource, /crypto\.verify/);
  assert.match(loginSsoSource, /payload\.tid/);
  assert.match(loginSsoSource, /payload\.iss/);
  assert.match(loginSsoSource, /payload\.aud/);
  assert.match(loginSsoSource, /payload\.exp/);
  assert.match(loginSsoSource, /payload\.nbf/);
  assert.match(loginSsoSource, /payload\.nonce/);
  assert.match(loginSsoSource, /payload\.oid/);
  assert.doesNotMatch(loginSsoSource, /client_secret|decodeJwtPayload/);
});

test("Microsoft SSO issues an HttpOnly HR session without a bearer token", async () => {
  const tenantId = "22222222-2222-4222-8222-222222222222";
  const clientId = "33333333-3333-4333-8333-333333333333";
  const nonce = "expected-nonce";
  process.env.MICROSOFT_TENANT_ID = tenantId;
  process.env.MICROSOFT_CLIENT_ID = clientId;

  const { privateKey, publicKey } = crypto.generateKeyPairSync("rsa", {
    modulusLength: 2048,
  });
  const jwk = publicKey.export({ format: "jwk" });
  jwk.kid = "test-key";
  jwk.alg = "RS256";
  jwk.use = "sig";

  const encode = (value) =>
    Buffer.from(JSON.stringify(value)).toString("base64url");
  const header = encode({ alg: "RS256", kid: jwk.kid, typ: "JWT" });
  const payload = encode({
    oid: "11111111-1111-4111-8111-111111111111",
    tid: tenantId,
    iss: `https://login.microsoftonline.com/${tenantId}/v2.0`,
    aud: clientId,
    exp: Math.floor(Date.now() / 1000) + 300,
    nbf: Math.floor(Date.now() / 1000) - 10,
    nonce,
    name: "PFIG Admin",
    email: "admin@example.test",
    roles: ["PFIG.HR.Admin"],
  });
  const signature = crypto.sign(
    "RSA-SHA256",
    Buffer.from(`${header}.${payload}`),
    privateKey,
  ).toString("base64url");
  const idToken = `${header}.${payload}.${signature}`;

  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => ({
    ok: true,
    async json() { return { keys: [jwk] }; },
  });

  try {
    const { default: loginSso } = await import("../api/login-sso.js");
    const response = responseRecorder();
    await loginSso(jsonRequest("POST", { idToken, nonce }), response);

    assert.equal(response.statusCode, 200);
    assert.match(response.headers["Set-Cookie"], /^pfig_hr_session=/);
    assert.match(response.headers["Set-Cookie"], /;\s*HttpOnly(?:;|$)/);
    assert.equal("token" in response.payload, false);
    assert.equal(response.payload.identity.oid, "11111111-1111-4111-8111-111111111111");
    assert.equal(response.payload.identity.canEdit, true);
    assert.equal(typeof response.payload.csrfToken, "string");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("session discovery reads identity from the HR cookie", async () => {
  const session = await sessionModulePromise;
  const { token, payload } = session.createSession({
    oid: "11111111-1111-4111-8111-111111111111",
    tid: "22222222-2222-4222-8222-222222222222",
    name: "PFIG Viewer",
    email: "viewer@example.test",
    roles: ["PFIG.Employee"],
  });
  const { default: discoverSession } = await import("../api/session.js");
  const response = responseRecorder();

  discoverSession({
    method: "GET",
    headers: { cookie: `unrelated=keep; ${session.SESSION_COOKIE_NAME}=${encodeURIComponent(token)}` },
  }, response);

  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.payload.identity, {
    oid: payload.oid,
    name: payload.name,
    email: payload.email,
    roles: payload.roles,
    canEdit: false,
  });
  assert.equal(response.payload.csrfToken, payload.csrf);
});

test("logout requires CSRF and expires only the HR session cookie", async () => {
  const session = await sessionModulePromise;
  const { token, payload } = session.createSession({
    oid: "11111111-1111-4111-8111-111111111111",
    tid: "22222222-2222-4222-8222-222222222222",
    roles: [],
  });
  const cookie = `${session.SESSION_COOKIE_NAME}=${encodeURIComponent(token)}`;
  const { default: logout } = await import("../api/logout.js");

  const rejectedResponse = responseRecorder();
  logout({ method: "POST", headers: { cookie } }, rejectedResponse);
  assert.equal(rejectedResponse.statusCode, 403);
  assert.equal(rejectedResponse.headers["Set-Cookie"], undefined);

  const response = responseRecorder();
  logout({
    method: "POST",
    headers: { cookie, "x-csrf-token": payload.csrf },
  }, response);
  assert.equal(response.statusCode, 200);
  assert.match(
    response.headers["Set-Cookie"],
    /^pfig_hr_session=; Path=\/; HttpOnly; SameSite=Lax; Max-Age=0(?:; Secure)?$/,
  );
  assert.doesNotMatch(response.headers["Set-Cookie"], /unrelated/);
});
