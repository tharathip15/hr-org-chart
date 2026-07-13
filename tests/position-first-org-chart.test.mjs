import { existsSync, readFileSync } from "node:fs";
import { test } from "node:test";
import assert from "node:assert/strict";

const appSource = readFileSync(new URL("../app.js", import.meta.url), "utf8");
const htmlSource = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const cssSource = readFileSync(new URL("../style.css", import.meta.url), "utf8");
const serverSource = readFileSync(new URL("../server.py", import.meta.url), "utf8");
const positionsApiPath = new URL("../api/positions.js", import.meta.url);
const hierarchyUtilsPath = new URL("../hierarchy-utils.js", import.meta.url);

test("app has a shared position-first data model", () => {
    assert.match(appSource, /let positions = \[\]/);
    assert.match(appSource, /const POSITIONS_API_URL = "\/api\/positions"/);
    assert.match(appSource, /await loadData\(\);[\s\S]+await loadPositions\(\);/);
    assert.match(appSource, /function derivePositionsFromEmployees\(\)/);
    assert.match(appSource, /function normalizePosition\(position/);
    assert.match(appSource, /async function loadPositions\(\)/);
    assert.match(appSource, /async function savePositions\([^)]*\)/);
    assert.match(appSource, /OrgHierarchy\.repairPositionHierarchy\(positions\)/);
    assert.match(appSource, /position\.managerId/);
    assert.equal(existsSync(hierarchyUtilsPath), true);
});

test("app exposes a login surface before authenticated initialization", () => {
    assert.match(htmlSource, /id="login-overlay"/);
    assert.match(htmlSource, /id="login-form"/);
    assert.match(htmlSource, /id="login-password"/);
    assert.match(htmlSource, /id="btn-login-submit"/);
    assert.match(serverSource, /if path != "\/api\/login":/);
});

test("positions can be managed in a dedicated UI", () => {
    assert.match(htmlSource, /id="btn-manage-positions"/);
    assert.match(htmlSource, /id="position-modal"/);
    assert.match(htmlSource, /id="position-form"/);
    assert.match(htmlSource, /id="form-position-title"/);
    assert.match(htmlSource, /id="form-position-employee"/);
    assert.match(appSource, /function openPositionsModal\(\)/);
    assert.match(appSource, /function renderPositionsList\(\)/);
    assert.match(appSource, /async function handlePositionFormSubmit\(e\)/);
});

test("org chart renders positions and clearly marks vacant seats", () => {
    assert.match(appSource, /function getAssignedEmployee\(position\)/);
    assert.match(appSource, /function getPositionCardHTML\(position\)/);
    assert.match(appSource, /VACANT/);
    assert.match(appSource, /position-card-vacant/);
    assert.match(appSource, /positions\.forEach\(position =>/);
    assert.match(appSource, /position\.managerId/);
    assert.match(cssSource, /\.node-card\.position-card-vacant/);
    assert.match(cssSource, /\.position-status-vacant/);
});

test("local and deployed APIs expose positions", () => {
    assert.match(serverSource, /if path == "\/api\/positions":/);
    assert.match(serverSource, /load_positions\(\)/);
    assert.match(serverSource, /save_positions\(positions\)/);
    assert.equal(existsSync(positionsApiPath), true);

    const positionsApiSource = readFileSync(positionsApiPath, "utf8");
    assert.match(positionsApiSource, /from\("positions"\)/);
    assert.match(positionsApiSource, /mapPositionToDb/);
    assert.match(positionsApiSource, /mapDbToPosition/);
});

test("position hierarchy is not inferred from employee manager data", () => {
    assert.doesNotMatch(appSource, /getPositionManagerIdFromEmployeeManager\(employee\.managerId/);
    assert.doesNotMatch(appSource, /if \(false\) positions\.forEach/);
    assert.match(appSource, /managerId: null/);
});

test("position edits use shared parent validation", () => {
    assert.match(appSource, /OrgHierarchy\.validatePositionParent\(/);
});

test("position parent control uses stable position IDs instead of free-form text", () => {
    assert.match(htmlSource, /<select[^>]+id="form-position-manager"/);
    assert.doesNotMatch(htmlSource, /id="form-position-manager"[^>]+list="position-manager-list"/);
    assert.match(htmlSource, /Top Level/);
    assert.match(appSource, /managerList\.innerHTML = [\s\S]*positions/);
    assert.match(appSource, /value="\$\{position\.id\}"/);
});

test("position list exposes parent and child counts", () => {
    assert.match(appSource, /Reports to/);
    assert.match(appSource, /childCount/);
});
