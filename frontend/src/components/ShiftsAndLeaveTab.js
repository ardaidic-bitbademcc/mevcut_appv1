import React from 'react';
import { Plus, X } from 'lucide-react';

const ShiftsAndLeaveTab = ({
  employees,
  shiftTypes,
  shiftCalendar,
  leaveRecords,
  selectedShiftMonth,
  setSelectedShiftMonth,
  selectedShiftType,
  setSelectedShiftType,
  selectedEmployeesForShift,
  setSelectedEmployeesForShift,
  newLeave,
  setNewLeave,
  addLeave,
  deleteLeave,
  addShiftToCalendar,
  removeShiftFromCalendar,
  generateWeeklyPDFFor,
  generateMonthlyPDF,
  weeklyPdfEmployeeId,
  setWeeklyPdfEmployeeId,
  permissions,
}) => {
  const renderShiftCalendar = () => {
    const [year, month] = selectedShiftMonth.split('-').map(Number);
    const daysInMonth = new Date(year, month, 0).getDate();
    const firstDay = new Date(year, month - 1, 1).getDay();

    const calendar = [];
    let week = [];

    for (let i = 0; i < firstDay; i++) {
      week.push(<div key={`empty-${i}`} className="h-24 bg-gray-50"></div>);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const shiftsOnDate = shiftCalendar.filter(s => s.tarih === date);
      const leavesOnDate = leaveRecords.filter(l => l.tarih === date);

      week.push(
        <div key={day} className="h-24 border border-gray-200 p-1 bg-white overflow-y-auto">
          <div className="text-xs font-semibold text-gray-600 mb-1">{day}</div>
          <div className="space-y-1">
            {shiftsOnDate.map(shift => {
              const emp = employees.find(e => e.id === shift.employee_id);
              const shiftType = shiftTypes.find(st => st.id === shift.shift_type);
              return (
                <div key={shift.id} className={`text-xs p-1 rounded ${shiftType?.color || 'bg-gray-300'} text-white flex justify-between items-center`}>
                  <span className="truncate">{emp?.ad}</span>
                  <button onClick={() => removeShiftFromCalendar(shift.id)} className="text-white hover:text-red-200">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
            {leavesOnDate.map(leave => {
              const emp = employees.find(e => e.id === leave.employee_id);
              return (
                <div key={`leave-${leave.id}`} className="text-xs p-1 rounded bg-red-500 text-white flex justify-between items-center">
                  <span className="truncate">🏖️ {emp?.ad}</span>
                  <button onClick={() => deleteLeave(leave.id)} className="text-white hover:text-red-200">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      );

      if (week.length === 7) {
        calendar.push(<div key={`week-${calendar.length}`} className="grid grid-cols-7 gap-0">{week}</div>);
        week = [];
      }
    }

    while (week.length > 0 && week.length < 7) {
      week.push(<div key={`empty-end-${week.length}`} className="h-24 bg-gray-50"></div>);
    }
    if (week.length > 0) {
      calendar.push(<div key={`week-${calendar.length}`} className="grid grid-cols-7 gap-0">{week}</div>);
    }

    return calendar;
  };

  return (
    <div>
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-bold mb-6">📅 Vardiya Takvimi & İzin</h2>

        {permissions.manage_shifts && (
          <>
            <div className="mb-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
              <p className="font-bold mb-3">Vardiya Türü Seçin</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {shiftTypes.map(shift => (
                  <button key={shift.id} onClick={() => setSelectedShiftType(shift.id)} className={`p-3 rounded-lg border-2 font-semibold transition ${selectedShiftType === shift.id ? `${shift.color} text-white border-transparent` : 'bg-white border-gray-300 text-gray-700'}`}>
                    {shift.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-6 flex gap-4 items-center">
              <input type="month" value={selectedShiftMonth} onChange={(e) => setSelectedShiftMonth(e.target.value)} className="px-4 py-2 border rounded-lg font-semibold" />
              <div className="text-sm text-gray-600">İpucu: Takvimde gün seçin, sonra personel seçin ve vardiya atayın</div>
            </div>

            <div className="mb-4 flex gap-3 items-center">
              <select value={weeklyPdfEmployeeId} onChange={(e) => setWeeklyPdfEmployeeId(e.target.value)} className="px-3 py-2 border rounded-lg">
                <option value="">Haftalık PDF için personel seç</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.ad} {emp.soyad}</option>
                ))}
              </select>
              <input id="weekly-start-date" type="date" className="px-3 py-2 border rounded-lg" />
              <button onClick={() => {
                const date = document.getElementById('weekly-start-date').value;
                if (!weeklyPdfEmployeeId) return alert('Lütfen personel seçin');
                if (!date) return alert('Lütfen hafta başlangıç tarihi seçin');
                generateWeeklyPDFFor(weeklyPdfEmployeeId, date);
              }} className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">Haftalık PDF İndir</button>
              <button onClick={generateMonthlyPDF} className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-800">Aylık PDF İndir</button>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-7 gap-0 mb-2">
                {['Pzr', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'].map(day => (
                  <div key={day} className="text-center font-bold text-sm py-2 bg-indigo-100 text-indigo-800">{day}</div>
                ))}
              </div>
              {renderShiftCalendar()}
            </div>

            <div className="mt-6 bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h3 className="font-bold mb-3">Vardiya Atama</h3>
              <div className="space-y-4">
                <div>
                  <label className="block font-semibold mb-2">Personel Seç (Birden fazla seçebilirsiniz):</label>
                  <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border rounded-lg p-3 bg-white">
                    {employees.map(emp => (
                      <label key={emp.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                        <input
                          type="checkbox"
                          checked={selectedEmployeesForShift.includes(emp.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedEmployeesForShift([...selectedEmployeesForShift, emp.id]);
                            } else {
                              setSelectedEmployeesForShift(selectedEmployeesForShift.filter(id => id !== emp.id));
                            }
                          }}
                          className="w-4 h-4"
                        />
                        <span className="text-sm">{emp.ad} {emp.soyad}</span>
                      </label>
                    ))}
                  </div>
                  {selectedEmployeesForShift.length > 0 && (
                    <p className="text-sm text-green-600 mt-2">✓ {selectedEmployeesForShift.length} personel seçildi</p>
                  )}
                </div>

                <input type="date" className="w-full px-4 py-2 border rounded-lg" id="shift-date-input" />

                <button onClick={() => {
                  const date = document.getElementById('shift-date-input').value;
                  if (selectedEmployeesForShift.length === 0) {
                    alert('❌ En az bir personel seçiniz!');
                    return;
                  }
                  if (!date) {
                    alert('❌ Tarih seçiniz!');
                    return;
                  }

                  Promise.all(selectedEmployeesForShift.map(empId => addShiftToCalendar(empId, date)))
                    .then(() => {
                      setSelectedEmployeesForShift([]);
                      document.getElementById('shift-date-input').value = '';
                      alert(`✅ ${selectedEmployeesForShift.length} personele vardiya atandı!`);
                    })
                    .catch(err => {
                      alert('❌ Hata: ' + err.message);
                    });
                }} className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold">
                  Seçili Personellere Vardiya Ata ({selectedEmployeesForShift.length})
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {permissions.manage_leave && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">🗓️ İzin Kaydı Ekle</h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
            <select value={newLeave.employee_id} onChange={(e) => setNewLeave({ ...newLeave, employee_id: e.target.value })} className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="">Personel Seç</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.ad} {emp.soyad}</option>
              ))}
            </select>
            <input type="date" value={newLeave.tarih} onChange={(e) => setNewLeave({ ...newLeave, tarih: e.target.value })} className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            <select value={newLeave.leave_type} onChange={(e) => setNewLeave({ ...newLeave, leave_type: e.target.value })} className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="izin">İzin</option>
              <option value="hastalik">Hastalık</option>
            </select>
            <input type="text" placeholder="Notlar" value={newLeave.notlar} onChange={(e) => setNewLeave({ ...newLeave, notlar: e.target.value })} className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            <button onClick={addLeave} className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold flex items-center justify-center"><Plus className="w-4 h-4" /></button>
          </div>

          <h3 className="font-bold text-lg mb-4">İzin Kayıtları</h3>
          <div className="space-y-2">
            {leaveRecords.map(leave => {
              const emp = employees.find(e => e.id === leave.employee_id);
              return (
                <div key={leave.id} className={`p-3 rounded-lg flex justify-between items-center ${leave.leave_type === 'izin' ? 'bg-yellow-50 border border-yellow-200' : 'bg-red-50 border border-red-200'}`}>
                  <div>
                    <p className="font-semibold text-sm">{emp?.ad} {emp?.soyad} - {leave.tarih}</p>
                    <p className="text-xs text-gray-600">{leave.leave_type === 'izin' ? '🗓️ İzin' : '🏥 Hastalık'} - {leave.notlar}</p>
                  </div>
                  <button onClick={() => deleteLeave(leave.id)} className="px-3 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600 font-semibold"><Trash2 className="w-3 h-3" /></button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ShiftsAndLeaveTab;
