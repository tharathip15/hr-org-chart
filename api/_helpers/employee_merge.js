export function normalizeEmail(value) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function normalizePersonId(value) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

export function findExistingEmployee(existingEmployees, microsoftUser) {
  const emailCandidates = [microsoftUser?.mail, microsoftUser?.userPrincipalName]
    .map(normalizeEmail)
    .filter(Boolean);
  const emailMatch = (existingEmployees || []).find(employee =>
    emailCandidates.includes(normalizeEmail(employee.email))
  );

  if (emailMatch) return emailMatch;

  const personId = normalizePersonId(microsoftUser?.id);
  return (existingEmployees || []).find(
    employee => normalizePersonId(employee.person_id) === personId
  ) || null;
}

export function isManualEmployee(employee, microsoftPersonIds) {
  const personId = normalizePersonId(employee?.person_id);
  return !personId || !microsoftPersonIds.has(personId);
}
