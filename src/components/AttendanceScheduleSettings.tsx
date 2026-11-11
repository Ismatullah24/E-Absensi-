import React, { useState } from 'react';
import {
  Clock,
  Calendar,
  Save,
  RotateCcw,
  Sun,
  Sunset,
  AlertTriangle,
  CheckCircle2,
  Sliders,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { AttendanceScheduleConfig } from '../types';
import { DEFAULT_SCHEDULE } from '../utils/schedule';
import { determineAttendanceStatus } from '../utils/attendance';

interface Props {
  config: AttendanceScheduleConfig;
  onSaveConfig: (config: AttendanceScheduleConfig) => void;
  onNotify: (type: 'success' | 'warning' | 'info', title: string, desc: string) => void;
}

const ALL_DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

export const AttendanceScheduleSettings: React.FC<Props> = ({
  config,
  onSaveConfig,
  onNotify,
}) => {
  const [formState, setFormState] = useState<AttendanceScheduleConfig>(config);
  const [testTime, setTestTime] = useState('07:16');

  const testStatus = determineAttendanceStatus(testTime, formState.jamMasukBatas);

  const toggleDay = (day: string) => {
    setFormState((prev) => {
      const exists = prev.hariAktif.includes(day);
      const nextDays = exists
        ? prev.hariAktif.filter((d) => d !== day)
        : [...prev.hariAktif, day];
      return { ...prev, hariAktif: nextDays };
    });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (formState.jamMasukBuka >= formState.jamMasukBatas) {
      onNotify('warning', 'Pengaturan Waktu Tidak Valid', 'Jam buka masuk harus lebih awal daripada batas jam masuk.');
      return;
    }
    if (formState.jamMasukBatas >= formState.jamMasukTutup) {
      onNotify('warning', 'Pengaturan Waktu Tidak Valid', 'Batas tepat waktu harus lebih awal daripada jam tutup sesi masuk.');
      return;
    }
    if (formState.jamPulangBuka >= formState.jamPulangTutup) {
      onNotify('warning', 'Pengaturan Waktu Tidak Valid', 'Jam mulai pulang harus lebih awal daripada jam tutup sesi pulang.');
      return;
    }

    onSaveConfig(formState);
    onNotify('success', 'Jadwal Absensi Tersimpan', `Aturan waktu datang (${formState.jamMasukBatas}) dan pulang (${formState.jamPulangBuka}) berhasil diterapkan ke sistem.`);
  };

  const handleReset = () => {
    if (confirm('Kembalikan pengaturan waktu presensi ke standar sekolah?')) {
      setFormState(DEFAULT_SCHEDULE);
      onSaveConfig(DEFAULT_SCHEDULE);
      onNotify('info', 'Reset Pengaturan', 'Pengaturan waktu absensi dikembalikan ke setelan pabrik default.');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-teal-900 via-emerald-800 to-slate-900 rounded-3xl p-6 text-white shadow-md flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 backdrop-blur-md mb-2">
            <Sliders className="w-3.5 h-3.5 text-emerald-300" />
            <span>Manajemen Kebijakan Waktu Presensi Sekolah</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight">
            Kelola Waktu Absen (Datang &amp; Pulang)
          </h2>
          <p className="text-xs sm:text-sm text-emerald-100 mt-1 max-w-xl">
            Tentukan jam buka pemindaian kartu, batas toleransi tepat waktu vs terlambat, jam mulai kepulangan, serta hari aktif sekolah.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-black/30 hover:bg-black/50 text-emerald-200 text-xs sm:text-sm font-semibold rounded-xl border border-white/10 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset Default</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Timing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: Waktu Datang (Sesi Masuk) */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-5">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-2xl">
                <Sun className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Pengaturan Sesi Datang (Pagi)
                </h3>
                <p className="text-xs text-slate-500">
                  Aturan jam kedatangan dan penetapan status terlambat
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Jam Buka Presensi Masuk
                </label>
                <div className="relative">
                  <Clock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="time"
                    value={formState.jamMasukBuka}
                    onChange={(e) => setFormState({ ...formState, jamMasukBuka: e.target.value })}
                    required
                    className="w-full text-sm pl-10 pr-3.5 py-2.5 bg-slate-50 rounded-xl border border-slate-200 font-mono font-bold focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Kamera scanner mulai dibuka untuk sesi datang.</p>
              </div>

              <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-1">
                <label className="block text-xs font-bold text-amber-900 uppercase tracking-wider">
                  Batas Jam Tepat Waktu (Cut-off Hadir)
                </label>
                <div className="relative">
                  <Clock className="w-4 h-4 text-amber-600 absolute left-3.5 top-3" />
                  <input
                    type="time"
                    value={formState.jamMasukBatas}
                    onChange={(e) => setFormState({ ...formState, jamMasukBatas: e.target.value })}
                    required
                    className="w-full text-sm pl-10 pr-3.5 py-2.5 bg-white rounded-xl border border-amber-300 font-mono font-bold text-amber-900 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <p className="text-[11px] text-amber-700">
                  Scan <strong>sebelum atau sama dengan {formState.jamMasukBatas} WIB</strong> dihitung <strong>Hadir</strong>. Melewati jam ini otomatis berstatus <strong>Terlambat</strong>.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Batas Akhir Sesi Masuk (Tutup Presensi Pagi)
                </label>
                <div className="relative">
                  <Clock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="time"
                    value={formState.jamMasukTutup}
                    onChange={(e) => setFormState({ ...formState, jamMasukTutup: e.target.value })}
                    required
                    className="w-full text-sm pl-10 pr-3.5 py-2.5 bg-slate-50 rounded-xl border border-slate-200 font-mono font-bold focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Sesi pagi ditutup, siswa yang belum scan akan dihitung Alpa/Belum Hadir.</p>
              </div>
            </div>
          </div>

          {/* Card 2: Waktu Pulang (Sesi Pulang) */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-5">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="p-2.5 bg-blue-50 text-blue-600 rounded-2xl">
                <Sunset className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Pengaturan Sesi Pulang (Sore)
                </h3>
                <p className="text-xs text-slate-500">
                  Aturan jam kepulangan siswa dan penutupan gerbang
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-2xl space-y-1">
                <label className="block text-xs font-bold text-blue-900 uppercase tracking-wider">
                  Jam Mulai Buka Presensi Pulang
                </label>
                <div className="relative">
                  <Clock className="w-4 h-4 text-blue-600 absolute left-3.5 top-3" />
                  <input
                    type="time"
                    value={formState.jamPulangBuka}
                    onChange={(e) => setFormState({ ...formState, jamPulangBuka: e.target.value })}
                    required
                    className="w-full text-sm pl-10 pr-3.5 py-2.5 bg-white rounded-xl border border-blue-300 font-mono font-bold text-blue-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <p className="text-[11px] text-blue-700">
                  Siswa hanya dapat memindai kartu kepulangan mulai pukul <strong>{formState.jamPulangBuka} WIB</strong>.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Batas Akhir Sesi Pulang
                </label>
                <div className="relative">
                  <Clock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="time"
                    value={formState.jamPulangTutup}
                    onChange={(e) => setFormState({ ...formState, jamPulangTutup: e.target.value })}
                    required
                    className="w-full text-sm pl-10 pr-3.5 py-2.5 bg-slate-50 rounded-xl border border-slate-200 font-mono font-bold focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Batas akhir pemindaian kartu kepulangan pada hari berjalan.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Toleransi Menit Keterlambatan
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={0}
                    max={60}
                    value={formState.toleransiTerlambatMenit}
                    onChange={(e) => setFormState({ ...formState, toleransiTerlambatMenit: Number(e.target.value) })}
                    className="w-32 text-sm px-3.5 py-2.5 bg-slate-50 rounded-xl border border-slate-200 font-mono font-bold focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
                  />
                  <span className="text-xs text-slate-600 font-medium">Menit setelah batas jam masuk</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Hari Aktif Sekolah */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Hari Aktif Pembelajaran &amp; Presensi Sekolah
            </h3>
          </div>
          <p className="text-xs text-slate-500">
            Pilih hari-hari sekolah di mana absensi otomatis diwajibkan untuk seluruh kelas.
          </p>

          <div className="flex flex-wrap gap-2.5 pt-1">
            {ALL_DAYS.map((day) => {
              const active = formState.hariAktif.includes(day);
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDay(day)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
                    active
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${active ? 'bg-white' : 'bg-slate-300'}`}></span>
                  <span>{day}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Live Simulator & Status Preview */}
        <div className="bg-gradient-to-r from-slate-900 to-indigo-950 rounded-3xl p-6 text-white shadow-md space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <h4 className="text-sm font-bold">Uji Simulasi Jam Presensi</h4>
            </div>
            <div className="text-xs text-slate-300">
              Batas Datang Saat Ini: <code className="bg-white/10 px-2 py-0.5 rounded font-mono text-emerald-300">{formState.jamMasukBatas} WIB</code>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-300">Ketik Jam Scan Siswa:</span>
              <input
                type="time"
                value={testTime}
                onChange={(e) => setTestTime(e.target.value)}
                className="px-3 py-1.5 bg-black/50 border border-white/20 rounded-xl font-mono text-sm text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-400"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-300">Hasil Evaluasi Sistem:</span>
              <span
                className={`px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 ${
                  testStatus === 'Hadir'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Status: {testStatus} ({testTime} WIB)</span>
              </span>
            </div>
          </div>
        </div>

        {/* Save Bar */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-sm rounded-2xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Simpan Pengaturan Jadwal Absen</span>
          </button>
        </div>
      </form>
    </div>
  );
};
