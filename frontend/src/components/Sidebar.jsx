import React from 'react'
import { ShoppingCart } from 'lucide-react'

export default function Sidebar({ activeTab, setActiveTab, permissions = {}, employee = {} }) {
  const items = [
    { id: 'dashboard', label: '📊 Dashboard', show: permissions.view_dashboard ?? true },
    { id: 'gorevler', label: '✅ Görevler', show: permissions.view_tasks },
    { id: 'vardiya_izin', label: '📅 Vardiya & İzin', show: permissions.manage_shifts || permissions.manage_shifts_types || permissions.manage_leave },
    { id: 'maas', label: '💰 Maaş', show: permissions.view_salary },
    { id: 'rol_yonetimi', label: '🔐 Rol Yönetimi', show: permissions.manage_roles },
    { id: 'vardiya_turleri', label: '⚙️ Vardiya Türleri', show: permissions.manage_shifts_types },
    { id: 'personel', label: '👥 Personel', show: employee?.rol === 'admin' },
    { id: 'stok', label: '📦 Stok', show: permissions.can_view_stock },
    { id: 'pos', label: <span className="flex items-center gap-2"><ShoppingCart size={16} /> POS</span>, show: permissions.POS_VIEW ?? true },
    { id: 'abonelik', label: '💳 Abonelik', show: true },
  ];

  return (
    <aside className="w-56 bg-white/80 rounded-lg p-4 shadow mr-6 sticky top-6 h-[calc(100vh-3rem)] overflow-y-auto">
      <div className="mb-4 text-sm text-gray-600">Gezinme</div>
      <nav className="flex flex-col gap-2">
        {items.filter(i => i.show).map(i => (
          <button
            key={i.id}
            onClick={() => setActiveTab(i.id)}
            className={`text-left px-3 py-2 rounded-md font-medium transition ${activeTab === i.id ? 'bg-indigo-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
          >
            {i.label}
          </button>
        ))}
      </nav>
    </aside>
  );
}
