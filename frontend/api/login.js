// Working login function
import { MongoClient } from 'mongodb';
import bcrypt from 'bcryptjs';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://ardaidic:X3BQwSJ6A8CragyI@mevcutapp.9xm51lp.mongodb.net/mevcut_db?retryWrites=true&w=majority';

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

    // Try MongoDB for real users
    try {
      const client = new MongoClient(MONGODB_URI);
      await client.connect();
      
      const db = client.db('mevcut_db');
      const employee = await db.collection('employees').findOne({ email });
      
      if (employee) {
        // Password verification
        const isValid = await bcrypt.compare(password, employee.password);
        if (isValid) {
          await client.close();
          const { password: _, ...employeeData } = employee;
          return res.status(200).json({ ...employeeData, success: true });
        }
      }
      
      await client.close();
    } catch (mongoError) {
      console.log('MongoDB login error:', mongoError.message);
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