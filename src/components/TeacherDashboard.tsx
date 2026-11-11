import React from 'react';
import {
  Users,
  Camera,
  CheckCircle2,
  AlertTriangle,
  Clock,
  QrCode,
  Sparkles,
  TrendingUp,
  FileSpreadsheet,
  PlusCircle,
  Eye
} from 'lucide-react';
import { User, Student, AttendanceRecord, ClassStats, AttendanceSession } from '../types';
import { AttendanceChart } from './AttendanceChart';

interface Props {
  user: User;
  currentClass: string;
  students: Student[];
  records: AttendanceRecord[];
  stats: ClassStats;
  todayString: string;
  activeSession: AttendanceSession;
  onGoToScanner: () => void;
  onGoToMonitoring: () => void;
  onGoToStudents: () => void;
  onOpenManualModal: () => void;
  onQuickMark: (student: Student, status: 'Hadir' | 'Sakit' | 'Izin' | 'Alpa') => void;
}

export const TeacherDashboard: React.FC<Props> = ({
  user,
  currentClass,
  students,
  records,
  stats,
  todayString,
  activeSession,
  onGoToScanner,
  onGoToMonitoring,
  onGoToStudents,
  onOpenManualModal,
  onQuickMark,
}) => {
  const classStudents = students.filter((s) => s.kelas === currentClass);
  const todayClassRecords = records.filter(
    (r) => r.tanggal === todayString && r.kelas === currentClass
  );

  // Unrecorded students
  const unrecordedStudents = classStudents.filter(
    (s) => !todayClassRecords.some((r) => r.studentId === s.id)
  );

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-700 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/20 backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Wali Kelas • {currentClass}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Dashboard Guru {currentClass}
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100 max-w-xl leading-relaxed">
              Selamat bertugas, <strong>{user.nama}</strong>. Pantau kehadiran siswa binaan kelas {currentClass} dan mulai sesi scan QR atau monitoring harian.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={onGoToStudents}
              className="flex items-center gap-2 px-4 py-3 bg-white/20 hover:bg-white/30 text-white font-bold text-xs sm:text-sm rounded-2xl border border-white/25 transition-all cursor-pointer shadow-2xs"
            >
              <Users className="w-4 h-4 text-emerald-200" />
              <span>Data Siswa Kelas</span>
            </button>
            <button
              onClick={onGoToScanner}
              className="flex items-center gap-2 px-5 py-3 bg-white text-emerald-950 hover:bg-emerald-50 active:bg-emerald-100 font-extrabold text-xs sm:text-sm rounded-2xl shadow-lg transition-all cursor-pointer"
            >
              <Camera className="w-4 h-4 text-emerald-700" />
              <span>Buka Scan Absensi &rarr;</span>
            </button>
            <button
              onClick={onGoToMonitoring}
              className="flex items-center gap-2 px-4 py-3 bg-emerald-950/60 hover:bg-emerald-950 text-emerald-100 font-bold text-xs sm:text-sm rounded-2xl border border-white/20 transition-all cursor-pointer"
            >
              <Eye className="w-4 h-4" />
              <span>Monitoring Kelas</span>
            </button>
          </div>
        </div>
      </div>

      {/* Class Statistics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Siswa</div>
          <div className="text-2xl font-black text-slate-900 mt-1">{stats.totalSiswa}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Kelas {currentClass}</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Hadir Tepat</div>
          <div className="text-2xl font-black text-emerald-600 mt-1">{stats.hadir}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Sesi {activeSession}</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Terlambat</div>
          <div className="text-2xl font-black text-amber-600 mt-1">{stats.terlambat}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Melewati batas</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Sakit / Izin</div>
          <div className="text-2xl font-black text-blue-600 mt-1">{stats.sakit + stats.izin}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">{stats.sakit} Sakit • {stats.izin} Izin</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Belum Hadir</div>
          <div className="text-2xl font-black text-red-600 mt-1">{stats.belumAbsen}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Perlu konfirmasi</div>
        </div>

        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white p-4 rounded-2xl shadow-xs">
          <div className="text-[11px] font-bold text-emerald-100 uppercase tracking-wider">Persentase</div>
          <div className="text-2xl font-black mt-1">{stats.persentaseKehadiran}%</div>
          <div className="text-[10px] text-emerald-100 mt-0.5">Kehadiran Hari Ini</div>
        </div>
      </div>

      {/* Split Section: Unrecorded Students Quick Checklist & Attendance Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Unrecorded Students (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span>Siswa Belum Presensi Hari Ini</span>
                <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-red-100 text-red-700 font-bold">
                  {unrecordedStudents.length} Siswa
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Pilih status kehadiran cepat jika siswa berhalangan hadir atau presensi manual
              </p>
            </div>
            <button
              onClick={onOpenManualModal}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Form Lengkap</span>
            </button>
          </div>

          <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
            {unrecordedStudents.map((s, idx) => (
              <div
                key={s.id}
                className="p-3 rounded-2xl bg-slate-50/80 hover:bg-slate-100/70 border border-slate-200/80 transition-colors flex flex-wrap items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-7 h-7 rounded-xl bg-slate-200 font-mono text-xs font-bold text-slate-700 flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-900 truncate">
                      {s.nama}
                    </div>
                    <div className="text-[11px] font-mono text-slate-500">
                      NIS: {s.nis} &bull; NISN: {s.nisn}
                    </div>
                  </div>
                </div>

                {/* Quick Action Buttons */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => onQuickMark(s, 'Hadir')}
                    className="px-2.5 py-1 text-[11px] font-bold bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-lg transition-colors cursor-pointer"
                    title="Tandai Hadir"
                  >
                    Hadir
                  </button>
                  <button
                    onClick={() => onQuickMark(s, 'Sakit')}
                    className="px-2.5 py-1 text-[11px] font-bold bg-blue-100 hover:bg-blue-200 text-blue-800 rounded-lg transition-colors cursor-pointer"
                    title="Tandai Sakit"
                  >
                    Sakit
                  </button>
                  <button
                    onClick={() => onQuickMark(s, 'Izin')}
                    className="px-2.5 py-1 text-[11px] font-bold bg-purple-100 hover:bg-purple-200 text-purple-800 rounded-lg transition-colors cursor-pointer"
                    title="Tandai Izin"
                  >
                    Izin
                  </button>
                  <button
                    onClick={() => onQuickMark(s, 'Alpa')}
                    className="px-2.5 py-1 text-[11px] font-bold bg-red-100 hover:bg-red-200 text-red-800 rounded-lg transition-colors cursor-pointer"
                    title="Tandai Alpa"
                  >
                    Alpa
                  </button>
                </div>
              </div>
            ))}

            {unrecordedStudents.length === 0 && (
              <div className="py-12 text-center text-slate-500 space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                <div className="text-sm font-bold text-slate-800">Lengkap! Semua Siswa Sudah Presensi</div>
                <div className="text-xs text-slate-400">Seluruh siswa kelas {currentClass} telah memiliki data kehadiran hari ini.</div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Class Attendance Trend Chart (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Grafik Kehadiran 7 Hari Terakhir
              </h3>
              <p className="text-xs text-slate-500">
                Tren kedisiplinan siswa kelas {currentClass}
              </p>
            </div>
          </div>

          <AttendanceChart records={records} currentClass={currentClass} selectedDate={todayString} />
        </div>
      </div>
    </div>
  );
};
