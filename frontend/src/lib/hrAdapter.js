import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';
const API = BACKEND_URL ? `${BACKEND_URL.replace(/\/$/, '')}/api` : '/api';

export async function getStaffByCode(staffCode) {
  // Try backend endpoint commonly available; fallback to employees list filter
  try {
    const res = await axios.get(`${API}/employees?staffCode=${encodeURIComponent(staffCode)}`);
    return res.data;
  } catch (err) {
    // fallback: fetch all employees and match code locally (may be expensive)
    try {
      const all = await axios.get(`${API}/employees`);
      return (all.data || []).find(e => e.employee_id === String(staffCode) || e.id === Number(staffCode)) || null;
    } catch (err2) {
      console.error('hrAdapter.getStaffByCode error', err, err2);
      return null;
    }
  }
}

export async function verifyPin(staffId, pin) {
  // backend may provide a verify endpoint; otherwise this will fail gracefully
  try {
    const res = await axios.post(`${API}/staff/verify-pin`, { staffId, pin });
    return res.data && res.data.valid === true;
  } catch (err) {
    console.warn('verifyPin endpoint not available, falling back to false');
    return false;
  }
}

export async function getPermissionsForStaff(staffId) {
  try {
    const res = await axios.get(`${API}/staff-permissions?staffId=${staffId}`);
    return res.data || {};
  } catch (err) {
    // fallback: empty permissions
    console.warn('getPermissionsForStaff fallback to empty', err.message);
    return {};
  }
}
