import React from 'react';
import { Plus, Trash2, Edit2 } from 'lucide-react';

const StockTab = ({
  permissions,
  stokKategoriler,
  stokBirimler,
  stokUrunler,
  stokDurum,
  newStokKategori,
  setNewStokKategori,
  addStokKategori,
  deleteStokKategori,
  startEditStokKategori,
  editingStokKategori,
  setEditingStokKategori,
  updateStokKategori,
  newStokBirim,
  setNewStokBirim,
  addStokBirim,
  deleteStokBirim,
  newStokUrun,
  setNewStokUrun,
  addStokUrun,
  editingStokUrun,
  startEditStokUrun,
  updateStokUrun,
  setEditingStokUrun,
  deleteStokUrun,
  stokSayimData,
  setStokSayimData,
  showStokSayimModal,
  setShowStokSayimModal,
  saveStokSayim,
  downloadStok,
  uploadStokFile,
  setStokImportFile,
  downloadStokTemplate
}) => {
  return (
    <div>
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">📥/📤 Stok - Excel İşlemleri</h2>
        <div className="flex flex-col md:flex-row gap-4 items-start">
          <div className="flex gap-2">
            <button onClick={downloadStok} className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">Stok İndir (.xlsx)</button>
            <button onClick={downloadStokTemplate} className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700">Şablon İndir</button>
          </div>
          <div className="flex items-center gap-2">
            <input type="file" accept=".xlsx,.xls" onChange={(e) => setStokImportFile(e.target.files?.[0] || null)} />
            <button onClick={uploadStokFile} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">Toplu Yükle</button>
          </div>
        </div>
      </div>
      {permissions.can_manage_categories && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">🏷️ Kategori Yönetimi</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <input
              type="text"
              placeholder="Kategori Adı (ör: Sebze)"
              value={newStokKategori.ad}
              onChange={(e) => setNewStokKategori({ ...newStokKategori, ad: e.target.value })}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <input
              type="color"
              value={newStokKategori.renk}
              onChange={(e) => setNewStokKategori({ ...newStokKategori, renk: e.target.value })}
              className="px-2 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 h-11"
              title="Kategori Rengi"
            />
            <button
              onClick={addStokKategori}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" /> Kategori Ekle
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-2 text-left">ID</th>
                  <th className="px-4 py-2 text-left">Kategori Adı</th>
                  <th className="px-4 py-2 text-left">Renk</th>
                  <th className="px-4 py-2 text-left">İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {stokKategoriler.map(kategori => (
                  <tr key={kategori.id} className="border-b hover:bg-gray-50">
                    {editingStokKategori?.id === kategori.id ? (
                      <>
                        <td className="px-4 py-2 font-bold text-indigo-600">{kategori.id}</td>
                        <td className="px-4 py-2">
                          <input
                            type="text"
                            value={editingStokKategori.ad}
                            onChange={(e) => setEditingStokKategori({ ...editingStokKategori, ad: e.target.value })}
                            className="w-full px-2 py-1 border rounded text-sm"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <input
                            type="color"
                            value={editingStokKategori.renk}
                            onChange={(e) => setEditingStokKategori({ ...editingStokKategori, renk: e.target.value })}
                            className="w-16 h-8 border rounded"
                          />
                        </td>
                        <td className="px-4 py-2 flex gap-2">
                          <button
                            onClick={updateStokKategori}
                            className="px-3 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600 font-semibold"
                          >
                            Kaydet
                          </button>
                          <button
                            onClick={() => setEditingStokKategori(null)}
                            className="px-3 py-1 bg-gray-500 text-white rounded text-xs hover:bg-gray-600 font-semibold"
                          >
                            İptal
                          </button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-4 py-2 font-bold text-indigo-600">{kategori.id}</td>
                        <td className="px-4 py-2 font-semibold">{kategori.ad}</td>
                        <td className="px-4 py-2">
                          <div className="flex items-center gap-2">
                            <div style={{backgroundColor: kategori.renk}} className="w-8 h-8 rounded border"></div>
                            <span className="text-xs text-gray-600">{kategori.renk}</span>
                          </div>
                        </td>
                        <td className="px-4 py-2 flex gap-2">
                          <button
                            onClick={() => startEditStokKategori(kategori)}
                            className="px-3 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 font-semibold flex items-center gap-1"
                          >
                            <Edit2 className="w-3 h-3" /> Düzenle
                          </button>
                          <button
                            onClick={() => deleteStokKategori(kategori.id)}
                            className="px-3 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600 font-semibold flex items-center gap-1"
                          >
                            <Trash2 className="w-3 h-3" /> Sil
                          </button>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">📏 Birim Yönetimi</h2>
        {permissions.can_add_stock_unit && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <input
              type="text"
              placeholder="Birim Adı (ör: Kilogram)"
              value={newStokBirim.ad}
              onChange={(e) => setNewStokBirim({ ...newStokBirim, ad: e.target.value })}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <input
              type="text"
              placeholder="Kısaltma (ör: kg)"
              value={newStokBirim.kisaltma}
              onChange={(e) => setNewStokBirim({ ...newStokBirim, kisaltma: e.target.value })}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              onClick={addStokBirim}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" /> Birim Ekle
            </button>
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-2 text-left">ID</th>
                <th className="px-4 py-2 text-left">Birim Adı</th>
                <th className="px-4 py-2 text-left">Kısaltma</th>
                {permissions.can_delete_stock_unit && <th className="px-4 py-2 text-left">İşlem</th>}
              </tr>
            </thead>
            <tbody>
              {stokBirimler.map(birim => (
                <tr key={birim.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-2 font-bold text-indigo-600">{birim.id}</td>
                  <td className="px-4 py-2 font-semibold">{birim.ad}</td>
                  <td className="px-4 py-2">{birim.kisaltma}</td>
                  {permissions.can_delete_stock_unit && (
                    <td className="px-4 py-2">
                      <button
                        onClick={() => deleteStokBirim(birim.id)}
                        className="px-3 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600 font-semibold flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" /> Sil
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">📦 Ürün Yönetimi</h2>
        {permissions.can_add_stock_product && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
            <input
              type="text"
              placeholder="Ürün Adı"
              value={newStokUrun.ad}
              onChange={(e) => setNewStokUrun({ ...newStokUrun, ad: e.target.value })}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <select
              value={newStokUrun.birim_id}
              onChange={(e) => setNewStokUrun({ ...newStokUrun, birim_id: e.target.value })}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Birim Seçin</option>
              {stokBirimler.map(birim => (
                <option key={birim.id} value={birim.id}>{birim.ad} ({birim.kisaltma})</option>
              ))}
            </select>
            <select
              value={newStokUrun.kategori_id}
              onChange={(e) => setNewStokUrun({ ...newStokUrun, kategori_id: e.target.value })}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Kategori Seçin</option>
              {stokKategoriler.map(kategori => (
                <option key={kategori.id} value={kategori.id}>{kategori.ad}</option>
              ))}
            </select>
            <input
              type="number"
              placeholder="Min Stok"
              value={newStokUrun.min_stok}
              onChange={(e) => setNewStokUrun({ ...newStokUrun, min_stok: e.target.value })}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              onClick={addStokUrun}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" /> Ürün Ekle
            </button>
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-2 text-left">ID</th>
                <th className="px-4 py-2 text-left">Ürün Adı</th>
                <th className="px-4 py-2 text-left">Birim</th>
                <th className="px-4 py-2 text-left">Kategori</th>
                <th className="px-4 py-2 text-left">Min Stok</th>
                {(permissions.can_edit_stock_product || permissions.can_delete_stock_product) && (
                  <th className="px-4 py-2 text-left">İşlemler</th>
                )}
              </tr>
            </thead>
            <tbody>
              {stokUrunler.map(urun => (
                <tr key={urun.id} className="border-b hover:bg-gray-50">
                  {editingStokUrun?.id === urun.id ? (
                    <>
                      <td className="px-4 py-2 font-bold text-indigo-600">{urun.id}</td>
                      <td className="px-4 py-2">
                        <input
                          type="text"
                          value={editingStokUrun.ad}
                          onChange={(e) => setEditingStokUrun({ ...editingStokUrun, ad: e.target.value })}
                          className="w-full px-2 py-1 border rounded text-sm"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <select
                          value={editingStokUrun.birim_id}
                          onChange={(e) => setEditingStokUrun({ ...editingStokUrun, birim_id: e.target.value })}
                          className="w-full px-2 py-1 border rounded text-sm"
                        >
                          {stokBirimler.map(birim => (
                            <option key={birim.id} value={birim.id}>{birim.kisaltma}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-2">
                        <select
                          value={editingStokUrun.kategori_id}
                          onChange={(e) => setEditingStokUrun({ ...editingStokUrun, kategori_id: e.target.value })}
                          className="w-full px-2 py-1 border rounded text-sm"
                        >
                          {stokKategoriler.map(kategori => (
                            <option key={kategori.id} value={kategori.id}>{kategori.ad}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="number"
                          value={editingStokUrun.min_stok}
                          onChange={(e) => setEditingStokUrun({ ...editingStokUrun, min_stok: e.target.value })}
                          className="w-full px-2 py-1 border rounded text-sm"
                        />
                      </td>
                      <td className="px-4 py-2 flex gap-2">
                        <button
                          onClick={updateStokUrun}
                          className="px-3 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600 font-semibold"
                        >
                          Kaydet
                        </button>
                        <button
                          onClick={() => setEditingStokUrun(null)}
                          className="px-3 py-1 bg-gray-500 text-white rounded text-xs hover:bg-gray-600 font-semibold"
                        >
                          İptal
                        </button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-2 font-bold text-indigo-600">{urun.id}</td>
                      <td className="px-4 py-2 font-semibold">{urun.ad}</td>
                      <td className="px-4 py-2">{stokBirimler.find(b => b.id === urun.birim_id)?.kisaltma}</td>
                      <td className="px-4 py-2">
                        {(() => {
                          const kategori = stokKategoriler.find(k => k.id === urun.kategori_id);
                          return kategori ? (
                            <span
                              className="px-2 py-1 rounded text-xs font-semibold text-white"
                              style={{backgroundColor: kategori.renk}}
                            >
                              {kategori.ad}
                            </span>
                          ) : <span className="text-gray-400">-</span>;
                        })()}
                      </td>
                      <td className="px-4 py-2">{urun.min_stok}</td>
                      {(permissions.can_edit_stock_product || permissions.can_delete_stock_product) && (
                        <td className="px-4 py-2 flex gap-2">
                          {permissions.can_edit_stock_product && (
                            <button
                              onClick={() => startEditStokUrun(urun)}
                              className="px-3 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 font-semibold flex items-center gap-1"
                            >
                              <Edit2 className="w-3 h-3" /> Düzenle
                            </button>
                          )}
                          {permissions.can_delete_stock_product && (
                            <button
                              onClick={() => deleteStokUrun(urun.id)}
                              className="px-3 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600 font-semibold flex items-center gap-1"
                            >
                              <Trash2 className="w-3 h-3" /> Sil
                            </button>
                          )}
                        </td>
                      )}
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">📊 Mevcut Stok Durumu</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-2 text-left">Ürün</th>
                <th className="px-4 py-2 text-left">Kategori</th>
                <th className="px-4 py-2 text-left">Mevcut Miktar</th>
                <th className="px-4 py-2 text-left">Min Stok</th>
                <th className="px-4 py-2 text-left">Durum</th>
                <th className="px-4 py-2 text-left">Son Sayım</th>
                {permissions.can_perform_stock_count && <th className="px-4 py-2 text-left">İşlem</th>}
              </tr>
            </thead>
            <tbody>
              {stokDurum.map(item => (
                <tr key={item.urun.id} className={`border-b hover:bg-gray-50 ${item.durum === 'kritik' ? 'bg-red-50' : ''}`}>
                  <td className="px-4 py-2 font-semibold">{item.urun.ad}</td>
                  <td className="px-4 py-2">
                    {item.kategori ? (
                      <span
                        className="px-2 py-1 rounded text-xs font-semibold text-white"
                        style={{backgroundColor: item.kategori.renk}}
                      >
                        {item.kategori.ad}
                      </span>
                    ) : <span className="text-gray-400">-</span>}
                  </td>
                  <td className="px-4 py-2 font-bold">{item.stok_miktar} {item.birim?.kisaltma}</td>
                  <td className="px-4 py-2">{item.urun.min_stok} {item.birim?.kisaltma}</td>
                  <td className="px-4 py-2">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      item.durum === 'kritik' ? 'bg-red-500 text-white' : 'bg-green-100 text-green-700'
                    }`}>
                      {item.durum === 'kritik' ? '⚠️ KRİTİK' : '✅ Normal'}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-xs text-gray-600">
                    {item.son_sayim ? item.son_sayim.tarih : 'Henüz sayım yok'}
                  </td>
                  {permissions.can_perform_stock_count && (
                    <td className="px-4 py-2">
                      <button
                        onClick={() => {
                          setStokSayimData({ [item.urun.id]: item.stok_miktar });
                          setShowStokSayimModal(true);
                        }}
                        className="px-3 py-1 bg-indigo-500 text-white rounded text-xs hover:bg-indigo-600 font-semibold"
                      >
                        Sayım Yap
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showStokSayimModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4">
              <h3 className="text-xl font-bold">📦 Stok Sayımı</h3>
            </div>
            <div className="px-6 py-4">
              <p className="text-gray-600 mb-4">Sayım yapmak istediğiniz ürünler için miktarları girin:</p>
              <div className="space-y-3">
                {stokDurum.map(item => (
                  <div key={item.urun.id} className="flex items-center gap-4 border-b pb-3">
                    <div className="flex-1">
                      <p className="font-semibold">{item.urun.ad}</p>
                      <p className="text-xs text-gray-500">Mevcut: {item.stok_miktar} {item.birim?.kisaltma}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Yeni miktar"
                        value={stokSayimData[item.urun.id] || ''}
                        onChange={(e) => setStokSayimData({ ...stokSayimData, [item.urun.id]: e.target.value })}
                        className="w-32 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <span className="text-sm text-gray-600">{item.birim?.kisaltma}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="sticky bottom-0 bg-gray-50 px-6 py-4 flex gap-3">
              <button
                onClick={saveStokSayim}
                className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold"
              >
                ✅ Sayımı Kaydet
              </button>
              <button
                onClick={() => {
                  setShowStokSayimModal(false);
                  setStokSayimData({});
                }}
                className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 font-semibold"
              >
                İptal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StockTab;
