import {
  expiredSessionCookie,
  requireCsrf,
  requireSession,
} from "./_helpers/session.js";

export default function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    response.status(405).json({ ok: false, error: "Method not allowed" });
    return;
  }

  const session = requireSession(request, response);
  if (!session || !requireCsrf(request, response, session)) return;

  response.setHeader("Cache-Control", "no-store");
  response.setHeader("Set-Cookie", expiredSessionCookie());
  response.status(200).json({ ok: true });
}
