import React from 'react';
import { Plus, Trash2, Edit2, Check, X } from 'lucide-react';

const PersonnelTab = ({
  employees,
  roles,
  newEmployee,
  setNewEmployee,
  addEmployee,
  editingEmployee,
  setEditingEmployee,
  editData,
  setEditData,
  saveEmployee,
  deleteEmployee,
  startEditEmployee,
  attendance,
}) => {
  return (
    <div>
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">➕ Yeni Personel Ekle</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input type="text" placeholder="Ad" value={newEmployee.ad} onChange={(e) => setNewEmployee({ ...newEmployee, ad: e.target.value })} className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          <input type="text" placeholder="Soyad" value={newEmployee.soyad} onChange={(e) => setNewEmployee({ ...newEmployee, soyad: e.target.value })} className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          <input type="email" placeholder="E-mail" value={newEmployee.email} onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })} className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          <input type="text" placeholder="Personel ID (4 haneli rakam)" maxLength="4" value={newEmployee.employee_id} onChange={(e) => {
            const value = e.target.value.replace(/\D/g, '');
            setNewEmployee({ ...newEmployee, employee_id: value });
          }} className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          <input type="text" placeholder="Pozisyon" value={newEmployee.pozisyon} onChange={(e) => setNewEmployee({ ...newEmployee, pozisyon: e.target.value })} className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          <input type="number" placeholder="Maaş (₺)" value={newEmployee.maas_tabani} onChange={(e) => setNewEmployee({ ...newEmployee, maas_tabani: e.target.value })} className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          <select value={newEmployee.rol} onChange={(e) => setNewEmployee({ ...newEmployee, rol: e.target.value })} className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
            {roles.map(role => (
              <option key={role.id} value={role.id}>{role.name}</option>
            ))}
          </select>
        </div>
        <button onClick={addEmployee} className="mt-4 w-full px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold flex items-center justify-center gap-2"><Plus className="w-4 h-4" /> Personel Ekle</button>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">📋 Personel Listesi</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-2 text-left">ID</th>
                <th className="px-4 py-2 text-left">Ad Soyad</th>
                <th className="px-4 py-2 text-left">E-mail</th>
                <th className="px-4 py-2 text-left">Pozisyon</th>
                <th className="px-4 py-2 text-left">Maaş (₺)</th>
                <th className="px-4 py-2 text-left">Rol</th>
                <th className="px-4 py-2 text-left">İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {employees.map(emp => (
                <tr key={emp.id} className={editingEmployee === emp.id ? 'bg-blue-50' : 'border-b hover:bg-gray-50'}>
                  {editingEmployee === emp.id ? (
                    <>
                      <td className="px-4 py-2">
                        <input type="text" maxLength="4" value={editData.employee_id} onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '');
                          setEditData({ ...editData, employee_id: value });
                        }} className="w-full px-2 py-1 border rounded" />
                      </td>
                      <td className="px-4 py-2">
                        <input type="text" value={editData.ad} onChange={(e) => setEditData({ ...editData, ad: e.target.value })} className="w-full px-2 py-1 border rounded mb-1" />
                        <input type="text" value={editData.soyad} onChange={(e) => setEditData({ ...editData, soyad: e.target.value })} className="w-full px-2 py-1 border rounded" />
                      </td>
                      <td className="px-4 py-2">
                        <input type="email" value={editData.email} onChange={(e) => setEditData({ ...editData, email: e.target.value })} className="w-full px-2 py-1 border rounded" />
                      </td>
                      <td className="px-4 py-2">
                        <input type="text" value={editData.pozisyon} onChange={(e) => setEditData({ ...editData, pozisyon: e.target.value })} className="w-full px-2 py-1 border rounded" />
                      </td>
                      <td className="px-4 py-2">
                        <input type="number" value={editData.maas_tabani} onChange={(e) => setEditData({ ...editData, maas_tabani: e.target.value })} className="w-full px-2 py-1 border rounded" />
                      </td>
                      <td className="px-4 py-2">
                        <select value={editData.rol} onChange={(e) => setEditData({ ...editData, rol: e.target.value })} className="w-full px-2 py-1 border rounded">
                          {roles.map(role => (
                            <option key={role.id} value={role.id}>{role.name}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-2 flex gap-2">
                        <button onClick={saveEmployee} className="px-3 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600 font-semibold flex items-center gap-1"><Check className="w-3 h-3" /> Kaydet</button>
                        <button onClick={() => setEditingEmployee(null)} className="px-3 py-1 bg-gray-500 text-white rounded text-xs hover:bg-gray-600 font-semibold flex items-center gap-1"><X className="w-3 h-3" /> İptal</button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-2 font-bold text-indigo-600">{emp.employee_id}</td>
                      <td className="px-4 py-2 font-semibold">{emp.ad} {emp.soyad}</td>
                      <td className="px-4 py-2">{emp.email}</td>
                      <td className="px-4 py-2">{emp.pozisyon}</td>
                      <td className="px-4 py-2">₺{emp.maas_tabani.toLocaleString('tr-TR')}</td>
                      <td className="px-4 py-2"><span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded text-xs font-semibold">{roles.find(r => r.id === emp.rol)?.name}</span></td>
                      <td className="px-4 py-2 flex gap-2">
                        <button onClick={() => startEditEmployee(emp)} className="px-3 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 font-semibold flex items-center gap-1"><Edit2 className="w-3 h-3" /> Düzenle</button>
                        <button onClick={() => deleteEmployee(emp.id)} className="px-3 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600 font-semibold flex items-center gap-1"><Trash2 className="w-3 h-3" /> Sil</button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mt-6">
        <h2 className="text-xl font-bold mb-4">📋 Kiosk Giriş-Çıkış Geçmişi</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-2 text-left">Personel</th>
                <th className="px-4 py-2 text-left">ID</th>
                <th className="px-4 py-2 text-left">Tarih</th>
                <th className="px-4 py-2 text-left">Giriş</th>
                <th className="px-4 py-2 text-left">Çıkış</th>
                <th className="px-4 py-2 text-left">Çalışılan Saat</th>
              </tr>
            </thead>
            <tbody>
              {attendance.map(att => (
                <tr key={att.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-2 font-semibold">{att.ad} {att.soyad}</td>
                  <td className="px-4 py-2 font-bold text-indigo-600">{att.employee_id}</td>
                  <td className="px-4 py-2">{att.tarih}</td>
                  <td className="px-4 py-2">{att.giris_saati ? new Date(att.giris_saati).toLocaleTimeString('tr-TR') : '-'}</td>
                  <td className="px-4 py-2">{att.cikis_saati ? new Date(att.cikis_saati).toLocaleTimeString('tr-TR') : '-'}</td>
                  <td className="px-4 py-2 font-semibold">{att.calisilan_saat > 0 ? `${att.calisilan_saat}h` : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PersonnelTab;
