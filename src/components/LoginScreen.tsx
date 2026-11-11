import React, { useState } from 'react';
import {
  ShieldCheck,
  UserCheck,
  Lock,
  User as UserIcon,
  Camera,
  GraduationCap,
  KeyRound,
  IdCard
} from 'lucide-react';
import { authenticateUser, authenticateStudentByNisn } from '../utils/auth';
import { User, Student } from '../types';
import { INITIAL_STUDENTS } from '../utils/students';

interface Props {
  onLoginSuccess: (user: User) => void;
  students?: Student[];
}

export const LoginScreen: React.FC<Props> = ({
  onLoginSuccess,
  students = INITIAL_STUDENTS,
}) => {
  // Tab state: 'siswa' | 'pegawai' (Admin / Guru)
  const [loginRoleTab, setLoginRoleTab] = useState<'siswa' | 'pegawai'>('siswa');

  // Siswa Form State (NISN only)
  const [nisn, setNisn] = useState('');

  // Guru & Admin Form State (Username & Password)
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Handle Siswa Login (NISN ONLY)
  const handleStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!nisn.trim()) {
      setErrorMessage('Silakan masukkan nomor NISN Anda.');
      return;
    }

    const user = authenticateStudentByNisn(nisn, students);
    if (!user) {
      setErrorMessage(`NISN "${nisn}" tidak terdaftar pada database siswa sekolah. Periksa kembali NISN Anda.`);
      return;
    }
    onLoginSuccess(user);
  };

  // Handle Admin & Guru Login (Username & Password)
  const handleStaffSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!username.trim() || !password) {
      setErrorMessage('Username dan password wajib diisi.');
      return;
    }

    const user = authenticateUser(username, password);
    if (!user) {
      setErrorMessage('Username atau password salah. Silakan coba lagi.');
      return;
    }
    onLoginSuccess(user);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 flex flex-col items-center justify-center p-4 sm:p-6 text-slate-100 font-sans">
      <div className="max-w-md w-full bg-white rounded-3xl p-6 sm:p-8 text-slate-900 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95">
        {/* School Branding */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-tr from-emerald-600 to-teal-500 rounded-2xl mx-auto flex items-center justify-center text-white shadow-lg shadow-emerald-600/30 mb-3">
            <Camera className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-slate-950 tracking-tight">
            Sistem Absensi Sekolah
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Terintegrasi Google Spreadsheet &amp; Apps Script Library (v5)
          </p>
        </div>

        {/* Tab Switcher: Siswa (NISN) vs Admin/Guru (User & Password) */}
        <div className="mb-6 p-1.5 bg-slate-100 rounded-2xl flex items-center gap-1">
          <button
            type="button"
            onClick={() => {
              setLoginRoleTab('siswa');
              setErrorMessage(null);
            }}
            className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              loginRoleTab === 'siswa'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <GraduationCap className="w-4 h-4 text-emerald-600" />
            <span>Siswa (NISN)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setLoginRoleTab('pegawai');
              setErrorMessage(null);
            }}
            className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              loginRoleTab === 'pegawai'
                ? 'bg-white text-indigo-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
            <span>Guru &amp; Admin</span>
          </button>
        </div>

        {/* Role Description Notice */}
        <div className="mb-5 p-3 rounded-2xl text-xs flex items-center gap-2.5 border">
          {loginRoleTab === 'siswa' ? (
            <div className="bg-emerald-50 border-emerald-200 text-emerald-900 flex items-center gap-2.5 w-full -m-3 p-3 rounded-2xl">
              <IdCard className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Siswa login <strong>hanya menggunakan nomor NISN</strong> tanpa password.</span>
            </div>
          ) : (
            <div className="bg-indigo-50 border-indigo-200 text-indigo-900 flex items-center gap-2.5 w-full -m-3 p-3 rounded-2xl">
              <KeyRound className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>Admin dan Guru masuk menggunakan <strong>Username &amp; Password</strong>.</span>
            </div>
          )}
        </div>

        {errorMessage && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-medium animate-in shake">
            {errorMessage}
          </div>
        )}

        {/* Form Tab 1: SISWA (Hanya NISN) */}
        {loginRoleTab === 'siswa' && (
          <form onSubmit={handleStudentSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Nomor Induk Siswa Nasional (NISN)
              </label>
              <div className="relative">
                <GraduationCap className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={nisn}
                  onChange={(e) => setNisn(e.target.value)}
                  placeholder="Contoh: 002401001"
                  required
                  autoFocus
                  className="w-full text-sm pl-10 pr-3.5 py-2.5 bg-slate-50 rounded-xl border border-slate-200 font-mono focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition-all"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Ketik 10 digit NISN Anda untuk melihat kartu presensi digital dan riwayat absensi.
              </p>
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold rounded-xl shadow-md shadow-emerald-600/20 hover:shadow-lg transition-all text-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              <UserCheck className="w-4 h-4" />
              Masuk Sebagai Siswa
            </button>
          </form>
        )}

        {/* Form Tab 2: GURU & ADMIN (Username & Password) */}
        {loginRoleTab === 'pegawai' && (
          <form onSubmit={handleStaffSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Username Akun
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin atau guru1"
                  required
                  autoFocus
                  className="w-full text-sm pl-10 pr-3.5 py-2.5 bg-slate-50 rounded-xl border border-slate-200 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="admin123 atau guru123"
                  required
                  className="w-full text-sm pl-10 pr-3.5 py-2.5 bg-slate-50 rounded-xl border border-slate-200 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold rounded-xl shadow-md shadow-indigo-600/20 hover:shadow-lg transition-all text-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              <UserCheck className="w-4 h-4" />
              Masuk Sebagai Guru / Admin
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
