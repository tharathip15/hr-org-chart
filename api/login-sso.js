const tenantId = process.env.MICROSOFT_TENANT_ID;
const clientId = process.env.MICROSOFT_CLIENT_ID;
const clientSecret = process.env.MICROSOFT_CLIENT_SECRET;

const AUTH_SECRET_ADMIN = process.env.AUTH_SECRET_ADMIN || "admin-secret-2026";

export default async function handler(request, response) {
  if (request.method !== "POST") {
    response.status(405).json({ ok: false, error: "Method not allowed" });
    return;
  }

  try {
    const body = await readJsonBody(request);
    const { code, redirectUri } = body || {};

    if (!code || !redirectUri) {
      response.status(400).json({ ok: false, error: "Code and redirectUri are required" });
      return;
    }

    if (!tenantId || !clientId || !clientSecret) {
      response.status(500).json({ ok: false, error: "Microsoft SSO environment variables are not configured." });
      return;
    }

    // Exchange auth code for ID Token and Access Token
    const tokenResponse = await fetch(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
        scope: "openid profile email"
      })
    });

    if (!tokenResponse.ok) {
      const errText = await tokenResponse.text();
      throw new Error(`Token exchange failed: ${tokenResponse.status} - ${errText}`);
    }

    const tokenData = await tokenResponse.json();
    const idToken = tokenData.id_token;

    if (!idToken) {
      throw new Error("No ID Token returned by Microsoft");
    }

    const payload = decodeJwtPayload(idToken);
    
    // Extract user profile information
    const email = payload.email || payload.upn || payload.preferred_username || "";
    const name = payload.name || "Microsoft User";

    // Successful SSO authentication, authorize as admin role
    response.status(200).json({
      ok: true,
      token: AUTH_SECRET_ADMIN,
      role: "admin",
      user: { email, name }
    });
  } catch (error) {
    console.error("SSO Login error:", error);
    response.status(500).json({ ok: false, error: error.message });
  }
}

function decodeJwtPayload(token) {
  const parts = token.split(".");
  if (parts.length !== 3) throw new Error("Invalid JWT token format");
  const payloadBase64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
  const jsonString = Buffer.from(payloadBase64, "base64").toString("utf8");
  return JSON.parse(jsonString);
}

function readJsonBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";
    request.on("data", chunk => {
      body += chunk;
      if (body.length > 4096) {
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
