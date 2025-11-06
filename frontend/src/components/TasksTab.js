import React from 'react';
import { Plus, Trash2 } from 'lucide-react';

const TasksTab = ({ tasks, employees, newTask, setNewTask, addTask, updateTask, deleteTask, permissions, employee }) => {
  const isAssignedToMe = (task) => task.atanan_personel_ids && task.atanan_personel_ids.includes(employee.id);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold mb-6">✅ Görevler</h2>

      {permissions.assign_tasks && (
        <div className="bg-blue-50 p-6 rounded-lg border border-blue-200 mb-6">
          <h3 className="font-bold mb-4">Yeni Görev Oluştur</h3>
          <div className="space-y-4">
            <input type="text" placeholder="Görev Başlığı" value={newTask.baslik} onChange={(e) => setNewTask({ ...newTask, baslik: e.target.value })} className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            <textarea placeholder="Görev Açıklaması" value={newTask.aciklama} onChange={(e) => setNewTask({ ...newTask, aciklama: e.target.value })} className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" rows="3" />
            <div>
              <label className="block font-semibold mb-2">Personel Seç (Birden fazla seçebilirsiniz):</label>
              <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border rounded-lg p-3 bg-gray-50">
                {employees.map(emp => (
                  <label key={emp.id} className="flex items-center gap-2 cursor-pointer hover:bg-white p-2 rounded">
                    <input
                      type="checkbox"
                      checked={newTask.atanan_personel_ids.includes(emp.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setNewTask({ ...newTask, atanan_personel_ids: [...newTask.atanan_personel_ids, emp.id] });
                        } else {
                          setNewTask({ ...newTask, atanan_personel_ids: newTask.atanan_personel_ids.filter(id => id !== emp.id) });
                        }
                      }}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">{emp.ad} {emp.soyad}</span>
                  </label>
                ))}
              </div>
              {newTask.atanan_personel_ids.length > 0 && (
                <p className="text-sm text-green-600 mt-2">✓ {newTask.atanan_personel_ids.length} personel seçildi</p>
              )}
            </div>
            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newTask.tekrarlayan}
                  onChange={(e) => setNewTask({ ...newTask, tekrarlayan: e.target.checked })}
                  className="w-4 h-4"
                />
                <span className="font-semibold">🔄 Tekrarlayan Görev</span>
              </label>
              {newTask.tekrarlayan && (
                <div className="mt-2 space-y-3">
                  <div className="flex gap-2 items-center">
                    <input
                      type="number"
                      min="1"
                      value={newTask.tekrar_sayi}
                      onChange={(e) => setNewTask({ ...newTask, tekrar_sayi: parseInt(e.target.value) || 1 })}
                      className="w-20 px-3 py-2 border rounded-lg"
                    />
                    <select value={newTask.tekrar_birim} onChange={(e) => setNewTask({ ...newTask, tekrar_birim: e.target.value })} className="flex-1 px-4 py-2 border rounded-lg">
                      <option value="gun">Gün</option>
                      <option value="hafta">Hafta</option>
                      <option value="ay">Ay</option>
                    </select>
                    <span className="text-sm text-gray-600">de bir</span>
                  </div>
                  <p className="text-xs text-gray-600">
                    Örnek: <span className="font-semibold">{newTask.tekrar_sayi} {newTask.tekrar_birim === 'gun' ? 'günde' : newTask.tekrar_birim === 'hafta' ? 'haftada' : 'ayda'} bir</span> tekrar edilecek
                  </p>
                </div>
              )}
            </div>
            <button onClick={addTask} className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold flex items-center justify-center gap-2"><Plus className="w-4 h-4" /> Görev Oluştur</button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {tasks.filter(task => {
          if (permissions.assign_tasks) return true;
          return isAssignedToMe(task);
        }).map(task => {
          const atananPersoneller = employees.filter(e => task.atanan_personel_ids && task.atanan_personel_ids.includes(e.id));
          return (
            <div key={task.id} className="border-2 border-gray-200 rounded-lg p-4 hover:shadow-md transition">
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-800">{task.baslik}</h3>
                  <p className="text-sm text-gray-600 mt-1">{task.aciklama}</p>
                </div>
                <div className="flex gap-2">
                  {permissions.rate_tasks && task.durum === 'tamamlandi' && !task.puan && (
                    <select onChange={(e) => {
                      const puan = parseInt(e.target.value);
                      if (puan) updateTask(task.id, { puan });
                    }} className="px-2 py-1 border rounded text-sm">
                      <option value="">Puan Ver</option>
                      {[1, 2, 3, 4, 5].map(p => <option key={p} value={p}>{p} ⭐</option>)}
                    </select>
                  )}
                  {permissions.assign_tasks && (
                    <button onClick={() => deleteTask(task.id)} className="px-3 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"><Trash2 className="w-3 h-3" /></button>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${task.durum === 'beklemede' ? 'bg-yellow-100 text-yellow-800' : task.durum === 'devam_ediyor' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                  {task.durum === 'beklemede' ? 'Beklemede' : task.durum === 'devam_ediyor' ? 'Devam Ediyor' : 'Tamamlandı'}
                </span>
                {atananPersoneller.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {atananPersoneller.map(person => (
                      <span key={person.id} className={`px-3 py-1 rounded-full text-xs font-semibold ${person.id === employee.id ? 'bg-green-100 text-green-800' : 'bg-purple-100 text-purple-800'}`}>
                        {person.id === employee.id ? '👤 Sen' : `${person.ad} ${person.soyad}`}
                      </span>
                    ))}
                  </div>
                )}
                {task.puan && (
                  <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-semibold">Puan: {task.puan} ⭐</span>
                )}
                {task.tekrarlayan && (
                  <span className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-xs font-semibold">🔄 Tekrarlayan</span>
                )}
              </div>
              {isAssignedToMe(task) && task.durum !== 'tamamlandi' && (
                <div className="mt-3 flex gap-2">
                  {task.durum === 'beklemede' && (
                    <button onClick={() => updateTask(task.id, { durum: 'devam_ediyor' })} className="px-4 py-2 bg-blue-500 text-white rounded text-sm hover:bg-blue-600">Başlat</button>
                  )}
                  {task.durum === 'devam_ediyor' && (
                    <button onClick={() => updateTask(task.id, { durum: 'tamamlandi' })} className="px-4 py-2 bg-green-500 text-white rounded text-sm hover:bg-green-600">Tamamla</button>
                  )}
                </div>
              )}
            </div>
          );
        })}
        {tasks.filter(task => {
          if (permissions.assign_tasks) return true;
          return isAssignedToMe(task);
        }).length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p>Henüz görev yok</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TasksTab;
