import { supabase } from "./_helpers/supabase.js";
import { validateToken, requireEditor } from "./_helpers/auth.js";
import { findExistingEmployee, isManualEmployee } from "./_helpers/employee_merge.js";
import { buildPositionSyncUpdates } from "./_helpers/position_sync.js";
import { normalizePhotoRows, uploadEmployeePhoto } from "./_helpers/photo_storage.js";

const tenantId = process.env.MICROSOFT_TENANT_ID;
const clientId = process.env.MICROSOFT_CLIENT_ID;
const clientSecret = process.env.MICROSOFT_CLIENT_SECRET;

export default async function handler(request, response) {
  if (!validateToken(request)) {
    response.status(401).json({ ok: false, error: "Unauthorized" });
    return;
  }

  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    response.status(405).json({ ok: false, error: "Method not allowed" });
    return;
  }

  if (!requireEditor(request, response)) return;

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

    // 2. Fetch Users & Managers from Microsoft Graph
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

    // 3. Filter real people
    const realPeople = allUsers.filter(u => u.jobTitle && u.jobTitle.trim() !== "");
    console.log(`Found ${realPeople.length} real people in Microsoft AD.`);

    // 4. Fetch profile photos
    console.log("Fetching profile photos...");
    const photosMap = await fetchPhotosForUsers(realPeople, accessToken);

    // 5. Fetch existing database records to perform non-destructive merge
    console.log("Fetching existing employees from database...");
    const { data: existingEmployees, error: fetchError } = await supabase
      .from("employees")
      .select("*");

    if (fetchError) {
      throw new Error(`Failed to fetch existing employees: ${fetchError.message}`);
    }

    // Positions are a separate source of truth, but occupied seats that still
    // mirror an employee's old Microsoft role should follow that role update.
    let existingPositions = [];
    const { data: positionRows, error: positionsFetchError } = await supabase
      .from("positions")
      .select("id,title,department,employee_id");

    if (positionsFetchError) {
      if (isMissingTableError(positionsFetchError)) {
        console.warn("Positions table unavailable; skipping position title sync.");
      } else {
        throw new Error(`Failed to fetch existing positions: ${positionsFetchError.message}`);
      }
    } else {
      existingPositions = positionRows || [];
    }

    // 6. Map and merge users
    const dbRows = [];
    const newAdUsers = [];
    const mergedExistingEmployeeIds = new Set();

    realPeople.forEach(u => {
      const existing = findExistingEmployee(existingEmployees, u);

      const photoBase64 = photosMap.get(u.id) || (existing ? existing.photo_url : null);

      if (existing) {
        mergedExistingEmployeeIds.add(existing.id);
        // PRESERVE: id, manager_id, x, y, bio
        dbRows.push({
          id: existing.id,
          person_id: u.id,
          name: u.displayName.trim().toUpperCase(),
          role: u.jobTitle.trim(),
          department: u.department ? u.department.trim() : "General",
          manager_id: existing.manager_id,
          email: u.mail || u.userPrincipalName || null,
          phone: u.mobilePhone || null,
          bio: existing.bio,
          photo_url: photoBase64,
          avatar_color: existing.avatar_color || getDeptColor(u.department || "General"),
          x: existing.x,
          y: existing.y
        });
      } else {
        // Collect new AD users to assign IDs and manager mappings later
        newAdUsers.push({
          user: u,
          photoUrl: photoBase64
        });
      }
    });

    // Determine currently used sequential IDs
    const usedIds = new Set(dbRows.map(r => r.id));
    (existingEmployees || []).forEach(e => usedIds.add(e.id));

    // Assign sequential IDs to new AD users
    let nextId = 1;
    newAdUsers.forEach(item => {
      while (usedIds.has(nextId)) {
        nextId++;
      }
      item.seqId = nextId;
      usedIds.add(nextId);
    });

    // Build GUID -> Sequential ID map for all synced AD users
    const guidToSeqId = new Map();
    dbRows.forEach(r => guidToSeqId.set(r.person_id, r.id));
    newAdUsers.forEach(item => guidToSeqId.set(item.user.id, item.seqId));

    // Process new AD users mapping managers from AD GUID
    newAdUsers.forEach(item => {
      const u = item.user;
      const managerGuid = u.manager ? u.manager.id : null;
      const managerSeqId = managerGuid ? guidToSeqId.get(managerGuid) : null;

      dbRows.push({
        id: item.seqId,
        person_id: u.id,
        name: u.displayName.trim().toUpperCase(),
        role: u.jobTitle.trim(),
        department: u.department ? u.department.trim() : "General",
        manager_id: managerSeqId || null,
        email: u.mail || u.userPrincipalName || null,
        phone: u.mobilePhone || null,
        bio: null,
        photo_url: item.photoUrl,
        avatar_color: getDeptColor(u.department || "General"),
        x: null,
        y: null
      });
    });

    // 7. Retain manual employees (non-AD records)
    const adPersonIds = new Set(realPeople.map(u => u.id.toLowerCase()));
    const manualEmployees = (existingEmployees || []).filter(
      e => isManualEmployee(e, adPersonIds) && !mergedExistingEmployeeIds.has(e.id)
    );

    dbRows.push(...manualEmployees);
    console.log(`Merged results: ${dbRows.length} total employees (${manualEmployees.length} manual, ${dbRows.length - manualEmployees.length} from AD).`);

    const microsoftPersonIds = new Set(realPeople.map(user => user.id));
    const positionUpdates = buildPositionSyncUpdates(
      existingPositions,
      existingEmployees || [],
      dbRows,
      microsoftPersonIds
    );

    // Keep Microsoft profile images out of the employees table. This also
    // migrates any legacy Base64 images retained when Graph has no photo.
    const normalizedDbRows = await normalizePhotoRows(
      dbRows,
      row => row.person_id || row.id
    );
    dbRows.splice(0, dbRows.length, ...normalizedDbRows);

    // 8. Re-insert to Supabase
    console.log("Replacing database rows...");
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
        // Fallback: if columns x or y are missing in database, retry insert without coordinates
        const isMissingColumns = insertError.message && (
          insertError.message.includes("column") || 
          insertError.message.includes("schema cache")
        );
        if (isMissingColumns) {
          console.warn("x/y columns missing in Supabase, retrying insert without coordinates...");
          const fallbackRows = dbRows.map(row => {
            const copy = { ...row };
            delete copy.x;
            delete copy.y;
            return copy;
          });
          const { error: retryError } = await supabase
            .from("employees")
            .insert(fallbackRows);
          if (retryError) throw new Error(`Supabase insert failed: ${retryError.message}`);
        } else {
          throw new Error(`Supabase insert failed: ${insertError.message}`);
        }
      }
    }

    for (const positionUpdate of positionUpdates) {
      const { error: positionUpdateError } = await supabase
        .from("positions")
        .update({
          title: positionUpdate.title,
          department: positionUpdate.department
        })
        .eq("id", positionUpdate.id);

      if (positionUpdateError) {
        throw new Error(`Position sync failed: ${positionUpdateError.message}`);
      }
    }

    console.log("Microsoft sync complete!");
    response.status(200).json({
      ok: true,
      count: dbRows.length,
      positionUpdates: positionUpdates.length
    });
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
        const photoUrl = await uploadEmployeePhoto(buffer, contentType, `microsoft-${u.id}`);
        return { id: u.id, photoUrl };
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

function isMissingTableError(error) {
  const message = `${error?.message || ""} ${error?.details || ""}`.toLowerCase();
  return message.includes("schema cache") || message.includes("does not exist");
}
