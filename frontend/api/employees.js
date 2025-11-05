// Vercel Serverless Function - Employees
import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://mevcut_usr:Mevcut123@cluster0.ib7ajzf.mongodb.net/mevcut_db?retryWrites=true&w=majority';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Demo employees data
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