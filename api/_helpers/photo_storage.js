import crypto from "node:crypto";
import { put } from "@vercel/blob";

const DATA_IMAGE_PREFIX = /^data:(image\/[a-z0-9.+-]+);base64,/i;
const DEFAULT_CONTENT_TYPE = "image/jpeg";

export function isDataImageUrl(value) {
  return typeof value === "string" && DATA_IMAGE_PREFIX.test(value);
}

export function dataImageUrlToBuffer(dataUrl) {
  const match = DATA_IMAGE_PREFIX.exec(dataUrl || "");
  if (!match) {
    throw new Error("Unsupported employee photo format");
  }

  const base64 = dataUrl.slice(match[0].length);
  return {
    buffer: Buffer.from(base64, "base64"),
    contentType: match[1].toLowerCase()
  };
}

export async function uploadEmployeePhoto(buffer, contentType = DEFAULT_CONTENT_TYPE, key = "employee") {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error("BLOB_READ_WRITE_TOKEN is not configured");
  }

  const safeContentType = /^image\/[a-z0-9.+-]+$/i.test(contentType)
    ? contentType.toLowerCase()
    : DEFAULT_CONTENT_TYPE;
  const extension = safeContentType.split("/")[1].replace(/[^a-z0-9]+/gi, "") || "jpg";
  const safeKey = String(key || "employee")
    .replace(/[^a-z0-9_-]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "employee";
  const digest = crypto.createHash("sha256").update(buffer).digest("hex").slice(0, 16);

  const blob = await put(`employee-photos/${safeKey}-${digest}.${extension}`, buffer, {
    access: "public",
    addRandomSuffix: false,
    allowOverwrite: true,
    cacheControlMaxAge: 31536000,
    contentType: safeContentType,
    token: process.env.BLOB_READ_WRITE_TOKEN
  });

  return blob.url;
}

export async function uploadDataImageUrl(dataUrl, key) {
  const { buffer, contentType } = dataImageUrlToBuffer(dataUrl);
  return uploadEmployeePhoto(buffer, contentType, key);
}

/**
 * Converts legacy data URLs before they are written to Supabase. This is
 * intentionally deduplicated because one employee can occupy several seats.
 */
export async function normalizePhotoRows(rows, keyForRow = row => row.id) {
  const legacyUrls = new Map();
  for (const row of rows || []) {
    if (isDataImageUrl(row?.photo_url) && !legacyUrls.has(row.photo_url)) {
      legacyUrls.set(row.photo_url, uploadDataImageUrl(row.photo_url, keyForRow(row)));
    }
  }

  if (legacyUrls.size === 0) return rows;

  const uploadedUrls = new Map();
  for (const [dataUrl, uploadPromise] of legacyUrls) {
    uploadedUrls.set(dataUrl, await uploadPromise);
  }

  return (rows || []).map(row => ({
    ...row,
    photo_url: uploadedUrls.get(row.photo_url) || row.photo_url || null
  }));
}

export function getChangedPhotoRows(beforeRows, afterRows) {
  const beforeById = new Map(
    (beforeRows || []).map(row => [row.id, row.photo_url || null])
  );

  return (afterRows || []).filter(
    row => beforeById.get(row.id) !== (row.photo_url || null)
  );
}
