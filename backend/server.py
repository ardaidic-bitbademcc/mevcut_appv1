from fastapi import FastAPI, APIRouter, HTTPException, status
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict
from datetime import datetime, timezone, timedelta
import bcrypt
from contextlib import asynccontextmanager

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Lifespan context manager for proper shutdown
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Starting up...")
    yield
    # Shutdown
    logger.info("Shutting down...")
    client.close()

# Create the main app with lifespan
app = FastAPI(lifespan=lifespan)

# CORS middleware MUST be added BEFORE routers
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create router after middleware
api_router = APIRouter(prefix="/api")

# ==================== MODELS ====================

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

# ==================== HELPER FUNCTIONS ====================

async def get_next_id(collection_name: str):
    """Get the next available ID for a collection"""
    try:
        # Find the document with the highest ID
        result = await db[collection_name].find_one(
            sort=[("id", -1)]
        )
        if result and "id" in result:
            return result["id"] + 1
        return 1
    except Exception as e:
        logger.error(f"Error getting next ID for {collection_name}: {e}")
        return 1

# ==================== ROUTES ====================

# Company Routes
@api_router.get("/companies", response_model=List[Company])
async def get_companies():
    companies = await db.companies.find().to_list(None)
    return companies

@api_router.post("/companies", response_model=Company)
async def create_company(company: CompanyCreate):
    next_id = await get_next_id("companies")
    new_company = {
        "id": next_id,
        "name": company.name,
        "domain": company.domain,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.companies.insert_one(new_company)
    return new_company

# Employee Routes
@api_router.get("/employees", response_model=List[Employee])
async def get_employees(company_id: int = 1):
    employees = await db.employees.find({"company_id": company_id}).to_list(None)
    return employees

@api_router.post("/employees", response_model=Employee)
async def create_employee(employee: EmployeeCreate):
    next_id = await get_next_id("employees")
    new_employee = {
        "id": next_id,
        **employee.dict()
    }
    await db.employees.insert_one(new_employee)
    return new_employee

@api_router.put("/employees/{employee_id}", response_model=Employee)
async def update_employee(employee_id: int, employee_update: EmployeeUpdate):
    update_data = {k: v for k, v in employee_update.dict().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    result = await db.employees.update_one(
        {"id": employee_id},
        {"$set": update_data}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    updated_employee = await db.employees.find_one({"id": employee_id})
    return updated_employee

@api_router.delete("/employees/{employee_id}")
async def delete_employee(employee_id: int):
    result = await db.employees.delete_one({"id": employee_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Employee not found")
    return {"message": "Employee deleted successfully"}

# Role Routes
@api_router.get("/roles", response_model=List[Role])
async def get_roles():
    roles = await db.roles.find().to_list(None)
    return roles

@api_router.put("/roles/{role_id}", response_model=Role)
async def update_role(role_id: str, role_update: RoleUpdate):
    result = await db.roles.update_one(
        {"id": role_id},
        {"$set": {"permissions": role_update.permissions.dict()}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Role not found")
    
    updated_role = await db.roles.find_one({"id": role_id})
    return updated_role

# Shift Type Routes
@api_router.get("/shift-types", response_model=List[ShiftType])
async def get_shift_types():
    shift_types = await db.shift_types.find().to_list(None)
    return shift_types

@api_router.post("/shift-types", response_model=ShiftType)
async def create_shift_type(shift_type: ShiftTypeCreate):
    import uuid
    new_shift_type = {
        "id": str(uuid.uuid4()),
        **shift_type.dict()
    }
    await db.shift_types.insert_one(new_shift_type)
    return new_shift_type

@api_router.delete("/shift-types/{shift_type_id}")
async def delete_shift_type(shift_type_id: str):
    result = await db.shift_types.delete_one({"id": shift_type_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Shift type not found")
    return {"message": "Shift type deleted successfully"}

# Attendance Routes
@api_router.get("/attendance", response_model=List[Attendance])
async def get_attendance(company_id: int = 1, date: Optional[str] = None):
    query = {"company_id": company_id}
    if date:
        query["tarih"] = date
    attendance = await db.attendance.find(query).to_list(None)
    return attendance

@api_router.post("/attendance/check-in")
async def check_in(check_in_data: AttendanceCheckIn):
    # Find employee
    employee = await db.employees.find_one({
        "company_id": check_in_data.company_id,
        "employee_id": check_in_data.employee_id
    })
    
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    today = datetime.now(timezone.utc).date().isoformat()
    
    # Check if already checked in today
    existing = await db.attendance.find_one({
        "company_id": check_in_data.company_id,
        "employee_id": check_in_data.employee_id,
        "tarih": today
    })
    
    if existing:
        raise HTTPException(status_code=400, detail="Already checked in today")
    
    # Create attendance record
    next_id = await get_next_id("attendance")
    attendance_record = {
        "id": next_id,
        "company_id": check_in_data.company_id,
        "employee_id": check_in_data.employee_id,
        "ad": employee["ad"],
        "soyad": employee["soyad"],
        "tarih": today,
        "giris_saati": datetime.now(timezone.utc).isoformat(),
        "cikis_saati": None,
        "calisilan_saat": 0,
        "status": "giris"
    }
    
    await db.attendance.insert_one(attendance_record)
    return {"message": "Check-in successful", "time": attendance_record["giris_saati"]}

@api_router.post("/attendance/check-out")
async def check_out(check_out_data: AttendanceCheckOut):
    today = datetime.now(timezone.utc).date().isoformat()
    
    # Find today's attendance record
    attendance = await db.attendance.find_one({
        "company_id": check_out_data.company_id,
        "employee_id": check_out_data.employee_id,
        "tarih": today,
        "status": "giris"
    })
    
    if not attendance:
        raise HTTPException(status_code=404, detail="No check-in found for today")
    
    # Calculate worked hours
    check_out_time = datetime.now(timezone.utc)
    check_in_time = datetime.fromisoformat(attendance["giris_saati"])
    worked_hours = (check_out_time - check_in_time).total_seconds() / 3600
    
    # Update attendance record
    await db.attendance.update_one(
        {"id": attendance["id"]},
        {
            "$set": {
                "cikis_saati": check_out_time.isoformat(),
                "calisilan_saat": round(worked_hours, 2),
                "status": "cikis"
            }
        }
    )
    
    return {
        "message": "Check-out successful",
        "time": check_out_time.isoformat(),
        "worked_hours": round(worked_hours, 2)
    }

# Task Routes
@api_router.get("/tasks", response_model=List[Task])
async def get_tasks(company_id: int = 1, status: Optional[str] = None):
    query = {"company_id": company_id}
    if status:
        query["durum"] = status
    tasks = await db.tasks.find(query).to_list(None)
    return tasks

@api_router.post("/tasks", response_model=Task)
async def create_task(task: TaskCreate, current_user_id: int = 1):
    next_id = await get_next_id("tasks")
    new_task = {
        "id": next_id,
        **task.dict(),
        "olusturan_id": current_user_id,
        "durum": "beklemede",
        "puan": None,
        "olusturma_tarihi": datetime.now(timezone.utc).isoformat(),
        "tamamlanma_tarihi": None
    }
    await db.tasks.insert_one(new_task)
    return new_task

@api_router.put("/tasks/{task_id}/status")
async def update_task_status(task_id: int, status: str):
    if status not in ["beklemede", "devam_ediyor", "tamamlandi"]:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    update_data = {"durum": status}
    if status == "tamamlandi":
        update_data["tamamlanma_tarihi"] = datetime.now(timezone.utc).isoformat()
    
    result = await db.tasks.update_one(
        {"id": task_id},
        {"$set": update_data}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Task not found")
    
    return {"message": f"Task status updated to {status}"}

@api_router.put("/tasks/{task_id}/rate")
async def rate_task(task_id: int, rating: int):
    if rating < 1 or rating > 5:
        raise HTTPException(status_code=400, detail="Rating must be between 1 and 5")
    
    result = await db.tasks.update_one(
        {"id": task_id, "durum": "tamamlandi"},
        {"$set": {"puan": rating}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Task not found or not completed")
    
    return {"message": f"Task rated with {rating} stars"}

# Stok Routes
@api_router.get("/stok/birimler", response_model=List[StokBirim])
async def get_stok_birimleri(company_id: int = 1):
    birimler = await db.stok_birim.find({"company_id": company_id}).to_list(None)
    return birimler

@api_router.post("/stok/birimler", response_model=StokBirim)
async def create_stok_birim(birim: StokBirimCreate):
    next_id = await get_next_id("stok_birim")
    new_birim = {
        "id": next_id,
        **birim.dict()
    }
    await db.stok_birim.insert_one(new_birim)
    return new_birim

@api_router.delete("/stok/birimler/{birim_id}")
async def delete_stok_birim(birim_id: int):
    # Check if any products use this unit
    product_count = await db.stok_urun.count_documents({"birim_id": birim_id})
    if product_count > 0:
        raise HTTPException(status_code=400, detail="Cannot delete unit that is in use")
    
    result = await db.stok_birim.delete_one({"id": birim_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Unit not found")
    return {"message": "Unit deleted successfully"}

@api_router.get("/stok/kategoriler", response_model=List[StokKategori])
async def get_stok_kategorileri(company_id: int = 1):
    kategoriler = await db.stok_kategori.find({"company_id": company_id}).to_list(None)
    return kategoriler

@api_router.post("/stok/kategoriler", response_model=StokKategori)
async def create_stok_kategori(kategori: StokKategoriCreate):
    next_id = await get_next_id("stok_kategori")
    new_kategori = {
        "id": next_id,
        **kategori.dict()
    }
    await db.stok_kategori.insert_one(new_kategori)
    return new_kategori

@api_router.get("/stok/urunler", response_model=List[StokUrun])
async def get_stok_urunleri(company_id: int = 1):
    urunler = await db.stok_urun.find({"company_id": company_id}).to_list(None)
    return urunler

@api_router.post("/stok/urunler", response_model=StokUrun)
async def create_stok_urun(urun: StokUrunCreate):
    next_id = await get_next_id("stok_urun")
    new_urun = {
        "id": next_id,
        **urun.dict()
    }
    await db.stok_urun.insert_one(new_urun)
    return new_urun

@api_router.put("/stok/urunler/{urun_id}", response_model=StokUrun)
async def update_stok_urun(urun_id: int, urun_update: StokUrunUpdate):
    update_data = {k: v for k, v in urun_update.dict().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    result = await db.stok_urun.update_one(
        {"id": urun_id},
        {"$set": update_data}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    
    updated_urun = await db.stok_urun.find_one({"id": urun_id})
    return updated_urun

@api_router.delete("/stok/urunler/{urun_id}")
async def delete_stok_urun(urun_id: int):
    result = await db.stok_urun.delete_one({"id": urun_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"message": "Product deleted successfully"}

@api_router.get("/stok/sayimlar", response_model=List[StokSayim])
async def get_stok_sayimlari(company_id: int = 1, urun_id: Optional[int] = None):
    query = {"company_id": company_id}
    if urun_id:
        query["urun_id"] = urun_id
    sayimlar = await db.stok_sayim.find(query).sort("tarih", -1).to_list(None)
    return sayimlar

@api_router.post("/stok/sayimlar", response_model=StokSayim)
async def create_stok_sayim(sayim: StokSayimCreate):
    next_id = await get_next_id("stok_sayim")
    new_sayim = {
        "id": next_id,
        "tarih": datetime.now(timezone.utc).date().isoformat(),
        **sayim.dict()
    }
    await db.stok_sayim.insert_one(new_sayim)
    return new_sayim

# Seed data endpoint
@api_router.post("/seed-data")
async def seed_data():
    # Clear existing data
    await db.companies.delete_many({})
    await db.employees.delete_many({})
    await db.roles.delete_many({})
    await db.shift_types.delete_many({})
    await db.attendance.delete_many({})
    await db.leave_records.delete_many({})
    await db.shift_calendar.delete_many({})
    await db.tasks.delete_many({})
    await db.yemek_ucreti.delete_many({})
    await db.avans.delete_many({})
    await db.stok_birim.delete_many({})
    await db.stok_kategori.delete_many({})
    await db.stok_urun.delete_many({})
    await db.stok_sayim.delete_many({})
    
    # Seed companies
    companies = [
        {"id": 1, "name": "Demo Şirket", "domain": "demo.com", "created_at": datetime.now(timezone.utc).isoformat()}
    ]
    await db.companies.insert_many(companies)
    
    # Seed roles
    roles = [
        {
            "id": "admin",
            "name": "Yönetici",
            "permissions": {
                "view_dashboard": True,
                "view_tasks": True,
                "assign_tasks": True,
                "rate_tasks": True,
                "manage_shifts": True,
                "manage_leave": True,
                "view_salary": True,
                "manage_roles": True,
                "manage_shifts_types": True,
                "edit_employees": True,
                "can_view_stock": True,
                "can_add_stock_unit": True,
                "can_delete_stock_unit": True,
                "can_add_stock_product": True,
                "can_edit_stock_product": True,
                "can_delete_stock_product": True,
                "can_perform_stock_count": True,
                "can_manage_categories": True
            }
        },
        {
            "id": "manager",
            "name": "Müdür",
            "permissions": {
                "view_dashboard": True,
                "view_tasks": True,
                "assign_tasks": True,
                "rate_tasks": True,
                "manage_shifts": True,
                "manage_leave": True,
                "view_salary": True,
                "manage_roles": False,
                "manage_shifts_types": True,
                "edit_employees": True,
                "can_view_stock": True,
                "can_add_stock_unit": True,
                "can_delete_stock_unit": False,
                "can_add_stock_product": True,
                "can_edit_stock_product": True,
                "can_delete_stock_product": False,
                "can_perform_stock_count": True,
                "can_manage_categories": True
            }
        },
        {
            "id": "employee",
            "name": "Çalışan",
            "permissions": {
                "view_dashboard": True,
                "view_tasks": True,
                "assign_tasks": False,
                "rate_tasks": False,
                "manage_shifts": False,
                "manage_leave": False,
                "view_salary": True,
                "manage_roles": False,
                "manage_shifts_types": False,
                "edit_employees": False,
                "can_view_stock": True,
                "can_add_stock_unit": False,
                "can_delete_stock_unit": False,
                "can_add_stock_product": False,
                "can_edit_stock_product": False,
                "can_delete_stock_product": False,
                "can_perform_stock_count": False,
                "can_manage_categories": False
            }
        }
    ]
    await db.roles.insert_many(roles)
    
    # Seed shift types
    shift_types = [
        {"id": "sabah", "name": "Sabah", "start": "08:00", "end": "16:00", "color": "#3B82F6"},
        {"id": "ogle_sonra", "name": "Öğleden Sonra", "start": "16:00", "end": "00:00", "color": "#EF4444"},
        {"id": "gece", "name": "Gece", "start": "00:00", "end": "08:00", "color": "#6B7280"},
        {"id": "tam_gun", "name": "Tam Gün", "start": "09:00", "end": "18:00", "color": "#10B981"}
    ]
    await db.shift_types.insert_many(shift_types)
    
    # Seed employees with hashed passwords
    employees = [
        {
            "id": 1,
            "company_id": 1,
            "ad": "Admin",
            "soyad": "User",
            "pozisyon": "Sistem Yöneticisi",
            "maas_tabani": 50000,
            "rol": "admin",
            "email": "admin@demo.com",
            "employee_id": "1000",
            "password": bcrypt.hashpw("admin123".encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        },
        {
            "id": 2,
            "company_id": 1,
            "ad": "Mehmet",
            "soyad": "Yılmaz",
            "pozisyon": "Yazılım Geliştirici",
            "maas_tabani": 35000,
            "rol": "employee",
            "email": "mehmet@demo.com",
            "employee_id": "1001",
            "password": bcrypt.hashpw("mehmet123".encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        },
        {
            "id": 3,
            "company_id": 1,
            "ad": "Zeynep",
            "soyad": "Demir",
            "pozisyon": "Proje Yöneticisi",
            "maas_tabani": 45000,
            "rol": "manager",
            "email": "zeynep@demo.com",
            "employee_id": "1002",
            "password": bcrypt.hashpw("zeynep123".encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        },
        {
            "id": 4,
            "company_id": 1,
            "ad": "Ayşe",
            "soyad": "Kaya",
            "pozisyon": "İK Uzmanı",
            "maas_tabani": 30000,
            "rol": "employee",
            "email": "ayse@demo.com",
            "employee_id": "1003",
            "password": bcrypt.hashpw("ayse123".encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        },
        {
            "id": 5,
            "company_id": 1,
            "ad": "Ali",
            "soyad": "Öztürk",
            "pozisyon": "Satış Müdürü",
            "maas_tabani": 42000,
            "rol": "manager",
            "email": "ali@demo.com",
            "employee_id": "1004",
            "password": bcrypt.hashpw("ali123".encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        },
        {
            "id": 6,
            "company_id": 1,
            "ad": "Arda",
            "soyad": "Yıldız",
            "pozisyon": "Müdür Yardımcısı",
            "maas_tabani": 38000,
            "rol": "manager",
            "email": "arda@demo.com",
            "employee_id": "2001",
            "password": bcrypt.hashpw("arda2024".encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        }
    ]
    await db.employees.insert_many(employees)
    
    # Seed attendance records (including for Arda)
    today = datetime.now(timezone.utc).date().isoformat()
    yesterday = (datetime.now(timezone.utc) - timedelta(days=1)).date().isoformat()
    two_days_ago = (datetime.now(timezone.utc) - timedelta(days=2)).date().isoformat()
    three_days_ago = (datetime.now(timezone.utc) - timedelta(days=3)).date().isoformat()
    four_days_ago = (datetime.now(timezone.utc) - timedelta(days=4)).date().isoformat()
    
    attendance = [
        {
            "id": 1,
            "company_id": 1,
            "employee_id": "1001",
            "ad": "Mehmet",
            "soyad": "Yılmaz",
            "tarih": today,
            "giris_saati": datetime.now(timezone.utc).replace(hour=9, minute=0).isoformat(),
            "cikis_saati": None,
            "calisilan_saat": 0,
            "status": "giris"
        },
        {
            "id": 2,
            "company_id": 1,
            "employee_id": "2001",
            "ad": "Arda",
            "soyad": "Yıldız",
            "tarih": today,
            "giris_saati": datetime.now(timezone.utc).replace(hour=8, minute=30).isoformat(),
            "cikis_saati": None,
            "calisilan_saat": 0,
            "status": "giris"
        },
        {
            "id": 3,
            "company_id": 1,
            "employee_id": "2001",
            "ad": "Arda",
            "soyad": "Yıldız",
            "tarih": yesterday,
            "giris_saati": (datetime.now(timezone.utc) - timedelta(days=1)).replace(hour=9, minute=0).isoformat(),
            "cikis_saati": (datetime.now(timezone.utc) - timedelta(days=1)).replace(hour=18, minute=30).isoformat(),
            "calisilan_saat": 9.5,
            "status": "cikis"
        },
        {
            "id": 4,
            "company_id": 1,
            "employee_id": "2001",
            "ad": "Arda",
            "soyad": "Yıldız",
            "tarih": two_days_ago,
            "giris_saati": (datetime.now(timezone.utc) - timedelta(days=2)).replace(hour=9, minute=0).isoformat(),
            "cikis_saati": (datetime.now(timezone.utc) - timedelta(days=2)).replace(hour=18, minute=0).isoformat(),
            "calisilan_saat": 9.0,
            "status": "cikis"
        },
        {
            "id": 5,
            "company_id": 1,
            "employee_id": "2001",
            "ad": "Arda",
            "soyad": "Yıldız",
            "tarih": three_days_ago,
            "giris_saati": (datetime.now(timezone.utc) - timedelta(days=3)).replace(hour=9, minute=0).isoformat(),
            "cikis_saati": (datetime.now(timezone.utc) - timedelta(days=3)).replace(hour=19, minute=0).isoformat(),
            "calisilan_saat": 10.0,
            "status": "cikis"
        },
        {
            "id": 6,
            "company_id": 1,
            "employee_id": "2001",
            "ad": "Arda",
            "soyad": "Yıldız",
            "tarih": four_days_ago,
            "giris_saati": (datetime.now(timezone.utc) - timedelta(days=4)).replace(hour=9, minute=0).isoformat(),
            "cikis_saati": (datetime.now(timezone.utc) - timedelta(days=4)).replace(hour=18, minute=15).isoformat(),
            "calisilan_saat": 9.25,
            "status": "cikis"
        }
    ]
    await db.attendance.insert_many(attendance)
    
    # Seed yemek ücretleri
    yemek_ucretleri = [
        {"id": 1, "company_id": 1, "employee_id": 1, "gunluk_ucret": 150},
        {"id": 2, "company_id": 1, "employee_id": 2, "gunluk_ucret": 150},
        {"id": 3, "company_id": 1, "employee_id": 3, "gunluk_ucret": 180},
        {"id": 4, "company_id": 1, "employee_id": 4, "gunluk_ucret": 150},
        {"id": 5, "company_id": 1, "employee_id": 5, "gunluk_ucret": 180},
        {"id": 6, "company_id": 1, "employee_id": 6, "gunluk_ucret": 202}
    ]
    await db.yemek_ucreti.insert_many(yemek_ucretleri)
    
    # Seed avans kayıtları (Arda için örnek)
    current_month = datetime.now(timezone.utc).date().isoformat()[:7]
    avans_list = [
        {"id": 1, "company_id": 1, "employee_id": 6, "miktar": 5000, "tarih": f"{current_month}-05", "aciklama": "Kira ödemesi için avans", "olusturan_id": 1},
        {"id": 2, "company_id": 1, "employee_id": 6, "miktar": 2000, "tarih": f"{current_month}-15", "aciklama": "Acil ihtiyaç", "olusturan_id": 1},
        {"id": 3, "company_id": 1, "employee_id": 2, "miktar": 1500, "tarih": f"{current_month}-10", "aciklama": "Avans talebi", "olusturan_id": 1}
    ]
    await db.avans.insert_many(avans_list)
    
    # Seed some leave records
    leave_records = [
        {"id": 1, "company_id": 1, "employee_id": 2, "tarih": "2025-02-15", "leave_type": "izin", "notlar": "Kişisel işler"},
        {"id": 2, "company_id": 1, "employee_id": 4, "tarih": "2025-02-20", "leave_type": "hastalik", "notlar": "Grip"},
        {"id": 3, "company_id": 1, "employee_id": 4, "tarih": "2025-10-25", "leave_type": "izin", "notlar": "Haftalık izin"}
    ]
    await db.leave_records.insert_many(leave_records)
    
    # Seed shift calendar (Ayşe Kaya için örnek - 20-24 Ekim öğleden sonra, 26 Ekim sabah)
    shift_calendar_records = [
        {"id": 1, "company_id": 1, "employee_id": 1, "tarih": "2025-10-20", "shift_type": "sabah"},
        {"id": 2, "company_id": 1, "employee_id": 4, "tarih": "2025-10-20", "shift_type": "ogle_sonra"},
        {"id": 3, "company_id": 1, "employee_id": 3, "tarih": "2025-10-20", "shift_type": "ogle_sonra"},
        {"id": 4, "company_id": 1, "employee_id": 4, "tarih": "2025-10-21", "shift_type": "ogle_sonra"},
        {"id": 5, "company_id": 1, "employee_id": 2, "tarih": "2025-10-21", "shift_type": "ogle_sonra"},
        {"id": 6, "company_id": 1, "employee_id": 4, "tarih": "2025-10-22", "shift_type": "ogle_sonra"},
        {"id": 7, "company_id": 1, "employee_id": 5, "tarih": "2025-10-22", "shift_type": "ogle_sonra"},
        {"id": 8, "company_id": 1, "employee_id": 4, "tarih": "2025-10-23", "shift_type": "ogle_sonra"},
        {"id": 9, "company_id": 1, "employee_id": 1, "tarih": "2025-10-23", "shift_type": "ogle_sonra"},
        {"id": 10, "company_id": 1, "employee_id": 4, "tarih": "2025-10-24", "shift_type": "ogle_sonra"},
        {"id": 11, "company_id": 1, "employee_id": 6, "tarih": "2025-10-24", "shift_type": "ogle_sonra"},
        {"id": 12, "company_id": 1, "employee_id": 4, "tarih": "2025-10-26", "shift_type": "sabah"},
        {"id": 13, "company_id": 1, "employee_id": 2, "tarih": "2025-10-26", "shift_type": "sabah"},
        {"id": 14, "company_id": 1, "employee_id": 3, "tarih": "2025-10-26", "shift_type": "sabah"}
    ]
    await db.shift_calendar.insert_many(shift_calendar_records)
    
    # Seed some tasks
    tasks = [
        {
            "id": 1,
            "company_id": 1,
            "baslik": "Website Tasarımı",
            "aciklama": "Yeni kurumsal website tasarımı yapılacak",
            "atanan_personel_ids": [2],
            "olusturan_id": 1,
            "durum": "devam_ediyor",
            "puan": None,
            "olusturma_tarihi": (datetime.now(timezone.utc) - timedelta(days=2)).isoformat(),
            "tamamlanma_tarihi": None,
            "tekrarlayan": False,
            "tekrar_periyot": None
        },
        {
            "id": 2,
            "company_id": 1,
            "baslik": "Yeni Menü Hazırlığı",
            "aciklama": "Bahar menüsü için yeni yemekler geliştirilecek",
            "atanan_personel_ids": [3],
            "olusturan_id": 1,
            "durum": "beklemede",
            "puan": None,
            "olusturma_tarihi": datetime.now(timezone.utc).isoformat(),
            "tamamlanma_tarihi": None,
            "tekrarlayan": False,
            "tekrar_periyot": None
        },
        {
            "id": 3,
            "company_id": 1,
            "baslik": "Aylık Stok Sayımı",
            "aciklama": "Depo ve mutfak stok sayımı yapılacak, eksik malzemeler listelenecek",
            "atanan_personel_ids": [3, 6],
            "olusturan_id": 1,
            "durum": "beklemede",
            "puan": None,
            "olusturma_tarihi": datetime.now(timezone.utc).isoformat(),
            "tamamlanma_tarihi": None,
            "tekrarlayan": True,
            "tekrar_periyot": "özel",
            "tekrar_sayi": 1,
            "tekrar_birim": "ay"
        }
    ]
    await db.tasks.insert_many(tasks)
    
    # Seed stok kategorileri
    stok_kategorileri = [
        {"id": 1, "company_id": 1, "ad": "Malzeme", "renk": "#9333EA"},  # purple
        {"id": 2, "company_id": 1, "ad": "İçecek", "renk": "#3B82F6"},   # blue
        {"id": 3, "company_id": 1, "ad": "Temizlik", "renk": "#10B981"}, # green
        {"id": 4, "company_id": 1, "ad": "Diğer", "renk": "#6B7280"}     # gray
    ]
    await db.stok_kategori.insert_many(stok_kategorileri)
    
    # Seed stok birimleri
    stok_birimleri = [
        {"id": 1, "company_id": 1, "ad": "Kilogram", "kisaltma": "kg"},
        {"id": 2, "company_id": 1, "ad": "Gram", "kisaltma": "gr"},
        {"id": 3, "company_id": 1, "ad": "Litre", "kisaltma": "lt"},
        {"id": 4, "company_id": 1, "ad": "Adet", "kisaltma": "adet"},
        {"id": 5, "company_id": 1, "ad": "Paket", "kisaltma": "paket"}
    ]
    await db.stok_birim.insert_many(stok_birimleri)
    
    # Seed stok ürünleri
    stok_urunleri = [
        {"id": 1, "company_id": 1, "ad": "Domates", "birim_id": 1, "kategori_id": 1, "min_stok": 5.0},
        {"id": 2, "company_id": 1, "ad": "Soğan", "birim_id": 1, "kategori_id": 1, "min_stok": 3.0},
        {"id": 3, "company_id": 1, "ad": "Coca Cola", "birim_id": 3, "kategori_id": 2, "min_stok": 10.0},
        {"id": 4, "company_id": 1, "ad": "Ekmek", "birim_id": 4, "kategori_id": 1, "min_stok": 20.0},
        {"id": 5, "company_id": 1, "ad": "Süt", "birim_id": 3, "kategori_id": 1, "min_stok": 5.0},
        {"id": 6, "company_id": 1, "ad": "Yumurta", "birim_id": 4, "kategori_id": 1, "min_stok": 30.0},
        {"id": 7, "company_id": 1, "ad": "Çay", "birim_id": 5, "kategori_id": 2, "min_stok": 2.0}
    ]
    await db.stok_urun.insert_many(stok_urunleri)
    
    # Seed stok sayımları
    today_str = datetime.now(timezone.utc).date().isoformat()
    stok_sayimlari = [
        {"id": 1, "company_id": 1, "urun_id": 1, "miktar": 8.5, "tarih": today_str, "sayim_yapan_id": 3, "notlar": "İlk sayım"},
        {"id": 2, "company_id": 1, "urun_id": 2, "miktar": 4.2, "tarih": today_str, "sayim_yapan_id": 3, "notlar": "İlk sayım"},
        {"id": 3, "company_id": 1, "urun_id": 3, "miktar": 15.0, "tarih": today_str, "sayim_yapan_id": 6, "notlar": "İlk sayım"},
        {"id": 4, "company_id": 1, "urun_id": 4, "miktar": 25.0, "tarih": today_str, "sayim_yapan_id": 6, "notlar": "İlk sayım"},
        {"id": 5, "company_id": 1, "urun_id": 5, "miktar": 6.5, "tarih": today_str, "sayim_yapan_id": 3, "notlar": "İlk sayım"},
        {"id": 6, "company_id": 1, "urun_id": 6, "miktar": 45.0, "tarih": today_str, "sayim_yapan_id": 3, "notlar": "İlk sayım"},
        {"id": 7, "company_id": 1, "urun_id": 7, "miktar": 1.0, "tarih": today_str, "sayim_yapan_id": 6, "notlar": "Kritik seviye - yenilenmeli"}
    ]
    await db.stok_sayim.insert_many(stok_sayimlari)
    
    return {"message": "Demo veriler başarıyla yüklendi"}

# Include router AFTER middleware
app.include_router(api_router)
