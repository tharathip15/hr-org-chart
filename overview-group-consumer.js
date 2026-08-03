(function attachOverviewGroupConsumer(root) {
    function toInteger(value) {
        if (value === undefined || value === null || value === "") return null;
        const parsed = Number(value);
        return Number.isInteger(parsed) ? parsed : null;
    }

    function getMapValue(map, displayPositionId) {
        if (!(map instanceof Map)) return undefined;
        if (map.has(displayPositionId)) return map.get(displayPositionId);

        const normalizedId = toInteger(displayPositionId);
        return normalizedId !== null && map.has(normalizedId)
            ? map.get(normalizedId)
            : undefined;
    }

    function getMembers(renderModel, mapName, displayPositionId, fallbackPosition) {
        const mappedMembers = getMapValue(renderModel?.[mapName], displayPositionId);
        if (Array.isArray(mappedMembers)) return [...mappedMembers];
        return fallbackPosition ? [fallbackPosition] : [];
    }

    function buildRenderModel(sourcePositions, visiblePositions) {
        const all = Array.isArray(sourcePositions) ? sourcePositions : [];
        const visible = Array.isArray(visiblePositions) ? visiblePositions : [];
        const hierarchy = root.OrgHierarchy;
        const visibleIds = new Set(visible.map(position => position?.id));
        const overviewEffectiveManagerByRealId = hierarchy.buildEffectiveManagerByRealId(all, visibleIds);

        return {
            ...hierarchy.buildOverviewDisplayModel(all, visible, overviewEffectiveManagerByRealId),
            overviewEffectiveManagerByRealId
        };
    }

    function getVisibleMembers(renderModel, displayPositionId, fallbackPosition) {
        return getMembers(renderModel, "membersByDisplayId", displayPositionId, fallbackPosition);
    }

    function getProfileMembers(renderModel, displayPositionId, fallbackPosition) {
        return getMembers(renderModel, "allMembersByDisplayId", displayPositionId, fallbackPosition);
    }

    function getGroupedDragPositionIds(sourcePositions, renderModel, displayPositionId) {
        const members = getProfileMembers(renderModel, displayPositionId, null);
        const memberIds = members
            .map(position => toInteger(position?.id))
            .filter(Number.isInteger);
        if (memberIds.length <= 1) return null;

        return root.OrgHierarchy.getOverviewDragPositionIds(
            sourcePositions,
            displayPositionId,
            memberIds
        );
    }

    root.OverviewGroupConsumer = Object.freeze({
        buildRenderModel,
        getVisibleMembers,
        getProfileMembers,
        getGroupedDragPositionIds
    });
})(globalThis);
