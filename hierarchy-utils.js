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

    function clearOverviewMetadata(position) {
        const next = { ...position };
        delete next.overviewGroupId;
        delete next.overviewGroupTitle;
        delete next.overviewPrimaryPositionId;
        return next;
    }

    function groupPositionsForOverview(sourcePositions, memberIds, options = {}) {
        const positions = Array.isArray(sourcePositions)
            ? sourcePositions.map(position => ({ ...position }))
            : [];
        const requestedIds = [...new Set((memberIds || []).map(toInteger).filter(Number.isInteger))];
        const requestedMembers = positions.filter(position => requestedIds.includes(toInteger(position.id)));
        const primaryId = toInteger(options.primaryPositionId);
        const title = String(options.title || "").trim();

        if (requestedMembers.length < 2 || requestedMembers.length !== requestedIds.length) {
            return { positions, changed: false, error: "need_at_least_two_positions" };
        }

        const existingIds = [...new Set(requestedMembers.map(position => position.overviewGroupId).filter(Boolean))];
        if (existingIds.length > 1) {
            return { positions, changed: false, error: "conflicting_groups" };
        }

        const groupId = existingIds.length === 1 ? existingIds[0] : `overview-${primaryId}`;
        const memberIdsToUpdate = new Set(requestedIds);
        if (existingIds.length === 1) {
            positions.forEach(position => {
                if (position.overviewGroupId === groupId) memberIdsToUpdate.add(toInteger(position.id));
            });
        }
        const members = positions.filter(position => memberIdsToUpdate.has(toInteger(position.id)));

        if (!members.some(position => toInteger(position.id) === primaryId)) {
            return { positions, changed: false, error: "invalid_primary_id" };
        }
        if (!title) return { positions, changed: false, error: "missing_title" };

        const employeeIds = new Set(members.map(position => toInteger(position.employeeId)));
        if (employeeIds.size !== 1 || employeeIds.has(null)) {
            return { positions, changed: false, error: "different_employees" };
        }
        const managerIds = new Set(members.map(position => toInteger(position.managerId)));
        if (managerIds.size !== 1) {
            return { positions, changed: false, error: "different_managers" };
        }

        const nextPositions = positions.map(position => memberIdsToUpdate.has(toInteger(position.id))
            ? {
                ...position,
                overviewGroupId: groupId,
                overviewGroupTitle: title,
                overviewPrimaryPositionId: primaryId
            }
            : position
        );

        return {
            positions: nextPositions,
            changed: true,
            groupId,
            primaryPosition: nextPositions.find(position => toInteger(position.id) === primaryId)
        };
    }

    function ungroupOverviewPositions(sourcePositions, groupId) {
        const positions = Array.isArray(sourcePositions)
            ? sourcePositions.map(position => ({ ...position }))
            : [];
        const matchingPositions = positions.filter(position => position.overviewGroupId === groupId);

        if (!groupId || matchingPositions.length === 0) {
            return { positions, changed: false, error: "invalid_group_id" };
        }

        return {
            positions: positions.map(position => position.overviewGroupId === groupId
                ? clearOverviewMetadata(position)
                : position
            ),
            changed: true
        };
    }

    function buildOverviewDisplayModel(allPositions, visiblePositions, effectiveManagerByRealId) {
        const all = Array.isArray(allPositions) ? allPositions : [];
        const visible = Array.isArray(visiblePositions) ? visiblePositions : [];
        const managers = effectiveManagerByRealId instanceof Map
            ? effectiveManagerByRealId
            : new Map();
        const groupsById = new Map();

        function getGroupId(position) {
            return String(position?.overviewGroupId || "").trim();
        }

        function getEffectiveManagerId(position) {
            const id = toInteger(position?.id);
            const value = managers.has(position?.id)
                ? managers.get(position.id)
                : managers.has(id)
                    ? managers.get(id)
                    : position?.managerId;
            return toInteger(value);
        }

        all.forEach(position => {
            const groupId = getGroupId(position);
            if (!groupId) return;
            const members = groupsById.get(groupId) || [];
            members.push(position);
            groupsById.set(groupId, members);
        });

        const validGroupByRealId = new Map();
        groupsById.forEach(members => {
            const employeeIds = new Set(members.map(position => toInteger(position.employeeId)));
            const managerIds = new Set(members.map(getEffectiveManagerId));
            const titles = new Set(members.map(position => String(position.overviewGroupTitle || "").trim()));
            const primaryIds = new Set(members.map(position => toInteger(position.overviewPrimaryPositionId)));
            const [primaryId] = primaryIds;
            const isValid = members.length >= 2 &&
                employeeIds.size === 1 && !employeeIds.has(null) &&
                managerIds.size === 1 &&
                titles.size === 1 && !titles.has("") &&
                primaryIds.size === 1 && primaryId !== null &&
                members.some(position => toInteger(position.id) === primaryId);

            if (!isValid) return;
            const group = { members, primaryId, title: [...titles][0] };
            members.forEach(position => validGroupByRealId.set(toInteger(position.id), group));
        });

        const visibleMembersByGroup = new Map();
        visible.forEach(position => {
            const group = validGroupByRealId.get(toInteger(position.id));
            if (!group) return;
            const members = visibleMembersByGroup.get(group) || [];
            members.push(position);
            visibleMembersByGroup.set(group, members);
        });

        const displayPositions = [];
        const realToDisplayId = new Map();
        const membersByDisplayId = new Map();
        const effectiveManagerByDisplayId = new Map();
        const emittedGroups = new Set();

        visible.forEach(position => {
            const realId = toInteger(position.id);
            const group = validGroupByRealId.get(realId);
            if (!group) {
                displayPositions.push(position);
                realToDisplayId.set(realId, realId);
                membersByDisplayId.set(realId, [position]);
                return;
            }

            if (emittedGroups.has(group)) return;
            emittedGroups.add(group);
            const visibleMembers = visibleMembersByGroup.get(group) || [];
            const representative = visibleMembers.find(member => toInteger(member.id) === group.primaryId) || visibleMembers[0];
            const representativeId = toInteger(representative.id);
            const memberIds = visibleMembers.map(member => toInteger(member.id)).sort((a, b) => a - b);

            displayPositions.push({
                ...representative,
                displayTitle: group.title,
                overviewGroupMemberIds: memberIds
            });
            group.members.forEach(member => realToDisplayId.set(toInteger(member.id), representativeId));
            membersByDisplayId.set(representativeId, [...visibleMembers]);
        });

        visible.forEach(position => {
            const displayId = realToDisplayId.get(toInteger(position.id));
            if (displayId === undefined || effectiveManagerByDisplayId.has(displayId)) return;
            const realManagerId = getEffectiveManagerId(position);
            const displayManagerId = realManagerId === null
                ? null
                : realToDisplayId.get(realManagerId) ?? realManagerId;
            if (displayManagerId !== displayId) {
                effectiveManagerByDisplayId.set(displayId, displayManagerId);
            }
        });

        return {
            displayPositions,
            realToDisplayId,
            membersByDisplayId,
            effectiveManagerByDisplayId
        };
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

        let primaryPosition = positions.find(position => toInteger(position.id) === primaryId);

        if (options.title) primaryPosition.title = String(options.title).trim();
        if (options.department) primaryPosition.department = String(options.department).trim();
        if (options.notes !== undefined) primaryPosition.notes = String(options.notes).trim();
        if (options.managerId !== undefined) {
            const managerId = toInteger(options.managerId);
            if (managerId !== primaryId) primaryPosition.managerId = managerId;
        }
        primaryPosition = clearOverviewMetadata(primaryPosition);
        positions[positions.findIndex(position => toInteger(position.id) === primaryId)] = primaryPosition;

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
        const originalPositions = positions.map(position => ({ ...position }));

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
        const originalTitle = primaryPosition.title;
        const originalGroupId = primaryPosition.overviewGroupId;
        const originalGroupTitle = String(primaryPosition.overviewGroupTitle || "").trim();
        const originalPrimaryId = toInteger(primaryPosition.overviewPrimaryPositionId);
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

        const existingGroupMembers = originalGroupId
            ? positions.filter(position => position.overviewGroupId === originalGroupId)
            : [];
        const hasValidExistingGroup = Boolean(
            originalGroupId &&
            originalGroupTitle &&
            originalPrimaryId !== null &&
            existingGroupMembers.some(position => toInteger(position.id) === originalPrimaryId)
        );
        const groupingResult = groupPositionsForOverview(
            positions,
            [targetId, ...createdPositions.map(position => toInteger(position.id))],
            {
                title: hasValidExistingGroup ? originalGroupTitle : originalTitle,
                primaryPositionId: hasValidExistingGroup ? originalPrimaryId : targetId
            }
        );
        if (!groupingResult.changed) {
            return { positions: originalPositions, changed: false, error: groupingResult.error };
        }
        const repairResult = repairPositionHierarchy(
            groupingResult.positions
        );

        return {
            positions: repairResult.positions,
            changed: true,
            primaryPosition: repairResult.positions.find(position => toInteger(position.id) === targetId),
            createdPositions: createdPositions.map(createdPosition => repairResult.positions.find(
                position => toInteger(position.id) === toInteger(createdPosition.id)
            ))
        };
    }

    root.OrgHierarchy = Object.freeze({
        repairPositionHierarchy,
        validatePositionParent,
        repairEmployeeManagers,
        isPrimaryEmployeePosition,
        getDescendantPositionIds,
        groupPositionsForOverview,
        ungroupOverviewPositions,
        buildOverviewDisplayModel,
        combinePositions,
        splitPosition
    });
})(globalThis);


