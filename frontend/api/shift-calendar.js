// Vercel Serverless Function - Shift Calendar
export default async function handler(req, res) {
  if (req.method === 'GET') {
    return handleGetShiftCalendar(req, res);
  } else if (req.method === 'POST') {
    return handleCreateShiftAssignment(req, res);
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function handleGetShiftCalendar(req, res) {
  try {
    // Demo shift calendar assignments
    const today = new Date();
    const demoShiftCalendar = [];
    
    // Generate demo shifts for current week
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      
      // Morning shift
      demoShiftCalendar.push({
        id: `morning_${i}`,
        employee_id: '1',
        employee_name: 'Demo User',
        shift_type_id: 1,
        shift_name: 'Sabah Vardiyası',
        date: dateStr,
        start_time: '08:00',
        end_time: '16:00',
        status: 'scheduled'
      });
      
      // Afternoon shift
      demoShiftCalendar.push({
        id: `afternoon_${i}`,
        employee_id: '3010',
        employee_name: 'Çalışan 3010',
        shift_type_id: 2,
        shift_name: 'Öğle Vardiyası',
        date: dateStr,
        start_time: '12:00',
        end_time: '20:00',
        status: 'scheduled'
      });
    }

    res.status(200).json(demoShiftCalendar);
  } catch (error) {
    console.error('Shift calendar GET error:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
}

async function handleCreateShiftAssignment(req, res) {
  try {
    const { employee_id, shift_type_id, date, start_time, end_time } = req.body;
    
    const newAssignment = {
      id: Date.now(),
      employee_id,
      shift_type_id,
      date,
      start_time,
      end_time,
      status: 'scheduled',
      created_at: new Date().toISOString()
    };

    res.status(201).json(newAssignment);
  } catch (error) {
    console.error('Shift assignment CREATE error:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
}