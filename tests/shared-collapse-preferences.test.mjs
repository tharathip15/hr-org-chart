import { existsSync, readFileSync } from "node:fs";
import { test } from "node:test";
import assert from "node:assert/strict";

const appSource = readFileSync(new URL("../app.js", import.meta.url), "utf8");
const htmlSource = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const preferencesApiPath = new URL("../api/preferences.js", import.meta.url);

test("app loads shared collapsed node preferences before rendering", () => {
    const initSource = appSource.slice(
        appSource.indexOf("async function init()"),
        appSource.indexOf("function compressBase64Image")
    );

    assert.match(appSource, /const PREFERENCES_API_URL = "\/api\/preferences"/);
    assert.match(initSource, /await Promise\.all\(\[\s*loadPreferences\(\),\s*loadAnnotations\(\)\s*\]\)/);
    assert.ok(
        initSource.indexOf("loadPreferences()") < initSource.indexOf("renderAll()"),
        "shared preferences must finish loading before the first chart render"
    );
    assert.match(appSource, /function applyPreferences\(preferences\)/);
    assert.match(appSource, /collapsedNodes = new Set\(sanitizeCollapsedNodeIds\(preferences\?\.collapsedNodeIds\)\)/);
    assert.match(appSource, /operationCollapsedNodesByScope/);
    assert.match(appSource, /operationRootPositionId/);
});

test("explicit collapse toggles are saved to shared preferences", () => {
    assert.match(appSource, /function getPreferencesPayload\(\)/);
    assert.match(appSource, /function savePreferences\(\)/);
    assert.match(appSource, /function toggleNode\(id\)[\s\S]+savePreferences\(\);[\s\S]+renderAll\(\);/);
});

test("overall view provides a recovery action for shared collapsed nodes", () => {
    assert.match(htmlSource, /id="btn-expand-all"/);
    assert.match(appSource, /activeCollapsedNodes\.clear\(\)/);
});

test("the Vercel API exposes shared preferences", () => {
    assert.equal(existsSync(preferencesApiPath), true);

    const preferencesApiSource = readFileSync(preferencesApiPath, "utf8");
    assert.match(preferencesApiSource, /\.from\("preferences"\)/);
    assert.match(preferencesApiSource, /collapsedNodeIds/);
    assert.match(preferencesApiSource, /collapsedNodeIdsByScope/);
    assert.match(preferencesApiSource, /operationRootPositionId/);
});
