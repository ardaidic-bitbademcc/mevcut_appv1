#!/usr/bin/env python3
from pymongo import MongoClient
import os
import bcrypt
import json

MONGO_URI = os.getenv('MONGO_URI')
DB_NAME = os.getenv('DB_NAME','mevcutapp')
EMPLOYEE_ID = os.getenv('EMPLOYEE_ID')
NEW_PASSWORD = os.getenv('NEW_PASSWORD')

if not MONGO_URI:
    print('MONGO_URI not set')
    raise SystemExit(1)
if not EMPLOYEE_ID:
    print('EMPLOYEE_ID not set')
    raise SystemExit(1)
if not NEW_PASSWORD:
    print('NEW_PASSWORD not set')
    raise SystemExit(1)

client = MongoClient(MONGO_URI)
db = client[DB_NAME]

emp = db.employees.find_one({"employee_id": EMPLOYEE_ID})
if not emp:
    print(json.dumps({'updated': False, 'reason': 'employee_not_found'}))
    raise SystemExit(1)

# Hash the new password
hashed = bcrypt.hashpw(NEW_PASSWORD.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

res = db.employees.update_one({"employee_id": EMPLOYEE_ID}, {"$set": {"password": hashed}})
if res.modified_count == 1:
    print(json.dumps({'updated': True, 'employee_id': EMPLOYEE_ID, 'id': emp.get('id')}))
else:
    # Could be matched but not modified if same value existed; still report success if matched_count==1
    if res.matched_count == 1:
        print(json.dumps({'updated': True, 'employee_id': EMPLOYEE_ID, 'note': 'matched_but_not_modified'}))
    else:
        print(json.dumps({'updated': False, 'employee_id': EMPLOYEE_ID, 'matched_count': res.matched_count}))
