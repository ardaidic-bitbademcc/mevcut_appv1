// Vercel Serverless Function - Tasks
export default async function handler(req, res) {
  if (req.method === 'GET') {
    return handleGetTasks(req, res);
  } else if (req.method === 'POST') {
    return handleCreateTask(req, res);
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function handleGetTasks(req, res) {
  try {
    // Demo tasks
    const demoTasks = [
      {
        id: 1,
        baslik: 'Mutfak Temizliği',
        aciklama: 'Günlük mutfak temizlik kontrolleri yapılacak',
        atanan_personel_ids: ['1', '3010'],
        durum: 'pending',
        olusturan_id: '1',
        created_at: new Date().toISOString(),
        due_date: new Date(Date.now() + 24*60*60*1000).toISOString()
      },
      {
        id: 2,
        baslik: 'Stok Sayımı',
        aciklama: 'Haftalık stok sayım işlemi',
        atanan_personel_ids: ['1'],
        durum: 'in_progress',
        olusturan_id: '1',
        created_at: new Date().toISOString(),
        due_date: new Date(Date.now() + 48*60*60*1000).toISOString()
      },
      {
        id: 3,
        baslik: 'Müşteri Hizmetleri',
        aciklama: 'Müşteri geri bildirimlerini değerlendir',
        atanan_personel_ids: ['3010'],
        durum: 'completed',
        olusturan_id: '1',
        created_at: new Date(Date.now() - 24*60*60*1000).toISOString(),
        due_date: new Date().toISOString(),
        completed_at: new Date().toISOString()
      }
    ];

    res.status(200).json(demoTasks);
  } catch (error) {
    console.error('Tasks GET error:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
}

async function handleCreateTask(req, res) {
  try {
    const { baslik, aciklama, atanan_personel_ids, due_date } = req.body;
    
    const newTask = {
      id: Date.now(),
      baslik,
      aciklama,
      atanan_personel_ids: atanan_personel_ids || [],
      durum: 'pending',
      olusturan_id: '1', // Demo creator
      created_at: new Date().toISOString(),
      due_date: due_date || new Date(Date.now() + 24*60*60*1000).toISOString()
    };

    res.status(201).json(newTask);
  } catch (error) {
    console.error('Task CREATE error:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
}