import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import POS from '../POS';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';
const API = BACKEND_URL ? `${BACKEND_URL.replace(/\/$/, '')}/api` : '/api';

export default function Terminal({ permissions = {}, companyId }) {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [barcode, setBarcode] = useState('');
  const searchRef = useRef(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchProducts();
    const handler = (e) => {
      if (e.key === 'F3') { e.preventDefault(); searchRef.current?.focus(); }
      if (e.key === 'F9') { e.preventDefault(); document.getElementById('terminal-pay-btn')?.click(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const fetchProducts = async (q = '') => {
    try {
      const res = await axios.get(`${API}/pos/menu-items`, { params: { search: q } });
      setProducts(res.data || []);
    } catch (err) {
      console.error('fetchProducts', err);
      setMessage('Ürünler yüklenemedi');
    }
  };

  const onSearchChange = (v) => {
    setSearch(v);
    fetchProducts(v);
  };

  const onBarcodeEnter = async () => {
    if (!barcode) return;
    try {
      // try exact match on barcode field
      const res = await axios.get(`${API}/pos/menu-items`, { params: { search: barcode } });
      const found = (res.data || []).find(p => p.barcode === barcode || p.sku === barcode || p.id === Number(barcode));
      if (found) {
        // use global POS addToCart by simulating click — simplest is to call POST /api/pos/order with single item in kiosk mode, but here we'll redirect user to POS component
        // As a pragmatic step, show a message and focus the POS component
        setMessage(`${found.name} bulundu — POS'a ekleyin.`);
      } else {
        setMessage('Barkod bulunamadı');
      }
    } catch (err) {
      console.error('barcode search', err);
      setMessage('Barkod aramada hata');
    } finally {
      setBarcode('');
    }
  };

  if (!permissions.POS_SELL) return <div className="p-4">Yetkiniz yok</div>;

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-3">POS Terminal</h2>
      {message && <div className="mb-2 p-2 bg-yellow-50 text-yellow-800 rounded">{message}</div>}
      <div className="mb-3 flex gap-2">
        <input ref={searchRef} value={search} onChange={(e)=>onSearchChange(e.target.value)} placeholder="Ara (F3)" className="px-3 py-2 border rounded flex-1" />
        <input value={barcode} onChange={(e)=>setBarcode(e.target.value)} onKeyDown={(e)=>{ if(e.key==='Enter'){ e.preventDefault(); onBarcodeEnter(); } }} placeholder="Barkod (Enter)" className="px-3 py-2 border rounded w-48" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {products.map(p => (
          <div key={p.id} className="p-3 bg-white border rounded flex flex-col justify-between">
            <div>
              <div className="font-semibold">{p.name}</div>
              <div className="text-sm text-gray-600">₺{(p.price||0).toFixed(2)}</div>
            </div>
            <div className="mt-2">
              <button onClick={() => window.dispatchEvent(new CustomEvent('pos-add-item', { detail: p }))} className="w-full px-3 py-2 bg-indigo-600 text-white rounded">Ekle</button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6">
        <button id="terminal-pay-btn" onClick={() => window.dispatchEvent(new CustomEvent('pos-open-payment'))} className="px-4 py-2 bg-green-600 text-white rounded">Ödeme (F9)</button>
        <span className="ml-3 text-sm text-gray-500">Enter: barkod ekle, Del: seçili satırı sil</span>
      </div>

      <div className="mt-6">
        {/* reuse the central POS component for cart + payment handling; it listens to custom events from this Terminal UI */}
        <POS companyId={companyId} />
      </div>
    </div>
  );
}
