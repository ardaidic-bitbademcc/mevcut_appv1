// Unified API Gateway - All endpoints in one function
import { MongoClient } from 'mongodb';
import bcrypt from 'bcryptjs';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://ardaidic:X3BQwSJ6A8CragyI@mevcutapp.9xm51lp.mongodb.net/mevcut_db?retryWrites=true&w=majority';

export default async function handler(req, res) {
  const { endpoint } = req.query;
  const route = Array.isArray(endpoint) ? endpoint.join('/') : (endpoint || '');

  console.log(`API Gateway: ${req.method} /${route}`, { endpoint });

  try {
    // Route to appropriate handler
    switch (route) {
      case 'roles':
        return handleRoles(req, res);
      case 'shift-types':
        return handleShiftTypes(req, res);
      case 'attendance':
        return handleAttendance(req, res);
      case 'tasks':
        return handleTasks(req, res);
      case 'leave-records':
        return handleLeaveRecords(req, res);
      case 'shift-calendar':
        return handleShiftCalendar(req, res);
      default:
        // Handle staff permissions: staff/[id]/permissions
        if (route && route.startsWith('staff/') && route.endsWith('/permissions')) {
          const staffId = route.split('/')[1];
          return handleStaffPermissions(req, res, staffId);
        }
        return res.status(404).json({ error: 'Endpoint not found', route, endpoint });
    }
  } catch (error) {
    console.error('API Gateway error:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
}

// ROLES
async function handleRoles(req, res) {
  if (req.method === 'GET') {
    const demoRoles = [
      {
        id: 'admin', name: 'Administrator',
        permissions: {
          dashboard: true, view_dashboard: true, employees: true, view_employees: true,
          manage_employees: true, add_employee: true, edit_employee: true, delete_employee: true,
          reports: true, view_reports: true, view_salary: true, view_tasks: true,
          manage_tasks: true, assign_tasks: true, manage_shifts: true, manage_shifts_types: true,
          manage_leave: true, view_attendance: true, manage_roles: true, manage_permissions: true,
          can_view_stock: true, can_edit_stock: true, can_add_stock: true, can_delete_stock: true,
          POS_VIEW: true, POS_EDIT: true, POS_ADMIN: true, admin_panel: true, system_settings: true
        }
      },
      {
        id: 'manager', name: 'Yönetici',
        permissions: {
          dashboard: true, view_dashboard: true, employees: true, view_employees: true,
          manage_employees: true, add_employee: true, edit_employee: true, reports: true,
          view_reports: true, view_salary: true, view_tasks: true, manage_tasks: true,
          assign_tasks: true, manage_shifts: true, manage_shifts_types: true, manage_leave: true,
          view_attendance: true, can_view_stock: true, can_edit_stock: true, POS_VIEW: true, POS_EDIT: true
        }
      },
      {
        id: 'chef', name: 'Şef',
        permissions: {
          dashboard: true, view_dashboard: true, view_employees: true, view_tasks: true,
          manage_tasks: true, assign_tasks: true, view_attendance: true, can_view_stock: true,
          can_edit_stock: true, can_add_stock: true, POS_VIEW: true
        }
      },
      {
        id: 'waiter', name: 'Garson',
        permissions: {
          dashboard: true, view_dashboard: true, view_tasks: true, view_attendance: true,
          can_view_stock: true, POS_VIEW: true, POS_EDIT: true
        }
      },
      {
        id: 'employee', name: 'Çalışan',
        permissions: { dashboard: true, view_dashboard: true, view_tasks: true, timesheet: true, view_attendance: true }
      },
      { id: 'kiosk', name: 'Kiosk', permissions: { kiosk: true } }
    ];
    return res.status(200).json(demoRoles);
  }
  return res.status(405).json({ error: 'Method not allowed' });
}

// SHIFT TYPES
async function handleShiftTypes(req, res) {
  if (req.method === 'GET') {
    const demoShiftTypes = [
      { id: 1, name: 'Sabah Vardiyası', start: '08:00', end: '16:00', color: 'bg-blue-500' },
      { id: 2, name: 'Öğle Vardiyası', start: '12:00', end: '20:00', color: 'bg-green-500' },
      { id: 3, name: 'Gece Vardiyası', start: '20:00', end: '04:00', color: 'bg-purple-500' }
    ];
    return res.status(200).json(demoShiftTypes);
  }
  return res.status(405).json({ error: 'Method not allowed' });
}

// ATTENDANCE
async function handleAttendance(req, res) {
  if (req.method === 'GET') {
    const demoAttendance = [
      {
        id: 1, employee_id: '1', employee_name: 'Demo User',
        date: new Date().toISOString().split('T')[0], check_in: '08:30', check_out: null, status: 'present'
      },
      {
        id: 2, employee_id: '3010', employee_name: 'Çalışan 3010',
        date: new Date().toISOString().split('T')[0], check_in: '09:15', check_out: '17:45', status: 'present'
      }
    ];
    return res.status(200).json(demoAttendance);
  }
  return res.status(405).json({ error: 'Method not allowed' });
}

// TASKS
async function handleTasks(req, res) {
  if (req.method === 'GET') {
    const demoTasks = [
      {
        id: 1, baslik: 'Mutfak Temizliği', aciklama: 'Günlük mutfak temizlik kontrolleri yapılacak',
        atanan_personel_ids: ['1', '3010'], durum: 'pending', olusturan_id: '1',
        created_at: new Date().toISOString(), due_date: new Date(Date.now() + 24*60*60*1000).toISOString()
      },
      {
        id: 2, baslik: 'Stok Sayımı', aciklama: 'Haftalık stok sayım işlemi',
        atanan_personel_ids: ['1'], durum: 'in_progress', olusturan_id: '1',
        created_at: new Date().toISOString(), due_date: new Date(Date.now() + 48*60*60*1000).toISOString()
      },
      {
        id: 3, baslik: 'Müşteri Hizmetleri', aciklama: 'Müşteri geri bildirimlerini değerlendir',
        atanan_personel_ids: ['3010'], durum: 'completed', olusturan_id: '1',
        created_at: new Date(Date.now() - 24*60*60*1000).toISOString(),
        due_date: new Date().toISOString(), completed_at: new Date().toISOString()
      }
    ];
    return res.status(200).json(demoTasks);
  }
  return res.status(405).json({ error: 'Method not allowed' });
}

// LEAVE RECORDS
async function handleLeaveRecords(req, res) {
  if (req.method === 'GET') {
    const demoLeaveRecords = [
      {
        id: 1, employee_id: '1', employee_name: 'Demo User', leave_type: 'annual',
        start_date: '2025-11-10', end_date: '2025-11-12', days: 3, reason: 'Yıllık izin',
        status: 'approved', applied_at: new Date().toISOString()
      },
      {
        id: 2, employee_id: '3010', employee_name: 'Çalışan 3010', leave_type: 'sick',
        start_date: '2025-11-08', end_date: '2025-11-08', days: 1, reason: 'Sağlık raporu',
        status: 'pending', applied_at: new Date(Date.now() - 24*60*60*1000).toISOString()
      }
    ];
    return res.status(200).json(demoLeaveRecords);
  }
  return res.status(405).json({ error: 'Method not allowed' });
}

// SHIFT CALENDAR
async function handleShiftCalendar(req, res) {
  if (req.method === 'GET') {
    const today = new Date();
    const demoShiftCalendar = [];
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      
      demoShiftCalendar.push(
        {
          id: `morning_${i}`, employee_id: '1', employee_name: 'Demo User',
          shift_type_id: 1, shift_name: 'Sabah Vardiyası', date: dateStr,
          start_time: '08:00', end_time: '16:00', status: 'scheduled'
        },
        {
          id: `afternoon_${i}`, employee_id: '3010', employee_name: 'Çalışan 3010',
          shift_type_id: 2, shift_name: 'Öğle Vardiyası', date: dateStr,
          start_time: '12:00', end_time: '20:00', status: 'scheduled'
        }
      );
    }
    return res.status(200).json(demoShiftCalendar);
  }
  return res.status(405).json({ error: 'Method not allowed' });
}

// STAFF PERMISSIONS
async function handleStaffPermissions(req, res, staffId) {
  if (req.method === 'GET') {
    let permissions = {};
    
    if (staffId === '1' || staffId === 'demo') {
      permissions = {
        dashboard: true, view_dashboard: true, employees: true, view_employees: true,
        manage_employees: true, add_employee: true, edit_employee: true, delete_employee: true,
        reports: true, view_reports: true, view_salary: true, view_tasks: true,
        manage_tasks: true, assign_tasks: true, manage_shifts: true, manage_shifts_types: true,
        manage_leave: true, view_attendance: true, manage_roles: true, manage_permissions: true,
        can_view_stock: true, can_edit_stock: true, can_add_stock: true, can_delete_stock: true,
        POS_VIEW: true, POS_EDIT: true, POS_ADMIN: true, admin_panel: true, system_settings: true
      };
    } else {
      permissions = {
        dashboard: true, view_dashboard: true, view_tasks: true, timesheet: true, view_attendance: true, POS_VIEW: true
      };
    }
    
    return res.status(200).json(permissions);
  }
  return res.status(405).json({ error: 'Method not allowed' });
}