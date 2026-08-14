import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import vm from "node:vm";

const appSource = readFileSync(new URL("../app.js", import.meta.url), "utf8");

function extractFunction(name) {
  const marker = `function ${name}(`;
  const functionStart = appSource.indexOf(marker);
  assert.notEqual(functionStart, -1, `${name} must exist`);
  const start = appSource.slice(Math.max(0, functionStart - 6), functionStart) === "async "
    ? functionStart - 6
    : functionStart;

  const bodyStart = appSource.indexOf("{", functionStart);
  let depth = 0;
  for (let index = bodyStart; index < appSource.length; index += 1) {
    if (appSource[index] === "{") depth += 1;
    if (appSource[index] === "}") depth -= 1;
    if (depth === 0) return appSource.slice(start, index + 1);
  }
  throw new Error(`Could not extract ${name}`);
}

test("annotation HTTP failures restore the browser backup instead of rendering an empty canvas", async () => {
  const cachedAnnotations = [{
    id: "frame-1",
    type: "frame",
    text: "OPERATIONS",
    department: "All",
    chartMode: "current",
  }];
  const events = [];
  const context = vm.createContext({
    ANNOTATIONS_API_URL: "/api/annotations",
    annotations: [],
    authenticatedFetch: async () => ({ ok: false, status: 500 }),
    confirmedMutationState: new Set(),
    console: { warn: (...args) => events.push(["warn", ...args]) },
    events,
    localStorage: {
      getItem(key) {
        assert.equal(key, "hr_org_annotations");
        return JSON.stringify(cachedAnnotations);
      },
    },
    normalizeAnnotationsList: value => value,
    recordConfirmedMutationState: collection => events.push(["confirmed", collection]),
    renderAnnotations: () => events.push(["render"]),
  });

  vm.runInContext(extractFunction("loadAnnotations"), context);
  await context.loadAnnotations();

  assert.deepEqual(
    JSON.parse(JSON.stringify(context.annotations)),
    cachedAnnotations,
  );
  assert.deepEqual(events.at(-1), ["render"]);
});

test("photo avatars keep initials underneath an image that can remove itself on load failure", () => {
  const context = vm.createContext({
    escapeHTML: value => String(value),
    getDeptColor: () => "#123456",
    getInitials: () => "PR",
  });
  vm.runInContext(extractFunction("getAvatarHTML"), context);

  const html = context.getAvatarHTML({
    name: "PAITOON RUNGRUANGSAK",
    photoUrl: "https://signed.example/expired.jpg",
    avatarColor: "#123456",
  });

  assert.match(html, /class="avatar-fallback"[^>]*>PR<\/span>/);
  assert.match(html, /onerror="this\.remove\(\)"/);
  assert.match(html, /background-color:\s*#123456/);
});

test("fit to screen preserves a readable scale for oversized organization charts", () => {
  const calls = [];
  const context = vm.createContext({
    calls,
    canvas: {},
    getTreeContentBounds: () => ({
      minX: 0,
      maxX: 10000,
      minY: 0,
      maxY: 5000,
      width: 10000,
      height: 5000,
    }),
    setCanvasZoom: (...args) => calls.push(args),
    updateCanvasBounds: () => {},
    viewport: { getBoundingClientRect: () => ({ width: 1000, height: 800 }) },
  });
  vm.runInContext(extractFunction("fitToScreen"), context);

  context.fitToScreen();

  assert.equal(calls.length, 1);
  assert.equal(calls[0][0], 0.3);
});
