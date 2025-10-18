import React, { useState, useEffect } from 'react';
import { LogOut, Plus, Trash2, Edit2, Check, X } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
const API = `${BACKEND_URL}/api`;

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [employee, setEmployee] = useState(null);
  const [loginData, setLoginData] = useState({ email: '' });
  const [activeTab, setActiveTab] = useState('dashboard');

  const [employees, setEmployees] = useState([]);
  const [roles, setRoles] = useState([]);
  const [shiftTypes, setShiftTypes] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [leaveRecords, setLeaveRecords] = useState([]);
  const [shiftCalendar, setShiftCalendar] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [salaryData, setSalaryData] = useState([]);

  const [kioskEmployeeId, setKioskEmployeeId] = useState('');
  const [kioskMessage, setKioskMessage] = useState('');
  const [newLeave, setNewLeave] = useState({ employee_id: '', tarih: '', leave_type: 'izin', notlar: '' });
  const [selectedShiftMonth, setSelectedShiftMonth] = useState(new Date().toISOString().slice(0, 7));
  const [selectedShiftType, setSelectedShiftType] = useState('sabah');
  const [newEmployee, setNewEmployee] = useState({ ad: '', soyad: '', pozisyon: '', maas_tabani: 0, rol: 'personel', email: '', employee_id: '' });
  const [newShiftType, setNewShiftType] = useState({ name: '', start: '', end: '', color: 'bg-blue-500' });
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [editData, setEditData] = useState({});
  const [newTask, setNewTask] = useState({ baslik: '', aciklama: '', atanan_personel_id: '' });
  const [salaryMonth, setSalaryMonth] = useState(new Date().toISOString().slice(0, 7));

  // Fetch all data from backend
  const fetchData = async () => {
    try {
      const [empRes, roleRes, shiftTypeRes, attendanceRes, leaveRes, shiftCalRes, taskRes] = await Promise.all([
        axios.get(`${API}/employees`),
        axios.get(`${API}/roles`),
        axios.get(`${API}/shift-types`),
        axios.get(`${API}/attendance`),
        axios.get(`${API}/leave-records`),
        axios.get(`${API}/shift-calendar`),
        axios.get(`${API}/tasks`)
      ]);
      setEmployees(empRes.data);
      setRoles(roleRes.data);
      setShiftTypes(shiftTypeRes.data);
      setAttendance(attendanceRes.data);
      setLeaveRecords(leaveRes.data);
      setShiftCalendar(shiftCalRes.data);
      setTasks(taskRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      alert('Veri yüklenirken hata oluştu: ' + (error.response?.data?.detail || error.message));
    }
  };

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  useEffect(() => {
    if (user && activeTab === 'maas') {
      fetchSalaryData();
    }
  }, [salaryMonth, activeTab, user]);

  const getPermissions = () => {
    const userRole = roles.find(r => r.id === employee?.rol);
    return userRole?.permissions || {};
  };

  const handleLogin = async () => {
    try {
      const response = await axios.post(`${API}/login`, { email: loginData.email });
      if (response.data.success) {
        setUser({ id: response.data.employee.id, email: response.data.employee.email });
        setEmployee(response.data.employee);
        setLoginData({ email: '' });
      } else {
        alert(response.data.message);
      }
    } catch (error) {
      alert('Giriş yapılamadı: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleLogout = () => {
    setUser(null);
    setEmployee(null);
    setActiveTab('dashboard');
  };

  const kioskGiris = async () => {
    try {
      const response = await axios.post(`${API}/attendance/check-in`, { employee_id: kioskEmployeeId });
      setKioskMessage(`✅ Giriş Başarılı!\n${response.data.employee}\nID: ${kioskEmployeeId}`);
      setTimeout(() => { setKioskMessage(''); setKioskEmployeeId(''); fetchData(); }, 2500);
    } catch (error) {
      setKioskMessage(`❌ ${error.response?.data?.detail || 'Hata oluştu'}`);
      setTimeout(() => { setKioskMessage(''); setKioskEmployeeId(''); }, 3000);
    }
  };

  const kioskCikis = async () => {
    try {
      const response = await axios.post(`${API}/attendance/check-out`, { employee_id: kioskEmployeeId });
      setKioskMessage(`✅ Çıkış Başarılı!\n${response.data.employee}\nÇalışılan: ${response.data.calisilan_saat}h`);
      setTimeout(() => { setKioskMessage(''); setKioskEmployeeId(''); fetchData(); }, 2500);
    } catch (error) {
      setKioskMessage(`❌ ${error.response?.data?.detail || 'Hata oluştu'}`);
      setTimeout(() => { setKioskMessage(''); setKioskEmployeeId(''); }, 3000);
    }
  };

  const addNumpadDigit = (digit) => {
    setKioskEmployeeId(prev => (prev + digit).slice(0, 10));
  };

  const clearNumpad = () => {
    setKioskEmployeeId('');
  };

  const addLeave = async () => {
    if (!newLeave.employee_id || !newLeave.tarih) {
      alert('❌ Personel ve tarih seçiniz!');
      return;
    }
    try {
      await axios.post(`${API}/leave-records`, {
        employee_id: parseInt(newLeave.employee_id),
        tarih: newLeave.tarih,
        leave_type: newLeave.leave_type,
        notlar: newLeave.notlar
      });
      setNewLeave({ employee_id: '', tarih: '', leave_type: 'izin', notlar: '' });
      alert('✅ İzin kaydı başarıyla eklendi!');
      fetchData();
    } catch (error) {
      alert('❌ Hata: ' + (error.response?.data?.detail || error.message));
    }
  };

  const deleteLeave = async (id) => {
    try {
      await axios.delete(`${API}/leave-records/${id}`);
      fetchData();
    } catch (error) {
      alert('❌ Silme hatası: ' + (error.response?.data?.detail || error.message));
    }
  };

  const addShiftType = async () => {
    if (!newShiftType.name || !newShiftType.start || !newShiftType.end) {
      alert('❌ Tüm alanları doldurunuz!');
      return;
    }
    try {
      await axios.post(`${API}/shift-types`, newShiftType);
      setNewShiftType({ name: '', start: '', end: '', color: 'bg-blue-500' });
      alert('✅ Vardiya türü eklendi!');
      fetchData();
    } catch (error) {
      alert('❌ Hata: ' + (error.response?.data?.detail || error.message));
    }
  };

  const deleteShiftType = async (id) => {
    try {
      await axios.delete(`${API}/shift-types/${id}`);
      fetchData();
    } catch (error) {
      alert('❌ ' + (error.response?.data?.detail || error.message));
    }
  };

  const addEmployee = async () => {
    if (!newEmployee.ad || !newEmployee.soyad || !newEmployee.pozisyon || !newEmployee.email || !newEmployee.employee_id) {
      alert('❌ Tüm alanları doldurunuz!');
      return;
    }
    try {
      await axios.post(`${API}/employees`, {
        ad: newEmployee.ad,
        soyad: newEmployee.soyad,
        pozisyon: newEmployee.pozisyon,
        maas_tabani: parseFloat(newEmployee.maas_tabani),
        rol: newEmployee.rol,
        email: newEmployee.email,
        employee_id: newEmployee.employee_id
      });
      setNewEmployee({ ad: '', soyad: '', pozisyon: '', maas_tabani: 0, rol: 'personel', email: '', employee_id: '' });
      alert('✅ Personel başarıyla eklendi!');
      fetchData();
    } catch (error) {
      alert('❌ ' + (error.response?.data?.detail || error.message));
    }
  };

  const startEditEmployee = (emp) => {
    setEditingEmployee(emp.id);
    setEditData({ ...emp });
  };

  const saveEmployee = async () => {
    if (!editData.ad || !editData.soyad || !editData.pozisyon || !editData.email || !editData.employee_id) {
      alert('❌ Tüm alanları doldurunuz!');
      return;
    }
    try {
      await axios.put(`${API}/employees/${editingEmployee}`, {
        ad: editData.ad,
        soyad: editData.soyad,
        pozisyon: editData.pozisyon,
        maas_tabani: parseFloat(editData.maas_tabani),
        rol: editData.rol,
        email: editData.email,
        employee_id: editData.employee_id
      });
      setEditingEmployee(null);
      alert('✅ Personel bilgileri güncellendi!');
      fetchData();
    } catch (error) {
      alert('❌ ' + (error.response?.data?.detail || error.message));
    }
  };

  const deleteEmployee = async (id) => {
    if (window.confirm('Silmek istediğinizden emin misiniz?')) {
      try {
        await axios.delete(`${API}/employees/${id}`);
        fetchData();
      } catch (error) {
        alert('❌ Silme hatası: ' + (error.response?.data?.detail || error.message));
      }
    }
  };

  const updateRolePermission = async (roleId, permission, value) => {
    const role = roles.find(r => r.id === roleId);
    if (!role) return;
    
    const updatedPermissions = { ...role.permissions, [permission]: value };
    try {
      await axios.put(`${API}/roles/${roleId}`, { permissions: updatedPermissions });
      fetchData();
    } catch (error) {
      alert('❌ Güncelleme hatası: ' + (error.response?.data?.detail || error.message));
    }
  };

  const addShiftToCalendar = async (employeeId, tarih) => {
    try {
      await axios.post(`${API}/shift-calendar`, {
        employee_id: employeeId,
        tarih: tarih,
        shift_type: selectedShiftType
      });
      fetchData();
    } catch (error) {
      alert('❌ ' + (error.response?.data?.detail || error.message));
    }
  };

  const removeShiftFromCalendar = async (shiftId) => {
    try {
      await axios.delete(`${API}/shift-calendar/${shiftId}`);
      fetchData();
    } catch (error) {
      alert('❌ Silme hatası: ' + (error.response?.data?.detail || error.message));
    }
  };

  const addTask = async () => {
    if (!newTask.baslik || !newTask.aciklama) {
      alert('❌ Başlık ve açıklama zorunludur!');
      return;
    }
    try {
      await axios.post(`${API}/tasks?olusturan_id=${employee.id}`, {
        baslik: newTask.baslik,
        aciklama: newTask.aciklama,
        atanan_personel_id: newTask.atanan_personel_id ? parseInt(newTask.atanan_personel_id) : null
      });
      setNewTask({ baslik: '', aciklama: '', atanan_personel_id: '' });
      alert('✅ Görev başarıyla oluşturuldu!');
      fetchData();
    } catch (error) {
      alert('❌ Hata: ' + (error.response?.data?.detail || error.message));
    }
  };

  const updateTask = async (taskId, updates) => {
    try {
      await axios.put(`${API}/tasks/${taskId}`, updates);
      fetchData();
    } catch (error) {
      alert('❌ Güncelleme hatası: ' + (error.response?.data?.detail || error.message));
    }
  };

  const deleteTask = async (taskId) => {
    if (window.confirm('Bu görevi silmek istediğinizden emin misiniz?')) {
      try {
        await axios.delete(`${API}/tasks/${taskId}`);
        fetchData();
      } catch (error) {
        alert('❌ Silme hatası: ' + (error.response?.data?.detail || error.message));
      }
    }
  };

  const fetchSalaryData = async () => {
    try {
      const response = await axios.get(`${API}/salary/all/${salaryMonth}`);
      setSalaryData(response.data);
    } catch (error) {
      alert('❌ Maaş verileri getirilemedi: ' + (error.response?.data?.detail || error.message));
    }
  };

  const renderShiftCalendar = () => {
    const [year, month] = selectedShiftMonth.split('-').map(Number);
    const daysInMonth = new Date(year, month, 0).getDate();
    const firstDay = new Date(year, month - 1, 1).getDay();
    
    const calendar = [];
    let week = [];
    
    for (let i = 0; i < firstDay; i++) {
      week.push(<div key={`empty-${i}`} className="h-24 bg-gray-50"></div>);
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const shiftsOnDate = shiftCalendar.filter(s => s.tarih === date);
      
      week.push(
        <div key={day} className="h-24 border border-gray-200 p-1 bg-white overflow-y-auto">
          <div className="text-xs font-semibold text-gray-600 mb-1">{day}</div>
          <div className="space-y-1">
            {shiftsOnDate.map(shift => {
              const emp = employees.find(e => e.id === shift.employee_id);
              const shiftType = shiftTypes.find(st => st.id === shift.shift_type);
              return (
                <div key={shift.id} className={`text-xs p-1 rounded ${shiftType?.color || 'bg-gray-300'} text-white flex justify-between items-center`}>
                  <span className="truncate">{emp?.ad}</span>
                  <button onClick={() => removeShiftFromCalendar(shift.id)} className="text-white hover:text-red-200">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      );
      
      if (week.length === 7) {
        calendar.push(<div key={`week-${calendar.length}`} className="grid grid-cols-7 gap-0">{week}</div>);
        week = [];
      }
    }
    
    while (week.length > 0 && week.length < 7) {
      week.push(<div key={`empty-end-${week.length}`} className="h-24 bg-gray-50"></div>);
    }
    if (week.length > 0) {
      calendar.push(<div key={`week-${calendar.length}`} className="grid grid-cols-7 gap-0">{week}</div>);
    }
    
    return calendar;
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
              <p>• mehmet@example.com (Sistem Yöneticisi)</p>
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

        {activeTab === 'vardiya_turleri' && permissions.manage_shifts_types && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-6">⚙️ Vardiya Türleri Yönetimi</h2>
            <div className="bg-blue-50 p-6 rounded-lg border border-blue-200 mb-6">
              <h3 className="font-bold mb-4">Yeni Vardiya Türü Ekle</h3>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <input type="text" placeholder="Vardiya Adı" value={newShiftType.name} onChange={(e) => setNewShiftType({ ...newShiftType, name: e.target.value })} className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                <input type="time" placeholder="Başlangıç" value={newShiftType.start} onChange={(e) => setNewShiftType({ ...newShiftType, start: e.target.value })} className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                <input type="time" placeholder="Bitiş" value={newShiftType.end} onChange={(e) => setNewShiftType({ ...newShiftType, end: e.target.value })} className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                <select value={newShiftType.color} onChange={(e) => setNewShiftType({ ...newShiftType, color: e.target.value })} className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="bg-yellow-500">Sarı</option>
                  <option value="bg-orange-500">Turuncu</option>
                  <option value="bg-indigo-600">İndigo</option>
                  <option value="bg-green-500">Yeşil</option>
                  <option value="bg-red-500">Kırmızı</option>
                  <option value="bg-blue-500">Mavi</option>
                </select>
                <button onClick={addShiftType} className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold flex items-center justify-center"><Plus className="w-4 h-4" /></button>
              </div>
            </div>
            <h3 className="font-bold text-lg mb-4">Vardiya Türleri</h3>
            <div className="space-y-3">
              {shiftTypes.map(shift => (
                <div key={shift.id} className={`p-4 rounded-lg ${shift.color} text-white flex justify-between items-center`}>
                  <div>
                    <p className="font-bold">{shift.name}</p>
                    <p className="text-sm">{shift.start} - {shift.end}</p>
                  </div>
                  <button onClick={() => deleteShiftType(shift.id)} className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 font-semibold"><Trash2 className="w-4 h-4" /></button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'rol_yonetimi' && permissions.manage_roles && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-6">🔐 Rol Yönetimi</h2>
            <div className="space-y-4">
              {roles.map(role => (
                <div key={role.id} className="border-2 border-gray-200 rounded-lg p-4">
                  <h3 className="text-lg font-bold mb-3">{role.name}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <label className="flex items-center gap-2">
                      <input type="checkbox" checked={role.permissions.view_dashboard} onChange={(e) => updateRolePermission(role.id, 'view_dashboard', e.target.checked)} className="w-4 h-4" />
                      <span>Dashboard Görüntüleme</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" checked={role.permissions.view_tasks} onChange={(e) => updateRolePermission(role.id, 'view_tasks', e.target.checked)} className="w-4 h-4" />
                      <span>Görevleri Görüntüleme</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" checked={role.permissions.assign_tasks} onChange={(e) => updateRolePermission(role.id, 'assign_tasks', e.target.checked)} className="w-4 h-4" />
                      <span>Görev Atama</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" checked={role.permissions.rate_tasks} onChange={(e) => updateRolePermission(role.id, 'rate_tasks', e.target.checked)} className="w-4 h-4" />
                      <span>Görev Puanlama</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" checked={role.permissions.manage_shifts} onChange={(e) => updateRolePermission(role.id, 'manage_shifts', e.target.checked)} className="w-4 h-4" />
                      <span>Vardiya Yönetimi</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" checked={role.permissions.manage_leave} onChange={(e) => updateRolePermission(role.id, 'manage_leave', e.target.checked)} className="w-4 h-4" />
                      <span>İzin Yönetimi</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" checked={role.permissions.view_salary} onChange={(e) => updateRolePermission(role.id, 'view_salary', e.target.checked)} className="w-4 h-4" />
                      <span>Maaş Görüntüleme</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" checked={role.permissions.manage_shifts_types} onChange={(e) => updateRolePermission(role.id, 'manage_shifts_types', e.target.checked)} className="w-4 h-4" />
                      <span>Vardiya Türü Yönetimi</span>
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'vardiya_izin' && (permissions.manage_shifts || permissions.manage_shifts_types || permissions.manage_leave) && (
          <div>
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h2 className="text-xl font-bold mb-6">📅 Vardiya Takvimi & İzin</h2>

              {permissions.manage_shifts && (
                <>
                  <div className="mb-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <p className="font-bold mb-3">Vardiya Türü Seçin</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {shiftTypes.map(shift => (
                        <button key={shift.id} onClick={() => setSelectedShiftType(shift.id)} className={`p-3 rounded-lg border-2 font-semibold transition ${selectedShiftType === shift.id ? `${shift.color} text-white border-transparent` : 'bg-white border-gray-300 text-gray-700'}`}>
                          {shift.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mb-6 flex gap-4 items-center">
                    <input type="month" value={selectedShiftMonth} onChange={(e) => setSelectedShiftMonth(e.target.value)} className="px-4 py-2 border rounded-lg font-semibold" />
                    <div className="text-sm text-gray-600">İpucu: Takvimde gün seçin, sonra personel seçin ve vardiya atayın</div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="grid grid-cols-7 gap-0 mb-2">
                      {['Pzr', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'].map(day => (
                        <div key={day} className="text-center font-bold text-sm py-2 bg-indigo-100 text-indigo-800">{day}</div>
                      ))}
                    </div>
                    {renderShiftCalendar()}
                  </div>

                  <div className="mt-6 bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <h3 className="font-bold mb-3">Vardiya Atama</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <select className="px-4 py-2 border rounded-lg" id="shift-employee-select">
                        <option value="">Personel Seç</option>
                        {employees.map(emp => (
                          <option key={emp.id} value={emp.id}>{emp.ad} {emp.soyad}</option>
                        ))}
                      </select>
                      <input type="date" className="px-4 py-2 border rounded-lg" id="shift-date-input" />
                      <button onClick={() => {
                        const empId = document.getElementById('shift-employee-select').value;
                        const date = document.getElementById('shift-date-input').value;
                        if (empId && date) {
                          addShiftToCalendar(parseInt(empId), date);
                        } else {
                          alert('❌ Personel ve tarih seçiniz!');
                        }
                      }} className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold">Vardiya Ata</button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {permissions.manage_leave && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold mb-4">🗓️ İzin Kaydı Ekle</h2>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
                  <select value={newLeave.employee_id} onChange={(e) => setNewLeave({ ...newLeave, employee_id: e.target.value })} className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <option value="">Personel Seç</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.ad} {emp.soyad}</option>
                    ))}
                  </select>
                  <input type="date" value={newLeave.tarih} onChange={(e) => setNewLeave({ ...newLeave, tarih: e.target.value })} className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  <select value={newLeave.leave_type} onChange={(e) => setNewLeave({ ...newLeave, leave_type: e.target.value })} className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <option value="izin">İzin</option>
                    <option value="hastalik">Hastalık</option>
                  </select>
                  <input type="text" placeholder="Notlar" value={newLeave.notlar} onChange={(e) => setNewLeave({ ...newLeave, notlar: e.target.value })} className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  <button onClick={addLeave} className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold flex items-center justify-center"><Plus className="w-4 h-4" /></button>
                </div>

                <h3 className="font-bold text-lg mb-4">İzin Kayıtları</h3>
                <div className="space-y-2">
                  {leaveRecords.map(leave => {
                    const emp = employees.find(e => e.id === leave.employee_id);
                    return (
                      <div key={leave.id} className={`p-3 rounded-lg flex justify-between items-center ${leave.leave_type === 'izin' ? 'bg-yellow-50 border border-yellow-200' : 'bg-red-50 border border-red-200'}`}>
                        <div>
                          <p className="font-semibold text-sm">{emp?.ad} {emp?.soyad} - {leave.tarih}</p>
                          <p className="text-xs text-gray-600">{leave.leave_type === 'izin' ? '🗓️ İzin' : '🏥 Hastalık'} - {leave.notlar}</p>
                        </div>
                        <button onClick={() => deleteLeave(leave.id)} className="px-3 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600 font-semibold"><Trash2 className="w-3 h-3" /></button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'gorevler' && permissions.view_tasks && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-6">✅ Görevler</h2>
            
            {permissions.assign_tasks && (
              <div className="bg-blue-50 p-6 rounded-lg border border-blue-200 mb-6">
                <h3 className="font-bold mb-4">Yeni Görev Oluştur</h3>
                <div className="space-y-4">
                  <input type="text" placeholder="Görev Başlığı" value={newTask.baslik} onChange={(e) => setNewTask({ ...newTask, baslik: e.target.value })} className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  <textarea placeholder="Görev Açıklaması" value={newTask.aciklama} onChange={(e) => setNewTask({ ...newTask, aciklama: e.target.value })} className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" rows="3" />
                  <select value={newTask.atanan_personel_id} onChange={(e) => setNewTask({ ...newTask, atanan_personel_id: e.target.value })} className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <option value="">Personel Ata (opsiyonel)</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.ad} {emp.soyad}</option>
                    ))}
                  </select>
                  <button onClick={addTask} className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold flex items-center justify-center gap-2"><Plus className="w-4 h-4" /> Görev Oluştur</button>
                </div>
              </div>
            )}

            <div className="space-y-4">
              {tasks.map(task => {
                const atananPersonel = employees.find(e => e.id === task.atanan_personel_id);
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
                      {atananPersonel && (
                        <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-semibold">Atanan: {atananPersonel.ad} {atananPersonel.soyad}</span>
                      )}
                      {task.puan && (
                        <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-semibold">Puan: {task.puan} ⭐</span>
                      )}
                    </div>
                    {task.atanan_personel_id === employee.id && task.durum !== 'tamamlandi' && (
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
            </div>
          </div>
        )}

        {activeTab === 'maas' && permissions.view_salary && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-6">💰 Maaş Yönetimi</h2>
            <div className="mb-6">
              <label className="block font-semibold mb-2">Ay Seçin:</label>
              <input type="month" value={salaryMonth} onChange={(e) => setSalaryMonth(e.target.value)} className="px-4 py-2 border rounded-lg font-semibold" />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-2 text-left">Personel</th>
                    <th className="px-4 py-2 text-left">Pozisyon</th>
                    <th className="px-4 py-2 text-left">Temel Maaş</th>
                    <th className="px-4 py-2 text-left">Çalışılan Saat</th>
                    <th className="px-4 py-2 text-left">Toplam Maaş</th>
                  </tr>
                </thead>
                <tbody>
                  {salaryData.map((record, idx) => (
                    <tr key={idx} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-2 font-semibold">{record.ad} {record.soyad}</td>
                      <td className="px-4 py-2">{record.pozisyon}</td>
                      <td className="px-4 py-2">₺{record.temel_maas.toLocaleString('tr-TR')}</td>
                      <td className="px-4 py-2">{record.calisilan_saat}h</td>
                      <td className="px-4 py-2 font-bold text-green-600">₺{record.toplam_maas.toLocaleString('tr-TR')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'personel' && employee?.rol === 'admin' && (
          <div>
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h2 className="text-xl font-bold mb-4">➕ Yeni Personel Ekle</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input type="text" placeholder="Ad" value={newEmployee.ad} onChange={(e) => setNewEmployee({ ...newEmployee, ad: e.target.value })} className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                <input type="text" placeholder="Soyad" value={newEmployee.soyad} onChange={(e) => setNewEmployee({ ...newEmployee, soyad: e.target.value })} className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                <input type="email" placeholder="E-mail" value={newEmployee.email} onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })} className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                <input type="text" placeholder="Personel ID (sadece sayı)" value={newEmployee.employee_id} onChange={(e) => setNewEmployee({ ...newEmployee, employee_id: e.target.value })} className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
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
                              <input type="text" value={editData.employee_id} onChange={(e) => setEditData({ ...editData, employee_id: e.target.value })} className="w-full px-2 py-1 border rounded" />
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
        )}
      </div>
    </div>
  );
}
