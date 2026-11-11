import React, { useState } from 'react';
import {
  Download,
  Printer,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileSpreadsheet,
  Image as ImageIcon,
  X,
  UserCheck,
  RefreshCw,
  ExternalLink,
  TableProperties
} from 'lucide-react';
import { AttendanceRecord, ClassStats, Student, AttendanceSession } from '../types';
import { generateCsvAttendance } from '../utils/attendance';
import { AttendanceChart } from './AttendanceChart';

interface Props {
  records: AttendanceRecord[];
  students: Student[];
  currentClass: string;
  allClasses: string[];
  isAdmin: boolean;
  onClassChange: (kelas: string) => void;
  selectedDate: string;
  onDateChange: (date: string) => void;
  stats: ClassStats;
  onOpenGasModal?: () => void;
}

export const AttendanceRecap: React.FC<Props> = ({
  records,
  students,
  currentClass,
  allClasses,
  isAdmin,
  onClassChange,
  selectedDate,
  onDateChange,
  stats,
  onOpenGasModal,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [sessionFilter, setSessionFilter] = useState<string>('ALL');
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  // Filter records
  const filteredRecords = records.filter((r) => {
    const matchClass = currentClass === 'SEMUA' || r.kelas === currentClass;
    const matchDate = r.tanggal === selectedDate;
    const matchStatus = statusFilter === 'ALL' || r.status === statusFilter;
    const matchSession = sessionFilter === 'ALL' || (r.sesi || 'Masuk') === sessionFilter;
    const matchSearch =
      searchQuery.trim() === '' ||
      r.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.nis.includes(searchQuery);

    return matchClass && matchDate && matchStatus && matchSession && matchSearch;
  });

  const handleExportCsv = () => {
    const targetClass = currentClass === 'SEMUA' ? undefined : currentClass;
    const csvData = generateCsvAttendance(records, targetClass, selectedDate);
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `Rekap_Presensi_${currentClass}_${selectedDate}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* Stats Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        <div className="bg-white p-3.5 rounded-2xl border border-gray-100 shadow-2xs">
          <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
            Total Siswa
          </div>
          <div className="text-2xl font-bold text-gray-900 mt-1">
            {stats.totalSiswa}
          </div>
          <div className="text-[11px] text-gray-400 mt-0.5">Terdaftar</div>
        </div>

        <div className="bg-emerald-50/80 p-3.5 rounded-2xl border border-emerald-100 shadow-2xs">
          <div className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider">
            Hadir Tepat
          </div>
          <div className="text-2xl font-bold text-emerald-800 mt-1">
            {stats.hadir}
          </div>
          <div className="text-[11px] text-emerald-600 mt-0.5">&le; 07:15</div>
        </div>

        <div className="bg-amber-50/80 p-3.5 rounded-2xl border border-amber-100 shadow-2xs">
          <div className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider">
            Terlambat
          </div>
          <div className="text-2xl font-bold text-amber-800 mt-1">
            {stats.terlambat}
          </div>
          <div className="text-[11px] text-amber-600 mt-0.5">&gt; 07:15</div>
        </div>

        <div className="bg-blue-50/80 p-3.5 rounded-2xl border border-blue-100 shadow-2xs">
          <div className="text-[11px] font-semibold text-blue-700 uppercase tracking-wider">
            Sakit
          </div>
          <div className="text-2xl font-bold text-blue-800 mt-1">
            {stats.sakit}
          </div>
          <div className="text-[11px] text-blue-600 mt-0.5">Surat Dokter</div>
        </div>

        <div className="bg-purple-50/80 p-3.5 rounded-2xl border border-purple-100 shadow-2xs">
          <div className="text-[11px] font-semibold text-purple-700 uppercase tracking-wider">
            Izin
          </div>
          <div className="text-2xl font-bold text-purple-800 mt-1">
            {stats.izin}
          </div>
          <div className="text-[11px] text-purple-600 mt-0.5">Dispensasi</div>
        </div>

        <div className="bg-red-50/80 p-3.5 rounded-2xl border border-red-100 shadow-2xs">
          <div className="text-[11px] font-semibold text-red-700 uppercase tracking-wider">
            Alpa
          </div>
          <div className="text-2xl font-bold text-red-800 mt-1">
            {stats.alpa}
          </div>
          <div className="text-[11px] text-red-600 mt-0.5">Tanpa Ket.</div>
        </div>

        <div className="bg-emerald-600 p-3.5 rounded-2xl text-white shadow-xs col-span-2 sm:col-span-1">
          <div className="text-[11px] font-semibold text-emerald-100 uppercase tracking-wider">
            Kehadiran
          </div>
          <div className="text-2xl font-bold mt-1">
            {stats.persentaseKehadiran}%
          </div>
          <div className="text-[11px] text-emerald-100 mt-0.5">
            {stats.hadir + stats.terlambat} dari {stats.totalSiswa}
          </div>
        </div>
      </div>

      {/* Visual Bar Chart for Daily Attendance */}
      <AttendanceChart
        records={records}
        currentClass={currentClass}
        selectedDate={selectedDate}
      />

      {/* Google Sheet Style Container */}
      <div className="bg-white rounded-3xl border border-gray-200 shadow-xs overflow-hidden">
        {/* Spreadsheet Top Ribbon */}
        <div className="p-4 bg-gray-50 border-b border-gray-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-gray-900">
                  Google Sheet: Log_Absen
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  Database Utama
                </span>
              </div>
              <p className="text-xs text-gray-500">
                Pencatatan baris presensi otomatis • SMP &amp; SMA Prestasi
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            {onOpenGasModal && (
              <button
                onClick={onOpenGasModal}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-800 bg-white hover:bg-emerald-50 border border-emerald-300 rounded-xl shadow-2xs transition-colors cursor-pointer"
              >
                <TableProperties className="w-3.5 h-3.5 text-emerald-600" />
                <span>Pengaturan Sheet</span>
              </button>
            )}

            <button
              onClick={handleExportCsv}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-100 border border-gray-200 rounded-xl shadow-2xs transition-colors cursor-pointer"
              title="Unduh file CSV"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-100 border border-gray-200 rounded-xl shadow-2xs transition-colors cursor-pointer"
              title="Cetak lembar rekap"
            >
              <Printer className="w-3.5 h-3.5 text-gray-600" />
              <span>Cetak Rekap</span>
            </button>
          </div>
        </div>

        {/* Filters Toolbar */}
        <div className="p-4 bg-white border-b border-gray-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search Input */}
            <div className="relative min-w-[220px]">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama atau NIS siswa..."
                className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-xs"
              />
            </div>

            {/* Date Picker */}
            <div className="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1.5 rounded-xl border border-gray-200">
              <span className="text-gray-500 font-medium">Tanggal:</span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => onDateChange(e.target.value)}
                className="bg-transparent font-semibold text-gray-800 focus:outline-hidden cursor-pointer"
              />
            </div>

            {/* Sesi Filter */}
            <select
              value={sessionFilter}
              onChange={(e) => setSessionFilter(e.target.value)}
              className="bg-gray-50 font-medium text-gray-700 px-3 py-1.5 rounded-xl border border-gray-200 focus:outline-hidden cursor-pointer"
            >
              <option value="ALL">Semua Sesi</option>
              <option value="Masuk">Sesi Masuk</option>
              <option value="Pulang">Sesi Pulang</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-gray-50 font-medium text-gray-700 px-3 py-1.5 rounded-xl border border-gray-200 focus:outline-hidden cursor-pointer"
            >
              <option value="ALL">Semua Status</option>
              <option value="Hadir">Hadir</option>
              <option value="Terlambat">Terlambat</option>
              <option value="Sakit">Sakit</option>
              <option value="Izin">Izin</option>
              <option value="Alpa">Alpa</option>
            </select>
          </div>

          <div className="text-xs text-gray-500 font-medium">
            Menampilkan <strong>{filteredRecords.length}</strong> catatan baris
          </div>
        </div>

        {/* Spreadsheet Table with Column Letters & Row Numbers */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              {/* Spreadsheet Column Alphabet Letters */}
              <tr className="bg-gray-100 text-gray-400 font-mono text-[10px] text-center border-b border-gray-200">
                <th className="w-12 py-1 border-r border-gray-200 bg-gray-200/50 font-bold">#</th>
                <th className="py-1 px-3 border-r border-gray-200">A</th>
                <th className="py-1 px-3 border-r border-gray-200">B</th>
                <th className="py-1 px-3 border-r border-gray-200">C</th>
                <th className="py-1 px-3 border-r border-gray-200">D</th>
                <th className="py-1 px-3 border-r border-gray-200">E</th>
                <th className="py-1 px-3 border-r border-gray-200">F</th>
                <th className="py-1 px-3 border-r border-gray-200">G</th>
                <th className="py-1 px-3 border-r border-gray-200">H</th>
                <th className="py-1 px-3 border-r border-gray-200">I</th>
                <th className="py-1 px-3">J</th>
              </tr>
              {/* Column Name Headers */}
              <tr className="bg-gray-50 text-gray-700 font-bold uppercase text-[10px] tracking-wider border-b border-gray-200">
                <th className="py-2.5 px-3 text-center border-r border-gray-200 bg-gray-100/70 text-gray-500">
                  Baris
                </th>
                <th className="py-2.5 px-3 border-r border-gray-200">Waktu (WIB)</th>
                <th className="py-2.5 px-3 border-r border-gray-200">NIS</th>
                <th className="py-2.5 px-3 border-r border-gray-200">Nama Siswa</th>
                <th className="py-2.5 px-3 border-r border-gray-200">Kelas</th>
                <th className="py-2.5 px-3 border-r border-gray-200">Sesi</th>
                <th className="py-2.5 px-3 border-r border-gray-200">Status</th>
                <th className="py-2.5 px-3 border-r border-gray-200">Metode</th>
                <th className="py-2.5 px-3 border-r border-gray-200">Keterangan</th>
                <th className="py-2.5 px-3 border-r border-gray-200 text-center">Bukti</th>
                <th className="py-2.5 px-3 text-center">Sync Sheet</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-sans">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-gray-400">
                    <FileSpreadsheet className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                    <div className="font-semibold text-gray-600">Belum Ada Baris Data Presensi</div>
                    <div className="text-xs text-gray-400 mt-1">
                      Data akan otomatis terisi saat siswa memindai kartu QR atau diinput manual.
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRecords.map((r, idx) => {
                  return (
                    <tr
                      key={r.id}
                      className="hover:bg-emerald-50/40 transition-colors group"
                    >
                      {/* Row index */}
                      <td className="py-2 px-3 text-center font-mono text-[11px] text-gray-400 border-r border-gray-200 bg-gray-50/50 group-hover:bg-emerald-100/30 font-semibold">
                        {idx + 1}
                      </td>

                      {/* Waktu */}
                      <td className="py-2 px-3 font-mono font-medium text-gray-800 border-r border-gray-100 whitespace-nowrap">
                        {r.waktu}
                      </td>

                      {/* NIS */}
                      <td className="py-2 px-3 font-mono text-gray-600 border-r border-gray-100 whitespace-nowrap">
                        {r.nis}
                      </td>

                      {/* Nama */}
                      <td className="py-2 px-3 font-bold text-gray-900 border-r border-gray-100 whitespace-nowrap">
                        {r.nama}
                      </td>

                      {/* Kelas */}
                      <td className="py-2 px-3 font-semibold text-gray-700 border-r border-gray-100 whitespace-nowrap">
                        {r.kelas}
                      </td>

                      {/* Sesi */}
                      <td className="py-2 px-3 border-r border-gray-100 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            r.sesi === 'Pulang'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {r.sesi || 'Masuk'}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-2 px-3 border-r border-gray-100 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${
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
                      </td>

                      {/* Metode */}
                      <td className="py-2 px-3 text-gray-600 border-r border-gray-100 whitespace-nowrap">
                        {r.metode}
                      </td>

                      {/* Keterangan */}
                      <td className="py-2 px-3 text-gray-500 border-r border-gray-100 max-w-xs truncate">
                        {r.keterangan || '-'}
                      </td>

                      {/* Foto Bukti */}
                      <td className="py-2 px-3 border-r border-gray-100 text-center whitespace-nowrap">
                        {r.fotoBukti ? (
                          <button
                            onClick={() => setSelectedPhoto(r.fotoBukti || null)}
                            className="p-1 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-md transition-colors"
                            title="Lihat foto bukti"
                          >
                            <ImageIcon className="w-4 h-4" />
                          </button>
                        ) : (
                          <span className="text-gray-300">-</span>
                        )}
                      </td>

                      {/* Sync to Google Sheets status */}
                      <td className="py-2 px-3 text-center whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Tersimpan
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Photo Preview Modal */}
      {selectedPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <h4 className="text-sm font-bold text-gray-900">Foto Bukti Presensi</h4>
              <button
                onClick={() => setSelectedPhoto(null)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <img
              src={selectedPhoto}
              alt="Bukti Kehadiran"
              className="w-full rounded-xl object-cover max-h-96"
            />
          </div>
        </div>
      )}
    </div>
  );
};
