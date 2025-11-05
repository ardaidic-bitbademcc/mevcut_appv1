// Vercel Serverless Function - Leave Records
export default async function handler(req, res) {
  if (req.method === 'GET') {
    return handleGetLeaveRecords(req, res);
  } else if (req.method === 'POST') {
    return handleCreateLeaveRecord(req, res);
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function handleGetLeaveRecords(req, res) {
  try {
    // Demo leave records
    const demoLeaveRecords = [
      {
        id: 1,
        employee_id: '1',
        employee_name: 'Demo User',
        leave_type: 'annual',
        start_date: '2025-11-10',
        end_date: '2025-11-12',
        days: 3,
        reason: 'Yıllık izin',
        status: 'approved',
        applied_at: new Date().toISOString(),
        approved_by: '1',
        approved_at: new Date().toISOString()
      },
      {
        id: 2,
        employee_id: '3010',
        employee_name: 'Çalışan 3010',
        leave_type: 'sick',
        start_date: '2025-11-08',
        end_date: '2025-11-08',
        days: 1,
        reason: 'Sağlık raporu',
        status: 'pending',
        applied_at: new Date(Date.now() - 24*60*60*1000).toISOString()
      }
    ];

    res.status(200).json(demoLeaveRecords);
  } catch (error) {
    console.error('Leave records GET error:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
}

async function handleCreateLeaveRecord(req, res) {
  try {
    const { employee_id, leave_type, start_date, end_date, reason } = req.body;
    
    // Calculate days between dates
    const startDate = new Date(start_date);
    const endDate = new Date(end_date);
    const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
    
    const newLeaveRecord = {
      id: Date.now(),
      employee_id,
      leave_type: leave_type || 'annual',
      start_date,
      end_date,
      days,
      reason,
      status: 'pending',
      applied_at: new Date().toISOString()
    };

    res.status(201).json(newLeaveRecord);
  } catch (error) {
    console.error('Leave record CREATE error:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
}