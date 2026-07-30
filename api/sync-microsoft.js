import { supabase } from "./_helpers/supabase.js";
import { requireEditorWithCsrf } from "./_helpers/session.js";
import { buildPositionSyncUpdates } from "./_helpers/position_sync.js";
import { normalizePhotoRows, uploadEmployeePhoto } from "./_helpers/photo_storage.js";
import {
  buildMicrosoftSyncPlan,
  executeMicrosoftSyncPlan
} from "./_helpers/microsoft_sync_plan.js";
import { upsertMicrosoftEmployeeRows } from "./_helpers/microsoft_sync_storage.js";
import { createSnapshotAndLog } from "./_helpers/history_helper.js";

const tenantId = process.env.MICROSOFT_TENANT_ID;
const clientId = process.env.MICROSOFT_CLIENT_ID;
const clientSecret = process.env.MICROSOFT_CLIENT_SECRET;

export default async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    response.status(405).json({ ok: false, error: "Method not allowed" });
    return;
  }
  if (!requireEditorWithCsrf(request, response)) return;

  try {
    if (!tenantId || !clientId || !clientSecret) {
      throw new Error("Missing Microsoft API configuration environment variables.");
    }
    const mode = new URL(request.url, "http://localhost")
      .searchParams
      .get("mode") || "preview";
    if (mode !== "preview" && mode !== "apply") {
      response.status(400).json({ ok: false, error: "Unsupported Microsoft sync mode." });
      return;
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

    // 4. Fetch existing database records to perform a non-destructive merge.
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

    // 6. Build a deterministic plan. Existing IDs and every unmatched local
    // record are retained; new users only receive IDs above the current max.
    const syncPlan = buildMicrosoftSyncPlan(existingEmployees || [], realPeople);
    syncPlan.rows = syncPlan.rows.map(row => ({
      ...row,
      avatar_color: row.avatar_color || getDeptColor(row.department || "General")
    }));

    const microsoftPersonIds = new Set(
      realPeople.map(user => String(user.id || "").trim().toLowerCase())
    );
    const positionUpdates = buildPositionSyncUpdates(
      existingPositions,
      existingEmployees || [],
      syncPlan.rows,
      microsoftPersonIds
    );

    console.log("Microsoft sync plan:", {
      mode,
      ...syncPlan.stats,
      positionUpdates: positionUpdates.length
    });

    const syncResult = await executeMicrosoftSyncPlan({
      mode,
      plan: syncPlan,
      positionUpdates,
      persist: async ({ rows, positionUpdates: reviewedPositionUpdates }) => {
        // Keep an immediately restorable state before any write.
        await createSnapshotAndLog(
          "microsoft_sync_pre_apply",
          `Before Microsoft sync (${rows.length} planned employees)`
        );

        // Photos are intentionally fetched only after Preview has been approved.
        console.log("Fetching Microsoft profile photos...");
        const fetchedPhotos = await fetchPhotosForUsers(realPeople, accessToken);
        const photosByUserId = new Map(
          [...fetchedPhotos].map(([userId, photoUrl]) => [
            String(userId || "").trim().toLowerCase(),
            photoUrl
          ])
        );
        const userIdByEmployeeId = new Map(
          syncPlan.links.map(link => [Number(link.employeeId), link.userId])
        );
        let rowsWithPhotos = rows.map(row => {
          const userId = userIdByEmployeeId.get(Number(row.id));
          const photoUrl = userId ? photosByUserId.get(userId) : null;
          return photoUrl ? { ...row, photo_url: photoUrl } : row;
        });

        // Keep legacy Base64 payloads out of the employees table.
        rowsWithPhotos = await normalizePhotoRows(
          rowsWithPhotos,
          row => row.person_id || row.id
        );

        // The old implementation deleted all rows before inserting. Upsert
        // makes the operation non-destructive and keeps stable employee IDs.
        console.log("Upserting Microsoft employee profiles...");
        await upsertMicrosoftEmployeeRows(supabase, rowsWithPhotos);

        if (reviewedPositionUpdates.length > 0) {
          await Promise.all(reviewedPositionUpdates.map(async positionUpdate => {
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
          }));
        }
      }
    });

    const status = syncResult.safe ? 200 : 409;
    response.status(status).json({
      ...syncResult,
      count: syncResult.stats.final
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
