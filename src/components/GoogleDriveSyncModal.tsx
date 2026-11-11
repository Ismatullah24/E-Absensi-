import React, { useState, useEffect } from 'react';
import {
  X,
  FileSpreadsheet,
  UploadCloud,
  DownloadCloud,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  RefreshCw,
  FolderOpen,
  PlusCircle,
  HelpCircle,
  Users,
  GraduationCap,
  HardDrive
} from 'lucide-react';
import { Student, Teacher, AttendanceRecord } from '../types';
import {
  GoogleDriveSyncState,
  DriveSpreadsheetMeta,
  searchDriveSpreadsheets,
  createDriveDatabaseSpreadsheet,
  pushAllDataToSpreadsheet,
  pullDataFromSpreadsheet,
} from '../utils/googleDriveSync';
import {
  signInWithGoogleWorkspace,
  signOutGoogleWorkspace,
  getGoogleAccessToken,
  initGoogleAuth,
} from '../utils/googleAuth';
import { User as FirebaseUser } from 'firebase/auth';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  teachers: Teacher[];
  records: AttendanceRecord[];
  onUpdateStudents: (students: Student[]) => void;
  onUpdateTeachers: (teachers: Teacher[]) => void;
  driveSyncState: GoogleDriveSyncState;
  onSaveDriveSyncState: (state: GoogleDriveSyncState) => void;
  onNotify: (type: 'success' | 'warning' | 'info', title: string, desc: string) => void;
}

export const GoogleDriveSyncModal: React.FC<Props> = ({
  isOpen,
  onClose,
  students,
  teachers,
  records,
  onUpdateStudents,
  onUpdateTeachers,
  driveSyncState,
  onSaveDriveSyncState,
  onNotify,
}) => {
  const [googleUser, setGoogleUser] = useState<FirebaseUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(getGoogleAccessToken());
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [driveFiles, setDriveFiles] = useState<DriveSpreadsheetMeta[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [newSheetTitle, setNewSheetTitle] = useState(
    driveSyncState.spreadsheetName || 'REMIX E-ABSENSI'
  );

  // Confirmation modal state for mutating operations
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    actionType: 'push' | 'pull';
  } | null>(null);

  // Monitor auth status
  useEffect(() => {
    const unsubscribe = initGoogleAuth(
      (user, token) => {
        setGoogleUser(user);
        setAccessToken(token);
      },
      () => {
        setGoogleUser(null);
        setAccessToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  // When access token is available, automatically search files
  useEffect(() => {
    if (accessToken && isOpen) {
      loadDriveFiles(accessToken);
    }
  }, [accessToken, isOpen]);

  const loadDriveFiles = async (token: string) => {
    setIsLoadingFiles(true);
    try {
      const files = await searchDriveSpreadsheets(token);
      setDriveFiles(files);
    } catch (err: any) {
      console.warn('Gagal memuat file Google Drive:', err);
    } finally {
      setIsLoadingFiles(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoggingIn(true);
    try {
      const res = await signInWithGoogleWorkspace();
      if (res) {
        setGoogleUser(res.user);
        setAccessToken(res.accessToken);
        onNotify(
          'success',
          'Google Drive Terhubung',
          `Akun ${res.user.email} berhasil dihubungkan ke Google Drive.`
        );
        loadDriveFiles(res.accessToken);
      }
    } catch (err: any) {
      onNotify(
        'warning',
        'Gagal Menghubungkan Google',
        err.message || 'Izin Google Drive dibatalkan atau popup ditutup.'
      );
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleGoogleSignOut = async () => {
    await signOutGoogleWorkspace();
    setGoogleUser(null);
    setAccessToken(null);
    setDriveFiles([]);
    onNotify('info', 'Google Drive Terputus', 'Sesi akun Google Anda telah dikeluarkan.');
  };

  // Create new Spreadsheet on Google Drive
  const handleCreateDatabase = async () => {
    if (!accessToken) {
      onNotify('warning', 'Perlu Login', 'Silakan masuk ke Google Drive terlebih dahulu.');
      return;
    }

    setIsProcessing(true);
    try {
      const result = await createDriveDatabaseSpreadsheet(
        accessToken,
        newSheetTitle,
        students,
        teachers,
        records
      );

      const updatedState: GoogleDriveSyncState = {
        spreadsheetId: result.spreadsheetId,
        spreadsheetName: newSheetTitle,
        spreadsheetUrl: result.spreadsheetUrl,
        lastSyncTime: new Date().toLocaleTimeString('id-ID'),
        lastSyncStatus: 'success',
      };

      onSaveDriveSyncState(updatedState);
      onNotify(
        'success',
        'Database Google Drive Dibuat!',
        `Spreadsheet "${newSheetTitle}" berhasil dibuat dan diisi data siswa & guru.`
      );
      loadDriveFiles(accessToken);
    } catch (err: any) {
      onNotify('warning', 'Gagal Membuat Database', err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Select existing file
  const handleSelectFile = (file: DriveSpreadsheetMeta) => {
    const updatedState: GoogleDriveSyncState = {
      spreadsheetId: file.id,
      spreadsheetName: file.name,
      spreadsheetUrl: file.webViewLink || `https://docs.google.com/spreadsheets/d/${file.id}/edit`,
      lastSyncTime: driveSyncState.lastSyncTime,
      lastSyncStatus: 'idle',
    };
    onSaveDriveSyncState(updatedState);
    onNotify(
      'info',
      'Spreadsheet Terpilih',
      `Database dihubungkan ke spreadsheet: ${file.name}`
    );
  };

  // Trigger push with mandatory confirmation
  const requestPushConfirmation = () => {
    if (!driveSyncState.spreadsheetId) {
      onNotify('warning', 'Pilih Spreadsheet', 'Tentukan atau buat spreadsheet di Google Drive terlebih dahulu.');
      return;
    }

    setConfirmDialog({
      isOpen: true,
      title: 'Kirim Data Aplikasi ke Google Drive?',
      description: `Operasi ini akan memperbarui baris data pada tab "DATA_SISWA" (${students.length} siswa), "DATA_GURU" (${teachers.length} guru), dan "LOG_PRESENSI" (${records.length} baris) di spreadsheet Google Drive "${driveSyncState.spreadsheetName}".`,
      actionType: 'push',
    });
  };

  // Trigger pull with mandatory confirmation
  const requestPullConfirmation = () => {
    if (!driveSyncState.spreadsheetId) {
      onNotify('warning', 'Pilih Spreadsheet', 'Tentukan atau buat spreadsheet di Google Drive terlebih dahulu.');
      return;
    }

    setConfirmDialog({
      isOpen: true,
      title: 'Tarik Data dari Google Drive ke Aplikasi?',
      description: `Operasi ini akan membaca data terbaru yang Anda edit di Google Drive Spreadsheet ("${driveSyncState.spreadsheetName}") dan menimpa database lokal aplikasi siswa & guru.`,
      actionType: 'pull',
    });
  };

  // Execute confirmed mutation
  const handleConfirmAction = async () => {
    if (!confirmDialog || !accessToken || !driveSyncState.spreadsheetId) return;

    const action = confirmDialog.actionType;
    setConfirmDialog(null);
    setIsProcessing(true);

    try {
      if (action === 'push') {
        await pushAllDataToSpreadsheet(
          accessToken,
          driveSyncState.spreadsheetId,
          students,
          teachers,
          records
        );

        onSaveDriveSyncState({
          ...driveSyncState,
          lastSyncTime: new Date().toLocaleTimeString('id-ID'),
          lastSyncStatus: 'success',
        });

        onNotify(
          'success',
          'Berhasil Sinkron ke Google Drive',
          `Data ${students.length} siswa & ${teachers.length} guru berhasil diperbarui di spreadsheet Google Drive.`
        );
      } else if (action === 'pull') {
        const pulled = await pullDataFromSpreadsheet(accessToken, driveSyncState.spreadsheetId);

        if (pulled.students.length > 0) {
          onUpdateStudents(pulled.students);
        }
        if (pulled.teachers.length > 0) {
          onUpdateTeachers(pulled.teachers);
        }

        onSaveDriveSyncState({
          ...driveSyncState,
          lastSyncTime: new Date().toLocaleTimeString('id-ID'),
          lastSyncStatus: 'success',
        });

        onNotify(
          'success',
          'Data Berhasil Dimuat dari Drive',
          `Berhasil memperbarui database: ${pulled.students.length} siswa dan ${pulled.teachers.length} guru.`
        );
      }
    } catch (err: any) {
      onNotify('warning', 'Gagal Memproses Data Drive', err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden my-6">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-indigo-900 p-6 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-xs">
              <HardDrive className="w-6 h-6 text-emerald-300" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-white/20 backdrop-blur-md mb-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Google Drive & Sheets Cloud Sync</span>
              </div>
              <h2 className="text-xl font-black">Integrasi Database Google Drive</h2>
              <p className="text-xs text-emerald-100">
                Kelola dan ubah data siswa & guru langsung melalui Google Spreadsheet di Google Drive Anda.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Section 1: Google Account Authentication */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Status Akun Google Workspace
                </div>
                {googleUser ? (
                  <div className="flex items-center gap-2 mt-1">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <div>
                      <div className="text-sm font-bold text-slate-900">
                        {googleUser.displayName || 'Pengguna Google'}
                      </div>
                      <div className="text-xs text-slate-500">{googleUser.email}</div>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm font-semibold text-slate-700 mt-1">
                    Belum Terhubung ke Google Drive
                  </div>
                )}
              </div>

              <div>
                {googleUser ? (
                  <button
                    onClick={handleGoogleSignOut}
                    className="px-3.5 py-2 text-xs font-bold text-red-600 hover:bg-red-50 border border-red-200 rounded-xl transition-colors cursor-pointer"
                  >
                    Putuskan Akun
                  </button>
                ) : (
                  <button
                    onClick={handleGoogleSignIn}
                    disabled={isLoggingIn}
                    className="flex items-center gap-2.5 px-5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer active:scale-95"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span>{isLoggingIn ? 'Menghubungkan...' : 'Sign in with Google'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Section 2: Active Linked Spreadsheet Details */}
          {googleUser && (
            <div className="space-y-4">
              <div className="p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="w-5 h-5 text-emerald-700" />
                    <h3 className="text-sm font-bold text-slate-900">
                      Spreadsheet Database Terpilih
                    </h3>
                  </div>

                  {driveSyncState.spreadsheetUrl && (
                    <a
                      href={driveSyncState.spreadsheetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
                    >
                      <span>Buka di Google Drive</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-white rounded-xl border border-emerald-100">
                    <div className="text-slate-400 font-medium">Nama Spreadsheet</div>
                    <div className="font-bold text-slate-800 text-sm mt-0.5 truncate">
                      {driveSyncState.spreadsheetName}
                    </div>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-emerald-100">
                    <div className="text-slate-400 font-medium">Status Sinkronisasi Terakhir</div>
                    <div className="font-bold text-emerald-700 text-sm mt-0.5 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>{driveSyncState.lastSyncTime ? `Pukul ${driveSyncState.lastSyncTime} WIB` : 'Siap Sinkron'}</span>
                    </div>
                  </div>
                </div>

                {/* 2-Way Sync Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <button
                    onClick={requestPushConfirmation}
                    disabled={isProcessing}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer active:scale-98 disabled:opacity-50"
                  >
                    <UploadCloud className="w-4 h-4" />
                    <span>Kirim & Simpan Data ke Google Drive</span>
                  </button>

                  <button
                    onClick={requestPullConfirmation}
                    disabled={isProcessing}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer active:scale-98 disabled:opacity-50"
                  >
                    <DownloadCloud className="w-4 h-4" />
                    <span>Tarik Data Terbaru dari Drive ke Aplikasi</span>
                  </button>
                </div>
              </div>

              {/* Create or Choose Spreadsheet */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Create New */}
                <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
                  <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
                    <PlusCircle className="w-4 h-4 text-emerald-600" />
                    <span>Buat Database Baru di Google Drive</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Sistem akan membuat Google Spreadsheet lengkap dengan tab <strong>DATA_SISWA</strong>, <strong>DATA_GURU</strong>, dan <strong>LOG_PRESENSI</strong>.
                  </p>
                  <div>
                    <input
                      type="text"
                      value={newSheetTitle}
                      onChange={(e) => setNewSheetTitle(e.target.value)}
                      placeholder="Nama spreadsheet baru..."
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-medium"
                    />
                  </div>
                  <button
                    onClick={handleCreateDatabase}
                    disabled={isProcessing}
                    className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer shadow-xs"
                  >
                    {isProcessing ? 'Membuat Spreadsheet...' : '+ Buat Spreadsheet di Drive'}
                  </button>
                </div>

                {/* Select Existing Drive Files */}
                <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3 flex flex-col">
                  <div className="flex items-center justify-between text-slate-900 font-bold text-xs">
                    <div className="flex items-center gap-2">
                      <FolderOpen className="w-4 h-4 text-indigo-600" />
                      <span>Pilih dari Google Drive Anda</span>
                    </div>
                    <button
                      onClick={() => accessToken && loadDriveFiles(accessToken)}
                      disabled={isLoadingFiles}
                      className="text-slate-400 hover:text-slate-700 p-1 rounded cursor-pointer"
                      title="Muat ulang daftar file"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isLoadingFiles ? 'animate-spin' : ''}`} />
                    </button>
                  </div>

                  <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1 flex-1">
                    {driveFiles.map((file) => (
                      <div
                        key={file.id}
                        onClick={() => handleSelectFile(file)}
                        className={`p-2 rounded-xl border text-xs flex items-center justify-between cursor-pointer transition-colors ${
                          driveSyncState.spreadsheetId === file.id
                            ? 'bg-emerald-50 border-emerald-400 font-bold text-emerald-950'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <div className="truncate pr-2">{file.name}</div>
                        {driveSyncState.spreadsheetId === file.id ? (
                          <span className="text-[10px] text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded font-bold">
                            Aktif
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400">Pilih</span>
                        )}
                      </div>
                    ))}

                    {driveFiles.length === 0 && !isLoadingFiles && (
                      <div className="text-center py-6 text-slate-400 text-xs">
                        Tidak ada spreadsheet terdeteksi. Silakan klik "+ Buat Spreadsheet di Drive".
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Instructions on editing directly in Google Drive */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-2">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4 text-emerald-600" />
                  <span>Cara Mengubah Data Siswa atau Guru di Google Drive:</span>
                </div>
                <ol className="list-decimal list-inside space-y-1 text-slate-500 pl-1 leading-relaxed">
                  <li>
                    Klik tombol <strong>"Buka di Google Drive"</strong> untuk membuka spreadsheet langsung di tab browser Anda.
                  </li>
                  <li>
                    Buka tab <strong>DATA_SISWA</strong> untuk menambah, mengoreksi nama, NIS/NISN, atau kelas siswa.
                  </li>
                  <li>
                    Buka tab <strong>DATA_GURU</strong> untuk mengedit NIP, nama guru, tugas wali kelas, atau mata pelajaran.
                  </li>
                  <li>
                    Setelah selesai mengedit di Google Drive, kembali ke aplikasi ini dan klik tombol <strong>"Tarik Data Terbaru dari Drive ke Aplikasi"</strong>. Seluruh data di aplikasi akan otomatis tersinkronisasi!
                  </li>
                </ol>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
          >
            Selesai &amp; Tutup
          </button>
        </div>
      </div>

      {/* Confirmation Dialog for Destructive / Mutating operations (Mandatory Workspace Skill Rule) */}
      {confirmDialog && (
        <div className="fixed inset-0 z-60 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in zoom-in-95">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900">{confirmDialog.title}</h4>
                <div className="text-xs text-slate-500 font-medium">Konfirmasi Sinkronisasi Google Drive</div>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200">
              {confirmDialog.description}
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => setConfirmDialog(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmAction}
                className="px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Ya, Lanjutkan Sinkron
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
