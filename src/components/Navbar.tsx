import React, { useState, useEffect } from 'react';
import {
  Menu,
  Clock,
  QrCode,
  PlusCircle,
  FileSpreadsheet,
  Sun,
  Sunset,
  PanelLeftClose,
  PanelLeftOpen,
  Sparkles,
  ShieldCheck,
  GraduationCap,
  HardDrive
} from 'lucide-react';
import { User, AttendanceSession } from '../types';
import { GoogleSheetsConfig } from '../utils/googleSheetsSync';

interface NavbarProps {
  user: User;
  currentClass: string;
  allClasses: string[];
  onClassChange: (kelas: string) => void;
  activeTab: string;
  activeSession: AttendanceSession;
  onSessionChange: (session: AttendanceSession) => void;
  onOpenCards?: () => void;
  onOpenManual?: () => void;
  onOpenGasModal?: () => void;
  onOpenDriveModal?: () => void;
  gasConfig: GoogleSheetsConfig;
  isSidebarCollapsed: boolean;
  onToggleSidebarCollapse: () => void;
  onOpenMobileSidebar: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  currentClass,
  allClasses,
  onClassChange,
  activeTab,
  activeSession,
  onSessionChange,
  onOpenCards,
  onOpenManual,
  onOpenGasModal,
  gasConfig,
  isSidebarCollapsed,
  onToggleSidebarCollapse,
  onOpenMobileSidebar,
  onOpenDriveModal,
}) => {
  const [time, setTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const getTabTitle = () => {
    if (user.role === 'admin') {
      switch (activeTab) {
        case 'dashboard':
          return {
            title: 'Dashboard Administrator',
            subtitle: 'Monitoring Terpusat Kehadiran Seluruh Rombel & Guru',
          };
        case 'students':
          return {
            title: 'Data Siswa & Cetak Kartu QR',
            subtitle: 'Direktori Siswa Seluruh Kelas & Kartu Presensi Digital',
          };
        case 'teachers':
          return {
            title: 'Data Guru & Wali Kelas',
            subtitle: 'Manajemen Tenaga Pendidik & Kredensial Login',
          };
        case 'recap':
          return {
            title: 'Laporan & Rekap Kehadiran',
            subtitle: `Google Sheet: ${gasConfig.sheetName} • Ekspor CSV & Spreadsheet`,
          };
        case 'schedule_settings':
          return {
            title: 'Kelola Waktu Absen',
            subtitle: 'Pengaturan Jam Datang, Toleransi Terlambat & Jam Pulang',
          };
        default:
          return {
            title: 'Sistem Absensi Sekolah',
            subtitle: 'Panel Administrator',
          };
      }
    }

    if (user.role === 'guru') {
      switch (activeTab) {
        case 'dashboard':
          return {
            title: `Dashboard Guru • Kelas ${currentClass}`,
            subtitle: 'Ringkasan Kehadiran & Status Siswa Hari Ini',
          };
        case 'students':
          return {
            title: `Data Siswa • Kelas ${currentClass}`,
            subtitle: `Daftar Siswa & Tambah Siswa Baru Kelas ${currentClass}`,
          };
        case 'monitoring':
          return {
            title: `Monitoring Presensi • Kelas ${currentClass}`,
            subtitle: 'Pantau Absensi Siswa & Checklist Cepat Wali Kelas',
          };
        case 'scanner':
          return {
            title: `Pemindai Presensi Kamera & Barcode`,
            subtitle: `Sesi ${activeSession} • Kelas ${currentClass} • Auto-Sync Google Sheet`,
          };
        default:
          return {
            title: `Presensi Siswa • Kelas ${currentClass}`,
            subtitle: `Sesi ${activeSession}`,
          };
      }
    }

    // Role SISWA
    switch (activeTab) {
      case 'dashboard':
        return {
          title: `Dashboard Presensi Siswa`,
          subtitle: `Halo, ${user.nama} • Kelas ${user.kelas}`,
        };
      case 'my_card':
        return {
          title: `Kartu Pelajar & Presensi QR`,
          subtitle: `NISN: ${user.nisn || '-'} • Kelas ${user.kelas}`,
        };
      default:
        return {
          title: `Portal Siswa`,
          subtitle: user.nama,
        };
    }
  };

  const { title, subtitle } = getTabTitle();

  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-slate-200 sticky top-0 z-30 shadow-2xs">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Left: Sidebar Toggle & Page Title */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={onOpenMobileSidebar}
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl lg:hidden cursor-pointer shrink-0"
              aria-label="Buka Menu Navigasi"
            >
              <Menu className="w-5 h-5" />
            </button>

            <button
              onClick={onToggleSidebarCollapse}
              className="hidden lg:flex p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer shrink-0"
              title={isSidebarCollapsed ? 'Buka Sidebar' : 'Ciutkan Sidebar'}
            >
              {isSidebarCollapsed ? (
                <PanelLeftOpen className="w-4 h-4" />
              ) : (
                <PanelLeftClose className="w-4 h-4" />
              )}
            </button>

            <div className="min-w-0">
              <h1 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight truncate leading-tight">
                {title}
              </h1>
              <p className="text-[11px] sm:text-xs text-slate-500 truncate mt-0.5 font-medium">
                {subtitle}
              </p>
            </div>
          </div>

          {/* Right: Sesi pill, Clock, Action buttons */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Realtime Digital Clock */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono font-bold text-slate-700 shadow-2xs">
              <Clock className="w-3.5 h-3.5 text-emerald-600" />
              <span>{time || '00:00:00'} WIB</span>
            </div>

            {/* Sesi Tag & Toggle (for Admin & Guru) */}
            {user.role !== 'siswa' && (
              <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-xl border border-slate-200/60">
                <button
                  onClick={() => onSessionChange('Masuk')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    activeSession === 'Masuk'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Sun className="w-3 h-3" />
                  <span className="hidden sm:inline">Masuk</span>
                </button>
                <button
                  onClick={() => onSessionChange('Pulang')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    activeSession === 'Pulang'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Sunset className="w-3 h-3" />
                  <span className="hidden sm:inline">Pulang</span>
                </button>
              </div>
            )}

            {/* Google Drive Database Sync Button (Admin & Guru) */}
            {user.role !== 'siswa' && onOpenDriveModal && (
              <button
                onClick={onOpenDriveModal}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border transition-all cursor-pointer bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-xs"
                title="Hubungkan database siswa dan guru ke Google Drive"
              >
                <HardDrive className="w-3.5 h-3.5" />
                <span>Google Drive</span>
              </button>
            )}

            {/* Google Sheet Sync Modal Button (Admin & Guru) */}
            {user.role !== 'siswa' && onOpenGasModal && (
              <button
                onClick={onOpenGasModal}
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border transition-colors cursor-pointer bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                title="Buka status koneksi Google Sheets & Apps Script"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>Log Apps Script</span>
              </button>
            )}

            {/* Manual checkin button (Admin & Guru) */}
            {user.role !== 'siswa' && onOpenManual && (
              <button
                onClick={onOpenManual}
                className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl border border-indigo-200 transition-colors shadow-2xs cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>+ Absen Manual</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
