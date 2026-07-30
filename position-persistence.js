(function attachPositionPersistence(root) {
    async function commitCandidate(currentPositions, candidatePositions, persist) {
        const saved = await persist(candidatePositions);
        return {
            saved: saved === true,
            positions: saved === true ? candidatePositions : currentPositions
        };
    }

    root.PositionPersistence = Object.freeze({
        commitCandidate
    });
})(globalThis);
