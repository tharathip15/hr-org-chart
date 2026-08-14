import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import vm from "node:vm";

const appSource = readFileSync(new URL("../app.js", import.meta.url), "utf8");
await import("../hierarchy-utils.js");

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

test("hidden lifecycle managers promote visible reports to the nearest visible manager", () => {
    const positions = [
        { id: 1, managerId: null },
        { id: 2, managerId: 1 },
        { id: 3, managerId: 2 }
    ];
    const managers = OrgHierarchy.buildEffectiveManagerByRealId(positions, new Set([1, 3]));

    assert.equal(managers.get(2), 1);
    assert.equal(managers.get(3), 1);
});

test("a collapsed future manager cannot hide active descendants from the current chart", () => {
    assert.match(appSource, /function getCollapsedHiddenPositionIds\(renderContext\)/);
    assert.match(appSource, /renderContext\.effectiveManagerByDisplayId\.forEach/);
    assert.match(appSource, /const hiddenIds = getCollapsedHiddenPositionIds\(renderContext\)/);
});

test("annotations are scoped independently to current and future chart modes", () => {
    assert.match(appSource, /function normalizeAnnotationChartMode\(value\)/);
    assert.match(appSource, /getAnnotationChartMode\(annotation\) === chartMode/);
    assert.match(appSource, /department: selectedDept,\s*chartMode/g);
    assert.match(appSource, /const currentDeptsAnnots = getVisibleAnnotations\(\)/);
});

test("OPERATION annotation filtering combines its sentinel department with chart mode", () => {
    const context = vm.createContext({
        annotations: [
            { id: "operation-current", department: "__operation__", chartMode: "current" },
            { id: "operation-future", department: "__operation__", chartMode: "future" },
            { id: "sales-current", department: "Sales", chartMode: "current" }
        ]
    });
    vm.runInContext(`
        let selectedDept = "__operation__";
        let chartMode = "current";
        ${extractFunction("normalizeAnnotationChartMode")}
        ${extractFunction("getAnnotationChartMode")}
        ${extractFunction("getVisibleAnnotations")}
        globalThis.visibleFor = mode => {
            chartMode = mode;
            return getVisibleAnnotations().map(annotation => annotation.id);
        };
    `, context);

    assert.deepEqual(context.visibleFor("current"), ["operation-current"]);
    assert.deepEqual(context.visibleFor("future"), ["operation-future"]);
});
