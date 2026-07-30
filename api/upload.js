import { put } from "@vercel/blob";
import { validateToken, requireEditor } from "./_helpers/auth.js";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(request, response) {
  if (!validateToken(request)) {
    response.status(401).json({ ok: false, error: "Unauthorized" });
    return;
  }

  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    response.status(405).json({ ok: false, error: "Method not allowed" });
    return;
  }

  if (!requireEditor(request, response)) return;

  try {
    const filename = request.headers["x-filename"] || `avatar-${Date.now()}.jpg`;
    const contentType = request.headers["content-type"] || "image/jpeg";

    // Stream the request directly into Vercel Blob
    const blob = await put(filename, request, {
      contentType,
      access: "public",
      addRandomSuffix: true,
      cacheControlMaxAge: 31536000,
      token: process.env.BLOB_READ_WRITE_TOKEN
    });

    response.status(200).json({ ok: true, url: blob.url });
  } catch (error) {
    console.error("Vercel Blob upload failed:", error);
    response.status(500).json({ ok: false, error: "Upload failed" });
  }
}
