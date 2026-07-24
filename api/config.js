export default function handler(request, response) {
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    response.status(405).json({ ok: false, error: "Method not allowed" });
    return;
  }

  response.setHeader("Cache-Control", "no-store");
  response.status(200).json({
    ok: true,
    hrEnabled: String(process.env.VITE_HR_ENABLED || "true").toLowerCase() === "true",
    microsoft: {
      enabled: Boolean(process.env.MICROSOFT_TENANT_ID && process.env.MICROSOFT_CLIENT_ID),
      tenantId: process.env.MICROSOFT_TENANT_ID || "",
      clientId: process.env.MICROSOFT_CLIENT_ID || ""
    }
  });
}
