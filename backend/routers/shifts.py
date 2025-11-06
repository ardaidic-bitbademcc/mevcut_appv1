from fastapi import APIRouter, HTTPException
from typing import List, Optional
from datetime import datetime, timezone, timedelta
from ..database import db, get_next_id
from ..models import ShiftType, ShiftTypeCreate, LeaveRecord, LeaveRecordCreate, ShiftCalendar, ShiftCalendarCreate

router = APIRouter()

# Shift Type Routes
@router.get("/shift-types", response_model=List[ShiftType])
async def get_shift_types():
    shift_types = await db.shift_types.find().to_list(None)
    return shift_types

@router.post("/shift-types", response_model=ShiftType)
async def create_shift_type(shift_type: ShiftTypeCreate):
    import uuid
    new_shift_type = {
        "id": str(uuid.uuid4()),
        **shift_type.dict()
    }
    await db.shift_types.insert_one(new_shift_type)
    return new_shift_type

@router.delete("/shift-types/{shift_type_id}")
async def delete_shift_type(shift_type_id: str):
    result = await db.shift_types.delete_one({"id": shift_type_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Shift type not found")
    return {"message": "Shift type deleted successfully"}

# Leave Records Routes
@router.get("/leave-records", response_model=List[LeaveRecord])
async def get_leave_records(company_id: int = 1):
    leaves = await db.leave_records.find({"company_id": company_id}).to_list(None)
    return leaves


@router.post("/leave-records", response_model=LeaveRecord)
async def create_leave_record(leave: LeaveRecordCreate):
    next_id = await get_next_id("leave_records")
    new_leave = {
        "id": next_id,
        **leave.dict()
    }
    await db.leave_records.insert_one(new_leave)
    return new_leave


@router.delete("/leave-records/{leave_id}")
async def delete_leave_record(leave_id: int):
    result = await db.leave_records.delete_one({"id": leave_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Leave record not found")
    return {"message": "Leave record deleted successfully"}


# Shift Calendar Routes
@router.get("/shift-calendar", response_model=List[ShiftCalendar])
async def get_shift_calendar(company_id: int = 1):
    shifts = await db.shift_calendar.find({"company_id": company_id}).to_list(None)
    return shifts


@router.post("/shift-calendar", response_model=ShiftCalendar)
async def create_shift_calendar(shift: ShiftCalendarCreate):
    next_id = await get_next_id("shift_calendar")
    new_shift = {
        "id": next_id,
        **shift.dict()
    }
    await db.shift_calendar.insert_one(new_shift)
    return new_shift


@router.delete("/shift-calendar/{shift_id}")
async def delete_shift_calendar(shift_id: int):
    result = await db.shift_calendar.delete_one({"id": shift_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Shift not found")
    return {"message": "Shift deleted successfully"}


@router.get("/shift-calendar/weekly/{employee_id}")
async def get_weekly_shift_calendar(employee_id: int, start_date: Optional[str] = None):
    # If start_date provided (YYYY-MM-DD), return that week (start_date to start_date+6)
    query = {"employee_id": str(employee_id)}
    all_shifts = await db.shift_calendar.find(query).to_list(None)

    # Preload related data to enrich shift objects in a JSON-serializable way
    # Collect unique shift_type ids and team member ids
    shift_type_ids = set()
    member_employee_ids = set()
    for s in all_shifts:
        st = s.get("shift_type")
        if isinstance(st, (str, int)):
            shift_type_ids.add(str(st))
        elif isinstance(st, dict) and st.get("id"):
            shift_type_ids.add(str(st.get("id")))

        members = s.get("team_members") or s.get("members") or []
        if isinstance(members, list):
            for m in members:
                # members may be employee_id strings or numeric ids or full objects
                if isinstance(m, dict) and m.get("employee_id"):
                    member_employee_ids.add(str(m.get("employee_id")))
                elif isinstance(m, (str, int)):
                    member_employee_ids.add(str(m))

    # Fetch shift type documents by id (if any)
    shift_types_map = {}
    if shift_type_ids:
        # try to find by id or by name fallback
        types = await db.shift_types.find({"id": {"$in": list(shift_type_ids)}}).to_list(None)
        for t in types:
            shift_types_map[str(t.get("id"))] = {
                "id": t.get("id"),
                "name": t.get("name"),
                "start": t.get("start"),
                "end": t.get("end"),
                "color": t.get("color")
            }

    # Fetch member employee docs
    employees_map = {}
    if member_employee_ids:
        # employee_id is stored as string in employees collection
        emps = await db.employees.find({"employee_id": {"$in": list(member_employee_ids)}}).to_list(None)
        for e in emps:
            employees_map[str(e.get("employee_id"))] = {
                "id": e.get("id"),
                "employee_id": e.get("employee_id"),
                "ad": e.get("ad"),
                "soyad": e.get("soyad"),
                "pozisyon": e.get("pozisyon")
            }

    # Build enriched, safe shift objects
    def enrich_shift(s):
        # Base fields
        st_raw = s.get("shift_type")
        st_obj = None
        if isinstance(st_raw, dict):
            st_obj = {
                "id": st_raw.get("id"),
                "name": st_raw.get("name"),
                "start": st_raw.get("start"),
                "end": st_raw.get("end"),
                "color": st_raw.get("color")
            }
        elif st_raw is not None:
            st_obj = shift_types_map.get(str(st_raw))

        members = s.get("team_members") or s.get("members") or []
        tm = []
        if isinstance(members, list):
            for m in members:
                if isinstance(m, dict):
                    # already full object
                    tm.append({
                        "id": m.get("id"),
                        "employee_id": m.get("employee_id"),
                        "ad": m.get("ad"),
                        "soyad": m.get("soyad"),
                        "pozisyon": m.get("pozisyon")
                    })
                else:
                    e = employees_map.get(str(m))
                    if e:
                        tm.append(e)

        hours = s.get("hours") if s.get("hours") is not None else s.get("calisilan_saat")

        # determine type field expected by frontend: 'izin' or 'vardiya' or 'none'
        s_type = s.get("type") or s.get("shift_kind")
        if not s_type:
            s_type = 'izin' if s.get("is_leave") else ('vardiya' if st_obj else 'none')

        return {
            "id": s.get("id") or (str(s.get("_id")) if s.get("_id") else None),
            "_id": str(s.get("_id")) if s.get("_id") is not None else None,
            "company_id": s.get("company_id"),
            "employee_id": s.get("employee_id"),
            "tarih": s.get("tarih"),
            "type": s_type,
            "shift_type": st_obj,
            "shift_type_name": (st_obj and st_obj.get("name")) or (s.get("shift_type_name") or None),
            "start": s.get("start") or (st_obj and st_obj.get("start")),
            "end": s.get("end") or (st_obj and st_obj.get("end")),
            "hours": hours,
            "team_members": tm,
            "location": s.get("location") or None,
            "tags": s.get("tags") or [],
        }

    safe_shifts = [enrich_shift(s) for s in all_shifts]

    # default response shape for compatibility with frontend expects an object
    # containing employee, start_date, end_date, shifts
    employee = await db.employees.find_one({"employee_id": str(employee_id)})
    safe_employee = None
    if employee:
        safe_employee = {
            "id": employee.get("id"),
            "employee_id": employee.get("employee_id"),
            "ad": employee.get("ad"),
            "soyad": employee.get("soyad"),
            "company_id": employee.get("company_id"),
            "pozisyon": employee.get("pozisyon"),
        }

    if not start_date:
        return {
            "employee": safe_employee or {},
            "start_date": None,
            "end_date": None,
            "shifts": safe_shifts,
        }

    try:
        sd = datetime.fromisoformat(start_date).date()
    except Exception:
        # invalid date format, return all in same shape
        return {
            "employee": safe_employee or {},
            "start_date": None,
            "end_date": None,
            "shifts": safe_shifts,
        }

    end_date = sd + timedelta(days=6)
    # Filter by tarih field (assumed ISO date string)
    filtered = [s for s in safe_shifts if s.get('tarih') and sd.isoformat() <= s['tarih'] <= end_date.isoformat()]

    return {
        "employee": safe_employee or {},
        "start_date": sd.isoformat(),
        "end_date": end_date.isoformat(),
        "shifts": filtered,
    }
