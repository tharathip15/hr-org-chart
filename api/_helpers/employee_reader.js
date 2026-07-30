const EMPLOYEE_COLUMNS =
  "id,person_id,name,role,department,manager_id,email,phone,bio,photo_url,avatar_color,x,y";
const EMPLOYEE_COLUMNS_WITHOUT_COORDINATES =
  "id,person_id,name,role,department,manager_id,email,phone,bio,photo_url,avatar_color";

function isMissingCoordinateColumn(error) {
  return error?.code === "42703"
    && /column employees\.(x|y) does not exist/i.test(error?.message || "");
}

async function selectEmployeeRows(client, columns) {
  return client
    .from("employees")
    .select(columns)
    .order("id", { ascending: true });
}

export async function readEmployeeRows(client) {
  const result = await selectEmployeeRows(client, EMPLOYEE_COLUMNS);
  if (!isMissingCoordinateColumn(result.error)) {
    return result;
  }

  console.warn("Employee x/y columns are missing; retrying without coordinates.");
  return selectEmployeeRows(client, EMPLOYEE_COLUMNS_WITHOUT_COORDINATES);
}
