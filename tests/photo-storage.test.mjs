import assert from "node:assert/strict";
import { test } from "node:test";
import {
  dataImageUrlToBuffer,
  getChangedPhotoRows,
  isDataImageUrl,
  normalizePhotoRows
} from "../api/_helpers/photo_storage.js";

test("recognizes and decodes legacy image data URLs", () => {
  const source = "data:image/png;base64,SGVsbG8=";
  assert.equal(isDataImageUrl(source), true);

  const decoded = dataImageUrlToBuffer(source);
  assert.equal(decoded.contentType, "image/png");
  assert.equal(decoded.buffer.toString("utf8"), "Hello");
  assert.equal(isDataImageUrl("https://cdn.example.com/avatar.png"), false);
});

test("leaves already migrated Blob URLs unchanged", async () => {
  const rows = [{ id: 1, photo_url: "https://blob.vercel-storage.com/avatar.jpg" }];
  assert.deepEqual(await normalizePhotoRows(rows), rows);
});

test("returns only employee rows whose photo URL changed during migration", () => {
  const before = [
    { id: 1, photo_url: "data:image/jpeg;base64,YQ==" },
    { id: 2, photo_url: "https://blob.example/existing.jpg" },
    { id: 3, photo_url: null }
  ];
  const after = [
    { id: 1, photo_url: "https://blob.example/new.jpg" },
    { id: 2, photo_url: "https://blob.example/existing.jpg" },
    { id: 3, photo_url: null }
  ];

  assert.deepEqual(getChangedPhotoRows(before, after), [after[0]]);
});
