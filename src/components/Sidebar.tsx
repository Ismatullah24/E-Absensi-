import React from 'react';
import {
  Camera,
  BarChart3,
  BookOpen,
  FileSpreadsheet,
  QrCode,
  PlusCircle,
  Sun,
  Sunset,
  ChevronLeft,
  ChevronRight,
  LogOut,
  X,
  Sparkles,
  Users,
  GraduationCap,
  Sliders,
  Eye,
  LayoutDashboard,
  ShieldCheck,
  IdCard,
  PanelLeftClose,
  PanelLeftOpen,
  HardDrive
} from 'lucide-react';
import { User, AttendanceSession } from '../types';
import { GoogleSheetsConfig } from '../utils/googleSheetsSync';

interface SidebarProps {
  user: User;
  activeTab: string;
  onTabChange: (tab: string) => void;
  activeSession: AttendanceSession;
  onSessionChange: (session: AttendanceSession) => void;
  currentClass: string;
  allClasses: string[];
  onClassChange: (kelas: string) => void;
  gasConfig: GoogleSheetsConfig;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  onOpenCards?: () => void;
  onOpenManual?: () => void;
  onOpenGasModal?: () => void;
  onOpenDriveModal?: () => void;
  onLogout: () => void;
  todayCount: number;
  totalStudents: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  user,
  activeTab,
  onTabChange,
  activeSession,
  onSessionChange,
  currentClass,
  allClasses,
  onClassChange,
  gasConfig,
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
  onOpenCards,
  onOpenManual,
  onOpenGasModal,
  onOpenDriveModal,
  onLogout,
  todayCount,
  totalStudents,
}) => {
  // Define strict menu items based on role
  const getNavItems = () => {
    if (user.role === 'admin') {
      return [
        {
          id: 'dashboard',
          label: 'Dashboard',
          sublabel: 'Statistik & Monitoring Global',
          icon: LayoutDashboard,
          badge: 'Admin',
          badgeColor: 'bg-indigo-100 text-indigo-800',
        },
        {
          id: 'students',
          label: 'Data Siswa',
          sublabel: 'Direktori & Cetak Kartu QR',
          icon: GraduationCap,
          badge: `${totalStudents} Siswa`,
          badgeColor: 'bg-emerald-50 text-emerald-700',
        },
        {
          id: 'teachers',
          label: 'Data Guru',
          sublabel: 'Wali Kelas & Pengajar',
          icon: Users,
          badge: '20 Guru',
          badgeColor: 'bg-purple-50 text-purple-700',
        },
        {
          id: 'recap',
          label: 'Laporan',
          sublabel: 'Rekap Absensi Spreadsheet',
          icon: FileSpreadsheet,
          badge: `${todayCount} Data`,
          badgeColor: 'bg-teal-50 text-teal-700',
        },
        {
          id: 'schedule_settings',
          label: 'Kelola Absen',
          sublabel: 'Atur Waktu Datang & Pulang',
          icon: Sliders,
          badge: 'Jadwal',
          badgeColor: 'bg-amber-100 text-amber-800',
        },
      ];
    }

    if (user.role === 'guru') {
      const classStudentsCount = totalStudents;
      return [
        {
          id: 'dashboard',
          label: 'Dashboard',
          sublabel: `Ringkasan Kelas ${currentClass}`,
          icon: LayoutDashboard,
          badge: currentClass,
          badgeColor: 'bg-emerald-100 text-emerald-800',
        },
        {
          id: 'students',
          label: 'Data Siswa',
          sublabel: `Siswa Kelas ${currentClass}`,
          icon: GraduationCap,
          badge: `${classStudentsCount} Siswa`,
          badgeColor: 'bg-emerald-50 text-emerald-700',
        },
        {
          id: 'monitoring',
          label: 'Monitoring',
          sublabel: 'Pantau Absensi Kelas',
          icon: Eye,
          badge: `${todayCount} Masuk`,
          badgeColor: 'bg-teal-50 text-teal-700',
        },
        {
          id: 'scanner',
          label: 'Scan Absensi',
          sublabel: 'Kamera QR & Barcode Live',
          icon: Camera,
          badge: 'Live',
          badgeColor: 'bg-emerald-500 text-white',
        },
      ];
    }

    // Role SISWA
    return [
      {
        id: 'dashboard',
        label: 'Dashboard',
        sublabel: 'Status & Riwayat Presensi',
        icon: LayoutDashboard,
        badge: 'Saya',
        badgeColor: 'bg-emerald-100 text-emerald-800',
      },
      {
        id: 'my_card',
        label: 'Kartu Saya',
        sublabel: 'Kartu Pelajar & QR Presensi',
        icon: IdCard,
        badge: 'QR',
        badgeColor: 'bg-teal-500 text-white',
      },
    ];
  };

  const navItems = getNavItems();

  const handleNavClick = (tabId: string) => {
    onTabChange(tabId);
    if (isMobileOpen) {
      onCloseMobile();
    }
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs transition-opacity lg:hidden"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-white border-r border-slate-200 shadow-sm transition-all duration-300 ease-in-out lg:static ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${isCollapsed ? 'lg:w-20' : 'lg:w-68'} w-72`}
      >
        {/* Sidebar Header / Logo */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-slate-100">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-indigo-600 text-white flex items-center justify-center shadow-sm shrink-0">
              <Camera className="w-5 h-5" />
            </div>

            {(!isCollapsed || isMobileOpen) && (
              <div className="min-w-0 transition-opacity duration-200">
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-slate-900 text-sm tracking-tight leading-none truncate">
                    Presensi Smart
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 uppercase">
                    {user.role}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-medium truncate mt-0.5">
                  Google Sheet Connected
                </p>
              </div>
            )}
          </div>

          {/* Close Button on Mobile, or Collapse Toggle on Desktop */}
          <div className="flex items-center">
            {isMobileOpen ? (
              <button
                onClick={onCloseMobile}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors lg:hidden cursor-pointer"
                aria-label="Tutup Menu"
              >
                <X className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={onToggleCollapse}
                className="hidden lg:flex p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                title={isCollapsed ? 'Perluas Sidebar' : 'Ciutkan Sidebar'}
                aria-label="Toggle Sidebar"
              >
                {isCollapsed ? (
                  <PanelLeftOpen className="w-4 h-4" />
                ) : (
                  <PanelLeftClose className="w-4 h-4" />
                )}
              </button>
            )}
          </div>
        </div>

        {/* Scrollable Nav Items */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {/* Active Sesi Indicator (for Admin & Guru) */}
          {user.role !== 'siswa' && (!isCollapsed || isMobileOpen) && (
            <div className="px-2">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                Sesi Presensi Aktif
              </div>
              <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-2xl">
                <button
                  onClick={() => onSessionChange('Masuk')}
                  className={`py-2 px-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    activeSession === 'Masuk'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Sun className="w-3.5 h-3.5" />
                  <span>Masuk</span>
                </button>
                <button
                  onClick={() => onSessionChange('Pulang')}
                  className={`py-2 px-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    activeSession === 'Pulang'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Sunset className="w-3.5 h-3.5" />
                  <span>Pulang</span>
                </button>
              </div>
            </div>
          )}

          {/* Class Filter if Admin or Guru */}
          {user.role === 'admin' && (!isCollapsed || isMobileOpen) && (
            <div className="px-2">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Filter Kelas
              </label>
              <select
                value={currentClass}
                onChange={(e) => onClassChange(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="SEMUA">Semua Kelas (VII A - IX G)</option>
                {allClasses.map((c) => (
                  <option key={c} value={c}>
                    Kelas {c}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Main Navigation Links */}
          <div>
            {(!isCollapsed || isMobileOpen) && (
              <div className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                Menu {user.role === 'admin' ? 'Admin' : user.role === 'guru' ? 'Guru' : 'Siswa'}
              </div>
            )}
            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    title={isCollapsed && !isMobileOpen ? item.label : undefined}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-all group cursor-pointer text-left ${
                      isActive
                        ? 'bg-emerald-600 text-white font-bold shadow-sm shadow-emerald-600/20'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium'
                    }`}
                  >
                    <div
                      className={`p-2 rounded-xl transition-colors shrink-0 ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200 group-hover:text-slate-800'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>

                    {(!isCollapsed || isMobileOpen) && (
                      <div className="flex-1 min-w-0 flex items-center justify-between gap-1">
                        <div className="truncate">
                          <div className="text-xs leading-tight truncate">
                            {item.label}
                          </div>
                          <div
                            className={`text-[10px] leading-tight truncate mt-0.5 ${
                              isActive ? 'text-emerald-100' : 'text-slate-400'
                            }`}
                          >
                            {item.sublabel}
                          </div>
                        </div>

                        {item.badge && (
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                              isActive
                                ? 'bg-white/25 text-white'
                                : item.badgeColor
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Quick Actions for Guru & Admin */}
          {user.role !== 'siswa' && (!isCollapsed || isMobileOpen) && (
            <div className="pt-2 border-t border-slate-100 px-2 space-y-2">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                Aksi Cepat
              </div>
              {onOpenDriveModal && (
                <button
                  onClick={onOpenDriveModal}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 transition-all cursor-pointer text-left shadow-2xs"
                >
                  <HardDrive className="w-4 h-4 text-emerald-200" />
                  <span>Database Google Drive</span>
                </button>
              )}
              {onOpenCards && (
                <button
                  onClick={onOpenCards}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-950 transition-colors cursor-pointer text-left border border-slate-100"
                >
                  <QrCode className="w-4 h-4 text-emerald-600" />
                  <span>Cetak Kartu QR Siswa</span>
                </button>
              )}
              {onOpenManual && (
                <button
                  onClick={onOpenManual}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-950 transition-colors cursor-pointer text-left border border-slate-100"
                >
                  <PlusCircle className="w-4 h-4 text-indigo-600" />
                  <span>Input Presensi Manual</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* User Profile & Logout Footer */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/70">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                {user.nama
                  .split(' ')
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join('')}
              </div>

              {(!isCollapsed || isMobileOpen) && (
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-900 truncate">
                    {user.nama}
                  </div>
                  <div className="text-[10px] text-slate-500 truncate capitalize font-medium">
                    {user.role} {user.kelas ? `• Kelas ${user.kelas}` : ''}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={onLogout}
              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
              title="Keluar / Ganti Akun"
              aria-label="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
