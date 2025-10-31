#!/usr/bin/env python3
from pymongo import MongoClient
import os, json
MONGO_URI = os.getenv('MONGO_URI')
if not MONGO_URI:
    print('MONGO_URI not set')
    raise SystemExit(1)
client = MongoClient(MONGO_URI)
try:
    dbs = client.list_database_names()
except Exception as e:
    print(json.dumps({'error': str(e)}))
else:
    print(json.dumps({'databases': dbs}, ensure_ascii=False, indent=2))
