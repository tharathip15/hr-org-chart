import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (path) => readFileSync(new URL(path, root), "utf8");

test("safe environment template exposes required server configuration without role overrides", () => {
  assert.equal(existsSync(new URL(".env.example", root)), true);
  const environment = read(".env.example");

  for (const variable of [
    "MICROSOFT_TENANT_ID",
    "MICROSOFT_CLIENT_ID",
    "MICROSOFT_CLIENT_SECRET",
    "HR_SESSION_SECRET",
    "VITE_HR_ENABLED",
    "SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
    "BLOB_READ_WRITE_TOKEN",
  ]) {
    assert.match(environment, new RegExp(`^${variable}=`, "m"));
  }

  assert.match(environment, /^VITE_HR_ENABLED=true$/m);
  assert.doesNotMatch(environment, /^EDITOR_ROLES=/m);
  assert.doesNotMatch(environment, /^VITE_HR_SESSION_SECRET=/m);
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

test("deployment checklist documents role, secret, smoke-test, and rollback safeguards", () => {
  assert.equal(existsSync(new URL("docs/SSO_DEPLOYMENT.md", root)), true);
  const checklist = read("docs/SSO_DEPLOYMENT.md");

  assert.match(checklist, /PFIG\.HR\.Admin/);
  assert.match(checklist, /PFIG\.Portal\.Admin/);
  assert.match(checklist, /MICROSOFT_CLIENT_SECRET/);
  assert.match(checklist, /Preview and Production/);
  assert.match(checklist, /separate/i);
  assert.match(checklist, /32\+ character/);
  assert.match(checklist, /HR_SESSION_SECRET/);
  assert.match(checklist, /server-only/i);
  assert.match(checklist, /\?pfig_sso=1/);
  assert.match(checklist, /403/);
  assert.match(checklist, /Rollback/);
  assert.doesNotMatch(checklist, /EDITOR_ROLES/);
  assert.doesNotMatch(checklist, /VITE_HR_SESSION_SECRET/);
});
