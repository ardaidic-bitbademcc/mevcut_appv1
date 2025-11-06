import React from 'react';
import { Plus, X, Trash2 } from 'lucide-react';

const SalaryTab = ({
  salaryData,
  salaryError,
  fetchSalaryData,
  salaryMonth,
  setSalaryMonth,
  employees,
  newAvans,
  setNewAvans,
  addAvans,
  deleteAvans,
  yemekUpdate,
  setYemekUpdate,
  updateYemekUcreti,
  avansData,
  showAvansModal,
  setShowAvansModal,
  showYemekModal,
  setShowYemekModal,
  selectedEmployeeForDetail,
  setSelectedEmployeeForDetail,
  employee,
}) => {
  return (
    <div>
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">💰 Maaş Yönetimi</h2>
          <div className="flex gap-3">
            {(employee?.rol === 'admin' || employee?.rol === 'sistem_yoneticisi') && (
              <>
                <button onClick={() => setShowAvansModal(true)} className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-semibold flex items-center gap-2"><Plus className="w-4 h-4" /> Avans Ekle</button>
                <button onClick={() => setShowYemekModal(true)} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold flex items-center gap-2"><Plus className="w-4 h-4" /> Yemek Ücreti Ayarla</button>
              </>
            )}
          </div>
        </div>

        <div className="mb-6">
          <label className="block font-semibold mb-2">Ay Seçin:</label>
          <input type="month" value={salaryMonth} onChange={(e) => setSalaryMonth(e.target.value)} className="px-4 py-2 border rounded-lg font-semibold" />
        </div>

        {salaryError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded">
            <strong>❌ Maaş verileri getirilemedi:</strong> {salaryError}
            <button onClick={() => { fetchSalaryData(); }} className="ml-4 px-2 py-1 bg-red-600 text-white rounded text-sm">Yeniden Dene</button>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-2 text-left">Personel</th>
                <th className="px-4 py-2 text-left">Pozisyon</th>
                <th className="px-4 py-2 text-right">Temel Maaş</th>
                <th className="px-4 py-2 text-right">Günlük</th>
                <th className="px-4 py-2 text-right">Saatlik</th>
                <th className="px-4 py-2 text-center">Gün</th>
                <th className="px-4 py-2 text-right">Hak Eden</th>
                <th className="px-4 py-2 text-right">Yemek</th>
                <th className="px-4 py-2 text-right">Avans</th>
                <th className="px-4 py-2 text-right">Net Maaş</th>
                <th className="px-4 py-2 text-center">Detay</th>
              </tr>
            </thead>
            <tbody>
              {salaryData.map((record, idx) => (
                <tr key={idx} className={`border-b hover:bg-gray-50 ${record.toplam_maas < 0 ? 'bg-red-50' : ''}`}>
                  <td className="px-4 py-2 font-semibold">{record.ad} {record.soyad}</td>
                  <td className="px-4 py-2">{record.pozisyon}</td>
                  <td className="px-4 py-2 text-right">₺{record.temel_maas.toLocaleString('tr-TR')}</td>
                  <td className="px-4 py-2 text-right text-xs text-gray-600">₺{record.gunluk_maas.toLocaleString('tr-TR')}</td>
                  <td className="px-4 py-2 text-right text-xs text-gray-600">₺{record.saatlik_maas.toLocaleString('tr-TR')}</td>
                  <td className="px-4 py-2 text-center font-semibold">{record.calisilan_gun}</td>
                  <td className="px-4 py-2 text-right font-semibold text-blue-600">₺{record.hakedilen_maas.toLocaleString('tr-TR')}</td>
                  <td className="px-4 py-2 text-right text-green-600">+₺{record.toplam_yemek.toLocaleString('tr-TR')}</td>
                  <td className="px-4 py-2 text-right text-red-600">-₺{record.toplam_avans.toLocaleString('tr-TR')}</td>
                  <td className={`px-4 py-2 text-right font-bold text-lg ${record.toplam_maas < 0 ? 'text-red-600' : 'text-green-600'}`}>₺{record.toplam_maas.toLocaleString('tr-TR')}</td>
                  <td className="px-4 py-2 text-center">
                    <button onClick={() => setSelectedEmployeeForDetail(record)} className="px-3 py-1 bg-indigo-500 text-white rounded text-xs hover:bg-indigo-600">Detay</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showAvansModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Avans Ekle</h3>
            <div className="space-y-4">
              <select value={newAvans.employee_id} onChange={(e) => setNewAvans({ ...newAvans, employee_id: e.target.value })} className="w-full px-4 py-2 border rounded-lg">
                <option value="">Personel Seç</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.ad} {emp.soyad}</option>
                ))}
              </select>
              <input type="number" placeholder="Avans Miktarı (₺)" value={newAvans.miktar} onChange={(e) => setNewAvans({ ...newAvans, miktar: e.target.value })} className="w-full px-4 py-2 border rounded-lg" />
              <input type="date" value={newAvans.tarih} onChange={(e) => setNewAvans({ ...newAvans, tarih: e.target.value })} className="w-full px-4 py-2 border rounded-lg" />
              <textarea placeholder="Açıklama" value={newAvans.aciklama} onChange={(e) => setNewAvans({ ...newAvans, aciklama: e.target.value })} className="w-full px-4 py-2 border rounded-lg" rows="3" />
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={addAvans} className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold">Kaydet</button>
              <button onClick={() => setShowAvansModal(false)} className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 font-semibold">İptal</button>
            </div>
          </div>
        </div>
      )}

      {showYemekModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Günlük Yemek Ücreti Ayarla</h3>
            <div className="space-y-4">
              <select value={yemekUpdate.employee_id} onChange={(e) => setYemekUpdate({ ...yemekUpdate, employee_id: e.target.value })} className="w-full px-4 py-2 border rounded-lg">
                <option value="">Personel Seç</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.ad} {emp.soyad}</option>
                ))}
              </select>
              <input type="number" placeholder="Günlük Yemek Ücreti (₺)" value={yemekUpdate.gunluk_ucret} onChange={(e) => setYemekUpdate({ ...yemekUpdate, gunluk_ucret: e.target.value })} className="w-full px-4 py-2 border rounded-lg" />
              <p className="text-sm text-gray-600">Personelin her çalışma günü için ödenen yemek ücreti</p>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={updateYemekUcreti} className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold">Kaydet</button>
              <button onClick={() => setShowYemekModal(false)} className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 font-semibold">İptal</button>
            </div>
          </div>
        </div>
      )}

      {selectedEmployeeForDetail && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-2xl font-bold">{selectedEmployeeForDetail.ad} {selectedEmployeeForDetail.soyad} - Maaş Detayı</h3>
              <button onClick={() => setSelectedEmployeeForDetail(null)} className="text-gray-500 hover:text-gray-700"><X className="w-6 h-6" /></button>
            </div>

            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-bold mb-2">📊 Temel Bilgiler</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>Pozisyon: <span className="font-semibold">{selectedEmployeeForDetail.pozisyon}</span></div>
                  <div>Ay: <span className="font-semibold">{selectedEmployeeForDetail.ay}</span></div>
                  <div>Temel Maaş: <span className="font-semibold">₺{selectedEmployeeForDetail.temel_maas.toLocaleString('tr-TR')}</span></div>
                  <div>Günlük Maaş: <span className="font-semibold">₺{selectedEmployeeForDetail.gunluk_maas.toLocaleString('tr-TR')}</span></div>
                  <div>Saatlik Maaş: <span className="font-semibold">₺{selectedEmployeeForDetail.saatlik_maas.toLocaleString('tr-TR')}</span></div>
                  <div>Mesai Süresi: <span className="font-semibold">9 saat/gün</span></div>
                </div>
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-bold mb-2">💵 Kazançlar</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Çalışılan Gün:</span>
                    <span className="font-semibold">{selectedEmployeeForDetail.calisilan_gun} gün</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Çalışılan Saat:</span>
                    <span className="font-semibold">{selectedEmployeeForDetail.calisilan_saat} saat</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span>Hak Edilen Maaş:</span>
                    <span className="font-semibold text-blue-600">₺{selectedEmployeeForDetail.hakedilen_maas.toLocaleString('tr-TR')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Yemek Ücreti ({selectedEmployeeForDetail.gunluk_yemek_ucreti}₺ x {selectedEmployeeForDetail.calisilan_gun} gün):</span>
                    <span className="font-semibold text-green-600">+₺{selectedEmployeeForDetail.toplam_yemek.toLocaleString('tr-TR')}</span>
                  </div>
                </div>
              </div>

              <div className="bg-red-50 p-4 rounded-lg">
                <h4 className="font-bold mb-2">💳 Kesintiler</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Toplam Avans:</span>
                    <span className="font-semibold text-red-600">-₺{selectedEmployeeForDetail.toplam_avans.toLocaleString('tr-TR')}</span>
                  </div>
                </div>
              </div>

              <div className={`p-4 rounded-lg ${selectedEmployeeForDetail.toplam_maas < 0 ? 'bg-red-100' : 'bg-green-100'}`}>
                <h4 className="font-bold mb-2">💰 Net Maaş</h4>
                <div className="text-2xl font-bold text-center">
                  <span className={selectedEmployeeForDetail.toplam_maas < 0 ? 'text-red-600' : 'text-green-600'}>
                    ₺{selectedEmployeeForDetail.toplam_maas.toLocaleString('tr-TR')}
                  </span>
                </div>
                {selectedEmployeeForDetail.toplam_maas < 0 && (
                  <p className="text-center text-sm text-red-600 mt-2">⚠️ Personelin borcu var!</p>
                )}
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-bold mb-2">📋 Avans Geçmişi ({selectedEmployeeForDetail.ay})</h4>
                <div className="space-y-2">
                  {avansData.filter(a => a.employee_id === selectedEmployeeForDetail.employee_id && a.tarih.startsWith(selectedEmployeeForDetail.ay)).map(avans => (
                    <div key={avans.id} className="flex justify-between items-center bg-white p-2 rounded text-sm">
                      <div>
                        <div className="font-semibold">₺{avans.miktar.toLocaleString('tr-TR')}</div>
                        <div className="text-xs text-gray-600">{avans.tarih} - {avans.aciklama}</div>
                      </div>
                      {(employee?.rol === 'admin' || employee?.rol === 'sistem_yoneticisi') && (
                        <button onClick={() => { deleteAvans(avans.id); setSelectedEmployeeForDetail(null); }} className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"><Trash2 className="w-3 h-3" /></button>
                      )}
                    </div>
                  ))}
                  {avansData.filter(a => a.employee_id === selectedEmployeeForDetail.employee_id && a.tarih.startsWith(selectedEmployeeForDetail.ay)).length === 0 && (
                    <p className="text-sm text-gray-500 text-center">Avans kaydı yok</p>
                  )}
                </div>
              </div>
            </div>

            <button onClick={() => setSelectedEmployeeForDetail(null)} className="mt-6 w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold">Kapat</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalaryTab;
