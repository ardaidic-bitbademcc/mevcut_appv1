import axios from 'axios';
import { API } from '../config';

export const fetchEmployees = async () => {
  const res = await axios.get(`${API}/employees`);
  return res.data;
};

export const fetchRoles = async () => {
  const res = await axios.get(`${API}/roles`);
  return res.data;
};

export const fetchShiftTypes = async () => {
  const res = await axios.get(`${API}/shift-types`);
  return res.data;
};

export const fetchAttendance = async () => {
  const res = await axios.get(`${API}/attendance`);
  return res.data;
};

export const fetchLeaveRecords = async () => {
  const res = await axios.get(`${API}/leave-records`);
  return res.data;
};

export const fetchShiftCalendar = async () => {
  const res = await axios.get(`${API}/shift-calendar`);
  return res.data;
};

export const fetchTasks = async () => {
  const res = await axios.get(`${API}/tasks`);
  return res.data;
};

// add more API wrappers as needed (stockApi, salaryApi, posApi...)

export default {
  fetchEmployees,
  fetchRoles,
  fetchShiftTypes,
  fetchAttendance,
  fetchLeaveRecords,
  fetchShiftCalendar,
  fetchTasks,
};
