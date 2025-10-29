import os
import logging

logger = logging.getLogger(__name__)

def _coll_name(key, default):
    return os.environ.get(key, default)

async def ensure_pos_collections(db):
    """Ensure POS collections exist and indexes are in place. Non-destructive.

    This function is safe to call on startup. It only creates indexes on the
    POS collections, using collection names that can be overridden via env.
    """
    # collection names (overridable via env)
    PRODUCTS = _coll_name('POS_PRODUCTS_COLL', 'pos_products')
    VARIANTS = _coll_name('POS_PRODUCT_VARIANTS_COLL', 'pos_product_variants')
    CATEGORIES = _coll_name('POS_CATEGORIES_COLL', 'pos_categories')
    ORDERS = _coll_name('POS_ORDERS_COLL', 'pos_orders')
    ORDER_ITEMS = _coll_name('POS_ORDER_ITEMS_COLL', 'pos_order_items')
    PAYMENTS = _coll_name('POS_PAYMENTS_COLL', 'pos_payments')
    LOCATIONS = _coll_name('POS_INVENTORY_LOCATIONS_COLL', 'pos_inventory_locations')
    MOVEMENTS = _coll_name('POS_INVENTORY_MOVEMENTS_COLL', 'pos_inventory_movements')
    STOCK = _coll_name('POS_STOCK_LEVELS_COLL', 'pos_stock_levels')
    SETTINGS = _coll_name('POS_SETTINGS_COLL', 'pos_settings')
    AUDIT = _coll_name('POS_AUDIT_COLL', 'pos_audit_logs')

    try:
        # Text index for product search
        await db[PRODUCTS].create_index([('name', 'text'), ('sku', 1), ('barcode', 1)], name='pos_products_text_sku_barcode')
        # Variant quick lookups
        await db[VARIANTS].create_index([('productId', 1)], name='pos_variants_product_idx')
        await db[VARIANTS].create_index([('sku', 1)], name='pos_variants_sku_idx')
        # Orders recent first
        await db[ORDERS].create_index([('createdAt', -1), ('status', 1), ('createdByStaffId', 1)], name='pos_orders_recent')
        # Movements and stock
        await db[MOVEMENTS].create_index([('productVariantId', 1), ('createdAt', -1)], name='pos_movements_product_time')
        await db[STOCK].create_index([('productVariantId', 1), ('locationId', 1)], name='pos_stock_unique', unique=True)
        logger.info('POS collections and indexes ensured')
    except Exception:
        logger.exception('Failed to ensure POS collection indexes')
