// Vercel Serverless Function - Employees
import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://ardaidic:X3BQwSJ6A8CragyI@mevcutapp.9xm51lp.mongodb.net/mevcut_db?retryWrites=true&w=majority';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    return handleGetEmployees(req, res);
  } else if (req.method === 'POST') {
    return handleCreateEmployee(req, res);
  } else if (req.method === 'PUT') {
    return handleUpdateEmployee(req, res);
  } else if (req.method === 'DELETE') {
    return handleDeleteEmployee(req, res);
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function handleGetEmployees(req, res) {
  try {
    // Try MongoDB first, fallback to demo data
    try {
      const client = new MongoClient(MONGODB_URI);
      await client.connect();
      
      const db = client.db('mevcut_db');
      const employees = await db.collection('employees').find({}, { 
        projection: { password: 0 } // Exclude passwords
      }).toArray();
      
      await client.close();
      
      if (employees && employees.length > 0) {
        return res.status(200).json(employees);
      }
    } catch (mongoError) {
      console.log('MongoDB error, using demo data:', mongoError.message);
    }

    // Fallback demo employees data
    const demoEmployees = [
      {
        id: 1,
        email: 'demo@test.com',
        ad: 'Demo',
        soyad: 'User',
        rol: 'admin',
        company_id: 1,
        employee_id: '1',
        pozisyon: 'Administrator',
        maas_tabani: 50000
      },
      {
        id: 3010,
        employee_id: '3010',
        email: 'employee3010@company.com',
        ad: 'Çalışan',
        soyad: '3010',
        rol: 'employee',
        company_id: 1,
        pozisyon: 'Worker',
        maas_tabani: 30000
      }
    ];
    
    res.status(200).json(demoEmployees);
  } catch (error) {
    console.error('Employees error:', error);
    res.status(500).json({ error: 'Server error' });
  }
}

async function handleCreateEmployee(req, res) {
  try {
    const { ad, soyad, pozisyon, maas_tabani, rol, email, employee_id } = req.body;
    
    if (!ad || !soyad || !email || !employee_id) {
      return res.status(400).json({ error: 'Gerekli alanlar eksik' });
    }

    const newEmployee = {
      id: Date.now(),
      employee_id,
      email,
      ad,
      soyad,
      pozisyon: pozisyon || 'Worker',
      maas_tabani: maas_tabani || 25000,
      rol: rol || 'employee',
      company_id: 1,
      created_at: new Date().toISOString()
    };

    // Try MongoDB first
    try {
      const client = new MongoClient(MONGODB_URI);
      await client.connect();
      
      const db = client.db('mevcut_db');
      
      // Check if employee_id exists
      const existing = await db.collection('employees').findOne({ 
        $or: [{ email }, { employee_id }] 
      });
      
      if (existing) {
        await client.close();
        return res.status(400).json({ error: 'Email veya employee_id zaten kullanımda' });
      }

      const result = await db.collection('employees').insertOne(newEmployee);
      await client.close();
      
      return res.status(201).json({ ...newEmployee, _id: result.insertedId });
    } catch (mongoError) {
      console.log('MongoDB error, using demo response:', mongoError.message);
      return res.status(201).json(newEmployee);
    }
  } catch (error) {
    console.error('Employee CREATE error:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
}

async function handleUpdateEmployee(req, res) {
  try {
    const { id } = req.query;
    const updateData = req.body;

    // Demo response for now
    res.status(200).json({ 
      success: true, 
      message: 'Employee updated successfully (demo)',
      id,
      ...updateData
    });
  } catch (error) {
    console.error('Employee UPDATE error:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
}

async function handleDeleteEmployee(req, res) {
  try {
    const { id } = req.query;

    // Demo response for now
    res.status(200).json({ 
      success: true, 
      message: 'Employee deleted successfully (demo)',
      id
    });
  } catch (error) {
    console.error('Employee DELETE error:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
}