import crypto from "node:crypto";

const AUTH_SECRET_ADMIN = process.env.AUTH_SECRET_ADMIN || "admin-secret-2026";
const AUTH_SECRET_VIEWER = process.env.AUTH_SECRET_VIEWER || "viewer-secret-2026";
const TOKEN_TTL_SECONDS = 8 * 60 * 60;

const EDITOR_ROLES = new Set([
  "admin",
  "pfig.hr.admin",
  "pfig.portal.admin",
  "portal admin",
  "portal.admin"
]);

function normalizeRole(role) {
  return String(role || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

export function isEditorRole(role) {
  return EDITOR_ROLES.has(normalizeRole(role));
}

export function canonicalRole(role) {
  return isEditorRole(role) ? "PFIG.HR.Admin" : "Viewer";
}

function base64UrlEncode(value) {
  return Buffer.from(value).toString("base64url");
}

function base64UrlDecode(value) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function sign(value, secret) {
  return crypto.createHmac("sha256", secret).update(value).digest("base64url");
}

export function createToken(role, claims = {}) {
  const normalizedRole = canonicalRole(role);
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    sub: claims.sub || "password-user",
    role: normalizedRole,
    iat: now,
    exp: now + TOKEN_TTL_SECONDS,
    ...claims,
    role: normalizedRole
  };
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const secret = isEditorRole(normalizedRole) ? AUTH_SECRET_ADMIN : AUTH_SECRET_VIEWER;
  return `${encodedPayload}.${sign(encodedPayload, secret)}`;
}

function getAuthorizationHeader(request) {
  const headers = request?.headers || {};
  return headers.authorization || headers.Authorization || "";
}

function safelyEqual(left, right) {
  const leftBuffer = Buffer.from(left || "");
  const rightBuffer = Buffer.from(right || "");
  return leftBuffer.length === rightBuffer.length
    && crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

export function getAuthContext(request) {
  const authorization = getAuthorizationHeader(request);
  const match = /^Bearer\s+(.+)$/i.exec(String(authorization).trim());
  if (!match) return null;

  const token = match[1].trim();
  const parts = token.split(".");
  if (parts.length !== 2) return null;

  try {
    const payloadText = base64UrlDecode(parts[0]);
    const payload = JSON.parse(payloadText);
    const role = canonicalRole(payload.role);
    const secret = isEditorRole(role) ? AUTH_SECRET_ADMIN : AUTH_SECRET_VIEWER;
    const expectedSignature = sign(parts[0], secret);
    const now = Math.floor(Date.now() / 1000);

    if (!safelyEqual(parts[1], expectedSignature)) return null;
    if (!Number.isFinite(payload.iat) || !Number.isFinite(payload.exp)) return null;
    if (payload.iat > now + 60 || payload.exp <= now) return null;
    if (payload.role !== role) return null;

    return {
      ...payload,
      role,
      canEdit: isEditorRole(role)
    };
  } catch {
    return null;
  }
}

export function validateToken(request) {
  return Boolean(getAuthContext(request));
}

export function requireEditor(request, response) {
  const auth = getAuthContext(request);
  if (!auth) {
    response.status(401).json({ ok: false, error: "Unauthorized" });
    return null;
  }
  if (!auth.canEdit) {
    response.status(403).json({ ok: false, error: "Editor access required" });
    return null;
  }
  return auth;
}

export function getConfiguredEditorRoles() {
  const configured = String(process.env.EDITOR_ROLES || "PFIG.HR.Admin,PFIG.Portal.Admin,Portal Admin")
    .split(",")
    .map(value => value.trim())
    .filter(Boolean);
  return configured.length > 0 ? configured : ["PFIG.HR.Admin", "PFIG.Portal.Admin", "Portal Admin"];
}
