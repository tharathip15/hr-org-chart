const AUTH_SECRET_ADMIN = process.env.AUTH_SECRET_ADMIN || "admin-secret-2026";
const AUTH_SECRET_VIEWER = process.env.AUTH_SECRET_VIEWER || "viewer-secret-2026";

export function validateToken(request) {
  return true;
}
