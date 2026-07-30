(function exposeMicrosoftSyncUi(root) {
    function asCount(value) {
        const count = Number(value);
        return Number.isFinite(count) ? count : 0;
    }

    function buildPreviewConfirmation(stats = {}, positionUpdates = 0) {
        return [
            "ตรวจสอบรายการ Sync Microsoft 365",
            "",
            `พนักงานปัจจุบัน: ${asCount(stats.existing)}`,
            `พบใน Microsoft 365: ${asCount(stats.microsoft)}`,
            `จับคู่กับ ID เดิม: ${asCount(stats.matched)}`,
            `เพิ่มใหม่: ${asCount(stats.added)}`,
            `เก็บข้อมูลเดิมที่ไม่พบใน Microsoft: ${asCount(stats.preserved)}`,
            `ลบพนักงาน: ${asCount(stats.removed)}`,
            `จำนวนหลัง Sync: ${asCount(stats.final)}`,
            `อัปเดตชื่อตำแหน่ง: ${asCount(positionUpdates)}`,
            "",
            "ยืนยันดำเนินการหรือไม่?"
        ].join("\n");
    }

    function getFailureMessage(result = {}) {
        const primary = result.error || "Sync failed";
        const reasons = Array.isArray(result.reasons)
            ? result.reasons.filter(Boolean)
            : [];
        return reasons.length > 0
            ? `${primary}: ${reasons.join("; ")}`
            : primary;
    }

    root.MicrosoftSyncUI = {
        buildPreviewConfirmation,
        getFailureMessage
    };
})(globalThis);
