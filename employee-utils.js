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

    function getPositionNoteText(position) {
        const rawNote = String(position?.notes || "").trim();
        if (!rawNote.startsWith("{") || !rawNote.endsWith("}")) return rawNote;

        try {
            const parsed = JSON.parse(rawNote);
            return String(parsed?.text || "").trim();
        } catch (error) {
            return rawNote;
        }
    }

    function isActingPosition(position) {
        return /\bacting\b|รักษาการ/i.test(getPositionNoteText(position));
    }

    function getStaffingSummary(employees, positions) {
        const people = Array.isArray(employees) ? employees : [];
        const seats = Array.isArray(positions) ? positions : [];
        const resolvedEmployeeIds = new Set(
            people
                .map(employee => employee?.id)
                .filter(employeeId => employeeId !== null && employeeId !== undefined)
        );
        const vacantPositions = seats
            .filter(position => {
                if (position?.employeeId === null || position?.employeeId === undefined) return true;
                return !resolvedEmployeeIds.has(position.employeeId);
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

        const actingCount = seats.filter(isActingPosition).length;

        return {
            employeeCount: people.length,
            positionCount: seats.length,
            vacantCount: vacantPositions.length,
            actingCount,
            vacantPositions
        };
    }

    function getDepartmentCounts(positions) {
        return (positions || []).reduce((counts, position) => {
            const department = String(position?.department || "Unassigned").trim() || "Unassigned";
            counts[department] = (counts[department] || 0) + 1;
            return counts;
        }, {});
    }

    function suggestCombinedTitle(titles) {
        const cleanTitles = (Array.isArray(titles) ? titles : [])
            .map(t => String(t || "").trim())
            .filter(Boolean);

        if (cleanTitles.length === 0) return "";
        if (cleanTitles.length === 1) return cleanTitles[0];

        const splitTitles = cleanTitles.map(t => t.split(/\s+/));
        const lastWord = splitTitles[0][splitTitles[0].length - 1];
        const allShareLastWord = splitTitles.every(
            st => st.length > 1 && st[st.length - 1].toLowerCase() === lastWord.toLowerCase()
        );

        if (allShareLastWord) {
            const prefixes = splitTitles.map(st => st.slice(0, st.length - 1).join(" "));
            return `${prefixes.join(" and ")} ${lastWord}`;
        }

        let commonPrefixWords = [];
        const minLength = Math.min(...splitTitles.map(st => st.length));
        for (let i = 0; i < minLength - 1; i++) {
            const word = splitTitles[0][i];
            if (splitTitles.every(st => st[i].toLowerCase() === word.toLowerCase())) {
                commonPrefixWords.push(word);
            } else {
                break;
            }
        }

        if (commonPrefixWords.length > 0) {
            const prefixStr = commonPrefixWords.join(" ");
            const suffixes = splitTitles.map(st => st.slice(commonPrefixWords.length).join(" "));
            return `${prefixStr} ${suffixes.join(" & ")}`;
        }

        return cleanTitles.join(" & ");
    }

    root.EmployeeDirectory = Object.freeze({
        createManualPersonId,
        getEmployeeSource,
        getAssignmentSummary,
        getNextEmployeeId,
        createManualEmployee,
        addManualEmployee,
        detachEmployeeFromPositions,
        getPositionNoteText,
        isActingPosition,
        getStaffingSummary,
        getDepartmentCounts,
        suggestCombinedTitle
    });
})(globalThis);
