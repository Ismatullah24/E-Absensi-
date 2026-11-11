import React, { useState } from 'react';
import QRCode from 'qrcode';
import {
  Student,
  AttendanceRecord,
  AttendanceStatus
} from '../types';
import {
  Search,
  QrCode,
  CheckCircle,
  Clock,
  AlertCircle,
  Plus,
  Edit2,
  Trash2,
  GraduationCap,
  Filter,
  X,
  UserCheck,
  Download,
  Printer,
  ShieldCheck,
  Eye,
  HardDrive
} from 'lucide-react';
import { ALL_CLASSES } from '../utils/students';

interface Props {
  students: Student[];
  currentClass: string;
  allClasses?: string[];
  records: AttendanceRecord[];
  todayString: string;
  isGuruRole?: boolean;
  teacherClass?: string;
  onClassChange?: (cls: string) => void;
  onSaveStudents?: (students: Student[]) => void;
  onQuickMark: (student: Student, status: AttendanceStatus) => void;
  onOpenCards: () => void;
  onOpenDriveSync?: () => void;
  onNotify?: (type: 'success' | 'warning' | 'info', title: string, desc: string) => void;
}

export const StudentDirectory: React.FC<Props> = ({
  students,
  currentClass,
  allClasses = ALL_CLASSES,
  records,
  todayString,
  isGuruRole = false,
  teacherClass,
  onClassChange,
  onSaveStudents,
  onQuickMark,
  onOpenCards,
  onOpenDriveSync,
  onNotify,
}) => {
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  // Single QR Preview Modal State
  const [previewStudent, setPreviewStudent] = useState<Student | null>(null);
  const [previewQrUrl, setPreviewQrUrl] = useState<string>('');

  // Target class for Guru is strictly their assigned class
  const activeClassTarget = isGuruRole && teacherClass ? teacherClass : currentClass;

  // Form State for Add / Edit
  const [formData, setFormData] = useState({
    nama: '',
    nis: '',
    nisn: '',
    kelas: activeClassTarget === 'SEMUA' ? 'VII A' : activeClassTarget,
    jenisKelamin: 'L' as 'L' | 'P',
  });

  // Filter students
  const filteredStudents = students
    .filter((s) => activeClassTarget === 'SEMUA' || s.kelas === activeClassTarget)
    .filter(
      (s) =>
        search.trim() === '' ||
        s.nama.toLowerCase().includes(search.toLowerCase()) ||
        s.nis.includes(search) ||
        s.nisn.includes(search)
    );

  // Map today's attendance by student id
  const todayMap = new Map<string, AttendanceRecord>();
  records.forEach((r) => {
    if (r.tanggal === todayString) {
      todayMap.set(r.studentId, r);
    }
  });

  // Open modal for Adding new student
  const handleOpenAdd = () => {
    setEditingStudent(null);
    const targetClass = isGuruRole && teacherClass ? teacherClass : (currentClass === 'SEMUA' ? 'VII A' : currentClass);
    const classCount = students.filter((s) => s.kelas === targetClass).length;
    const classIndex = allClasses.indexOf(targetClass);
    const generatedNis = `${2400 + (classIndex >= 0 ? classIndex : 0)}${String(classCount + 1).padStart(2, '0')}`;
    const generatedNisn = `00${2400000 + students.length + 1001}`;

    setFormData({
      nama: '',
      nis: generatedNis,
      nisn: generatedNisn,
      kelas: targetClass,
      jenisKelamin: 'L',
    });
    setIsModalOpen(true);
  };

  // Open modal for Editing student
  const handleOpenEdit = (student: Student) => {
    setEditingStudent(student);
    setFormData({
      nama: student.nama.replace(/\s*\([^)]*\)$/, ''), // remove class suffix if present
      nis: student.nis,
      nisn: student.nisn,
      kelas: student.kelas,
      jenisKelamin: student.jenisKelamin,
    });
    setIsModalOpen(true);
  };

  // Delete student
  const handleDelete = (id: string, nama: string) => {
    if (confirm(`Yakin ingin menghapus data siswa ${nama}? Data presensi siswa ini akan tetap tersimpan di riwayat.`)) {
      if (onSaveStudents) {
        const updated = students.filter((s) => s.id !== id);
        onSaveStudents(updated);
        onNotify?.('info', 'Data Siswa Dihapus', `${nama} telah dihapus dari daftar siswa.`);
      }
    }
  };

  // Handle Form Submit (Add or Edit)
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nama.trim()) {
      onNotify?.('warning', 'Validasi Gagal', 'Nama siswa wajib diisi.');
      return;
    }
    if (!formData.nis.trim()) {
      onNotify?.('warning', 'Validasi Gagal', 'Nomor NIS wajib diisi.');
      return;
    }
    if (!formData.nisn.trim()) {
      onNotify?.('warning', 'Validasi Gagal', 'Nomor NISN wajib diisi.');
      return;
    }

    const cleanNama = formData.nama.trim();
    const cleanKelas = isGuruRole && teacherClass ? teacherClass : formData.kelas;
    const qrPayload = `SISWA:${formData.nis.trim()}:${cleanKelas}:${cleanNama}`;

    if (editingStudent) {
      if (onSaveStudents) {
        const updated = students.map((s) =>
          s.id === editingStudent.id
            ? {
                ...s,
                nama: `${cleanNama} (${cleanKelas})`,
                nis: formData.nis.trim(),
                nisn: formData.nisn.trim(),
                kelas: cleanKelas,
                jenisKelamin: formData.jenisKelamin,
                qrPayload,
              }
            : s
        );
        onSaveStudents(updated);
        onNotify?.('success', 'Data Siswa Diperbarui', `Informasi ${cleanNama} berhasil diperbarui.`);
      }
    } else {
      // Add new student
      const newStudent: Student = {
        id: `std-${cleanKelas.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}`,
        nama: `${cleanNama} (${cleanKelas})`,
        nis: formData.nis.trim(),
        nisn: formData.nisn.trim(),
        kelas: cleanKelas,
        jenisKelamin: formData.jenisKelamin,
        qrPayload,
      };

      if (onSaveStudents) {
        onSaveStudents([...students, newStudent]);
        onNotify?.('success', 'Siswa Baru Ditambahkan', `${cleanNama} berhasil ditambahkan ke kelas ${cleanKelas}.`);
      }
    }

    setIsModalOpen(false);
  };

  // Single QR code preview popup
  const handlePreviewQr = (student: Student) => {
    setPreviewStudent(student);
    QRCode.toDataURL(student.qrPayload, {
      width: 260,
      margin: 1,
      color: { dark: '#064e3b', light: '#ffffff' },
    })
      .then((url) => setPreviewQrUrl(url))
      .catch((e) => console.warn('QR error:', e));
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-700 to-slate-900 rounded-3xl p-6 text-white shadow-md flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/20 backdrop-blur-md mb-2">
            <GraduationCap className="w-3.5 h-3.5 text-emerald-300" />
            <span>
              {isGuruRole ? `Wali Kelas ${activeClassTarget}` : 'Direktori Siswa & Manajemen Kelas'}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight">
            Data Siswa {activeClassTarget !== 'SEMUA' ? `Kelas ${activeClassTarget}` : 'Seluruh Kelas'}
          </h2>
          <p className="text-xs sm:text-sm text-emerald-100 mt-1 max-w-xl">
            {isGuruRole
              ? `Kelola daftar nama siswa kelas ${activeClassTarget}, tambah siswa baru, cetak kartu QR presensi, atau pantau status kehadiran.`
              : 'Kelola data seluruh rombel siswa, pencarian NIS/NISN, pendaftaran siswa baru, dan cetak kartu QR presensi sekolah.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {onOpenDriveSync && (
            <button
              onClick={onOpenDriveSync}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all cursor-pointer border border-white/20"
              title="Hubungkan ke Google Drive untuk melihat dan mengedit spreadsheet"
            >
              <HardDrive className="w-4 h-4 text-emerald-200" />
              <span>Google Drive</span>
            </button>
          )}
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-4 py-2.5 bg-white text-emerald-950 hover:bg-emerald-50 active:bg-emerald-100 font-extrabold text-xs sm:text-sm rounded-xl shadow-md transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 text-emerald-700" />
            <span>Tambah Siswa Baru</span>
          </button>
          <button
            onClick={onOpenCards}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-950/60 hover:bg-emerald-950 text-emerald-100 font-bold text-xs sm:text-sm rounded-xl border border-white/20 transition-all cursor-pointer"
          >
            <QrCode className="w-4 h-4 text-emerald-300" />
            <span>Lihat Semua Kartu QR</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama siswa, NIS, atau NISN..."
            className="w-full text-xs sm:text-sm pl-10 pr-4 py-2 bg-slate-50 rounded-xl border border-slate-200 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition-all"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* If Admin, show class switcher dropdown */}
          {!isGuruRole && onClassChange && (
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-500" />
              <span className="text-xs text-slate-600 font-semibold">Kelas:</span>
              <select
                value={currentClass}
                onChange={(e) => onClassChange(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-600 cursor-pointer"
              >
                <option value="SEMUA">Semua Kelas</option>
                {allClasses.map((c) => (
                  <option key={c} value={c}>
                    Kelas {c}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* If Guru, show fixed class badge */}
          {isGuruRole && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>Rombel Kelas {activeClassTarget}</span>
            </div>
          )}
        </div>
      </div>

      {/* Students Table Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900">
              Daftar Siswa {activeClassTarget !== 'SEMUA' ? `Kelas ${activeClassTarget}` : 'Sekolah'}
            </h3>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700">
              {filteredStudents.length} Siswa
            </span>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            Tahun Ajaran 2026/2027
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-600 uppercase text-[11px] font-bold tracking-wider">
                <th className="py-3 px-4">No</th>
                <th className="py-3 px-4">Nama Lengkap Siswa</th>
                <th className="py-3 px-4">NIS / NISN</th>
                <th className="py-3 px-4 text-center">Kelas</th>
                <th className="py-3 px-4 text-center">L/P</th>
                <th className="py-3 px-4">Status Hari Ini</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.map((s, idx) => {
                const record = todayMap.get(s.id);

                return (
                  <tr key={s.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-mono text-xs text-slate-400">
                      {idx + 1}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                          {s.nama
                            .split(' ')
                            .map((n) => n[0])
                            .slice(0, 2)
                            .join('')}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">
                            {s.nama}
                          </div>
                          <div className="text-[11px] text-emerald-700 font-mono">
                            Payload: {s.qrPayload}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-xs">
                      <div className="text-slate-800 font-bold">NIS: {s.nis}</div>
                      <div className="text-slate-500">NISN: {s.nisn}</div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        {s.kelas}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          s.jenisKelamin === 'L'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-pink-50 text-pink-700 border border-pink-200'
                        }`}
                      >
                        {s.jenisKelamin === 'L' ? 'L' : 'P'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {record ? (
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            record.status === 'Hadir'
                              ? 'bg-emerald-100 text-emerald-800'
                              : record.status === 'Terlambat'
                              ? 'bg-amber-100 text-amber-800'
                              : record.status === 'Sakit'
                              ? 'bg-blue-100 text-blue-800'
                              : record.status === 'Izin'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {record.status} ({record.waktu.slice(0, 5)})
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Belum Absen</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Preview QR */}
                        <button
                          onClick={() => handlePreviewQr(s)}
                          className="p-1.5 text-emerald-700 hover:text-emerald-900 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                          title="Lihat QR Code Siswa"
                        >
                          <QrCode className="w-4 h-4" />
                        </button>
                        {/* Edit */}
                        <button
                          onClick={() => handleOpenEdit(s)}
                          className="p-1.5 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                          title="Edit Data Siswa"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {/* Delete */}
                        <button
                          onClick={() => handleDelete(s.id, s.nama)}
                          className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          title="Hapus Data Siswa"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredStudents.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Tidak ditemukan data siswa yang cocok dengan pencarian di kelas ini.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Student Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-2xl">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {editingStudent ? 'Edit Data Siswa' : 'Tambah Siswa Baru'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {isGuruRole
                      ? `Pendaftaran siswa baru untuk Kelas ${activeClassTarget}`
                      : 'Lengkapi identitas siswa dan kelas penugasan'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Nama Lengkap Siswa
                </label>
                <input
                  type="text"
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  placeholder="Contoh: Muhammad Rizky Pratama"
                  required
                  autoFocus
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Nomor Induk Siswa (NIS)
                  </label>
                  <input
                    type="text"
                    value={formData.nis}
                    onChange={(e) => setFormData({ ...formData, nis: e.target.value })}
                    placeholder="240009"
                    required
                    className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    NISN (10 Digit Login)
                  </label>
                  <input
                    type="text"
                    value={formData.nisn}
                    onChange={(e) => setFormData({ ...formData, nisn: e.target.value })}
                    placeholder="002401009"
                    required
                    className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">Digunakan siswa untuk login.</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Kelas
                  </label>
                  {isGuruRole ? (
                    <div className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-emerald-50 border border-emerald-200 rounded-xl font-bold text-emerald-900">
                      Kelas {activeClassTarget} (Wali Kelas)
                    </div>
                  ) : (
                    <select
                      value={formData.kelas}
                      onChange={(e) => setFormData({ ...formData, kelas: e.target.value })}
                      className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-600 cursor-pointer"
                    >
                      {allClasses.map((c) => (
                        <option key={c} value={c}>
                          Kelas {c}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Jenis Kelamin
                  </label>
                  <select
                    value={formData.jenisKelamin}
                    onChange={(e) => setFormData({ ...formData, jenisKelamin: e.target.value as 'L' | 'P' })}
                    className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-600 cursor-pointer"
                  >
                    <option value="L">Laki-laki (L)</option>
                    <option value="P">Perempuan (P)</option>
                  </select>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600">
                <span className="font-semibold text-slate-800">QR Payload Otomatis:</span>{' '}
                <code className="text-emerald-700 font-mono">
                  SISWA:{formData.nis || '...'}:{isGuruRole && teacherClass ? teacherClass : formData.kelas}:{formData.nama || '...'}
                </code>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 text-xs sm:text-sm text-slate-600 hover:text-slate-800 font-semibold rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs sm:text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>{editingStudent ? 'Simpan Perubahan' : 'Tambahkan Siswa'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Single Student QR Preview Modal */}
      {previewStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 text-center space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Kartu QR Siswa
              </span>
              <button
                onClick={() => setPreviewStudent(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-1">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-bold text-lg shadow-md mx-auto">
                {previewStudent.nama
                  .split(' ')
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join('')}
              </div>
              <h3 className="text-base font-bold text-slate-900 mt-2">
                {previewStudent.nama}
              </h3>
              <p className="text-xs text-slate-500 font-mono">
                NIS: {previewStudent.nis} &bull; NISN: {previewStudent.nisn} &bull; Kelas {previewStudent.kelas}
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 inline-block shadow-inner">
              {previewQrUrl ? (
                <img
                  src={previewQrUrl}
                  alt={previewStudent.nama}
                  className="w-48 h-48 mx-auto object-contain rounded-lg"
                />
              ) : (
                <div className="w-48 h-48 flex items-center justify-center text-slate-400 text-xs">
                  Memuat QR...
                </div>
              )}
            </div>

            <p className="text-[11px] text-slate-400 font-mono break-all px-2">
              {previewStudent.qrPayload}
            </p>

            <div className="pt-2 flex items-center justify-center gap-2">
              <a
                href={previewQrUrl}
                download={`QR-${previewStudent.nis}-${previewStudent.nama}.png`}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh QR</span>
              </a>
              <button
                onClick={() => setPreviewStudent(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
