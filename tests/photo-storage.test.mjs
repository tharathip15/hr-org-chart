import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import {
  dataImageUrlToBuffer,
  getChangedPhotoRows,
  isDataImageUrl,
  isPrivateBlobUrl,
  normalizePhotoRows,
  signPrivatePhotoRows,
  uploadEmployeePhoto
} from "../api/_helpers/photo_storage.js";

const employeesApiSource = readFileSync(
  new URL("../api/employees.js", import.meta.url),
  "utf8"
);

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

test("uploads employee photos using the configured private Blob store", async () => {
  const previousToken = process.env.BLOB_READ_WRITE_TOKEN;
  process.env.BLOB_READ_WRITE_TOKEN = "test-token";
  let receivedOptions = null;

  try {
    const url = await uploadEmployeePhoto(
      Buffer.from("photo"),
      "image/png",
      "employee-1",
      {
        putBlob: async (_pathname, _buffer, options) => {
          receivedOptions = options;
          return { url: "https://store.private.blob.vercel-storage.com/employee-1.png" };
        }
      }
    );

    assert.equal(receivedOptions.access, "private");
    assert.equal(url, "https://store.private.blob.vercel-storage.com/employee-1.png");
  } finally {
    if (previousToken === undefined) {
      delete process.env.BLOB_READ_WRITE_TOKEN;
    } else {
      process.env.BLOB_READ_WRITE_TOKEN = previousToken;
    }
  }
});

test("signs private employee photo URLs once per response while leaving public URLs unchanged", async () => {
  const rows = [
    {
      id: 1,
      photo_url: "https://store.private.blob.vercel-storage.com/employee-photos/one.png"
    },
    {
      id: 2,
      photo_url: "https://store.public.blob.vercel-storage.com/employee-photos/two.png"
    }
  ];
  let issuedTokens = 0;
  const signed = await signPrivatePhotoRows(rows, {
    issueToken: async () => {
      issuedTokens += 1;
      return { delegationToken: "delegation", clientSigningToken: "signing" };
    },
    presign: async (_token, options) => ({
      presignedUrl: `https://signed.example/${options.pathname}`
    }),
    now: () => 1_000
  });

  assert.equal(isPrivateBlobUrl(rows[0].photo_url), true);
  assert.equal(issuedTokens, 1);
  assert.equal(
    signed[0].photo_url,
    "https://signed.example/employee-photos/one.png"
  );
  assert.equal(signed[1].photo_url, rows[1].photo_url);
});

test("employee reads sign private Blob photos before returning the directory", () => {
  assert.match(employeesApiSource, /signPrivatePhotoRows/);
  assert.match(employeesApiSource, /await signPrivatePhotoRows\(data \|\| \[\]\)/);
});
