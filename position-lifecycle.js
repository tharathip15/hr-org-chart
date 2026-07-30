(function attachPositionLifecycle(root) {
    const VALID_STATUSES = new Set(["active", "future", "closed"]);

    function normalizeStatus(value) {
        const status = String(value || "").trim().toLowerCase();
        return VALID_STATUSES.has(status) ? status : "active";
    }

    function normalizeDate(value) {
        const date = String(value || "").trim();
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return "";

        const [year, month, day] = date.split("-").map(Number);
        const parsed = new Date(Date.UTC(year, month - 1, day));
        return parsed.getUTCFullYear() === year
            && parsed.getUTCMonth() === month - 1
            && parsed.getUTCDate() === day
            ? date
            : "";
    }

    function getTodayKey(date = new Date()) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    }

    function isPositionVisible(position, mode = "current", todayKey = getTodayKey()) {
        const status = normalizeStatus(position?.status);
        const effectiveDate = normalizeDate(position?.effectiveDate);
        const normalizedMode = mode === "future" ? "future" : "current";

        if (normalizedMode === "future") {
            return status !== "closed";
        }

        if (status === "active") return true;
        if (status === "future") {
            return Boolean(effectiveDate && effectiveDate <= todayKey);
        }

        return Boolean(effectiveDate && effectiveDate > todayKey);
    }

    function filterVisiblePositions(positions, mode = "current", todayKey = getTodayKey()) {
        return (Array.isArray(positions) ? positions : [])
            .filter(position => isPositionVisible(position, mode, todayKey));
    }

    function getNearestVisibleManagerId(position, positions, visiblePositionIds, positionById = null) {
        const positionList = Array.isArray(positions) ? positions : [];
        const byId = positionById instanceof Map
            ? positionById
            : new Map(positionList.map(candidate => [Number(candidate.id), candidate]));
        const visibleIds = visiblePositionIds instanceof Set
            ? visiblePositionIds
            : new Set(Array.from(visiblePositionIds || []).map(Number));
        const visited = new Set([Number(position?.id)]);
        let managerId = position?.managerId === null || position?.managerId === undefined
            ? null
            : Number(position.managerId);

        while (Number.isInteger(managerId) && !visited.has(managerId)) {
            if (visibleIds.has(managerId)) return managerId;
            visited.add(managerId);
            const manager = byId.get(managerId);
            if (!manager || manager.managerId === null || manager.managerId === undefined) return null;
            managerId = Number(manager.managerId);
        }

        return null;
    }

    function getStatusLabel(value) {
        const labels = {
            active: "Active",
            future: "Future plan",
            closed: "Closed"
        };
        return labels[normalizeStatus(value)];
    }

    const api = {
        normalizeStatus,
        normalizeDate,
        getTodayKey,
        isPositionVisible,
        filterVisiblePositions,
        getNearestVisibleManagerId,
        getStatusLabel
    };

    if (typeof module !== "undefined" && module.exports) module.exports = api;
    root.PositionLifecycle = api;
})(typeof globalThis !== "undefined" ? globalThis : window);
