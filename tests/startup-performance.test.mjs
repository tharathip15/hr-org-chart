import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const appSource = readFileSync(new URL("../app.js", import.meta.url), "utf8");

test("startup fetches independent datasets concurrently without decorative waits", () => {
  assert.match(
    appSource,
    /Promise\.all\(\[\s*loadData\(\),\s*loadPositions\(\{\s*deferEmployeeReconciliation:\s*true\s*\}\)\s*\]\)/
  );
  assert.match(
    appSource,
    /Promise\.all\(\[\s*loadPreferences\(\),\s*loadAnnotations\(\)\s*\]\)/
  );
  assert.doesNotMatch(appSource, /setTimeout\(resolve,\s*(250|300|350)\)/);
});

test("connection drawing is throttled to one animation frame", () => {
  assert.match(appSource, /let connectionDrawFrame = null;/);
  assert.match(appSource, /function requestConnectionDraw\(\)/);
  assert.match(
    appSource,
    /requestAnimationFrame\(\(\) => \{\s*connectionDrawFrame = null;\s*drawConnections\(\);/
  );
});

test("card rendering receives one precomputed render context", () => {
  assert.match(appSource, /function getPositionCardHTML\(position, renderContext = null\)/);
  assert.match(appSource, /hasReportsByPositionId/);
  assert.match(appSource, /getPositionCardHTML\(position, renderContext\)/);
});

test("anonymous startup never self-heals employee data through a protected write", () => {
  assert.match(
    appSource,
    /authSession\?\.canEdit === true\s*&&\s*\(\s*!Array\.isArray\(savedEmployees\)/
  );
});

test("loader dismissal does not wait for a foreground animation frame", () => {
  assert.match(
    appSource,
    /setLoaderProgress\(100,[\s\S]*?\);\s*hideLoader\(\);\s*requestAnimationFrame\(\(\) => \{\s*fitToScreen\(\);/
  );
  assert.doesNotMatch(
    appSource,
    /requestAnimationFrame\(\(\) => \{\s*fitToScreen\(\);\s*hideLoader\(\);/
  );
});
