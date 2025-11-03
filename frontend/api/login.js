// Working login function

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('Raw request:', { method: req.method, body: req.body });
    const { email, password } = req.body || {};
    
    // Demo users
    if (email === 'demo@test.com' && password === 'demo123') {
      return res.status(200).json({
        id: 1,
        email: 'demo@test.com',
        ad: 'Demo',
        soyad: 'User',
        rol: 'admin',
        company_id: 1,
        success: true
      });
    }

    if (email === 'employee3010@company.com' && password === '3010') {
      return res.status(200).json({
        id: 3010,
        employee_id: '3010',
        email: 'employee3010@company.com',
        ad: 'Çalışan',
        soyad: '3010',
        rol: 'employee',
        company_id: 1,
        success: true
      });
    }

    return res.status(401).json({ 
      error: 'Hatalı giriş bilgileri', 
      message: 'Demo: demo@test.com/demo123 veya employee3010@company.com/3010' 
    });
    
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ 
      error: 'Server error', 
      details: error.message,
      stack: error.stack
    });
  }
}