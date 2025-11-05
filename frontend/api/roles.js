// Vercel Serverless Function - Roles
import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://ardaidic:X3BQwSJ6A8CragyI@mevcutapp.9xm51lp.mongodb.net/mevcut_db?retryWrites=true&w=majority';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    return handleGetRoles(req, res);
  } else if (req.method === 'POST') {
    return handleCreateRole(req, res);
  } else if (req.method === 'PUT') {
    return handleUpdateRole(req, res);
  } else if (req.method === 'DELETE') {
    return handleDeleteRole(req, res);
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function handleGetRoles(req, res) {
  try {
    // Try MongoDB first, fallback to demo data
    try {
      const client = new MongoClient(MONGODB_URI);
      await client.connect();
      
      const db = client.db('mevcut_db');
      const roles = await db.collection('roles').find({}).toArray();
      
      await client.close();
      
      if (roles && roles.length > 0) {
        return res.status(200).json(roles);
      }
    } catch (mongoError) {
      console.log('MongoDB error, using demo roles:', mongoError.message);
    }

    // Demo roles with comprehensive permissions
    const demoRoles = [
      {
        id: 'admin',
        name: 'Administrator',
        permissions: {
          dashboard: true,
          view_dashboard: true,
          employees: true,
          view_employees: true,
          manage_employees: true,
          add_employee: true,
          edit_employee: true,
          delete_employee: true,
          reports: true,
          view_reports: true,
          view_salary: true,
          view_tasks: true,
          manage_tasks: true,
          assign_tasks: true,
          manage_shifts: true,
          manage_shifts_types: true,
          manage_leave: true,
          view_attendance: true,
          manage_roles: true,
          manage_permissions: true,
          can_view_stock: true,
          can_edit_stock: true,
          can_add_stock: true,
          can_delete_stock: true,
          POS_VIEW: true,
          POS_EDIT: true,
          POS_ADMIN: true,
          admin_panel: true,
          system_settings: true
        }
      },
      {
        id: 'manager',
        name: 'Yönetici',
        permissions: {
          dashboard: true,
          view_dashboard: true,
          employees: true,
          view_employees: true,
          manage_employees: true,
          add_employee: true,
          edit_employee: true,
          reports: true,
          view_reports: true,
          view_salary: true,
          view_tasks: true,
          manage_tasks: true,
          assign_tasks: true,
          manage_shifts: true,
          manage_shifts_types: true,
          manage_leave: true,
          view_attendance: true,
          can_view_stock: true,
          can_edit_stock: true,
          POS_VIEW: true,
          POS_EDIT: true
        }
      },
      {
        id: 'chef',
        name: 'Şef',
        permissions: {
          dashboard: true,
          view_dashboard: true,
          view_employees: true,
          view_tasks: true,
          manage_tasks: true,
          assign_tasks: true,
          view_attendance: true,
          can_view_stock: true,
          can_edit_stock: true,
          can_add_stock: true,
          POS_VIEW: true
        }
      },
      {
        id: 'waiter',
        name: 'Garson',
        permissions: {
          dashboard: true,
          view_dashboard: true,
          view_tasks: true,
          view_attendance: true,
          can_view_stock: true,
          POS_VIEW: true,
          POS_EDIT: true
        }
      },
      {
        id: 'employee',
        name: 'Çalışan',
        permissions: {
          dashboard: true,
          view_dashboard: true,
          view_tasks: true,
          timesheet: true,
          view_attendance: true
        }
      },
      {
        id: 'kiosk',
        name: 'Kiosk',
        permissions: {
          kiosk: true
        }
      }
    ];

    res.status(200).json(demoRoles);
  } catch (error) {
    console.error('Roles GET error:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
}

async function handleCreateRole(req, res) {
  try {
    const { name, permissions } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Role name is required' });
    }

    const newRole = {
      id: name.toLowerCase().replace(/\s+/g, '_'),
      name,
      permissions: permissions || {},
      created_at: new Date().toISOString()
    };

    // Try to save to MongoDB, fallback to demo response
    try {
      const client = new MongoClient(MONGODB_URI);
      await client.connect();
      
      const db = client.db('mevcut_db');
      const result = await db.collection('roles').insertOne(newRole);
      
      await client.close();
      
      return res.status(201).json({ ...newRole, _id: result.insertedId });
    } catch (mongoError) {
      console.log('MongoDB error, returning demo response:', mongoError.message);
      return res.status(201).json({ ...newRole, _id: 'demo_' + Date.now() });
    }
  } catch (error) {
    console.error('Role CREATE error:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
}

async function handleUpdateRole(req, res) {
  // Demo implementation
  res.status(200).json({ success: true, message: 'Role updated (demo)' });
}

async function handleDeleteRole(req, res) {
  // Demo implementation
  res.status(200).json({ success: true, message: 'Role deleted (demo)' });
}