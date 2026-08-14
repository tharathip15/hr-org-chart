(function attachChartViewScope(root) {
  const OPERATION_VIEW_ID = "__operation__";
  const OVERVIEW_SCOPE = "__overview__";

  function isOverview(viewId) { return viewId === "All"; }
  function isOperation(viewId) { return viewId === OPERATION_VIEW_ID; }
  function supportsCollapse(viewId) { return isOverview(viewId) || isOperation(viewId); }
  function blocksStructuralActions(viewId) { return isOverview(viewId) || isOperation(viewId); }
  function getStorageScopeKey(viewId, chartMode = "current") {
    if (isOverview(viewId)) return OVERVIEW_SCOPE;
    if (isOperation(viewId)) {
      return chartMode === "future" ? "__operation_future__" : "__operation_current__";
    }
    return String(viewId || "").trim();
  }

  root.ChartViewScope = Object.freeze({
    OPERATION_VIEW_ID,
    isOverview,
    isOperation,
    supportsCollapse,
    blocksStructuralActions,
    getStorageScopeKey
  });
})(globalThis);
