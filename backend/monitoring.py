"""Sentry initialization helpers for the backend.

Call init_sentry(app=None) early in application startup. If SENTRY_DSN is not
set, this is a no-op. The module uses StarletteIntegration for FastAPI.
"""
import os
import logging

logger = logging.getLogger(__name__)


def init_sentry(app=None):
    dsn = os.environ.get("SENTRY_DSN") or os.environ.get("SENTRY_DSN_BACKEND")
    if not dsn:
        logger.info("Sentry DSN not provided; skipping Sentry initialization")
        return None

    try:
        import sentry_sdk
        from sentry_sdk.integrations.starlette import StarletteIntegration

        sentry_sdk.init(
            dsn=dsn,
            integrations=[StarletteIntegration()],
            traces_sample_rate=float(os.environ.get("SENTRY_TRACES_SAMPLE_RATE", "0.0")),
            environment=os.environ.get("ENV", os.environ.get("ENVIRONMENT", "development")),
            release=os.environ.get("RELEASE"),
            attach_stacktrace=True,
        )
        logger.info("Sentry initialized for backend")
    except Exception as e:
        logger.exception(f"Failed to initialize Sentry: {e}")

    return None
