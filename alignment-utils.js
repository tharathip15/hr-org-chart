(function attachAlignmentAssist(root) {
    const DEFAULT_GRID_SIZE = 20;
    const DEFAULT_THRESHOLD = 18;
    const GRID_THRESHOLD = 6;

    function toFiniteNumber(value, fallback = 0) {
        const number = Number(value);
        return Number.isFinite(number) ? number : fallback;
    }

    function normalizeBounds(bounds) {
        return {
            id: bounds?.id ?? null,
            x: toFiniteNumber(bounds?.x),
            y: toFiniteNumber(bounds?.y),
            width: Math.max(1, toFiniteNumber(bounds?.width, 240)),
            height: Math.max(1, toFiniteNumber(bounds?.height, 120))
        };
    }

    function getAxisAnchors(bounds, axis) {
        const normalized = normalizeBounds(bounds);
        const start = axis === "x" ? normalized.x : normalized.y;
        const size = axis === "x" ? normalized.width : normalized.height;
        return [
            { name: "start", value: start },
            { name: "center", value: start + size / 2 },
            { name: "end", value: start + size }
        ];
    }

    function findAxisSnap(bounds, candidates, axis, threshold) {
        const movingAnchors = getAxisAnchors(bounds, axis);
        let best = null;

        candidates.forEach(candidateInput => {
            const candidate = normalizeBounds(candidateInput);
            getAxisAnchors(candidate, axis).forEach((candidateAnchor, index) => {
                const movingAnchor = movingAnchors[index];
                const delta = candidateAnchor.value - movingAnchor.value;
                const distance = Math.abs(delta);
                if (distance > threshold) return;

                if (!best || distance < best.distance) {
                    best = {
                        axis,
                        distance,
                        coordinate: (axis === "x" ? bounds.x : bounds.y) + delta,
                        anchor: movingAnchor.name,
                        value: candidateAnchor.value,
                        candidate
                    };
                }
            });
        });

        return best;
    }

    function getSameRowCandidates(bounds, candidates) {
        const centerY = bounds.y + bounds.height / 2;
        const rowTolerance = Math.max(28, Math.min(96, bounds.height * 0.7));
        return candidates
            .map(normalizeBounds)
            .filter(candidate => Math.abs((candidate.y + candidate.height / 2) - centerY) <= rowTolerance);
    }

    function findEqualGapSnap(bounds, candidates, threshold) {
        const sameRow = getSameRowCandidates(bounds, candidates);
        const left = sameRow
            .filter(candidate => candidate.x + candidate.width <= bounds.x + threshold)
            .sort((a, b) => (b.x + b.width) - (a.x + a.width))[0];
        const right = sameRow
            .filter(candidate => candidate.x >= bounds.x + bounds.width - threshold)
            .sort((a, b) => a.x - b.x)[0];

        if (!left || !right) return null;

        const leftEdge = left.x + left.width;
        const targetX = (leftEdge + right.x - bounds.width) / 2;
        const distance = Math.abs(targetX - bounds.x);
        if (distance > threshold) return null;

        return {
            distance,
            coordinate: targetX,
            left,
            right,
            gap: Math.max(0, targetX - leftEdge)
        };
    }

    function getHorizontalMeasurement(bounds, candidates) {
        const sameRow = getSameRowCandidates(bounds, candidates);
        const left = sameRow
            .filter(candidate => candidate.x + candidate.width <= bounds.x)
            .sort((a, b) => (b.x + b.width) - (a.x + a.width))[0];
        const right = sameRow
            .filter(candidate => candidate.x >= bounds.x + bounds.width)
            .sort((a, b) => a.x - b.x)[0];
        const leftGap = left ? Math.round(bounds.x - (left.x + left.width)) : null;
        const rightGap = right ? Math.round(right.x - (bounds.x + bounds.width)) : null;

        if (leftGap === null && rightGap === null) return null;

        return {
            y: Math.max(18, Math.min(bounds.y, left?.y ?? bounds.y, right?.y ?? bounds.y) - 22),
            left: leftGap === null ? null : { from: left.x + left.width, to: bounds.x, gap: leftGap },
            right: rightGap === null ? null : { from: bounds.x + bounds.width, to: right.x, gap: rightGap },
            equal: leftGap !== null && rightGap !== null && Math.abs(leftGap - rightGap) <= 4
        };
    }

    function getGridSnap(value, gridSize) {
        const target = Math.round(value / gridSize) * gridSize;
        return Math.abs(target - value) <= GRID_THRESHOLD ? target : null;
    }

    function findSnap({ bounds, candidates = [], threshold = DEFAULT_THRESHOLD, gridSize = DEFAULT_GRID_SIZE } = {}) {
        const moving = normalizeBounds(bounds);
        const normalizedCandidates = candidates.map(normalizeBounds).filter(candidate => candidate.id !== moving.id);
        let xSnap = findAxisSnap(moving, normalizedCandidates, "x", threshold);
        const ySnap = findAxisSnap(moving, normalizedCandidates, "y", threshold);

        const equalGap = findEqualGapSnap(moving, normalizedCandidates, threshold);
        if (equalGap && (!xSnap || equalGap.distance <= xSnap.distance)) {
            xSnap = {
                axis: "x",
                distance: equalGap.distance,
                coordinate: equalGap.coordinate,
                anchor: "equal-gap",
                value: equalGap.coordinate + moving.width / 2,
                candidate: equalGap.left,
                equalGap
            };
        }

        let x = xSnap ? xSnap.coordinate : moving.x;
        let y = ySnap ? ySnap.coordinate : moving.y;
        const guides = [];

        if (!xSnap) {
            const gridX = getGridSnap(x, gridSize);
            if (gridX !== null) {
                x = gridX;
                guides.push({ axis: "x", value: gridX, kind: "grid", start: moving.y - 48, end: moving.y + moving.height + 48 });
            }
        } else if (xSnap.anchor !== "equal-gap") {
            const candidate = xSnap.candidate;
            guides.push({
                axis: "x",
                value: xSnap.value,
                kind: "alignment",
                start: Math.min(moving.y, candidate.y) - 52,
                end: Math.max(moving.y + moving.height, candidate.y + candidate.height) + 52
            });
        }

        if (!ySnap) {
            const gridY = getGridSnap(y, gridSize);
            if (gridY !== null) {
                y = gridY;
                guides.push({ axis: "y", value: gridY, kind: "grid", start: moving.x - 72, end: moving.x + moving.width + 72 });
            }
        } else {
            const candidate = ySnap.candidate;
            guides.push({
                axis: "y",
                value: ySnap.value,
                kind: "alignment",
                start: Math.min(moving.x, candidate.x) - 72,
                end: Math.max(moving.x + moving.width, candidate.x + candidate.width) + 72
            });
        }

        const snappedBounds = { ...moving, x, y };
        const measurement = getHorizontalMeasurement(snappedBounds, normalizedCandidates);
        if (xSnap?.equalGap && measurement) measurement.equal = true;

        return {
            x: Math.round(x),
            y: Math.round(y),
            guides,
            measurement,
            equalGap: xSnap?.equalGap ?? null
        };
    }

    root.AlignmentAssist = Object.freeze({
        findSnap,
        getAxisAnchors,
        getHorizontalMeasurement
    });
})(globalThis);
