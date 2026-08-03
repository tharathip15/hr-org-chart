import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import vm from "node:vm";

const appSource = readFileSync(new URL("../app.js", import.meta.url), "utf8");

function extractFunction(name) {
  const marker = `function ${name}(`;
  const start = appSource.indexOf(marker);
  assert.notEqual(start, -1, `${name} must exist`);

  const bodyStart = appSource.indexOf("{", start);
  let depth = 0;
  for (let index = bodyStart; index < appSource.length; index += 1) {
    if (appSource[index] === "{") depth += 1;
    if (appSource[index] === "}") depth -= 1;
    if (depth === 0) return appSource.slice(start, index + 1);
  }
  throw new Error(`Could not extract ${name}`);
}

test("every zoom path redraws screen-sized connection handles after applying scale", () => {
  const setCanvasZoomSource = extractFunction("setCanvasZoom");
  const events = [];
  const context = vm.createContext({ events });

  vm.runInContext(`
    let currentScale = 1;
    let panX = 10;
    let panY = 20;
    function updateCanvasTransform() {
      events.push({ type: "transform", scale: currentScale, panX, panY });
    }
    function requestConnectionDraw() {
      events.push({ type: "redraw", scale: currentScale, panX, panY });
    }
    ${setCanvasZoomSource}
    setCanvasZoom(0.5, 30, 40);
    globalThis.result = { currentScale, panX, panY };
  `, context);

  const result = JSON.parse(JSON.stringify(context.result));
  const recordedEvents = JSON.parse(JSON.stringify(events));
  assert.deepEqual(result, { currentScale: 0.5, panX: 30, panY: 40 });
  assert.deepEqual(recordedEvents, [
    { type: "transform", scale: 0.5, panX: 30, panY: 40 },
    { type: "redraw", scale: 0.5, panX: 30, panY: 40 },
  ]);

  assert.match(extractFunction("setupEventListeners"), /setCanvasZoom\(nextScale, nextPanX, nextPanY\)/);
  assert.match(extractFunction("zoom"), /setCanvasZoom\(nextScale, nextPanX, nextPanY\)/);
  assert.match(extractFunction("fitToScreen"), /setCanvasZoom\(nextScale, nextPanX, nextPanY\)/);
  assert.equal((appSource.match(/\bcurrentScale\s*=/g) || []).length, 2);
});
