from fastapi import APIRouter, HTTPException, status
from typing import List, Optional
import bcrypt
from ..database import db, get_next_id
from ..models import Employee, EmployeeCreate, EmployeeUpdate, LoginRequest, LoginResponse
from ..server import logger

router = APIRouter()

# Employee Routes
@router.get("/employees", response_model=List[Employee])
async def get_employees(company_id: int = 1):
    employees = await db.employees.find({"company_id": company_id}).to_list(None)
    return employees

@router.post("/employees", response_model=Employee)
async def create_employee(employee: EmployeeCreate):
    next_id = await get_next_id("employees")
    new_employee = {
        "id": next_id,
        **employee.dict()
    }
    await db.employees.insert_one(new_employee)
    return new_employee


# Simple register endpoint to support frontend registration flow
@router.post("/register")
async def register(data: dict):
    """Register a new employee with minimal required fields.

    Expected JSON: { ad, soyad, email, employee_id, company_id(optional) }
    Returns a success wrapper to match existing frontend expectations.
    """
    # Validate required fields
    required = ["ad", "soyad", "email", "employee_id"]
    for field in required:
        if not data.get(field):
            raise HTTPException(status_code=400, detail=f"Missing field: {field}")

    # Check if user already exists by email or employee_id
    existing = await db.employees.find_one({
        "$or": [
            {"email": data["email"]},
            {"employee_id": data["employee_id"]}
        ]
    })

    if existing:
        raise HTTPException(status_code=400, detail="User with that email or employee_id already exists")

    next_id = await get_next_id("employees")
    new_employee = {
        "id": next_id,
        "company_id": data.get("company_id", 1),
        "ad": data["ad"],
        "soyad": data["soyad"],
        "pozisyon": data.get("pozisyon", ""),
        "maas_tabani": data.get("maas_tabani", 0),
        "rol": data.get("rol", "personel"),
        "email": data["email"],
        "employee_id": data["employee_id"]
        # If a password was provided on registration, hash and store it
    }

    if data.get("password"):
        try:
            hashed = bcrypt.hashpw(data.get("password").encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
            new_employee["password"] = hashed
        except Exception as e:
            logger.error(f"Error hashing password during registration for {data.get('email')}: {e}")
            raise HTTPException(status_code=500, detail="Error processing password")

    await db.employees.insert_one(new_employee)

    return {"success": True, "employee": new_employee, "message": "Kayıt başarılı"}

@router.put("/employees/{employee_id}", response_model=Employee)
async def update_employee(employee_id: int, employee_update: EmployeeUpdate):
    update_data = {k: v for k, v in employee_update.dict().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    # If password present, hash it before storing
    if "password" in update_data:
        try:
            hashed = bcrypt.hashpw(update_data["password"].encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
            update_data["password"] = hashed
        except Exception as e:
            logger.error(f"Error hashing password for employee {employee_id}: {e}")
            raise HTTPException(status_code=500, detail="Error processing password")

    result = await db.employees.update_one(
        {"id": employee_id},
        {"$set": update_data}
    )

    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Employee not found")

    updated_employee = await db.employees.find_one({"id": employee_id})
    return updated_employee

@router.delete("/employees/{employee_id}")
async def delete_employee(employee_id: int):
    result = await db.employees.delete_one({"id": employee_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Employee not found")
    return {"message": "Employee deleted successfully"}

# Login Route
@router.post("/login", response_model=LoginResponse)
async def login(login_data: LoginRequest):
    logger.info(f"Login attempt with data: email={login_data.email}, employee_id={login_data.employee_id}, company_id={login_data.company_id}")

    # Find employee by email or employee_id
    if login_data.email:
        employee = await db.employees.find_one({"email": login_data.email})
        logger.info(f"Searching by email: {login_data.email}, Found: {employee is not None}")
    elif login_data.employee_id:
        employee = await db.employees.find_one({
            "employee_id": login_data.employee_id,
            "company_id": login_data.company_id
        })
        logger.info(f"Searching by employee_id: {login_data.employee_id}, Found: {employee is not None}")
    else:
        logger.warning("No email or employee_id provided")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email or employee_id required"
        )

    if not employee:
        logger.error(f"Employee not found for: {login_data.email or login_data.employee_id}")
        # Try to help debug - check if employee exists without company_id filter
        if login_data.employee_id:
            any_employee = await db.employees.find_one({"employee_id": login_data.employee_id})
            if any_employee:
                logger.info(f"Found employee with different company_id: {any_employee.get('company_id')}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )

    # Check if password field exists
    stored_password = employee.get("password")

    if stored_password:
        # Require a provided password for users with stored (hashed) passwords
        if not login_data.password:
            logger.warning(f"Password not provided for user with stored password: {employee.get('employee_id')}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password required"
            )

        # Normalize stored_password to bytes
        if isinstance(stored_password, str):
            stored_pw_bytes = stored_password.encode('utf-8')
        else:
            stored_pw_bytes = bytes(stored_password)

        # Check hashed password
        password_match = bcrypt.checkpw(login_data.password.encode('utf-8'), stored_pw_bytes)

        if not password_match:
            logger.error(f"Password mismatch for user: {employee.get('employee_id')}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid password"
            )
    else:
        # User has no password set, so authentication fails.
        logger.warning(f"User {employee.get('employee_id')} has no password and cannot log in.")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid password"
        )

    logger.info(f"Login successful for: {employee.get('employee_id')}")

    return LoginResponse(
        id=employee["id"],
        email=employee["email"],
        ad=employee["ad"],
        soyad=employee["soyad"],
        rol=employee["rol"],
        employee_id=employee["employee_id"],
        company_id=employee["company_id"],
        pozisyon=employee["pozisyon"]
    )
