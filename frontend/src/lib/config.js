// Centralized frontend configuration  
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';
// Use Vercel serverless functions if no backend URL specified
export const API = BACKEND_URL ? `${BACKEND_URL.replace(/\/$/, '')}/api` : '/api';
export const STOCK_ENABLED = process.env.REACT_APP_STOCK_ENABLED === 'true';

// Add other shared config values here in future
export default {
  API,
  STOCK_ENABLED,
};
