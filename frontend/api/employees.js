// Vercel Serverless Function - Employees
import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://mevcut_usr:Mevcut123@cluster0.ib7ajzf.mongodb.net/mevcut_db?retryWrites=true&w=majority';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    
    const db = client.db('mevcut_db');
    const employees = await db.collection('employees').find({}, { 
      projection: { password: 0 } // Exclude passwords
    }).toArray();
    
    await client.close();
    
    res.status(200).json(employees);
  } catch (error) {
    console.error('Employees error:', error);
    res.status(500).json({ error: 'Server error' });
  }
}