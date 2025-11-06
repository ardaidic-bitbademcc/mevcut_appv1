from fastapi import APIRouter, HTTPException
from typing import List, Optional
from datetime import datetime, timezone
from ..database import db, get_next_id
from ..models import StokBirim, StokBirimCreate, StokKategori, StokKategoriCreate, StokUrun, StokUrunCreate, StokUrunUpdate, StokSayim, StokSayimCreate

router = APIRouter()

# Stok Routes
@router.get("/stok/birimler", response_model=List[StokBirim])
async def get_stok_birimleri(company_id: int = 1):
    birimler = await db.stok_birim.find({"company_id": company_id}).to_list(None)
    return birimler

@router.post("/stok/birimler", response_model=StokBirim)
async def create_stok_birim(birim: StokBirimCreate):
    next_id = await get_next_id("stok_birim")
    new_birim = {
        "id": next_id,
        **birim.dict()
    }
    await db.stok_birim.insert_one(new_birim)
    return new_birim

@router.delete("/stok/birimler/{birim_id}")
async def delete_stok_birim(birim_id: int):
    # Check if any products use this unit
    product_count = await db.stok_urun.count_documents({"birim_id": birim_id})
    if product_count > 0:
        raise HTTPException(status_code=400, detail="Cannot delete unit that is in use")

    result = await db.stok_birim.delete_one({"id": birim_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Unit not found")
    return {"message": "Unit deleted successfully"}

@router.get("/stok/kategoriler", response_model=List[StokKategori])
async def get_stok_kategorileri(company_id: int = 1):
    kategoriler = await db.stok_kategori.find({"company_id": company_id}).to_list(None)
    return kategoriler

@router.post("/stok/kategoriler", response_model=StokKategori)
async def create_stok_kategori(kategori: StokKategoriCreate):
    next_id = await get_next_id("stok_kategori")
    new_kategori = {
        "id": next_id,
        **kategori.dict()
    }
    await db.stok_kategori.insert_one(new_kategori)
    return new_kategori

@router.get("/stok/urunler", response_model=List[StokUrun])
async def get_stok_urunleri(company_id: int = 1):
    urunler = await db.stok_urun.find({"company_id": company_id}).to_list(None)
    return urunler

@router.post("/stok/urunler", response_model=StokUrun)
async def create_stok_urun(urun: StokUrunCreate):
    next_id = await get_next_id("stok_urun")
    new_urun = {
        "id": next_id,
        **urun.dict()
    }
    await db.stok_urun.insert_one(new_urun)
    return new_urun

@router.put("/stok/urunler/{urun_id}", response_model=StokUrun)
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

@router.delete("/stok/urunler/{urun_id}")
async def delete_stok_urun(urun_id: int):
    result = await db.stok_urun.delete_one({"id": urun_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"message": "Product deleted successfully"}


@router.put("/stok/kategoriler/{kategori_id}", response_model=StokKategori)
async def update_stok_kategori(kategori_id: int, kategori_update: StokKategoriCreate):
    update_data = {k: v for k, v in kategori_update.dict().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")

    result = await db.stok_kategori.update_one(
        {"id": kategori_id},
        {"$set": update_data}
    )

    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Category not found")

    updated_kategori = await db.stok_kategori.find_one({"id": kategori_id})
    return updated_kategori

@router.get("/stok/sayimlar", response_model=List[StokSayim])
async def get_stok_sayimlari(company_id: int = 1, urun_id: Optional[int] = None):
    query = {"company_id": company_id}
    if urun_id:
        query["urun_id"] = urun_id
    sayimlar = await db.stok_sayim.find(query).sort("tarih", -1).to_list(None)
    return sayimlar

@router.post("/stok/sayimlar", response_model=StokSayim)
async def create_stok_sayim(sayim: StokSayimCreate):
    next_id = await get_next_id("stok_sayim")
    new_sayim = {
        "id": next_id,
        "tarih": datetime.now(timezone.utc).date().isoformat(),
        **sayim.dict()
    }
    await db.stok_sayim.insert_one(new_sayim)
    return new_sayim
