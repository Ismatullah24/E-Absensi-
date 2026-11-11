import React, { useState } from 'react';
import { X, UserCheck, Calendar, Clock, AlertCircle } from 'lucide-react';
import { AttendanceStatus, Student } from '../types';
import { getCurrentTimeString, getTodayString } from '../utils/attendance';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  currentClass: string;
  onSaveManual: (
    student: Student,
    status: AttendanceStatus,
    keterangan: string,
    waktu: string
  ) => void;
}

export const ManualAttendanceModal: React.FC<Props> = ({
  isOpen,
  onClose,
  students,
  currentClass,
  onSaveManual,
}) => {
  const classStudents = students.filter((s) => s.kelas === currentClass);

  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    classStudents[0]?.id || ''
  );
  const [status, setStatus] = useState<AttendanceStatus>('Hadir');
  const [keterangan, setKeterangan] = useState<string>('');
  const [waktu, setWaktu] = useState<string>(getCurrentTimeString());

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const student = classStudents.find((s) => s.id === selectedStudentId);
    if (!student) return;

    onSaveManual(student, status, keterangan, waktu);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-600">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Presensi Manual</h3>
              <p className="text-xs text-gray-500">Input kehadiran siswa tanpa scan kamera</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Tutup form"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 my-4">
          {/* Pilih Siswa */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Pilih Siswa (Kelas {currentClass})
            </label>
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="w-full text-sm rounded-xl border border-gray-200 px-3.5 py-2.5 bg-gray-50/50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              required
            >
              {classStudents.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nama} ({s.nis})
                </option>
              ))}
            </select>
          </div>

          {/* Status Kehadiran */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Status Kehadiran
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['Hadir', 'Terlambat', 'Sakit', 'Izin', 'Alpa'] as AttendanceStatus[]).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatus(st)}
                  className={`py-2 px-3 text-xs font-semibold rounded-xl border transition-all ${
                    status === st
                      ? st === 'Hadir'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : st === 'Terlambat'
                        ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                        : st === 'Sakit'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : st === 'Izin'
                        ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                        : 'bg-red-600 text-white border-red-600 shadow-sm'
                      : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Waktu Presensi */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Waktu Presensi
            </label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Clock className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={waktu}
                  onChange={(e) => setWaktu(e.target.value)}
                  placeholder="07:05:00"
                  className="w-full text-sm rounded-xl border border-gray-200 pl-9 pr-3.5 py-2 bg-gray-50/50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-mono"
                  required
                />
              </div>
              <button
                type="button"
                onClick={() => setWaktu(getCurrentTimeString())}
                className="px-3 py-2 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl"
              >
                Saat Ini
              </button>
            </div>
          </div>

          {/* Keterangan */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Keterangan / Catatan (Opsional)
            </label>
            <input
              type="text"
              value={keterangan}
              onChange={(e) => setKeterangan(e.target.value)}
              placeholder="Contoh: Surat dokter terlampir / Lupa bawa kartu"
              className="w-full text-sm rounded-xl border border-gray-200 px-3.5 py-2.5 bg-gray-50/50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-xl font-medium"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition-all"
            >
              Simpan Presensi
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
