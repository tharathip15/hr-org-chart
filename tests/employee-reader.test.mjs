import assert from "node:assert/strict";
import test from "node:test";
import { readEmployeeRows } from "../api/_helpers/employee_reader.js";

function createEmployeesClient(results) {
  const selectedColumns = [];
  let callIndex = 0;

  return {
    selectedColumns,
    from(table) {
      assert.equal(table, "employees");
      return {
        select(columns) {
          selectedColumns.push(columns);
          return {
            async order(column, options) {
              assert.equal(column, "id");
              assert.deepEqual(options, { ascending: true });
              const result = results[callIndex];
              callIndex += 1;
              return result;
            }
          };
        }
      };
    }
  };
}

test("employee reads keep coordinates when the current schema supports them", async () => {
  const expected = { data: [{ id: 1, x: 10, y: 20 }], error: null };
  const client = createEmployeesClient([expected]);

  assert.equal(await readEmployeeRows(client), expected);
  assert.equal(client.selectedColumns.length, 1);
  assert.match(client.selectedColumns[0], /,x,y$/);
});

test("employee reads retry without coordinates for the production legacy schema", async () => {
  const missingCoordinates = {
    data: null,
    error: {
      code: "42703",
      message: "column employees.x does not exist"
    }
  };
  const expected = { data: [{ id: 1 }], error: null };
  const client = createEmployeesClient([missingCoordinates, expected]);

  assert.equal(await readEmployeeRows(client), expected);
  assert.equal(client.selectedColumns.length, 2);
  assert.match(client.selectedColumns[0], /,x,y$/);
  assert.doesNotMatch(client.selectedColumns[1], /(?:^|,)x(?:,|$)|(?:^|,)y(?:,|$)/);
});

test("employee reads do not hide unrelated database errors", async () => {
  const expected = {
    data: null,
    error: {
      code: "42501",
      message: "permission denied"
    }
  };
  const client = createEmployeesClient([expected]);

  assert.equal(await readEmployeeRows(client), expected);
  assert.equal(client.selectedColumns.length, 1);
});
