from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional

# Company Models
class Company(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: int
    name: str
    domain: str  # example.com
    created_at: str

class CompanyCreate(BaseModel):
    name: str
    domain: str

# Employee Models
class Employee(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: int
    company_id: Optional[int] = 1
    ad: str
    soyad: str
    pozisyon: str
    maas_tabani: float
    rol: str
    email: str
    employee_id: str  # 4-digit ID unique within company

class EmployeeCreate(BaseModel):
    company_id: Optional[int] = 1
    ad: str
    soyad: str
    pozisyon: str
    maas_tabani: float
    rol: str
    email: str
    employee_id: str

class EmployeeUpdate(BaseModel):
    ad: Optional[str] = None
    soyad: Optional[str] = None
    pozisyon: Optional[str] = None
    maas_tabani: Optional[float] = None
    rol: Optional[str] = None
    email: Optional[str] = None
    employee_id: Optional[str] = None
    password: Optional[str] = None

# Role Models
class RolePermissions(BaseModel):
    view_dashboard: bool = False
    view_tasks: bool = False
    assign_tasks: bool = False
    rate_tasks: bool = False
    manage_shifts: bool = False
    manage_leave: bool = False
    view_salary: bool = False
    manage_roles: bool = False
    manage_shifts_types: bool = False
    edit_employees: bool = False
    # Stok İzinleri
    can_view_stock: bool = False
    can_add_stock_unit: bool = False
    can_delete_stock_unit: bool = False
    can_add_stock_product: bool = False
    can_edit_stock_product: bool = False
    can_delete_stock_product: bool = False
    can_perform_stock_count: bool = False
    can_manage_categories: bool = False

class Role(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    name: str
    permissions: RolePermissions

class RoleUpdate(BaseModel):
    permissions: RolePermissions

# Shift Type Models
class ShiftType(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    name: str
    start: str
    end: str
    color: str

class ShiftTypeCreate(BaseModel):
    name: str
    start: str
    end: str
    color: str

# Attendance Models
class Attendance(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: int
    company_id: Optional[int] = 1
    employee_id: str
    ad: str
    soyad: str
    tarih: str
    giris_saati: Optional[str] = None
    cikis_saati: Optional[str] = None
    calisilan_saat: float = 0
    status: str

class AttendanceCheckIn(BaseModel):
    company_id: Optional[int] = 1
    employee_id: str

class AttendanceCheckOut(BaseModel):
    company_id: Optional[int] = 1
    employee_id: str

# Leave Models
class LeaveRecord(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: int
    company_id: Optional[int] = 1
    employee_id: int
    tarih: str
    leave_type: str
    notlar: str

class LeaveRecordCreate(BaseModel):
    company_id: Optional[int] = 1
    employee_id: int
    tarih: str
    leave_type: str
    notlar: str = ""

# Shift Calendar Models
class ShiftCalendar(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: int
    company_id: Optional[int] = 1
    employee_id: int
    tarih: str
    shift_type: str

class ShiftCalendarCreate(BaseModel):
    company_id: Optional[int] = 1
    employee_id: int
    tarih: str
    shift_type: str

# Task Models
class Task(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: int
    company_id: Optional[int] = 1
    baslik: str
    aciklama: str
    atanan_personel_ids: List[int] = []  # Multiple assignment
    olusturan_id: int
    durum: str = "beklemede"  # beklemede, devam_ediyor, tamamlandi
    puan: Optional[int] = None
    olusturma_tarihi: str
    tamamlanma_tarihi: Optional[str] = None
    tekrarlayan: bool = False
    tekrar_periyot: Optional[str] = None  # gunluk, haftalik, aylik
    tekrar_sayi: Optional[int] = None  # 3 günde bir için 3
    tekrar_birim: Optional[str] = None  # gun, hafta, ay

class TaskCreate(BaseModel):
    company_id: Optional[int] = 1
    baslik: str
    aciklama: str
    atanan_personel_ids: List[int] = []  # Multiple assignment
    tekrarlayan: bool = False
    tekrar_periyot: Optional[str] = None
    tekrar_sayi: Optional[int] = None
    tekrar_birim: Optional[str] = None

# Stok Birim Models
class StokBirim(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: int
    company_id: Optional[int] = 1
    ad: str  # kg, gram, adet, litre vs.
    kisaltma: str  # kg, gr, adet, lt

class StokBirimCreate(BaseModel):
    company_id: Optional[int] = 1
    ad: str
    kisaltma: str

# Stok Kategori Models
class StokKategori(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: int
    company_id: Optional[int] = 1
    ad: str  # içecek, malzeme, diğer, etc.
    renk: str  # Hex color code

class StokKategoriCreate(BaseModel):
    company_id: Optional[int] = 1
    ad: str
    renk: str

# Stok Ürün Models
class StokUrun(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: int
    company_id: Optional[int] = 1
    ad: str
    birim_id: int  # Stok birimi ID'si
    kategori_id: int  # Kategori ID'si
    min_stok: float  # Minimum stok miktarı

class StokUrunCreate(BaseModel):
    company_id: Optional[int] = 1
    ad: str
    birim_id: int
    kategori_id: int
    min_stok: float = 0.0

class StokUrunUpdate(BaseModel):
    ad: Optional[str] = None
    birim_id: Optional[int] = None
    kategori_id: Optional[int] = None
    min_stok: Optional[float] = None

# Stok Sayım Models
class StokSayim(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: int
    company_id: Optional[int] = 1
    urun_id: int  # Ürün ID'si
    miktar: float  # Sayılan miktar
    tarih: str  # Sayım tarihi
    sayim_yapan_id: int  # Sayımı yapan kişi
    notlar: Optional[str] = None

class StokSayimCreate(BaseModel):
    company_id: Optional[int] = 1
    urun_id: int
    miktar: float
    sayim_yapan_id: int
    notlar: Optional[str] = None

# Yemek Ücreti Models
class YemekUcreti(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: int
    company_id: Optional[int] = 1
    employee_id: int
    gunluk_ucret: float

class YemekUcretiCreate(BaseModel):
    company_id: Optional[int] = 1
    employee_id: int
    gunluk_ucret: float

class YemekUcretiUpdate(BaseModel):
    gunluk_ucret: float

# Avans Models
class Avans(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: int
    company_id: Optional[int] = 1
    employee_id: int
    miktar: float
    tarih: str
    aciklama: str
    olusturan_id: int

class AvansCreate(BaseModel):
    company_id: Optional[int] = 1
    employee_id: int
    miktar: float
    aciklama: str = ""

# Login Models
class LoginRequest(BaseModel):
    email: Optional[str] = None
    employee_id: Optional[str] = None
    password: str = None
    company_id: Optional[int] = 1

class LoginResponse(BaseModel):
    id: int
    email: str
    ad: str
    soyad: str
    rol: str
    employee_id: str
    company_id: int
    pozisyon: str
