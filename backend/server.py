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

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")

# ==================== MODELS ====================

# Employee Models
class Employee(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: int
    ad: str
    soyad: str
    pozisyon: str
    maas_tabani: float
    rol: str
    email: str
    employee_id: str

class EmployeeCreate(BaseModel):
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
    employee_id: str
    ad: str
    soyad: str
    tarih: str
    giris_saati: Optional[str] = None
    cikis_saati: Optional[str] = None
    calisilan_saat: float = 0
    status: str

class AttendanceCheckIn(BaseModel):
    employee_id: str

class AttendanceCheckOut(BaseModel):
    employee_id: str

# Leave Models
class LeaveRecord(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: int
    employee_id: int
    tarih: str
    leave_type: str
    notlar: str

class LeaveRecordCreate(BaseModel):
    employee_id: int
    tarih: str
    leave_type: str
    notlar: str = ""

# Shift Calendar Models
class ShiftCalendar(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: int
    employee_id: int
    tarih: str
    shift_type: str

class ShiftCalendarCreate(BaseModel):
    employee_id: int
    tarih: str
    shift_type: str

# Task Models
class Task(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: int
    baslik: str
    aciklama: str
    atanan_personel_ids: List[int] = []  # Multiple assignment
    olusturan_id: int
    durum: str = "beklemede"  # beklemede, devam_ediyor, tamamlandi
    puan: Optional[int] = None
    olusturma_tarihi: str
    tamamlanma_tarihi: Optional[str] = None

class TaskCreate(BaseModel):
    baslik: str
    aciklama: str
    atanan_personel_ids: List[int] = []  # Multiple assignment

class TaskUpdate(BaseModel):
    baslik: Optional[str] = None
    aciklama: Optional[str] = None
    atanan_personel_ids: Optional[List[int]] = None
    durum: Optional[str] = None
    puan: Optional[int] = None

# Salary Models
class SalaryRecord(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: int
    employee_id: int
    ay: str  # YYYY-MM format
    temel_maas: float
    calisilan_saat: float
    toplam_maas: float
    hesaplama_tarihi: str

# Avans Models
class Avans(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: int
    employee_id: int
    miktar: float
    tarih: str
    aciklama: str
    olusturan_id: int

class AvansCreate(BaseModel):
    employee_id: int
    miktar: float
    tarih: str
    aciklama: str = ""

# Yemek Ücreti Models
class YemekUcreti(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: int
    employee_id: int
    gunluk_ucret: float

class YemekUcretiUpdate(BaseModel):
    gunluk_ucret: float

# Login Models
class LoginRequest(BaseModel):
    email: str

class LoginResponse(BaseModel):
    success: bool
    employee: Optional[Employee] = None
    message: str = ""

# ==================== HELPER FUNCTIONS ====================

async def get_next_id(collection_name: str) -> int:
    """Generate next ID for a collection"""
    result = await db[collection_name].find_one(sort=[("id", -1)])
    return (result["id"] + 1) if result else 1

# ==================== AUTHENTICATION ROUTES ====================

@api_router.post("/login", response_model=LoginResponse)
async def login(request: LoginRequest):
    employee = await db.employees.find_one({"email": request.email}, {"_id": 0})
    if employee:
        return LoginResponse(success=True, employee=Employee(**employee))
    return LoginResponse(success=False, message="Kullanıcı bulunamadı")

# ==================== EMPLOYEE ROUTES ====================

@api_router.get("/employees", response_model=List[Employee])
async def get_employees():
    employees = await db.employees.find({}, {"_id": 0}).to_list(1000)
    return employees

@api_router.get("/employees/{employee_id}", response_model=Employee)
async def get_employee(employee_id: int):
    employee = await db.employees.find_one({"id": employee_id}, {"_id": 0})
    if not employee:
        raise HTTPException(status_code=404, detail="Personel bulunamadı")
    return employee

@api_router.post("/employees", response_model=Employee)
async def create_employee(employee: EmployeeCreate):
    # Check if employee_id already exists
    existing = await db.employees.find_one({"employee_id": employee.employee_id})
    if existing:
        raise HTTPException(status_code=400, detail="Bu personel ID zaten kullanılıyor")
    
    # Check if email already exists
    existing_email = await db.employees.find_one({"email": employee.email})
    if existing_email:
        raise HTTPException(status_code=400, detail="Bu e-mail zaten kullanılıyor")
    
    new_id = await get_next_id("employees")
    employee_dict = employee.model_dump()
    employee_dict["id"] = new_id
    
    await db.employees.insert_one(employee_dict)
    return Employee(**employee_dict)

@api_router.put("/employees/{employee_id}", response_model=Employee)
async def update_employee(employee_id: int, employee_update: EmployeeUpdate):
    existing = await db.employees.find_one({"id": employee_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Personel bulunamadı")
    
    update_data = {k: v for k, v in employee_update.model_dump().items() if v is not None}
    
    # Check if new employee_id conflicts
    if "employee_id" in update_data:
        conflict = await db.employees.find_one({
            "employee_id": update_data["employee_id"],
            "id": {"$ne": employee_id}
        })
        if conflict:
            raise HTTPException(status_code=400, detail="Bu personel ID zaten kullanılıyor")
    
    if update_data:
        await db.employees.update_one({"id": employee_id}, {"$set": update_data})
    
    updated = await db.employees.find_one({"id": employee_id}, {"_id": 0})
    return Employee(**updated)

@api_router.delete("/employees/{employee_id}")
async def delete_employee(employee_id: int):
    result = await db.employees.delete_one({"id": employee_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Personel bulunamadı")
    return {"message": "Personel silindi"}

# ==================== ROLE ROUTES ====================

@api_router.get("/roles", response_model=List[Role])
async def get_roles():
    roles = await db.roles.find({}, {"_id": 0}).to_list(100)
    return roles

@api_router.put("/roles/{role_id}", response_model=Role)
async def update_role(role_id: str, role_update: RoleUpdate):
    existing = await db.roles.find_one({"id": role_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Rol bulunamadı")
    
    await db.roles.update_one(
        {"id": role_id},
        {"$set": {"permissions": role_update.permissions.model_dump()}}
    )
    
    updated = await db.roles.find_one({"id": role_id}, {"_id": 0})
    return Role(**updated)

# ==================== SHIFT TYPE ROUTES ====================

@api_router.get("/shift-types", response_model=List[ShiftType])
async def get_shift_types():
    shift_types = await db.shift_types.find({}, {"_id": 0}).to_list(100)
    return shift_types

@api_router.post("/shift-types", response_model=ShiftType)
async def create_shift_type(shift_type: ShiftTypeCreate):
    shift_id = f"shift_{int(datetime.now(timezone.utc).timestamp() * 1000)}"
    shift_dict = shift_type.model_dump()
    shift_dict["id"] = shift_id
    
    await db.shift_types.insert_one(shift_dict)
    return ShiftType(**shift_dict)

@api_router.delete("/shift-types/{shift_type_id}")
async def delete_shift_type(shift_type_id: str):
    # Check if shift type is in use
    in_use = await db.shift_calendar.find_one({"shift_type": shift_type_id})
    if in_use:
        raise HTTPException(status_code=400, detail="Bu vardiya türünde atanmış vardiyalar var")
    
    result = await db.shift_types.delete_one({"id": shift_type_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Vardiya türü bulunamadı")
    return {"message": "Vardiya türü silindi"}

# ==================== ATTENDANCE ROUTES ====================

@api_router.get("/attendance", response_model=List[Attendance])
async def get_attendance():
    attendance = await db.attendance.find({}, {"_id": 0}).sort("id", -1).to_list(1000)
    return attendance

@api_router.post("/attendance/check-in")
async def check_in(request: AttendanceCheckIn):
    # Find employee
    employee = await db.employees.find_one({"employee_id": request.employee_id})
    if not employee:
        raise HTTPException(status_code=404, detail="Personel bulunamadı")
    
    today = datetime.now(timezone.utc).date().isoformat()
    
    # Check if already checked in today
    existing = await db.attendance.find_one({
        "employee_id": request.employee_id,
        "tarih": today,
        "cikis_saati": None
    })
    
    if existing:
        raise HTTPException(status_code=400, detail="Zaten giriş yapılmış")
    
    new_id = await get_next_id("attendance")
    attendance_record = {
        "id": new_id,
        "employee_id": request.employee_id,
        "ad": employee["ad"],
        "soyad": employee["soyad"],
        "tarih": today,
        "giris_saati": datetime.now(timezone.utc).isoformat(),
        "cikis_saati": None,
        "calisilan_saat": 0,
        "status": "giris"
    }
    
    await db.attendance.insert_one(attendance_record)
    return {"message": "Giriş başarılı", "employee": f"{employee['ad']} {employee['soyad']}"}

@api_router.post("/attendance/check-out")
async def check_out(request: AttendanceCheckOut):
    # Find employee
    employee = await db.employees.find_one({"employee_id": request.employee_id})
    if not employee:
        raise HTTPException(status_code=404, detail="Personel bulunamadı")
    
    # Find last check-in without check-out
    last_checkin = await db.attendance.find_one({
        "employee_id": request.employee_id,
        "cikis_saati": None
    })
    
    if not last_checkin:
        raise HTTPException(status_code=400, detail="Giriş kaydı bulunamadı")
    
    now = datetime.now(timezone.utc)
    giris = datetime.fromisoformat(last_checkin["giris_saati"])
    calisilan_saat = (now - giris).total_seconds() / 3600
    
    await db.attendance.update_one(
        {"id": last_checkin["id"]},
        {"$set": {
            "cikis_saati": now.isoformat(),
            "calisilan_saat": round(calisilan_saat, 2),
            "status": "cikis"
        }}
    )
    
    return {
        "message": "Çıkış başarılı",
        "employee": f"{employee['ad']} {employee['soyad']}",
        "calisilan_saat": round(calisilan_saat, 2)
    }

# ==================== LEAVE ROUTES ====================

@api_router.get("/leave-records", response_model=List[LeaveRecord])
async def get_leave_records():
    records = await db.leave_records.find({}, {"_id": 0}).to_list(1000)
    return records

@api_router.post("/leave-records", response_model=LeaveRecord)
async def create_leave_record(leave: LeaveRecordCreate):
    new_id = await get_next_id("leave_records")
    leave_dict = leave.model_dump()
    leave_dict["id"] = new_id
    
    await db.leave_records.insert_one(leave_dict)
    return LeaveRecord(**leave_dict)

@api_router.delete("/leave-records/{leave_id}")
async def delete_leave_record(leave_id: int):
    result = await db.leave_records.delete_one({"id": leave_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="İzin kaydı bulunamadı")
    return {"message": "İzin kaydı silindi"}

# ==================== SHIFT CALENDAR ROUTES ====================

@api_router.get("/shift-calendar", response_model=List[ShiftCalendar])
async def get_shift_calendar():
    calendar = await db.shift_calendar.find({}, {"_id": 0}).to_list(1000)
    return calendar

@api_router.post("/shift-calendar", response_model=ShiftCalendar)
async def create_shift_assignment(shift: ShiftCalendarCreate):
    # Check if shift already exists for this employee on this date
    existing = await db.shift_calendar.find_one({
        "employee_id": shift.employee_id,
        "tarih": shift.tarih
    })
    
    if existing:
        raise HTTPException(status_code=400, detail="Bu tarihte zaten bir vardiya atanmış")
    
    new_id = await get_next_id("shift_calendar")
    shift_dict = shift.model_dump()
    shift_dict["id"] = new_id
    
    await db.shift_calendar.insert_one(shift_dict)
    return ShiftCalendar(**shift_dict)

@api_router.get("/shift-calendar/weekly/{employee_id}")
async def get_weekly_shift_calendar(employee_id: int, start_date: str):
    """Get weekly shift calendar for an employee with team members"""
    # Parse start_date
    from datetime import datetime, timedelta
    start = datetime.fromisoformat(start_date)
    
    # Get 7 days from start_date
    shifts_data = []
    for i in range(7):
        current_date = (start + timedelta(days=i)).date().isoformat()
        
        # Get employee's shift for this day
        employee_shift = await db.shift_calendar.find_one({
            "employee_id": employee_id,
            "tarih": current_date
        }, {"_id": 0})
        
        # Get leave record
        leave = await db.leave_records.find_one({
            "employee_id": employee_id,
            "tarih": current_date
        }, {"_id": 0})
        
        if leave:
            shifts_data.append({
                "tarih": current_date,
                "type": "izin",
                "shift_type": None,
                "team_members": []
            })
        elif employee_shift:
            # Get all shifts for this day and shift type
            shift_type = employee_shift["shift_type"]
            all_shifts = await db.shift_calendar.find({
                "tarih": current_date,
                "shift_type": shift_type
            }, {"_id": 0}).to_list(100)
            
            # Get employee details for team members
            team_members = []
            for shift in all_shifts:
                if shift["employee_id"] != employee_id:
                    emp = await db.employees.find_one({"id": shift["employee_id"]}, {"_id": 0})
                    if emp:
                        team_members.append({
                            "ad": emp["ad"],
                            "soyad": emp["soyad"],
                            "pozisyon": emp.get("pozisyon", "")
                        })
            
            # Get shift type details
            shift_type_detail = await db.shift_types.find_one({"id": shift_type}, {"_id": 0})
            
            shifts_data.append({
                "tarih": current_date,
                "type": "vardiya",
                "shift_type": shift_type_detail,
                "team_members": team_members
            })
        else:
            shifts_data.append({
                "tarih": current_date,
                "type": "bos",
                "shift_type": None,
                "team_members": []
            })
    
    # Get employee info
    employee = await db.employees.find_one({"id": employee_id}, {"_id": 0})
    
    return {
        "employee": employee,
        "start_date": start_date,
        "shifts": shifts_data
    }

@api_router.delete("/shift-calendar/{shift_id}")
async def delete_shift_assignment(shift_id: int):
    result = await db.shift_calendar.delete_one({"id": shift_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Vardiya bulunamadı")
    return {"message": "Vardiya silindi"}

# ==================== TASK ROUTES ====================

@api_router.get("/tasks", response_model=List[Task])
async def get_tasks():
    tasks = await db.tasks.find({}, {"_id": 0}).sort("id", -1).to_list(1000)
    return tasks

@api_router.post("/tasks")
async def create_task(task: TaskCreate, olusturan_id: int):
    new_id = await get_next_id("tasks")
    task_dict = task.model_dump()
    task_dict.update({
        "id": new_id,
        "olusturan_id": olusturan_id,
        "durum": "beklemede",
        "puan": None,
        "olusturma_tarihi": datetime.now(timezone.utc).isoformat(),
        "tamamlanma_tarihi": None
    })
    
    await db.tasks.insert_one(task_dict)
    return Task(**task_dict)

@api_router.put("/tasks/{task_id}", response_model=Task)
async def update_task(task_id: int, task_update: TaskUpdate):
    existing = await db.tasks.find_one({"id": task_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Görev bulunamadı")
    
    update_data = {k: v for k, v in task_update.model_dump().items() if v is not None}
    
    # If task is being marked as completed, set completion date
    if update_data.get("durum") == "tamamlandi" and not existing.get("tamamlanma_tarihi"):
        update_data["tamamlanma_tarihi"] = datetime.now(timezone.utc).isoformat()
    
    if update_data:
        await db.tasks.update_one({"id": task_id}, {"$set": update_data})
    
    updated = await db.tasks.find_one({"id": task_id}, {"_id": 0})
    return Task(**updated)

@api_router.delete("/tasks/{task_id}")
async def delete_task(task_id: int):
    result = await db.tasks.delete_one({"id": task_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Görev bulunamadı")
    return {"message": "Görev silindi"}

# ==================== AVANS ROUTES ====================

@api_router.get("/avans", response_model=List[Avans])
async def get_all_avans():
    avans_list = await db.avans.find({}, {"_id": 0}).sort("id", -1).to_list(1000)
    return avans_list

@api_router.get("/avans/employee/{employee_id}", response_model=List[Avans])
async def get_employee_avans(employee_id: int):
    avans_list = await db.avans.find({"employee_id": employee_id}, {"_id": 0}).sort("id", -1).to_list(1000)
    return avans_list

@api_router.post("/avans", response_model=Avans)
async def create_avans(avans: AvansCreate, olusturan_id: int):
    # Check if employee exists
    employee = await db.employees.find_one({"id": avans.employee_id})
    if not employee:
        raise HTTPException(status_code=404, detail="Personel bulunamadı")
    
    new_id = await get_next_id("avans")
    avans_dict = avans.model_dump()
    avans_dict.update({
        "id": new_id,
        "olusturan_id": olusturan_id
    })
    
    await db.avans.insert_one(avans_dict)
    return Avans(**avans_dict)

@api_router.delete("/avans/{avans_id}")
async def delete_avans(avans_id: int):
    result = await db.avans.delete_one({"id": avans_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Avans kaydı bulunamadı")
    return {"message": "Avans kaydı silindi"}

# ==================== YEMEK ÜCRETİ ROUTES ====================

@api_router.get("/yemek-ucreti", response_model=List[YemekUcreti])
async def get_all_yemek_ucreti():
    yemek_list = await db.yemek_ucreti.find({}, {"_id": 0}).to_list(1000)
    return yemek_list

@api_router.get("/yemek-ucreti/employee/{employee_id}")
async def get_employee_yemek_ucreti(employee_id: int):
    yemek = await db.yemek_ucreti.find_one({"employee_id": employee_id}, {"_id": 0})
    if not yemek:
        # Return default 0 if not found
        return {"id": 0, "employee_id": employee_id, "gunluk_ucret": 0}
    return yemek

@api_router.post("/yemek-ucreti")
async def create_or_update_yemek_ucreti(employee_id: int, gunluk_ucret: float):
    # Check if employee exists
    employee = await db.employees.find_one({"id": employee_id})
    if not employee:
        raise HTTPException(status_code=404, detail="Personel bulunamadı")
    
    # Check if already exists
    existing = await db.yemek_ucreti.find_one({"employee_id": employee_id})
    
    if existing:
        # Update
        await db.yemek_ucreti.update_one(
            {"employee_id": employee_id},
            {"$set": {"gunluk_ucret": gunluk_ucret}}
        )
        updated = await db.yemek_ucreti.find_one({"employee_id": employee_id}, {"_id": 0})
        return updated
    else:
        # Create new
        new_id = await get_next_id("yemek_ucreti")
        yemek_dict = {
            "id": new_id,
            "employee_id": employee_id,
            "gunluk_ucret": gunluk_ucret
        }
        await db.yemek_ucreti.insert_one(yemek_dict)
        return yemek_dict

# ==================== SALARY ROUTES ====================

@api_router.get("/salary/{employee_id}/{ay}")
async def calculate_salary(employee_id: int, ay: str):
    """Calculate salary for an employee for a specific month (YYYY-MM format)"""
    # Get employee
    employee = await db.employees.find_one({"id": employee_id})
    if not employee:
        raise HTTPException(status_code=404, detail="Personel bulunamadı")
    
    # Get attendance records for the month
    year, month = ay.split("-")
    attendance_records = await db.attendance.find({
        "employee_id": employee["employee_id"],
        "tarih": {"$regex": f"^{ay}"},
        "status": "cikis"
    }, {"_id": 0}).to_list(1000)
    
    total_hours = sum(record.get("calisilan_saat", 0) for record in attendance_records)
    
    # Simple calculation: base salary
    temel_maas = employee.get("maas_tabani", 0)
    toplam_maas = temel_maas
    
    salary_record = {
        "id": 1,
        "employee_id": employee_id,
        "ay": ay,
        "temel_maas": temel_maas,
        "calisilan_saat": round(total_hours, 2),
        "toplam_maas": toplam_maas,
        "hesaplama_tarihi": datetime.now(timezone.utc).isoformat()
    }
    
    return SalaryRecord(**salary_record)

@api_router.get("/salary-all/{ay}")
async def calculate_all_salaries(ay: str):
    """Calculate detailed salaries for all employees for a specific month"""
    employees = await db.employees.find({}, {"_id": 0}).to_list(1000)
    
    salary_records = []
    for employee in employees:
        year, month = ay.split("-")
        
        # Get attendance records for the month
        attendance_records = await db.attendance.find({
            "employee_id": employee["employee_id"],
            "tarih": {"$regex": f"^{ay}"},
            "status": "cikis"
        }, {"_id": 0}).to_list(1000)
        
        # Calculate total hours and days worked
        total_hours = sum(record.get("calisilan_saat", 0) for record in attendance_records)
        calisilan_gun = len(attendance_records)
        
        # Base calculations
        temel_maas = employee.get("maas_tabani", 0)
        gunluk_maas = temel_maas / 30
        saatlik_maas = gunluk_maas / 9  # 9 saat mesai
        
        # Calculate earned amount based on days worked
        hakedilen_maas = gunluk_maas * calisilan_gun
        
        # Get yemek ücreti
        yemek = await db.yemek_ucreti.find_one({"employee_id": employee["id"]})
        gunluk_yemek = yemek.get("gunluk_ucret", 0) if yemek else 0
        toplam_yemek = gunluk_yemek * calisilan_gun
        
        # Get avans for this month
        avans_records = await db.avans.find({
            "employee_id": employee["id"],
            "tarih": {"$regex": f"^{ay}"}
        }, {"_id": 0}).to_list(1000)
        toplam_avans = sum(record.get("miktar", 0) for record in avans_records)
        
        # Final calculation
        toplam_maas = hakedilen_maas + toplam_yemek - toplam_avans
        
        salary_records.append({
            "employee_id": employee["id"],
            "ad": employee["ad"],
            "soyad": employee["soyad"],
            "pozisyon": employee["pozisyon"],
            "ay": ay,
            "temel_maas": temel_maas,
            "gunluk_maas": round(gunluk_maas, 2),
            "saatlik_maas": round(saatlik_maas, 2),
            "calisilan_gun": calisilan_gun,
            "calisilan_saat": round(total_hours, 2),
            "hakedilen_maas": round(hakedilen_maas, 2),
            "gunluk_yemek_ucreti": gunluk_yemek,
            "toplam_yemek": round(toplam_yemek, 2),
            "toplam_avans": round(toplam_avans, 2),
            "toplam_maas": round(toplam_maas, 2)
        })
    
    return salary_records

# ==================== SEED DATA ROUTE ====================

@api_router.post("/seed-data")
async def seed_initial_data():
    """Initialize database with demo data"""
    
    # Clear existing data
    await db.employees.delete_many({})
    await db.roles.delete_many({})
    await db.shift_types.delete_many({})
    await db.attendance.delete_many({})
    await db.leave_records.delete_many({})
    await db.shift_calendar.delete_many({})
    await db.tasks.delete_many({})
    
    # Seed Roles
    roles = [
        {
            "id": "admin",
            "name": "Admin",
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
                "edit_employees": True
            }
        },
        {
            "id": "sistem_yoneticisi",
            "name": "Sistem Yöneticisi",
            "permissions": {
                "view_dashboard": True,
                "view_tasks": True,
                "assign_tasks": False,
                "rate_tasks": False,
                "manage_shifts": True,
                "manage_leave": True,
                "view_salary": False,
                "manage_roles": False,
                "manage_shifts_types": True,
                "edit_employees": False
            }
        },
        {
            "id": "sef",
            "name": "Şef",
            "permissions": {
                "view_dashboard": True,
                "view_tasks": True,
                "assign_tasks": True,
                "rate_tasks": True,
                "manage_shifts": False,
                "manage_leave": False,
                "view_salary": False,
                "manage_roles": False,
                "manage_shifts_types": False,
                "edit_employees": False
            }
        },
        {
            "id": "personel",
            "name": "Personel",
            "permissions": {
                "view_dashboard": True,
                "view_tasks": True,
                "assign_tasks": False,
                "rate_tasks": False,
                "manage_shifts": False,
                "manage_leave": False,
                "view_salary": False,
                "manage_roles": False,
                "manage_shifts_types": False,
                "edit_employees": False
            }
        }
    ]
    await db.roles.insert_many(roles)
    
    # Seed Employees
    employees = [
        {"id": 1, "ad": "Ahmet", "soyad": "Yılmaz", "pozisyon": "Yazılımcı", "maas_tabani": 15000, "rol": "admin", "email": "admin@example.com", "employee_id": "1001"},
        {"id": 2, "ad": "Fatma", "soyad": "Demir", "pozisyon": "Tasarımcı", "maas_tabani": 12000, "rol": "personel", "email": "fatma@example.com", "employee_id": "1002"},
        {"id": 3, "ad": "Kerem", "soyad": "Ateş", "pozisyon": "Chef", "maas_tabani": 14000, "rol": "sef", "email": "sef@example.com", "employee_id": "1003"},
        {"id": 4, "ad": "Ayşe", "soyad": "Kaya", "pozisyon": "Muhasebeci", "maas_tabani": 13000, "rol": "personel", "email": "ayse@example.com", "employee_id": "1004"},
        {"id": 5, "ad": "Mehmet", "soyad": "Şahin", "pozisyon": "IT Yöneticisi", "maas_tabani": 16000, "rol": "sistem_yoneticisi", "email": "mehmet@example.com", "employee_id": "1005"},
        {"id": 6, "ad": "Arda", "soyad": "Yıldız", "pozisyon": "Pazarlama Müdürü", "maas_tabani": 28000, "rol": "personel", "email": "arda@example.com", "employee_id": "2001"}
    ]
    await db.employees.insert_many(employees)
    
    # Seed Shift Types
    shift_types = [
        {"id": "sabah", "name": "🌅 Sabah (09:00-18:00)", "start": "09:00", "end": "18:00", "color": "bg-yellow-500"},
        {"id": "ogle_sonra", "name": "☀️ Öğleden Sonra (13:00-22:00)", "start": "13:00", "end": "22:00", "color": "bg-orange-500"},
        {"id": "gece", "name": "🌙 Gece (22:00-07:00)", "start": "22:00", "end": "07:00", "color": "bg-indigo-600"}
    ]
    await db.shift_types.insert_many(shift_types)
    
    # Seed some attendance records
    today = datetime.now(timezone.utc).date().isoformat()
    yesterday = (datetime.now(timezone.utc).date() - timedelta(days=1)).isoformat()
    two_days_ago = (datetime.now(timezone.utc).date() - timedelta(days=2)).isoformat()
    three_days_ago = (datetime.now(timezone.utc).date() - timedelta(days=3)).isoformat()
    four_days_ago = (datetime.now(timezone.utc).date() - timedelta(days=4)).isoformat()
    
    attendance = [
        {
            "id": 1,
            "employee_id": "1001",
            "ad": "Ahmet",
            "soyad": "Yılmaz",
            "tarih": today,
            "giris_saati": datetime.now(timezone.utc).replace(hour=9, minute=0).isoformat(),
            "cikis_saati": None,
            "calisilan_saat": 0,
            "status": "giris"
        },
        {
            "id": 2,
            "employee_id": "1002",
            "ad": "Fatma",
            "soyad": "Demir",
            "tarih": yesterday,
            "giris_saati": (datetime.now(timezone.utc) - timedelta(days=1)).replace(hour=9, minute=0).isoformat(),
            "cikis_saati": (datetime.now(timezone.utc) - timedelta(days=1)).replace(hour=18, minute=0).isoformat(),
            "calisilan_saat": 9.0,
            "status": "cikis"
        },
        {
            "id": 3,
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
        {"id": 1, "employee_id": 1, "gunluk_ucret": 150},
        {"id": 2, "employee_id": 2, "gunluk_ucret": 150},
        {"id": 3, "employee_id": 3, "gunluk_ucret": 180},
        {"id": 4, "employee_id": 4, "gunluk_ucret": 150},
        {"id": 5, "employee_id": 5, "gunluk_ucret": 180},
        {"id": 6, "employee_id": 6, "gunluk_ucret": 202}
    ]
    await db.yemek_ucreti.insert_many(yemek_ucretleri)
    
    # Seed avans kayıtları (Arda için örnek)
    current_month = datetime.now(timezone.utc).date().isoformat()[:7]
    avans_list = [
        {"id": 1, "employee_id": 6, "miktar": 5000, "tarih": f"{current_month}-05", "aciklama": "Kira ödemesi için avans", "olusturan_id": 1},
        {"id": 2, "employee_id": 6, "miktar": 2000, "tarih": f"{current_month}-15", "aciklama": "Acil ihtiyaç", "olusturan_id": 1},
        {"id": 3, "employee_id": 2, "miktar": 1500, "tarih": f"{current_month}-10", "aciklama": "Avans talebi", "olusturan_id": 1}
    ]
    await db.avans.insert_many(avans_list)
    
    # Seed some leave records
    leave_records = [
        {"id": 1, "employee_id": 2, "tarih": "2025-02-15", "leave_type": "izin", "notlar": "Kişisel işler"},
        {"id": 2, "employee_id": 4, "tarih": "2025-02-20", "leave_type": "hastalik", "notlar": "Grip"}
    ]
    await db.leave_records.insert_many(leave_records)
    
    # Seed some tasks
    tasks = [
        {
            "id": 1,
            "baslik": "Website Tasarımı",
            "aciklama": "Yeni kurumsal website tasarımı yapılacak",
            "atanan_personel_ids": [2],
            "olusturan_id": 1,
            "durum": "devam_ediyor",
            "puan": None,
            "olusturma_tarihi": (datetime.now(timezone.utc) - timedelta(days=2)).isoformat(),
            "tamamlanma_tarihi": None
        },
        {
            "id": 2,
            "baslik": "Yeni Menü Hazırlığı",
            "aciklama": "Bahar menüsü için yeni yemekler geliştirilecek",
            "atanan_personel_ids": [3],
            "olusturan_id": 1,
            "durum": "beklemede",
            "puan": None,
            "olusturma_tarihi": datetime.now(timezone.utc).isoformat(),
            "tamamlanma_tarihi": None
        }
    ]
    await db.tasks.insert_many(tasks)
    
    return {"message": "Demo veriler başarıyla yüklendi"}

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
