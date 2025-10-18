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

        {/* Kiosk Tab */}
        {activeTab === 'kiosk' && (\n          <div className=\"min-h-[600px] flex items-center justify-center bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg\">\n            <div className=\"bg-white rounded-2xl shadow-2xl p-12 w-full max-w-md text-center\">\n              <h1 className=\"text-4xl font-bold mb-2\">\ud83e\udf20 KIOSK</h1>\n              {kioskMessage ? (\n                <div className={`mb-8 p-6 rounded-xl text-lg font-bold whitespace-pre-line ${kioskMessage.includes('\u2705') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>\n                  {kioskMessage}\n                </div>\n              ) : (\n                <>\n                  <div className=\"mb-6 p-4 bg-gray-100 rounded-lg min-h-16 flex items-center justify-center\">\n                    <input\n                      type=\"text\"\n                      placeholder=\"Personel ID\"\n                      value={kioskEmployeeId}\n                      readOnly\n                      className=\"w-full px-4 py-3 text-3xl text-center border-2 border-indigo-300 rounded-lg bg-white font-bold\"\n                    />\n                  </div>\n                  <div className=\"grid grid-cols-3 gap-2 mb-6\">\n                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (\n                      <button\n                        key={num}\n                        onClick={() => addNumpadDigit(num.toString())}\n                        className=\"px-4 py-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-bold text-xl transition transform hover:scale-105\"\n                      >\n                        {num}\n                      </button>\n                    ))}\n                    <button\n                      onClick={() => addNumpadDigit('0')}\n                      className=\"col-span-2 px-4 py-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-bold text-xl transition transform hover:scale-105\"\n                    >\n                      0\n                    </button>\n                    <button\n                      onClick={clearNumpad}\n                      className=\"px-4 py-4 bg-red-500 text-white rounded-lg hover:bg-red-600 font-bold text-xl transition transform hover:scale-105\"\n                    >\n                      C\n                    </button>\n                  </div>\n                  <div className=\"space-y-3\">\n                    <button\n                      onClick={kioskGiri\u015f}\n                      className=\"w-full px-8 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 font-bold text-xl transition transform hover:scale-105\"\n                    >\n                      \u2705 G\u0130R\u0130\u015e\n                    </button>\n                    <button\n                      onClick={kiosk\u00c7\u0131k\u0131\u015f}\n                      className=\"w-full px-8 py-4 bg-red-600 text-white rounded-lg hover:bg-red-700 font-bold text-xl transition transform hover:scale-105\"\n                    >\n                      \ud83d\udeaa \u00c7IKI\u015e\n                    </button>\n                  </div>\n                </>\n              )}\n            </div>\n          </div>\n        )}\n\n        {/* Vardiya Türleri Tab */}\n        {activeTab === 'vardiya_turleri' && permissions.manage_shifts_types && (\n          <div className=\"bg-white rounded-lg shadow p-6\">\n            <h2 className=\"text-xl font-bold mb-6\">\u2699\ufe0f Vardiya T\u00fcrleri Y\u00f6netimi</h2>\n            <div className=\"bg-blue-50 p-6 rounded-lg border border-blue-200 mb-6\">\n              <h3 className=\"font-bold mb-4\">Yeni Vardiya T\u00fcr\u00fc Ekle</h3>\n              <div className=\"grid grid-cols-1 md:grid-cols-5 gap-4\">\n                <input\n                  type=\"text\"\n                  placeholder=\"Vardiya Ad\u0131\"\n                  value={newShiftType.name}\n                  onChange={(e) => setNewShiftType({ ...newShiftType, name: e.target.value })}\n                  className=\"px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500\"\n                />\n                <input\n                  type=\"time\"\n                  placeholder=\"Ba\u015flang\u0131\u00e7\"\n                  value={newShiftType.start}\n                  onChange={(e) => setNewShiftType({ ...newShiftType, start: e.target.value })}\n                  className=\"px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500\"\n                />\n                <input\n                  type=\"time\"\n                  placeholder=\"Biti\u015f\"\n                  value={newShiftType.end}\n                  onChange={(e) => setNewShiftType({ ...newShiftType, end: e.target.value })}\n                  className=\"px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500\"\n                />\n                <select\n                  value={newShiftType.color}\n                  onChange={(e) => setNewShiftType({ ...newShiftType, color: e.target.value })}\n                  className=\"px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500\"\n                >\n                  <option value=\"bg-yellow-500\">Sar\u0131</option>\n                  <option value=\"bg-orange-500\">Turuncu</option>\n                  <option value=\"bg-indigo-600\">\u0130ndigo</option>\n                  <option value=\"bg-green-500\">Ye\u015fil</option>\n                  <option value=\"bg-red-500\">K\u0131rm\u0131z\u0131</option>\n                  <option value=\"bg-blue-500\">Mavi</option>\n                </select>\n                <button\n                  onClick={addShiftType}\n                  className=\"px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold flex items-center justify-center\"\n                >\n                  <Plus className=\"w-4 h-4\" />\n                </button>\n              </div>\n            </div>\n            <h3 className=\"font-bold text-lg mb-4\">Vardiya T\u00fcrleri</h3>\n            <div className=\"space-y-3\">\n              {shiftTypes.map(shift => (\n                <div key={shift.id} className={`p-4 rounded-lg ${shift.color} text-white flex justify-between items-center`}>\n                  <div>\n                    <p className=\"font-bold\">{shift.name}</p>\n                    <p className=\"text-sm\">{shift.start} - {shift.end}</p>\n                  </div>\n                  <button\n                    onClick={() => deleteShiftType(shift.id)}\n                    className=\"px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 font-semibold\"\n                  >\n                    <Trash2 className=\"w-4 h-4\" />\n                  </button>\n                </div>\n              ))}\n            </div>\n          </div>\n        )}\n\n        {/* Rol Yönetimi Tab */}\n        {activeTab === 'rol_yonetimi' && permissions.manage_roles && (\n          <div className=\"bg-white rounded-lg shadow p-6\">\n            <h2 className=\"text-xl font-bold mb-6\">\ud83d\udd10 Rol Y\u00f6netimi</h2>\n            <div className=\"space-y-4\">\n              {roles.map(role => (\n                <div key={role.id} className=\"border-2 border-gray-200 rounded-lg p-4\">\n                  <h3 className=\"text-lg font-bold mb-3\">{role.name}</h3>\n                  <div className=\"grid grid-cols-1 md:grid-cols-2 gap-3\">\n                    <label className=\"flex items-center gap-2\">\n                      <input\n                        type=\"checkbox\"\n                        checked={role.permissions.view_dashboard}\n                        onChange={(e) => updateRolePermission(role.id, 'view_dashboard', e.target.checked)}\n                        className=\"w-4 h-4\"\n                      />\n                      <span>Dashboard G\u00f6r\u00fcnt\u00fcleme</span>\n                    </label>\n                    <label className=\"flex items-center gap-2\">\n                      <input\n                        type=\"checkbox\"\n                        checked={role.permissions.view_tasks}\n                        onChange={(e) => updateRolePermission(role.id, 'view_tasks', e.target.checked)}\n                        className=\"w-4 h-4\"\n                      />\n                      <span>G\u00f6revleri G\u00f6r\u00fcnt\u00fcleme</span>\n                    </label>\n                    <label className=\"flex items-center gap-2\">\n                      <input\n                        type=\"checkbox\"\n                        checked={role.permissions.assign_tasks}\n                        onChange={(e) => updateRolePermission(role.id, 'assign_tasks', e.target.checked)}\n                        className=\"w-4 h-4\"\n                      />\n                      <span>G\u00f6rev Atama</span>\n                    </label>\n                    <label className=\"flex items-center gap-2\">\n                      <input\n                        type=\"checkbox\"\n                        checked={role.permissions.rate_tasks}\n                        onChange={(e) => updateRolePermission(role.id, 'rate_tasks', e.target.checked)}\n                        className=\"w-4 h-4\"\n                      />\n                      <span>G\u00f6rev Puanlama</span>\n                    </label>\n                    <label className=\"flex items-center gap-2\">\n                      <input\n                        type=\"checkbox\"\n                        checked={role.permissions.manage_shifts}\n                        onChange={(e) => updateRolePermission(role.id, 'manage_shifts', e.target.checked)}\n                        className=\"w-4 h-4\"\n                      />\n                      <span>Vardiya Y\u00f6netimi</span>\n                    </label>\n                    <label className=\"flex items-center gap-2\">\n                      <input\n                        type=\"checkbox\"\n                        checked={role.permissions.manage_leave}\n                        onChange={(e) => updateRolePermission(role.id, 'manage_leave', e.target.checked)}\n                        className=\"w-4 h-4\"\n                      />\n                      <span>\u0130zin Y\u00f6netimi</span>\n                    </label>\n                    <label className=\"flex items-center gap-2\">\n                      <input\n                        type=\"checkbox\"\n                        checked={role.permissions.view_salary}\n                        onChange={(e) => updateRolePermission(role.id, 'view_salary', e.target.checked)}\n                        className=\"w-4 h-4\"\n                      />\n                      <span>Maa\u015f G\u00f6r\u00fcnt\u00fcleme</span>\n                    </label>\n                    <label className=\"flex items-center gap-2\">\n                      <input\n                        type=\"checkbox\"\n                        checked={role.permissions.manage_shifts_types}\n                        onChange={(e) => updateRolePermission(role.id, 'manage_shifts_types', e.target.checked)}\n                        className=\"w-4 h-4\"\n                      />\n                      <span>Vardiya T\u00fcr\u00fc Y\u00f6netimi</span>\n                    </label>\n                  </div>\n                </div>\n              ))}\n            </div>\n          </div>\n        )}\n\n        {/* Vardiya & İzin Tab */}\n        {activeTab === 'vardiya_izin' && (permissions.manage_shifts || permissions.manage_shifts_types || permissions.manage_leave) && (\n          <div>\n            <div className=\"bg-white rounded-lg shadow p-6 mb-6\">\n              <h2 className=\"text-xl font-bold mb-6\">\ud83d\udcc5 Vardiya Takvimi & \u0130zin</h2>\n\n              {permissions.manage_shifts && (\n                <>\n                  <div className=\"mb-6 p-4 bg-purple-50 rounded-lg border border-purple-200\">\n                    <p className=\"font-bold mb-3\">Vardiya T\u00fcr\u00fc Se\u00e7in</p>\n                    <div className=\"grid grid-cols-1 md:grid-cols-3 gap-3\">\n                      {shiftTypes.map(shift => (\n                        <button\n                          key={shift.id}\n                          onClick={() => setSelectedShiftType(shift.id)}\n                          className={`p-3 rounded-lg border-2 font-semibold transition ${\n                            selectedShiftType === shift.id\n                              ? `${shift.color} text-white border-transparent`\n                              : 'bg-white border-gray-300 text-gray-700'\n                          }`}\n                        >\n                          {shift.name}\n                        </button>\n                      ))}\n                    </div>\n                  </div>\n\n                  <div className=\"mb-6 flex gap-4 items-center\">\n                    <input\n                      type=\"month\"\n                      value={selectedShiftMonth}\n                      onChange={(e) => setSelectedShiftMonth(e.target.value)}\n                      className=\"px-4 py-2 border rounded-lg font-semibold\"\n                    />\n                    <div className=\"text-sm text-gray-600\">\n                      \u0130pucu: Takvimde g\u00fcn se\u00e7in, sonra personel se\u00e7in ve vardiya atay\u0131n\n                    </div>\n                  </div>\n\n                  <div className=\"bg-gray-50 rounded-lg p-4\">\n                    <div className=\"grid grid-cols-7 gap-0 mb-2\">\n                      {['Pzr', 'Pzt', 'Sal', '\u00c7ar', 'Per', 'Cum', 'Cmt'].map(day => (\n                        <div key={day} className=\"text-center font-bold text-sm py-2 bg-indigo-100 text-indigo-800\">\n                          {day}\n                        </div>\n                      ))}\n                    </div>\n                    {renderShiftCalendar()}\n                  </div>\n\n                  <div className=\"mt-6 bg-blue-50 p-4 rounded-lg border border-blue-200\">\n                    <h3 className=\"font-bold mb-3\">Vardiya Atama</h3>\n                    <div className=\"grid grid-cols-1 md:grid-cols-3 gap-4\">\n                      <select className=\"px-4 py-2 border rounded-lg\" id=\"shift-employee-select\">\n                        <option value=\"\">Personel Se\u00e7</option>\n                        {employees.map(emp => (\n                          <option key={emp.id} value={emp.id}>{emp.ad} {emp.soyad}</option>\n                        ))}\n                      </select>\n                      <input\n                        type=\"date\"\n                        className=\"px-4 py-2 border rounded-lg\"\n                        id=\"shift-date-input\"\n                      />\n                      <button\n                        onClick={() => {\n                          const empId = document.getElementById('shift-employee-select').value;\n                          const date = document.getElementById('shift-date-input').value;\n                          if (empId && date) {\n                            addShiftToCalendar(parseInt(empId), date);\n                          } else {\n                            alert('\u274c Personel ve tarih se\u00e7iniz!');\n                          }\n                        }}\n                        className=\"px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold\"\n                      >\n                        Vardiya Ata\n                      </button>\n                    </div>\n                  </div>\n                </>\n              )}\n            </div>\n\n            {permissions.manage_leave && (\n              <div className=\"bg-white rounded-lg shadow p-6\">\n                <h2 className=\"text-xl font-bold mb-4\">\ud83d\uddd3\ufe0f \u0130zin Kayd\u0131 Ekle</h2>\n                <div className=\"grid grid-cols-1 md:grid-cols-5 gap-4 mb-4\">\n                  <select\n                    value={newLeave.employee_id}\n                    onChange={(e) => setNewLeave({ ...newLeave, employee_id: e.target.value })}\n                    className=\"px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500\"\n                  >\n                    <option value=\"\">Personel Se\u00e7</option>\n                    {employees.map(emp => (\n                      <option key={emp.id} value={emp.id}>{emp.ad} {emp.soyad}</option>\n                    ))}\n                  </select>\n                  <input\n                    type=\"date\"\n                    value={newLeave.tarih}\n                    onChange={(e) => setNewLeave({ ...newLeave, tarih: e.target.value })}\n                    className=\"px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500\"\n                  />\n                  <select\n                    value={newLeave.leave_type}\n                    onChange={(e) => setNewLeave({ ...newLeave, leave_type: e.target.value })}\n                    className=\"px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500\"\n                  >\n                    <option value=\"izin\">\u0130zin</option>\n                    <option value=\"hastalik\">Hastal\u0131k</option>\n                  </select>\n                  <input\n                    type=\"text\"\n                    placeholder=\"Notlar\"\n                    value={newLeave.notlar}\n                    onChange={(e) => setNewLeave({ ...newLeave, notlar: e.target.value })}\n                    className=\"px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500\"\n                  />\n                  <button\n                    onClick={addLeave}\n                    className=\"px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold flex items-center justify-center\"\n                  >\n                    <Plus className=\"w-4 h-4\" />\n                  </button>\n                </div>\n\n                <h3 className=\"font-bold text-lg mb-4\">\u0130zin Kay\u0131tlar\u0131</h3>\n                <div className=\"space-y-2\">\n                  {leaveRecords.map(leave => {\n                    const emp = employees.find(e => e.id === leave.employee_id);\n                    return (\n                      <div\n                        key={leave.id}\n                        className={`p-3 rounded-lg flex justify-between items-center ${\n                          leave.leave_type === 'izin'\n                            ? 'bg-yellow-50 border border-yellow-200'\n                            : 'bg-red-50 border border-red-200'\n                        }`}\n                      >\n                        <div>\n                          <p className=\"font-semibold text-sm\">{emp?.ad} {emp?.soyad} - {leave.tarih}</p>\n                          <p className=\"text-xs text-gray-600\">\n                            {leave.leave_type === 'izin' ? '\ud83d\uddd3\ufe0f \u0130zin' : '\ud83c\udfcadHastal\u0131k'} - {leave.notlar}\n                          </p>\n                        </div>\n                        <button\n                          onClick={() => deleteLeave(leave.id)}\n                          className=\"px-3 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600 font-semibold\"\n                        >\n                          <Trash2 className=\"w-3 h-3\" />\n                        </button>\n                      </div>\n                    );\n                  })}\n                </div>\n              </div>\n            )}\n          </div>\n        )}\n\n        {/* Görevler Tab */}\n        {activeTab === 'gorevler' && permissions.view_tasks && (\n          <div className=\"bg-white rounded-lg shadow p-6\">\n            <h2 className=\"text-xl font-bold mb-6\">\u2705 G\u00f6revler</h2>\n            \n            {permissions.assign_tasks && (\n              <div className=\"bg-blue-50 p-6 rounded-lg border border-blue-200 mb-6\">\n                <h3 className=\"font-bold mb-4\">Yeni G\u00f6rev Olu\u015ftur</h3>\n                <div className=\"space-y-4\">\n                  <input\n                    type=\"text\"\n                    placeholder=\"G\u00f6rev Ba\u015fl\u0131\u011f\u0131\"\n                    value={newTask.baslik}\n                    onChange={(e) => setNewTask({ ...newTask, baslik: e.target.value })}\n                    className=\"w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500\"\n                  />\n                  <textarea\n                    placeholder=\"G\u00f6rev A\u00e7\u0131klamas\u0131\"\n                    value={newTask.aciklama}\n                    onChange={(e) => setNewTask({ ...newTask, aciklama: e.target.value })}\n                    className=\"w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500\"\n                    rows=\"3\"\n                  />\n                  <select\n                    value={newTask.atanan_personel_id}\n                    onChange={(e) => setNewTask({ ...newTask, atanan_personel_id: e.target.value })}\n                    className=\"w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500\"\n                  >\n                    <option value=\"\">Personel Ata (opsiyonel)</option>\n                    {employees.map(emp => (\n                      <option key={emp.id} value={emp.id}>{emp.ad} {emp.soyad}</option>\n                    ))}\n                  </select>\n                  <button\n                    onClick={addTask}\n                    className=\"w-full px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold flex items-center justify-center gap-2\"\n                  >\n                    <Plus className=\"w-4 h-4\" /> G\u00f6rev Olu\u015ftur\n                  </button>\n                </div>\n              </div>\n            )}\n\n            <div className=\"space-y-4\">\n              {tasks.map(task => {\n                const atananPersonel = employees.find(e => e.id === task.atanan_personel_id);\n                const olusturan = employees.find(e => e.id === task.olusturan_id);\n                return (\n                  <div key={task.id} className=\"border-2 border-gray-200 rounded-lg p-4 hover:shadow-md transition\">\n                    <div className=\"flex justify-between items-start mb-2\">\n                      <div className=\"flex-1\">\n                        <h3 className=\"text-lg font-bold text-gray-800\">{task.baslik}</h3>\n                        <p className=\"text-sm text-gray-600 mt-1\">{task.aciklama}</p>\n                      </div>\n                      <div className=\"flex gap-2\">\n                        {permissions.rate_tasks && task.durum === 'tamamlandi' && !task.puan && (\n                          <select\n                            onChange={(e) => {\n                              const puan = parseInt(e.target.value);\n                              if (puan) updateTask(task.id, { puan });\n                            }}\n                            className=\"px-2 py-1 border rounded text-sm\"\n                          >\n                            <option value=\"\">Puan Ver</option>\n                            {[1, 2, 3, 4, 5].map(p => <option key={p} value={p}>{p} \u2b50</option>)}\n                          </select>\n                        )}\n                        {permissions.assign_tasks && (\n                          <button\n                            onClick={() => deleteTask(task.id)}\n                            className=\"px-3 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600\"\n                          >\n                            <Trash2 className=\"w-3 h-3\" />\n                          </button>\n                        )}\n                      </div>\n                    </div>\n                    <div className=\"flex flex-wrap gap-2 mt-3\">\n                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${\n                        task.durum === 'beklemede' ? 'bg-yellow-100 text-yellow-800' :\n                        task.durum === 'devam_ediyor' ? 'bg-blue-100 text-blue-800' :\n                        'bg-green-100 text-green-800'\n                      }`}>\n                        {task.durum === 'beklemede' ? 'Beklemede' :\n                         task.durum === 'devam_ediyor' ? 'Devam Ediyor' : 'Tamamland\u0131'}\n                      </span>\n                      {atananPersonel && (\n                        <span className=\"px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-semibold\">\n                          Atanan: {atananPersonel.ad} {atananPersonel.soyad}\n                        </span>\n                      )}\n                      {task.puan && (\n                        <span className=\"px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-semibold\">\n                          Puan: {task.puan} \u2b50\n                        </span>\n                      )}\n                    </div>\n                    {task.atanan_personel_id === employee.id && task.durum !== 'tamamlandi' && (\n                      <div className=\"mt-3 flex gap-2\">\n                        {task.durum === 'beklemede' && (\n                          <button\n                            onClick={() => updateTask(task.id, { durum: 'devam_ediyor' })}\n                            className=\"px-4 py-2 bg-blue-500 text-white rounded text-sm hover:bg-blue-600\"\n                          >\n                            Ba\u015flat\n                          </button>\n                        )}\n                        {task.durum === 'devam_ediyor' && (\n                          <button\n                            onClick={() => updateTask(task.id, { durum: 'tamamlandi' })}\n                            className=\"px-4 py-2 bg-green-500 text-white rounded text-sm hover:bg-green-600\"\n                          >\n                            Tamamla\n                          </button>\n                        )}\n                      </div>\n                    )}\n                  </div>\n                );\n              })}\n            </div>\n          </div>\n        )}\n\n        {/* Maaş Tab */}\n        {activeTab === 'maas' && permissions.view_salary && (\n          <div className=\"bg-white rounded-lg shadow p-6\">\n            <h2 className=\"text-xl font-bold mb-6\">\ud83d\udcb0 Maa\u015f Y\u00f6netimi</h2>\n            <div className=\"mb-6\">\n              <label className=\"block font-semibold mb-2\">Ay Se\u00e7in:</label>\n              <input\n                type=\"month\"\n                value={salaryMonth}\n                onChange={(e) => setSalaryMonth(e.target.value)}\n                className=\"px-4 py-2 border rounded-lg font-semibold\"\n              />\n            </div>\n            <div className=\"overflow-x-auto\">\n              <table className=\"w-full text-sm\">\n                <thead className=\"bg-gray-50 border-b\">\n                  <tr>\n                    <th className=\"px-4 py-2 text-left\">Personel</th>\n                    <th className=\"px-4 py-2 text-left\">Pozisyon</th>\n                    <th className=\"px-4 py-2 text-left\">Temel Maa\u015f</th>\n                    <th className=\"px-4 py-2 text-left\">\u00c7al\u0131\u015f\u0131lan Saat</th>\n                    <th className=\"px-4 py-2 text-left\">Toplam Maa\u015f</th>\n                  </tr>\n                </thead>\n                <tbody>\n                  {salaryData.map((record, idx) => (\n                    <tr key={idx} className=\"border-b hover:bg-gray-50\">\n                      <td className=\"px-4 py-2 font-semibold\">{record.ad} {record.soyad}</td>\n                      <td className=\"px-4 py-2\">{record.pozisyon}</td>\n                      <td className=\"px-4 py-2\">\u20ba{record.temel_maas.toLocaleString('tr-TR')}</td>\n                      <td className=\"px-4 py-2\">{record.calisilan_saat}h</td>\n                      <td className=\"px-4 py-2 font-bold text-green-600\">\u20ba{record.toplam_maas.toLocaleString('tr-TR')}</td>\n                    </tr>\n                  ))}\n                </tbody>\n              </table>\n            </div>\n          </div>\n        )}\n\n        {/* Personel Tab */}\n        {activeTab === 'personel' && employee?.rol === 'admin' && (\n          <div>\n            {/* Yeni Personel Ekleme */}\n            <div className=\"bg-white rounded-lg shadow p-6 mb-6\">\n              <h2 className=\"text-xl font-bold mb-4\">\u2795 Yeni Personel Ekle</h2>\n              <div className=\"grid grid-cols-1 md:grid-cols-2 gap-4\">\n                <input\n                  type=\"text\"\n                  placeholder=\"Ad\"\n                  value={newEmployee.ad}\n                  onChange={(e) => setNewEmployee({ ...newEmployee, ad: e.target.value })}\n                  className=\"px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500\"\n                />\n                <input\n                  type=\"text\"\n                  placeholder=\"Soyad\"\n                  value={newEmployee.soyad}\n                  onChange={(e) => setNewEmployee({ ...newEmployee, soyad: e.target.value })}\n                  className=\"px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500\"\n                />\n                <input\n                  type=\"email\"\n                  placeholder=\"E-mail\"\n                  value={newEmployee.email}\n                  onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })}\n                  className=\"px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500\"\n                />\n                <input\n                  type=\"text\"\n                  placeholder=\"Personel ID (sadece say\u0131)\"\n                  value={newEmployee.employee_id}\n                  onChange={(e) => setNewEmployee({ ...newEmployee, employee_id: e.target.value })}\n                  className=\"px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500\"\n                />\n                <input\n                  type=\"text\"\n                  placeholder=\"Pozisyon\"\n                  value={newEmployee.pozisyon}\n                  onChange={(e) => setNewEmployee({ ...newEmployee, pozisyon: e.target.value })}\n                  className=\"px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500\"\n                />\n                <input\n                  type=\"number\"\n                  placeholder=\"Maa\u015f (\u20ba)\"\n                  value={newEmployee.maas_tabani}\n                  onChange={(e) => setNewEmployee({ ...newEmployee, maas_tabani: e.target.value })}\n                  className=\"px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500\"\n                />\n                <select\n                  value={newEmployee.rol}\n                  onChange={(e) => setNewEmployee({ ...newEmployee, rol: e.target.value })}\n                  className=\"px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500\"\n                >\n                  {roles.map(role => (\n                    <option key={role.id} value={role.id}>{role.name}</option>\n                  ))}\n                </select>\n              </div>\n              <button\n                onClick={addEmployee}\n                className=\"mt-4 w-full px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold flex items-center justify-center gap-2\"\n              >\n                <Plus className=\"w-4 h-4\" /> Personel Ekle\n              </button>\n            </div>\n\n            {/* Personel Listesi */}\n            <div className=\"bg-white rounded-lg shadow p-6\">\n              <h2 className=\"text-xl font-bold mb-4\">\ud83d\udccb Personel Listesi</h2>\n              <div className=\"overflow-x-auto\">\n                <table className=\"w-full text-sm\">\n                  <thead className=\"bg-gray-50 border-b\">\n                    <tr>\n                      <th className=\"px-4 py-2 text-left\">ID</th>\n                      <th className=\"px-4 py-2 text-left\">Ad Soyad</th>\n                      <th className=\"px-4 py-2 text-left\">E-mail</th>\n                      <th className=\"px-4 py-2 text-left\">Pozisyon</th>\n                      <th className=\"px-4 py-2 text-left\">Maa\u015f (\u20ba)</th>\n                      <th className=\"px-4 py-2 text-left\">Rol</th>\n                      <th className=\"px-4 py-2 text-left\">\u0130\u015flemler</th>\n                    </tr>\n                  </thead>\n                  <tbody>\n                    {employees.map(emp => (\n                      <tr key={emp.id} className={editingEmployee === emp.id ? 'bg-blue-50' : 'border-b hover:bg-gray-50'}>\n                        {editingEmployee === emp.id ? (\n                          <>\n                            <td className=\"px-4 py-2\">\n                              <input\n                                type=\"text\"\n                                value={editData.employee_id}\n                                onChange={(e) => setEditData({ ...editData, employee_id: e.target.value })}\n                                className=\"w-full px-2 py-1 border rounded\"\n                              />\n                            </td>\n                            <td className=\"px-4 py-2\">\n                              <input\n                                type=\"text\"\n                                value={editData.ad}\n                                onChange={(e) => setEditData({ ...editData, ad: e.target.value })}\n                                className=\"w-full px-2 py-1 border rounded mb-1\"\n                              />\n                              <input\n                                type=\"text\"\n                                value={editData.soyad}\n                                onChange={(e) => setEditData({ ...editData, soyad: e.target.value })}\n                                className=\"w-full px-2 py-1 border rounded\"\n                              />\n                            </td>\n                            <td className=\"px-4 py-2\">\n                              <input\n                                type=\"email\"\n                                value={editData.email}\n                                onChange={(e) => setEditData({ ...editData, email: e.target.value })}\n                                className=\"w-full px-2 py-1 border rounded\"\n                              />\n                            </td>\n                            <td className=\"px-4 py-2\">\n                              <input\n                                type=\"text\"\n                                value={editData.pozisyon}\n                                onChange={(e) => setEditData({ ...editData, pozisyon: e.target.value })}\n                                className=\"w-full px-2 py-1 border rounded\"\n                              />\n                            </td>\n                            <td className=\"px-4 py-2\">\n                              <input\n                                type=\"number\"\n                                value={editData.maas_tabani}\n                                onChange={(e) => setEditData({ ...editData, maas_tabani: e.target.value })}\n                                className=\"w-full px-2 py-1 border rounded\"\n                              />\n                            </td>\n                            <td className=\"px-4 py-2\">\n                              <select\n                                value={editData.rol}\n                                onChange={(e) => setEditData({ ...editData, rol: e.target.value })}\n                                className=\"w-full px-2 py-1 border rounded\"\n                              >\n                                {roles.map(role => (\n                                  <option key={role.id} value={role.id}>{role.name}</option>\n                                ))}\n                              </select>\n                            </td>\n                            <td className=\"px-4 py-2 flex gap-2\">\n                              <button\n                                onClick={saveEmployee}\n                                className=\"px-3 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600 font-semibold flex items-center gap-1\"\n                              >\n                                <Check className=\"w-3 h-3\" /> Kaydet\n                              </button>\n                              <button\n                                onClick={() => setEditingEmployee(null)}\n                                className=\"px-3 py-1 bg-gray-500 text-white rounded text-xs hover:bg-gray-600 font-semibold flex items-center gap-1\"\n                              >\n                                <X className=\"w-3 h-3\" /> \u0130ptal\n                              </button>\n                            </td>\n                          </>\n                        ) : (\n                          <>\n                            <td className=\"px-4 py-2 font-bold text-indigo-600\">{emp.employee_id}</td>\n                            <td className=\"px-4 py-2 font-semibold\">{emp.ad} {emp.soyad}</td>\n                            <td className=\"px-4 py-2\">{emp.email}</td>\n                            <td className=\"px-4 py-2\">{emp.pozisyon}</td>\n                            <td className=\"px-4 py-2\">\u20ba{emp.maas_tabani.toLocaleString('tr-TR')}</td>\n                            <td className=\"px-4 py-2\">\n                              <span className=\"px-2 py-1 bg-indigo-100 text-indigo-700 rounded text-xs font-semibold\">\n                                {roles.find(r => r.id === emp.rol)?.name}\n                              </span>\n                            </td>\n                            <td className=\"px-4 py-2 flex gap-2\">\n                              <button\n                                onClick={() => startEditEmployee(emp)}\n                                className=\"px-3 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 font-semibold flex items-center gap-1\"\n                              >\n                                <Edit2 className=\"w-3 h-3\" /> D\u00fczenle\n                              </button>\n                              <button\n                                onClick={() => deleteEmployee(emp.id)}\n                                className=\"px-3 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600 font-semibold flex items-center gap-1\"\n                              >\n                                <Trash2 className=\"w-3 h-3\" /> Sil\n                              </button>\n                            </td>\n                          </>\n                        )}\n                      </tr>\n                    ))}\n                  </tbody>\n                </table>\n              </div>\n            </div>\n\n            {/* Kiosk Geçmişi */}\n            <div className=\"bg-white rounded-lg shadow p-6 mt-6\">\n              <h2 className=\"text-xl font-bold mb-4\">\ud83d\udccb Kiosk Giri\u015f-\u00c7\u0131k\u0131\u015f Ge\u00e7mi\u015fi</h2>\n              <div className=\"overflow-x-auto\">\n                <table className=\"w-full text-sm\">\n                  <thead className=\"bg-gray-50 border-b\">\n                    <tr>\n                      <th className=\"px-4 py-2 text-left\">Personel</th>\n                      <th className=\"px-4 py-2 text-left\">ID</th>\n                      <th className=\"px-4 py-2 text-left\">Tarih</th>\n                      <th className=\"px-4 py-2 text-left\">Giri\u015f</th>\n                      <th className=\"px-4 py-2 text-left\">\u00c7\u0131k\u0131\u015f</th>\n                      <th className=\"px-4 py-2 text-left\">\u00c7al\u0131\u015f\u0131lan Saat</th>\n                    </tr>\n                  </thead>\n                  <tbody>\n                    {attendance.map(att => (\n                      <tr key={att.id} className=\"border-b hover:bg-gray-50\">\n                        <td className=\"px-4 py-2 font-semibold\">{att.ad} {att.soyad}</td>\n                        <td className=\"px-4 py-2 font-bold text-indigo-600\">{att.employee_id}</td>\n                        <td className=\"px-4 py-2\">{att.tarih}</td>\n                        <td className=\"px-4 py-2\">\n                          {att.giris_saati ? new Date(att.giris_saati).toLocaleTimeString('tr-TR') : '-'}\n                        </td>\n                        <td className=\"px-4 py-2\">\n                          {att.cikis_saati ? new Date(att.cikis_saati).toLocaleTimeString('tr-TR') : '-'}\n                        </td>\n                        <td className=\"px-4 py-2 font-semibold\">\n                          {att.calisilan_saat > 0 ? `${att.calisilan_saat}h` : '-'}\n                        </td>\n                      </tr>\n                    ))}\n                  </tbody>\n                </table>\n              </div>\n            </div>\n          </div>\n        )}\n      </div>\n    </div>\n  );\n}
