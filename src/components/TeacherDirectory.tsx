import React, { useState } from 'react';
import {
  Users,
  UserCheck,
  Search,
  Plus,
  Edit2,
  Trash2,
  Shield,
  BookOpen,
  Phone,
  CheckCircle,
  X,
  Filter,
  Sparkles,
  HardDrive
} from 'lucide-react';
import { Teacher } from '../types';
import { ALL_CLASSES } from '../utils/students';

interface Props {
  teachers: Teacher[];
  onSaveTeachers: (teachers: Teacher[]) => void;
  onOpenDriveSync?: () => void;
  onNotify: (type: 'success' | 'warning' | 'info', title: string, desc: string) => void;
}

export const TeacherDirectory: React.FC<Props> = ({
  teachers,
  onSaveTeachers,
  onOpenDriveSync,
  onNotify,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState('SEMUA');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    nip: '',
    nama: '',
    username: '',
    kelas: 'VII A',
    mapel: 'Matematika',
    telepon: '',
    status: 'Aktif' as 'Aktif' | 'Cuti',
  });

  const handleOpenAdd = () => {
    setEditingTeacher(null);
    setFormData({
      nip: `198${Math.floor(10 + Math.random() * 80)}01201001${Math.floor(1000 + Math.random() * 9000)}`,
      nama: '',
      username: `guru${teachers.length + 1}`,
      kelas: 'VII A',
      mapel: 'Matematika',
      telepon: '0812-3456-7890',
      status: 'Aktif',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (teacher: Teacher) => {
    setEditingTeacher(teacher);
    setFormData({
      nip: teacher.nip,
      nama: teacher.nama,
      username: teacher.username,
      kelas: teacher.kelas || '-',
      mapel: teacher.mapel,
      telepon: teacher.telepon || '',
      status: teacher.status,
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id: string, nama: string) => {
    if (confirm(`Yakin ingin menghapus data guru ${nama}?`)) {
      const updated = teachers.filter((t) => t.id !== id);
      onSaveTeachers(updated);
      onNotify('info', 'Data Guru Dihapus', `Data ${nama} telah dihapus dari sistem.`);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nama.trim()) {
      onNotify('warning', 'Validasi Gagal', 'Nama guru wajib diisi.');
      return;
    }

    if (editingTeacher) {
      const updated = teachers.map((t) =>
        t.id === editingTeacher.id
          ? {
              ...t,
              ...formData,
            }
          : t
      );
      onSaveTeachers(updated);
      onNotify('success', 'Data Guru Diperbarui', `Informasi ${formData.nama} berhasil disimpan.`);
    } else {
      const newTeacher: Teacher = {
        id: `guru-${Date.now()}`,
        ...formData,
      };
      onSaveTeachers([newTeacher, ...teachers]);
      onNotify('success', 'Guru Baru Ditambahkan', `${formData.nama} berhasil didaftarkan sebagai guru.`);
    }

    setIsModalOpen(false);
  };

  // Filtered teachers
  const filteredTeachers = teachers.filter((t) => {
    const matchQuery =
      t.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.nip.includes(searchQuery) ||
      t.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.mapel.toLowerCase().includes(searchQuery.toLowerCase());

    const matchClass =
      selectedClassFilter === 'SEMUA' || t.kelas === selectedClassFilter;

    return matchQuery && matchClass;
  });

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 rounded-3xl p-6 text-white shadow-md flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 backdrop-blur-md mb-2">
            <Users className="w-3.5 h-3.5 text-indigo-300" />
            <span>Manajemen Tenaga Pendidik &amp; Wali Kelas</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight">
            Data Guru &amp; Wali Kelas
          </h2>
          <p className="text-xs sm:text-sm text-indigo-200 mt-1 max-w-xl">
            Kelola daftar akun guru pengajar, penetapan wali kelas, mata pelajaran binaan, dan kredensial login presensi.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {onOpenDriveSync && (
            <button
              onClick={onOpenDriveSync}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all cursor-pointer border border-white/20"
              title="Hubungkan ke Google Drive untuk melihat dan mengedit spreadsheet guru"
            >
              <HardDrive className="w-4 h-4 text-emerald-200" />
              <span>Google Drive</span>
            </button>
          )}
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Guru Baru</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama guru, NIP, mapel, atau username..."
            className="w-full text-xs sm:text-sm pl-10 pr-4 py-2.5 bg-slate-50 rounded-xl border border-slate-200 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-500" />
          <span className="text-xs text-slate-600 font-semibold">Kelas:</span>
          <select
            value={selectedClassFilter}
            onChange={(e) => setSelectedClassFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-600 cursor-pointer"
          >
            <option value="SEMUA">Semua Kelas</option>
            {ALL_CLASSES.map((c) => (
              <option key={c} value={c}>
                Wali Kelas {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Teachers Table Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900">
              Daftar Guru Terdaftar
            </h3>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700">
              {filteredTeachers.length} Guru
            </span>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            Default Password: <code className="bg-slate-100 px-1 py-0.5 rounded text-indigo-700">guru123</code>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-600 uppercase text-[11px] font-bold tracking-wider">
                <th className="py-3 px-4">No</th>
                <th className="py-3 px-4">Nama Guru &amp; NIP</th>
                <th className="py-3 px-4">Wali Kelas</th>
                <th className="py-3 px-4">Mata Pelajaran</th>
                <th className="py-3 px-4">Username Akun</th>
                <th className="py-3 px-4">Kontak</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTeachers.map((teacher, idx) => (
                <tr key={teacher.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-4 font-mono text-slate-400 text-xs">
                    {idx + 1}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-400 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                        {teacher.nama
                          .split(' ')
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join('')}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">
                          {teacher.nama}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          NIP. {teacher.nip}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    {teacher.kelas && teacher.kelas !== '-' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                        Kelas {teacher.kelas}
                      </span>
                    ) : (
                      <span className="text-slate-400 text-xs">-</span>
                    )}
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-700">
                    <span className="flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
                      {teacher.mapel}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono text-indigo-700 font-semibold">
                    {teacher.username}
                  </td>
                  <td className="py-3 px-4 text-slate-500 font-mono text-xs">
                    {teacher.telepon || '-'}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${
                        teacher.status === 'Aktif'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      {teacher.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleOpenEdit(teacher)}
                        className="p-1.5 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                        title="Edit data guru"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(teacher.id, teacher.nama)}
                        className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        title="Hapus data guru"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredTeachers.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Tidak ditemukan data guru yang sesuai dengan pencarian atau filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-2xl">
                  <UserCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {editingTeacher ? 'Edit Data Guru' : 'Tambah Guru Baru'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Lengkapi identitas pendidik dan penugasan kelas
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
                  Nama Lengkap Guru (beserta gelar)
                </label>
                <input
                  type="text"
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  placeholder="Contoh: Dra. Hj. Siti Rahma, M.Pd."
                  required
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    NIP / NUPTK
                  </label>
                  <input
                    type="text"
                    value={formData.nip}
                    onChange={(e) => setFormData({ ...formData, nip: e.target.value })}
                    placeholder="1985012010..."
                    required
                    className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Username Login
                  </label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="guru21"
                    required
                    className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Wali Kelas Binaan
                  </label>
                  <select
                    value={formData.kelas}
                    onChange={(e) => setFormData({ ...formData, kelas: e.target.value })}
                    className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-600 cursor-pointer"
                  >
                    <option value="-">Bukan Wali Kelas (-)</option>
                    {ALL_CLASSES.map((c) => (
                      <option key={c} value={c}>
                        Kelas {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Mata Pelajaran
                  </label>
                  <input
                    type="text"
                    value={formData.mapel}
                    onChange={(e) => setFormData({ ...formData, mapel: e.target.value })}
                    placeholder="Contoh: Matematika"
                    required
                    className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    No. Handphone / WhatsApp
                  </label>
                  <input
                    type="text"
                    value={formData.telepon}
                    onChange={(e) => setFormData({ ...formData, telepon: e.target.value })}
                    placeholder="0812-xxxx-xxxx"
                    className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Status Keaktifan
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as 'Aktif' | 'Cuti' })}
                    className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-600 cursor-pointer"
                  >
                    <option value="Aktif">Aktif Mengajar</option>
                    <option value="Cuti">Cuti / Nonaktif</option>
                  </select>
                </div>
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
                  className="px-5 py-2.5 text-xs sm:text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>{editingTeacher ? 'Simpan Perubahan' : 'Tambahkan Guru'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
