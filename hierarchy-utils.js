(function attachOrgHierarchy(root) {
    function toInteger(value) {
        if (value === undefined || value === null || value === "") return null;
        const parsed = Number(value);
        return Number.isInteger(parsed) ? parsed : null;
    }

    function repairPositionHierarchy(sourcePositions) {
        const positions = Array.isArray(sourcePositions)
            ? sourcePositions.map(position => ({ ...position }))
            : [];
        const byId = new Map(positions.map(position => [toInteger(position.id), position]));
        const repairs = [];
        let changed = false;

        positions.forEach(position => {
            const id = toInteger(position.id);
            const managerId = toInteger(position.managerId);
            const isInvalid = managerId !== null && !byId.has(managerId);
            const isSelf = managerId !== null && managerId === id;
            if (isInvalid || isSelf || (position.managerId !== null && managerId === null)) {
                position.managerId = null;
                repairs.push({ type: isSelf ? "self" : "invalid", positionId: id });
                changed = true;
            } else if (position.managerId !== managerId) {
                position.managerId = managerId;
                changed = true;
            }
        });

        positions.forEach(start => {
            const path = [];
            const pathIndex = new Map();
            let current = start;

            while (current) {
                const currentId = toInteger(current.id);
                if (pathIndex.has(currentId)) {
                    const cycle = path.slice(pathIndex.get(currentId));
                    const breakId = Math.min(...cycle.map(position => toInteger(position.id)));
                    const breakPosition = byId.get(breakId);
                    if (breakPosition && breakPosition.managerId !== null) {
                        breakPosition.managerId = null;
                        repairs.push({ type: "cycle", positionId: breakId, cycle: cycle.map(position => toInteger(position.id)) });
                        changed = true;
                    }
                    break;
                }

                pathIndex.set(currentId, path.length);
                path.push(current);
                current = byId.get(toInteger(current.managerId)) || null;
            }
        });

        return { positions, changed, repairs };
    }

    function validatePositionParent(sourcePositions, positionId, parentId) {
        const positions = Array.isArray(sourcePositions) ? sourcePositions : [];
        const byId = new Map(positions.map(position => [toInteger(position.id), position]));
        const childId = toInteger(positionId);
        const candidateParentId = toInteger(parentId);

        if (candidateParentId === null) {
            return { valid: true, reason: null };
        }

        if (childId === null || !byId.has(childId) || !byId.has(candidateParentId)) {
            return { valid: false, reason: "missing" };
        }

        if (childId === candidateParentId) {
            return { valid: false, reason: "self" };
        }

        const visited = new Set();
        let current = byId.get(candidateParentId);
        while (current) {
            const currentId = toInteger(current.id);
            if (currentId === childId) {
                return { valid: false, reason: "descendant" };
            }
            if (visited.has(currentId)) break;
            visited.add(currentId);
            current = byId.get(toInteger(current.managerId)) || null;
        }

        return { valid: true, reason: null };
    }

    function repairEmployeeManagers(sourceEmployees) {
        const employees = Array.isArray(sourceEmployees)
            ? sourceEmployees.map(employee => ({ ...employee }))
            : [];
        const employeeIds = new Set(employees.map(employee => toInteger(employee.id)));
        let changed = false;

        employees.forEach(employee => {
            const managerId = toInteger(employee.managerId);
            const nextManagerId = managerId !== null && managerId !== toInteger(employee.id) && employeeIds.has(managerId)
                ? managerId
                : null;
            if (employee.managerId !== nextManagerId) changed = true;
            employee.managerId = nextManagerId;
        });

        return { employees, changed };
    }

    function isPrimaryEmployeePosition(positions, positionId, employeeId) {
        const primary = (positions || []).find(position => toInteger(position.employeeId) === toInteger(employeeId));
        return Boolean(primary && toInteger(primary.id) === toInteger(positionId));
    }

    function getDescendantPositionIds(sourcePositions, rootId) {
        const positions = Array.isArray(sourcePositions) ? sourcePositions : [];
        const rootPositionId = toInteger(rootId);
        if (rootPositionId === null) return [];

        const childrenByManager = new Map();
        positions.forEach(position => {
            const managerId = toInteger(position.managerId);
            if (managerId === null) return;
            const children = childrenByManager.get(managerId) || [];
            children.push(toInteger(position.id));
            childrenByManager.set(managerId, children);
        });

        const knownIds = new Set(positions.map(position => toInteger(position.id)));
        if (!knownIds.has(rootPositionId)) return [];

        const visited = new Set();
        const result = [];
        function visit(positionId) {
            if (visited.has(positionId)) return;
            visited.add(positionId);
            result.push(positionId);
            (childrenByManager.get(positionId) || []).forEach(visit);
        }

        visit(rootPositionId);
        return result;
    }

    function combinePositions(sourcePositions, primaryPositionId, secondaryPositionIds, options = {}) {
        const positions = Array.isArray(sourcePositions)
            ? sourcePositions.map(position => ({ ...position }))
            : [];

        const primaryId = toInteger(primaryPositionId);
        const secIds = new Set(
            (Array.isArray(secondaryPositionIds) ? secondaryPositionIds : [secondaryPositionIds])
                .map(toInteger)
                .filter(id => id !== null && id !== primaryId)
        );

        if (primaryId === null || !positions.some(position => toInteger(position.id) === primaryId)) {
            return { positions, changed: false, error: "invalid_primary_id" };
        }

        const primaryPosition = positions.find(position => toInteger(position.id) === primaryId);

        if (options.title) primaryPosition.title = String(options.title).trim();
        if (options.department) primaryPosition.department = String(options.department).trim();
        if (options.notes !== undefined) primaryPosition.notes = String(options.notes).trim();
        if (options.managerId !== undefined) {
            const managerId = toInteger(options.managerId);
            if (managerId !== primaryId) primaryPosition.managerId = managerId;
        }

        positions.forEach(position => {
            const currentManagerId = toInteger(position.managerId);
            if (currentManagerId !== null && secIds.has(currentManagerId)) {
                position.managerId = primaryId;
            }
        });

        const nextPositions = positions.filter(position => !secIds.has(toInteger(position.id)));
        const repairResult = repairPositionHierarchy(nextPositions);

        return {
            positions: repairResult.positions,
            changed: true,
            primaryPosition: repairResult.positions.find(position => toInteger(position.id) === primaryId) || primaryPosition
        };
    }

    function splitPosition(sourcePositions, positionId, splitTitles, options = {}) {
        const positions = Array.isArray(sourcePositions)
            ? sourcePositions.map(position => ({ ...position }))
            : [];

        const targetId = toInteger(positionId);
        if (targetId === null || !positions.some(position => toInteger(position.id) === targetId)) {
            return { positions, changed: false, error: "invalid_position_id" };
        }

        const titles = (Array.isArray(splitTitles) ? splitTitles : [])
            .map(t => String(t || "").trim())
            .filter(Boolean);

        if (titles.length < 2) {
            return { positions, changed: false, error: "need_at_least_two_titles" };
        }

        const primaryPosition = positions.find(position => toInteger(position.id) === targetId);
        primaryPosition.title = titles[0];

        const createdPositions = [];
        let maxId = Math.max(...positions.map(p => toInteger(p.id) || 0), 0);

        for (let i = 1; i < titles.length; i++) {
            maxId += 1;
            const manualLayouts = Object.fromEntries(
                Object.entries(primaryPosition.manualLayouts || {}).map(([scope, coordinates]) => {
                    const sourceX = Number(coordinates?.x);
                    const sourceY = Number(coordinates?.y);
                    return [
                        scope,
                        {
                            x: (Number.isFinite(sourceX) ? sourceX : 0) + (i * 260),
                            y: Number.isFinite(sourceY) ? sourceY : 0
                        }
                    ];
                })
            );
            const sourceX = Number(primaryPosition.x);
            const sourceY = Number(primaryPosition.y);
            const newPos = {
                ...primaryPosition,
                id: maxId,
                title: titles[i],
                x: (Number.isFinite(sourceX) ? sourceX : 200) + (i * 260),
                y: Number.isFinite(sourceY) ? sourceY : 150,
                manualLayouts
            };
            delete newPos.renderX;
            delete newPos.renderY;
            positions.push(newPos);
            createdPositions.push(newPos);
        }

        const repairResult = repairPositionHierarchy(positions);

        return {
            positions: repairResult.positions,
            changed: true,
            primaryPosition,
            createdPositions
        };
    }

    root.OrgHierarchy = Object.freeze({
        repairPositionHierarchy,
        validatePositionParent,
        repairEmployeeManagers,
        isPrimaryEmployeePosition,
        getDescendantPositionIds,
        combinePositions,
        splitPosition
    });
})(globalThis);


