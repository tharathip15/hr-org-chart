import { getSession } from "./_helpers/session.js";

export default function handler(request, response) {
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    response.status(405).json({ ok: false, error: "Method not allowed" });
    return;
  }

  const session = getSession(request);
  response.setHeader("Cache-Control", "no-store");
  if (!session) {
    response.status(401).json({
      ok: false,
      error: "Microsoft sign-in is required",
    });
    return;
  }

  response.status(200).json({
    ok: true,
    identity: {
      oid: session.oid,
      name: session.name,
      email: session.email,
      roles: session.roles,
      canEdit: session.canEdit,
    },
    csrfToken: session.csrf,
  });
}
