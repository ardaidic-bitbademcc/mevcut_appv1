import React, { useState, useEffect } from 'react';
import { LogOut, Plus, Trash2, Edit2, Check, X } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
const API = `${BACKEND_URL}/api`;

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [employee, setEmployee] = useState(null);
  const [companyId, setCompanyId] = useState(null);
  const [loginData, setLoginData] = useState({ email: '' });
  const [showRegister, setShowRegister] = useState(false);
  const [registerData, setRegisterData] = useState({ ad: '', soyad: '', email: '', employee_id: '' });
  const [activeTab, setActiveTab] = useState('dashboard');

  const [employees, setEmployees] = useState([]);
  const [roles, setRoles] = useState([]);
  const [shiftTypes, setShiftTypes] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [leaveRecords, setLeaveRecords] = useState([]);
  const [shiftCalendar, setShiftCalendar] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [salaryData, setSalaryData] = useState([]);
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
  const [stokKategoriler, setStokKategoriler] = useState([]);
  const [stokBirimler, setStokBirimler] = useState([]);
  const [stokUrunler, setStokUrunler] = useState([]);
  const [stokDurum, setStokDurum] = useState([]);
  const [newStokKategori, setNewStokKategori] = useState({ ad: '', renk: '#6B7280' });
  const [newStokBirim, setNewStokBirim] = useState({ ad: '', kisaltma: '' });
  const [newStokUrun, setNewStokUrun] = useState({ ad: '', birim_id: '', kategori_id: '', min_stok: 0 });
  const [showStokSayimModal, setShowStokSayimModal] = useState(false);
  const [stokSayimData, setStokSayimData] = useState({});
  const [editingStokUrun, setEditingStokUrun] = useState(null);
  const [editingStokKategori, setEditingStokKategori] = useState(null);

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
      if (activeTab === 'stok') {
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

  const addStokBirim = async () => {
    if (!newStokBirim.ad || !newStokBirim.kisaltma) {
      alert('❌ Tüm alanları doldurunuz!');
      return;
    }
    try {
      await axios.post(`${API}/stok-birim`, newStokBirim);
      setNewStokBirim({ ad: '', kisaltma: '' });
      alert('✅ Birim eklendi!');
      fetchStokData();
    } catch (error) {
      alert('❌ ' + (error.response?.data?.detail || error.message));
    }
  };

  const addStokKategori = async () => {
    if (!newStokKategori.ad) {
      alert('❌ Kategori adı giriniz!');
      return;
    }
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

  const getPermissions = () => {
    if (!employee?.rol) return {};
    const userRole = roles.find(r => r.id === employee?.rol);
    return userRole?.permissions || {};
  };

  const handleLogin = async () => {
    try {
      const response = await axios.post(`${API}/login`, { email: loginData.email });
      if (response.data.success) {
        setUser({ id: response.data.employee.id, email: response.data.employee.email });
        setEmployee(response.data.employee);
        setCompanyId(response.data.employee.company_id);
        setLoginData({ email: '' });
        
        // If kiosk user, set activeTab to kiosk
        if (response.data.employee.rol === 'kiosk') {
          setActiveTab('kiosk');
        }
      } else {
        alert(response.data.message);
      }
    } catch (error) {
      alert('Giriş yapılamadı: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleRegister = async () => {
    if (!registerData.ad || !registerData.soyad || !registerData.email || !registerData.employee_id) {
      alert('❌ Tüm alanları doldurunuz!');
      return;
    }
    if (registerData.employee_id.length !== 4) {
      alert('❌ Personel ID tam 4 haneli olmalıdır!');
      return;
    }
    try {
      const response = await axios.post(`${API}/register`, registerData);
      if (response.data.success) {
        alert('✅ Kayıt başarılı! Giriş yapabilirsiniz.');
        setShowRegister(false);
        setRegisterData({ ad: '', soyad: '', email: '', employee_id: '' });
        setLoginData({ email: response.data.employee.email });
      }
    } catch (error) {
      alert('❌ ' + (error.response?.data?.detail || error.message));
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
      setKioskMessage(`✅ Giriş Başarılı!\n${employeeName}\nID: ${kioskEmployeeId}`);
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
      
      // Also fetch avans data
      const avansRes = await axios.get(`${API}/avans`);
      setAvansData(avansRes.data);
      
      // Fetch yemek ücretleri
      const yemekRes = await axios.get(`${API}/yemek-ucreti`);
      setYemekUcretleri(yemekRes.data);
    } catch (error) {
      alert('❌ Maaş verileri getirilemedi: ' + (error.response?.data?.detail || error.message));
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
    
    const { jsPDF } = await import('jspdf');
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
      <div className="min-h-screen bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-2xl p-8 w-full max-w-md">
          <h1 className="text-3xl font-bold text-gray-800 mb-2 text-center">İK Sistemi</h1>
          
          {!showRegister ? (
            <>
              <div className="space-y-4">
                <input type="email" placeholder="E-mail" value={loginData.email} onChange={(e) => setLoginData({ ...loginData, email: e.target.value })} onKeyPress={(e) => e.key === 'Enter' && handleLogin()} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                <button onClick={handleLogin} className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold">Giriş Yap</button>
                <button onClick={() => setShowRegister(true)} className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold">Kayıt Ol</button>
                <div className="mt-6 pt-6 border-t text-xs text-gray-500">
                  <p className="font-semibold mb-2">Demo Hesaplar:</p>
                  <p>• admin@example.com (Admin)</p>
                  <p>• sef@example.com (Şef)</p>
                  <p>• fatma@example.com (Personel)</p>
                  <p>• kiosk@example.com (Kiosk Terminal)</p>
                  <p>• mehmet@example.com (Sistem Yöneticisi)</p>
                </div>
              </div>
            </>
          ) : (
            <>
              <h2 className="text-xl font-semibold text-gray-700 mb-4 text-center">Yeni Kayıt</h2>
              <div className="space-y-4">
                <input type="text" placeholder="Ad *" value={registerData.ad} onChange={(e) => setRegisterData({ ...registerData, ad: e.target.value })} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
                <input type="text" placeholder="Soyad *" value={registerData.soyad} onChange={(e) => setRegisterData({ ...registerData, soyad: e.target.value })} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
                <input type="email" placeholder="E-mail *" value={registerData.email} onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
                <input type="text" placeholder="Personel ID (4 haneli) *" maxLength="4" value={registerData.employee_id} onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '');
                  setRegisterData({ ...registerData, employee_id: value });
                }} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
                <p className="text-xs text-gray-500">* Pozisyon ve maaş bilgisi admin tarafından atanacaktır</p>
                <button onClick={handleRegister} className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold">Kayıt Ol</button>
                <button onClick={() => setShowRegister(false)} className="w-full px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 font-semibold">Geri Dön</button>
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
            <button onClick={() => setActiveTab('personel')} className={`px-6 py-2 rounded-lg font-semibold transition ${activeTab === 'personel' ? 'bg-indigo-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}>👥 Personel</button>
          )}
          {permissions.can_view_stock && (
            <button onClick={() => setActiveTab('stok')} className={`px-6 py-2 rounded-lg font-semibold transition ${activeTab === 'stok' ? 'bg-indigo-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}>📦 Stok</button>
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
                    <div className="space-y-4">
                      <div>
                        <label className="block font-semibold mb-2">Personel Seç (Birden fazla seçebilirsiniz):</label>
                        <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border rounded-lg p-3 bg-white">
                          {employees.map(emp => (
                            <label key={emp.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                              <input
                                type="checkbox"
                                checked={selectedEmployeesForShift.includes(emp.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedEmployeesForShift([...selectedEmployeesForShift, emp.id]);
                                  } else {
                                    setSelectedEmployeesForShift(selectedEmployeesForShift.filter(id => id !== emp.id));
                                  }
                                }}
                                className="w-4 h-4"
                              />
                              <span className="text-sm">{emp.ad} {emp.soyad}</span>
                            </label>
                          ))}
                        </div>
                        {selectedEmployeesForShift.length > 0 && (
                          <p className="text-sm text-green-600 mt-2">✓ {selectedEmployeesForShift.length} personel seçildi</p>
                        )}
                      </div>
                      
                      <input type="date" className="w-full px-4 py-2 border rounded-lg" id="shift-date-input" />
                      
                      <button onClick={() => {
                        const date = document.getElementById('shift-date-input').value;
                        if (selectedEmployeesForShift.length === 0) {
                          alert('❌ En az bir personel seçiniz!');
                          return;
                        }
                        if (!date) {
                          alert('❌ Tarih seçiniz!');
                          return;
                        }
                        
                        // Assign shift to all selected employees
                        Promise.all(selectedEmployeesForShift.map(empId => addShiftToCalendar(empId, date)))
                          .then(() => {
                            setSelectedEmployeesForShift([]);
                            document.getElementById('shift-date-input').value = '';
                            alert(`✅ ${selectedEmployeesForShift.length} personele vardiya atandı!`);
                          })
                          .catch(err => {
                            alert('❌ Hata: ' + err.message);
                          });
                      }} className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold">
                        Seçili Personellere Vardiya Ata ({selectedEmployeesForShift.length})
                      </button>
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
                // Admin ve Şef tüm görevleri görebilir
                if (permissions.assign_tasks) return true;
                // Personel sadece kendine atanan görevleri görebilir
                return task.atanan_personel_ids && task.atanan_personel_ids.includes(employee.id);
              }).map(task => {
                const atananPersoneller = employees.filter(e => task.atanan_personel_ids && task.atanan_personel_ids.includes(e.id));
                const isAssignedToMe = task.atanan_personel_ids && task.atanan_personel_ids.includes(employee.id);
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
                    {isAssignedToMe && task.durum !== 'tamamlandi' && (
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
                return task.atanan_personel_ids && task.atanan_personel_ids.includes(employee.id);
              }).length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p>Henüz görev yok</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'maas' && permissions.view_salary && (
          <div>
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">💰 Maaş Yönetimi</h2>
                <div className="flex gap-3">
                  {(employee?.rol === 'admin' || employee?.rol === 'sistem_yoneticisi') && (
                    <>
                      <button onClick={() => setShowAvansModal(true)} className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-semibold flex items-center gap-2"><Plus className="w-4 h-4" /> Avans Ekle</button>
                      <button onClick={() => setShowYemekModal(true)} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold flex items-center gap-2"><Plus className="w-4 h-4" /> Yemek Ücreti Ayarla</button>
                    </>
                  )}
                </div>
              </div>
              
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
                      <th className="px-4 py-2 text-right">Temel Maaş</th>
                      <th className="px-4 py-2 text-right">Günlük</th>
                      <th className="px-4 py-2 text-right">Saatlik</th>
                      <th className="px-4 py-2 text-center">Gün</th>
                      <th className="px-4 py-2 text-right">Hak Eden</th>
                      <th className="px-4 py-2 text-right">Yemek</th>
                      <th className="px-4 py-2 text-right">Avans</th>
                      <th className="px-4 py-2 text-right">Net Maaş</th>
                      <th className="px-4 py-2 text-center">Detay</th>
                    </tr>
                  </thead>
                  <tbody>
                    {salaryData.map((record, idx) => (
                      <tr key={idx} className={`border-b hover:bg-gray-50 ${record.toplam_maas < 0 ? 'bg-red-50' : ''}`}>
                        <td className="px-4 py-2 font-semibold">{record.ad} {record.soyad}</td>
                        <td className="px-4 py-2">{record.pozisyon}</td>
                        <td className="px-4 py-2 text-right">₺{record.temel_maas.toLocaleString('tr-TR')}</td>
                        <td className="px-4 py-2 text-right text-xs text-gray-600">₺{record.gunluk_maas.toLocaleString('tr-TR')}</td>
                        <td className="px-4 py-2 text-right text-xs text-gray-600">₺{record.saatlik_maas.toLocaleString('tr-TR')}</td>
                        <td className="px-4 py-2 text-center font-semibold">{record.calisilan_gun}</td>
                        <td className="px-4 py-2 text-right font-semibold text-blue-600">₺{record.hakedilen_maas.toLocaleString('tr-TR')}</td>
                        <td className="px-4 py-2 text-right text-green-600">+₺{record.toplam_yemek.toLocaleString('tr-TR')}</td>
                        <td className="px-4 py-2 text-right text-red-600">-₺{record.toplam_avans.toLocaleString('tr-TR')}</td>
                        <td className={`px-4 py-2 text-right font-bold text-lg ${record.toplam_maas < 0 ? 'text-red-600' : 'text-green-600'}`}>₺{record.toplam_maas.toLocaleString('tr-TR')}</td>
                        <td className="px-4 py-2 text-center">
                          <button onClick={() => setSelectedEmployeeForDetail(record)} className="px-3 py-1 bg-indigo-500 text-white rounded text-xs hover:bg-indigo-600">Detay</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Avans Modal */}
            {showAvansModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 w-full max-w-md">
                  <h3 className="text-xl font-bold mb-4">Avans Ekle</h3>
                  <div className="space-y-4">
                    <select value={newAvans.employee_id} onChange={(e) => setNewAvans({ ...newAvans, employee_id: e.target.value })} className="w-full px-4 py-2 border rounded-lg">
                      <option value="">Personel Seç</option>
                      {employees.map(emp => (
                        <option key={emp.id} value={emp.id}>{emp.ad} {emp.soyad}</option>
                      ))}
                    </select>
                    <input type="number" placeholder="Avans Miktarı (₺)" value={newAvans.miktar} onChange={(e) => setNewAvans({ ...newAvans, miktar: e.target.value })} className="w-full px-4 py-2 border rounded-lg" />
                    <input type="date" value={newAvans.tarih} onChange={(e) => setNewAvans({ ...newAvans, tarih: e.target.value })} className="w-full px-4 py-2 border rounded-lg" />
                    <textarea placeholder="Açıklama" value={newAvans.aciklama} onChange={(e) => setNewAvans({ ...newAvans, aciklama: e.target.value })} className="w-full px-4 py-2 border rounded-lg" rows="3" />
                  </div>
                  <div className="flex gap-3 mt-6">
                    <button onClick={addAvans} className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold">Kaydet</button>
                    <button onClick={() => setShowAvansModal(false)} className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 font-semibold">İptal</button>
                  </div>
                </div>
              </div>
            )}

            {/* Yemek Ücreti Modal */}
            {showYemekModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 w-full max-w-md">
                  <h3 className="text-xl font-bold mb-4">Günlük Yemek Ücreti Ayarla</h3>
                  <div className="space-y-4">
                    <select value={yemekUpdate.employee_id} onChange={(e) => setYemekUpdate({ ...yemekUpdate, employee_id: e.target.value })} className="w-full px-4 py-2 border rounded-lg">
                      <option value="">Personel Seç</option>
                      {employees.map(emp => (
                        <option key={emp.id} value={emp.id}>{emp.ad} {emp.soyad}</option>
                      ))}
                    </select>
                    <input type="number" placeholder="Günlük Yemek Ücreti (₺)" value={yemekUpdate.gunluk_ucret} onChange={(e) => setYemekUpdate({ ...yemekUpdate, gunluk_ucret: e.target.value })} className="w-full px-4 py-2 border rounded-lg" />
                    <p className="text-sm text-gray-600">Personelin her çalışma günü için ödenen yemek ücreti</p>
                  </div>
                  <div className="flex gap-3 mt-6">
                    <button onClick={updateYemekUcreti} className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold">Kaydet</button>
                    <button onClick={() => setShowYemekModal(false)} className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 font-semibold">İptal</button>
                  </div>
                </div>
              </div>
            )}

            {/* Detail Modal */}
            {selectedEmployeeForDetail && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-2xl font-bold">{selectedEmployeeForDetail.ad} {selectedEmployeeForDetail.soyad} - Maaş Detayı</h3>
                    <button onClick={() => setSelectedEmployeeForDetail(null)} className="text-gray-500 hover:text-gray-700"><X className="w-6 h-6" /></button>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="font-bold mb-2">📊 Temel Bilgiler</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>Pozisyon: <span className="font-semibold">{selectedEmployeeForDetail.pozisyon}</span></div>
                        <div>Ay: <span className="font-semibold">{selectedEmployeeForDetail.ay}</span></div>
                        <div>Temel Maaş: <span className="font-semibold">₺{selectedEmployeeForDetail.temel_maas.toLocaleString('tr-TR')}</span></div>
                        <div>Günlük Maaş: <span className="font-semibold">₺{selectedEmployeeForDetail.gunluk_maas.toLocaleString('tr-TR')}</span></div>
                        <div>Saatlik Maaş: <span className="font-semibold">₺{selectedEmployeeForDetail.saatlik_maas.toLocaleString('tr-TR')}</span></div>
                        <div>Mesai Süresi: <span className="font-semibold">9 saat/gün</span></div>
                      </div>
                    </div>

                    <div className="bg-green-50 p-4 rounded-lg">
                      <h4 className="font-bold mb-2">💵 Kazançlar</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Çalışılan Gün:</span>
                          <span className="font-semibold">{selectedEmployeeForDetail.calisilan_gun} gün</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Çalışılan Saat:</span>
                          <span className="font-semibold">{selectedEmployeeForDetail.calisilan_saat} saat</span>
                        </div>
                        <div className="flex justify-between border-t pt-2">
                          <span>Hak Edilen Maaş:</span>
                          <span className="font-semibold text-blue-600">₺{selectedEmployeeForDetail.hakedilen_maas.toLocaleString('tr-TR')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Yemek Ücreti ({selectedEmployeeForDetail.gunluk_yemek_ucreti}₺ x {selectedEmployeeForDetail.calisilan_gun} gün):</span>
                          <span className="font-semibold text-green-600">+₺{selectedEmployeeForDetail.toplam_yemek.toLocaleString('tr-TR')}</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-red-50 p-4 rounded-lg">
                      <h4 className="font-bold mb-2">💳 Kesintiler</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Toplam Avans:</span>
                          <span className="font-semibold text-red-600">-₺{selectedEmployeeForDetail.toplam_avans.toLocaleString('tr-TR')}</span>
                        </div>
                      </div>
                    </div>

                    <div className={`p-4 rounded-lg ${selectedEmployeeForDetail.toplam_maas < 0 ? 'bg-red-100' : 'bg-green-100'}`}>
                      <h4 className="font-bold mb-2">💰 Net Maaş</h4>
                      <div className="text-2xl font-bold text-center">
                        <span className={selectedEmployeeForDetail.toplam_maas < 0 ? 'text-red-600' : 'text-green-600'}>
                          ₺{selectedEmployeeForDetail.toplam_maas.toLocaleString('tr-TR')}
                        </span>
                      </div>
                      {selectedEmployeeForDetail.toplam_maas < 0 && (
                        <p className="text-center text-sm text-red-600 mt-2">⚠️ Personelin borcu var!</p>
                      )}
                    </div>

                    {/* Avans Geçmişi */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-bold mb-2">📋 Avans Geçmişi ({selectedEmployeeForDetail.ay})</h4>
                      <div className="space-y-2">
                        {avansData.filter(a => a.employee_id === selectedEmployeeForDetail.employee_id && a.tarih.startsWith(selectedEmployeeForDetail.ay)).map(avans => (
                          <div key={avans.id} className="flex justify-between items-center bg-white p-2 rounded text-sm">
                            <div>
                              <div className="font-semibold">₺{avans.miktar.toLocaleString('tr-TR')}</div>
                              <div className="text-xs text-gray-600">{avans.tarih} - {avans.aciklama}</div>
                            </div>
                            {(employee?.rol === 'admin' || employee?.rol === 'sistem_yoneticisi') && (
                              <button onClick={() => { deleteAvans(avans.id); setSelectedEmployeeForDetail(null); }} className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"><Trash2 className="w-3 h-3" /></button>
                            )}
                          </div>
                        ))}
                        {avansData.filter(a => a.employee_id === selectedEmployeeForDetail.employee_id && a.tarih.startsWith(selectedEmployeeForDetail.ay)).length === 0 && (
                          <p className="text-sm text-gray-500 text-center">Avans kaydı yok</p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <button onClick={() => setSelectedEmployeeForDetail(null)} className="mt-6 w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold">Kapat</button>
                </div>
              </div>
            )}
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
        )}

        {activeTab === 'stok' && permissions.can_view_stock && (
          <div>
            {permissions.can_manage_categories && (
              // Category Management
              <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h2 className="text-xl font-bold mb-4">🏷️ Kategori Yönetimi</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <input 
                    type="text" 
                    placeholder="Kategori Adı (ör: Sebze)" 
                    value={newStokKategori.ad} 
                    onChange={(e) => setNewStokKategori({ ...newStokKategori, ad: e.target.value })} 
                    className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                  />
                  <input 
                    type="color" 
                    value={newStokKategori.renk} 
                    onChange={(e) => setNewStokKategori({ ...newStokKategori, renk: e.target.value })} 
                    className="px-2 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 h-11" 
                    title="Kategori Rengi"
                  />
                  <button 
                    onClick={addStokKategori} 
                    className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" /> Kategori Ekle
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-4 py-2 text-left">ID</th>
                        <th className="px-4 py-2 text-left">Kategori Adı</th>
                        <th className="px-4 py-2 text-left">Renk</th>
                        <th className="px-4 py-2 text-left">İşlemler</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stokKategoriler.map(kategori => (
                        <tr key={kategori.id} className="border-b hover:bg-gray-50">
                          {editingStokKategori?.id === kategori.id ? (
                            <>
                              <td className="px-4 py-2 font-bold text-indigo-600">{kategori.id}</td>
                              <td className="px-4 py-2">
                                <input 
                                  type="text" 
                                  value={editingStokKategori.ad} 
                                  onChange={(e) => setEditingStokKategori({ ...editingStokKategori, ad: e.target.value })} 
                                  className="w-full px-2 py-1 border rounded text-sm"
                                />
                              </td>
                              <td className="px-4 py-2">
                                <input 
                                  type="color" 
                                  value={editingStokKategori.renk} 
                                  onChange={(e) => setEditingStokKategori({ ...editingStokKategori, renk: e.target.value })} 
                                  className="w-16 h-8 border rounded"
                                />
                              </td>
                              <td className="px-4 py-2 flex gap-2">
                                <button 
                                  onClick={updateStokKategori} 
                                  className="px-3 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600 font-semibold"
                                >
                                  Kaydet
                                </button>
                                <button 
                                  onClick={() => setEditingStokKategori(null)} 
                                  className="px-3 py-1 bg-gray-500 text-white rounded text-xs hover:bg-gray-600 font-semibold"
                                >
                                  İptal
                                </button>
                              </td>
                            </>
                          ) : (
                            <>
                              <td className="px-4 py-2 font-bold text-indigo-600">{kategori.id}</td>
                              <td className="px-4 py-2 font-semibold">{kategori.ad}</td>
                              <td className="px-4 py-2">
                                <div className="flex items-center gap-2">
                                  <div style={{backgroundColor: kategori.renk}} className="w-8 h-8 rounded border"></div>
                                  <span className="text-xs text-gray-600">{kategori.renk}</span>
                                </div>
                              </td>
                              <td className="px-4 py-2 flex gap-2">
                                <button 
                                  onClick={() => startEditStokKategori(kategori)} 
                                  className="px-3 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 font-semibold flex items-center gap-1"
                                >
                                  <Edit2 className="w-3 h-3" /> Düzenle
                                </button>
                                <button 
                                  onClick={() => deleteStokKategori(kategori.id)} 
                                  className="px-3 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600 font-semibold flex items-center gap-1"
                                >
                                  <Trash2 className="w-3 h-3" /> Sil
                                </button>
                              </td>
                            </>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Units Management */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h2 className="text-xl font-bold mb-4">📏 Birim Yönetimi</h2>
              {permissions.can_add_stock_unit && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <input 
                    type="text" 
                    placeholder="Birim Adı (ör: Kilogram)" 
                    value={newStokBirim.ad} 
                    onChange={(e) => setNewStokBirim({ ...newStokBirim, ad: e.target.value })} 
                    className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                  />
                  <input 
                    type="text" 
                    placeholder="Kısaltma (ör: kg)" 
                    value={newStokBirim.kisaltma} 
                    onChange={(e) => setNewStokBirim({ ...newStokBirim, kisaltma: e.target.value })} 
                    className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                  />
                  <button 
                    onClick={addStokBirim} 
                    className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" /> Birim Ekle
                  </button>
                </div>
              )}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-2 text-left">ID</th>
                      <th className="px-4 py-2 text-left">Birim Adı</th>
                      <th className="px-4 py-2 text-left">Kısaltma</th>
                      {permissions.can_delete_stock_unit && <th className="px-4 py-2 text-left">İşlem</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {stokBirimler.map(birim => (
                      <tr key={birim.id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-2 font-bold text-indigo-600">{birim.id}</td>
                        <td className="px-4 py-2 font-semibold">{birim.ad}</td>
                        <td className="px-4 py-2">{birim.kisaltma}</td>
                        {permissions.can_delete_stock_unit && (
                          <td className="px-4 py-2">
                            <button 
                              onClick={() => deleteStokBirim(birim.id)} 
                              className="px-3 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600 font-semibold flex items-center gap-1"
                            >
                              <Trash2 className="w-3 h-3" /> Sil
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Products Management */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h2 className="text-xl font-bold mb-4">📦 Ürün Yönetimi</h2>
              {permissions.can_add_stock_product && (
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
                  <input 
                    type="text" 
                    placeholder="Ürün Adı" 
                    value={newStokUrun.ad} 
                    onChange={(e) => setNewStokUrun({ ...newStokUrun, ad: e.target.value })} 
                    className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                  />
                  <select 
                    value={newStokUrun.birim_id} 
                    onChange={(e) => setNewStokUrun({ ...newStokUrun, birim_id: e.target.value })} 
                    className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Birim Seçin</option>
                    {stokBirimler.map(birim => (
                      <option key={birim.id} value={birim.id}>{birim.ad} ({birim.kisaltma})</option>
                    ))}
                  </select>
                  <select 
                    value={newStokUrun.kategori_id} 
                    onChange={(e) => setNewStokUrun({ ...newStokUrun, kategori_id: e.target.value })} 
                    className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Kategori Seçin</option>
                    {stokKategoriler.map(kategori => (
                      <option key={kategori.id} value={kategori.id}>{kategori.ad}</option>
                    ))}
                  </select>
                  <input 
                    type="number" 
                    placeholder="Min Stok" 
                    value={newStokUrun.min_stok} 
                    onChange={(e) => setNewStokUrun({ ...newStokUrun, min_stok: e.target.value })} 
                    className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                  />
                  <button 
                    onClick={addStokUrun} 
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" /> Ürün Ekle
                  </button>
                </div>
              )}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-2 text-left">ID</th>
                      <th className="px-4 py-2 text-left">Ürün Adı</th>
                      <th className="px-4 py-2 text-left">Birim</th>
                      <th className="px-4 py-2 text-left">Kategori</th>
                      <th className="px-4 py-2 text-left">Min Stok</th>
                      {(permissions.can_edit_stock_product || permissions.can_delete_stock_product) && (
                        <th className="px-4 py-2 text-left">İşlemler</th>
                      )}
                    </tr>
                  </thead>
                      <tbody>
                        {stokUrunler.map(urun => (
                          <tr key={urun.id} className="border-b hover:bg-gray-50">
                            {editingStokUrun?.id === urun.id ? (
                              <>
                                <td className="px-4 py-2 font-bold text-indigo-600">{urun.id}</td>
                                <td className="px-4 py-2">
                                  <input 
                                    type="text" 
                                    value={editingStokUrun.ad} 
                                    onChange={(e) => setEditingStokUrun({ ...editingStokUrun, ad: e.target.value })} 
                                    className="w-full px-2 py-1 border rounded text-sm"
                                  />
                                </td>
                                <td className="px-4 py-2">
                                  <select 
                                    value={editingStokUrun.birim_id} 
                                    onChange={(e) => setEditingStokUrun({ ...editingStokUrun, birim_id: e.target.value })} 
                                    className="w-full px-2 py-1 border rounded text-sm"
                                  >
                                    {stokBirimler.map(birim => (
                                      <option key={birim.id} value={birim.id}>{birim.kisaltma}</option>
                                    ))}
                                  </select>
                                </td>
                                <td className="px-4 py-2">
                                  <select 
                                    value={editingStokUrun.kategori_id} 
                                    onChange={(e) => setEditingStokUrun({ ...editingStokUrun, kategori_id: e.target.value })} 
                                    className="w-full px-2 py-1 border rounded text-sm"
                                  >
                                    {stokKategoriler.map(kategori => (
                                      <option key={kategori.id} value={kategori.id}>{kategori.ad}</option>
                                    ))}
                                  </select>
                                </td>
                                <td className="px-4 py-2">
                                  <input 
                                    type="number" 
                                    value={editingStokUrun.min_stok} 
                                    onChange={(e) => setEditingStokUrun({ ...editingStokUrun, min_stok: e.target.value })} 
                                    className="w-full px-2 py-1 border rounded text-sm"
                                  />
                                </td>
                                <td className="px-4 py-2 flex gap-2">
                                  <button 
                                    onClick={updateStokUrun} 
                                    className="px-3 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600 font-semibold"
                                  >
                                    Kaydet
                                  </button>
                                  <button 
                                    onClick={() => setEditingStokUrun(null)} 
                                    className="px-3 py-1 bg-gray-500 text-white rounded text-xs hover:bg-gray-600 font-semibold"
                                  >
                                    İptal
                                  </button>
                                </td>
                              </>
                            ) : (
                              <>
                                <td className="px-4 py-2 font-bold text-indigo-600">{urun.id}</td>
                                <td className="px-4 py-2 font-semibold">{urun.ad}</td>
                                <td className="px-4 py-2">{stokBirimler.find(b => b.id === urun.birim_id)?.kisaltma}</td>
                                <td className="px-4 py-2">
                                  {(() => {
                                    const kategori = stokKategoriler.find(k => k.id === urun.kategori_id);
                                    return kategori ? (
                                      <span 
                                        className="px-2 py-1 rounded text-xs font-semibold text-white"
                                        style={{backgroundColor: kategori.renk}}
                                      >
                                        {kategori.ad}
                                      </span>
                                    ) : <span className="text-gray-400">-</span>;
                                  })()}
                                </td>
                                <td className="px-4 py-2">{urun.min_stok}</td>
                                {(permissions.can_edit_stock_product || permissions.can_delete_stock_product) && (
                                  <td className="px-4 py-2 flex gap-2">
                                    {permissions.can_edit_stock_product && (
                                      <button 
                                        onClick={() => startEditStokUrun(urun)} 
                                        className="px-3 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 font-semibold flex items-center gap-1"
                                      >
                                        <Edit2 className="w-3 h-3" /> Düzenle
                                      </button>
                                    )}
                                    {permissions.can_delete_stock_product && (
                                      <button 
                                        onClick={() => deleteStokUrun(urun.id)} 
                                        className="px-3 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600 font-semibold flex items-center gap-1"
                                      >
                                        <Trash2 className="w-3 h-3" /> Sil
                                      </button>
                                    )}
                                  </td>
                                )}
                              </>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Current Stock Status */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-xl font-bold mb-4">📊 Mevcut Stok Durumu</h2>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="px-4 py-2 text-left">Ürün</th>
                          <th className="px-4 py-2 text-left">Kategori</th>
                          <th className="px-4 py-2 text-left">Mevcut Miktar</th>
                          <th className="px-4 py-2 text-left">Min Stok</th>
                          <th className="px-4 py-2 text-left">Durum</th>
                          <th className="px-4 py-2 text-left">Son Sayım</th>
                          {permissions.can_perform_stock_count && <th className="px-4 py-2 text-left">İşlem</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {stokDurum.map(item => (
                          <tr key={item.urun.id} className={`border-b hover:bg-gray-50 ${item.durum === 'kritik' ? 'bg-red-50' : ''}`}>
                            <td className="px-4 py-2 font-semibold">{item.urun.ad}</td>
                            <td className="px-4 py-2">
                              {item.kategori ? (
                                <span 
                                  className="px-2 py-1 rounded text-xs font-semibold text-white"
                                  style={{backgroundColor: item.kategori.renk}}
                                >
                                  {item.kategori.ad}
                                </span>
                              ) : <span className="text-gray-400">-</span>}
                            </td>
                            <td className="px-4 py-2 font-bold">{item.stok_miktar} {item.birim?.kisaltma}</td>
                            <td className="px-4 py-2">{item.urun.min_stok} {item.birim?.kisaltma}</td>
                            <td className="px-4 py-2">
                              <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                item.durum === 'kritik' ? 'bg-red-500 text-white' : 'bg-green-100 text-green-700'
                              }`}>
                                {item.durum === 'kritik' ? '⚠️ KRİTİK' : '✅ Normal'}
                              </span>
                            </td>
                            <td className="px-4 py-2 text-xs text-gray-600">
                              {item.son_sayim ? item.son_sayim.tarih : 'Henüz sayım yok'}
                            </td>
                            {permissions.can_perform_stock_count && (
                              <td className="px-4 py-2">
                                <button 
                                  onClick={() => {
                                    setStokSayimData({ [item.urun.id]: item.stok_miktar });
                                    setShowStokSayimModal(true);
                                  }}
                                  className="px-3 py-1 bg-indigo-500 text-white rounded text-xs hover:bg-indigo-600 font-semibold"
                                >
                                  Sayım Yap
                                </button>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

            {/* Stock Count Modal */}
            {showStokSayimModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
                  <div className="sticky top-0 bg-white border-b px-6 py-4">
                    <h3 className="text-xl font-bold">📦 Stok Sayımı</h3>
                  </div>
                  <div className="px-6 py-4">
                    <p className="text-gray-600 mb-4">Sayım yapmak istediğiniz ürünler için miktarları girin:</p>
                    <div className="space-y-3">
                      {stokDurum.map(item => (
                        <div key={item.urun.id} className="flex items-center gap-4 border-b pb-3">
                          <div className="flex-1">
                            <p className="font-semibold">{item.urun.ad}</p>
                            <p className="text-xs text-gray-500">Mevcut: {item.stok_miktar} {item.birim?.kisaltma}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <input 
                              type="number" 
                              step="0.01"
                              placeholder="Yeni miktar"
                              value={stokSayimData[item.urun.id] || ''}
                              onChange={(e) => setStokSayimData({ ...stokSayimData, [item.urun.id]: e.target.value })}
                              className="w-32 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                            <span className="text-sm text-gray-600">{item.birim?.kisaltma}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="sticky bottom-0 bg-gray-50 px-6 py-4 flex gap-3">
                    <button 
                      onClick={saveStokSayim}
                      className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold"
                    >
                      ✅ Sayımı Kaydet
                    </button>
                    <button 
                      onClick={() => {
                        setShowStokSayimModal(false);
                        setStokSayimData({});
                      }}
                      className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 font-semibold"
                    >
                      İptal
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
