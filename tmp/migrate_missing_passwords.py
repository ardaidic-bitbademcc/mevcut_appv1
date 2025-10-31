#!/usr/bin/env python3
from pymongo import MongoClient
import os
import json
import secrets
import string
import bcrypt

MONGO_URI = os.getenv('MONGO_URI')
DB_NAME = os.getenv('DB_NAME','mevcutapp')

if not MONGO_URI:
    print(json.dumps({'error': 'MONGO_URI not set'}))
    raise SystemExit(1)

client = MongoClient(MONGO_URI)
db = client[DB_NAME]

# Find employees where password is missing or null
query = { '$or': [ { 'password': { '$exists': False } }, { 'password': None } ] }
users = list(db.employees.find(query, { 'employee_id': 1, 'id':1, 'ad':1, 'soyad':1 }))
if not users:
    print(json.dumps({'updated': False, 'reason': 'no_missing_passwords'}))
    raise SystemExit(0)

# Password generator: 14 chars, urlsafe-ish
alphabet = string.ascii_letters + string.digits + '!@#$%^&*()-_'

results = []
for u in users:
    emp_id = u.get('employee_id') or str(u.get('id'))
    # generate password
    temp_pw = ''.join(secrets.choice(alphabet) for _ in range(14))
    hashed = bcrypt.hashpw(temp_pw.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    res = db.employees.update_one({ 'employee_id': u.get('employee_id') }, { '$set': { 'password': hashed } })
    results.append({ 'employee_id': emp_id, 'id': u.get('id'), 'updated': res.matched_count == 1, 'temporary_password': temp_pw })

# Print only the mapping to hand to admin. WARNING: this prints plaintext temporary passwords; handle securely.
print(json.dumps({'updated_count': sum(1 for r in results if r['updated']), 'results': results}, ensure_ascii=False, indent=2))
