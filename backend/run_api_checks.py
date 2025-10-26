"""Run quick in-process API checks using TestClient.

This script sets required env vars, imports the FastAPI `app` and runs a few
requests (root, /api/test-login, /api/companies). It prints results to stdout.

Run with the project's virtualenv python:
  /workspaces/mevcut_appv1/.venv/bin/python backend/run_api_checks.py
"""
import os
import json
from pprint import pprint

# Ensure these point to the local Mongo container started earlier
os.environ.setdefault("MONGO_URL", "mongodb://localhost:27017")
os.environ.setdefault("DB_NAME", "mevcut_db")

from fastapi.testclient import TestClient

# Import app after env vars
from backend.server import app


def run_checks():
    client = TestClient(app)

    print("GET /")
    r = client.get("/")
    print(r.status_code)
    try:
        pprint(r.json())
    except Exception:
        print(r.text[:200])

    print("\nGET /api/test-login")
    r = client.get("/api/test-login")
    print(r.status_code)
    try:
        data = r.json()
        pprint({"total_users": data.get("total_users"), "sample": data.get("users")[:5]})
    except Exception:
        print(r.text[:500])

    print("\nGET /api/companies")
    r = client.get("/api/companies")
    print(r.status_code)
    try:
        pprint(r.json())
    except Exception:
        print(r.text[:400])


if __name__ == "__main__":
    run_checks()
