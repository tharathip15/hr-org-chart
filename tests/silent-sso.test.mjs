import assert from "node:assert/strict";
import crypto from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";

const appSource = readFileSync(new URL("../app.js", import.meta.url), "utf8");
const indexSource = readFileSync(
  new URL("../index.html", import.meta.url),
  "utf8",
);

test("Portal launch requests silent PKCE and keeps credentials out of the URL", () => {
  assert.match(appSource, /searchParams\.get\("pfig_sso"\) === "1"/);
  assert.match(appSource, /prompt:\s*"none"/);
  assert.match(appSource, /silent:\s*true/);
  assert.match(appSource, /code_challenge_method:\s*"S256"/);
  assert.doesNotMatch(
    appSource,
    /login_hint|idToken.*searchParams|accessToken.*searchParams/,
  );
});

test("expected silent errors fall back to Viewer without opening the overlay", () => {
  assert.match(appSource, /login_required/);
  assert.match(appSource, /interaction_required/);
  assert.match(appSource, /consent_required/);
  assert.match(appSource, /savedState\?\.silent/);
});

test("unexpected silent errors notify and still start in Viewer mode", () => {
  assert.match(appSource, /Continuing as Anonymous Viewer/);
  assert.match(appSource, /savedState\?\.silent/);
  assert.match(appSource, /hideLoginOverlay\(\)/);
});

test("HR authentication uses cookies and CSRF instead of localStorage bearer tokens", () => {
  assert.match(appSource, /credentials:\s*"same-origin"/);
  assert.match(appSource, /X-CSRF-Token/);
  assert.match(appSource, /\/api\/logout/);
  assert.doesNotMatch(appSource, /hr_org_auth_session|Authorization.*Bearer/);
  assert.doesNotMatch(appSource, /persistAuthSession|readStoredAuthSession/);
});

test("the login surface has Microsoft and Viewer choices with a header Admin control", () => {
  assert.match(indexSource, /id="btn-login-sso"/);
  assert.match(indexSource, /id="btn-continue-viewer"/);
  assert.match(indexSource, /id="btn-admin-login"/);
  assert.match(indexSource, /Continue as Viewer/);
  assert.doesNotMatch(indexSource, /id="login-form"|id="login-password"|id="btn-login-submit"/);
  assert.match(indexSource, /<script src="app\.js\?v=3\.9"><\/script>/);
});

test("every browser HR API call is routed through authenticatedFetch", () => {
  for (const endpoint of [
    "EMPLOYEES_API_URL",
    "POSITIONS_API_URL",
    "PREFERENCES_API_URL",
    "ANNOTATIONS_API_URL",
  ]) {
    assert.doesNotMatch(
      appSource,
      new RegExp(`(?<!authenticated)fetch\\(${endpoint}`),
      endpoint,
    );
  }
  assert.doesNotMatch(
    appSource,
    /(?<!authenticated)fetch\(["']\/api\/(?:config|session|login-sso|logout|sync-microsoft)/,
  );
  assert.match(
    appSource,
    /fetch\(\s*`https:\/\/login\.microsoftonline\.com\/\$\{encodeURIComponent\(microsoft\.tenantId\)\}\/oauth2\/v2\.0\/token`/,
  );
});

function extractAuthSource() {
  const start = appSource.indexOf("// Authentication and cookie SSO");
  const end = appSource.indexOf("// Loader helper functions");
  assert.ok(start >= 0, "app.js must define the cookie SSO block");
  assert.ok(end > start, "cookie SSO block must end before loader helpers");
  return appSource.slice(start, end);
}

function createClassList() {
  const values = new Set();
  return {
    add(value) { values.add(value); },
    remove(value) { values.delete(value); },
    contains(value) { return values.has(value); },
    toggle(value, force) {
      const enabled = force === undefined ? !values.has(value) : force;
      if (enabled) values.add(value);
      else values.delete(value);
      return enabled;
    },
  };
}

function createAuthHarness({
  url = "https://hr.example.test/",
  fetchImpl = async () => new Response("{}", { status: 200 }),
} = {}) {
  let currentUrl = new URL(url);
  const assignedUrls = [];
  const fetchCalls = [];
  const notifications = [];
  const elements = new Map();
  let initCalls = 0;

  const getElement = (id) => {
    if (!elements.has(id)) {
      elements.set(id, {
        classList: createClassList(),
        style: {},
        innerHTML: "",
        title: "",
        focus() {},
        addEventListener() {},
        querySelector() { return { textContent: "" }; },
      });
    }
    return elements.get(id);
  };
  const sessionValues = new Map();
  const sessionStorage = {
    getItem(key) { return sessionValues.get(key) ?? null; },
    setItem(key, value) { sessionValues.set(key, String(value)); },
    removeItem(key) { sessionValues.delete(key); },
  };
  const location = {
    get href() { return currentUrl.href; },
    get origin() { return currentUrl.origin; },
    get pathname() { return currentUrl.pathname; },
    get search() { return currentUrl.search; },
    get hash() { return currentUrl.hash; },
    assign(nextUrl) { assignedUrls.push(String(nextUrl)); },
  };
  const window = {
    crypto: crypto.webcrypto,
    location,
    history: {
      replaceState(_state, _title, nextUrl) {
        currentUrl = new URL(nextUrl, currentUrl);
      },
    },
    lucide: { createIcons() {} },
  };
  const context = vm.createContext({
    URL,
    URLSearchParams,
    TextEncoder,
    Uint8Array,
    Headers,
    Response,
    window,
    document: {
      title: "HR Org Chart",
      body: { classList: createClassList() },
      getElementById: getElement,
    },
    sessionStorage,
    fetch: async (input, options = {}) => {
      fetchCalls.push({ input, options });
      return fetchImpl(input, options);
    },
    btoa(value) {
      return Buffer.from(value, "binary").toString("base64");
    },
    console: {
      error() {},
      warn() {},
      log() {},
    },
    showNotification(message, type) {
      notifications.push({ message, type });
    },
    async init() { initCalls += 1; },
    setTimeout,
    clearTimeout,
  });

  const testExports = `
    globalThis.__authTest = {
      applyAuthSession,
      authenticatedFetch,
      processMicrosoftCallback,
      startApplication,
      setupAuthListeners,
      signOutHrAdmin,
      getState: () => ({ authSession, appStarted, runtimeConfig })
    };
  `;
  vm.runInContext(`${extractAuthSource()}\n${testExports}`, context);

  return {
    api: context.__authTest,
    assignedUrls,
    currentUrl: () => currentUrl,
    elements,
    fetchCalls,
    notifications,
    sessionStorage,
    initCalls: () => initCalls,
  };
}

function jsonResponse(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "content-type": "application/json" },
  });
}

test("authenticatedFetch sends cookies on reads and CSRF only on unsafe methods", async () => {
  const harness = createAuthHarness();
  harness.api.applyAuthSession({
    identity: { name: "HR Admin", canEdit: true },
    csrfToken: "known-csrf",
  });

  await harness.api.authenticatedFetch("/api/employees");
  await harness.api.authenticatedFetch("/api/employees", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: "[]",
  });

  assert.equal(harness.fetchCalls[0].options.credentials, "same-origin");
  assert.equal(
    new Headers(harness.fetchCalls[0].options.headers).has("X-CSRF-Token"),
    false,
  );
  assert.equal(harness.fetchCalls[1].options.credentials, "same-origin");
  assert.equal(
    new Headers(harness.fetchCalls[1].options.headers).get("X-CSRF-Token"),
    "known-csrf",
  );
});

test("direct HR access starts the anonymous chart without an auth overlay", async () => {
  const harness = createAuthHarness({
    fetchImpl: async (input) => {
      if (String(input) === "/api/config") {
        return jsonResponse({ tenantId: "", clientId: "" });
      }
      if (String(input) === "/api/session") {
        return jsonResponse({ ok: false }, 401);
      }
      return jsonResponse({ ok: true });
    },
  });

  await harness.api.startApplication();

  assert.equal(harness.initCalls(), 1);
  assert.equal(harness.assignedUrls.length, 0);
  assert.equal(
    harness.elements.get("login-overlay")?.classList.contains("active"),
    false,
  );
  assert.equal(harness.api.getState().authSession, null);
});

test("pfig_sso requests prompt none once and records silent PKCE state", async () => {
  const harness = createAuthHarness({
    url: "https://hr.example.test/?pfig_sso=1",
    fetchImpl: async (input) => {
      if (String(input) === "/api/config") {
        return jsonResponse({
          tenantId: "tenant-id",
          clientId: "client-id",
        });
      }
      if (String(input) === "/api/session") {
        return jsonResponse({ ok: false }, 401);
      }
      return jsonResponse({ ok: true });
    },
  });

  await harness.api.startApplication();

  assert.equal(harness.initCalls(), 0);
  assert.equal(harness.assignedUrls.length, 1);
  const authorizeUrl = new URL(harness.assignedUrls[0]);
  assert.equal(authorizeUrl.searchParams.get("prompt"), "none");
  assert.equal(authorizeUrl.searchParams.get("code_challenge_method"), "S256");
  assert.ok(authorizeUrl.searchParams.get("code_challenge"));
  const savedState = JSON.parse(
    harness.sessionStorage.getItem("hr_org_microsoft_state"),
  );
  assert.equal(savedState.silent, true);
  assert.ok(savedState.nonce);
  assert.ok(savedState.codeVerifier);
});

test("expected silent callbacks clear OAuth intent and continue without a modal", async () => {
  const harness = createAuthHarness({
    url: "https://hr.example.test/?pfig_sso=1&error=login_required&error_description=No+session",
    fetchImpl: async (input) => {
      if (String(input) === "/api/config") {
        return jsonResponse({
          tenantId: "tenant-id",
          clientId: "client-id",
        });
      }
      if (String(input) === "/api/session") {
        return jsonResponse({ ok: false }, 401);
      }
      return jsonResponse({ ok: true });
    },
  });
  harness.sessionStorage.setItem(
    "hr_org_microsoft_state",
    JSON.stringify({
      state: "expected-state",
      nonce: "expected-nonce",
      codeVerifier: "expected-verifier",
      silent: true,
    }),
  );

  await harness.api.startApplication();

  assert.equal(harness.initCalls(), 1);
  assert.equal(harness.assignedUrls.length, 0);
  assert.equal(harness.notifications.length, 0);
  assert.equal(harness.currentUrl().search, "");
  assert.equal(
    harness.elements.get("login-overlay")?.classList.contains("active"),
    false,
  );
});

test("unexpected silent callbacks toast and still continue as Viewer", async () => {
  const harness = createAuthHarness({
    url: "https://hr.example.test/?pfig_sso=1&error=server_error&error_description=Unexpected",
    fetchImpl: async (input) => {
      if (String(input) === "/api/config") {
        return jsonResponse({
          tenantId: "tenant-id",
          clientId: "client-id",
        });
      }
      if (String(input) === "/api/session") {
        return jsonResponse({ ok: false }, 401);
      }
      return jsonResponse({ ok: true });
    },
  });
  harness.sessionStorage.setItem(
    "hr_org_microsoft_state",
    JSON.stringify({
      state: "expected-state",
      nonce: "expected-nonce",
      codeVerifier: "expected-verifier",
      silent: true,
    }),
  );

  await harness.api.startApplication();

  assert.equal(harness.initCalls(), 1);
  assert.equal(harness.assignedUrls.length, 0);
  assert.equal(harness.currentUrl().search, "");
  assert.match(
    harness.notifications.at(-1)?.message || "",
    /Continuing as Anonymous Viewer/,
  );
  assert.equal(
    harness.elements.get("login-overlay")?.classList.contains("active"),
    false,
  );
});

test("interactive callback errors keep the Microsoft retry surface visible", async () => {
  const harness = createAuthHarness({
    url: "https://hr.example.test/?error=access_denied&error_description=Denied",
    fetchImpl: async (input) => {
      if (String(input) === "/api/config") {
        return jsonResponse({
          tenantId: "tenant-id",
          clientId: "client-id",
        });
      }
      if (String(input) === "/api/session") {
        return jsonResponse({ ok: false }, 401);
      }
      return jsonResponse({ ok: true });
    },
  });
  harness.sessionStorage.setItem(
    "hr_org_microsoft_state",
    JSON.stringify({
      state: "expected-state",
      nonce: "expected-nonce",
      codeVerifier: "expected-verifier",
      silent: false,
    }),
  );

  await harness.api.startApplication();

  assert.equal(harness.initCalls(), 1);
  assert.equal(harness.currentUrl().search, "");
  assert.equal(
    harness.elements.get("login-overlay")?.classList.contains("active"),
    true,
  );
});

test("failed HR logout keeps the Admin session active", async () => {
  const harness = createAuthHarness({
    fetchImpl: async (input) => {
      if (String(input) === "/api/logout") {
        return jsonResponse({ ok: false, error: "Logout failed" }, 500);
      }
      return jsonResponse({ ok: true });
    },
  });
  harness.api.applyAuthSession({
    identity: { name: "HR Admin", canEdit: true },
    csrfToken: "known-csrf",
  });

  await assert.rejects(
    harness.api.signOutHrAdmin(),
    /HR sign-out failed with status 500/,
  );

  assert.equal(harness.api.getState().authSession.canEdit, true);
  assert.equal(
    harness.notifications.some(({ type }) => type === "success"),
    false,
  );
});

test("Viewer mode blocks position-card drag mutations at their entry point", () => {
  assert.match(
    appSource,
    /function handleCardDragStart\(e\) \{\s*if \(document\.body\.classList\.contains\("role-viewer"\)\) return;/,
  );
});
