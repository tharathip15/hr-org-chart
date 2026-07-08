const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin1234";
const READER_PASSWORD = process.env.READER_PASSWORD || "viewer1234";

const AUTH_SECRET_ADMIN = process.env.AUTH_SECRET_ADMIN || "admin-secret-2026";
const AUTH_SECRET_VIEWER = process.env.AUTH_SECRET_VIEWER || "viewer-secret-2026";

export default async function handler(request, response) {
  if (request.method !== "POST") {
    response.status(405).json({ ok: false, error: "Method not allowed" });
    return;
  }

  try {
    const body = await readJsonBody(request);
    const { password } = body || {};

    if (password === ADMIN_PASSWORD) {
      response.status(200).json({ ok: true, token: AUTH_SECRET_ADMIN, role: "admin" });
    } else if (password === READER_PASSWORD) {
      response.status(200).json({ ok: true, token: AUTH_SECRET_VIEWER, role: "viewer" });
    } else {
      response.status(401).json({ ok: false, error: "Incorrect password" });
    }
  } catch (error) {
    console.error("Login error:", error);
    response.status(500).json({ ok: false, error: "Internal server error" });
  }
}

function readJsonBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";
    request.on("data", chunk => {
      body += chunk;
      if (body.length > 1024) {
        reject(new Error("Request body too large"));
        request.destroy();
      }
    });
    request.on("end", () => {
      try {
        resolve(JSON.parse(body || "null"));
      } catch (error) {
        reject(error);
      }
    });
    request.on("error", reject);
  });
}
