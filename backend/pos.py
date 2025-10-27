from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone

# Import shared objects from server; server imports this module after api_router is defined
from .server import api_router, db, logger, get_next_id


class MenuItemCreate(BaseModel):
    name: str
    price: float
    description: Optional[str] = None
    # If recipe is provided, this menu item will reduce stock when ordered
    recipe: Optional[List[Dict[str, Any]]] = None  # list of { "stok_urun_id": int, "quantity": float }
    active: bool = True


class MenuItem(MenuItemCreate):
    id: int


class OrderItemCreate(BaseModel):
    menu_item_id: int
    quantity: int = 1


class OrderCreate(BaseModel):
    company_id: Optional[int] = 1
    table: Optional[str] = None
    customer: Optional[str] = None
    items: List[OrderItemCreate]
    note: Optional[str] = None


class Order(BaseModel):
    id: int
    adisyon_no: int
    company_id: int
    table: Optional[str]
    customer: Optional[str]
    items: List[Dict[str, Any]]
    total: float
    created_at: str
    status: str


def _compute_order_total(items: List[Dict[str, Any]]) -> float:
    return round(sum([it.get("price", 0) * it.get("quantity", 1) for it in items]), 2)


def _trigger_print(order: Dict[str, Any]) -> bool:
    """Placeholder for thermal printer integration.

    Replace this with a call to CUPS, network printer, or a background job queue that talks to a local printing service.
    For now we log and return True to indicate success.
    """
    try:
        logger.info("[POS PRINT] Printing adisyon %s for table=%s total=%s", order.get("adisyon_no"), order.get("table"), order.get("total"))
        # TODO: enqueue print job in Redis or call external print service
        return True
    except Exception:
        logger.exception("Failed to trigger print for order %s", order.get("id"))
        return False


@api_router.post("/pos/menu-item")
async def create_menu_item(payload: MenuItemCreate):
    next_id = await get_next_id("menu_items")
    doc = {
        "id": next_id,
        "name": payload.name,
        "price": float(payload.price),
        "description": payload.description,
        "recipe": payload.recipe or [],
        "active": bool(payload.active),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.menu_items.insert_one(doc)
    return doc


@api_router.get("/pos/menu-items")
async def list_menu_items(company_id: int = 1):
    items = await db.menu_items.find({}).to_list(None)
    return items


@api_router.post("/pos/order")
async def create_order(payload: OrderCreate):
    # Build full item records (price/name) and compute required ingredient totals
    menu_item_ids = [it.menu_item_id for it in payload.items]
    menu_docs = await db.menu_items.find({"id": {"$in": menu_item_ids}}).to_list(None)
    menu_map = {m["id"]: m for m in menu_docs}

    order_items = []
    ingredient_requirements = {}  # stok_urun_id -> total quantity needed

    for it in payload.items:
        m = menu_map.get(it.menu_item_id)
        if not m or not m.get("active", True):
            raise Exception(f"Menu item {it.menu_item_id} not found or inactive")

        qty = int(it.quantity or 1)
        order_items.append({"menu_item_id": m["id"], "name": m.get("name"), "price": float(m.get("price", 0)), "quantity": qty})

        # accumulate ingredients from recipe if present
        recipe = m.get("recipe") or []
        for ingredient in recipe:
            sid = int(ingredient.get("stok_urun_id"))
            need = float(ingredient.get("quantity", 0)) * qty
            ingredient_requirements[sid] = ingredient_requirements.get(sid, 0) + need

    # Check stock availability for all required stok_urun
    insufficient = []
    for sid, need in ingredient_requirements.items():
        doc = await db.stok_urun.find_one({"id": sid})
        current = float(doc.get("mevcut", doc.get("min_stok", 0))) if doc else 0
        if current < need:
            insufficient.append({"stok_urun_id": sid, "needed": need, "available": current})

    if insufficient:
        return {"success": False, "error": "insufficient_stock", "details": insufficient}

    # Deduct stock (best-effort). Note: for atomicity, real systems should use DB transactions or background compensation.
    for sid, need in ingredient_requirements.items():
        await db.stok_urun.update_one({"id": sid}, {"$inc": {"mevcut": -need}})

    # Create order record
    next_id = await get_next_id("orders")
    adisyon_no = next_id
    total = _compute_order_total(order_items)

    order_doc = {
        "id": next_id,
        "adisyon_no": adisyon_no,
        "company_id": int(payload.company_id or 1),
        "table": payload.table,
        "customer": payload.customer,
        "items": order_items,
        "total": total,
        "note": payload.note,
        "status": "open",
        "created_at": datetime.now(timezone.utc).isoformat()
    }

    await db.orders.insert_one(order_doc)

    # Trigger print asynchronously / best-effort
    try:
        _trigger_print(order_doc)
    except Exception:
        logger.exception("Printing failed for order %s", order_doc.get("id"))

    return {"success": True, "order": order_doc}


@api_router.get("/pos/order/{order_id}")
async def get_order(order_id: int):
    o = await db.orders.find_one({"id": order_id})
    if not o:
        raise Exception("Order not found")
    return o


@api_router.post("/pos/print/{order_id}")
async def print_order(order_id: int):
    o = await db.orders.find_one({"id": order_id})
    if not o:
        return {"success": False, "error": "not_found"}
    ok = _trigger_print(o)
    return {"success": bool(ok)}
