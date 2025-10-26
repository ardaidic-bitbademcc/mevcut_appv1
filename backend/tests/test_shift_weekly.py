import pytest
from fastapi.testclient import TestClient

import backend.server as server


class FakeCursor:
    def __init__(self, docs):
        self._docs = docs

    async def to_list(self, _):
        return self._docs


class FakeCollection:
    def __init__(self, docs):
        self.docs = docs

    def find(self, query=None):
        # ignore query and return all for simplicity (tests set docs appropriately)
        return FakeCursor(self.docs)

    async def find_one(self, query):
        # simple match on employee_id or id
        if not query:
            return None
        for d in self.docs:
            matches = True
            for k, v in query.items():
                if d.get(k) != v:
                    matches = False
                    break
            if matches:
                return d
        return None


@pytest.fixture
def client(monkeypatch):
    # Build fake data
    employee = {"id": 1001, "employee_id": "1001", "ad": "DemoA", "soyad": "User1", "company_id": 1, "pozisyon": "Worker"}
    shift = {
        "id": 1,
        "company_id": 1,
        "employee_id": "1001",
        "tarih": "2025-10-26",
        "shift_type": {"id": "st1", "name": "Sabah", "start": "09:00", "end": "18:00"},
        "team_members": [{"id": 1001, "employee_id": "1001", "ad": "DemoA", "soyad": "User1", "pozisyon": "Worker"}],
    }

    fake_db = type("FakeDB", (), {})()
    fake_db.shift_calendar = FakeCollection([shift])
    fake_db.employees = FakeCollection([employee])

    # monkeypatch server.db to use fake_db
    monkeypatch.setattr(server, "db", fake_db)

    client = TestClient(server.app)
    yield client


def test_weekly_shift_with_start_date(client):
    # Provide start_date that includes the shift date
    resp = client.get("/api/shift-calendar/weekly/1001?start_date=2025-10-26")
    assert resp.status_code == 200
    data = resp.json()
    assert "employee" in data
    assert data["employee"]["employee_id"] == "1001"
    assert data["start_date"] == "2025-10-26"
    assert len(data["shifts"]) == 1
    s = data["shifts"][0]
    assert s["shift_type"]["name"] == "Sabah"
    assert s["team_members"][0]["ad"] == "DemoA"


def test_weekly_shift_without_start_date(client):
    # When no start_date provided, endpoint should return shifts (all safe_shifts)
    resp = client.get("/api/shift-calendar/weekly/1001")
    assert resp.status_code == 200
    data = resp.json()
    assert data["start_date"] is None
    assert isinstance(data["shifts"], list)
    assert len(data["shifts"]) == 1
