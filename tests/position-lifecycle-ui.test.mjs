import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const appSource = readFileSync(new URL("../app.js", import.meta.url), "utf8");
const htmlSource = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const styleSource = readFileSync(new URL("../style.css", import.meta.url), "utf8");

test("chart exposes current and future organization modes", () => {
    assert.match(htmlSource, /data-chart-mode="current"/);
    assert.match(htmlSource, /data-chart-mode="future"/);
    assert.match(appSource, /PositionLifecycle\.filterVisiblePositions\(positions, chartMode\)/);
    assert.match(appSource, /function setChartMode\(mode\)/);
});

test("position lifecycle metadata persists inside the existing notes payload", () => {
    assert.match(appSource, /status:\s*PositionLifecycle\.normalizeStatus\(p\.status\)/);
    assert.match(appSource, /effectiveDate:\s*PositionLifecycle\.normalizeDate\(p\.effectiveDate\)/);
    assert.match(appSource, /statusReason:\s*p\.statusReason \|\| ""/);
});

test("vacant positions open a lifecycle drawer that can close without deleting history", () => {
    assert.match(htmlSource, /id="position-lifecycle-drawer"/);
    assert.match(htmlSource, /id="btn-close-position"/);
    assert.match(appSource, /openPositionLifecycleDrawer\(id\)/);
    assert.match(appSource, /position\.status = status/);
    assert.doesNotMatch(
        appSource.slice(appSource.indexOf("async function savePositionLifecycle"), appSource.indexOf("/* Modals: CRUD Form management */")),
        /positions\s*=\s*positions\.filter/
    );
    const closeActionSource = appSource.slice(
        appSource.indexOf("function preparePositionClosure"),
        appSource.indexOf("async function savePositionLifecycle")
    );
    assert.match(closeActionSource, /dateInput\.value = PositionLifecycle\.getTodayKey\(\);/);
    assert.doesNotMatch(closeActionSource, /if \(!dateInput\.value\)/);
});

test("future positions use the selected dashed indigo card treatment without a status badge", () => {
    assert.match(appSource, /position-card-future/);
    assert.match(appSource, /data-lucide="calendar-days"/);
    assert.match(styleSource, /\.node-card\.position-card-future[\s\S]*?border-style:\s*dashed/);
    assert.doesNotMatch(appSource, /future-status-badge/);
});
