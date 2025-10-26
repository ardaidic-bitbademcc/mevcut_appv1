import logging
import uuid
from contextvars import ContextVar
from python_json_logger import jsonlogger
import os
from starlette.middleware.base import BaseHTTPMiddleware
from fastapi import Request

try:
    import sentry_sdk
except Exception:
    sentry_sdk = None

REQUEST_ID_CTX: ContextVar[str] = ContextVar("request_id", default=None)


class RequestIDFilter(logging.Filter):
    """Attach request_id from contextvar to log records."""

    def filter(self, record):
        record.request_id = REQUEST_ID_CTX.get() or "-"
        return True


def init_logging(level: str = None):
    """Initialize root logger with JSON formatter and request-id filter.

    Call this early during app startup.
    """
    lvl = level or os.environ.get("LOG_LEVEL", "INFO")
    root = logging.getLogger()
    root.setLevel(lvl)

    # Avoid adding duplicate handlers when reloading in dev
    if not any(isinstance(h, logging.StreamHandler) for h in root.handlers):
        handler = logging.StreamHandler()
        fmt = jsonlogger.JsonFormatter('%(asctime)s %(name)s %(levelname)s %(message)s %(request_id)s')
        handler.setFormatter(fmt)
        root.addHandler(handler)

    # Add RequestIDFilter to all handlers
    for h in root.handlers:
        h.addFilter(RequestIDFilter())


def generate_request_id() -> str:
    rid = str(uuid.uuid4())
    REQUEST_ID_CTX.set(rid)
    return rid


def set_request_id(rid: str):
    REQUEST_ID_CTX.set(rid)


def get_request_id() -> str:
    return REQUEST_ID_CTX.get()


class RequestIDMiddleware(BaseHTTPMiddleware):
    """Starlette middleware that ensures each request has a request-id and
    exposes it to logs and Sentry via contextvar and tag.
    """
    async def dispatch(self, request: Request, call_next):
        # prefer client-provided request id if any
        rid = request.headers.get("X-Request-ID") or generate_request_id()
        set_request_id(rid)

        # attach to Sentry scope if available
        try:
            if sentry_sdk:
                with sentry_sdk.configure_scope() as scope:
                    scope.set_tag("request_id", rid)
        except Exception:
            # don't fail the request if sentry not available
            pass

        response = await call_next(request)
        # ensure response includes the request id header
        response.headers.setdefault("X-Request-ID", rid)
        return response
