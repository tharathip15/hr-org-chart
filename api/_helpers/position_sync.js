function normalizeText(value) {
    return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function normalizePersonId(value) {
    return typeof value === "string" ? value.trim().toLowerCase() : "";
}

export function buildPositionSyncUpdates(
    existingPositions = [],
    existingEmployees = [],
    syncedEmployees = [],
    microsoftPersonIds = []
) {
    const microsoftIds = new Set(
        [...microsoftPersonIds].map(normalizePersonId).filter(Boolean)
    );
    const previousById = new Map(
        existingEmployees.map(employee => [Number(employee.id), employee])
    );
    const syncedById = new Map(
        syncedEmployees
            .filter(employee => microsoftIds.has(normalizePersonId(employee.person_id)))
            .map(employee => [Number(employee.id), employee])
    );

    return existingPositions.flatMap(position => {
        const employeeId = Number(position.employee_id);
        const previousEmployee = previousById.get(employeeId);
        const syncedEmployee = syncedById.get(employeeId);

        if (!previousEmployee || !syncedEmployee) return [];

        // Only update seats that were still mirroring the employee's previous role.
        // A different title represents an intentional position-plan override.
        if (normalizeText(position.title) !== normalizeText(previousEmployee.role)) {
            return [];
        }

        const nextTitle = typeof syncedEmployee.role === "string"
            ? syncedEmployee.role.trim()
            : "";
        const departmentMirrorsEmployee =
            normalizeText(position.department) === normalizeText(previousEmployee.department);
        const nextDepartment = departmentMirrorsEmployee && typeof syncedEmployee.department === "string"
            ? syncedEmployee.department.trim()
            : position.department;

        if (!nextTitle || (nextTitle === position.title && nextDepartment === position.department)) {
            return [];
        }

        return [{
            id: position.id,
            title: nextTitle,
            department: nextDepartment
        }];
    });
}
