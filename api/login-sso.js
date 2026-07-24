import crypto from "node:crypto";
import { createToken, getConfiguredEditorRoles } from "./_helpers/auth.js";

const tenantId = process.env.MICROSOFT_TENANT_ID;
const clientId = process.env.MICROSOFT_CLIENT_ID;
const JWKS_CACHE_MS = 60 * 60 * 1000;
let cachedSigningKeys = null;
let signingKeysFetchedAt = 0;

export default async function handler(request, response) {
  if (request.method !== "POST") {
    response.status(405).json({ ok: false, error: "Method not allowed" });
    return;
  }

  try {
    const body = await readJsonBody(request);
    const { idToken, nonce } = body || {};

    if (!idToken || !nonce) {
      response.status(400).json({ ok: false, error: "idToken and nonce are required" });
      return;
    }

    if (!tenantId || !clientId) {
      response.status(500).json({ ok: false, error: "Microsoft SSO environment variables are not configured." });
      return;
    }

    const payload = await verifyMicrosoftIdToken(idToken, nonce);
    const email = payload.email || payload.upn || payload.preferred_username || "";
    const name = payload.name || "Microsoft User";

    const identityRoles = [
      ...(Array.isArray(payload.roles) ? payload.roles : []),
      ...(Array.isArray(payload.groups) ? payload.groups : []),
      payload.role
    ].filter(Boolean).map(value => String(value).trim().toLowerCase());
    const configuredEditorRoles = getConfiguredEditorRoles()
      .map(value => value.trim().toLowerCase());
    const canEdit = identityRoles.some(role => configuredEditorRoles.includes(role));
    const role = canEdit ? "PFIG.HR.Admin" : "Viewer";
    console.info(`Microsoft SSO roles=[${identityRoles.join(",") || "none"}] canEdit=${canEdit}`);

    response.status(200).json({
      ok: true,
      token: createToken(role, { sub: email || name }),
      role,
      canEdit,
      identityRoles,
      user: { email, name }
    });
  } catch (error) {
    console.error("SSO Login error:", error);
    response.status(401).json({ ok: false, error: "Microsoft identity token validation failed" });
  }
}

async function verifyMicrosoftIdToken(token, expectedNonce) {
  const parts = token.split(".");
  if (parts.length !== 3) throw new Error("Invalid JWT token format");

  const header = JSON.parse(Buffer.from(parts[0], "base64url").toString("utf8"));
  const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
  if (header.alg !== "RS256" || !header.kid) throw new Error("Unsupported Microsoft token signature");

  let signingKey = (await getMicrosoftSigningKeys()).find(key => key.kid === header.kid);
  if (!signingKey) {
    signingKey = (await getMicrosoftSigningKeys(true)).find(key => key.kid === header.kid);
  }
  if (!signingKey) throw new Error("Microsoft signing key not found");

  const publicKey = crypto.createPublicKey({ key: signingKey, format: "jwk" });
  const isValidSignature = crypto.verify(
    "RSA-SHA256",
    Buffer.from(`${parts[0]}.${parts[1]}`),
    publicKey,
    Buffer.from(parts[2], "base64url")
  );
  if (!isValidSignature) throw new Error("Invalid Microsoft token signature");

  const now = Math.floor(Date.now() / 1000);
  const allowedIssuers = new Set([
    `https://login.microsoftonline.com/${tenantId}/v2.0`,
    `https://sts.windows.net/${tenantId}/`
  ]);
  const validAudience = payload.aud === clientId
    || (Array.isArray(payload.aud) && payload.aud.includes(clientId));

  if (payload.tid !== tenantId || !allowedIssuers.has(payload.iss) || !validAudience) {
    throw new Error("Microsoft token tenant, issuer or audience mismatch");
  }
  if (!Number.isFinite(payload.exp) || payload.exp <= now) throw new Error("Microsoft token expired");
  if (Number.isFinite(payload.nbf) && payload.nbf > now + 60) throw new Error("Microsoft token not active");
  if (payload.nonce !== expectedNonce) throw new Error("Microsoft token nonce mismatch");

  return payload;
}

async function getMicrosoftSigningKeys(forceRefresh = false) {
  const cacheFresh = cachedSigningKeys && Date.now() - signingKeysFetchedAt < JWKS_CACHE_MS;
  if (!forceRefresh && cacheFresh) return cachedSigningKeys;

  const response = await fetch(`https://login.microsoftonline.com/${tenantId}/discovery/v2.0/keys`);
  if (!response.ok) throw new Error("Unable to load Microsoft signing keys");
  const data = await response.json();
  if (!Array.isArray(data.keys)) throw new Error("Invalid Microsoft signing keys response");

  cachedSigningKeys = data.keys;
  signingKeysFetchedAt = Date.now();
  return cachedSigningKeys;
}

function readJsonBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";
    request.on("data", chunk => {
      body += chunk;
      if (body.length > 16 * 1024) {
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
