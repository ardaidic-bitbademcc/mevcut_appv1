#!/usr/bin/env python3
from pymongo import MongoClient
import os, json, binascii

MONGO_URI = os.getenv('MONGO_URI')
DB_NAME = os.getenv('DB_NAME','mevcut_db')

if not MONGO_URI:
    print('MONGO_URI environment variable not set')
    raise SystemExit(1)

client = MongoClient(MONGO_URI)
db = client[DB_NAME]

emp = db.employees.find_one({"employee_id": "3010"})
if not emp:
    print(json.dumps({"found": False}))
else:
    pw = emp.get('password', None)
    out = {
        'found': True,
        'id': emp.get('id'),
        'employee_id': emp.get('employee_id'),
        'email_present': bool(emp.get('email')),
        'company_id': emp.get('company_id'),
        'rol': emp.get('rol')
    }
    if pw is None:
        out['password_type'] = 'missing'
        out['password_preview'] = None
    elif isinstance(pw, (bytes, bytearray)):
        out['password_type'] = 'bytes'
        out['password_preview'] = binascii.hexlify(pw)[:120].decode('ascii')
    else:
        s = str(pw)
        out['password_type'] = type(pw).__name__
        out['password_preview'] = s[:120]
    # Avoid printing extremely sensitive details; show only preview and type
    print(json.dumps(out, ensure_ascii=False, indent=2))
