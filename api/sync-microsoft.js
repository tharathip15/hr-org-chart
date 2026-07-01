import { supabase } from "./supabase.js";

const tenantId = process.env.MICROSOFT_TENANT_ID;
const clientId = process.env.MICROSOFT_CLIENT_ID;
const clientSecret = process.env.MICROSOFT_CLIENT_SECRET;

export default async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    response.status(405).json({ ok: false, error: "Method not allowed" });
    return;
  }

  try {
    if (!tenantId || !clientId || !clientSecret) {
      throw new Error("Missing Microsoft API configuration environment variables.");
    }

    // 1. Get Access Token
    console.log("Authenticating with Microsoft...");
    const tokenResponse = await fetch(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "client_credentials",
        scope: "https://graph.microsoft.com/.default"
      })
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      throw new Error(`Token request failed: ${tokenResponse.status} - ${errorText}`);
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // 2. Fetch Users & Managers (excluding SharePoint-dependent aboutMe field)
    console.log("Fetching users from Microsoft Graph...");
    let url = "https://graph.microsoft.com/v1.0/users?$select=id,displayName,jobTitle,department,mail,mobilePhone,userPrincipalName&$expand=manager($select=id)&$top=999";
    let allUsers = [];

    while (url) {
      const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Graph API failed: ${res.status} - ${errText}`);
      }
      const data = await res.json();
      allUsers = allUsers.concat(data.value || []);
      url = data["@odata.nextLink"] || null;
    }

    // 3. Filter real people (jobTitle is not null and not empty)
    const realPeople = allUsers.filter(u => u.jobTitle && u.jobTitle.trim() !== "");
    console.log(`Found ${realPeople.length} real people to sync.`);

    // 4. Fetch photos in parallel batches (concurrency of 10)
    console.log("Fetching profile photos...");
    const photosMap = await fetchPhotosForUsers(realPeople, accessToken);

    // 5. Map GUIDs to sequential IDs (1, 2, 3...)
    const guidToSeqId = new Map(realPeople.map((u, idx) => [u.id, idx + 1]));

    const dbRows = realPeople.map((u, idx) => {
      const seqId = idx + 1;
      const managerGuid = u.manager ? u.manager.id : null;
      const managerSeqId = managerGuid ? guidToSeqId.get(managerGuid) : null;
      const photoBase64 = photosMap.get(u.id) || null;

      return {
        id: seqId,
        person_id: u.id,
        name: u.displayName.trim().toUpperCase(),
        role: u.jobTitle.trim(),
        department: u.department ? u.department.trim() : "General",
        manager_id: managerSeqId || null,
        email: u.mail || u.userPrincipalName || null,
        phone: u.mobilePhone || null,
        bio: null, // aboutMe is not fetched, default to null
        photo_url: photoBase64,
        avatar_color: getDeptColor(u.department || "General")
      };
    });

    // 6. Replace data in Supabase (delete all then insert all)
    console.log("Replacing data in Supabase database...");
    const { error: deleteError } = await supabase
      .from("employees")
      .delete()
      .neq("id", 0);

    if (deleteError) {
      throw new Error(`Supabase delete failed: ${deleteError.message}`);
    }

    if (dbRows.length > 0) {
      const { error: insertError } = await supabase
        .from("employees")
        .insert(dbRows);

      if (insertError) {
        throw new Error(`Supabase insert failed: ${insertError.message}`);
      }
    }

    console.log("Microsoft sync complete!");
    response.status(200).json({ ok: true, count: dbRows.length });
  } catch (error) {
    console.error("Microsoft sync API error:", error);
    response.status(500).json({ ok: false, error: error.message });
  }
}

async function fetchPhotosForUsers(users, accessToken) {
  const concurrencyLimit = 10;
  const results = [];

  for (let i = 0; i < users.length; i += concurrencyLimit) {
    const chunk = users.slice(i, i + concurrencyLimit);
    const promises = chunk.map(async (u) => {
      try {
        const photoRes = await fetch(`https://graph.microsoft.com/v1.0/users/${u.id}/photo/$value`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        if (!photoRes.ok) return null;

        const arrayBuffer = await photoRes.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const contentType = photoRes.headers.get("content-type") || "image/jpeg";
        const base64Data = buffer.toString("base64");
        return { id: u.id, photoUrl: `data:${contentType};base64,${base64Data}` };
      } catch (err) {
        return null;
      }
    });

    const chunkResults = await Promise.all(promises);
    results.push(...chunkResults.filter(Boolean));
  }

  return new Map(results.map(r => [r.id, r.photoUrl]));
}

function getDeptColor(dept) {
  if (!dept) return "#64748b";
  const d = dept.toLowerCase().trim();
  if (d.includes("engineering") || d.includes("developer") || d.includes("tech")) return "#3b82f6";
  if (d.includes("hr") || d.includes("human") || d.includes("ทรัพยากรบุคคล") || d.includes("ทรัพย์กรบุคคล")) return "#10b981";
  if (d.includes("design") || d.includes("ux") || d.includes("creative")) return "#8b5cf6";
  if (d.includes("marketing") || d.includes("mktg") || d.includes("growth") || d.includes("ภาพลักษณ์องค์กร")) return "#ec4899";
  if (d.includes("sales") || d.includes("biz") || d.includes("ขาย")) return "#f59e0b";
  if (d.includes("exec") || d.includes("ceo") || d.includes("president") || d.includes("chief") || d.includes("บริหาร")) return "#0f172a";
  if (d.includes("บัญชี") || d.includes("accounting") || d.includes("finance")) return "#14b8a6";

  const colors = ["#0ea5e9", "#f43f5e", "#14b8a6", "#f97316", "#84cc16", "#a855f7"];
  let hash = 0;
  for (let i = 0; i < dept.length; i++) {
    hash = dept.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index];
}
