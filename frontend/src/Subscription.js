import React, { useEffect, useState } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'https://mevcut-appv1.onrender.com';
const API = `${BACKEND_URL}/api`;

export default function Subscription({ companyId }) {
  const [status, setStatus] = useState('loading');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!companyId) return;
    (async () => {
      try {
        const res = await axios.get(`${API}/subscription/company/${companyId}`);
        setStatus(res.data.status || 'none');
      } catch (err) {
        console.error('Failed to load subscription', err);
        setStatus('error');
      }
    })();
  }, [companyId]);

  const plans = [
    { id: 'mock_monthly', name: 'Aylık Plan', price: '₺49 / ay' },
    { id: 'mock_yearly', name: 'Yıllık Plan', price: '₺499 / yıl' }
  ];

  const startCheckout = async (priceId) => {
    if (!companyId) return setMessage('Company ID required');
    setLoading(true);
    try {
      const payload = {
        company_id: companyId,
        price_id: priceId,
        success_url: window.location.origin + '/subscription/success',
        cancel_url: window.location.origin + '/subscription/cancel'
      };
      const res = await axios.post(`${API}/create-checkout-session`, payload);

      // If backend returned a Stripe session url, redirect there
      if (res.data && res.data.session_url) {
        window.location.href = res.data.session_url;
        return;
      }

      // Mock flow: backend returns { mock: true, redirect }
      if (res.data && res.data.mock) {
        setMessage('Test subscription created (mock).');
        setStatus('active');
        // optionally redirect to success
        window.location.href = res.data.redirect;
        return;
      }

      setMessage('Beklenmeyen yanıt: ' + JSON.stringify(res.data));
    } catch (err) {
      console.error('Checkout error', err);
      setMessage('Ödeme başlatılamadı: ' + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 bg-white rounded shadow">
      <h2 className="text-xl font-semibold mb-2">Abonelik</h2>
      <p className="mb-2">Durum: <strong>{status}</strong></p>
      {message && <div className="mb-2 text-sm text-red-600">{message}</div>}

      <div className="grid gap-3 md:grid-cols-2">
        {plans.map((p) => (
          <div key={p.id} className="border rounded p-3">
            <div className="font-medium">{p.name}</div>
            <div className="text-sm text-muted mb-2">{p.price}</div>
            <button
              disabled={loading}
              onClick={() => startCheckout(p.id)}
              className="px-3 py-1 bg-blue-600 text-white rounded"
            >
              Abone Ol
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
