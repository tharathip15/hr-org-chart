(function attachDialogFocus(root) {
    const FOCUSABLE_SELECTOR = [
        "a[href]",
        "button:not([disabled])",
        "input:not([disabled])",
        "select:not([disabled])",
        "textarea:not([disabled])",
        "[tabindex]:not([tabindex=\"-1\"])"
    ].join(",");

    function getFocusableElements(dialog) {
        if (!dialog?.querySelectorAll) return [];
        return Array.from(dialog.querySelectorAll(FOCUSABLE_SELECTOR)).filter(element =>
            !element.disabled
            && !element.hidden
            && element.getAttribute?.("aria-hidden") !== "true"
            && element.getAttribute?.("tabindex") !== "-1"
        );
    }

    function createDialogController(options = {}) {
        const documentRef = options.documentRef || root.document;
        const dialog = options.dialog;
        const overlay = options.overlay || null;
        const closeElements = Array.isArray(options.closeElements)
            ? options.closeElements.filter(Boolean)
            : [];
        const initialFocus = options.initialFocus || null;
        let opener = null;

        function open() {
            const activeElement = documentRef?.activeElement;
            opener = activeElement && activeElement !== dialog && typeof activeElement.focus === "function"
                ? activeElement
                : null;
            overlay?.classList?.add("active");
            dialog?.classList?.add("active");
            dialog?.setAttribute?.("aria-hidden", "false");
            dialog?.removeAttribute?.("inert");

            const focusTarget = initialFocus || getFocusableElements(dialog)[0] || dialog;
            focusTarget?.focus?.();
        }

        function close() {
            overlay?.classList?.remove("active");
            dialog?.classList?.remove("active");
            dialog?.setAttribute?.("aria-hidden", "true");
            dialog?.setAttribute?.("inert", "");

            const focusTarget = opener;
            opener = null;
            if (focusTarget && (!documentRef?.contains || documentRef.contains(focusTarget))) {
                focusTarget.focus();
            }
        }

        function handleKeydown(event) {
            if (!dialog?.classList?.contains("active")) return;
            if (event.key === "Escape") {
                event.preventDefault();
                close();
                return;
            }
            if (event.key !== "Tab") return;

            const focusableElements = getFocusableElements(dialog);
            if (focusableElements.length === 0) {
                event.preventDefault();
                dialog?.focus?.();
                return;
            }

            const firstElement = focusableElements[0];
            const lastElement = focusableElements[focusableElements.length - 1];
            const activeElement = documentRef?.activeElement;
            const focusIsOutside = !dialog.contains?.(activeElement);
            if (event.shiftKey && (activeElement === firstElement || focusIsOutside)) {
                event.preventDefault();
                lastElement.focus();
            } else if (!event.shiftKey && (activeElement === lastElement || focusIsOutside)) {
                event.preventDefault();
                firstElement.focus();
            }
        }

        const closeFromControl = () => close();
        closeElements.forEach(element => element.addEventListener?.("click", closeFromControl));
        overlay?.addEventListener?.("click", closeFromControl);
        documentRef?.addEventListener?.("keydown", handleKeydown);

        function destroy() {
            closeElements.forEach(element => element.removeEventListener?.("click", closeFromControl));
            overlay?.removeEventListener?.("click", closeFromControl);
            documentRef?.removeEventListener?.("keydown", handleKeydown);
        }

        return Object.freeze({ open, close, destroy });
    }

    root.DialogFocus = Object.freeze({ createDialogController });
})(globalThis);
