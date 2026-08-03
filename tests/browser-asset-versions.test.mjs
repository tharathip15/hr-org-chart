import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const htmlSource = readFileSync(new URL("../index.html", import.meta.url), "utf8");

test("changed hierarchy utilities use the next cache version exactly once", () => {
  assert.equal((htmlSource.match(/src="hierarchy-utils\.js\?v=2"/g) || []).length, 1);
  assert.doesNotMatch(htmlSource, /src="hierarchy-utils\.js\?v=1"/);
});

test("round-two app script uses its next cache version exactly once", () => {
  assert.equal((htmlSource.match(/src="app\.js\?v=3\.17"/g) || []).length, 1);
  assert.doesNotMatch(htmlSource, /src="app\.js\?v=3\.16"/);
});

test("the Overview group consumer is loaded once at its initial cache version", () => {
  assert.equal((htmlSource.match(/src="overview-group-consumer\.js\?v=1"/g) || []).length, 1);
});

test("the dialog focus helper is loaded once with an explicit initial version", () => {
  assert.equal((htmlSource.match(/src="dialog-focus\.js\?v=1"/g) || []).length, 1);
});
