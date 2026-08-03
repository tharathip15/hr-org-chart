function toInteger(value) {
  if (value === undefined || value === null || value === "") return null;
  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : null;
}

function getRawNotes(value) {
  if (typeof value === "string") return value;
  if (value === undefined || value === null) return "";
  return JSON.stringify(value);
}

function isNotesEnvelope(value) {
  if (!value.startsWith("{") || !value.endsWith("}")) return false;
  try {
    const parsed = JSON.parse(value);
    return Boolean(parsed && typeof parsed === "object" && !Array.isArray(parsed));
  } catch (error) {
    return false;
  }
}

const LEGACY_NOTE_METADATA_FIELDS = [
  "layoutStyle",
  "isManual",
  "manualLayouts",
  "status",
  "effectiveDate",
  "statusReason",
  "overviewGroupId",
  "overviewGroupTitle",
  "overviewPrimaryPositionId"
];

function isLegacyFlattenedSnapshot(position) {
  return LEGACY_NOTE_METADATA_FIELDS.some(field => Object.hasOwn(position || {}, field));
}

function rebuildLegacyNotesEnvelope(position, rawNotes) {
  const envelope = {
    layoutStyle: position?.layoutStyle || "horizontal",
    isManual: Boolean(position?.isManual)
  };

  LEGACY_NOTE_METADATA_FIELDS.slice(2).forEach(field => {
    if (Object.hasOwn(position || {}, field)) {
      envelope[field] = position[field];
    }
  });
  envelope.text = rawNotes;
  return JSON.stringify(envelope);
}

function getRestoredNotes(position) {
  const rawNotes = getRawNotes(position?.notes);
  // Legacy snapshots carry note metadata as top-level fields. Classify them
  // before inspecting note text because a human note may itself be valid JSON.
  if (isLegacyFlattenedSnapshot(position)) return rebuildLegacyNotesEnvelope(position, rawNotes);
  if (isNotesEnvelope(rawNotes)) return rawNotes;

  return rawNotes || null;
}

export function mapPositionRowToSnapshot(row) {
  return {
    id: row.id,
    title: row.title,
    department: row.department,
    managerId: row.manager_id,
    employeeId: row.employee_id,
    x: row.x,
    y: row.y,
    notes: getRawNotes(row.notes)
  };
}

export function mapPositionSnapshotToDbRow(position) {
  return {
    id: toInteger(position?.id),
    title: position?.title || "",
    department: position?.department || "",
    manager_id: toInteger(position?.managerId),
    employee_id: toInteger(position?.employeeId),
    x: toInteger(position?.x),
    y: toInteger(position?.y),
    notes: getRestoredNotes(position)
  };
}
