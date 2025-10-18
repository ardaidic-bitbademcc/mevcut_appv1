import React, { useState, useEffect } from 'react';
import { LogOut, Plus, Trash2, Edit2, Check, X, ChevronLeft, ChevronRight } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
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
  const [editingTask, setEditingTask] = useState(null);
  const [editTaskData, setEditTaskData] = useState({});
  const [salaryMonth, setSalaryMonth] = useState(new Date().toISOString().slice(0, 7));
  const [salaryData, setSalaryData] = useState([]);

  // Fetch data from backend
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
    }
  };

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

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

  const kioskGiriş = async () => {
    try {
      const response = await axios.post(`${API}/attendance/check-in`, { employee_id: kioskEmployeeId });
      setKioskMessage(`✅ Giriş Başarılı!\n${response.data.employee}\nID: ${kioskEmployeeId}`);
      setTimeout(() => { setKioskMessage(''); setKioskEmployeeId(''); fetchData(); }, 2500);
    } catch (error) {
      setKioskMessage(`❌ ${error.response?.data?.detail || 'Hata oluştu'}`);
      setTimeout(() => { setKioskMessage(''); setKioskEmployeeId(''); }, 3000);
    }
  };

  const kioskÇıkış = async () => {
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

  useEffect(() => {
    if (user && activeTab === 'maas') {
      fetchSalaryData();
    }
  }, [salaryMonth, activeTab, user]);

  const renderShiftCalendar = () => {
    const [year, month] = selectedShiftMonth.split('-').map(Number);
    const daysInMonth = new Date(year, month, 0).getDate();
    const firstDay = new Date(year, month - 1, 1).getDay();
    
    const calendar = [];
    let week = [];
    
    // Empty cells for days before the first day of month
    for (let i = 0; i < firstDay; i++) {
      week.push(<div key={`empty-${i}`} className="h-24 bg-gray-50"></div>);
    }
    
    // Days of the month
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
    
    // Fill the last week
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
            <input
              type="email"
              placeholder="E-mail"
              value={loginData.email}
              onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
              onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
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
          <button onClick={handleLogout} className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 font-semibold flex items-center gap-2">
            <LogOut className="w-4 h-4" /> Çıkış
          </button>
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

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && permissions.view_dashboard && (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
                <p className="text-gray-600 text-sm">Toplam Personel</p>
                <p className="text-3xl font-bold text-gray-800">{employees.length}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
                <p className="text-gray-600 text-sm">Bugün Giriş Yapanlar</p>
                <p className="text-3xl font-bold text-gray-800">
                  {attendance.filter(a => a.tarih === new Date().toISOString().split('T')[0] && (a.status === 'giris' || a.status === 'cikis')).length}
                </p>
              </div>
              <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
                <p className="text-gray-600 text-sm">Çıkış Yapanlar</p>
                <p className="text-3xl font-bold text-gray-800">
                  {attendance.filter(a => a.tarih === new Date().toISOString().split('T')[0] && a.status === 'cikis').length}
                </p>
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
                        <td className="px-4 py-2">
                          <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded text-xs font-semibold">
                            {roles.find(r => r.id === emp.rol)?.name}
                          </span>
                        </td>
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

        {/* Continue with other tabs... */}
      </div>
    </div>
  );
}
