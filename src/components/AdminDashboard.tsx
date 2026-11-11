import React from 'react';
import {
  Users,
  GraduationCap,
  BookOpen,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Sliders,
  FileSpreadsheet,
  TrendingUp,
  ShieldCheck,
  ArrowRight,
  ExternalLink,
  Sparkles
} from 'lucide-react';
import { User, Student, Teacher, AttendanceRecord, ClassStats, AttendanceScheduleConfig } from '../types';
import { AttendanceChart } from './AttendanceChart';
import { GoogleSheetsConfig } from '../utils/googleSheetsSync';

interface Props {
  user: User;
  students: Student[];
  teachers: Teacher[];
  records: AttendanceRecord[];
  allStats: ClassStats;
  todayString: string;
  scheduleConfig: AttendanceScheduleConfig;
  gasConfig: GoogleSheetsConfig;
  onNavigate: (tab: 'dashboard' | 'students' | 'teachers' | 'recap' | 'schedule_settings') => void;
  onOpenGasModal: () => void;
}

export const AdminDashboard: React.FC<Props> = ({
  user,
  students,
  teachers,
  records,
  allStats,
  todayString,
  scheduleConfig,
  gasConfig,
  onNavigate,
  onOpenGasModal,
}) => {
  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 backdrop-blur-md">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-300" />
              <span>Pusat Kendali Administrator Sistem Presensi Sekolah</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Dashboard Administrator Sekolah
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
              Monitoring terpusat kehadiran seluruh siswa, tata kelola data pendidik, laporan absensi spreadsheet, dan kebijakan jam masuk/pulang.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => onNavigate('schedule_settings')}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all cursor-pointer"
            >
              <Sliders className="w-4 h-4" />
              <span>Kelola Waktu Absen</span>
            </button>
            <button
              onClick={onOpenGasModal}
              className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm rounded-xl border border-white/20 transition-all cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>Status Google Sheets</span>
            </button>
          </div>
        </div>
      </div>

      {/* Primary KPI Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-indigo-50 text-indigo-600">
            <GraduationCap className="w-7 h-7" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Siswa</div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-0.5">{students.length}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">20 Rombongan Belajar</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-emerald-50 text-emerald-600">
            <Users className="w-7 h-7" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Guru</div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-0.5">{teachers.length}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Wali Kelas &amp; Pengajar</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-teal-50 text-teal-600">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Kehadiran Hari Ini</div>
            <div className="text-2xl sm:text-3xl font-black text-teal-700 mt-0.5">
              {allStats.hadir + allStats.terlambat}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Siswa sudah absen</div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-indigo-900 via-indigo-800 to-slate-900 text-white p-5 rounded-3xl shadow-md flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-white/10 text-emerald-300">
            <TrendingUp className="w-7 h-7" />
          </div>
          <div>
            <div className="text-xs font-bold text-indigo-200 uppercase tracking-wider">Persentase Sekolah</div>
            <div className="text-2xl sm:text-3xl font-black mt-0.5">
              {allStats.persentaseKehadiran}%
            </div>
            <div className="text-[11px] text-indigo-300 mt-0.5">Rasio disiplin hari ini</div>
          </div>
        </div>
      </div>

      {/* 4 Feature Shortcuts Grid (matching Admin Menus) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Shortcut 1: Data Siswa */}
        <div
          onClick={() => onNavigate('students')}
          className="bg-white rounded-3xl p-5 border border-slate-200 hover:border-indigo-400 hover:shadow-md transition-all cursor-pointer group space-y-3"
        >
          <div className="flex items-center justify-between">
            <div className="p-2.5 rounded-2xl bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              <GraduationCap className="w-5 h-5" />
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 group-hover:text-indigo-600 transition-all" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
              Data Siswa &amp; Cetak QR
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Kelola {students.length} siswa, filter per kelas, dan cetak kartu QR presensi.
            </p>
          </div>
        </div>

        {/* Shortcut 2: Data Guru */}
        <div
          onClick={() => onNavigate('teachers')}
          className="bg-white rounded-3xl p-5 border border-slate-200 hover:border-indigo-400 hover:shadow-md transition-all cursor-pointer group space-y-3"
        >
          <div className="flex items-center justify-between">
            <div className="p-2.5 rounded-2xl bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <Users className="w-5 h-5" />
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 group-hover:text-emerald-600 transition-all" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">
              Data Guru &amp; Wali Kelas
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Kelola {teachers.length} guru pengajar, penetapan wali kelas, dan akun login.
            </p>
          </div>
        </div>

        {/* Shortcut 3: Laporan */}
        <div
          onClick={() => onNavigate('recap')}
          className="bg-white rounded-3xl p-5 border border-slate-200 hover:border-indigo-400 hover:shadow-md transition-all cursor-pointer group space-y-3"
        >
          <div className="flex items-center justify-between">
            <div className="p-2.5 rounded-2xl bg-teal-50 text-teal-600 group-hover:bg-teal-600 group-hover:text-white transition-colors">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 group-hover:text-teal-600 transition-all" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 group-hover:text-teal-600 transition-colors">
              Laporan &amp; Rekap Absensi
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Rekap kehadiran spreadsheet, filter per tanggal/kelas, dan ekspor data CSV.
            </p>
          </div>
        </div>

        {/* Shortcut 4: Kelola Absen */}
        <div
          onClick={() => onNavigate('schedule_settings')}
          className="bg-white rounded-3xl p-5 border border-slate-200 hover:border-indigo-400 hover:shadow-md transition-all cursor-pointer group space-y-3"
        >
          <div className="flex items-center justify-between">
            <div className="p-2.5 rounded-2xl bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-colors">
              <Sliders className="w-5 h-5" />
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 group-hover:text-amber-600 transition-all" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 group-hover:text-amber-600 transition-colors">
              Kelola Waktu Absen
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Atur batas datang ({scheduleConfig.jamMasukBatas}) &amp; pulang ({scheduleConfig.jamPulangBuka}).
            </p>
          </div>
        </div>
      </div>

      {/* School Attendance Trend Chart */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Tren Kehadiran Sekolah (7 Hari Terakhir)
            </h3>
            <p className="text-xs text-slate-500">
              Statistik perbandingan hadir tepat waktu, terlambat, sakit, dan izin
            </p>
          </div>
          <span className="text-xs text-emerald-700 font-bold bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200">
            Semua Kelas (VII A - IX G)
          </span>
        </div>

        <AttendanceChart records={records} currentClass="SEMUA" selectedDate={todayString} />
      </div>
    </div>
  );
};
