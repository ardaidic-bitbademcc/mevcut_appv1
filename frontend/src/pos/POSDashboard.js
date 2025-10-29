import React from 'react';

export default function POSDashboard({ permissions }) {
  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-3">POS Dashboard</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-white border rounded">Açık siparişler (placeholder)</div>
        <div className="p-4 bg-white border rounded">Stok uyarıları (placeholder)</div>
        <div className="p-4 bg-white border rounded">Günlük ciro / kasa durumu (placeholder)</div>
      </div>
    </div>
  );
}
