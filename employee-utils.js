(function attachEmployeeDirectory(root) {
    function createManualPersonId(name, id) {
        const slug = String(name || "employee").trim().toLowerCase()
            .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "employee";
        return `manual-${slug}-${id}`;
    }

    function getEmployeeSource(employee) {
        const personId = String(employee?.personId || "").trim().toLowerCase();
        return !personId || personId.startsWith("manual-") || personId.startsWith("person-")
            ? "manual" : "microsoft";
    }

    function getAssignmentSummary(employeeId, positions) {
        const positionIds = (positions || [])
            .filter(position => Number(position.employeeId) === Number(employeeId))
            .map(position => Number(position.id));
        return {
            count: positionIds.length,
            positionIds,
            status: positionIds.length > 0 ? "assigned" : "unassigned"
        };
    }

    function createManualEmployee(fields) {
        return {
            id: fields.id,
            personId: createManualPersonId(fields.name, fields.id),
            name: fields.name,
            role: fields.role,
            department: fields.department,
            managerId: fields.managerId ?? null,
            email: fields.email || "",
            phone: fields.phone || "",
            bio: fields.bio || "",
            photoUrl: fields.photoUrl || "",
            avatarColor: fields.avatarColor || ""
        };
    }

    function detachEmployeeFromPositions(employeeId, positions) {
        return (positions || []).map(position => (
            Number(position.employeeId) === Number(employeeId)
                ? { ...position, employeeId: null }
                : { ...position }
        ));
    }

    root.EmployeeDirectory = Object.freeze({
        createManualPersonId,
        getEmployeeSource,
        getAssignmentSummary,
        createManualEmployee,
        detachEmployeeFromPositions
    });
})(globalThis);
