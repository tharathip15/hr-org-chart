import { existsSync, readFileSync } from "node:fs";
import { test } from "node:test";
import assert from "node:assert/strict";

const appSource = readFileSync(new URL("../app.js", import.meta.url), "utf8");
const htmlSource = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const cssSource = readFileSync(new URL("../style.css", import.meta.url), "utf8");
const loginSsoApiPath = new URL("../api/login-sso.js", import.meta.url);
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

test("app exposes optional Microsoft Admin sign-in without blocking Viewers", () => {
    assert.match(htmlSource, /id="login-overlay"/);
    assert.match(htmlSource, /id="btn-login-sso"/);
    assert.match(htmlSource, /id="btn-continue-viewer"/);
    assert.match(htmlSource, /id="btn-admin-login"/);
    assert.doesNotMatch(
        htmlSource,
        /id="login-form"|id="login-password"|id="btn-login-submit"/
    );
    assert.match(appSource, /hideLoginOverlay\(\);[\s\S]+appStarted = true;[\s\S]+await init\(\)/);
    assert.equal(existsSync(loginSsoApiPath), true);
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

test("non-primary assigned positions are rendered as Acting", () => {
    assert.match(appSource, /function isActingPosition\(position\) \{[\s\S]+OrgHierarchy\.isPrimaryEmployeePosition\(positions, position\.id, employee\.id\)/);
    assert.match(appSource, /const isActing = isActingPosition\(position\);/);
    assert.match(appSource, /position-status-acting/);
    assert.match(appSource, /position-row-acting/);
    assert.match(cssSource, /\.position-status-acting/);
    assert.match(cssSource, /\.position-row-acting/);
});

test("acting position cards hide duplicate and filled labels", () => {
    assert.match(appSource, /const showDualRole = isDualRole && !isActing;/);
    assert.match(appSource, /const occupancyStatus = isVacant \? "Open Position" : \(isActing \? "" : "Filled"\);/);
    assert.match(appSource, /\$\{showDualRole \?/);
    assert.match(appSource, /\$\{occupancyStatus \?/);
});

test("the Vercel API exposes positions", () => {
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

test("position hierarchy repairs are applied to local fallback and saves", () => {
    assert.match(appSource, /const hierarchyRepair = OrgHierarchy\.repairPositionHierarchy\(positions\)/);
    assert.match(appSource, /const localHierarchyRepair = OrgHierarchy\.repairPositionHierarchy\(positions\)/);
    assert.match(appSource, /positions = localHierarchyRepair\.positions/);
});
