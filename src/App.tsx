import React, { useState, useEffect, useMemo } from 'react';
import confetti from 'canvas-confetti';
import {
  CheckCircle2,
  AlertTriangle,
  QrCode,
  UserCheck,
  Calendar,
  Sparkles,
  Camera,
  X,
  Volume2,
  FileSpreadsheet,
  Settings,
  Clock,
  ArrowRight,
  User as UserIcon,
  CheckCircle,
  ExternalLink,
  ShieldCheck,
  Users,
  Eye,
  Sliders,
  GraduationCap
} from 'lucide-react';
import {
  User,
  Student,
  Teacher,
  AttendanceRecord,
  AttendanceStatus,
  AttendanceSession,
  AttendanceScheduleConfig
} from './types';
import {
  INITIAL_STUDENTS,
  ALL_CLASSES,
  findStudentByQrPayload,
  loadStudents,
  saveStudents,
} from './utils/students';
import { loadTeachers, saveTeachers } from './utils/teachers';
import { loadScheduleConfig, saveScheduleConfig } from './utils/schedule';
import {
  recordAttendance,
  calculateClassStats,
  getTodayString,
  getCurrentTimeString,
} from './utils/attendance';
import {
  loadGoogleSheetsConfig,
  saveGoogleSheetsConfig,
  sendRecordToGoogleSheet,
  GoogleSheetsConfig,
  DEFAULT_LIBRARY_ID,
  DEFAULT_LIBRARY_URL,
} from './utils/googleSheetsSync';
import { soundManager } from './utils/sound';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { CameraScanner } from './components/CameraScanner';
import { StudentCardsModal } from './components/StudentCardsModal';
import { ManualAttendanceModal } from './components/ManualAttendanceModal';
import { AttendanceRecap } from './components/AttendanceRecap';
import { StudentDirectory } from './components/StudentDirectory';
import { LoginScreen } from './components/LoginScreen';
import { GoogleSheetsModal } from './components/GoogleSheetsModal';
import { GoogleDriveSyncModal } from './components/GoogleDriveSyncModal';
import {
  loadDriveSyncState,
  saveDriveSyncState,
  GoogleDriveSyncState,
} from './utils/googleDriveSync';
import { TeacherDirectory } from './components/TeacherDirectory';
import { AttendanceScheduleSettings } from './components/AttendanceScheduleSettings';
import { StudentDashboard } from './components/StudentDashboard';
import { StudentMyCard } from './components/StudentMyCard';
import { TeacherDashboard } from './components/TeacherDashboard';
import { AdminDashboard } from './components/AdminDashboard';

export default function App() {
  // Authentication State
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('absen_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // ignore
      }
    }
    return {
      username: 'guru1',
      role: 'guru',
      kelas: 'VII A',
      nama: 'Wali Kelas VII A',
    };
  });

  // Students list (persisted to localStorage)
  const [students, setStudents] = useState<Student[]>(() => loadStudents());

  // Teachers list
  const [teachers, setTeachers] = useState<Teacher[]>(() => loadTeachers());

  // Attendance Timing Schedule Config (Kelola Absen)
  const [scheduleConfig, setScheduleConfig] = useState<AttendanceScheduleConfig>(() =>
    loadScheduleConfig()
  );

  // Selected class
  const [currentClass, setCurrentClass] = useState<string>(() => {
    if (currentUser?.role === 'admin') return 'SEMUA';
    return currentUser?.kelas || 'VII A';
  });

  // Active Tab: role-dependent
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // When user changes, sync class & default tab
  useEffect(() => {
    setActiveTab('dashboard');
    if (currentUser?.role === 'admin') {
      setCurrentClass('SEMUA');
    } else if (currentUser?.kelas) {
      setCurrentClass(currentUser.kelas);
    }
  }, [currentUser]);

  // Selected date for reports & monitoring
  const [selectedDate, setSelectedDate] = useState<string>(getTodayString());

  // Active Sesi: Masuk vs Pulang (auto defaults based on hour, can be toggled)
  const [activeSession, setActiveSession] = useState<AttendanceSession>(() => {
    const hour = new Date().getHours();
    return hour >= 12 ? 'Pulang' : 'Masuk';
  });

  // Google Sheets Config
  const [gasConfig, setGasConfig] = useState<GoogleSheetsConfig>(() =>
    loadGoogleSheetsConfig()
  );

  // Attendance Records
  const [records, setRecords] = useState<AttendanceRecord[]>(() => {
    const today = getTodayString();
    const now = new Date();
    const getPastDate = (daysAgo: number) => {
      const d = new Date(now);
      d.setDate(now.getDate() - daysAgo);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };

    return [];
  });

  // Sidebar Collapsible & Mobile Drawer State
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('absen_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const toggleSidebarCollapse = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('absen_sidebar_collapsed', String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  // Modals
  const [isCardsModalOpen, setIsCardsModalOpen] = useState(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isGasModalOpen, setIsGasModalOpen] = useState(false);
  const [isDriveModalOpen, setIsDriveModalOpen] = useState(false);

  // Google Drive & Sheets Sync State
  const [driveSyncState, setDriveSyncState] = useState<GoogleDriveSyncState>(() =>
    loadDriveSyncState()
  );

  const handleSaveDriveSyncState = (newState: GoogleDriveSyncState) => {
    setDriveSyncState(newState);
    saveDriveSyncState(newState);
  };

  // Latest Scanned Card Details for instant celebration HUD
  const [lastScannedResult, setLastScannedResult] = useState<{
    student: Student;
    record: AttendanceRecord;
    timestamp: number;
  } | null>(null);

  // Toast feedback
  const [toast, setToast] = useState<{
    type: 'success' | 'warning' | 'info';
    title: string;
    description: string;
  } | null>(null);

  const showToast = (type: 'success' | 'warning' | 'info', title: string, description: string) => {
    setToast({ type, title, description });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  // Save students handler (persisted to localStorage)
  const handleSaveStudents = (newStudents: Student[]) => {
    setStudents(newStudents);
    saveStudents(newStudents);
  };

  // Save teachers handler
  const handleSaveTeachers = (newTeachers: Teacher[]) => {
    setTeachers(newTeachers);
    saveTeachers(newTeachers);
  };

  // Save schedule timing handler (Kelola Absen)
  const handleSaveScheduleConfig = (newConfig: AttendanceScheduleConfig) => {
    setScheduleConfig(newConfig);
    saveScheduleConfig(newConfig);
  };

  // Handle successful scan from Camera / Barcode / File / Simulation
  const handleScanSuccess = (payload: string, fotoBukti?: string) => {
    const student = findStudentByQrPayload(payload, students);

    if (!student) {
      soundManager.playErrorBeep();
      soundManager.speak('Data siswa tidak ditemukan.');
      showToast(
        'warning',
        'Data Siswa Tidak Ditemukan',
        `Kode QR atau NIS (${payload.slice(0, 25)}) tidak cocok dengan data siswa sekolah.`
      );
      return;
    }

    const res = recordAttendance({
      student,
      tanggal: getTodayString(),
      waktu: getCurrentTimeString(),
      sesi: activeSession,
      cutoffTime: scheduleConfig.jamMasukBatas,
      metode: fotoBukti ? 'Foto Selfie' : 'Kamera Live QR',
      fotoBukti,
      existingRecords: records,
    });

    if (res.success && res.record) {
      setRecords(res.updatedRecords);
      setLastScannedResult({
        student,
        record: res.record,
        timestamp: Date.now(),
      });

      // Voice prompt & sound
      soundManager.playSuccessBeep();
      if (activeSession === 'Pulang') {
        soundManager.speak(`Presensi kepulangan tercatat, ${student.nama}. Selamat jalan.`);
      } else if (res.record.status === 'Terlambat') {
        soundManager.speak(`Terlambat, ${student.nama}. Harap datang lebih awal besok.`);
      } else {
        soundManager.speak(`Presensi masuk berhasil, ${student.nama}. Selamat belajar.`);
      }

      // Send to Google Apps Script Web App
      if (gasConfig.autoSync) {
        sendRecordToGoogleSheet(res.record, gasConfig);
      }

      // Confetti celebration
      try {
        confetti({
          particleCount: 45,
          spread: 65,
          origin: { y: 0.7 },
        });
      } catch {
        // safe
      }

      showToast(
        'success',
        `Presensi ${activeSession} Berhasil (${res.record.status})`,
        `${student.nama} (${student.kelas}) • ${res.record.waktu} WIB • Tersinkron ke Spreadsheet`
      );
    }
  };

  // Handle manual attendance save
  const handleSaveManual = (
    student: Student,
    status: AttendanceStatus,
    keterangan: string,
    waktu: string
  ) => {
    const res = recordAttendance({
      student,
      tanggal: selectedDate,
      waktu,
      sesi: activeSession,
      statusOverride: status,
      cutoffTime: scheduleConfig.jamMasukBatas,
      keterangan,
      metode: 'Manual',
      existingRecords: records,
    });

    if (res.success && res.record) {
      setRecords(res.updatedRecords);
      if (gasConfig.autoSync) {
        sendRecordToGoogleSheet(res.record, gasConfig);
      }
      showToast(
        'success',
        'Presensi Manual Tersimpan',
        `${student.nama} (${student.kelas}) dicatat sebagai ${status} pada Google Sheet.`
      );
    }
  };

  // Quick mark from student table
  const handleQuickMark = (student: Student, status: AttendanceStatus) => {
    handleSaveManual(student, status, 'Presensi cepat via dashboard/monitoring', getCurrentTimeString());
  };

  // Save Google Sheets config
  const handleSaveGasConfig = (newConfig: GoogleSheetsConfig) => {
    setGasConfig(newConfig);
    saveGoogleSheetsConfig(newConfig);
  };

  // Calculate stats for current class & selected date
  const stats = useMemo(() => {
    const target = currentClass === 'SEMUA' ? undefined : currentClass;
    return calculateClassStats(students, records, target, selectedDate);
  }, [students, records, currentClass, selectedDate]);

  // Overall school stats for Admin
  const schoolStats = useMemo(() => {
    return calculateClassStats(students, records, undefined, getTodayString());
  }, [students, records]);

  // Handle Login / Logout
  const handleLogin = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('absen_user', JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('absen_user');
  };

  if (!currentUser) {
    return <LoginScreen onLoginSuccess={handleLogin} students={students} />;
  }

  // Active student object for Siswa role
  const activeStudent: Student =
    currentUser.student ||
    students.find((s) => s.nisn === currentUser.nisn || s.nis === currentUser.username) || {
      id: 'default',
      nis: currentUser.username || '-',
      nisn: currentUser.nisn || '-',
      nama: currentUser.nama || 'Siswa',
      kelas: currentUser.kelas || '-',
      jenisKelamin: 'L',
      qrPayload: `SISWA:${currentUser.username || '-'}:${currentUser.kelas || '-'}:${currentUser.nama || 'Siswa'}`,
    };

  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-900 flex font-sans antialiased overflow-x-hidden">
      {/* Role-Specific Collapsible Sidebar Navigation */}
      <Sidebar
        user={currentUser}
        activeTab={activeTab}
        onTabChange={(tab) => {
          if (tab === 'gas') {
            setIsGasModalOpen(true);
          } else {
            setActiveTab(tab);
          }
        }}
        activeSession={activeSession}
        onSessionChange={(s) => setActiveSession(s)}
        currentClass={currentClass}
        allClasses={ALL_CLASSES}
        onClassChange={(cls) => setCurrentClass(cls)}
        gasConfig={gasConfig}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={toggleSidebarCollapse}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        onOpenCards={() => setIsCardsModalOpen(true)}
        onOpenManual={() => setIsManualModalOpen(true)}
        onOpenGasModal={() => setIsGasModalOpen(true)}
        onOpenDriveModal={() => setIsDriveModalOpen(true)}
        onLogout={handleLogout}
        todayCount={
          records.filter(
            (r) =>
              r.tanggal === getTodayString() &&
              (currentClass === 'SEMUA' || r.kelas === currentClass)
          ).length
        }
        totalStudents={
          students.filter(
            (s) => currentClass === 'SEMUA' || s.kelas === currentClass
          ).length
        }
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out">
        {/* Top Navbar */}
        <Navbar
          user={currentUser}
          currentClass={currentClass}
          allClasses={ALL_CLASSES}
          onClassChange={(cls) => setCurrentClass(cls)}
          activeTab={activeTab}
          activeSession={activeSession}
          onSessionChange={(s) => setActiveSession(s)}
          onOpenCards={() => setIsCardsModalOpen(true)}
          onOpenManual={() => setIsManualModalOpen(true)}
          onOpenGasModal={() => setIsGasModalOpen(true)}
          onOpenDriveModal={() => setIsDriveModalOpen(true)}
          gasConfig={gasConfig}
          isSidebarCollapsed={isSidebarCollapsed}
          onToggleSidebarCollapse={toggleSidebarCollapse}
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
        />

        {/* Main Content View */}
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
          {/* Toast Notification */}
          {toast && (
            <div
              className={`fixed top-20 right-4 sm:right-8 z-50 p-4 rounded-2xl shadow-xl border flex items-start gap-3 max-w-sm animate-in slide-in-from-top-4 ${
                toast.type === 'success'
                  ? 'bg-emerald-900 text-white border-emerald-700'
                  : toast.type === 'warning'
                  ? 'bg-amber-900 text-white border-amber-700'
                  : 'bg-indigo-900 text-white border-indigo-700'
              }`}
            >
              {toast.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <h5 className="text-xs font-bold uppercase tracking-wider">{toast.title}</h5>
                <p className="text-xs text-gray-200 mt-0.5 leading-snug">{toast.description}</p>
              </div>
              <button
                onClick={() => setToast(null)}
                className="text-gray-300 hover:text-white p-0.5 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* ========================================================================= */}
          {/* ROLE ADMIN VIEWS: dashboard, data siswa, data guru, laporan, kelola absen */}
          {/* ========================================================================= */}
          {currentUser.role === 'admin' && (
            <>
              {/* Admin Menu 1: Dashboard */}
              {activeTab === 'dashboard' && (
                <AdminDashboard
                  user={currentUser}
                  students={students}
                  teachers={teachers}
                  records={records}
                  allStats={schoolStats}
                  todayString={getTodayString()}
                  scheduleConfig={scheduleConfig}
                  gasConfig={gasConfig}
                  onNavigate={(tab) => setActiveTab(tab)}
                  onOpenGasModal={() => setIsGasModalOpen(true)}
                />
              )}

              {/* Admin Menu 2: Data Siswa */}
              {activeTab === 'students' && (
                <StudentDirectory
                  students={students}
                  currentClass={currentClass}
                  allClasses={ALL_CLASSES}
                  records={records}
                  todayString={getTodayString()}
                  onClassChange={(cls) => setCurrentClass(cls)}
                  onSaveStudents={handleSaveStudents}
                  onQuickMark={handleQuickMark}
                  onOpenCards={() => setIsCardsModalOpen(true)}
                  onOpenDriveSync={() => setIsDriveModalOpen(true)}
                  onNotify={showToast}
                />
              )}

              {/* Admin Menu 3: Data Guru */}
              {activeTab === 'teachers' && (
                <TeacherDirectory
                  teachers={teachers}
                  onSaveTeachers={handleSaveTeachers}
                  onOpenDriveSync={() => setIsDriveModalOpen(true)}
                  onNotify={showToast}
                />
              )}

              {/* Admin Menu 4: Laporan */}
              {activeTab === 'recap' && (
                <AttendanceRecap
                  records={records}
                  students={students}
                  currentClass={currentClass}
                  allClasses={ALL_CLASSES}
                  isAdmin={true}
                  onClassChange={(cls) => setCurrentClass(cls)}
                  selectedDate={selectedDate}
                  onDateChange={(d) => setSelectedDate(d)}
                  stats={stats}
                  onOpenGasModal={() => setIsGasModalOpen(true)}
                />
              )}

              {/* Admin Menu 5: Kelola Absen */}
              {activeTab === 'schedule_settings' && (
                <AttendanceScheduleSettings
                  config={scheduleConfig}
                  onSaveConfig={handleSaveScheduleConfig}
                  onNotify={showToast}
                />
              )}
            </>
          )}

          {/* ========================================================================= */}
          {/* ROLE GURU VIEWS: dashboard, monitoring, scan absensi                      */}
          {/* ========================================================================= */}
          {currentUser.role === 'guru' && (
            <>
              {/* Guru Menu 1: Dashboard */}
              {activeTab === 'dashboard' && (
                <TeacherDashboard
                  user={currentUser}
                  currentClass={currentClass}
                  students={students}
                  records={records}
                  stats={stats}
                  todayString={getTodayString()}
                  activeSession={activeSession}
                  onGoToScanner={() => setActiveTab('scanner')}
                  onGoToMonitoring={() => setActiveTab('monitoring')}
                  onGoToStudents={() => setActiveTab('students')}
                  onOpenManualModal={() => setIsManualModalOpen(true)}
                  onQuickMark={handleQuickMark}
                />
              )}

              {/* Guru Menu 2: Data Siswa (Khusus Kelas Guru & Tambah Siswa Baru) */}
              {activeTab === 'students' && (
                <StudentDirectory
                  students={students}
                  currentClass={currentUser.kelas || currentClass}
                  allClasses={ALL_CLASSES}
                  records={records}
                  todayString={getTodayString()}
                  isGuruRole={true}
                  teacherClass={currentUser.kelas}
                  onSaveStudents={handleSaveStudents}
                  onQuickMark={handleQuickMark}
                  onOpenCards={() => setIsCardsModalOpen(true)}
                  onOpenDriveSync={() => setIsDriveModalOpen(true)}
                  onNotify={showToast}
                />
              )}

              {/* Guru Menu 2: Monitoring */}
              {activeTab === 'monitoring' && (
                <div className="space-y-6">
                  <div className="bg-gradient-to-r from-emerald-800 via-teal-700 to-slate-900 rounded-3xl p-6 text-white shadow-md flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/20 backdrop-blur-md mb-1.5">
                        <Eye className="w-3.5 h-3.5 text-emerald-300" />
                        <span>Monitoring Kehadiran Kelas {currentClass}</span>
                      </div>
                      <h2 className="text-xl sm:text-2xl font-black">
                        Monitoring Presensi Siswa
                      </h2>
                      <p className="text-xs sm:text-sm text-emerald-100 mt-1 max-w-xl">
                        Pantau daftar hadir harian, status kehadiran siswa binaan, dan lakukan verifikasi izin/sakit siswa.
                      </p>
                    </div>

                    <button
                      onClick={() => setIsManualModalOpen(true)}
                      className="flex items-center gap-2 px-4 py-2.5 bg-white text-emerald-950 font-bold text-xs sm:text-sm rounded-xl hover:bg-emerald-50 transition-colors shadow-sm cursor-pointer"
                    >
                      <span>+ Input Presensi Manual</span>
                    </button>
                  </div>

                  <AttendanceRecap
                    records={records}
                    students={students}
                    currentClass={currentClass}
                    allClasses={ALL_CLASSES}
                    isAdmin={false}
                    onClassChange={(cls) => setCurrentClass(cls)}
                    selectedDate={selectedDate}
                    onDateChange={(d) => setSelectedDate(d)}
                    stats={stats}
                    onOpenGasModal={() => setIsGasModalOpen(true)}
                  />
                </div>
              )}

              {/* Guru Menu 3: Scan Absensi */}
              {activeTab === 'scanner' && (
                <div className="space-y-6">
                  {/* Google Apps Script Integration Banner */}
                  <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 rounded-3xl p-5 text-white shadow-md flex flex-wrap items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-white/20 backdrop-blur-md">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                        Google Apps Script Library {DEFAULT_LIBRARY_ID.slice(0, 8)}... (v5)
                      </div>
                      <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2">
                        Pemindai Presensi Kamera Siswa &bull; Sesi {activeSession}
                      </h2>
                      <p className="text-xs text-emerald-100 max-w-xl">
                        Arahkan kartu QR siswa ke kamera atau gunakan scanner barcode USB. Batas tepat waktu pukul {scheduleConfig.jamMasukBatas} WIB.
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => setIsGasModalOpen(true)}
                        className="px-3.5 py-2 bg-emerald-950/60 hover:bg-emerald-950 text-emerald-100 font-bold text-xs rounded-xl border border-emerald-400/40 transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <FileSpreadsheet className="w-4 h-4 text-emerald-300" />
                        Pengaturan Apps Script
                      </button>
                      <button
                        onClick={() => setIsCardsModalOpen(true)}
                        className="px-3.5 py-2 bg-white text-emerald-900 font-bold text-xs rounded-xl hover:bg-emerald-50 transition-colors shadow-sm cursor-pointer"
                      >
                        Kartu QR Kelas {currentClass}
                      </button>
                    </div>
                  </div>

                  {/* Split Grid: Live Camera (7 cols) & Real-time Sheet Feed (5 cols) */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* Left: Camera Scanner */}
                    <div className="lg:col-span-7">
                      <CameraScanner
                        activeClass={currentClass}
                        activeSession={activeSession}
                        onScanSuccess={handleScanSuccess}
                      />
                    </div>

                    {/* Right: Last Scanned Result Card & Today's Sheet Feed */}
                    <div className="lg:col-span-5 space-y-4">
                      {/* Dynamic Scanned Student Result Card */}
                      {lastScannedResult && (
                        <div className="bg-white rounded-3xl border-2 border-emerald-500 shadow-lg p-5 animate-in zoom-in-95 space-y-3 relative overflow-hidden">
                          <div className="absolute top-0 right-0 bg-emerald-600 text-white px-3 py-1 text-[10px] font-bold rounded-bl-xl uppercase tracking-wider flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            Presensi Berhasil
                          </div>

                          <div className="flex items-center gap-3 pt-1">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-bold text-lg shadow-md shrink-0">
                              {lastScannedResult.student.nama
                                .split(' ')
                                .map((n) => n[0])
                                .slice(0, 2)
                                .join('')}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="text-xs text-slate-500 font-mono">
                                NIS: {lastScannedResult.student.nis} &bull; Kelas {lastScannedResult.student.kelas}
                              </div>
                              <h3 className="text-base font-bold text-slate-950 truncate">
                                {lastScannedResult.student.nama}
                              </h3>
                              <div className="flex items-center gap-2 mt-1">
                                <span
                                  className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                                    lastScannedResult.record.status === 'Hadir'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : 'bg-amber-100 text-amber-800'
                                  }`}
                                >
                                  {lastScannedResult.record.status} ({lastScannedResult.record.waktu} WIB)
                                </span>
                                <span className="text-[11px] text-slate-500">
                                  Sesi: {lastScannedResult.record.sesi || activeSession}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900 flex items-center justify-between">
                            <span className="flex items-center gap-1.5 font-medium">
                              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                              Tersinkron ke Google Sheet ({gasConfig.sheetName})
                            </span>
                            <span className="text-[10px] text-emerald-700 font-bold">Real-time</span>
                          </div>
                        </div>
                      )}

                      {/* Today's Spreadsheet Activity Table */}
                      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-5 space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-sm font-bold text-slate-900">
                                Log Presensi Spreadsheet
                              </h3>
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-100 text-slate-600">
                                {
                                  records.filter(
                                    (r) =>
                                      r.tanggal === getTodayString() &&
                                      (currentClass === 'SEMUA' || r.kelas === currentClass)
                                  ).length
                                } Baris
                              </span>
                            </div>
                            <p className="text-xs text-slate-500">
                              Kelas {currentClass} &bull; Tanggal {selectedDate}
                            </p>
                          </div>
                          <button
                            onClick={() => setActiveTab('monitoring')}
                            className="text-xs font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 cursor-pointer"
                          >
                            Buka Monitoring &rarr;
                          </button>
                        </div>

                        <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
                          {records
                            .filter(
                              (r) =>
                                r.tanggal === getTodayString() &&
                                (currentClass === 'SEMUA' || r.kelas === currentClass)
                            )
                            .slice(0, 10)
                            .map((r, idx) => (
                              <div
                                key={r.id}
                                className="p-3 rounded-2xl bg-slate-50/80 hover:bg-emerald-50/50 border border-slate-100 transition-colors flex items-center justify-between gap-3"
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <span className="w-6 h-6 rounded-lg bg-slate-200/70 font-mono text-[10px] font-bold text-slate-600 flex items-center justify-center shrink-0">
                                    {idx + 1}
                                  </span>
                                  <div className="space-y-0.5 min-w-0">
                                    <div className="text-xs font-bold text-slate-900 truncate">
                                      {r.nama}
                                    </div>
                                    <div className="text-[11px] text-slate-500 flex items-center gap-1.5 font-mono">
                                      <span>{r.nis}</span>
                                      <span>&bull;</span>
                                      <span>{r.waktu} WIB</span>
                                      <span>&bull;</span>
                                      <span className="text-emerald-700 font-semibold">
                                        {r.sesi || 'Masuk'}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                <span
                                  className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full shrink-0 ${
                                    r.status === 'Hadir'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : r.status === 'Terlambat'
                                      ? 'bg-amber-100 text-amber-800'
                                      : r.status === 'Sakit'
                                      ? 'bg-blue-100 text-blue-800'
                                      : r.status === 'Izin'
                                      ? 'bg-purple-100 text-purple-800'
                                      : 'bg-red-100 text-red-800'
                                  }`}
                                >
                                  {r.status}
                                </span>
                              </div>
                            ))}

                          {records.filter(
                            (r) =>
                              r.tanggal === getTodayString() &&
                              (currentClass === 'SEMUA' || r.kelas === currentClass)
                          ).length === 0 && (
                            <div className="py-8 text-center text-slate-400 text-xs">
                              Belum ada siswa yang presensi hari ini.
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Quick Student Cards Carousel for instant simulation */}
                  <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-5 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                          <Sparkles className="w-4 h-4 text-emerald-600" />
                          Simulasi Pindai Cepat Siswa (Kelas {currentClass})
                        </h4>
                        <p className="text-xs text-slate-500">
                          Klik kartu nama siswa di bawah untuk menguji pemindaian dan sinkronisasi ke Google Sheet tanpa kartu fisik.
                        </p>
                      </div>
                      <button
                        onClick={() => setIsCardsModalOpen(true)}
                        className="text-xs font-bold text-emerald-700 hover:text-emerald-900 cursor-pointer"
                      >
                        Cetak Semua Kartu QR &rarr;
                      </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
                      {students
                        .filter((s) => s.kelas === currentClass)
                        .map((s) => (
                          <button
                            key={s.id}
                            onClick={() => handleScanSuccess(s.qrPayload)}
                            className="p-2.5 rounded-2xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/60 text-left transition-all group cursor-pointer shadow-2xs"
                          >
                            <div className="text-[10px] text-slate-400 font-mono">NIS {s.nis}</div>
                            <div className="text-xs font-bold text-slate-900 truncate mt-0.5 group-hover:text-emerald-800">
                              {s.nama.split(' ')[0]} {s.nama.split(' ')[1] || ''}
                            </div>
                            <div className="text-[10px] text-emerald-700 mt-1 font-semibold flex items-center gap-1">
                              <QrCode className="w-3 h-3" />
                              Pindai Siswa
                            </div>
                          </button>
                        ))}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ========================================================================= */}
          {/* ROLE SISWA VIEWS: dashboard, kartu saya                                   */}
          {/* ========================================================================= */}
          {currentUser.role === 'siswa' && (
            <>
              {/* Siswa Menu 1: Dashboard */}
              {activeTab === 'dashboard' && (
                <StudentDashboard
                  user={currentUser}
                  student={activeStudent}
                  records={records}
                  todayString={getTodayString()}
                  scheduleConfig={scheduleConfig}
                  onGoToCard={() => setActiveTab('my_card')}
                />
              )}

              {/* Siswa Menu 2: Kartu Saya */}
              {activeTab === 'my_card' && (
                <StudentMyCard
                  student={activeStudent}
                  onNotify={showToast}
                />
              )}
            </>
          )}
        </main>

        {/* Google Drive & Sheets 2-Way Sync Database Modal */}
        <GoogleDriveSyncModal
          isOpen={isDriveModalOpen}
          onClose={() => setIsDriveModalOpen(false)}
          students={students}
          teachers={teachers}
          records={records}
          onUpdateStudents={handleSaveStudents}
          onUpdateTeachers={handleSaveTeachers}
          driveSyncState={driveSyncState}
          onSaveDriveSyncState={handleSaveDriveSyncState}
          onNotify={showToast}
        />

        {/* Google Sheets & Apps Script Modal */}
        <GoogleSheetsModal
          isOpen={isGasModalOpen}
          onClose={() => setIsGasModalOpen(false)}
          config={gasConfig}
          onSaveConfig={handleSaveGasConfig}
          records={records}
          onNotify={showToast}
        />

        {/* Student QR Cards Modal */}
        <StudentCardsModal
          isOpen={isCardsModalOpen}
          onClose={() => setIsCardsModalOpen(false)}
          students={students}
          currentClass={currentClass === 'SEMUA' ? 'VII A' : currentClass}
          onSimulateScan={(s) => handleScanSuccess(s.qrPayload)}
        />

        {/* Manual Attendance Modal */}
        <ManualAttendanceModal
          isOpen={isManualModalOpen}
          onClose={() => setIsManualModalOpen(false)}
          students={students}
          currentClass={currentClass === 'SEMUA' ? 'VII A' : currentClass}
          onSaveManual={handleSaveManual}
        />
      </div>
    </div>
  );
}
