import React from 'react';
import {
  User,
  Student,
  AttendanceRecord,
  AttendanceScheduleConfig
} from '../types';
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  QrCode,
  ShieldCheck,
  TrendingUp,
  Award,
  Sun,
  Sunset
} from 'lucide-react';

interface Props {
  user: User;
  student: Student;
  records: AttendanceRecord[];
  todayString: string;
  scheduleConfig: AttendanceScheduleConfig;
  onGoToCard: () => void;
}

export const StudentDashboard: React.FC<Props> = ({
  user,
  student,
  records,
  todayString,
  scheduleConfig,
  onGoToCard,
}) => {
  // Filter student's personal records
  const myRecords = records.filter(
    (r) => r.studentId === student.id || r.nis === student.nis
  );

  // Today's records
  const todayMasuk = myRecords.find(
    (r) => r.tanggal === todayString && (r.sesi === 'Masuk' || !r.sesi)
  );
  const todayPulang = myRecords.find(
    (r) => r.tanggal === todayString && r.sesi === 'Pulang'
  );

  // Month-to-date stats
  const hadirCount = myRecords.filter((r) => r.status === 'Hadir').length;
  const terlambatCount = myRecords.filter((r) => r.status === 'Terlambat').length;
  const sakitCount = myRecords.filter((r) => r.status === 'Sakit').length;
  const izinCount = myRecords.filter((r) => r.status === 'Izin').length;
  const alpaCount = myRecords.filter((r) => r.status === 'Alpa').length;
  const totalPresensi = hadirCount + terlambatCount + sakitCount + izinCount + alpaCount;

  const persentase =
    totalPresensi > 0
      ? Math.round(((hadirCount + terlambatCount) / totalPresensi) * 100)
      : 100;

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-700 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/20 backdrop-blur-md">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
              <span>Portal Presensi Mandiri Siswa • Kelas {student.kelas}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Halo, {student.nama}!
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100 max-w-lg leading-relaxed">
              NISN: <span className="font-mono font-bold text-white">{student.nisn}</span> &bull; NIS: <span className="font-mono font-bold text-white">{student.nis}</span> &bull; Batas datang tepat waktu pukul <span className="font-bold underline decoration-emerald-300">{scheduleConfig.jamMasukBatas} WIB</span>.
            </p>
          </div>

          <button
            onClick={onGoToCard}
            className="flex items-center gap-2 px-5 py-3 bg-white text-emerald-900 hover:bg-emerald-50 active:bg-emerald-100 font-extrabold text-xs sm:text-sm rounded-2xl shadow-lg transition-all cursor-pointer"
          >
            <QrCode className="w-4 h-4 text-emerald-700" />
            <span>Buka Kartu Saya &rarr;</span>
          </button>
        </div>
      </div>

      {/* Today's Status Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Sesi Masuk */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className={`p-3 rounded-2xl ${todayMasuk ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
              <Sun className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs text-slate-500 font-semibold">Presensi Datang (Pagi)</div>
              <div className="text-base font-bold text-slate-900 mt-0.5">
                {todayMasuk ? (
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    {todayMasuk.status} ({todayMasuk.waktu} WIB)
                  </span>
                ) : (
                  <span className="text-amber-600 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4" />
                    Belum Absen Datang
                  </span>
                )}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                {todayMasuk ? todayMasuk.keterangan : `Arahkan kartu QR sebelum ${scheduleConfig.jamMasukBatas} WIB`}
              </div>
            </div>
          </div>
          {todayMasuk && (
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              Tercatat
            </span>
          )}
        </div>

        {/* Sesi Pulang */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className={`p-3 rounded-2xl ${todayPulang ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>
              <Sunset className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs text-slate-500 font-semibold">Presensi Pulang (Sore)</div>
              <div className="text-base font-bold text-slate-900 mt-0.5">
                {todayPulang ? (
                  <span className="flex items-center gap-1.5 text-blue-800">
                    <CheckCircle2 className="w-4 h-4 text-blue-600" />
                    Tercatat Pulang ({todayPulang.waktu} WIB)
                  </span>
                ) : (
                  <span className="text-slate-600">
                    Mulai dibuka {scheduleConfig.jamPulangBuka} WIB
                  </span>
                )}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                {todayPulang ? 'Terima kasih, selamat beristirahat!' : `Scan saat jam pulang tiba`}
              </div>
            </div>
          </div>
          {todayPulang && (
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              Pulang
            </span>
          )}
        </div>
      </div>

      {/* Monthly Attendance Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Hadir Tepat</div>
          <div className="text-2xl font-black text-emerald-600 mt-1">{hadirCount}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Tepat waktu</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Terlambat</div>
          <div className="text-2xl font-black text-amber-600 mt-1">{terlambatCount}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Setelah {scheduleConfig.jamMasukBatas}</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Sakit</div>
          <div className="text-2xl font-black text-blue-600 mt-1">{sakitCount}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Dengan surat dokter</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Izin</div>
          <div className="text-2xl font-black text-purple-600 mt-1">{izinCount}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Disetujui wali kelas</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Alpa</div>
          <div className="text-2xl font-black text-red-600 mt-1">{alpaCount}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Tanpa keterangan</div>
        </div>

        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white p-4 rounded-2xl shadow-xs">
          <div className="text-[11px] font-bold text-emerald-100 uppercase tracking-wider flex items-center gap-1">
            <Award className="w-3.5 h-3.5" />
            Kehadiran
          </div>
          <div className="text-2xl font-black mt-1">{persentase}%</div>
          <div className="text-[10px] text-emerald-100 mt-0.5">Rasio disiplin</div>
        </div>
      </div>

      {/* Personal Attendance History Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Riwayat Presensi Saya
            </h3>
            <p className="text-xs text-slate-500">
              Catatan pemindaian kartu dan absensi mandiri
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {myRecords.length} Catatan
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-600 uppercase text-[11px] font-bold tracking-wider">
                <th className="py-3 px-4">Tanggal</th>
                <th className="py-3 px-4">Waktu</th>
                <th className="py-3 px-4">Sesi</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Metode</th>
                <th className="py-3 px-4">Keterangan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {myRecords.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-4 font-mono font-semibold text-slate-800">
                    {r.tanggal}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-600">
                    {r.waktu} WIB
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-semibold text-slate-700">
                      {r.sesi || 'Masuk'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
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
                  <td className="py-3 px-4 text-slate-500 text-xs">
                    {r.metode}
                  </td>
                  <td className="py-3 px-4 text-slate-600 text-xs">
                    {r.keterangan || '-'}
                  </td>
                </tr>
              ))}

              {myRecords.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    Belum ada riwayat absensi untuk akun siswa ini.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
