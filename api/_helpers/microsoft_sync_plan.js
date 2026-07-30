function normalizeText(value) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function employeeEmailCandidates(employee) {
  return [employee?.email]
    .map(normalizeText)
    .filter(Boolean);
}

function microsoftEmailCandidates(user) {
  return [user?.mail, user?.userPrincipalName]
    .map(normalizeText)
    .filter(Boolean);
}

function nextAvailableEmployeeId(usedIds, startAt) {
  let candidate = startAt;
  while (usedIds.has(candidate)) candidate += 1;
  usedIds.add(candidate);
  return candidate;
}

export function buildMicrosoftSyncPlan(existingEmployees = [], microsoftUsers = []) {
  const existing = Array.isArray(existingEmployees) ? existingEmployees : [];
  const users = Array.isArray(microsoftUsers) ? microsoftUsers : [];
  const existingByPersonId = new Map();
  const existingByEmail = new Map();

  for (const employee of existing) {
    const personId = normalizeText(employee?.person_id);
    if (personId && !existingByPersonId.has(personId)) {
      existingByPersonId.set(personId, employee);
    }
    for (const email of employeeEmailCandidates(employee)) {
      const matches = existingByEmail.get(email) || [];
      matches.push(employee);
      existingByEmail.set(email, matches);
    }
  }

  const matchedByUserId = new Map();
  const claimedEmployeeIds = new Set();

  // Reserve exact directory-ID matches before considering email. This keeps
  // Graph ordering or reused aliases from transferring an employee ID.
  for (const user of users) {
    const userId = normalizeText(user?.id);
    const exact = existingByPersonId.get(userId);
    if (!userId || !exact || claimedEmployeeIds.has(exact.id)) continue;
    matchedByUserId.set(userId, exact);
    claimedEmployeeIds.add(exact.id);
  }

  for (const user of users) {
    const userId = normalizeText(user?.id);
    if (!userId || matchedByUserId.has(userId)) continue;

    const emailMatch = microsoftEmailCandidates(user)
      .flatMap(email => existingByEmail.get(email) || [])
      .find(employee => !claimedEmployeeIds.has(employee.id));

    if (!emailMatch) continue;
    matchedByUserId.set(userId, emailMatch);
    claimedEmployeeIds.add(emailMatch.id);
  }

  const usedIds = new Set(
    existing.map(employee => Number(employee.id)).filter(Number.isInteger)
  );
  let nextId = usedIds.size > 0 ? Math.max(...usedIds) + 1 : 1;
  const employeeIdByUserId = new Map();

  for (const user of users) {
    const userId = normalizeText(user?.id);
    if (!userId) continue;
    const existingMatch = matchedByUserId.get(userId);
    if (existingMatch) {
      employeeIdByUserId.set(userId, existingMatch.id);
      continue;
    }

    const assignedId = nextAvailableEmployeeId(usedIds, nextId);
    nextId = assignedId + 1;
    employeeIdByUserId.set(userId, assignedId);
  }

  const syncedRows = users.flatMap(user => {
    const userId = normalizeText(user?.id);
    const id = employeeIdByUserId.get(userId);
    if (!userId || !Number.isInteger(Number(id))) return [];

    const previous = matchedByUserId.get(userId) || null;
    const managerUserId = normalizeText(user?.manager?.id);
    const managerId = previous
      ? previous.manager_id ?? null
      : employeeIdByUserId.get(managerUserId) ?? null;

    return [{
      id: Number(id),
      person_id: user.id,
      name: String(user.displayName || "").trim().toUpperCase(),
      role: String(user.jobTitle || "").trim(),
      department: String(user.department || "General").trim() || "General",
      manager_id: managerId,
      email: user.mail || user.userPrincipalName || null,
      phone: user.mobilePhone || null,
      bio: previous?.bio ?? null,
      photo_url: previous?.photo_url ?? null,
      avatar_color: previous?.avatar_color ?? null,
      x: previous?.x ?? null,
      y: previous?.y ?? null
    }];
  });

  const preservedRows = existing.filter(
    employee => !claimedEmployeeIds.has(employee.id)
  );
  const matched = matchedByUserId.size;
  const added = syncedRows.length - matched;

  return {
    rows: [...syncedRows, ...preservedRows],
    links: [...employeeIdByUserId].map(([userId, employeeId]) => ({
      userId,
      employeeId
    })),
    stats: {
      existing: existing.length,
      microsoft: users.length,
      matched,
      added,
      preserved: preservedRows.length,
      final: syncedRows.length + preservedRows.length,
      removed: 0
    }
  };
}

export function evaluateMicrosoftSyncSafety(stats = {}) {
  const reasons = [];
  if (Number(stats.microsoft) === 0) {
    reasons.push("Microsoft Graph returned no employees.");
  }
  if (Number(stats.removed) > 0) {
    reasons.push("The plan would remove existing employees.");
  }
  if (
    Number(stats.existing) > 0
    && Number(stats.microsoft) > 0
    && Number(stats.matched) === 0
  ) {
    reasons.push("Existing Microsoft identities were not matched.");
  }

  return {
    safe: reasons.length === 0,
    reasons
  };
}

export async function executeMicrosoftSyncPlan({
  mode,
  plan,
  positionUpdates = [],
  persist
}) {
  const safety = evaluateMicrosoftSyncSafety(plan?.stats);
  const result = {
    ok: safety.safe,
    mode,
    safe: safety.safe,
    reasons: safety.reasons,
    stats: plan?.stats || {},
    positionUpdates: Array.isArray(positionUpdates) ? positionUpdates.length : 0
  };

  if (mode === "preview" || !safety.safe) {
    return result;
  }
  if (mode !== "apply") {
    return {
      ...result,
      ok: false,
      safe: false,
      reasons: ["Unsupported Microsoft sync mode."]
    };
  }

  await persist({
    rows: plan?.rows || [],
    positionUpdates
  });

  return {
    ...result,
    applied: true
  };
}
