import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const htmlSource = readFileSync(new URL("../index.html", import.meta.url), "utf8");

test("changed hierarchy utilities use the next cache version exactly once", () => {
  assert.equal((htmlSource.match(/src="hierarchy-utils\.js\?v=2"/g) || []).length, 1);
  assert.doesNotMatch(htmlSource, /src="hierarchy-utils\.js\?v=1"/);
});

test("connection routing utility is loaded once at its initial cache version", () => {
  assert.equal((htmlSource.match(/src="connection-routing\.js\?v=1"/g) || []).length, 1);
});

test("operation view utilities are loaded once before the application", () => {
  assert.equal((htmlSource.match(/src="chart-view-scope\.js\?v=1"/g) || []).length, 1);
  assert.equal((htmlSource.match(/src="operation-view\.js\?v=1"/g) || []).length, 1);
  assert.match(htmlSource, /chart-view-scope\.js\?v=1"[^]*connection-routing\.js\?v=1"[^]*operation-view\.js\?v=1"[^]*app\.js\?v=3\.20"/);
});

test("offline resilience assets use their next cache versions exactly once", () => {
  assert.equal((htmlSource.match(/src="app\.js\?v=3\.20"/g) || []).length, 1);
  assert.doesNotMatch(htmlSource, /src="app\.js\?v=3\.19"/);
  assert.equal((htmlSource.match(/href="style\.css\?v=5"/g) || []).length, 1);
  assert.doesNotMatch(htmlSource, /href="style\.css\?v=4"/);
});

test("the Overview group consumer is loaded once at its initial cache version", () => {
  assert.equal((htmlSource.match(/src="overview-group-consumer\.js\?v=1"/g) || []).length, 1);
});

test("the dialog focus helper is loaded once with an explicit initial version", () => {
  assert.equal((htmlSource.match(/src="dialog-focus\.js\?v=1"/g) || []).length, 1);
});
