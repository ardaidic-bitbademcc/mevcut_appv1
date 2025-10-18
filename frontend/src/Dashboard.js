import React, { useState } from 'react';
import { LogOut, Plus, Trash2, Edit2 } from 'lucide-react';

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [employee, setEmployee] = useState(null);
  const [loginData, setLoginData] = useState({ email: '' });
  const [activeTab, setActiveTab] = useState('dashboard');

  const [employees, setEmployees] = useState([
    { id: 1, ad: 'Ahmet', soyad: 'Yılmaz', pozisyon: 'Yazılımcı', maas_tabani: 15000, rol: 'admin', email: 'admin@example.com', employee_id: '1001' },
    { id: 2, ad: 'Fatma', soyad: 'Demir', pozisyon: 'Tasarımcı', maas_tabani: 12000, rol: 'personel', email: 'fatma@example.com', employee_id: '1002' },
    { id: 3, ad: 'Kerem', soyad: 'Ateş', pozisyon: 'Chef', maas_tabani: 14000, rol: 'sef', email: 'sef@example.com', employee_id: '1003' },
  ]);

  const [roles, setRoles] = useState([
    {
      id: 'admin',
      name: 'Admin',
      permissions: {
        view_dashboard: true,
        view_tasks: true,
        assign_tasks: true,
        rate_tasks: true,
        manage_shifts: true,
        manage_leave: true,
        view_salary: true,
        manage_roles: true,
        manage_shifts_types: true,
        edit_employees: true,
      },
    },
    {
      id: 'sistem_yoneticisi',
      name: 'Sistem Yöneticisi',
      permissions: {
        view_dashboard: true,
        view_tasks: true,
        assign_tasks: false,
        rate_tasks: false,
        manage_shifts: true,
        manage_leave: true,
        view_salary: false,
        manage_roles: false,
        manage_shifts_types: true,
        edit_employees: false,
      },
    },
    {
      id: 'sef',
      name: 'Şef',
      permissions: {
        view_dashboard: true,
        view_tasks: true,
        assign_tasks: true,
        rate_tasks: true,
        manage_shifts: false,
        manage_leave: false,
        view_salary: false,
        manage_roles: false,
        manage_shifts_types: false,
        edit_employees: false,
      },
    },
    {
      id: 'personel',
      name: 'Personel',
      permissions: {
        view_dashboard: true,
        view_tasks: true,
        assign_tasks: false,
        rate_tasks: false,
        manage_shifts: false,
        manage_leave: false,
        view_salary: false,
        manage_roles: false,
        manage_shifts_types: false,
        edit_employees: false,
      },
    },
  ]);

  const [shiftTypes, setShiftTypes] = useState([
    { id: 'sabah', name: '🌅 Sabah (09:00-18:00)', start: '09:00', end: '18:00', color: 'bg-yellow-500' },
    { id: 'ogle_sonra', name: '☀️ Öğleden Sonra (13:00-22:00)', start: '13:00', end: '22:00', color: 'bg-orange-500' },
    { id: 'gece', name: '🌙 Gece (22:00-07:00)', start: '22:00', end: '07:00', color: 'bg-indigo-600' },
  ]);

  const [attendance, setAttendance] = useState([
    { id: 1, employee_id: '1001', ad: 'Ahmet', soyad: 'Yılmaz', tarih: new Date().toISOString().split('T')[0], giris_saati: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), cikis_saati: null, calisilan_saat: 0, status: 'giris' },
  ]);

  const [leaveRecords, setLeaveRecords] = useState([
    { id: 1, employee_id: 1, tarih: '2025-02-15', leave_type: 'izin', notlar: 'Kişisel işler' },
  ]);

  const [shiftCalendar, setShiftCalendar] = useState([
    { id: 1, employee_id: 1, tarih: '2025-02-15', shift_type: 'sabah' },
  ]);

  const [kioskEmployeeId, setKioskEmployeeId] = useState('');
  const [kioskMessage, setKioskMessage] = useState('');
  const [newLeave, setNewLeave] = useState({ employee_id: '', tarih: '', leave_type: 'izin', notlar: '' });
  const [selectedShiftMonth, setSelectedShiftMonth] = useState(new Date().toISOString().slice(0, 7));
  const [selectedShiftType, setSelectedShiftType] = useState('sabah');
  const [newEmployee, setNewEmployee] = useState({ ad: '', soyad: '', pozisyon: '', maas_tabani: 0, rol: 'personel', email: '', employee_id: '' });
  const [newShiftType, setNewShiftType] = useState({ name: '', start: '', end: '', color: 'bg-blue-500' });
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [editData, setEditData] = useState({});

  const getPermissions = () => {
    const userRole = roles.find(r => r.id === employee?.rol);
    return userRole?.permissions || {};
  };

  const handleLogin = () => {
    const foundEmployee = employees.find(e => e.email === loginData.email);
    if (foundEmployee) {
      setUser({ id: foundEmployee.id, email: foundEmployee.email });
      setEmployee(foundEmployee);
      setLoginData({ email: '' });
    }
  };

  const handleLogout = () => {
    setUser(null);
    setEmployee(null);
    setActiveTab('dashboard');
  };

  const kioskGiris = () => {
    const empId = kioskEmployeeId;
    const emp = employees.find(e => e.employee_id === empId);
    if (!emp) {
      setKioskMessage('❌ ID Bulunamadı!');
      setTimeout(() => { setKioskMessage(''); setKioskEmployeeId(''); }, 3000);
      return;
    }
    const bugun = new Date().toISOString().split('T')[0];
    const bugunKayit = attendance.find(a => a.employee_id === empId && a.tarih === bugun && !a.cikis_saati);
    if (bugunKayit) {
      setKioskMessage('⚠️ Zaten giriş yapılmış!');
      setTimeout(() => { setKioskMessage(''); setKioskEmployeeId(''); }, 3000);
      return;
    }
    const newRecord = {
      id: Math.max(...attendance.map(a => a.id), 0) + 1,
      employee_id: empId,
      ad: emp.ad,
      soyad: emp.soyad,
      tarih: bugun,
      giris_saati: new Date().toISOString(),
      cikis_saati: null,
      calisilan_saat: 0,
      status: 'giris',
    };
    setAttendance([...attendance, newRecord]);
    setKioskMessage(`✅ Giriş Başarılı!\n${emp.ad} ${emp.soyad}\nID: ${empId}`);
    setTimeout(() => { setKioskMessage(''); setKioskEmployeeId(''); }, 2500);
  };

  const kioskCikis = () => {
    const empId = kioskEmployeeId;
    const emp = employees.find(e => e.employee_id === empId);
    if (!emp) {
      setKioskMessage('❌ ID Bulunamadı!');
      setTimeout(() => { setKioskMessage(''); setKioskEmployeeId(''); }, 3000);
      return;
    }
    const simdiki = new Date().toISOString();
    const sonGirisKayit = attendance.find(a => a.employee_id === empId && a.status === 'giris' && !a.cikis_saati);
    if (!sonGirisKayit) {
      setKioskMessage('❌ Giriş kaydı bulunamadı!');
      setTimeout(() => { setKioskMessage(''); setKioskEmployeeId(''); }, 3000);
      return;
    }
    const giris = new Date(sonGirisKayit.giris_saati);
    const cikis = new Date(simdiki);
    let calisilanSaat = (cikis - giris) / (1000 * 60 * 60);
    const updatedAttendance = attendance.map(a => a.id === sonGirisKayit.id ? { ...a, cikis_saati: simdiki, calisilan_saat: parseFloat(calisilanSaat.toFixed(2)), status: 'cikis' } : a);
    setAttendance(updatedAttendance);
    setKioskMessage(`✅ Çıkış Başarılı!\n${emp.ad} ${emp.soyad}\nÇalışılan: ${calisilanSaat.toFixed(2)}h`);
    setTimeout(() => { setKioskMessage(''); setKioskEmployeeId(''); }, 2500);
  };

  const addNumpadDigit = (digit) => {
    setKioskEmployeeId(prev => (prev + digit).slice(0, 10));
  };

  const clearNumpad = () => {
    setKioskEmployeeId('');
  };

  const addLeave = () => {
    if (newLeave.employee_id && newLeave.tarih) {
      const leave = { id: Math.max(...leaveRecords.map(l => l.id), 0) + 1, employee_id: parseInt(newLeave.employee_id), tarih: newLeave.tarih, leave_type: newLeave.leave_type, notlar: newLeave.notlar };
      setLeaveRecords([...leaveRecords, leave]);
      setNewLeave({ employee_id: '', tarih: '', leave_type: 'izin', notlar: '' });
      alert('✅ İzin kaydı başarıyla eklendi!');
    }
  };

  const deleteLeave = (id) => {
    setLeaveRecords(leaveRecords.filter(l => l.id !== id));
  };

  const addShiftType = () => {
    if (newShiftType.name && newShiftType.start && newShiftType.end) {
      const shiftType = {
        id: `shift_${Date.now()}`,
        name: newShiftType.name,
        start: newShiftType.start,
        end: newShiftType.end,
        color: newShiftType.color,
      };
      setShiftTypes([...shiftTypes, shiftType]);
      setNewShiftType({ name: '', start: '', end: '', color: 'bg-blue-500' });
      alert('✅ Vardiya türü eklendi!');
    }
  };

  const deleteShiftType = (id) => {
    if (shiftCalendar.some(s => s.shift_type === id)) {
      alert('❌ Bu vardiya türünde atanmış vardiyalar var!');
      return;
    }
    setShiftTypes(shiftTypes.filter(s => s.id !== id));
  };

  const addEmployee = () => {
    if (!newEmployee.ad || !newEmployee.soyad || !newEmployee.pozisyon || !newEmployee.email || !newEmployee.employee_id) {
      alert('❌ Tüm alanları doldurunuz!');
      return;
    }
    if (employees.some(e => e.employee_id === newEmployee.employee_id)) {
      alert('❌ Bu ID zaten kullanılıyor!');
      return;
    }
    const employee = {
      id: Math.max(...employees.map(e => e.id), 0) + 1,
      ad: newEmployee.ad,
      soyad: newEmployee.soyad,
      pozisyon: newEmployee.pozisyon,
      maas_tabani: parseFloat(newEmployee.maas_tabani),
      rol: newEmployee.rol,
      email: newEmployee.email,
      employee_id: newEmployee.employee_id,
    };
    setEmployees([...employees, employee]);
    setNewEmployee({ ad: '', soyad: '', pozisyon: '', maas_tabani: 0, rol: 'personel', email: '', employee_id: '' });
    alert('✅ Personel başarıyla eklendi!');
  };

  const startEditEmployee = (emp) => {
    setEditingEmployee(emp.id);
    setEditData({ ...emp });
  };

  const saveEmployee = () => {
    if (!editData.ad || !editData.soyad || !editData.pozisyon || !editData.email || !editData.employee_id) {
      alert('❌ Tüm alanları doldurunuz!');
      return;
    }
    if (employees.some(e => e.id !== editingEmployee && e.employee_id === editData.employee_id)) {
      alert('❌ Bu ID zaten kullanılıyor!');
      return;
    }
    setEmployees(employees.map(e => e.id === editingEmployee ? { ...e, ad: editData.ad, soyad: editData.soyad, pozisyon: editData.pozisyon, maas_tabani: parseFloat(editData.maas_tabani), rol: editData.rol, email: editData.email, employee_id: editData.employee_id } : e));
    setEditingEmployee(null);
    alert('✅ Personel bilgileri güncellendi!');
  };

  const updateRolePermission = (roleId, permission, value) => {
    setRoles(roles.map(r => r.id === roleId ? { ...r, permissions: { ...r.permissions, [permission]: value } } : r));
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-2xl p-8 w-full max-w-md">
          <h1 className="text-3xl font-bold text-gray-800 mb-2 text-center">İK Sistemi</h1>
          <div className="space-y-4">
            <input type="email" placeholder="E-mail" value={loginData.email} onChange={(e) => setLoginData({ ...loginData, email: e.target.value })} onKeyPress={(e) => e.key === 'Enter' && handleLogin()} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            <button onClick={handleLogin} className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold">Giriş Yap</button>
            <div className="mt-6 pt-6 border-t text-xs text-gray-500">
              <p className="font-semibold mb-2">Demo Hesaplar:</p>
              <p>• admin@example.com (Admin)</p>
              <p>• sef@example.com (Şef)</p>
              <p>• fatma@example.com (Personel)</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const permissions = getPermissions();
  const currentRole = roles.find(r => r.id === employee?.rol);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="p-8 max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8 bg-white rounded-lg shadow p-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">İK Dashboard</h1>
            <p className="text-gray-600">👤 {employee.ad} {employee.soyad} - <span className="font-semibold">{currentRole?.name}</span></p>
          </div>
          <button onClick={handleLogout} className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 font-semibold flex items-center gap-2"><LogOut className="w-4 h-4" /> Çıkış</button>
        </div>

        <div className="flex gap-2 mb-6 bg-white rounded-lg p-2 shadow flex-wrap">
          {permissions.view_dashboard && (
            <button onClick={() => setActiveTab('dashboard')} className={`px-6 py-2 rounded-lg font-semibold transition ${activeTab === 'dashboard' ? 'bg-indigo-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}>📊 Dashboard</button>
          )}
          {permissions.view_tasks && (
            <button onClick={() => setActiveTab('gorevler')} className={`px-6 py-2 rounded-lg font-semibold transition ${activeTab === 'gorevler' ? 'bg-indigo-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}>✅ Görevler</button>
          )}
          {(permissions.manage_shifts || permissions.manage_shifts_types || permissions.manage_leave) && (
            <button onClick={() => setActiveTab('vardiya_izin')} className={`px-6 py-2 rounded-lg font-semibold transition ${activeTab === 'vardiya_izin' ? 'bg-indigo-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}>📅 Vardiya & İzin</button>
          )}
          {permissions.view_salary && (
            <button onClick={() => setActiveTab('maas')} className={`px-6 py-2 rounded-lg font-semibold transition ${activeTab === 'maas' ? 'bg-indigo-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}>💰 Maaş</button>
          )}
          {permissions.manage_roles && (
            <button onClick={() => setActiveTab('rol_yonetimi')} className={`px-6 py-2 rounded-lg font-semibold transition ${activeTab === 'rol_yonetimi' ? 'bg-indigo-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}>🔐 Rol Yönetimi</button>
          )}
          {permissions.manage_shifts_types && (
            <button onClick={() => setActiveTab('vardiya_turleri')} className={`px-6 py-2 rounded-lg font-semibold transition ${activeTab === 'vardiya_turleri' ? 'bg-indigo-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}>⚙️ Vardiya Türleri</button>
          )}
          {employee?.rol === 'admin' && (
            <button onClick={() => setActiveTab('kiosk')} className={`px-6 py-2 rounded-lg font-semibold transition ${activeTab === 'kiosk' ? 'bg-indigo-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}>🬠Kiosk</button>
          )}
          {employee?.rol === 'admin' && (
            <button onClick={() => setActiveTab('personel')} className={`px-6 py-2 rounded-lg font-semibold transition ${activeTab === 'personel' ? 'bg-indigo-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}>👥 Personel</button>
          )}
        </div>

        {activeTab === 'dashboard' && permissions.view_dashboard && (
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
        )}

        {activeTab === 'kiosk' && (
          <div className="bg-white rounded-lg shadow p-8">
            <div className="max-w-md mx-auto">
              <h1 className="text-4xl font-bold mb-6 text-center">🬠KIOSK</h1>
              {kioskMessage ? (
                <div className={`mb-8 p-6 rounded-xl text-lg font-bold whitespace-pre-line text-center ${kioskMessage.includes('✅') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{kioskMessage}</div>
              ) : (
                <>
                  <div className="mb-6">
                    <input type="text" placeholder="Personel ID" value={kioskEmployeeId} readOnly className="w-full px-4 py-3 text-3xl text-center border-2 border-indigo-300 rounded-lg bg-white font-bold" />
                  </div>
                  <div className="grid grid-cols-3 gap-2 mb-6">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                      <button key={num} onClick={() => addNumpadDigit(num.toString())} className="px-4 py-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-bold text-xl">{num}</button>
                    ))}
                    <button onClick={() => addNumpadDigit('0')} className="col-span-2 px-4 py-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-bold text-xl">0</button>
                    <button onClick={clearNumpad} className="px-4 py-4 bg-red-500 text-white rounded-lg hover:bg-red-600 font-bold text-xl">C</button>
                  </div>
                  <div className="space-y-3">
                    <button onClick={kioskGiris} className="w-full px-8 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 font-bold text-xl">✅ GİRİŞ</button>
                    <button onClick={kioskCikis} className="w-full px-8 py-4 bg-red-600 text-white rounded-lg hover:bg-red-700 font-bold text-xl">🚪 ÇIKIŞ</button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {activeTab === 'personel' && employee?.rol === 'admin' && (
          <div>
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h2 className="text-xl font-bold mb-4">➕ Yeni Personel Ekle</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input type="text" placeholder="Ad" value={newEmployee.ad} onChange={(e) => setNewEmployee({ ...newEmployee, ad: e.target.value })} className="px-4 py-2 border rounded-lg" />
                <input type="text" placeholder="Soyad" value={newEmployee.soyad} onChange={(e) => setNewEmployee({ ...newEmployee, soyad: e.target.value })} className="px-4 py-2 border rounded-lg" />
                <input type="email" placeholder="E-mail" value={newEmployee.email} onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })} className="px-4 py-2 border rounded-lg" />
                <input type="text" placeholder="Personel ID" value={newEmployee.employee_id} onChange={(e) => setNewEmployee({ ...newEmployee, employee_id: e.target.value })} className="px-4 py-2 border rounded-lg" />
                <input type="text" placeholder="Pozisyon" value={newEmployee.pozisyon} onChange={(e) => setNewEmployee({ ...newEmployee, pozisyon: e.target.value })} className="px-4 py-2 border rounded-lg" />
                <input type="number" placeholder="Maaş (₺)" value={newEmployee.maas_tabani} onChange={(e) => setNewEmployee({ ...newEmployee, maas_tabani: e.target.value })} className="px-4 py-2 border rounded-lg" />
                <select value={newEmployee.rol} onChange={(e) => setNewEmployee({ ...newEmployee, rol: e.target.value })} className="px-4 py-2 border rounded-lg">
                  {roles.map(role => (
                    <option key={role.id} value={role.id}>{role.name}</option>
                  ))}
                </select>
              </div>
              <button onClick={addEmployee} className="mt-4 w-full px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold">Personel Ekle</button>
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
                      <th className="px-4 py-2 text-left">Maaş</th>
                      <th className="px-4 py-2 text-left">Rol</th>
                      <th className="px-4 py-2 text-left">İşlemler</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employees.map(emp => (
                      <tr key={emp.id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-2 font-bold text-indigo-600">{emp.employee_id}</td>
                        <td className="px-4 py-2 font-semibold">{emp.ad} {emp.soyad}</td>
                        <td className="px-4 py-2">{emp.email}</td>
                        <td className="px-4 py-2">{emp.pozisyon}</td>
                        <td className="px-4 py-2">₺{emp.maas_tabani.toLocaleString('tr-TR')}</td>
                        <td className="px-4 py-2"><span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded text-xs font-semibold">{roles.find(r => r.id === emp.rol)?.name}</span></td>
                        <td className="px-4 py-2">
                          <button onClick={() => startEditEmployee(emp)} className="px-3 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 mr-2">Düzenle</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <p className="text-sm text-gray-700">
            <strong>Not:</strong> Bu frontend şu anda local state ile çalışıyor. Backend API'ye bağlamak için devam etmemi ister misiniz?
          </p>
        </div>
      </div>
    </div>
  );
}
