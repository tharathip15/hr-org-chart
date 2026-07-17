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

    function getNextEmployeeId(employees) {
        const numericIds = (employees || [])
            .map(employee => Number(employee.id))
            .filter(Number.isFinite);
        return numericIds.length > 0 ? Math.max(...numericIds) + 1 : 1;
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

    function addManualEmployee(employees, positions, fields) {
        const employee = createManualEmployee({
            ...fields,
            id: getNextEmployeeId(employees)
        });
        return {
            employee,
            employees: [...(employees || []), employee],
            positions
        };
    }

    function detachEmployeeFromPositions(employeeId, positions) {
        return (positions || []).map(position => (
            Number(position.employeeId) === Number(employeeId)
                ? { ...position, employeeId: null }
                : { ...position }
        ));
    }

    function getStaffingSummary(employees, positions) {
        const people = Array.isArray(employees) ? employees : [];
        const seats = Array.isArray(positions) ? positions : [];
        const vacantPositions = seats
            .filter(position => {
                if (position?.employeeId === null || position?.employeeId === undefined) return true;
                return !people.some(employee => employee?.id === position.employeeId);
            })
            .map(position => ({
                id: position?.id ?? null,
                title: String(position?.title || "Open Position").trim() || "Open Position",
                department: String(position?.department || "Unassigned").trim() || "Unassigned"
            }))
            .sort((a, b) => {
                const departmentOrder = a.department.localeCompare(b.department);
                return departmentOrder !== 0
                    ? departmentOrder
                    : a.title.localeCompare(b.title);
            });

        return {
            employeeCount: people.length,
            positionCount: seats.length,
            vacantCount: vacantPositions.length,
            vacantPositions
        };
    }

    root.EmployeeDirectory = Object.freeze({
        createManualPersonId,
        getEmployeeSource,
        getAssignmentSummary,
        getNextEmployeeId,
        createManualEmployee,
        addManualEmployee,
        detachEmployeeFromPositions,
        getStaffingSummary
    });
})(globalThis);
