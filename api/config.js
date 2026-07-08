const tenantId = process.env.MICROSOFT_TENANT_ID;
const clientId = process.env.MICROSOFT_CLIENT_ID;

export default function handler(request, response) {
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    response.status(405).json({ ok: false, error: "Method not allowed" });
    return;
  }
  response.status(200).json({ tenantId, clientId });
}
