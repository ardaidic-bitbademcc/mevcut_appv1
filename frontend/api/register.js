// Vercel Serverless Function - Register
import { MongoClient } from 'mongodb';
import bcrypt from 'bcryptjs';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://ardaidic:X3BQwSJ6A8CragyI@mevcutapp.9xm51lp.mongodb.net/mevcut_db?retryWrites=true&w=majority';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { ad, soyad, email, employee_id } = req.body;
    
    console.log('Register attempt:', { email, employee_id, timestamp: new Date().toISOString() });

    // Validation
    if (!ad || !soyad || !email || !employee_id) {
      return res.status(400).json({ 
        error: 'Tüm alanları doldurunuz!',
        detail: 'Ad, soyad, email ve employee_id gerekli'
      });
    }

    if (employee_id.length !== 4) {
      return res.status(400).json({ 
        error: 'Personel ID tam 4 haneli olmalıdır!',
        detail: 'employee_id 4 haneli olmalı'
      });
    }

    // Demo mode - don't actually save to database
    // Generate a demo response
    const demoEmployee = {
      id: Date.now(),
      employee_id,
      email,
      ad,
      soyad,
      rol: 'employee',
      company_id: 1,
      pozisyon: 'Worker',
      maas_tabani: 25000,
      created_at: new Date().toISOString()
    };

    // Check if it's a real database operation (MongoDB connection)
    try {
      const client = new MongoClient(MONGODB_URI);
      await client.connect();
      
      const db = client.db('mevcut_db');
      
      // Check if email or employee_id already exists
      const existingEmployee = await db.collection('employees').findOne({
        $or: [{ email }, { employee_id }]
      });
      
      if (existingEmployee) {
        await client.close();
        return res.status(400).json({ 
          error: 'Bu email veya personel ID zaten kullanımda!',
          detail: 'Email or employee_id already exists'
        });
      }

      // Hash password (use employee_id as default password)
      const password = employee_id; // Default password is employee_id
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create new employee
      const newEmployee = {
        ...demoEmployee,
        password: hashedPassword
      };

      const result = await db.collection('employees').insertOne(newEmployee);
      await client.close();

      // Remove password from response
      const { password: _, ...employeeResponse } = newEmployee;
      
      return res.status(200).json({
        success: true,
        message: 'Kayıt başarılı!',
        employee: employeeResponse
      });

    } catch (mongoError) {
      console.log('MongoDB error, using demo response:', mongoError.message);
      
      // Return demo success response
      return res.status(200).json({
        success: true,
        message: 'Kayıt başarılı! (Demo Mode)',
        employee: demoEmployee
      });
    }
    
  } catch (error) {
    console.error('Register error:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    res.status(500).json({ 
      error: 'Server error', 
      details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
}