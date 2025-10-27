import React, { useEffect, useState } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'https://mevcut-appv1.onrender.com';
const API = `${BACKEND_URL}/api`;

export default function POS({ companyId = 1 }) {
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(false);
  const [cart, setCart] = useState([]);
  const [table, setTable] = useState('');
  const [customer, setCustomer] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchMenu();
  }, []);

  const fetchMenu = async () => {
    try {
      const res = await axios.get(`${API}/pos/menu-items`);
      setMenu(res.data || []);
    } catch (err) {
      console.error('Failed to load menu', err);
      setMessage('Menü yüklenemedi');
    }
  };

  const addToCart = (item) => {
    const existing = cart.find(c => c.menu_item_id === item.id);
    if (existing) {
      setCart(cart.map(c => c.menu_item_id === item.id ? { ...c, quantity: c.quantity + 1 } : c));
    } else {
      setCart([...cart, { menu_item_id: item.id, name: item.name, price: item.price, quantity: 1 }]);
    }
    setMessage('');
  };

  const updateQty = (menu_item_id, qty) => {
    if (qty <= 0) {
      setCart(cart.filter(c => c.menu_item_id !== menu_item_id));
    } else {
      setCart(cart.map(c => c.menu_item_id === menu_item_id ? { ...c, quantity: qty } : c));
    }
  };

  const clearCart = () => {
    setCart([]);
    setMessage('');
  };

  const submitOrder = async () => {
    if (!cart.length) return setMessage('Sepet boş');
    setLoading(true);
    setMessage('');
    try {
      const payload = {
        company_id: companyId,
        table: table || null,
        customer: customer || null,
        items: cart.map(c => ({ menu_item_id: c.menu_item_id, quantity: c.quantity })),
        note: ''
      };
      const res = await axios.post(`${API}/pos/order`, payload);
      if (res.data && res.data.success) {
        setMessage('Sipariş oluşturuldu. Adisyon: ' + (res.data.order?.adisyon_no || res.data.order?.id));
        clearCart();
      } else if (res.data && res.data.error === 'insufficient_stock') {
        setMessage('Yetersiz stok: ' + JSON.stringify(res.data.details));
      } else {
        setMessage('Beklenmeyen yanıt: ' + JSON.stringify(res.data));
      }
    } catch (err) {
      console.error('Order error', err);
      const msg = err.response?.data?.detail || err.message || 'Sipariş sırasında hata oluştu';
      setMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  const total = cart.reduce((s, c) => s + (c.price || 0) * (c.quantity || 1), 0).toFixed(2);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold mb-4">POS - Sipariş Oluştur</h2>
      {message && <div className="mb-4 p-3 bg-yellow-50 text-yellow-900 rounded">{message}</div>}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {menu.map(item => (
              <div key={item.id} className="border rounded p-3 flex flex-col justify-between">
                <div>
                  <div className="font-semibold">{item.name}</div>
                  <div className="text-sm text-gray-600">₺{(item.price || 0).toLocaleString('tr-TR')}</div>
                </div>
                <div className="mt-3">
                  <button onClick={() => addToCart(item)} className="w-full px-3 py-2 bg-indigo-600 text-white rounded">Ekle</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gray-50 rounded p-4">
          <h3 className="font-semibold mb-2">Sepet</h3>
          <div className="space-y-2 mb-3">
            {cart.map(c => (
              <div key={c.menu_item_id} className="flex items-center justify-between gap-2">
                <div>
                  <div className="font-medium">{c.name}</div>
                  <div className="text-sm text-gray-600">₺{(c.price || 0).toFixed(2)}</div>
                </div>
                <div className="flex items-center gap-2">
                  <input type="number" value={c.quantity} onChange={(e) => updateQty(c.menu_item_id, parseInt(e.target.value || '0'))} className="w-16 px-2 py-1 border rounded" />
                </div>
              </div>
            ))}
            {cart.length === 0 && <div className="text-sm text-gray-500">Sepet boş</div>}
          </div>

          <div className="mb-3">
            <label className="text-sm">Masa / Ad (opsiyonel)</label>
            <input value={table} onChange={(e) => setTable(e.target.value)} className="w-full px-3 py-2 border rounded mt-1" placeholder="Masa adı veya numarası" />
          </div>
          <div className="mb-3">
            <label className="text-sm">Müşteri (opsiyonel)</label>
            <input value={customer} onChange={(e) => setCustomer(e.target.value)} className="w-full px-3 py-2 border rounded mt-1" placeholder="Müşteri adı" />
          </div>

          <div className="mb-3 font-semibold">Toplam: ₺{total}</div>

          <div className="flex gap-2">
            <button onClick={submitOrder} disabled={loading || cart.length === 0} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50">{loading ? 'Gönderiliyor...' : 'Sipariş Gönder'}</button>
            <button onClick={clearCart} className="px-4 py-2 bg-gray-300 rounded">Temizle</button>
          </div>
        </div>
      </div>
    </div>
  );
}
