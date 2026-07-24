import assert from "node:assert/strict";
import crypto from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
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

const MICROSOFT_TENANT_ID = "22222222-2222-4222-8222-222222222222";
const MICROSOFT_CLIENT_ID = "33333333-3333-4333-8333-333333333333";
const MICROSOFT_NONCE = "expected-nonce";
process.env.MICROSOFT_TENANT_ID = MICROSOFT_TENANT_ID;
process.env.MICROSOFT_CLIENT_ID = MICROSOFT_CLIENT_ID;
process.env.SUPABASE_URL ||= "https://example.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY ||= "test-only-service-role-key";

const sessionModulePromise = import("../api/_helpers/session.js");
const microsoftKeyPair = crypto.generateKeyPairSync("rsa", {
  modulusLength: 2048,
});
const invalidMicrosoftKeyPair = crypto.generateKeyPairSync("rsa", {
  modulusLength: 2048,
});
const microsoftJwk = microsoftKeyPair.publicKey.export({ format: "jwk" });
microsoftJwk.kid = "test-key";
microsoftJwk.alg = "RS256";
microsoftJwk.use = "sig";

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

function microsoftIdToken({
  payloadOverrides = {},
  signingKey = microsoftKeyPair.privateKey,
} = {}) {
  const encode = (value) =>
    Buffer.from(JSON.stringify(value)).toString("base64url");
  const header = encode({
    alg: "RS256",
    kid: microsoftJwk.kid,
    typ: "JWT",
  });
  const payload = encode({
    oid: "11111111-1111-4111-8111-111111111111",
    tid: MICROSOFT_TENANT_ID,
    iss: `https://login.microsoftonline.com/${MICROSOFT_TENANT_ID}/v2.0`,
    aud: MICROSOFT_CLIENT_ID,
    exp: Math.floor(Date.now() / 1000) + 300,
    nbf: Math.floor(Date.now() / 1000) - 10,
    nonce: MICROSOFT_NONCE,
    name: "PFIG Admin",
    email: "admin@example.test",
    roles: ["PFIG.HR.Admin"],
    ...payloadOverrides,
  });
  const signature = crypto.sign(
    "RSA-SHA256",
    Buffer.from(`${header}.${payload}`),
    signingKey,
  ).toString("base64url");
  return `${header}.${payload}.${signature}`;
}

async function runMicrosoftLogin({
  payloadOverrides,
  requestNonce = MICROSOFT_NONCE,
  signingKey,
} = {}) {
  const originalFetch = globalThis.fetch;
  const originalConsoleError = console.error;
  globalThis.fetch = async () => ({
    ok: true,
    async json() { return { keys: [microsoftJwk] }; },
  });
  console.error = () => {};

  try {
    const { default: loginSso } = await import("../api/login-sso.js");
    const response = responseRecorder();
    await loginSso(jsonRequest("POST", {
      idToken: microsoftIdToken({ payloadOverrides, signingKey }),
      nonce: requestNonce,
    }), response);
    return response;
  } finally {
    globalThis.fetch = originalFetch;
    console.error = originalConsoleError;
  }
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

test("editor role matching rejects lowercase and whitespace near misses", async () => {
  const session = await sessionModulePromise;

  for (const role of [
    "pfig.hr.admin",
    " PFIG.HR.Admin",
    "PFIG.HR.Admin ",
    "pfig.portal.admin",
    " PFIG.Portal.Admin ",
  ]) {
    assert.equal(session.hasEditorRole([role]), false, role);
    assert.equal(session.createSession({
      oid: "11111111-1111-4111-8111-111111111111",
      tid: "22222222-2222-4222-8222-222222222222",
      roles: [role],
    }).payload.canEdit, false, role);
  }
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
  assert.doesNotMatch(
    loginSsoSource,
    new RegExp(`token:\\s*${["create", "Token"].join("")}|Bearer`),
  );
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
  const response = await runMicrosoftLogin();

  assert.equal(response.statusCode, 200);
  assert.match(response.headers["Set-Cookie"], /^pfig_hr_session=/);
  assert.match(response.headers["Set-Cookie"], /;\s*HttpOnly(?:;|$)/);
  assert.equal("token" in response.payload, false);
  assert.equal(response.payload.identity.oid, "11111111-1111-4111-8111-111111111111");
  assert.equal(response.payload.identity.canEdit, true);
  assert.equal(typeof response.payload.csrfToken, "string");
});

test("Microsoft SSO rejects invalid identity tokens without setting a cookie", async (t) => {
  const now = Math.floor(Date.now() / 1000);
  const cases = [
    {
      name: "invalid signature",
      options: { signingKey: invalidMicrosoftKeyPair.privateKey },
    },
    {
      name: "wrong tenant",
      options: { payloadOverrides: { tid: "wrong-tenant" } },
    },
    {
      name: "wrong issuer",
      options: { payloadOverrides: { iss: "https://issuer.example.test" } },
    },
    {
      name: "wrong audience",
      options: { payloadOverrides: { aud: "wrong-audience" } },
    },
    {
      name: "expired exp",
      options: { payloadOverrides: { exp: now - 1 } },
    },
    {
      name: "future nbf",
      options: { payloadOverrides: { nbf: now + 61 } },
    },
    {
      name: "nonce mismatch",
      options: { payloadOverrides: { nonce: "wrong-nonce" } },
    },
    {
      name: "missing oid",
      options: { payloadOverrides: { oid: undefined } },
    },
  ];

  for (const { name, options } of cases) {
    await t.test(name, async () => {
      const response = await runMicrosoftLogin(options);
      assert.equal(response.statusCode, 401);
      assert.equal(response.headers["Set-Cookie"], undefined);
    });
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

test("session discovery rejects missing and invalid HR cookies", async (t) => {
  const { default: discoverSession } = await import("../api/session.js");

  for (const { name, headers } of [
    { name: "missing cookie", headers: {} },
    {
      name: "invalid cookie",
      headers: { cookie: "pfig_hr_session=invalid-session" },
    },
  ]) {
    await t.test(name, () => {
      const response = responseRecorder();
      discoverSession({ method: "GET", headers }, response);
      assert.equal(response.statusCode, 401);
      assert.equal(response.headers["Set-Cookie"], undefined);
    });
  }
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

  for (const { name, headers, statusCode } of [
    { name: "missing session", headers: {}, statusCode: 401 },
    { name: "missing CSRF", headers: { cookie }, statusCode: 403 },
    {
      name: "wrong CSRF",
      headers: { cookie, "x-csrf-token": "wrong-csrf" },
      statusCode: 403,
    },
  ]) {
    const rejectedResponse = responseRecorder();
    logout({ method: "POST", headers }, rejectedResponse);
    assert.equal(rejectedResponse.statusCode, statusCode, name);
    assert.equal(rejectedResponse.headers["Set-Cookie"], undefined, name);
  }

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

const mutationApiFiles = [
  "employees.js",
  "positions.js",
  "preferences.js",
  "annotations.js",
  "history.js",
  "upload.js",
  "sync-microsoft.js",
];

const publicReadApiFiles = [
  "employees.js",
  "positions.js",
  "preferences.js",
  "annotations.js",
  "history.js",
];
const legacyTokenValidator = ["validate", "Token"].join("");
const legacyAuthHelper = ["_helpers", "auth"].join("/");
const legacyAuthPattern = new RegExp(
  `${legacyTokenValidator}|${legacyAuthHelper.replace("/", "\\/")}`,
);

test("every HR mutation uses the cookie editor and CSRF guard", () => {
  for (const file of mutationApiFiles) {
    const source = readFileSync(
      new URL(`../api/${file}`, import.meta.url),
      "utf8",
    );
    assert.match(source, /requireEditorWithCsrf/, file);
    assert.doesNotMatch(source, legacyAuthPattern, file);

    const handlerSource = source.slice(source.indexOf("export default"));
    if (publicReadApiFiles.includes(file)) {
      const mutationMethod = file === "history.js" ? "POST" : "PUT";
      assert.match(
        handlerSource,
        new RegExp(
          `if \\(request\\.method === "${mutationMethod}"\\) \\{\\s*`
          + "if \\(!requireEditorWithCsrf\\(request, response\\)\\) return;",
        ),
        file,
      );
    } else {
      const methodCheck = handlerSource.indexOf(
        'if (request.method !== "POST")',
      );
      const guard = handlerSource.indexOf(
        "if (!requireEditorWithCsrf(request, response)) return;",
      );
      assert.ok(methodCheck >= 0 && methodCheck < guard, file);
    }
  }
});

test("anonymous HR reads remain available", () => {
  for (const file of publicReadApiFiles) {
    const source = readFileSync(
      new URL(`../api/${file}`, import.meta.url),
      "utf8",
    );
    assert.match(source, /request\.method === "GET"/, file);
    const handlerSource = source.slice(source.indexOf("export default"));
    const getBranch = handlerSource.indexOf(
      'if (request.method === "GET")',
    );
    const guard = handlerSource.indexOf(
      "if (!requireEditorWithCsrf(request, response)) return;",
    );
    assert.ok(getBranch >= 0 && getBranch < guard, file);
    assert.doesNotMatch(
      handlerSource.slice(0, getBranch),
      /requireSession\(|requireEditor\(|getSession\(/,
      file,
    );
    assert.doesNotMatch(
      source,
      new RegExp(
        `request\\.method !== "GET" && !${legacyTokenValidator}`,
      ),
      file,
    );
  }
});

test("anonymous HR GET handlers still return their public data", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input) => {
    const url = typeof input === "string" ? input : input.url;
    const data = /\/rest\/v1\/(?:employees|positions)(?:\?|$)/.test(url)
      ? []
      : { value: [] };
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  };

  try {
    for (const file of publicReadApiFiles) {
      const { default: handler } = await import(`../api/${file}`);
      const response = responseRecorder();
      await handler({ method: "GET", headers: {} }, response);
      assert.equal(response.statusCode, 200, file);
      assert.deepEqual(
        response.payload,
        file === "preferences.js" ? { collapsedNodeIds: [] } : [],
        file,
      );
    }
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("the editor guard enforces cookie, exact role, then CSRF", async () => {
  const session = await sessionModulePromise;

  const missingResponse = responseRecorder();
  assert.equal(
    session.requireEditorWithCsrf({ headers: {} }, missingResponse),
    null,
  );
  assert.equal(missingResponse.statusCode, 401);

  const viewer = session.createSession({
    oid: "11111111-1111-4111-8111-111111111111",
    tid: "22222222-2222-4222-8222-222222222222",
    roles: ["pfig.hr.admin"],
  });
  const viewerResponse = responseRecorder();
  assert.equal(session.requireEditorWithCsrf({
    headers: {
      cookie: `${session.SESSION_COOKIE_NAME}=${encodeURIComponent(viewer.token)}`,
      "x-csrf-token": viewer.payload.csrf,
    },
  }, viewerResponse), null);
  assert.equal(viewerResponse.statusCode, 403);
  assert.match(viewerResponse.payload.error, /HR Admin role/);

  const editor = session.createSession({
    oid: "11111111-1111-4111-8111-111111111111",
    tid: "22222222-2222-4222-8222-222222222222",
    roles: ["PFIG.HR.Admin"],
  });
  const cookie = `${session.SESSION_COOKIE_NAME}=${encodeURIComponent(editor.token)}`;

  for (const headers of [
    { cookie },
    { cookie, "x-csrf-token": "wrong-csrf" },
  ]) {
    const response = responseRecorder();
    assert.equal(
      session.requireEditorWithCsrf({ headers }, response),
      null,
    );
    assert.equal(response.statusCode, 403);
    assert.match(response.payload.error, /CSRF/);
  }

  const accepted = session.requireEditorWithCsrf({
    headers: {
      cookie,
      "x-csrf-token": editor.payload.csrf,
    },
  }, responseRecorder());
  assert.equal(accepted.oid, editor.payload.oid);
  assert.equal(accepted.canEdit, true);
});

test("unsupported HR methods return 405 before authentication", async () => {
  const cases = [
    ["employees.js", "DELETE", "GET, PUT"],
    ["positions.js", "DELETE", "GET, PUT"],
    ["preferences.js", "DELETE", "GET, PUT"],
    ["annotations.js", "DELETE", "GET, PUT"],
    ["history.js", "DELETE", "GET, POST"],
    ["upload.js", "GET", "POST"],
    ["sync-microsoft.js", "GET", "POST"],
  ];

  for (const [file, method, allow] of cases) {
    const { default: handler } = await import(`../api/${file}`);
    const response = responseRecorder();
    await handler({ method, headers: {} }, response);
    assert.equal(response.statusCode, 405, file);
    assert.equal(response.headers.Allow, allow, file);
  }
});

test("supported HR writes reject requests without an editor cookie", async () => {
  const cases = [
    ["employees.js", "PUT"],
    ["positions.js", "PUT"],
    ["preferences.js", "PUT"],
    ["annotations.js", "PUT"],
    ["history.js", "POST"],
    ["upload.js", "POST"],
    ["sync-microsoft.js", "POST"],
  ];

  for (const [file, method] of cases) {
    const { default: handler } = await import(`../api/${file}`);
    const response = responseRecorder();
    await handler({ method, headers: {} }, response);
    assert.equal(response.statusCode, 401, file);
    assert.match(response.payload.error, /Microsoft sign-in/, file);
  }
});

test("legacy password and bearer authentication routes are removed", () => {
  assert.equal(
    existsSync(new URL("../api/login.js", import.meta.url)),
    false,
    "api/login.js must not expose password login",
  );
  assert.equal(
    existsSync(
      new URL(`../api/${legacyAuthHelper}.js`, import.meta.url),
    ),
    false,
    "the legacy bearer-token helper must be absent",
  );

  const mutationSources = mutationApiFiles.map((file) =>
    readFileSync(new URL(`../api/${file}`, import.meta.url), "utf8")
  ).join("\n");
  assert.doesNotMatch(
    mutationSources,
    new RegExp(`${legacyAuthPattern.source}|AUTH_SECRET_(?:ADMIN|VIEWER)`),
  );
  assert.doesNotMatch(
    loginSsoSource,
    /ADMIN_PASSWORD|READER_PASSWORD|AUTH_SECRET|Bearer/,
  );
});
