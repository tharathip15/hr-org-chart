import { put } from "@vercel/blob";
import { requireEditorWithCsrf } from "./_helpers/session.js";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    response.status(405).json({ ok: false, error: "Method not allowed" });
    return;
  }
  if (!requireEditorWithCsrf(request, response)) return;

  try {
    const filename = request.headers["x-filename"] || `avatar-${Date.now()}.jpg`;
    const contentType = request.headers["content-type"] || "image/jpeg";

    // Stream the request directly into Vercel Blob
    const blob = await put(filename, request, {
      contentType,
      access: "public",
      token: process.env.BLOB_READ_WRITE_TOKEN
    });

    response.status(200).json({ ok: true, url: blob.url });
  } catch (error) {
    console.error("Vercel Blob upload failed:", error);
    response.status(500).json({ ok: false, error: "Upload failed" });
  }
}
