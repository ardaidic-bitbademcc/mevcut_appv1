#!/usr/bin/env python3
"""
Create demo companies and employees in the shape expected by the backend.

This script inserts numeric `company_id` and `employee_id` entries into `companies` and
`employees` collections so the existing API endpoints (which expect numeric ids) work with
the demo accounts created by `seed_demo.py`.

Run with the project's virtualenv python:
  /workspaces/mevcut_appv1/.venv/bin/python backend/create_demo_employees.py
"""
import os
from datetime import datetime
import bcrypt
from pymongo import MongoClient

MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "mevcut_db")
DEMO_PASSWORD = os.getenv("DEMO_PASSWORD", "Demo1234!")

client = MongoClient(MONGO_URL)
db = client[DB_NAME]

def upsert_companies():
    companies = [
        {"id": 1, "name": "Demo Company A", "domain": "demo-company-a.example.com", "created_at": datetime.utcnow()},
        {"id": 2, "name": "Demo Company B", "domain": "demo-company-b.example.com", "created_at": datetime.utcnow()},
    ]
    for c in companies:
        db.companies.update_one({"id": c["id"]}, {"$set": c}, upsert=True)

def create_employees():
    # Create employees with numeric ids expected by server
    pwd_hash = bcrypt.hashpw(DEMO_PASSWORD.encode(), bcrypt.gensalt()).decode()

    employees = [
        {"id": 1000, "company_id": 1, "employee_id": "1000", "ad": "DemoA", "soyad": "Admin", "pozisyon": "Admin", "maas_tabani": 30000, "rol": "admin", "email": "admin@demo-company-a.example.com", "password": pwd_hash},
        {"id": 1001, "company_id": 1, "employee_id": "1001", "ad": "DemoA", "soyad": "User1", "pozisyon": "Worker", "maas_tabani": 20000, "rol": "employee", "email": "user1@demo-company-a.example.com", "password": pwd_hash},

        {"id": 2000, "company_id": 2, "employee_id": "2000", "ad": "DemoB", "soyad": "Admin", "pozisyon": "Admin", "maas_tabani": 30000, "rol": "admin", "email": "admin@demo-company-b.example.com", "password": pwd_hash},
        {"id": 2001, "company_id": 2, "employee_id": "2001", "ad": "DemoB", "soyad": "User1", "pozisyon": "Worker", "maas_tabani": 20000, "rol": "employee", "email": "user1@demo-company-b.example.com", "password": pwd_hash},
    ]

    for e in employees:
        db.employees.update_one({"employee_id": e["employee_id"], "company_id": e["company_id"]}, {"$set": e}, upsert=True)

def main():
    print(f"Connecting to {MONGO_URL} db={DB_NAME}")
    upsert_companies()
    create_employees()
    print("Inserted/updated demo companies and employees.")

if __name__ == "__main__":
    main()
