(function attachConnectionRouting(root) {
    const OVERVIEW_SCOPE = "__overview__";
    const MAX_OFFSET = 4000;

    function finite(value, fallback = 0) {
        const number = Number(value);
        return Number.isFinite(number) ? number : fallback;
    }

    function clampOffset(value) {
        return Math.max(-MAX_OFFSET, Math.min(MAX_OFFSET, finite(value)));
    }

    function getScopeKey(selectedView, chartMode = "current") {
        if (root.ChartViewScope?.getStorageScopeKey) {
            return root.ChartViewScope.getStorageScopeKey(selectedView, chartMode);
        }
        return selectedView === "All" ? OVERVIEW_SCOPE : String(selectedView || "").trim();
    }

    function normalizeRoute(route) {
        const parentId = Number(route?.parentId);
        if (!Number.isInteger(parentId)) return null;
        const branchOffsetX = clampOffset(route?.branchOffsetX);
        const branchOffsetY = clampOffset(route?.branchOffsetY);
        const laneOffsetY = clampOffset(route?.laneOffsetY);
        const result = { parentId, branchOffsetX, laneOffsetY };
        if (branchOffsetY !== 0) {
            result.branchOffsetY = branchOffsetY;
        }
        return result;
    }

    function normalizeRoutes(value) {
        if (!value || typeof value !== "object" || Array.isArray(value)) return {};
        return Object.fromEntries(Object.entries(value).flatMap(([scope, route]) => {
            const normalized = normalizeRoute(route);
            return scope && normalized ? [[scope, normalized]] : [];
        }));
    }

    function getScopedRoute(routes, scopeKey, parentId) {
        const route = normalizeRoutes(routes)[scopeKey];
        return route && route.parentId === Number(parentId) ? route : null;
    }

    function pointsToPathData(points) {
        return points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");
    }

    function calculateRoute({ parentRect = {}, childRect = {}, minChildY, layoutStyle, parentId, route } = {}) {
        const parent = {
            x: finite(parentRect.x), y: finite(parentRect.y), width: finite(parentRect.width), height: finite(parentRect.height)
        };
        const child = {
            x: finite(childRect.x), y: finite(childRect.y), width: finite(childRect.width), height: finite(childRect.height)
        };
        const selectedRoute = normalizeRoute(route);
        const manualRoute = selectedRoute?.parentId === Number(parentId) ? selectedRoute : null;
        const offsets = { branchOffsetX: 0, branchOffsetY: 0, laneOffsetY: 0, ...manualRoute };
        const automatic = !manualRoute;

        if (layoutStyle === "vertical") {
            const start = { x: parent.x + parent.width, y: parent.y + parent.height / 2 };
            const end = { x: child.x, y: child.y + child.height / 2 };
            const automaticLaneX = start.x + Math.max(20, (end.x - start.x) / 2);
            const branchX = automaticLaneX + offsets.branchOffsetX;
            const laneY = end.y + offsets.laneOffsetY;
            const points = [
                start,
                { x: automaticLaneX, y: start.y },
                { x: branchX, y: start.y },
                { x: branchX, y: laneY },
                { x: end.x, y: laneY },
                end
            ];
            return {
                points,
                pathData: pointsToPathData(points),
                branchHandle: { x: branchX, y: start.y },
                laneHandle: { x: branchX, y: laneY },
                automatic
            };
        }

        const start = { x: parent.x + parent.width / 2, y: parent.y + parent.height };
        const end = { x: child.x + child.width / 2, y: child.y };
        const automaticLaneY = start.y + Math.max(20, (finite(minChildY, end.y) - start.y) / 2);
        const laneY = Math.max(start.y + 25, automaticLaneY + offsets.laneOffsetY);

        let branchY = start.y + 20 + offsets.branchOffsetY;
        branchY = Math.max(start.y + 10, Math.min(laneY - 5, branchY));

        let branchX = start.x + offsets.branchOffsetX;
        if (Math.abs(branchX - start.x) < 10) {
            branchX = start.x;
        }

        const points = [
            start,
            { x: start.x, y: branchY },
            { x: branchX, y: branchY },
            { x: branchX, y: laneY },
            { x: end.x, y: laneY },
            end
        ];
        return {
            points,
            pathData: pointsToPathData(points),
            branchHandle: { x: branchX, y: branchY },
            laneHandle: { x: branchX, y: laneY },
            automatic
        };
    }

    function setScopedRoute(routes, scopeKey, route) {
        const normalized = normalizeRoute(route);
        if (!scopeKey || !normalized) return normalizeRoutes(routes);
        return { ...normalizeRoutes(routes), [scopeKey]: normalized };
    }

    function clearScopedRoute(routes, scopeKey) {
        const normalized = normalizeRoutes(routes);
        if (!scopeKey) return normalized;
        const { [scopeKey]: removed, ...remaining } = normalized;
        return remaining;
    }

    function clearScopeFromPositions(positions, scopeKey) {
        return Array.isArray(positions) ? positions.map(position => ({
            ...position,
            connectionRoutes: clearScopedRoute(position?.connectionRoutes, scopeKey)
        })) : [];
    }

    function getCapabilities({ canEdit, locked, presentation } = {}) {
        const selectable = Boolean(canEdit) && !presentation;
        const mutable = selectable && !locked;
        return { selectable, draggable: mutable, resettable: mutable };
    }

    function beginDrag({ kind, pointerId, startPoint, route } = {}) {
        return Object.freeze({
            kind: kind === "lane" ? "lane" : "branch",
            pointerId,
            startPoint: Object.freeze({ x: finite(startPoint?.x), y: finite(startPoint?.y) }),
            route: Object.freeze(normalizeRoute(route))
        });
    }

    function updateDrag(dragState, canvasPoint) {
        const route = normalizeRoute(dragState?.route);
        if (!route) return null;
        const start = dragState.startPoint || {};
        if (dragState.kind === "lane") {
            return normalizeRoute({
                ...route,
                laneOffsetY: clampOffset(route.laneOffsetY + finite(canvasPoint?.y) - finite(start.y))
            });
        }
        const rawOffsetX = route.branchOffsetX + finite(canvasPoint?.x) - finite(start.x);
        const rawOffsetY = (route.branchOffsetY || 0) + finite(canvasPoint?.y) - finite(start.y);
        const snappedX = Math.abs(rawOffsetX) < 10 ? 0 : rawOffsetX;
        return normalizeRoute({
            ...route,
            branchOffsetX: clampOffset(snappedX),
            branchOffsetY: clampOffset(rawOffsetY)
        });
    }

    root.ConnectionRouting = Object.freeze({
        getScopeKey,
        normalizeRoutes,
        getScopedRoute,
        calculateRoute,
        setScopedRoute,
        clearScopedRoute,
        clearScopeFromPositions,
        getCapabilities,
        beginDrag,
        updateDrag
    });
})(globalThis);
