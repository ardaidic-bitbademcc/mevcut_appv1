import React from 'react';

const DashboardTab = ({ employees, attendance, roles }) => {
  const presentEmployees = attendance.filter(a => a.status === 'giris');

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold mb-6">📊 Dashboard</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-blue-100 border border-blue-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-blue-800">Toplam Personel</h3>
          <p className="text-3xl font-bold text-blue-900">{employees.length}</p>
        </div>
        <div className="bg-green-100 border border-green-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-green-800">Mevcut Personel</h3>
          <p className="text-3xl font-bold text-green-900">{presentEmployees.length}</p>
        </div>
        <div className="bg-yellow-100 border border-yellow-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-yellow-800">Rol Sayısı</h3>
          <p className="text-3xl font-bold text-yellow-900">{roles.length}</p>
        </div>
      </div>
      <div className="mt-8">
        <h3 className="text-lg font-bold mb-4">Bugün Giriş Yapanlar</h3>
        {presentEmployees.length > 0 ? (
          <ul className="space-y-2">
            {presentEmployees.map(a => {
              const emp = employees.find(e => e.employee_id === a.employee_id);
              return (
                <li key={a.id} className="bg-gray-50 p-3 rounded-lg flex justify-between items-center">
                  <div>
                    <span className="font-semibold">{emp ? `${emp.ad} ${emp.soyad}` : a.employee_id}</span>
                    <span className="text-sm text-gray-500 ml-2">{emp?.pozisyon}</span>
                  </div>
                  <span className="text-sm text-green-600 font-medium">
                    Giriş: {new Date(a.giris_saati).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-gray-500">Bugün giriş yapan personel bulunmuyor.</p>
        )}
      </div>
    </div>
  );
};

export default DashboardTab;
