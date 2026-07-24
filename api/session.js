import { getAuthContext } from "./_helpers/auth.js";

export default function handler(request, response) {
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    response.status(405).json({ ok: false, error: "Method not allowed" });
    return;
  }
  const auth = getAuthContext(request);
  const authorization = request.headers?.authorization || request.headers?.Authorization;
  if (!auth) {
    if (authorization) {
      response.status(401).json({ ok: false, error: "Unauthorized" });
      return;
    }
    response.status(200).json({
      ok: true,
      anonymous: true,
      role: "Viewer",
      canEdit: false
    });
    return;
  }

  response.setHeader("Cache-Control", "no-store");
  response.status(200).json({
    ok: true,
    role: auth.role,
    canEdit: auth.canEdit,
    expiresAt: auth.exp
  });
}
