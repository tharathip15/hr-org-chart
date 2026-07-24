# Subtree Dragging Implementation Plan

> For agentic workers: REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

Goal: Dragging a visible position card moves that position and every descendant under its managerId by one shared delta, preserving relative layout and saving the result in the active view.

Architecture: Add a cycle-safe descendant collector to hierarchy-utils.js. Extend the existing pointer-drag state in app.js with a subtree snapshot. The root card keeps pointer capture and magnetic snapping; child cards receive the root delta and use the existing Overall/department persistence branches.

Tech Stack: Vanilla JavaScript, browser Pointer Events, Node.js built-in test runner, existing Python/Vercel API, and the existing Browser QA flow.

## Global Constraints

- Move the dragged root and all descendants reachable through managerId by one shared dx/dy.
- Snap only the dragged root; descendants retain their relative positions.
- Overall view persists x, y, and isManual; department views persist manualLayouts[selectedDept].
- Collapsed descendants are included safely without infinite loops.
- Do not change reporting relationships, employee assignments, API endpoints, or database schema.
- Preserve leaf dragging, collapse behavior, manual coordinates, and department-specific layouts.

---

### Task 1: Add A Cycle-Safe Position Subtree Helper

Files:
- Modify: hierarchy-utils.js inside the existing attachOrgHierarchy closure
- Modify: tests/hierarchy-utils.test.mjs

Interfaces:
- Consumes an array of position objects with id and managerId plus a root ID.
- Produces OrgHierarchy.getDescendantPositionIds(sourcePositions, rootId), returning the root first and each reachable descendant once.

- [ ] Step 1: Write the failing test.

Update the destructuring in tests/hierarchy-utils.test.mjs to include getDescendantPositionIds, then add:

    test("collects a position subtree without duplicates or cycle loops", () => {
        assert.equal(typeof getDescendantPositionIds, "function");

        const positions = [
            { id: 10, managerId: null },
            { id: 20, managerId: 10 },
            { id: 30, managerId: 20 },
            { id: 40, managerId: 10 },
            { id: 50, managerId: 40 },
            { id: 60, managerId: 50 },
            { id: 70, managerId: 70 },
            { id: 99, managerId: null }
        ];

        assert.deepEqual(getDescendantPositionIds(positions, 10), [10, 20, 30, 40, 50, 60]);
        assert.deepEqual(getDescendantPositionIds(positions, 70), [70]);
        assert.deepEqual(getDescendantPositionIds(positions, 999), []);
    });

- [ ] Step 2: Run the focused test and verify it fails.

Run: node --test tests/hierarchy-utils.test.mjs

Expected: the new test fails because getDescendantPositionIds is not exposed.

- [ ] Step 3: Implement the minimal helper.

Add this before the public API object in hierarchy-utils.js:

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

Add getDescendantPositionIds to root.OrgHierarchy's frozen public API.

- [ ] Step 4: Run node --test tests/hierarchy-utils.test.mjs and confirm all hierarchy utility tests pass.
- [ ] Step 5: Commit:

    git add hierarchy-utils.js tests/hierarchy-utils.test.mjs
    git commit -m "feat: add position subtree collector"

### Task 2: Move And Persist The Complete Subtree During Drag

Files:
- Modify: app.js around the existing drag state and handleCardDragStart, handleCardDragMove, handleCardDragEnd
- Modify: tests/overview-layout.test.mjs

Interfaces:
- Consumes OrgHierarchy.getDescendantPositionIds(positions, draggedId), rendered coordinates, selectedDept, and existing snap behavior.
- Produces drag state containing draggedPositionIds and dragStartCoordinates; all visible descendants update during pointer movement; all subtree members persist on pointer up.

- [ ] Step 1: Write failing source-contract tests in tests/overview-layout.test.mjs:

    test("dragging a position captures its complete subtree", () => {
        assert.match(appSource, /OrgHierarchy\.getDescendantPositionIds\(positions, draggedId\)/);
        assert.match(appSource, /let draggedPositionIds = \[\];/);
        assert.match(appSource, /let dragStartCoordinates = new Map\(\);/);
        assert.match(appSource, /dragStartCoordinates\.set\(positionId/);
    });

    test("dragging a subtree applies one snapped delta to every descendant", () => {
        assert.match(appSource, /const rootStart = dragStartCoordinates\.get\(draggedId\);/);
        assert.match(appSource, /const deltaX = snappedX - rootStart\.x;/);
        assert.match(appSource, /const deltaY = snappedY - rootStart\.y;/);
        assert.match(appSource, /draggedPositionIds\.forEach\(positionId =>/);
        assert.match(appSource, /subtreePosition\.renderX = Math\.round\(start\.x \+ deltaX\);/);
        assert.match(appSource, /subtreePosition\.renderY = Math\.round\(start\.y \+ deltaY\);/);
    });

    test("dragging persists the subtree in the active coordinate scope", () => {
        assert.match(appSource, /draggedPositionIds\.forEach\(positionId =>/);
        assert.match(appSource, /manualLayouts\[selectedDept\] =/);
        assert.match(appSource, /movedPosition\.isManual = true;/);
    });

- [ ] Step 2: Run node --test tests/overview-layout.test.mjs and confirm only the three new contracts fail.

- [ ] Step 3: Add subtree drag state beside the current drag state:

    let activeDragCard = null;
    let dragGrabOffsetX = 0;
    let dragGrabOffsetY = 0;
    let draggedPositionIds = [];
    let dragStartCoordinates = new Map();

In handleCardDragStart, after resolving the root position, add:

    draggedPositionIds = OrgHierarchy.getDescendantPositionIds(positions, draggedId);
    dragStartCoordinates = new Map();
    draggedPositionIds.forEach(positionId => {
        const draggedPosition = positions.find(candidate => candidate.id === positionId);
        if (draggedPosition) {
            dragStartCoordinates.set(positionId, getRenderedPositionCoordinates(draggedPosition));
        }
    });

If the root is missing from the snapshot, clear draggedPositionIds and dragStartCoordinates and return before pointer capture.

- [ ] Step 4: Keep the existing snap calculation for the root in handleCardDragMove, then replace the single-position update with:

    const rootStart = dragStartCoordinates.get(draggedId);
    const deltaX = snappedX - rootStart.x;
    const deltaY = snappedY - rootStart.y;

    draggedPositionIds.forEach(positionId => {
        const subtreePosition = positions.find(candidate => candidate.id === positionId);
        const start = dragStartCoordinates.get(positionId);
        if (!subtreePosition || !start) return;

        subtreePosition.renderX = Math.round(start.x + deltaX);
        subtreePosition.renderY = Math.round(start.y + deltaY);

        const subtreeCard = document.querySelector(
            ".node-card.absolute-card[data-id=\"" + positionId + "\"]"
        );
        if (subtreeCard) {
            subtreeCard.style.left = subtreePosition.renderX + "px";
            subtreeCard.style.top = subtreePosition.renderY + "px";
        }
    });

The loop updates the root too, so remove the old root-only render/style assignment.

- [ ] Step 5: Replace the single-position persistence block in handleCardDragEnd with:

    draggedPositionIds.forEach(positionId => {
        const movedPosition = positions.find(candidate => candidate.id === positionId);
        if (!movedPosition) return;

        const renderedCoordinates = getRenderedPositionCoordinates(movedPosition);
        if (selectedDept === "All") {
            movedPosition.x = renderedCoordinates.x;
            movedPosition.y = renderedCoordinates.y;
            movedPosition.isManual = true;
        } else {
            const manualLayouts = normalizeManualLayouts(movedPosition.manualLayouts);
            manualLayouts[selectedDept] = {
                x: renderedCoordinates.x,
                y: renderedCoordinates.y
            };
            movedPosition.manualLayouts = manualLayouts;
        }
    });

After pointer-capture cleanup, clear draggedPositionIds and dragStartCoordinates before savePositions().

- [ ] Step 6: Run node --test tests/overview-layout.test.mjs and confirm all layout tests pass.
- [ ] Step 7: Commit:

    git add app.js tests/overview-layout.test.mjs
    git commit -m "feat: drag position subtrees together"

### Task 3: Full Verification And Rendered Drag QA

Files:
- No source changes expected.
- Keep screenshots and temporary QA scripts outside the repository.

- [ ] Step 1: Run:

    node --check app.js
    node --test tests/*.test.mjs
    git diff --check

Expected: syntax succeeds, every test passes, and diff check reports no whitespace errors.

- [ ] Step 2: Run `npx vercel dev` and use the available Browser plugin against the local Vercel Functions instance.

- [ ] Step 3: Exercise this flow: app loads -> Overall Organization renders -> drag a manager -> child and grandchild move by the same visual delta -> release -> reload -> the subtree remains aligned.

Record root, child, and grandchild card positions before and after. Verify each descendant's after-minus-before x/y equals the root's after-minus-before x/y, unrelated cards do not move, the page is nonblank after reload, and the browser console has no relevant errors.

- [ ] Step 4: Switch to a department view, drag a manager with visible descendants, reload, and confirm that department layout moved while Overall layout stayed unchanged.

- [ ] Step 5: If QA exposes a defect, return to the smallest failing test and fix it before deployment. If all checks pass, leave the worktree clean and report the verified state before production deployment.
