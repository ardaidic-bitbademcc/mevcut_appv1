// Vercel Serverless Function - Login
import { MongoClient } from 'mongodb';
import bcrypt from 'bcryptjs';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://mevcut:mevcut123@cluster0.mongodb.net/mevcut_db?retryWrites=true&w=majority';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, password } = req.body;
    
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    
    const db = client.db('mevcut_db');
    const employee = await db.collection('employees').findOne({ email });
    
    if (!employee) {
      await client.close();
      return res.status(401).json({ error: 'Kullanıcı bulunamadı' });
    }

    // Password verification
    const isValid = await bcrypt.compare(password, employee.password);
    if (!isValid) {
      await client.close();
      return res.status(401).json({ error: 'Hatalı şifre' });
    }

    await client.close();
    
    // Remove password from response
    const { password: _, ...employeeData } = employee;
    
    res.status(200).json(employeeData);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
}