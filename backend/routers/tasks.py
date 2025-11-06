from fastapi import APIRouter, HTTPException
from typing import List, Optional
from datetime import datetime, timezone
from ..database import db, get_next_id
from ..models import Task, TaskCreate
from ..server import logger

router = APIRouter()

# Task Routes
@router.get("/tasks", response_model=List[Task])
async def get_tasks(company_id: int = 1, status: Optional[str] = None):
    query = {"company_id": company_id}
    if status:
        query["durum"] = status
    tasks = await db.tasks.find(query).to_list(None)
    return tasks

@router.post("/tasks", response_model=Task)
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

@router.put("/tasks/{task_id}/status")
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

@router.put("/tasks/{task_id}/rate")
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

@router.delete("/tasks/{task_id}")
async def delete_task(task_id: int):
    result = await db.tasks.delete_one({"id": task_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Task not found")
    return {"message": "Task deleted successfully"}
