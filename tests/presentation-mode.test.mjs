import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const htmlSource = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const appSource = readFileSync(new URL("../app.js", import.meta.url), "utf8");
const styleSource = readFileSync(new URL("../style.css", import.meta.url), "utf8");

test("workspace exposes clear sidebar and presentation controls", () => {
    assert.match(htmlSource, /id="btn-toggle-sidebar"[^>]*aria-controls="app-sidebar"[^>]*aria-expanded="true"/);
    assert.match(htmlSource, /id="btn-presentation"[^>]*aria-pressed="false"/);
    assert.match(htmlSource, /<span>Presentation<\/span>\s*<kbd>P<\/kbd>/);
    assert.match(htmlSource, /id="presentation-status"[^>]*aria-live="polite"/);
});

test("sidebar can collapse, persist locally, and refit the chart", () => {
    assert.match(appSource, /SIDEBAR_COLLAPSED_STORAGE_KEY\s*=\s*"hr_org_sidebar_collapsed"/);
    assert.match(appSource, /appContainer\.classList\.toggle\("sidebar-collapsed", isSidebarCollapsed\)/);
    assert.match(appSource, /localStorage\.setItem\(SIDEBAR_COLLAPSED_STORAGE_KEY, String\(isSidebarCollapsed\)\)/);
    assert.match(appSource, /setSidebarCollapsed\(!isSidebarCollapsed\)/);
    assert.match(styleSource, /\.app-container\.sidebar-collapsed\s*\{[^}]*grid-template-columns:\s*0 minmax\(0, 1fr\)/s);
});

test("presentation mode removes edit chrome while keeping chart controls visible", () => {
    assert.match(appSource, /document\.body\.classList\.toggle\("presentation-mode", isPresentationMode\)/);
    assert.match(appSource, /requestFullscreen\(\)/);
    assert.match(appSource, /event\.key\.toLowerCase\(\) === "p"/);
    assert.match(appSource, /event\.key === "Escape" && isPresentationMode/);
    assert.match(styleSource, /body\.presentation-mode \.sidebar,[\s\S]*body\.presentation-mode \.annotation-toolbar/);
    assert.match(styleSource, /body\.presentation-mode \.chart-controls\s*\{[^}]*position:\s*absolute/s);
    assert.match(styleSource, /body\.presentation-mode \.presentation-status\s*\{[^}]*display:\s*inline-flex/s);
    assert.doesNotMatch(styleSource, /body\.presentation-mode \.chart-controls[^}]*display:\s*none/s);
});

test("presentation controls can collapse without leaving presentation mode", () => {
    assert.match(htmlSource, /id="btn-toggle-presentation-controls"[^>]*aria-controls="chart-controls"/);
    assert.match(appSource, /let arePresentationControlsCollapsed = false;/);
    assert.match(appSource, /presentation-controls-collapsed/);
    assert.match(appSource, /arePresentationControlsCollapsed = !arePresentationControlsCollapsed/);
    assert.match(styleSource, /body\.presentation-mode\.presentation-controls-collapsed \.chart-controls\s*\{[^}]*pointer-events:\s*none/s);
    assert.match(styleSource, /body\.presentation-mode \.presentation-controls-toggle\s*\{[^}]*display:\s*inline-grid/s);
});
