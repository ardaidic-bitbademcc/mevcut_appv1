"""Background tasks for precomputing salary reports (RQ jobs).

This module exposes a function `precompute_salary_month` that can be queued by an RQ worker.
It will call the existing `salary_all` endpoint function from `server.py` and write the result to Redis cache.
"""
import asyncio
import logging

try:
    # Prefer package-relative import when running as a module (backend.tasks)
    from .cache import cache_set  # type: ignore
except Exception:
    # Fallback for environments where package layout differs
    from cache import cache_set

logger = logging.getLogger(__name__)


def precompute_salary_month(month: str, expire_seconds: int = 60 * 60 * 6):
    """RQ job entrypoint. Calls the salary_all coroutine and caches result."""
    try:
        # Import here to avoid circular imports at module load
        try:
            from .server import salary_all  # type: ignore
        except Exception:
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
