import assert from "node:assert/strict";
import test from "node:test";

await import("../microsoft-sync-ui.js").catch(() => {});
const syncUi = globalThis.MicrosoftSyncUI;

test("Microsoft sync preview confirmation shows every safety-relevant count", () => {
    assert.equal(typeof syncUi?.buildPreviewConfirmation, "function");

    const message = syncUi.buildPreviewConfirmation({
        existing: 45,
        microsoft: 41,
        matched: 41,
        added: 0,
        preserved: 4,
        final: 45,
        removed: 0
    }, 3);

    assert.match(message, /พนักงานปัจจุบัน: 45/);
    assert.match(message, /พบใน Microsoft 365: 41/);
    assert.match(message, /จับคู่กับ ID เดิม: 41/);
    assert.match(message, /เพิ่มใหม่: 0/);
    assert.match(message, /เก็บข้อมูลเดิมที่ไม่พบใน Microsoft: 4/);
    assert.match(message, /ลบพนักงาน: 0/);
    assert.match(message, /อัปเดตชื่อตำแหน่ง: 3/);
});

test("Microsoft sync failure includes server safety reasons", () => {
    assert.equal(typeof syncUi?.getFailureMessage, "function");
    assert.equal(
        syncUi.getFailureMessage({
            error: "Sync blocked",
            reasons: [
                "Microsoft Graph returned no employees.",
                "Existing Microsoft identities were not matched."
            ]
        }),
        "Sync blocked: Microsoft Graph returned no employees.; Existing Microsoft identities were not matched."
    );
});
