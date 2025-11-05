// Vercel Serverless Function - Attendance
export default async function handler(req, res) {
  if (req.method === 'GET') {
    return handleGetAttendance(req, res);
  } else if (req.method === 'POST') {
    return handleCreateAttendance(req, res);
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function handleGetAttendance(req, res) {
  try {
    // Demo attendance records
    const demoAttendance = [
      {
        id: 1,
        employee_id: '1',
        employee_name: 'Demo User',
        date: new Date().toISOString().split('T')[0],
        check_in: '08:30',
        check_out: null,
        status: 'present',
        created_at: new Date().toISOString()
      },
      {
        id: 2,
        employee_id: '3010',
        employee_name: 'Çalışan 3010',
        date: new Date().toISOString().split('T')[0],
        check_in: '09:15',
        check_out: '17:45',
        status: 'present',
        created_at: new Date().toISOString()
      }
    ];

    res.status(200).json(demoAttendance);
  } catch (error) {
    console.error('Attendance GET error:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
}

async function handleCreateAttendance(req, res) {
  try {
    const { employee_id, type } = req.body; // type: 'check_in' or 'check_out'
    
    const attendanceRecord = {
      id: Date.now(),
      employee_id,
      date: new Date().toISOString().split('T')[0],
      [type]: new Date().toLocaleTimeString('tr-TR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      status: 'present',
      created_at: new Date().toISOString()
    };

    res.status(201).json(attendanceRecord);
  } catch (error) {
    console.error('Attendance CREATE error:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
}