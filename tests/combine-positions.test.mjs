import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

await import("../hierarchy-utils.js");
await import("../employee-utils.js");

const { combinePositions } = globalThis.OrgHierarchy || {};
const { suggestCombinedTitle } = globalThis.EmployeeDirectory || {};
const appSource = readFileSync(new URL("../app.js", import.meta.url), "utf8");
const htmlSource = readFileSync(new URL("../index.html", import.meta.url), "utf8");

test("suggestCombinedTitle generates clean merged title", () => {
    assert.equal(typeof suggestCombinedTitle, "function");

    assert.equal(
        suggestCombinedTitle(["Logistics Manager", "Procurement Manager"]),
        "Logistics and Procurement Manager"
    );

    assert.equal(
        suggestCombinedTitle(["Procurement Manager", "Logistics Manager"]),
        "Procurement and Logistics Manager"
    );

    assert.equal(
        suggestCombinedTitle(["Manager of Sales", "Manager of Marketing"]),
        "Manager of Sales & Marketing"
    );

    assert.equal(
        suggestCombinedTitle(["VP Finance", "Head of HR"]),
        "VP Finance & Head of HR"
    );
});

test("combinePositions merges two positions and preserves child reporting lines", () => {
    assert.equal(typeof combinePositions, "function");

    const sourcePositions = [
        { id: 10, title: "Director of Operations", managerId: null, department: "Operations" },
        { id: 17, title: "Logistics Manager", managerId: 10, department: "Procurement & Logistics" },
        { id: 18, title: "Procurement Manager", managerId: 10, department: "Procurement & Logistics" },
        { id: 25, title: "Logistics Officer", managerId: 17, department: "Procurement & Logistics" },
        { id: 26, title: "Procurement Officer", managerId: 18, department: "Procurement & Logistics" }
    ];

    const result = combinePositions(sourcePositions, 17, [18], {
        title: "Procurement and Logistics Manager",
        department: "Procurement & Logistics"
    });

    assert.equal(result.changed, true);
    assert.equal(result.positions.length, 4);

    const mergedPos = result.positions.find(p => p.id === 17);
    assert.equal(mergedPos.title, "Procurement and Logistics Manager");

    const pos18 = result.positions.find(p => p.id === 18);
    assert.equal(pos18, undefined);

    const officer25 = result.positions.find(p => p.id === 25);
    const officer26 = result.positions.find(p => p.id === 26);
    assert.equal(officer25.managerId, 17);
    assert.equal(officer26.managerId, 17);
});

test("suggestSplitTitles parses combined titles into separate titles", () => {
    const { suggestSplitTitles } = globalThis.EmployeeDirectory || {};
    assert.equal(typeof suggestSplitTitles, "function");

    assert.deepEqual(
        suggestSplitTitles("Procurement and Logistics Manager"),
        ["Procurement Manager", "Logistics Manager"]
    );

    assert.deepEqual(
        suggestSplitTitles("Manager of Sales & Marketing"),
        ["Manager of Sales", "Manager of Marketing"]
    );
});

test("splitPosition splits a combined position into two separate positions", () => {
    const { splitPosition } = globalThis.OrgHierarchy || {};
    assert.equal(typeof splitPosition, "function");

    const sourcePositions = [
        { id: 10, title: "Director of Operations", managerId: null, department: "Operations" },
        { id: 17, title: "Procurement and Logistics Manager", managerId: 10, department: "Procurement & Logistics", employeeId: 6 }
    ];

    const result = splitPosition(sourcePositions, 17, ["Procurement Manager", "Logistics Manager"]);

    assert.equal(result.changed, true);
    assert.equal(result.positions.length, 3);
    assert.equal(result.positions.find(p => p.id === 17).title, "Procurement Manager");
    
    const newPos = result.positions.find(p => p.id === 18);
    assert.ok(newPos);
    assert.equal(newPos.title, "Logistics Manager");
    assert.equal(newPos.employeeId, 6);
    assert.equal(newPos.managerId, 10);
});

test("splitPosition preserves lifecycle and offsets every saved layout for three positions", () => {
    const { splitPosition } = globalThis.OrgHierarchy || {};
    const sourcePositions = [
        { id: 10, title: "Director", managerId: null, department: "Operations" },
        {
            id: 17,
            title: "Combined Manager",
            department: "Operations",
            employeeId: 6,
            managerId: 10,
            status: "future",
            effectiveDate: "2026-10-01",
            statusReason: "Approved plan",
            notes: "Acting",
            layoutStyle: "vertical",
            isManual: true,
            manualLayouts: {
                Sales: { x: 400, y: 500 },
                Operations: { x: 800, y: 900 }
            },
            x: 200,
            y: 300
        },
        { id: 25, title: "Officer", managerId: 17, department: "Operations" }
    ];

    const result = splitPosition(sourcePositions, 17, ["A", "B", "C"]);

    assert.equal(result.changed, true);
    assert.equal(result.createdPositions.length, 2);

    const second = result.createdPositions[0];
    const third = result.createdPositions[1];
    assert.deepEqual(
        {
            title: second.title,
            employeeId: second.employeeId,
            managerId: second.managerId,
            status: second.status,
            effectiveDate: second.effectiveDate,
            statusReason: second.statusReason,
            notes: second.notes,
            layoutStyle: second.layoutStyle,
            isManual: second.isManual,
            x: second.x,
            y: second.y,
            manualLayouts: second.manualLayouts
        },
        {
            title: "B",
            employeeId: 6,
            managerId: 10,
            status: "future",
            effectiveDate: "2026-10-01",
            statusReason: "Approved plan",
            notes: "Acting",
            layoutStyle: "vertical",
            isManual: true,
            x: 460,
            y: 300,
            manualLayouts: {
                Sales: { x: 660, y: 500 },
                Operations: { x: 1060, y: 900 }
            }
        }
    );
    assert.equal(third.title, "C");
    assert.equal(third.x, 720);
    assert.deepEqual(third.manualLayouts.Sales, { x: 920, y: 500 });
    assert.notEqual(second.manualLayouts, sourcePositions[1].manualLayouts);
    assert.equal(result.positions.find(position => position.id === 25).managerId, 17);
});

test("Split modal accepts a dynamic list of two or more position titles", () => {
    assert.match(htmlSource, /id="split-title-inputs"/);
    assert.match(htmlSource, /id="btn-add-split-title"/);
    assert.match(appSource, /function addSplitTitleInput\(/);
    assert.match(appSource, /querySelectorAll\("\.split-title-input"\)/);
    assert.doesNotMatch(appSource, /const title1 = input1/);
});
