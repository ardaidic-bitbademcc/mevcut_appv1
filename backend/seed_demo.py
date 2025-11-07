#!/usr/bin/env python3
"""
Seed demo companies, users, shifts and subscriptions into MongoDB.

Usage:
  MONGO_URL and DB_NAME can be provided via environment variables.
  Run: python3 backend/seed_demo.py

This script uses Motor (async) and bcrypt to hash demo passwords the same way the app expects.
It marks inserted documents with `demo: True` so they can be cleaned up safely by re-running the script.
"""
import os
import asyncio
from datetime import datetime, timedelta
import uuid

import bcrypt
from motor.motor_asyncio import AsyncIOMotorClient


async def main():
    mongo_url = os.getenv("MONGO_URL", "mongodb://localhost:27017")
    db_name = os.getenv("DB_NAME", "mevcut-app")

    print(f"Connecting to MongoDB: {mongo_url} db: {db_name}")
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]

    # Clean previous demo data (safe because we namespace with demo: True)
    print("Cleaning previous demo data (demo: True)")
    await db.companies.delete_many({"demo": True})
    await db.employees.delete_many({"demo": True})
    await db.shifts.delete_many({"demo": True})
    await db.subscriptions.delete_many({"demo": True})

    # Companies
    companies = [
        {"_id": "demo-company-a", "id": 1, "name": "Demo Company A", "demo": True, "created_at": datetime.utcnow()},
        {"_id": "demo-company-b", "id": 2, "name": "Demo Company B", "demo": True, "created_at": datetime.utcnow()},
    ]
    await db.companies.insert_many(companies)

    # Demo users: admin + employee per company
    demo_password = os.getenv("DEMO_PASSWORD", "demo123")
    hashed = bcrypt.hashpw(demo_password.encode(), bcrypt.gensalt()).decode()

    employees = [{
        "_id": "employee-demo-admin",
        "id": 0,
        "email": "demo@test.com",
        "password": hashed,
        "ad": "Demo Admin",
        "soyad": "User",
        "pozisyon": "Admin",
        "maas_tabani": 50000,
        "rol": "admin",
        "employee_id": "1000",
        "company_id": 1,
        "demo": True,
        "created_at": datetime.utcnow(),
    }]

    if employees:
        await db.employees.insert_many(employees)

    print("Demo data inserted successfully.")
    print("Demo admin credentials:")
    print(f"- admin email: demo@test.com")
    print(f"- password: {demo_password}")

    client.close()


if __name__ == "__main__":
    asyncio.run(main())
