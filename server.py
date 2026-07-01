from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import json
import sqlite3
from pathlib import Path
from urllib.parse import urlparse


ROOT = Path(__file__).resolve().parent
DB_PATH = ROOT / "hr_org_chart.sqlite3"


def init_db():
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS app_data (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL,
                updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS employee_versions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                value TEXT NOT NULL,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
            """
        )


def load_employees():
    with sqlite3.connect(DB_PATH) as conn:
        row = conn.execute(
            "SELECT value FROM app_data WHERE key = ?",
            ("employees",),
        ).fetchone()
    if not row:
        return []
    return json.loads(row[0])


def load_preferences():
    with sqlite3.connect(DB_PATH) as conn:
        row = conn.execute(
            "SELECT value FROM app_data WHERE key = ?",
            ("preferences",),
        ).fetchone()
    if not row:
        return {"collapsedNodeIds": []}
    return json.loads(row[0])


def save_employees(employees):
    data = json.dumps(employees, ensure_ascii=False, separators=(",", ":"))
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute(
            "INSERT INTO employee_versions (value) VALUES (?)",
            (data,),
        )
        conn.execute(
            """
            INSERT INTO app_data (key, value, updated_at)
            VALUES (?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(key) DO UPDATE SET
                value = excluded.value,
                updated_at = CURRENT_TIMESTAMP
            """,
            ("employees", data),
        )
        conn.execute(
            """
            DELETE FROM employee_versions
            WHERE id NOT IN (
                SELECT id FROM employee_versions
                ORDER BY id DESC
                LIMIT 100
            )
            """
        )


def save_preferences(preferences):
    collapsed_node_ids = preferences.get("collapsedNodeIds", [])
    if not isinstance(collapsed_node_ids, list):
        raise ValueError("Expected collapsedNodeIds to be an array")

    data = json.dumps(
        {"collapsedNodeIds": collapsed_node_ids},
        ensure_ascii=False,
        separators=(",", ":"),
    )
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute(
            """
            INSERT INTO app_data (key, value, updated_at)
            VALUES (?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(key) DO UPDATE SET
                value = excluded.value,
                updated_at = CURRENT_TIMESTAMP
            """,
            ("preferences", data),
        )


class OrgChartHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def do_GET(self):
        path = urlparse(self.path).path
        if path == "/api/employees":
            self.send_json(load_employees())
            return
        if path == "/api/preferences":
            self.send_json(load_preferences())
            return
        if path == "/api/health":
            self.send_json({"ok": True, "database": str(DB_PATH.name)})
            return
        super().do_GET()

    def do_PUT(self):
        path = urlparse(self.path).path
        if path not in ("/api/employees", "/api/preferences"):
            self.send_error(404, "Not found")
            return

        try:
            content_length = int(self.headers.get("Content-Length", "0"))
            raw_body = self.rfile.read(content_length).decode("utf-8")
            body = json.loads(raw_body)

            if path == "/api/employees":
                if not isinstance(body, list):
                    raise ValueError("Expected a JSON array")
                save_employees(body)
                self.send_json({"ok": True, "count": len(body)})
                return

            if not isinstance(body, dict):
                raise ValueError("Expected a JSON object")
            save_preferences(body)
            self.send_json({"ok": True})
        except (json.JSONDecodeError, ValueError) as exc:
            self.send_json({"ok": False, "error": str(exc)}, status=400)

    def send_json(self, payload, status=200):
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)


if __name__ == "__main__":
    init_db()
    server = ThreadingHTTPServer(("127.0.0.1", 8000), OrgChartHandler)
    print(f"Serving HR Org Chart at http://127.0.0.1:8000/")
    print(f"SQLite database: {DB_PATH}")
    server.serve_forever()
