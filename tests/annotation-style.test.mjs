import { readFileSync } from "node:fs";
import { test } from "node:test";
import assert from "node:assert/strict";

const appSource = readFileSync(new URL("../app.js", import.meta.url), "utf8");
const htmlSource = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const styleSource = readFileSync(new URL("../style.css", import.meta.url), "utf8");

test("annotation toolbar exposes color and size controls", () => {
    assert.match(htmlSource, /id="annotation-color-picker"/);
    assert.match(htmlSource, /id="annotation-font-size"/);
    assert.match(htmlSource, /id="annotation-width"/);
    assert.match(htmlSource, /id="annotation-height"/);
});

test("annotations keep backward-compatible style defaults", () => {
    assert.match(appSource, /const ANNOTATION_DEFAULT_COLOR = "#4f46e5"/);
    assert.match(appSource, /const ANNOTATION_DEFAULT_FONT_SIZE = 15/);
    assert.match(appSource, /color: ANNOTATION_DEFAULT_COLOR/);
    assert.match(appSource, /fontSize: ANNOTATION_DEFAULT_FONT_SIZE/);
});

test("selected annotations render their persisted color and size", () => {
    assert.match(appSource, /let selectedAnnotationId = null/);
    assert.match(appSource, /el\.style\.borderColor = getAnnotationColor\(annot\)/);
    assert.match(appSource, /txt\.style\.color = getAnnotationColor\(annot\)/);
    assert.match(appSource, /txt\.style\.fontSize = `\$\{getAnnotationFontSize\(annot\)/);
});

test("annotation style changes are undoable and persisted", () => {
    assert.match(appSource, /function applySelectedAnnotationStyle\(/);
    assert.match(appSource, /pushAnnotationHistory\(\);[\s\S]*?saveAnnotations\(\);/);
    assert.match(appSource, /updateAnnotationToolbarButtons\(\);/);
});

test("annotation size controls apply while typing or committing", () => {
    assert.match(appSource, /widthInput\?\.addEventListener\("input"/);
    assert.match(appSource, /heightInput\?\.addEventListener\("input"/);
    assert.match(appSource, /fontSizeInput\?\.addEventListener\("input"/);
});

test("frames support canvas-sized dimensions", () => {
    assert.match(appSource, /const ANNOTATION_MAX_WIDTH = 20000/);
    assert.match(appSource, /const ANNOTATION_MAX_HEIGHT = 10000/);
    assert.match(htmlSource, /id="annotation-width"[^>]+max="20000"/);
    assert.match(htmlSource, /id="annotation-height"[^>]+max="10000"/);
});

test("text annotations support font sizes beyond the previous 48px cap", () => {
    assert.match(appSource, /const ANNOTATION_MAX_FONT_SIZE = 2000/);
    assert.match(htmlSource, /id="annotation-font-size"[^>]+max="2000"/);
});

test("annotation controls have compact responsive styling", () => {
    assert.match(styleSource, /\.annotation-style-controls/);
    assert.match(styleSource, /\.annotation-style-field input/);
    assert.match(styleSource, /@media[\s\S]*?\.annotation-style-controls/);
});
