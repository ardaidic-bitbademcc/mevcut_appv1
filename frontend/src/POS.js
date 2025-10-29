import React, { useEffect, useState } from 'react';
import axios from 'axios';
// POS component: cleaned formatting to fix build-time JSX parsing errors

// Use relative API by default (works when frontend is served from same host).
// If you want to override during development, set REACT_APP_BACKEND_URL.
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';
const API = BACKEND_URL ? `${BACKEND_URL.replace(/\/$/, '')}/api` : '/api';

export default function POS({ companyId = 1 }) {
  const [menu, setMenu] = useState([]);
  const [categories, setCategories] = useState([]);
  const [zones, setZones] = useState([]);
  const [tables, setTables] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [cart, setCart] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [customer, setCustomer] = useState('');
  const [message, setMessage] = useState('');
  const [selfService, setSelfService] = useState(false);
  const [showMenuForm, setShowMenuForm] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [kioskMode, setKioskMode] = useState(false);
  const [menuForm, setMenuForm] = useState({ name: '', price: '', category_id: '', description: '', recipe: '' });
  const [showTableManager, setShowTableManager] = useState(false);
  const [newZoneName, setNewZoneName] = useState('');
  const [newTableName, setNewTableName] = useState('');
  const [newTableZone, setNewTableZone] = useState('');

  useEffect(() => {
    fetchAll();
  }, []);

  // Listen to global events from Terminal UI (add-item, open-payment)
  useEffect(() => {
    const onAdd = (e) => {
      const item = e.detail;
      if (item) addToCart(item);
    };
    const onOpenPayment = () => setShowPaymentModal(true);
    window.addEventListener('pos-add-item', onAdd);
    window.addEventListener('pos-open-payment', onOpenPayment);
    return () => {
      window.removeEventListener('pos-add-item', onAdd);
      window.removeEventListener('pos-open-payment', onOpenPayment);
    };
  }, [cart]);

  // When kiosk mode toggles, try to enter or exit browser fullscreen for immersive kiosk UX
  useEffect(() => {
    const enterFullscreen = async () => {
      try {
        const el = document.documentElement;
        if (el.requestFullscreen) await el.requestFullscreen();
        else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
        else if (el.msRequestFullscreen) el.msRequestFullscreen();
      } catch (e) {
        console.warn('Failed to enter fullscreen', e);
      }
    };

    const exitFullscreen = async () => {
      try {
        if (document.fullscreenElement) {
          if (document.exitFullscreen) await document.exitFullscreen();
          else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
        }
      } catch (e) {
        console.warn('Failed to exit fullscreen', e);
      }
    };

    if (kioskMode) {
      enterFullscreen();
    } else {
      exitFullscreen();
    }
  }, [kioskMode]);

  // Keep kioskMode in sync if user exits fullscreen with ESC or browser controls
  useEffect(() => {
    const handler = () => {
      if (!document.fullscreenElement) {
        // if fullscreen was exited externally, turn off kioskMode
        try { setKioskMode(false); } catch (e) { /* ignore */ }
      }
    };
    document.addEventListener('fullscreenchange', handler);
    document.addEventListener('webkitfullscreenchange', handler);
    return () => {
      document.removeEventListener('fullscreenchange', handler);
      document.removeEventListener('webkitfullscreenchange', handler);
    };
  }, []);

  const fetchAll = async () => {
    try {
      const [mRes, cRes, zRes, tRes] = await Promise.all([
        axios.get(`${API}/pos/menu-items`),
        axios.get(`${API}/pos/categories`),
        axios.get(`${API}/pos/zones`),
        axios.get(`${API}/pos/tables`),
      ]);
      setMenu(mRes.data || []);
      setCategories(cRes.data || []);
      setZones(zRes.data || []);
      setTables(tRes.data || []);
      if ((cRes.data || []).length) setActiveCategory((cRes.data || [])[0].id);
    } catch (err) {
      console.error('Failed to load POS data', err);
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
    if (!selfService && !selectedTable) return setMessage('Lütfen bir masa seçin veya self-servis modunu açın');
    setLoading(true);
    setMessage('');
    try {
      const payload = {
        company_id: companyId,
        table: selfService ? null : (selectedTable ? selectedTable.name : null),
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

  const openPayment = () => {
    setPaymentAmount(parseFloat(total) || 0);
    setShowPaymentModal(true);
  }

  const payAndCreateOrder = async () => {
    if (!cart.length) return setMessage('Sepet boş');
    if (!selfService && !selectedTable) return setMessage('Lütfen bir masa seçin veya self-servis modunu açın');
    setLoading(true);
    setMessage('');
    try {
      const orderPayload = {
        company_id: companyId,
        table: selfService ? null : (selectedTable ? selectedTable.name : null),
        customer: customer || null,
        items: cart.map(c => ({ menu_item_id: c.menu_item_id, quantity: c.quantity })),
        note: ''
      };
      const payment = { method: paymentMethod, amount: parseFloat(paymentAmount || 0), details: {} };
      const res = await axios.post(`${API}/pos/order-pay`, { order: orderPayload, payment });
      if (res.data && res.data.success) {
        setMessage('Sipariş ve ödeme kaydedildi. Adisyon: ' + (res.data.order?.adisyon_no || res.data.order?.id));
        clearCart();
        setShowPaymentModal(false);
      } else if (res.data && res.data.error === 'insufficient_stock') {
        setMessage('Yetersiz stok: ' + JSON.stringify(res.data.details));
      } else {
        setMessage('Beklenmeyen yanıt: ' + JSON.stringify(res.data));
      }
    } catch (err) {
      console.error('Pay error', err);
      const msg = err.response?.data?.detail || err.message || 'Ödeme sırasında hata oluştu';
      setMessage(msg);
    } finally {
      setLoading(false);
    }
  }

  const total = cart.reduce((s, c) => s + (c.price || 0) * (c.quantity || 1), 0).toFixed(2);

  // Menu form handlers
  const openMenuForm = () => setShowMenuForm(true);
  const closeMenuForm = () => { setShowMenuForm(false); setMenuForm({ name: '', price: '', category_id: '', description: '', recipe: '' }); };
  const submitMenuForm = async () => {
    if (!menuForm.name || !menuForm.price) return setMessage('Menü adı ve fiyat gereklidir');
    try {
      const payload = {
        name: menuForm.name,
        price: parseFloat(menuForm.price),
        category_id: menuForm.category_id ? parseInt(menuForm.category_id) : null,
        description: menuForm.description || null,
        recipe: menuForm.recipe ? JSON.parse(menuForm.recipe) : [],
      };
      const res = await axios.post(`${API}/pos/menu-item`, payload);
      setMessage('Menü öğesi oluşturuldu');
      closeMenuForm();
      fetchAll();
    } catch (err) {
      console.error('Menu create error', err);
      setMessage(err.response?.data?.detail || err.message || 'Menü oluşturulamadı');
    }
  };

  // Zones & tables CRUD
  const createZone = async (name) => {
    if (!name) return setMessage('Bölge adı gereklidir');
    try {
      await axios.post(`${API}/pos/zones`, { name });
      fetchAll();
      setMessage('Bölge oluşturuldu');
    } catch (err) {
      console.error('createZone error', err);
      const detail = err.response?.data?.detail || err.response?.data || err.message;
      setMessage('Bölge oluşturulamadı: ' + (typeof detail === 'string' ? detail : JSON.stringify(detail)));
    }
  };

  const createTable = async (name, zone_id) => {
    if (!name) return setMessage('Masa adı gereklidir');
    try {
      const payload = { name };
      if (zone_id !== null && zone_id !== undefined) payload.zone_id = parseInt(zone_id);
      await axios.post(`${API}/pos/tables`, payload);
      fetchAll();
      setMessage('Masa oluşturuldu');
    } catch (err) {
      console.error('createTable error', err);
      const detail = err.response?.data?.detail || err.response?.data || err.message;
      setMessage('Masa oluşturulamadı: ' + (typeof detail === 'string' ? detail : JSON.stringify(detail)));
    }
  };

  const deleteTable = async (id) => {
    try { await axios.delete(`${API}/pos/tables/${id}`); fetchAll(); } catch (err) { console.error(err); setMessage('Masa silinemedi'); }
  };

  const deleteZone = async (id) => {
    try { await axios.delete(`${API}/pos/zones/${id}`); fetchAll(); } catch (err) { console.error(err); setMessage('Bölge silinemedi'); }
  };

  return (
  <div className="bg-white rounded-lg shadow p-6 relative overflow-visible">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">POS - Sipariş Oluştur</h2>
        <div className="flex items-center gap-3">
          <button onClick={() => setSelfService(!selfService)} className={`px-3 py-1 rounded ${selfService ? 'bg-green-600 text-white' : 'bg-gray-100'}`}>
            {selfService ? 'Self-Servis (Açık)' : 'Self-Servis (Kapalı)'}
          </button>
          <button onClick={() => setShowTableManager(!showTableManager)} className="px-3 py-1 bg-gray-200 rounded">Masa Yönetimi</button>
          <button onClick={openMenuForm} className="px-3 py-1 bg-indigo-600 text-white rounded">Menü Ekle</button>
          <button onClick={() => setKioskMode(!kioskMode)} className={`px-3 py-1 rounded ${kioskMode ? 'bg-yellow-600 text-white' : 'bg-gray-100'}`}>
            {kioskMode ? 'Kiosk Modu: Açık' : 'Kiosk Modu'}
          </button>
        </div>
      </div>

      {message && <div className="mb-4 p-3 bg-yellow-50 text-yellow-900 rounded">{message}</div>}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-3">
          {/* make the left area scrollable to avoid content overflowing the page */}
          <div className="max-h-[65vh] overflow-auto pr-2">
          {/* Table layout: zones and table rectangles */}
          <div className="mb-4">
            {zones.map(zone => (
              <div key={zone.id} className="mb-3">
                <h4 className="font-semibold mb-2">{zone.name}</h4>
                <div className="flex flex-wrap gap-3">
                  {tables.filter(t => t.zone_id === zone.id).map(t => (
                    <button key={t.id} type="button" onClick={() => { if (!selfService) setSelectedTable(t); }} className={`w-28 h-16 flex items-center justify-center border rounded cursor-pointer select-none ${selectedTable?.id === t.id ? 'bg-indigo-600 text-white' : 'bg-white'}`}>
                      {t.name}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            {tables.filter(t => !t.zone_id).length > 0 && (
              <div className="mb-3">
                <h4 className="font-semibold mb-2">Diğer Masalar</h4>
                <div className="flex flex-wrap gap-3">
                  {tables.filter(t => !t.zone_id).map(t => (
                    <button key={t.id} type="button" onClick={() => { if (!selfService) setSelectedTable(t); }} className={`w-28 h-16 flex items-center justify-center border rounded cursor-pointer select-none ${selectedTable?.id === t.id ? 'bg-indigo-600 text-white' : 'bg-white'}`}>
                      {t.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

                </div>

                {/* Categories tabs */}
          <div className="flex gap-2 mb-4">
            {categories.map(cat => (
              <button type="button" key={cat.id} onClick={() => setActiveCategory(cat.id)} className={`px-3 py-1 rounded ${activeCategory === cat.id ? 'bg-indigo-600 text-white' : 'bg-gray-100'}`}>{cat.name}</button>
            ))}
            <button type="button" onClick={() => setActiveCategory(null)} className={`px-3 py-1 rounded ${activeCategory === null ? 'bg-indigo-600 text-white' : 'bg-gray-100'}`}>Tümü</button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {menu.filter(m => activeCategory ? m.category_id === activeCategory : true).map(item => (
              <div key={item.id} className="border rounded p-3 flex flex-col justify-between min-h-[100px]">
                <div>
                  <div className="font-semibold text-lg">{item.name}</div>
                  <div className="text-sm text-gray-600">₺{(item.price || 0).toLocaleString('tr-TR')}</div>
                </div>
                <div className="mt-3">
                  <button type="button" onClick={() => addToCart(item)} className="w-full px-3 py-2 bg-indigo-600 text-white rounded text-sm">Ekle</button>
                </div>
              </div>
            ))}
          </div>
          {/* Kiosk mode large tiles (visible when kioskMode) */}
          {kioskMode && (
            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
              {menu.filter(m => m.kiosk_featured).map(item => (
                <button key={item.id} type="button" onClick={() => addToCart(item)} className="p-6 bg-white border rounded-lg shadow text-center text-xl font-semibold hover:bg-indigo-50 min-h-[120px]">
                  <div className="mb-2 text-lg">{item.name}</div>
                  <div className="text-sm text-gray-600">₺{(item.price || 0).toFixed(2)}</div>
                </button>
              ))}
            </div>
          )}
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

          {!selfService && (
            <div className="mb-3">
              <label className="text-sm">Masa Seç</label>
              <select value={selectedTable?.id || ''} onChange={(e) => setSelectedTable(tables.find(t => t.id === parseInt(e.target.value)) || null)} className="w-full px-3 py-2 border rounded mt-1">
                <option value="">-- Masa Seç --</option>
                {tables.map(t => <option key={t.id} value={t.id}>{t.name} {t.zone_id ? `(${zones.find(z=>z.id===t.zone_id)?.name||''})` : ''}</option>)}
              </select>
            </div>
          )}

          <div className="mb-3">
            <label className="text-sm">Müşteri (opsiyonel)</label>
            <input value={customer} onChange={(e) => setCustomer(e.target.value)} className="w-full px-3 py-2 border rounded mt-1" placeholder="Müşteri adı" />
          </div>

          <div className="mb-3 font-semibold">Toplam: ₺{total}</div>

          <div className="flex gap-2">
            <button onClick={submitOrder} disabled={loading || cart.length === 0} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50">{loading ? 'Gönderiliyor...' : 'Sipariş Gönder'}</button>
            <button onClick={openPayment} disabled={loading || cart.length === 0} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">Ödeme Al</button>
            <button onClick={clearCart} className="px-4 py-2 bg-gray-300 rounded">Temizle</button>
          </div>

          {showTableManager && (
            <div className="mt-4 p-3 bg-white border rounded">
              <h4 className="font-semibold mb-2">Masa & Bölge Yönetimi</h4>
              <div className="mb-2">
                <div className="text-sm font-medium">Bölgeler</div>
                <div className="flex gap-2 flex-wrap mt-2">
                  {zones.map(z => (
                    <div key={z.id} className="px-3 py-1 bg-gray-100 rounded flex items-center gap-2">
                      <span>{z.name}</span>
                      <button onClick={() => deleteZone(z.id)} className="text-red-500">Sil</button>
                    </div>
                  ))}
                  <div className="flex items-center gap-2">
                    <input value={newZoneName} onChange={e=>setNewZoneName(e.target.value)} placeholder="Yeni bölge adı" className="px-2 py-1 border rounded" />
                    <button type="button" onClick={() => { if(newZoneName) { createZone(newZoneName); setNewZoneName(''); } }} className="px-2 py-1 bg-green-600 text-white rounded">Ekle</button>
                  </div>
                </div>
              </div>

              <div>
                <div className="text-sm font-medium">Masalar</div>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {tables.map(t => (
                    <div key={t.id} className="p-2 border rounded flex justify-between items-center">
                      <div>{t.name} {t.zone_id ? `(${zones.find(z=>z.id===t.zone_id)?.name||''})` : ''}</div>
                      <div className="flex gap-2">
                        <button onClick={() => deleteTable(t.id)} className="text-red-500">Sil</button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-2">
                  <div className="flex gap-2">
                    <input value={newTableName} onChange={e=>setNewTableName(e.target.value)} placeholder="Masa adı" className="px-2 py-1 border rounded" />
                    <select value={newTableZone} onChange={e=>setNewTableZone(e.target.value)} className="px-2 py-1 border rounded">
                      <option value="">Bölge (opsiyonel)</option>
                      {zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
                    </select>
                    <button type="button" onClick={() => { createTable(newTableName, newTableZone || null); setNewTableName(''); setNewTableZone(''); }} className="px-2 py-1 bg-green-600 text-white rounded">Masa Ekle</button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      </div>

      {/* Menu creation modal/box */}
      {showMenuForm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center" style={{ zIndex: 9999 }}>
          <div className="bg-white rounded p-6 w-full max-w-lg" style={{ zIndex: 10000 }}>
            <h3 className="font-bold mb-3">Yeni Menü Öğesi</h3>
            <div className="grid grid-cols-1 gap-3">
              <input value={menuForm.name} onChange={(e)=>setMenuForm({...menuForm, name: e.target.value})} placeholder="Ad" className="px-3 py-2 border rounded" />
              <input value={menuForm.price} onChange={(e)=>setMenuForm({...menuForm, price: e.target.value})} placeholder="Fiyat" className="px-3 py-2 border rounded" />
              <select value={menuForm.category_id} onChange={(e)=>setMenuForm({...menuForm, category_id: e.target.value})} className="px-3 py-2 border rounded">
                <option value="">Kategori seç (opsiyonel)</option>
                {categories.map(c=> <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <textarea value={menuForm.description} onChange={(e)=>setMenuForm({...menuForm, description: e.target.value})} placeholder="Açıklama (opsiyonel)" className="px-3 py-2 border rounded" />
              <textarea value={menuForm.recipe} onChange={(e)=>setMenuForm({...menuForm, recipe: e.target.value})} placeholder='Reçete JSON (örn: [{"stok_urun_id":1,"quantity":0.2}])' className="px-3 py-2 border rounded" />
              <div className="flex gap-2 mt-2">
                <button onClick={submitMenuForm} className="px-4 py-2 bg-indigo-600 text-white rounded">Kaydet</button>
                <button onClick={closeMenuForm} className="px-4 py-2 bg-gray-300 rounded">İptal</button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Payment modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center" style={{ zIndex: 10020 }}>
          <div className="bg-white rounded p-6 w-full max-w-md" style={{ zIndex: 10030 }}>
            <h3 className="font-bold mb-3">Ödeme Al</h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm">Tutar</label>
                <input type="number" value={paymentAmount} onChange={(e)=>setPaymentAmount(e.target.value)} className="w-full px-3 py-2 border rounded" />
              </div>
              <div>
                <label className="text-sm">Ödeme Yöntemi</label>
                <select value={paymentMethod} onChange={(e)=>setPaymentMethod(e.target.value)} className="w-full px-3 py-2 border rounded">
                  <option value="cash">Nakit</option>
                  <option value="card">Kredi Kartı</option>
                  <option value="other">Diğer</option>
                </select>
              </div>
              <div className="flex gap-2 mt-4">
                <button onClick={payAndCreateOrder} className="px-4 py-2 bg-green-600 text-white rounded">Öde ve Kaydet</button>
                <button onClick={()=>setShowPaymentModal(false)} className="px-4 py-2 bg-gray-300 rounded">İptal</button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Fullscreen Kiosk Mode Overlay */}
      {kioskMode && (
        <div className="fixed inset-0 bg-white p-4" style={{ zIndex: 10010 }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Kiosk Modu</h2>
            <div className="flex items-center gap-2">
              <button onClick={() => setKioskMode(false)} className="px-3 py-1 bg-red-500 text-white rounded">Çıkış</button>
              <button onClick={openPayment} className="px-3 py-1 bg-blue-600 text-white rounded" disabled={cart.length === 0}>Ödeme</button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 h-[calc(100vh-120px)] overflow-auto">
            {menu.filter(m => m.kiosk_featured || m.kiosk).map(item => (
              <button key={item.id} onClick={() => addToCart(item)} className="p-6 bg-gray-100 rounded-lg shadow text-center text-xl font-semibold hover:bg-indigo-50">
                <div className="mb-2">{item.name}</div>
                <div className="text-sm text-gray-600">₺{(item.price || 0).toFixed(2)}</div>
              </button>
            ))}
          </div>

          {/* Small cart at bottom-right */}
          <div className="fixed right-4 bottom-4 w-96 bg-white border rounded p-3 shadow-lg">
            <div className="font-semibold mb-2">Sepet</div>
            <div className="space-y-2 max-h-48 overflow-auto mb-3">
              {cart.map(c => (
                <div key={c.menu_item_id} className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{c.name}</div>
                    <div className="text-sm text-gray-600">₺{(c.price || 0).toFixed(2)}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="number" value={c.quantity} onChange={(e) => updateQty(c.menu_item_id, parseInt(e.target.value || '0'))} className="w-16 px-2 py-1 border rounded" />
                  </div>
                </div>
              ))}
            </div>
            <div className="font-semibold mb-2">Toplam: ₺{total}</div>
            <div className="flex gap-2">
              <button onClick={openPayment} disabled={cart.length === 0} className="flex-1 px-3 py-2 bg-blue-600 text-white rounded">Ödeme</button>
              <button onClick={clearCart} className="px-3 py-2 bg-gray-300 rounded">Temizle</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

