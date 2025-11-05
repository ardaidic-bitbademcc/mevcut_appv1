// Vercel Serverless Function - Staff Permissions
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { staffId } = req.query;
  
  if (!staffId) {
    return res.status(400).json({ error: 'Staff ID is required' });
  }

  // Define permissions based on staff ID or role
  let permissions = {};
  
  // Demo admin users (demo, employee3010, or ID 1)
  if (staffId === '1' || staffId === 'demo' || staffId === '3010') {
    permissions = {
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
    };
  } else {
    // Default employee permissions
    permissions = {
      dashboard: true,
      view_dashboard: true,
      view_tasks: true,
      timesheet: true,
      view_attendance: true,
      POS_VIEW: true
    };
  }
  
  return res.status(200).json(permissions);
}