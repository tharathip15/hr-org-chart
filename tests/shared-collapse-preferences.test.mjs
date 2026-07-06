import { existsSync, readFileSync } from "node:fs";
import { test } from "node:test";
import assert from "node:assert/strict";

const appSource = readFileSync(new URL("../app.js", import.meta.url), "utf8");
const serverSource = readFileSync(new URL("../server.py", import.meta.url), "utf8");
const preferencesApiPath = new URL("../api/preferences.js", import.meta.url);

test("app loads shared collapsed node preferences before rendering", () => {
    assert.match(appSource, /const PREFERENCES_API_URL = "\/api\/preferences"/);
    assert.match(appSource, /await loadData\(\);[\s\S]*?await loadPreferences\(\);/);
    assert.match(appSource, /function applyPreferences\(preferences\)/);
    assert.match(appSource, /collapsedNodes = new Set\(sanitizeCollapsedNodeIds\(preferences\?\.collapsedNodeIds\)\)/);
});

test("explicit collapse toggles are saved to shared preferences", () => {
    assert.match(appSource, /function getPreferencesPayload\(\)/);
    assert.match(appSource, /async function savePreferences\(\)/);
    assert.match(appSource, /function toggleNode\(id\)[\s\S]+savePreferences\(\);[\s\S]+renderAll\(\);/);
});

test("local and deployed APIs expose shared preferences", () => {
    assert.match(serverSource, /if path == "\/api\/preferences":/);
    assert.match(serverSource, /save_preferences\(preferences\)/);
    assert.equal(existsSync(preferencesApiPath), true);

    const preferencesApiSource = readFileSync(preferencesApiPath, "utf8");
    assert.match(preferencesApiSource, /\.from\("preferences"\)/);
    assert.match(preferencesApiSource, /collapsedNodeIds/);
});
