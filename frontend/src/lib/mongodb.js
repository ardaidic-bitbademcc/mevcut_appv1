// Direct MongoDB Atlas connection for frontend
import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.REACT_APP_MONGODB_URI || 'mongodb+srv://username:password@cluster.mongodb.net/dbname';

let client = null;

export async function connectDB() {
  if (!client) {
    client = new MongoClient(MONGODB_URI);
    await client.connect();
  }
  return client.db();
}

export async function getEmployees() {
  const db = await connectDB();
  return await db.collection('employees').find({}).toArray();
}

export async function login(email, password) {
  const db = await connectDB();
  const employee = await db.collection('employees').findOne({ email });
  // Add password verification logic
  return employee;
}