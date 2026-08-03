import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

await import("../hierarchy-utils.js");
await import("../employee-utils.js");

const { combinePositions } = globalThis.OrgHierarchy || {};
const { suggestCombinedTitle } = globalThis.EmployeeDirectory || {};
const appSource = readFileSync(new URL("../app.js", import.meta.url), "utf8");
const htmlSource = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const styleSource = readFileSync(new URL("../style.css", import.meta.url), "utf8");

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

test("Split modal is not nested inside the hidden Combine modal", () => {
    const combineId = htmlSource.indexOf('id="combine-positions-modal"');
    const combineStart = htmlSource.lastIndexOf("<div", combineId);
    const splitStart = htmlSource.indexOf("<!-- Split Positions Modal -->");
    const combineMarkup = htmlSource.slice(combineStart, splitStart);
    const openingDivs = (combineMarkup.match(/<div\b/g) || []).length;
    const closingDivs = (combineMarkup.match(/<\/div>/g) || []).length;

    assert.notEqual(combineId, -1);
    assert.notEqual(combineStart, -1);
    assert.notEqual(splitStart, -1);
    assert.equal(
        openingDivs,
        closingDivs,
        "combine modal must be closed before the split modal begins"
    );
});

test("Employee Profile exposes Split as a persistent footer action outside the scrollable Overview details", () => {
    const detailDrawerSource = htmlSource.slice(
        htmlSource.indexOf('id="detail-drawer"'),
        htmlSource.indexOf("<!-- Position Lifecycle Drawer -->")
    );

    assert.match(detailDrawerSource, /class="drawer-footer detail-drawer-footer"/);
    assert.match(detailDrawerSource, /id="btn-split-employee-position"/);
    assert.match(htmlSource, /href="style\.css\?v=3"/);
    assert.match(htmlSource, /src="app\.js\?v=3\.15"/);
    assert.match(appSource, /btnSplitEmployeePosition\.dataset\.positionId = String\(selectedPosition\.id\)/);
    assert.match(appSource, /btnSplitEmployeePosition\.addEventListener\("click"/);
    assert.doesNotMatch(appSource, /id="btn-open-split-modal"/);
    assert.match(styleSource, /\.detail-split-action\s*\{[\s\S]*?grid-column:\s*1\s*\/\s*-1/);
});

test("Employee Profile separates Overview grouping from real Combine", () => {
    assert.match(htmlSource, /id="btn-group-overview-positions"/);
    assert.match(htmlSource, /id="btn-ungroup-overview-positions"/);
    assert.match(htmlSource, /id="overview-group-modal"/);
    assert.match(htmlSource, /id="overview-group-title"/);
    assert.match(htmlSource, /id="overview-group-primary"/);
    assert.match(appSource, /function openOverviewGroupModal\(/);
    assert.match(appSource, /OrgHierarchy\.groupPositionsForOverview\(/);
    assert.match(appSource, /OrgHierarchy\.ungroupOverviewPositions\(/);
});

test("split preserves the original title as one explicit Overview group", () => {
  const result = OrgHierarchy.splitPosition([
    { id: 75, title: "Logistics and Procurement Manager", employeeId: 75, managerId: 136 }
  ], 75, ["Logistics Manager", "Procurement Manager"]);

  assert.equal(result.changed, true);
  assert.equal(result.positions.length, 2);
  assert.ok(result.positions.every(position => position.overviewGroupId === "overview-75"));
  assert.ok(result.positions.every(position => position.overviewGroupTitle === "Logistics and Procurement Manager"));
  assert.ok(result.positions.every(position => position.overviewPrimaryPositionId === 75));
});

test("real Combine clears presentation grouping from the survivor", () => {
  const result = OrgHierarchy.combinePositions([
    { id: 75, title: "Logistics Manager", employeeId: 75, managerId: 136, overviewGroupId: "overview-75" },
    { id: 183, title: "Procurement Manager", employeeId: 75, managerId: 136, overviewGroupId: "overview-75" }
  ], 75, [183], { title: "Logistics and Procurement Manager" });

  assert.equal(result.positions.length, 1);
  assert.equal(result.positions[0].overviewGroupId, undefined);
});

test("split rejects an established Overview group with incompatible expanded members", () => {
  const sourcePositions = [
    {
      id: 75,
      title: "Logistics and Procurement Manager",
      employeeId: 75,
      managerId: 136,
      overviewGroupId: "overview-75",
      overviewGroupTitle: "Logistics and Procurement Manager",
      overviewPrimaryPositionId: 75
    },
    {
      id: 183,
      title: "Procurement Manager",
      employeeId: 75,
      managerId: 140,
      overviewGroupId: "overview-75",
      overviewGroupTitle: "Logistics and Procurement Manager",
      overviewPrimaryPositionId: 75
    }
  ];

  const result = OrgHierarchy.splitPosition(sourcePositions, 75, ["Logistics Manager", "Purchasing Manager"]);

  assert.equal(result.changed, false);
  assert.equal(result.error, "different_managers");
  assert.deepEqual(result.positions, sourcePositions);
});
