// Vercel Serverless Function - Shift Types
export default async function handler(req, res) {
  if (req.method === 'GET') {
    return handleGetShiftTypes(req, res);
  } else if (req.method === 'POST') {
    return handleCreateShiftType(req, res);
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function handleGetShiftTypes(req, res) {
  try {
    // Demo shift types
    const demoShiftTypes = [
      {
        id: 1,
        name: 'Sabah Vardiyası',
        start: '08:00',
        end: '16:00',
        color: 'bg-blue-500',
        created_at: new Date().toISOString()
      },
      {
        id: 2,
        name: 'Öğle Vardiyası',
        start: '12:00',
        end: '20:00',
        color: 'bg-green-500',
        created_at: new Date().toISOString()
      },
      {
        id: 3,
        name: 'Gece Vardiyası',
        start: '20:00',
        end: '04:00',
        color: 'bg-purple-500',
        created_at: new Date().toISOString()
      }
    ];

    res.status(200).json(demoShiftTypes);
  } catch (error) {
    console.error('Shift types GET error:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
}

async function handleCreateShiftType(req, res) {
  try {
    const { name, start, end, color } = req.body;
    
    const newShiftType = {
      id: Date.now(),
      name,
      start,
      end,
      color: color || 'bg-gray-500',
      created_at: new Date().toISOString()
    };

    res.status(201).json(newShiftType);
  } catch (error) {
    console.error('Shift type CREATE error:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
}