"""Background tasks for precomputing salary reports (RQ jobs).

This module exposes a function `precompute_salary_month` that can be queued by an RQ worker.
It will call the existing `salary_all` endpoint function from `server.py` and write the result to Redis cache.
"""
import asyncio
import os
import logging

from cache import cache_set, REDIS_URL

logger = logging.getLogger(__name__)


def precompute_salary_month(month: str, expire_seconds: int = 60 * 60 * 6):
    """RQ job entrypoint. Calls the salary_all coroutine and caches result."""
    try:
        # Import here to avoid circular imports at module load
        from server import salary_all

        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        result = loop.run_until_complete(salary_all(month))
        loop.close()

        cache_key = f"salary_all:{month}"
        cache_set(cache_key, result, expire_seconds)
        logger.info(f"Precomputed salary for {month} and stored in cache key {cache_key}")
        return True
    except Exception as e:
        logger.exception(f"Error precomputing salary for {month}: {e}")
        return False
