"""Redis cache helper for backend.

Provides a thin wrapper around redis to get/set JSON-serializable values.
"""
import os
import json
from typing import Any, Optional

import redis

REDIS_URL = os.environ.get("REDIS_URL", "redis://localhost:6379/0")


def get_redis() -> redis.Redis:
    return redis.from_url(REDIS_URL, decode_responses=True)


def cache_get(key: str) -> Optional[Any]:
    r = get_redis()
    val = r.get(key)
    if val is None:
        return None
    try:
        return json.loads(val)
    except Exception:
        return val


def cache_set(key: str, value: Any, expire_seconds: int = 3600) -> None:
    r = get_redis()
    try:
        payload = json.dumps(value, default=str)
    except Exception:
        # fallback to string conversion
        payload = str(value)
    r.set(key, payload, ex=expire_seconds)
