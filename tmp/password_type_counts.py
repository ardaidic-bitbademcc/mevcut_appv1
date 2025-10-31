#!/usr/bin/env python3
from pymongo import MongoClient
import os, json

MONGO_URI = os.getenv('MONGO_URI')
DB_NAME = os.getenv('DB_NAME','mevcutapp')

if not MONGO_URI:
    print(json.dumps({'error':'MONGO_URI not set'}))
    raise SystemExit(1)

client = MongoClient(MONGO_URI)
db = client[DB_NAME]

pipeline = [
    { '$project': { 'pwType': { '$type': '$password' } } },
    { '$group': { '_id': '$pwType', 'count': { '$sum': 1 } } }
]
try:
    res = list(db.employees.aggregate(pipeline))
    out = { r['_id']: r['count'] for r in res }
    print(json.dumps({'db': DB_NAME, 'password_type_counts': out}, ensure_ascii=False, indent=2))
except Exception as e:
    print(json.dumps({'error': str(e)}))
