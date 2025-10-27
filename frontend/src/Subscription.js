import React, { useEffect, useState } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'https://mevcut-appv1.onrender.com';
const API = `${BACKEND_URL}/api`;

export default function Subscription({ companyId }) {
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!companyId) return;
    (async () => {
      try {
        const res = await axios.get(`${API}/subscription/company/${companyId}`);
        setSubscription(res.data || { status: 'none', company_id: companyId });
      } catch (err) {
        console.error('Failed to load subscription', err);
        setSubscription({ status: 'error' });
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
              // Refresh subscription info from backend
              try {
                const subRes = await axios.get(`${API}/subscription/company/${companyId}`);
                setSubscription(subRes.data || { status: 'active' });
              } catch (e) {
                console.warn('Could not reload subscription after mock create', e);
              }
              // optionally redirect to success
              if (res.data.redirect) window.location.href = res.data.redirect;
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
          <div className="p-6 bg-white rounded shadow">
            <h2 className="text-xl font-semibold mb-2">Abonelik</h2>
            <p className="mb-2">Durum: <strong>{subscription?.status || 'loading'}</strong></p>
            {subscription?.billing_email && (
              <p className="mb-1 text-sm">Fatura e-posta: <strong>{subscription.billing_email}</strong></p>
            )}
            {subscription?.current_period_end && (
              <p className="mb-1 text-sm">Bitiş: <strong>{subscription.current_period_end}</strong></p>
            )}
            {subscription?.plan && (
              <div className="mb-3 text-sm">
                <div>Plan: <strong>{subscription.plan.name || subscription.plan.id}</strong></div>
                {subscription.plan.price_display && <div>Ücret: {subscription.plan.price_display}</div>}
              </div>
            )}
      
            {message && <div className="mb-2 text-red-600">{message}</div>}
      
            <div className="grid gap-4 md:grid-cols-2">
              {plans.map((p) => (
                <div key={p.id} className="border rounded p-4 flex flex-col justify-between">
                  <div>
                    <div className="font-medium">{p.name}</div>
                    <div className="text-sm text-muted mb-2">{p.price}</div>
                  </div>
                  <div className="mt-3">
                    <button onClick={() => startCheckout(p.id)} disabled={loading} className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">
                      {loading ? 'Yükleniyor...' : 'Abone Ol'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      }
