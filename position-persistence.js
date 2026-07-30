(function attachPositionPersistence(root) {
    async function commitCandidate(currentPositions, candidatePositions, persist) {
        const saved = await persist(candidatePositions);
        return {
            saved: saved === true,
            positions: saved === true ? candidatePositions : currentPositions
        };
    }

    function shouldPersistAutomaticRepair(reconciliationMode, canEdit) {
        return typeof reconciliationMode === "string"
            && reconciliationMode.startsWith("remote")
            && canEdit === true;
    }

    root.PositionPersistence = Object.freeze({
        commitCandidate,
        shouldPersistAutomaticRepair
    });
})(globalThis);
