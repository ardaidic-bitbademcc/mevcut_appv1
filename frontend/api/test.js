// Simple test function
export default async function handler(req, res) {
  try {
    console.log('Test function called');
    res.status(200).json({ 
      message: 'Test successful', 
      timestamp: new Date().toISOString(),
      method: req.method 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}