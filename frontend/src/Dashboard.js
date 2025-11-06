import React, { useState, useEffect } from 'react';
import { LogOut, Plus, Trash2, Edit2, Check, X } from 'lucide-react';
import axios from 'axios';
import { API, STOCK_ENABLED } from './lib/config';
import {
  fetchEmployees,
} from './lib/api';
import { useQuery, useQueryClient, useQueries } from '@tanstack/react-query';
import usePermissions from './features/hr/hooks/usePermissions';
import Subscription from './Subscription';
import POS from './POS';
import Sidebar from './components/Sidebar';
import POSDashboard from './pos/POSDashboard';
import Terminal from './pos/Terminal';
import Products from './pos/Products';
import Inventory from './pos/Inventory';
import Orders from './pos/Orders';
import POSSettings from './pos/Settings';
import DashboardTab from './components/DashboardTab';
import TasksTab from './components/TasksTab';
import ShiftsAndLeaveTab from './components/ShiftsAndLeaveTab';
import SalaryTab from './components/SalaryTab';
import PersonnelTab from './components/PersonnelTab';
import StockTab from './components/StockTab';

// API and feature flags are centralized in ./lib/config

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [employee, setEmployee] = useState(null);
  const [companyId, setCompanyId] = useState(null);
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginMessage, setLoginMessage] = useState('');
  const [showRegister, setShowRegister] = useState(false);
  const [registerData, setRegisterData] = useState({ ad: '', soyad: '', email: '', employee_id: '' });
  const [isRegistering, setIsRegistering] = useState(false);
  const [registerMessage, setRegisterMessage] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');

  const [employees, setEmployees] = useState([]);
  const [roles, setRoles] = useState([]);
  const [shiftTypes, setShiftTypes] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [leaveRecords, setLeaveRecords] = useState([]);
  const [shiftCalendar, setShiftCalendar] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [salaryData, setSalaryData] = useState([]);
  const [salaryError, setSalaryError] = useState(null);
  const [selectedEmployeeForDetail, setSelectedEmployeeForDetail] = useState(null);
  const [avansData, setAvansData] = useState([]);
  const [yemekUcretleri, setYemekUcretleri] = useState([]);
  const [newAvans, setNewAvans] = useState({ employee_id: '', miktar: '', tarih: '', aciklama: '' });
  const [showAvansModal, setShowAvansModal] = useState(false);
  const [showYemekModal, setShowYemekModal] = useState(false);
  const [yemekUpdate, setYemekUpdate] = useState({ employee_id: '', gunluk_ucret: '' });

  const [kioskEmployeeId, setKioskEmployeeId] = useState('');
  const [kioskMessage, setKioskMessage] = useState('');
  const [newLeave, setNewLeave] = useState({ employee_id: '', tarih: '', leave_type: 'izin', notlar: '' });
  const [selectedShiftMonth, setSelectedShiftMonth] = useState(new Date().toISOString().slice(0, 7));
  const [selectedShiftType, setSelectedShiftType] = useState('sabah');
  const [selectedEmployeesForShift, setSelectedEmployeesForShift] = useState([]);
  const [newEmployee, setNewEmployee] = useState({ ad: '', soyad: '', pozisyon: '', maas_tabani: 0, rol: 'personel', email: '', employee_id: '' });
  const [newShiftType, setNewShiftType] = useState({ name: '', start: '', end: '', color: 'bg-blue-500' });
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [editData, setEditData] = useState({});
  const [newTask, setNewTask] = useState({ baslik: '', aciklama: '', atanan_personel_ids: [], tekrarlayan: false, tekrar_sayi: 1, tekrar_birim: 'gun' });
  const [salaryMonth, setSalaryMonth] = useState(new Date().toISOString().slice(0, 7));
  const [draggedEmployee, setDraggedEmployee] = useState(null);
  const [showWeeklySchedule, setShowWeeklySchedule] = useState(false);
  const [weeklyScheduleEmployee, setWeeklyScheduleEmployee] = useState(null);
  const [weeklyScheduleData, setWeeklyScheduleData] = useState(null);
  const [weeklyPdfEmployeeId, setWeeklyPdfEmployeeId] = useState('');
  const [stokKategoriler, setStokKategoriler] = useState([]);
  const [stokBirimler, setStokBirimler] = useState([]);
  const [stokUrunler, setStokUrunler] = useState([]);
  const [stokDurum, setStokDurum] = useState([]);
  const [stokImportFile, setStokImportFile] = useState(null);
  const [newStokKategori, setNewStokKategori] = useState({ ad: '', renk: '#6B7280' });
  const [newStokBirim, setNewStokBirim] = useState({ ad: '', kisaltma: '' });
  const [newStokUrun, setNewStokUrun] = useState({ ad: '', birim_id: '', kategori_id: '', min_stok: 0 });
  const [showStokSayimModal, setShowStokSayimModal] = useState(false);
  const [stokSayimData, setStokSayimData] = useState({});
  const [editingStokUrun, setEditingStokUrun] = useState(null);
  const [editingStokKategori, setEditingStokKategori] = useState(null);
  

  // REMOVED: fetchData function - now using demo data directly in useEffect

  useEffect(() => {
    if (user) {
      // Data is now set directly in the useEffect below - no need to fetch
      if (activeTab === 'stok' && STOCK_ENABLED) {
        fetchStokData();
      }
    }
  }, [user, activeTab]);

  const fetchStokData = async () => {
    try {
      const [kategoriRes, birimRes, urunRes, durumRes] = await Promise.all([
        axios.get(`${API}/stok-kategori`),
        axios.get(`${API}/stok-birim`),
        axios.get(`${API}/stok-urun`),
        axios.get(`${API}/stok-sayim/son-durum`)
      ]);
      setStokKategoriler(kategoriRes.data);
      setStokBirimler(birimRes.data);
      setStokUrunler(urunRes.data);
      setStokDurum(durumRes.data);
    } catch (error) {
      console.error('Stok verileri getirilemedi:', error);
    }
  };

  const downloadStok = async () => {
    try {
      const res = await axios.get(`${API}/stok-export`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `stok_export.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Stok export error', err);
      alert('Stok export hatası: ' + (err.response?.data || err.message));
    }
  };

  const queryClient = useQueryClient();

  // React Query: pilot for employees and roles (top-level hooks)
  useQuery({
    queryKey: ['employees'],
    queryFn: fetchEmployees,
    enabled: !!user, // Enable when user logged in
    staleTime: 1000 * 60 * 5, // 5 minutes
    onSuccess: (data) => setEmployees(data || []),
    onError: (err) => console.warn('employees query failed', err?.message || err),
  });

  // Simplified roles - use default data
  useEffect(() => {
    if (user) {
      setRoles(defaultRoles);
    }
  }, [user]);

  const results = useQueries({
    queries: [
      { queryKey: ['shiftTypes'], queryFn: () => axios.get(`${API}/shift-types`).then(res => res.data), enabled: !!user },
      { queryKey: ['attendance'], queryFn: () => axios.get(`${API}/attendance`).then(res => res.data), enabled: !!user },
      { queryKey: ['leaveRecords'], queryFn: () => axios.get(`${API}/leave-records`).then(res => res.data), enabled: !!user },
      { queryKey: ['shiftCalendar'], queryFn: () => axios.get(`${API}/shift-calendar`).then(res => res.data), enabled: !!user },
      { queryKey: ['tasks'], queryFn: () => axios.get(`${API}/tasks`).then(res => res.data), enabled: !!user },
    ],
  });

  useEffect(() => {
    if (results[0].data) setShiftTypes(results[0].data);
    if (results[1].data) setAttendance(results[1].data);
    if (results[2].data) setLeaveRecords(results[2].data);
    if (results[3].data) setShiftCalendar(results[3].data);
    if (results[4].data) setTasks(results[4].data);
  }, [results]);
  
  const addStokKategori = async () => {
    try {
      await axios.post(`${API}/stok-kategori`, newStokKategori);
      setNewStokKategori({ ad: '', renk: '#6B7280' });
      alert('✅ Kategori eklendi!');
      fetchStokData();
    } catch (error) {
      alert('❌ ' + (error.response?.data?.detail || error.message));
    }
  };

  const deleteStokKategori = async (kategoriId) => {
    if (!window.confirm('Bu kategoriyi silmek istediğinizden emin misiniz?')) return;
    try {
      await axios.delete(`${API}/stok-kategori/${kategoriId}`);
      alert('✅ Kategori silindi!');
      fetchStokData();
    } catch (error) {
      alert('❌ ' + (error.response?.data?.detail || error.message));
    }
  };

  const startEditStokKategori = (kategori) => {
    setEditingStokKategori({ ...kategori });
  };

  const updateStokKategori = async () => {
    if (!editingStokKategori.ad) {
      alert('❌ Kategori adı giriniz!');
      return;
    }
    try {
      await axios.put(`${API}/stok-kategori/${editingStokKategori.id}`, {
        ad: editingStokKategori.ad,
        renk: editingStokKategori.renk
      });
      setEditingStokKategori(null);
      alert('✅ Kategori güncellendi!');
      fetchStokData();
    } catch (error) {
      alert('❌ ' + (error.response?.data?.detail || error.message));
    }
  };

  const addStokUrun = async () => {
    if (!newStokUrun.ad || !newStokUrun.birim_id || !newStokUrun.kategori_id) {
      alert('❌ Tüm alanları doldurunuz!');
      return;
    }
    try {
      await axios.post(`${API}/stok-urun`, {
        ad: newStokUrun.ad,
        birim_id: parseInt(newStokUrun.birim_id),
        kategori_id: parseInt(newStokUrun.kategori_id),
        min_stok: parseFloat(newStokUrun.min_stok) || 0
      });
      setNewStokUrun({ ad: '', birim_id: '', kategori_id: '', min_stok: 0 });
      alert('✅ Ürün eklendi!');
      fetchStokData();
    } catch (error) {
      alert('❌ ' + (error.response?.data?.detail || error.message));
    }
  };

  const saveStokSayim = async () => {
    const today = new Date().toISOString().split('T')[0];
    const sayimlar = Object.entries(stokSayimData).filter(([_, miktar]) => miktar !== '');
    
    if (sayimlar.length === 0) {
      alert('❌ En az bir ürün için miktar giriniz!');
      return;
    }

    try {
      await Promise.all(
        sayimlar.map(([urun_id, miktar]) =>
          axios.post(`${API}/stok-sayim?sayim_yapan_id=${employee.id}`, {
            urun_id: parseInt(urun_id),
            miktar: parseFloat(miktar),
            tarih: today,
            notlar: 'Sayım'
          })
        )
      );
      setStokSayimData({});
      setShowStokSayimModal(false);
      alert(`✅ ${sayimlar.length} ürün için sayım kaydedildi!`);
      fetchStokData();
    } catch (error) {
      alert('❌ ' + (error.response?.data?.detail || error.message));
    }
  };

  const deleteStokBirim = async (birimId) => {
    if (!window.confirm('Bu birimi silmek istediğinizden emin misiniz?')) return;
    try {
      await axios.delete(`${API}/stok-birim/${birimId}`);
      alert('✅ Birim silindi!');
      fetchStokData();
    } catch (error) {
      alert('❌ ' + (error.response?.data?.detail || error.message));
    }
  };

  const deleteStokUrun = async (urunId) => {
    if (!window.confirm('Bu ürünü silmek istediğinizden emin misiniz?')) return;
    try {
      await axios.delete(`${API}/stok-urun/${urunId}`);
      alert('✅ Ürün silindi!');
      fetchStokData();
    } catch (error) {
      alert('❌ ' + (error.response?.data?.detail || error.message));
    }
  };

  const startEditStokUrun = (urun) => {
    setEditingStokUrun({ ...urun });
  };

  const updateStokUrun = async () => {
    if (!editingStokUrun.ad || !editingStokUrun.birim_id || !editingStokUrun.kategori_id) {
      alert('❌ Tüm alanları doldurunuz!');
      return;
    }
    try {
      await axios.put(`${API}/stok-urun/${editingStokUrun.id}`, {
        ad: editingStokUrun.ad,
        birim_id: parseInt(editingStokUrun.birim_id),
        kategori_id: parseInt(editingStokUrun.kategori_id),
        min_stok: parseFloat(editingStokUrun.min_stok) || 0
      });
      setEditingStokUrun(null);
      alert('✅ Ürün güncellendi!');
      fetchStokData();
    } catch (error) {
      alert('❌ ' + (error.response?.data?.detail || error.message));
    }
  };

  useEffect(() => {
    if (user && activeTab === 'maas') {
      fetchSalaryData();
    }
  }, [salaryMonth, activeTab, user]);

  // permissions are provided by usePermissions hook (merges role + external HR adapter)
  

 
 const handleLogin = async () => {
  setIsLoggingIn(true);
  setLoginMessage('Giriş yapılıyor...');
  try {
    console.time('login_total');
    console.log('Login API URL:', `${API}/login`);
    console.log('REACT_APP_BACKEND_URL:', process.env.REACT_APP_BACKEND_URL);
    // Backend /api/login returns the user object directly on success (LoginResponse)
    const response = await axios.post(`${API}/login`, { email: loginData.email, password: loginData.password});
    const userData = response.data;
    // If backend wrapped response differently, try common shapes
    const employeeObj = userData.employee || userData.data || userData;

    // Fetch external HR permissions synchronously as part of login so sidebar/permissions are available immediately
    let externalPerms = {};
    try {
      console.time('hrAdapter_fetch');
      const { getPermissionsForStaff } = await import('./lib/hrAdapter');
      externalPerms = await getPermissionsForStaff(employeeObj.id);
      console.timeEnd('hrAdapter_fetch');
    } catch (e) {
      // adapter may not exist or endpoint not available; ignore gracefully
      console.warn('hrAdapter fetch skipped or failed (expected during backend setup)', e?.response?.status || e?.message || e);
      console.timeEnd('hrAdapter_fetch');
    }

    if (externalPerms && Object.keys(externalPerms).length > 0) {
      setExternalPermissions(externalPerms);
    }

    // set user/employee/company quickly so UI can render
    setUser({ id: employeeObj.id, email: employeeObj.email || loginData.email });
    setEmployee(employeeObj);
    setCompanyId(employeeObj.company_id || employeeObj.companyId || 1);
    setLoginData({ email: '', password: ''});
    setLoginMessage('');
    setIsLoggingIn(false);
    if (employeeObj.rol === 'kiosk') {
      setActiveTab('kiosk');
    }

    // Start heavier data loads in background so login UI is not blocked
    // Prefetch non-critical collections into React Query cache so login isn't blocked.
    // We run in background (do not await from the main login flow), and populate
    // local state from the cache so the UI can show data immediately when ready.
    (async () => {
      try {
        // Temporarily disabled prefetch to avoid 404s during backend setup
        console.log('Prefetch disabled - backend setup in progress');
        /*await Promise.allSettled([
          queryClient.prefetchQuery({ queryKey: ['shiftTypes'], queryFn: fetchShiftTypes }),
          queryClient.prefetchQuery({ queryKey: ['attendance'], queryFn: fetchAttendance }),
          queryClient.prefetchQuery({ queryKey: ['leaveRecords'], queryFn: fetchLeaveRecords }),
          queryClient.prefetchQuery({ queryKey: ['shiftCalendar'], queryFn: fetchShiftCalendar }),
          queryClient.prefetchQuery({ queryKey: ['tasks'], queryFn: fetchTasks }),
        ]);*/

        // Populate local state from cache (if prefetch succeeded)
        const _shiftTypes = queryClient.getQueryData(['shiftTypes']);
        if (_shiftTypes) setShiftTypes(_shiftTypes);
        const _attendance = queryClient.getQueryData(['attendance']);
        if (_attendance) setAttendance(_attendance);
        const _leaveRecords = queryClient.getQueryData(['leaveRecords']);
        if (_leaveRecords) setLeaveRecords(_leaveRecords);
        const _shiftCalendar = queryClient.getQueryData(['shiftCalendar']);
        if (_shiftCalendar) setShiftCalendar(_shiftCalendar);
        const _tasks = queryClient.getQueryData(['tasks']);
        if (_tasks) setTasks(_tasks);
      } catch (err) {
        console.warn('Background prefetch failed, using demo data', err?.message || err);
        // DEMO: Using demo data instead of API calls
      }
    })();

    if (activeTab === 'stok' && STOCK_ENABLED) {
      (async () => {
        try {
          await fetchStokData();
        } catch (err) {
          console.warn('Background fetchStokData failed', err?.message || err);
        }
      })();
    }

    console.timeEnd('login_total');
  } catch (error) {
    // Normalize error message
    let msg = error.response?.data?.message || error.response?.data?.detail || error.message || 'Bilinmeyen hata';
    if (typeof msg !== 'string') msg = JSON.stringify(msg);
    setLoginMessage(`Giriş yapılamadı: ${msg}`);
    setIsLoggingIn(false);
    console.timeEnd('login_total');
  }
 };


  const handleRegister = async () => {
    if (!registerData.ad || !registerData.soyad || !registerData.email || !registerData.employee_id) {
      setRegisterMessage('❌ Tüm alanları doldurunuz!');
      return;
    }
    if (registerData.employee_id.length !== 4) {
      setRegisterMessage('❌ Personel ID tam 4 haneli olmalıdır!');
      return;
    }
    setIsRegistering(true);
    setRegisterMessage('Kayıt yapılıyor...');
    try {
      const response = await axios.post(`${API}/register`, registerData);
      if (response.data.success) {
        setRegisterMessage('✅ Kayıt başarılı! Giriş yapabilirsiniz.');
        setShowRegister(false);
        setRegisterData({ ad: '', soyad: '', email: '', employee_id: '' });
        setLoginData({ email: response.data.employee.email });
      }
    } catch (error) {
      // Normalize network vs server errors so the user sees a clearer message
      const msg = error?.response
        ? (error.response.data?.detail || error.response.statusText || `Sunucu hata ${error.response.status}`)
        : (error?.message || 'Ağ/CORS hatası - sunucuya ulaşılamıyor');
      console.error('Register error:', error);
      setRegisterMessage(`❌ ${msg}`);
    } finally {
      setIsRegistering(false);
      // clear the register message after a short timeout so it doesn't persist forever
      setTimeout(() => setRegisterMessage(''), 4000);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setEmployee(null);
    setCompanyId(null);
    setActiveTab('dashboard');
  };

  const kioskGiris = async () => {
    if (!companyId) {
      setKioskMessage('❌ Sistem hatası: Company ID bulunamadı');
      setTimeout(() => setKioskMessage(''), 3000);
      return;
    }
    try {
      const response = await axios.post(`${API}/attendance/check-in`, { 
        company_id: companyId, 
        employee_id: kioskEmployeeId 
      });
      const employeeName = typeof response.data.employee === 'string' ? response.data.employee : 'Personel';
      setKioskMessage(`🤮 Giriş Başarılı!\n${employeeName}\nID: ${kioskEmployeeId}`);
      setTimeout(() => { 
        setKioskMessage(''); 
        setKioskEmployeeId(''); 
      }, 2500);
    } catch (error) {
      setKioskMessage(`❌ ${error.response?.data?.detail || 'Hata oluştu'}`);
      setTimeout(() => { 
        setKioskMessage(''); 
        setKioskEmployeeId(''); 
      }, 3000);
    }
  };

  const kioskCikis = async () => {
    if (!companyId) {
      setKioskMessage('❌ Sistem hatası: Company ID bulunamadı');
      setTimeout(() => setKioskMessage(''), 3000);
      return;
    }
    try {
      const response = await axios.post(`${API}/attendance/check-out`, { 
        company_id: companyId, 
        employee_id: kioskEmployeeId 
      });
      const employeeName = typeof response.data.employee === 'string' ? response.data.employee : 'Personel';
      const hours = response.data.calisilan_saat || '0';
      setKioskMessage(`✅ Çıkış Başarılı!\n${employeeName}\nÇalışılan: ${hours}h`);
      setTimeout(() => { 
        setKioskMessage(''); 
        setKioskEmployeeId(''); 
      }, 2500);
    } catch (error) {
      setKioskMessage(`❌ ${error.response?.data?.detail || 'Hata oluştu'}`);
      setTimeout(() => { 
        setKioskMessage(''); 
        setKioskEmployeeId(''); 
      }, 3000);
    }
  };

  const addNumpadDigit = (digit) => {
    setKioskEmployeeId(prev => (prev + digit).slice(0, 4));
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
      // DEMO: Data refresh disabled
    } catch (error) {
      alert('❌ Hata: ' + (error.response?.data?.detail || error.message));
    }
  };

  const deleteLeave = async (id) => {
    try {
      await axios.delete(`${API}/leave-records/${id}`);
      // DEMO: Data refresh disabled
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
    if (newEmployee.employee_id.length !== 4) {
      alert('❌ Personel ID tam 4 haneli olmalıdır!');
      return;
    }
    if (!/^\d{4}$/.test(newEmployee.employee_id)) {
      alert('❌ Personel ID sadece rakam olmalıdır!');
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
    if (editData.employee_id.length !== 4) {
      alert('❌ Personel ID tam 4 haneli olmalıdır!');
      return;
    }
    if (!/^\d{4}$/.test(editData.employee_id)) {
      alert('❌ Personel ID sadece rakam olmalıdır!');
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
        atanan_personel_ids: newTask.atanan_personel_ids,
        tekrarlayan: newTask.tekrarlayan,
        tekrar_periyot: newTask.tekrarlayan ? "özel" : null,
        tekrar_sayi: newTask.tekrarlayan ? newTask.tekrar_sayi : null,
        tekrar_birim: newTask.tekrarlayan ? newTask.tekrar_birim : null
      });
      setNewTask({ baslik: '', aciklama: '', atanan_personel_ids: [], tekrarlayan: false, tekrar_sayi: 1, tekrar_birim: 'gun' });
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
      const response = await axios.get(`${API}/salary-all/${salaryMonth}`);
      setSalaryData(response.data);
      setSalaryError(null);
      
      // Also fetch avans data
      const avansRes = await axios.get(`${API}/avans`);
      setAvansData(avansRes.data);
      
      // Fetch yemek ücretleri
      const yemekRes = await axios.get(`${API}/yemek-ucreti`);
      setYemekUcretleri(yemekRes.data);
    } catch (error) {
      const msg = error?.response
        ? (error.response.data?.detail || error.response.statusText || `Sunucu hata ${error.response.status}`)
        : (error?.message || 'Ağ/CORS hatası - sunucuya ulaşılamıyor');
      console.error('Salary fetch error:', error);
      // Don't use alert (can spam). Show inline error in UI instead.
      setSalaryError(msg);
    }
  };

  const handleDragStart = (emp) => {
    setDraggedEmployee(emp);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = async (date) => {
    if (!draggedEmployee) return;
    await addShiftToCalendar(draggedEmployee.id, date);
    setDraggedEmployee(null);
  };

  const fetchWeeklySchedule = async (employeeId, startDate) => {
    try {
      const response = await axios.get(`${API}/shift-calendar/weekly/${employeeId}?start_date=${startDate}`);
      setWeeklyScheduleData(response.data);
      setShowWeeklySchedule(true);
    } catch (error) {
      alert('❌ Haftalık program getirilemedi: ' + (error.response?.data?.detail || error.message));
    }
  };

  const generatePDF = async () => {
    if (!weeklyScheduleData) return;
    
    const jsPDF = (await import('jspdf')).jsPDF;
    const doc = new jsPDF();
    
    const employee = weeklyScheduleData.employee;
    let yPos = 20;
    
    // Header
    doc.setFontSize(18);
    doc.text(`Haftalık Vardiya Programı`, 105, yPos, { align: 'center' });
    yPos += 10;
    
    doc.setFontSize(14);
    doc.text(`${employee.ad} ${employee.soyad} - ${employee.pozisyon}`, 105, yPos, { align: 'center' });
    yPos += 5;
    
    doc.setFontSize(10);
    doc.text(`Personel ID: ${employee.employee_id}`, 105, yPos, { align: 'center' });
    yPos += 10;
    
    // Draw line
    doc.setLineWidth(0.5);
    doc.line(20, yPos, 190, yPos);
    yPos += 10;
    
    // Shifts
    const dayNames = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
    
    weeklyScheduleData.shifts.forEach((shift, idx) => {
      const date = new Date(shift.tarih);
      const dayName = dayNames[date.getDay()];
      const dateStr = `${date.getDate()}.${date.getMonth() + 1}.${date.getFullYear()}`;
      
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text(`${dayName}, ${dateStr}`, 20, yPos);
      yPos += 6;
      
      doc.setFont(undefined, 'normal');
      doc.setFontSize(10);
      
      if (shift.type === 'izin') {
        doc.setTextColor(255, 0, 0);
        doc.text('🏖️ İZİNLİ', 20, yPos);
        doc.setTextColor(0, 0, 0);
        yPos += 5;
      } else if (shift.type === 'vardiya') {
        doc.setTextColor(0, 128, 0);
        doc.text(`⏰ ${shift.shift_type.name}`, 20, yPos);
        doc.setTextColor(0, 0, 0);
        yPos += 5;
        
        if (shift.team_members.length > 0) {
          doc.setFontSize(9);
          doc.text('Ekip Arkadaşları:', 25, yPos);
          yPos += 4;
          shift.team_members.forEach(member => {
            doc.text(`• ${member.ad} ${member.soyad} (${member.pozisyon})`, 30, yPos);
            yPos += 4;
          });
        }
      } else {
        doc.setTextColor(128, 128, 128);
        doc.text('Vardiya atanmamış', 20, yPos);
        doc.setTextColor(0, 0, 0);
        yPos += 5;
      }
      
      yPos += 5;
      
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }
    });
    
    // Footer
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(`Oluşturulma: ${new Date().toLocaleString('tr-TR')}`, 105, 285, { align: 'center' });
    
    doc.save(`vardiya_${employee.ad}_${employee.soyad}_${weeklyScheduleData.start_date}.pdf`);
  };

  // Generate weekly PDF for a given employee and week start date (YYYY-MM-DD)
  const generateWeeklyPDFFor = async (employeeId, startDate) => {
    try {
      const resp = await axios.get(`${API}/shift-calendar/weekly/${employeeId}?start_date=${startDate}`);
      const weeklyData = resp.data;
      if (!weeklyData) return alert('Haftalık veri bulunamadı');

      // Build dates array
      const sd = weeklyData.start_date ? new Date(weeklyData.start_date) : new Date(startDate);
      const ed = weeklyData.end_date ? new Date(weeklyData.end_date) : new Date(sd.getTime() + 6 * 86400000);
      const dates = [];
      for (let d = new Date(sd); d <= ed; d.setDate(d.getDate() + 1)) {
        dates.push(new Date(d));
      }

      // Build simple table HTML (days as columns, single employee row)
      const employee = weeklyData.employee || { ad: 'Bilinmiyor', soyad: '', pozisyon: '' };
      const shiftsByDate = {};
      (weeklyData.shifts || []).forEach(s => { shiftsByDate[s.tarih] = s; });

      const container = document.createElement('div');
      container.style.padding = '14px';
      container.style.fontFamily = `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial`;
      container.style.color = '#1c1c1e';
      container.innerHTML = `
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px;">
          <div style="width:48px;height:48px;flex:0 0 48px;border-radius:10px;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#06b6d4,#7c3aed);box-shadow:0 4px 14px rgba(0,0,0,0.06)">
            <!-- simple SVG mark -->
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect rx="5" width="24" height="24" fill="white"/>
              <path d="M7 12.5C7 9.5 9.5 7 12.5 7C13.25 7 14 7.1 14.7 7.3C13.8 8.8 12 9.6 10.6 9.6C10.6 11.4 12 12.5 13.6 12.5H7Z" fill="#7c3aed"/>
            </svg>
          </div>
          <div style="flex:1">
            <div style="font-size:16px;font-weight:600">Haftalık Vardiya Programı</div>
            <div style="font-size:13px;color:#6b7280;margin-top:2px">${employee.ad} ${employee.soyad} — ${employee.pozisyon} · ${sd.toLocaleDateString('tr-TR')} - ${ed.toLocaleDateString('tr-TR')}</div>
          </div>
        </div>
      `;

  const table = document.createElement('table');
  table.style.width = '100%';
  table.style.borderCollapse = 'collapse';
  table.style.fontSize = '11px';
  table.style.borderRadius = '8px';
  table.style.overflow = 'hidden';

      const thead = document.createElement('thead');
      table.appendChild(tbody);
      container.appendChild(table);

    document.body.appendChild(container);

    const jsPDF = (await import('jspdf')).jsPDF;
    const html2canvas = (await import('html2canvas')).default;
    const doc = new jsPDF('p','pt','a4');
    const ww = container.scrollWidth || 1200;
    const fileName = 'vardiya_hafta_' + employee.ad + '_' + sd.toISOString().slice(0,10) + '.pdf';
    await doc.html(container, { 
      callback: function() { 
        doc.save(fileName); 
        container.remove(); 
      }, 
      x: 20, 
      y: 20, 
      windowWidth: ww, 
      html2canvas: { 
        scale: 2, 
        background: '#ffffff', 
        useCORS: true 
      } 
    });
  } catch (err) {
    console.error('Weekly PDF error', err);
    alert('Haftalık PDF oluşturulamadı: ' + (err.response?.data || err.message));
  }
  };

  // Generate monthly PDF for selected month (selectedShiftMonth is YYYY-MM)
  const generateMonthlyPDF = async () => {
    try {
      const [year, month] = selectedShiftMonth.split('-').map(Number);
      const monthStr = String(month).padStart(2, '0');
      const monthFilter = `${year}-${monthStr}`;
      const shifts = shiftCalendar.filter(s => s.tarih && s.tarih.startsWith(monthFilter));

      // Build list of dates in month
      const daysInMonth = new Date(year, month, 0).getDate();
      const dates = [];
      for (let d = 1; d <= daysInMonth; d++) {
        const dateObj = new Date(year, month - 1, d);
        dates.push(dateObj);
      }

      // Determine employees involved (or all employees if none)
      const empMap = {};
      shifts.forEach(s => { empMap[s.employee_id] = true; });
      const involvedEmployees = Object.keys(empMap).length > 0 ? employees.filter(e => empMap[e.id]) : employees;

      // Build shift lookup
      const cellMap = {};
      shifts.forEach(s => { cellMap[`${s.employee_id}_${s.tarih}`] = s; });

      // Build HTML table with days as columns and employees as rows
      const container = document.createElement('div');
      container.style.padding = '10px';
      container.style.fontFamily = `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial`;
      container.style.color = '#1c1c1e';

      const title = document.createElement('div');
      title.style.display = 'flex'; title.style.alignItems = 'center'; title.style.gap = '12px';
      title.innerHTML = `
        <div style="width:48px;height:48px;border-radius:10px;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#06b6d4,#7c3aed);box-shadow:0 4px 14px rgba(0,0,0,0.06)">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect rx="5" width="24" height="24" fill="white"/>
            <path d="M7 12.5C7 9.5 9.5 7 12.5 7C13.25 7 14 7.1 14.7 7.3C13.8 8.8 12 9.6 10.6 9.6C10.6 11.4 12 12.5 13.6 12.5H7Z" fill="#7c3aed"/>
          </svg>
        </div>
        <div>
          <div style="font-size:16px;font-weight:600">Aylık Vardiya Programı — ${selectedShiftMonth}</div>
          <div style="font-size:12px;color:#6b7280;margin-top:2px">Oluşturulma: ${new Date().toLocaleString('tr-TR')}</div>
        </div>
      `;
      container.appendChild(title);

      const table = document.createElement('table');
  table.style.width = '100%';
  table.style.borderCollapse = 'collapse';
  table.style.fontSize = '10px';
  table.style.borderRadius = '8px';
  table.style.overflow = 'hidden';

      // Header
      const thead = document.createElement('thead');
      const headerRow = document.createElement('tr');
  const thFirst = document.createElement('th');
  thFirst.style.border = '1px solid #f0f0f0'; thFirst.style.padding = '6px'; thFirst.style.background = '#fbfbfc'; thFirst.style.fontWeight = '600'; thFirst.style.color = '#111'; thFirst.textContent = 'Personel';
      headerRow.appendChild(thFirst);
      dates.forEach(d => {
        const th = document.createElement('th');
        th.style.border = '1px solid #f0f0f0'; th.style.padding = '4px 6px'; th.style.background = '#fbfbfc'; th.style.textAlign = 'center'; th.style.fontWeight = '600'; th.style.fontSize = '11px';
        th.innerHTML = `${d.getDate()}<div style="font-size:10px;color:#6b7280;margin-top:3px">${['Paz','Pzt','Sal','Çar','Per','Cum','Cmt'][d.getDay()]}</div>`;
        headerRow.appendChild(th);
      });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    involvedEmployees.forEach(emp => {
      const tr = document.createElement('tr');
      const tdName = document.createElement('td');
      tdName.style.border = '1px solid #ddd'; tdName.style.padding = '6px'; tdName.textContent = `${emp.ad} ${emp.soyad}`;
      tr.appendChild(tdName);
      dates.forEach(d => {
        const key = `${emp.id}_${d.toISOString().slice(0,10)}`;
        const td = document.createElement('td');
        td.style.border = '1px solid #ddd'; td.style.padding = '4px'; td.style.textAlign = 'center'; td.style.fontSize = '9px';
        const s = cellMap[`${emp.id}_${d.toISOString().slice(0,10)}`] || cellMap[`${emp.employee_id}_${d.toISOString().slice(0,10)}`];
        if (!s) { 
          td.textContent = '-'; 
        } else if (s.type === 'izin') { 
          td.innerHTML = '<span style="color:#c0392b;font-weight:600">İZİN</span>'; 
        } else { 
          const shiftType = shiftTypes.find(st => st.id === s.shift_type);
          if (shiftType) {
            td.innerHTML = `<span style="color:${shiftType.color}">${shiftType.name}</span>`;
          } else {
            td.textContent = 'Vardiya';
          }
        }
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    container.appendChild(table);
    document.body.appendChild(container);

    const { jsPDF } = await import('jspdf');
    const html2canvas = (await import('html2canvas')).default;
    const doc = new jsPDF('l','pt','a4');
    const ww = container.scrollWidth || 1600;
    await doc.html(container, { 
      callback: () => { 
        doc.save(`vardiya_aylik_${selectedShiftMonth}.pdf`); 
        container.remove(); 
      }, 
      x: 20, 
      y: 20, 
      windowWidth: ww, 
      html2canvas: { 
        scale: 2, 
        background: '#ffffff', 
        useCORS: true 
      } 
    });
  } catch (err) {
    console.error('Monthly PDF error', err);
    alert('Aylık PDF oluşturulamadı: ' + (err.response?.data || err.message));
  }
  };

  const addAvans = async () => {
    if (!newAvans.employee_id || !newAvans.miktar || !newAvans.tarih) {
      alert('❌ Tüm alanları doldurunuz!');
      return;
    }
    try {
      await axios.post(`${API}/avans?olusturan_id=${employee.id}`, {
        employee_id: parseInt(newAvans.employee_id),
        miktar: parseFloat(newAvans.miktar),
        tarih: newAvans.tarih,
        aciklama: newAvans.aciklama
      });
      setNewAvans({ employee_id: '', miktar: '', tarih: '', aciklama: '' });
      setShowAvansModal(false);
      alert('✅ Avans kaydı başarıyla eklendi!');
      fetchSalaryData();
    } catch (error) {
      alert('❌ Hata: ' + (error.response?.data?.detail || error.message));
    }
  };

  const deleteAvans = async (avansId) => {
    if (window.confirm('Bu avans kaydını silmek istediğinizden emin misiniz?')) {
      try {
        await axios.delete(`${API}/avans/${avansId}`);
        fetchSalaryData();
      } catch (error) {
        alert('❌ Silme hatası: ' + (error.response?.data?.detail || error.message));
      }
    }
  };

  const updateYemekUcreti = async () => {
    if (!yemekUpdate.employee_id || !yemekUpdate.gunluk_ucret) {
      alert('❌ Tüm alanları doldurunuz!');
      return;
    }
    try {
      await axios.post(`${API}/yemek-ucreti?employee_id=${yemekUpdate.employee_id}&gunluk_ucret=${yemekUpdate.gunluk_ucret}`);
      setYemekUpdate({ employee_id: '', gunluk_ucret: '' });
      setShowYemekModal(false);
      alert('✅ Yemek ücreti güncellendi!');
      fetchSalaryData();
    } catch (error) {
      alert('❌ Hata: ' + (error.response?.data?.detail || error.message));
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
      const leavesOnDate = leaveRecords.filter(l => l.tarih === date);
      
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
            {leavesOnDate.map(leave => {
              const emp = employees.find(e => e.id === leave.employee_id);
              return (
                <div key={`leave-${leave.id}`} className="text-xs p-1 rounded bg-red-500 text-white flex justify-between items-center">
                  <span className="truncate">🏖️ {emp?.ad}</span>
                  <button onClick={() => deleteLeave(leave.id)} className="text-white hover:text-red-200">
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
      <div className="min-h-screen flex items-center justify-center p-4" style={{background: '#F8FAFF'}}>
        <div className="bg-white rounded-lg shadow-2xl p-8 w-full max-w-md">
          <h1 className="text-3xl font-bold mb-6 text-center" style={{color: '#101318'}}>Mevcut</h1>
          
          {!showRegister ? (
            <>
              <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleLogin(); }}>
                <input name="email" type="email" placeholder="E-mail" value={loginData.email} onChange={(e) => setLoginData({ ...loginData, email: e.target.value })} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2" style={{borderColor: '#2042FF'}} />
                <input name="password" type="password" placeholder="password" value={loginData.password} onChange={(e) => setLoginData({ ...loginData, password: e.target.value })} className="w-full px-6 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2" style={{borderColor: '#2042FF'}} />
                <button type="submit" disabled={isLoggingIn} className="w-full px-6 py-3 text-white rounded-lg font-semibold transition-colors" style={{backgroundColor: isLoggingIn ? '#9FB7FF' : '#2042FF'}} onMouseEnter={(e) => e.target.style.backgroundColor = isLoggingIn ? '#9FB7FF' : '#1632CC'} onMouseLeave={(e) => e.target.style.backgroundColor = isLoggingIn ? '#9FB7FF' : '#2042FF'}>{isLoggingIn ? 'Giriş yapılıyor...' : 'Giriş Yap'}</button>
                <button type="button" onClick={() => setShowRegister(true)} disabled={isLoggingIn} className="w-full px-8 py-3 rounded-lg font-semibold transition-colors" style={{backgroundColor: isLoggingIn ? '#E6F6D6' : '#A6FF3D', color: '#101318'}} onMouseEnter={(e) => e.target.style.backgroundColor = isLoggingIn ? '#E6F6D6' : '#95E635'} onMouseLeave={(e) => e.target.style.backgroundColor = isLoggingIn ? '#E6F6D6' : '#A6FF3D'}>Kayıt Ol</button>
                {loginMessage && (
                  <div className="mt-3 text-sm text-center text-gray-700">{loginMessage}</div>
                )}
              </form>
            </>
          ) : (
            <>
              <h2 className="text-xl font-semibold text-gray-700 mb-4 text-center">Yeni Kayıt</h2>
              <div className="space-y-4">
                <input type="text" placeholder="Ad *" value={registerData.ad} onChange={(e) => setRegisterData({ ...registerData, ad: e.target.value })} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
                <input type="text" placeholder="Soyad *" value={registerData.soyad} onChange={(e) => setRegisterData({ ...registerData, soyad: e.target.value })} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
                <input type="email" placeholder="E-mail *" value={registerData.email} onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
                <input type="password" placeholder="Password *" value={registerData.password} onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
                <input type="text" placeholder="Personel ID (4 haneli) *" maxLength="4" value={registerData.employee_id} onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '');
                  setRegisterData({ ...registerData, employee_id: value });
                }} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
                <p className="text-xs text-gray-500">* Pozisyon ve maaş bilgisi admin tarafından atanacaktır</p>
                <button 
                  onClick={handleRegister} 
                  disabled={isRegistering} 
                  className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold disabled:bg-gray-400"
                >
                  {isRegistering ? 'Kayıt yapılıyor...' : 'Kayıt Ol'}
                </button>
                <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
                  💡 Demo: Mevcut kullanıcılarla giriş yapabilirsiniz:<br/>
                  • demo@test.com / demo123<br/>
                  • employee3010@company.com / 3010
                </div>
                <button onClick={() => setShowRegister(false)} disabled={isRegistering} className="w-full px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 font-semibold">Geri Dön</button>
                {registerMessage && (
                  <div className="mt-3 text-sm text-center text-gray-700">{registerMessage}</div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  // If kiosk user logged in, show only kiosk screen
  if (user && employee?.rol === 'kiosk') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow p-8 max-w-md w-full">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-4xl font-bold text-center flex-1">🬠KIOSK</h1>
            <button onClick={() => { setUser(null); setEmployee(null); setCompanyId(null); }} className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 font-semibold text-sm">
              <LogOut className="w-4 h-4 inline mr-1" /> Çıkış
            </button>
          </div>
          {kioskMessage ? (
            <div className={`mb-8 p-6 rounded-xl text-lg font-bold whitespace-pre-line text-center ${kioskMessage.includes('✅') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{kioskMessage}</div>
          ) : (
            <>
              <div className="mb-6">
                <input type="text" placeholder="4 Haneli ID" value={kioskEmployeeId} readOnly className="w-full px-4 py-3 text-3xl text-center border-2 border-indigo-300 rounded-lg bg-white font-bold" />
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
    );
  }

  // Default roles when API data is not available
  const defaultRoles = [
    {
      id: 'admin',
      name: 'Administrator',
      permissions: {
        dashboard: true, view_dashboard: true, employees: true, view_employees: true,
        manage_employees: true, add_employee: true, edit_employee: true, delete_employee: true,
        reports: true, view_reports: true, view_salary: true, view_tasks: true,
        manage_tasks: true, assign_tasks: true, manage_shifts: true, manage_shifts_types: true,
        manage_leave: true, view_attendance: true, manage_roles: true, manage_permissions: true,
        can_view_stock: true, can_edit_stock: true, can_add_stock: true, can_delete_stock: true,
        POS_VIEW: true, POS_EDIT: true, POS_ADMIN: true, admin_panel: true, system_settings: true
      }
    },
    {
      id: 'manager',
      name: 'Yönetici',
      permissions: {
        dashboard: true, view_dashboard: true, employees: true, view_employees: true,
        manage_employees: true, add_employee: true, edit_employee: true, reports: true,
        view_reports: true, view_salary: true, view_tasks: true, manage_tasks: true,
        assign_tasks: true, manage_shifts: true, manage_shifts_types: true, manage_leave: true,
        view_attendance: true, can_view_stock: true, can_edit_stock: true, POS_VIEW: true, POS_EDIT: true
      }
    },
    {
      id: 'chef',
      name: 'Şef',
      permissions: {
        dashboard: true, view_dashboard: true, view_employees: true, view_tasks: true,
        manage_tasks: true, assign_tasks: true, view_attendance: true, can_view_stock: true,
        can_edit_stock: true, can_add_stock: true, POS_VIEW: true
      }
    },
    {
      id: 'waiter',
      name: 'Garson',
      permissions: {
        dashboard: true, view_dashboard: true, view_tasks: true, view_attendance: true,
        can_view_stock: true, POS_VIEW: true, POS_EDIT: true
      }
    },
    { 
      id: 'employee', 
      name: 'Çalışan', 
      permissions: { dashboard: true, view_dashboard: true, view_tasks: true, timesheet: true, view_attendance: true } 
    },
    { id: 'kiosk', name: 'Kiosk', permissions: { kiosk: true } }
  ];
  const safeRoles = roles.length > 0 ? roles : defaultRoles;
  const safeEmployee = employee || { ad: 'Demo', soyad: 'User', rol: 'admin' };
  
  console.log('Dashboard render:', { user: !!user, employee: safeEmployee, roles: safeRoles.length, isAdmin: safeEmployee?.rol === 'admin' });

  let permissions = {};
  let permissionsLoading = false;
  let refreshPermissions = () => {};
  
  try {
    const result = usePermissions(safeEmployee, safeRoles);
    permissions = result[0] || {};
    refreshPermissions = result[1]?.refresh || (() => {});
    permissionsLoading = result[1]?.loading || false;
  } catch (error) {
    console.error('usePermissions error:', error);
    permissions = { dashboard: true, employees: true }; // Safe default
  }
  
  const currentRole = safeRoles.find(r => r.id === safeEmployee?.rol);

  // Error boundary for render
  try {
    return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="p-8 max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8 bg-white/60 backdrop-blur-sm rounded-xl shadow p-4 md:p-6">
          <div className="flex items-center gap-4">
            <img src="/logo.svg" alt="Mevcut" className="w-10 h-10 rounded-md shadow-sm" />
            <div>
              <h1 className="text-2xl md:text-3xl font-semibold text-gray-900">Mevcut Dashboard</h1>
              <p className="text-sm text-gray-500">👤 {safeEmployee.ad} {safeEmployee.soyad} · <span className="font-medium">{currentRole?.name}</span></p>
            </div>
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
            <button onClick={() => setActiveTab('personel')} className={`px-6 py-2 rounded-lg font-semibold transition ${activeTab === 'personel' ? 'bg-indigo-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}>👥 Personel</button>
          )}
          {/* Always show the Stok tab so users see the 'Yakında' placeholder when the module is disabled */}
          <button onClick={() => setActiveTab('stok')} className={`px-6 py-2 rounded-lg font-semibold transition ${activeTab === 'stok' ? 'bg-indigo-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}>📦 Stok</button>
          {/* POS tab */}
          <button onClick={() => setActiveTab('pos')} className={`px-6 py-2 rounded-lg font-semibold transition ${activeTab === 'pos' ? 'bg-indigo-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}>🧾 POS</button>
          {/* Subscription tab - visible to admins and managers; adjust as needed */}
          <button onClick={() => setActiveTab('abonelik')} className={`px-6 py-2 rounded-lg font-semibold transition ${activeTab === 'abonelik' ? 'bg-indigo-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}>💳 Abonelik</button>
        </div>

        {activeTab === 'dashboard' && permissions.view_dashboard && (
          <DashboardTab employees={employees} attendance={attendance} roles={roles} />
        )}

        {activeTab === 'abonelik' && (
          <div>
            <Subscription companyId={companyId || 1} />
          </div>
        )}

        {activeTab === 'pos' && (
          <div>
            <POS companyId={companyId || 1} />
          </div>
        )}

        {activeTab === 'kiosk' && (
          <div className="bg-white rounded-lg shadow p-8">
            <div className="max-w-md mx-auto">
              <div className="flex justify-between items-center mb-6">
                <h1 className="text-4xl font-bold text-center flex-1">🬠KIOSK</h1>
                {!user && (
                  <button onClick={() => setActiveTab('dashboard')} className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 font-semibold text-sm">← Geri</button>
                )}
              </div>
              {kioskMessage ? (
                <div className={`mb-8 p-6 rounded-xl text-lg font-bold whitespace-pre-line text-center ${kioskMessage.includes('✅') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{kioskMessage}</div>
              ) : (
                <>
                  <div className="mb-6">
                    <input type="text" placeholder="4 Haneli ID" value={kioskEmployeeId} readOnly className="w-full px-4 py-3 text-3xl text-center border-2 border-indigo-300 rounded-lg bg-white font-bold" />
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
                    
                    {/* Stok İzinleri */}
                    <div className="col-span-full mt-4 mb-2">
                      <h4 className="font-bold text-indigo-600">📦 Stok Modülü İzinleri</h4>
                    </div>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" checked={role.permissions.can_view_stock} onChange={(e) => updateRolePermission(role.id, 'can_view_stock', e.target.checked)} className="w-4 h-4" />
                      <span>Stok Görüntüleme</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" checked={role.permissions.can_add_stock_unit} onChange={(e) => updateRolePermission(role.id, 'can_add_stock_unit', e.target.checked)} className="w-4 h-4" />
                      <span>Birim Ekleyebilir</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" checked={role.permissions.can_delete_stock_unit} onChange={(e) => updateRolePermission(role.id, 'can_delete_stock_unit', e.target.checked)} className="w-4 h-4" />
                      <span>Birim Silebilir</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" checked={role.permissions.can_add_stock_product} onChange={(e) => updateRolePermission(role.id, 'can_add_stock_product', e.target.checked)} className="w-4 h-4" />
                      <span>Ürün Ekleyebilir</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" checked={role.permissions.can_edit_stock_product} onChange={(e) => updateRolePermission(role.id, 'can_edit_stock_product', e.target.checked)} className="w-4 h-4" />
                      <span>Ürün Düzenleyebilir</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" checked={role.permissions.can_delete_stock_product} onChange={(e) => updateRolePermission(role.id, 'can_delete_stock_product', e.target.checked)} className="w-4 h-4" />
                      <span>Ürün Silebilir</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" checked={role.permissions.can_perform_stock_count} onChange={(e) => updateRolePermission(role.id, 'can_perform_stock_count', e.target.checked)} className="w-4 h-4" />
                      <span>Sayım Yapabilir</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" checked={role.permissions.can_manage_categories} onChange={(e) => updateRolePermission(role.id, 'can_manage_categories', e.target.checked)} className="w-4 h-4" />
                      <span>Kategori Yönetebilir</span>
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'vardiya_izin' && (permissions.manage_shifts || permissions.manage_shifts_types || permissions.manage_leave) && (
          <ShiftsAndLeaveTab
            employees={employees}
            shiftTypes={shiftTypes}
            shiftCalendar={shiftCalendar}
            leaveRecords={leaveRecords}
            selectedShiftMonth={selectedShiftMonth}
            setSelectedShiftMonth={setSelectedShiftMonth}
            selectedShiftType={selectedShiftType}
            setSelectedShiftType={setSelectedShiftType}
            selectedEmployeesForShift={selectedEmployeesForShift}
            setSelectedEmployeesForShift={setSelectedEmployeesForShift}
            newLeave={newLeave}
            setNewLeave={setNewLeave}
            addLeave={addLeave}
            deleteLeave={deleteLeave}
            addShiftToCalendar={addShiftToCalendar}
            removeShiftFromCalendar={removeShiftFromCalendar}
            generateWeeklyPDFFor={generateWeeklyPDFFor}
            generateMonthlyPDF={generateMonthlyPDF}
            weeklyPdfEmployeeId={weeklyPdfEmployeeId}
            setWeeklyPdfEmployeeId={setWeeklyPdfEmployeeId}
            permissions={permissions}
          />
        )}

        {activeTab === 'gorevler' && permissions.view_tasks && (
          <TasksTab
            tasks={tasks}
            employees={employees}
            newTask={newTask}
            setNewTask={setNewTask}
            addTask={addTask}
            updateTask={updateTask}
            deleteTask={deleteTask}
            permissions={permissions}
            employee={employee}
          />
        )}

        {activeTab === 'maas' && permissions.view_salary && (
          <SalaryTab
            salaryData={salaryData}
            salaryError={salaryError}
            fetchSalaryData={fetchSalaryData}
            salaryMonth={salaryMonth}
            setSalaryMonth={setSalaryMonth}
            employees={employees}
            newAvans={newAvans}
            setNewAvans={setNewAvans}
            addAvans={addAvans}
            deleteAvans={deleteAvans}
            yemekUpdate={yemekUpdate}
            setYemekUpdate={setYemekUpdate}
            updateYemekUcreti={updateYemekUcreti}
            avansData={avansData}
            showAvansModal={showAvansModal}
            setShowAvansModal={setShowAvansModal}
            showYemekModal={showYemekModal}
            setShowYemekModal={setShowYemekModal}
            selectedEmployeeForDetail={selectedEmployeeForDetail}
            setSelectedEmployeeForDetail={setSelectedEmployeeForDetail}
            employee={employee}
          />
        )}

        {activeTab === 'personel' && employee?.rol === 'admin' && (
          <PersonnelTab
            employees={employees}
            roles={roles}
            newEmployee={newEmployee}
            setNewEmployee={setNewEmployee}
            addEmployee={addEmployee}
            editingEmployee={editingEmployee}
            setEditingEmployee={setEditingEmployee}
            editData={editData}
            setEditData={setEditData}
            saveEmployee={saveEmployee}
            deleteEmployee={deleteEmployee}
            startEditEmployee={startEditEmployee}
            attendance={attendance}
          />
        )}

        {activeTab === 'stok' && permissions.can_view_stock && STOCK_ENABLED && (
          <StockTab
            permissions={permissions}
            stokKategoriler={stokKategoriler}
            stokBirimler={stokBirimler}
            stokUrunler={stokUrunler}
            stokDurum={stokDurum}
            newStokKategori={newStokKategori}
            setNewStokKategori={setNewStokKategori}
            addStokKategori={addStokKategori}
            deleteStokKategori={deleteStokKategori}
            startEditStokKategori={startEditStokKategori}
            editingStokKategori={editingStokKategori}
            setEditingStokKategori={setEditingStokKategori}
            updateStokKategori={updateStokKategori}
            newStokBirim={newStokBirim}
            setNewStokBirim={setNewStokBirim}
            addStokBirim={addStokBirim}
            deleteStokBirim={deleteStokBirim}
            newStokUrun={newStokUrun}
            setNewStokUrun={setNewStokUrun}
            addStokUrun={addStokUrun}
            editingStokUrun={editingStokUrun}
            startEditStokUrun={startEditStokUrun}
            updateStokUrun={updateStokUrun}
            setEditingStokUrun={setEditingStokUrun}
            deleteStokUrun={deleteStokUrun}
            stokSayimData={stokSayimData}
            setStokSayimData={setStokSayimData}
            showStokSayimModal={showStokSayimModal}
            setShowStokSayimModal={setShowStokSayimModal}
            saveStokSayim={saveStokSayim}
            downloadStok={downloadStok}
            uploadStokFile={uploadStokFile}
            setStokImportFile={setStokImportFile}
            downloadStokTemplate={downloadStokTemplate}
          />
        )}
      </div>
    </div>
  );
  } catch (renderError) {
    console.error('Dashboard render error:', renderError);
    return (
      <div className="min-h-screen bg-red-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md">
          <h1 className="text-xl font-bold text-red-600 mb-4">Dashboard Error</h1>
          <p className="text-gray-700 mb-4">Dashboard yüklenirken hata oluştu:</p>
          <pre className="text-xs bg-gray-100 p-2 rounded">{renderError.message}</pre>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Yenile
          </button>
        </div>
      </div>
    );
  }
}
