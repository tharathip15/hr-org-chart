(function attachOperationView(root) {
  function toPositionId(value) {
    if (value === null || value === undefined || value === "") return null;
    const id = Number(value);
    return Number.isInteger(id) ? id : null;
  }

  function buildSubtree(allPositions, visiblePositions, rootPositionId) {
    const all = Array.isArray(allPositions) ? allPositions : [];
    const visible = Array.isArray(visiblePositions) ? visiblePositions : [];
    const rootId = toPositionId(rootPositionId);
    if (rootId === null) return empty("unconfigured");

    const byId = new Map(all.map(position => [toPositionId(position?.id), position]));
    const rootPosition = byId.get(rootId);
    if (!rootPosition) return empty("missing");

    const visibleIds = new Set(visible.map(position => toPositionId(position?.id)));
    if (!visibleIds.has(rootId)) return { ...empty("hidden"), rootPosition };

    const childrenByManager = new Map();
    all.forEach(position => {
      const id = toPositionId(position?.id);
      const managerId = toPositionId(position?.managerId);
      if (id === null || managerId === null) return;
      const children = childrenByManager.get(managerId) || [];
      children.push(id);
      childrenByManager.set(managerId, children);
    });

    const realPositionIds = new Set();
    const cyclePositionIds = new Set();
    const visit = (id, path = new Set()) => {
      if (path.has(id)) {
        cyclePositionIds.add(id);
        return;
      }
      if (realPositionIds.has(id)) return;
      realPositionIds.add(id);
      const nextPath = new Set(path).add(id);
      (childrenByManager.get(id) || []).forEach(childId => {
        if (nextPath.has(childId)) cyclePositionIds.add(id);
        visit(childId, nextPath);
      });
    };
    visit(rootId);

    return {
      status: "ready",
      rootPosition,
      realPositionIds,
      visiblePositions: visible.filter(position => realPositionIds.has(toPositionId(position?.id))),
      cyclePositionIds
    };
  }

  function empty(status) {
    return {
      status,
      rootPosition: null,
      realPositionIds: new Set(),
      visiblePositions: [],
      cyclePositionIds: new Set()
    };
  }

  root.OperationView = Object.freeze({ buildSubtree });
})(globalThis);
