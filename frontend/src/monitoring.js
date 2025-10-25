// Initialize Sentry for frontend (if DSN provided via REACT_APP_SENTRY_DSN)
try {
  const SENTRY_DSN = process.env.REACT_APP_SENTRY_DSN;
  if (SENTRY_DSN) {
    // @ts-ignore - dynamic import for optional dependency
    const Sentry = require('@sentry/react');
    Sentry.init({
      dsn: SENTRY_DSN,
      environment: process.env.NODE_ENV || 'development',
      tracesSampleRate: parseFloat(process.env.REACT_APP_SENTRY_TRACES_SAMPLE_RATE || '0.0'),
    });
    // eslint-disable-next-line no-console
    console.info('Sentry initialized (frontend)');
  }
} catch (e) {
  // eslint-disable-next-line no-console
  console.warn('Failed to initialize frontend Sentry', e);
}

export {};
