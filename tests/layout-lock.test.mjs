import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const appSource = readFileSync(new URL("../app.js", import.meta.url), "utf8");
const htmlSource = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const styleSource = readFileSync(new URL("../style.css", import.meta.url), "utf8");
const preferencesApiSource = readFileSync(new URL("../api/preferences.js", import.meta.url), "utf8");

test("chart exposes a clear shared layout lock state", () => {
    assert.match(htmlSource, /id="btn-layout-lock"[^>]*aria-label="Lock Layout"[^>]*aria-pressed="false"/);
    assert.match(htmlSource, /id="canvas-lock-banner"[^>]*role="status"[^>]*aria-live="polite"/);
    assert.match(htmlSource, /<strong>Layout locked<\/strong>/);
    assert.match(styleSource, /body\.layout-locked \.canvas-lock-banner\s*\{[^}]*display:\s*flex/s);
    assert.match(styleSource, /\.layout-lock-toggle\.is-locked/);
});

test("layout lock is stored in shared preferences for local and deployed APIs", () => {
    assert.match(appSource, /isLayoutLocked = preferences\?\.layoutLocked === true/);
    assert.match(appSource, /layoutLocked:\s*isLayoutLocked/);
    assert.match(preferencesApiSource, /layoutLocked:\s*value\?\.layoutLocked === true/);
});

test("locked layout blocks card movement and layout restore without blocking navigation", () => {
    assert.match(appSource, /function isLayoutEditingBlocked\(\)/);
    assert.match(appSource, /function handleCardDragStart\(e\)\s*\{\s*if \(!requireEditorAction\(\)\) return;\s*if \(isLayoutEditingBlocked\(\)\) return;/);
    assert.match(appSource, /function handleCardDragMove\(e\)\s*\{\s*if \(isLayoutEditingBlocked\(\)\) return;/);
    assert.match(appSource, /async function restoreSavedLayout\(\)\s*\{\s*if \(isLayoutEditingBlocked\(\)\) return;/);
    assert.match(styleSource, /body\.layout-locked \.node-card\s*\{[^}]*cursor:\s*default !important/s);
    assert.doesNotMatch(styleSource, /body\.layout-locked \.chart-viewport\s*\{[^}]*pointer-events:\s*none/s);
});

test("locked layout blocks annotation mutations and viewers cannot unlock it", () => {
    assert.match(appSource, /button\.disabled = viewer/);
    assert.match(appSource, /async function toggleLayoutLock\(\)\s*\{\s*if \(isViewerMode\(\)\)/);
    assert.match(appSource, /function startDragAnnotation\(e, annot, el\)\s*\{\s*if \(!requireEditorAction\(\)\) return;\s*if \(isLayoutEditingBlocked\(\)/);
    assert.match(appSource, /function startResizeAnnotation\(e, annot, el\)\s*\{\s*if \(!requireEditorAction\(\)\) return;\s*if \(isLayoutEditingBlocked\(\)/);
    assert.match(appSource, /function deleteAnnotation\(id\)\s*\{\s*if \(!requireEditorAction\(\)\) return;\s*if \(isLayoutEditingBlocked\(\)\) return;/);
    assert.match(styleSource, /body\.layout-locked \.annotation-resize-handle,[\s\S]*body\.layout-locked \.annotation-text-delete-btn\s*\{[^}]*display:\s*none !important/s);
});
