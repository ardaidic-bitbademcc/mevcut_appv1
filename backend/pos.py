from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone

# Import shared objects from server; server imports this module after api_router is defined
from .server import api_router, db, logger, get_next_id


class MenuItemCreate(BaseModel):
    name: str
    price: float
    description: Optional[str] = None
    # Category id (optional)
    category_id: Optional[int] = None
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
    payments: Optional[List[Dict[str, Any]]] = None


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
        "category_id": int(payload.category_id) if payload.category_id is not None else None,
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


# --- Categories endpoints ---
@api_router.post("/pos/categories")
async def create_category(payload: Dict[str, Any]):
    name = payload.get("name")
    if not name:
        raise Exception("Category name required")
    next_id = await get_next_id("pos_categories")
    doc = {"id": next_id, "name": name, "created_at": datetime.now(timezone.utc).isoformat()}
    await db.pos_categories.insert_one(doc)
    return doc


@api_router.get("/pos/categories")
async def list_categories():
    cats = await db.pos_categories.find({}).to_list(None)
    return cats


@api_router.put("/pos/categories/{category_id}")
async def update_category(category_id: int, payload: Dict[str, Any]):
    name = payload.get("name")
    if not name:
        raise Exception("Category name required")
    await db.pos_categories.update_one({"id": category_id}, {"$set": {"name": name}})
    return await db.pos_categories.find_one({"id": category_id})


@api_router.delete("/pos/categories/{category_id}")
async def delete_category(category_id: int):
    await db.pos_categories.delete_one({"id": category_id})
    # Optionally unset category_id on menu items
    await db.menu_items.update_many({"category_id": category_id}, {"$set": {"category_id": None}})
    return {"deleted": True}


# --- Tables & Zones endpoints ---
@api_router.post("/pos/zones")
async def create_zone(payload: Dict[str, Any]):
    name = payload.get("name")
    if not name:
        raise Exception("Zone name required")
    next_id = await get_next_id("pos_zones")
    doc = {"id": next_id, "name": name, "created_at": datetime.now(timezone.utc).isoformat()}
    await db.pos_zones.insert_one(doc)
    return doc


@api_router.get("/pos/zones")
async def list_zones():
    zones = await db.pos_zones.find({}).to_list(None)
    return zones


@api_router.put("/pos/zones/{zone_id}")
async def update_zone(zone_id: int, payload: Dict[str, Any]):
    name = payload.get("name")
    await db.pos_zones.update_one({"id": zone_id}, {"$set": {"name": name}})
    return await db.pos_zones.find_one({"id": zone_id})


@api_router.delete("/pos/zones/{zone_id}")
async def delete_zone(zone_id: int):
    await db.pos_zones.delete_one({"id": zone_id})
    # unset zone on tables
    await db.pos_tables.update_many({"zone_id": zone_id}, {"$set": {"zone_id": None}})
    return {"deleted": True}


@api_router.post("/pos/tables")
async def create_table(payload: Dict[str, Any]):
    name = payload.get("name")
    zone_id = payload.get("zone_id")
    if not name:
        raise Exception("Table name required")
    next_id = await get_next_id("pos_tables")
    doc = {"id": next_id, "name": name, "zone_id": int(zone_id) if zone_id else None, "created_at": datetime.now(timezone.utc).isoformat()}
    await db.pos_tables.insert_one(doc)
    return doc


@api_router.get("/pos/tables")
async def list_tables():
    tables = await db.pos_tables.find({}).to_list(None)
    return tables


@api_router.put("/pos/tables/{table_id}")
async def update_table(table_id: int, payload: Dict[str, Any]):
    update = {}
    if "name" in payload:
        update["name"] = payload.get("name")
    if "zone_id" in payload:
        update["zone_id"] = int(payload.get("zone_id")) if payload.get("zone_id") is not None else None
    await db.pos_tables.update_one({"id": table_id}, {"$set": update})
    return await db.pos_tables.find_one({"id": table_id})


@api_router.delete("/pos/tables/{table_id}")
async def delete_table(table_id: int):
    await db.pos_tables.delete_one({"id": table_id})
    return {"deleted": True}


# --- Demo seed for POS ---
@api_router.post("/pos/seed-demo")
async def seed_pos_demo():
    # Create categories
    await db.pos_categories.delete_many({})
    await db.menu_items.delete_many({})
    await db.pos_zones.delete_many({})
    await db.pos_tables.delete_many({})

    c_soft = {"id": 1, "name": "Soft İçecekler", "created_at": datetime.now(timezone.utc).isoformat()}
    c_coffee = {"id": 2, "name": "Kahve", "created_at": datetime.now(timezone.utc).isoformat()}
    await db.pos_categories.insert_many([c_soft, c_coffee])

    menu = [
        {"id": 1, "name": "Kola", "price": 35.0, "category_id": 1, "active": True},
        {"id": 2, "name": "Su", "price": 10.0, "category_id": 1, "active": True},
        {"id": 3, "name": "Limonata", "price": 25.0, "category_id": 1, "active": True},
        {"id": 4, "name": "Americano", "price": 40.0, "category_id": 2, "active": True},
        {"id": 5, "name": "Latte", "price": 45.0, "category_id": 2, "active": True},
        {"id": 6, "name": "Filtre Kahve", "price": 30.0, "category_id": 2, "active": True},
    ]
    await db.menu_items.insert_many(menu)

    # Zones and tables
    z1 = {"id": 1, "name": "Bahçe", "created_at": datetime.now(timezone.utc).isoformat()}
    z2 = {"id": 2, "name": "Salon", "created_at": datetime.now(timezone.utc).isoformat()}
    await db.pos_zones.insert_many([z1, z2])

    tables = [
        {"id": 1, "name": "B1", "zone_id": 1},
        {"id": 2, "name": "B2", "zone_id": 1},
        {"id": 3, "name": "S1", "zone_id": 2},
        {"id": 4, "name": "S2", "zone_id": 2},
    ]
    await db.pos_tables.insert_many(tables)

    return {"seeded": True}


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

    # Deduct stock with conditional updates to avoid negative inventory.
    # If any conditional update fails, roll back prior updates in this loop.
    updated_sides = []  # list of (sid, amount) we have decremented
    try:
        for sid, need in ingredient_requirements.items():
            res = await db.stok_urun.update_one({"id": sid, "mevcut": {"$gte": need}}, {"$inc": {"mevcut": -need}})
            if res.modified_count == 0:
                # failed to decrement (concurrent change or insufficient stock)
                insufficient.append({"stok_urun_id": sid, "needed": need, "available": (await db.stok_urun.find_one({"id": sid}) or {}).get("mevcut", 0)})
                raise RuntimeError("insufficient_or_concurrent_update")
            updated_sides.append((sid, need))
    except Exception as e:
        # Rollback any decremented stock for this order
        if updated_sides:
            for sid, amt in updated_sides:
                try:
                    await db.stok_urun.update_one({"id": sid}, {"$inc": {"mevcut": amt}})
                except Exception:
                    logger.exception("Failed to rollback stock for %s after order failure", sid)
        if insufficient:
            return {"success": False, "error": "insufficient_stock", "details": insufficient}
        # unexpected error
        logger.exception("Unexpected error during stock deduction: %s", e)
        return {"success": False, "error": "stock_update_failed", "details": str(e)}

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
        "created_at": datetime.now(timezone.utc).isoformat(),
        "payments": []
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


@api_router.post("/pos/order-pay")
async def create_order_and_pay(payload: Dict[str, Any]):
    """Create an order and immediately record a payment.

    Expected payload: { "order": { ...OrderCreate... }, "payment": { "method": "cash"|"card"|..., "amount": float, "details": {...} }}
    """
    order_payload = payload.get("order")
    payment = payload.get("payment")
    if not order_payload:
        raise Exception("order payload required")

    oc = OrderCreate(**order_payload)

    # Build full item records and ingredient requirements
    menu_item_ids = [it.get("menu_item_id") for it in oc.items]
    menu_docs = await db.menu_items.find({"id": {"$in": menu_item_ids}}).to_list(None)
    menu_map = {m["id"]: m for m in menu_docs}

    order_items = []
    ingredient_requirements = {}
    for it in oc.items:
        m = menu_map.get(int(it.get("menu_item_id")))
        if not m or not m.get("active", True):
            raise Exception(f"Menu item {it.get('menu_item_id')} not found or inactive")
        qty = int(it.get("quantity" or 1))
        order_items.append({"menu_item_id": m["id"], "name": m.get("name"), "price": float(m.get("price", 0)), "quantity": qty})
        recipe = m.get("recipe") or []
        for ingredient in recipe:
            sid = int(ingredient.get("stok_urun_id"))
            need = float(ingredient.get("quantity", 0)) * qty
            ingredient_requirements[sid] = ingredient_requirements.get(sid, 0) + need

    # Check stock
    insufficient = []
    for sid, need in ingredient_requirements.items():
        doc = await db.stok_urun.find_one({"id": sid})
        current = float(doc.get("mevcut", doc.get("min_stok", 0))) if doc else 0
        if current < need:
            insufficient.append({"stok_urun_id": sid, "needed": need, "available": current})
    if insufficient:
        return {"success": False, "error": "insufficient_stock", "details": insufficient}

    # Deduct stock with conditional updates and rollback on failure
    updated_sides = []
    try:
        for sid, need in ingredient_requirements.items():
            res = await db.stok_urun.update_one({"id": sid, "mevcut": {"$gte": need}}, {"$inc": {"mevcut": -need}})
            if res.modified_count == 0:
                insufficient.append({"stok_urun_id": sid, "needed": need, "available": (await db.stok_urun.find_one({"id": sid}) or {}).get("mevcut", 0)})
                raise RuntimeError("insufficient_or_concurrent_update")
            updated_sides.append((sid, need))
    except Exception as e:
        if updated_sides:
            for sid, amt in updated_sides:
                try:
                    await db.stok_urun.update_one({"id": sid}, {"$inc": {"mevcut": amt}})
                except Exception:
                    logger.exception("Failed to rollback stock for %s after order-pay failure", sid)
        if insufficient:
            return {"success": False, "error": "insufficient_stock", "details": insufficient}
        logger.exception("Unexpected error during stock deduction in order-pay: %s", e)
        return {"success": False, "error": "stock_update_failed", "details": str(e)}

    # Create order
    next_id = await get_next_id("orders")
    adisyon_no = next_id
    total = _compute_order_total(order_items)

    order_doc = {
        "id": next_id,
        "adisyon_no": adisyon_no,
        "company_id": int(oc.company_id or 1),
        "table": oc.table,
        "customer": oc.customer,
        "items": order_items,
        "total": total,
        "note": oc.note,
        "status": "paid" if payment and float(payment.get("amount", 0)) >= total else "open",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "payments": []
    }

    if payment:
        pay = {
            "method": payment.get("method"),
            "amount": float(payment.get("amount", 0)),
            "details": payment.get("details") or {},
            "recorded_at": datetime.now(timezone.utc).isoformat()
        }
        order_doc["payments"].append(pay)

    await db.orders.insert_one(order_doc)

    try:
        _trigger_print(order_doc)
    except Exception:
        logger.exception("Printing failed for order %s", order_doc.get("id"))

    return {"success": True, "order": order_doc}
