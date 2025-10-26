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
    db_name = os.getenv("DB_NAME", "mevcut_db")

    print(f"Connecting to MongoDB: {mongo_url} db: {db_name}")
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]

    # Clean previous demo data (safe because we namespace with demo: True)
    print("Cleaning previous demo data (demo: True)")
    await db.companies.delete_many({"demo": True})
    await db.users.delete_many({"demo": True})
    await db.shifts.delete_many({"demo": True})
    await db.subscriptions.delete_many({"demo": True})

    # Companies
    companies = [
        {"_id": "demo-company-a", "name": "Demo Company A", "demo": True, "created_at": datetime.utcnow()},
        {"_id": "demo-company-b", "name": "Demo Company B", "demo": True, "created_at": datetime.utcnow()},
    ]
    await db.companies.insert_many(companies)

    # Demo users: admin + employee per company
    demo_password = os.getenv("DEMO_PASSWORD", "Demo1234!")
    hashed = bcrypt.hashpw(demo_password.encode(), bcrypt.gensalt()).decode()

    users = []
    for comp in companies:
        admin_id = f"user-{comp['_id']}-admin"
        users.append({
            "_id": admin_id,
            "email": f"admin@{comp['_id']}.example.com",
            "password": hashed,
            "name": f"{comp['name']} Admin",
            "company_id": comp["_id"],
            "role": "admin",
            "demo": True,
            "created_at": datetime.utcnow(),
        })

        emp_id = f"user-{comp['_id']}-1"
        users.append({
            "_id": emp_id,
            "email": f"user1@{comp['_id']}.example.com",
            "password": hashed,
            "name": f"{comp['name']} Employee 1",
            "company_id": comp["_id"],
            "role": "employee",
            "demo": True,
            "created_at": datetime.utcnow(),
        })

    if users:
        await db.users.insert_many(users)

    # Add shifts for the last 30 days for each employee (8h/day)
    shifts = []
    for u in users:
        if u["role"] != "employee":
            continue
        for days_ago in range(1, 31):
            day = (datetime.utcnow() - timedelta(days=days_ago)).date()
            start = datetime.combine(day, datetime.min.time()) + timedelta(hours=9)
            end = start + timedelta(hours=8)
            shifts.append({
                "_id": str(uuid.uuid4()),
                "employee_id": u["_id"],
                "company_id": u["company_id"],
                "date": day.isoformat(),
                "start": start.isoformat(),
                "end": end.isoformat(),
                "hours": 8,
                "demo": True,
            })

    if shifts:
        await db.shifts.insert_many(shifts)

    # Example subscription: active for Demo Company A, none for Demo Company B
    await db.subscriptions.insert_one({
        "_id": "sub-demo-company-a",
        "company_id": "demo-company-a",
        "status": "active",
        "plan": "pro-monthly",
        "started_at": datetime.utcnow(),
        "demo": True,
    })

    print("Demo data inserted successfully.")
    print("Demo admin credentials:")
    for comp in companies:
        print(f"- Company: {comp['name']}")
        print(f"  admin email: admin@{comp['_id']}.example.com")
        print(f"  password: {demo_password}")

    client.close()


if __name__ == "__main__":
    asyncio.run(main())
