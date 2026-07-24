import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (path) => readFileSync(new URL(path, root), "utf8");

function parseAssignments(environment) {
  return environment
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"))
    .map((line) => {
      const match = /^([A-Z][A-Z0-9_]*)=(.*)$/.exec(line);
      assert.ok(match, `environment assignment is valid: ${line}`);
      return { name: match[1], value: match[2] };
    });
}

test("safe environment template contains required blank values without public secrets or role overrides", () => {
  assert.equal(existsSync(new URL(".env.example", root)), true);
  const environment = read(".env.example");
  const assignments = parseAssignments(environment);

  assert.deepEqual(
    assignments.map(({ name }) => name),
    [
    "MICROSOFT_TENANT_ID",
    "MICROSOFT_CLIENT_ID",
    "MICROSOFT_CLIENT_SECRET",
    "HR_SESSION_SECRET",
    "VITE_HR_ENABLED",
    "SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
    "BLOB_READ_WRITE_TOKEN",
    ],
  );
  assert.ok(assignments.every(({ value }) => value === ""));
  assert.equal(assignments.some(({ name }) => name === "EDITOR_ROLES"), false);
  assert.equal(
    assignments.some(
      ({ name }) => /^VITE_.*(?:SECRET|TOKEN|KEY|PASSWORD)/.test(name),
    ),
    false,
  );

  assert.doesNotMatch(environment, /^EDITOR_ROLES=/m);
});

test("environment template is allowed through the environment ignore rule", () => {
  const gitignore = read(".gitignore");
  assert.match(gitignore, /^\.env\*$/m);
  assert.match(gitignore, /^!\.env\.example$/m);
});

test("package commands preserve Vercel development and provide complete verification", () => {
  const packageJson = JSON.parse(read("package.json"));
  assert.equal(packageJson.scripts.dev, "npx vercel dev");
  assert.equal(packageJson.scripts.test, "node --test tests/*.test.mjs");
  assert.equal(packageJson.scripts.check, "node --check app.js");
  assert.equal(packageJson.scripts.verify, "npm run test && npm run check");
});

test("deployment checklist contains the complete silent SSO deployment and rollback procedure", () => {
  assert.equal(existsSync(new URL("docs/SSO_DEPLOYMENT.md", root)), true);
  const checklist = read("docs/SSO_DEPLOYMENT.md");

  assert.match(
    checklist,
    /The HR app is single-tenant\.\s+- Register these exact HR SPA redirect URIs for Preview and Production:\s+- `https:\/\/hr-org-chart-two\.vercel\.app\/`\s+- `https:\/\/hr-org-chart-tharathipi-1965-pfig\.vercel\.app\/`/s,
  );
  assert.match(
    checklist,
    /`PFIG\.HR\.Admin` and `PFIG\.Portal\.Admin` are enabled for Users\/Groups\./,
  );
  assert.match(
    checklist,
    /`MICROSOFT_CLIENT_SECRET` is server-only and\s+is required for the server-side Microsoft Graph sync; browser PKCE and silent\s+SSO do not use it\./,
  );
  assert.match(
    checklist,
    /sensitive, server-only, 32\+ character `HR_SESSION_SECRET` exists separately\s+in Preview and Production\. Never expose it with a public prefix or commit its\s+value\./,
  );
  assert.match(checklist, /Existing Supabase and Blob variables remain unchanged\./);
  assert.match(
    checklist,
    /For a `prompt=none` silent login, `login_required`, `interaction_required`,\s+`consent_required`, and unexpected silent failures all continue as an anonymous\s+Viewer without a blocking overlay or redirect loop\./,
  );
  assert.match(
    checklist,
    /Deploy in this order: HR Preview -> HR Production -> Portal Preview -> Portal Production\./,
  );
  assert.match(checklist, /Open HR with `\?pfig_sso=1` while signed in to Portal/);
  assert.match(checklist, /Viewer receives `403` for a mutation/);
  assert.match(checklist, /missing CSRF header receives `403`/);
  assert.match(checklist, /Restore the previous HR deployment before restoring Portal\./);
  assert.doesNotMatch(checklist, /EDITOR_ROLES/);
  assert.doesNotMatch(checklist, /VITE_.*(?:SECRET|TOKEN|KEY|PASSWORD)/);
});
