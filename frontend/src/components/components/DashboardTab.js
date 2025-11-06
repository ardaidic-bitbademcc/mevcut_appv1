import React from 'react';

const DashboardTab = ({ employees, attendance, roles }) => {
  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
          <p className="text-gray-600 text-sm">Toplam Personel</p>
          <p className="text-3xl font-bold text-gray-800">{employees.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
          <p className="text-gray-600 text-sm">Bugün Giriş Yapanlar</p>
          <p className="text-3xl font-bold text-gray-800">{attendance.filter(a => a.tarih === new Date().toISOString().split('T')[0] && (a.status === 'giris' || a.status === 'cikis')).length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
          <p className="text-gray-600 text-sm">Çıkış Yapanlar</p>
          <p className="text-3xl font-bold text-gray-800">{attendance.filter(a => a.tarih === new Date().toISOString().split('T')[0] && a.status === 'cikis').length}</p>
        </div>
      </div>
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">Personel Listesi</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-2 text-left">Ad Soyad</th>
                <th className="px-4 py-2 text-left">Rol</th>
                <th className="px-4 py-2 text-left">Pozisyon</th>
                <th className="px-4 py-2 text-left">Maaş</th>
              </tr>
            </thead>
            <tbody>
              {employees.map(emp => (
                <tr key={emp.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-2 font-semibold">{emp.ad} {emp.soyad}</td>
                  <td className="px-4 py-2"><span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded text-xs font-semibold">{roles.find(r => r.id === emp.rol)?.name}</span></td>
                  <td className="px-4 py-2">{emp.pozisyon}</td>
                  <td className="px-4 py-2">₺{emp.maas_tabani.toLocaleString('tr-TR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DashboardTab;
