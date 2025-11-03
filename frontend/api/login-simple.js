// Minimal login function
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // For demo only
    return res.status(200).json({
      id: 1,
      email: 'demo@test.com',
      ad: 'Demo',
      soyad: 'User',
      rol: 'admin',
      company_id: 1,
      success: true
    });
    
  } catch (error) {
    return res.status(500).json({ 
      error: 'Server error', 
      details: error.message
    });
  }
}