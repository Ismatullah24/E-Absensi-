import { AttendanceRecord, AttendanceStatus, AttendanceSession, ClassStats, Student } from '../types';

export const JAM_MASUK_BATAS = '07:15'; // Batas waktu keterlambatan default

export function getTodayString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getCurrentTimeString(): string {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}

export function determineAttendanceStatus(timeStr: string, cutoffTime: string = JAM_MASUK_BATAS): AttendanceStatus {
  // Compare HH:mm
  const [currentH, currentM] = timeStr.split(':').map(Number);
  const [cutoffH, cutoffM] = cutoffTime.split(':').map(Number);

  const currentTotal = currentH * 60 + currentM;
  const cutoffTotal = cutoffH * 60 + cutoffM;

  if (currentTotal > cutoffTotal) {
    return 'Terlambat';
  }
  return 'Hadir';
}

export interface RecordAttendanceParams {
  student: Student;
  tanggal?: string;
  waktu?: string;
  sesi?: AttendanceSession;
  statusOverride?: AttendanceStatus;
  cutoffTime?: string;
  keterangan?: string;
  metode: AttendanceRecord['metode'];
  fotoBukti?: string;
  existingRecords: AttendanceRecord[];
}

export function recordAttendance(params: RecordAttendanceParams): {
  success: boolean;
  message: string;
  record?: AttendanceRecord;
  updatedRecords: AttendanceRecord[];
} {
  const {
    student,
    tanggal = getTodayString(),
    waktu = getCurrentTimeString(),
    sesi = 'Masuk',
    statusOverride,
    cutoffTime = JAM_MASUK_BATAS,
    keterangan,
    metode,
    fotoBukti,
    existingRecords,
  } = params;

  // Check if student already has a record on the same date and same session
  const existingIndex = existingRecords.findIndex(
    (r) => r.studentId === student.id && r.tanggal === tanggal && (r.sesi || 'Masuk') === sesi
  );

  const finalStatus: AttendanceStatus =
    statusOverride || (sesi === 'Pulang' ? 'Hadir' : determineAttendanceStatus(waktu, cutoffTime));

  const defaultKeterangan =
    sesi === 'Pulang'
      ? 'Presensi kepulangan tercatat'
      : finalStatus === 'Terlambat'
      ? `Datang melewati batas ${cutoffTime}`
      : 'Hadir tepat waktu';

  const newRecord: AttendanceRecord = {
    id: `att-${student.id}-${tanggal}-${sesi}-${Date.now()}`,
    studentId: student.id,
    nis: student.nis,
    nama: student.nama,
    kelas: student.kelas,
    tanggal,
    waktu,
    sesi,
    status: finalStatus,
    keterangan: keterangan || defaultKeterangan,
    metode,
    fotoBukti,
    syncedToSheet: true,
  };

  if (existingIndex >= 0) {
    // If already recorded today for this session
    const updated = [...existingRecords];
    updated[existingIndex] = newRecord;
    return {
      success: true,
      message: `Presensi ${sesi} ${student.nama} diperbarui menjadi ${finalStatus} (${waktu})`,
      record: newRecord,
      updatedRecords: updated,
    };
  }

  return {
    success: true,
    message: `Berhasil presensi ${sesi}: ${student.nama} (${student.kelas}) - ${finalStatus} (${waktu})`,
    record: newRecord,
    updatedRecords: [newRecord, ...existingRecords],
  };
}

export function calculateClassStats(
  students: Student[],
  records: AttendanceRecord[],
  targetKelas?: string,
  targetTanggal: string = getTodayString()
): ClassStats {
  const filteredStudents = targetKelas
    ? students.filter((s) => s.kelas === targetKelas)
    : students;

  const totalSiswa = filteredStudents.length;
  if (totalSiswa === 0) {
    return {
      totalSiswa: 0,
      hadir: 0,
      terlambat: 0,
      sakit: 0,
      izin: 0,
      alpa: 0,
      belumAbsen: 0,
      persentaseKehadiran: 0,
    };
  }

  const studentIds = new Set(filteredStudents.map((s) => s.id));
  const relevantRecords = records.filter(
    (r) => r.tanggal === targetTanggal && studentIds.has(r.studentId)
  );

  let hadir = 0;
  let terlambat = 0;
  let sakit = 0;
  let izin = 0;
  let alpa = 0;

  relevantRecords.forEach((r) => {
    switch (r.status) {
      case 'Hadir':
        hadir++;
        break;
      case 'Terlambat':
        terlambat++;
        break;
      case 'Sakit':
        sakit++;
        break;
      case 'Izin':
        izin++;
        break;
      case 'Alpa':
        alpa++;
        break;
    }
  });

  const totalAbsenSudah = hadir + terlambat + sakit + izin + alpa;
  const belumAbsen = Math.max(0, totalSiswa - totalAbsenSudah);

  // Present rate considers Hadir + Terlambat as physically present
  const totalMasuk = hadir + terlambat;
  const persentaseKehadiran = Math.round((totalMasuk / totalSiswa) * 100);

  return {
    totalSiswa,
    hadir,
    terlambat,
    sakit,
    izin,
    alpa,
    belumAbsen,
    persentaseKehadiran,
  };
}

export function generateCsvAttendance(
  records: AttendanceRecord[],
  kelas?: string,
  tanggal?: string
): string {
  let filtered = [...records];
  if (kelas) filtered = filtered.filter((r) => r.kelas === kelas);
  if (tanggal) filtered = filtered.filter((r) => r.tanggal === tanggal);

  const headers = ['No', 'Tanggal', 'Waktu', 'NIS', 'Nama Siswa', 'Kelas', 'Sesi', 'Status', 'Metode', 'Keterangan'];
  const rows = filtered.map((r, idx) => [
    idx + 1,
    `"${r.tanggal}"`,
    `"${r.waktu}"`,
    `"${r.nis}"`,
    `"${r.nama.replace(/"/g, '""')}"`,
    `"${r.kelas}"`,
    `"${r.sesi || 'Masuk'}"`,
    `"${r.status}"`,
    `"${r.metode}"`,
    `"${(r.keterangan || '').replace(/"/g, '""')}"`,
  ]);

  return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
}

export interface DailyAttendanceCount {
  date: string;
  label: string;
  fullDate: string;
  hadir: number;
  terlambat: number;
  sakit: number;
  izin: number;
  alpa: number;
  total: number;
}

export function calculateDailyAttendanceTrend(
  records: AttendanceRecord[],
  targetKelas?: string,
  baseDateStr: string = getTodayString(),
  numDays: number = 7
): DailyAttendanceCount[] {
  const result: DailyAttendanceCount[] = [];
  const [year, month, day] = baseDateStr.split('-').map(Number);
  const baseDate = new Date(year, month - 1, day);
  const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

  for (let i = numDays - 1; i >= 0; i--) {
    const d = new Date(baseDate);
    d.setDate(baseDate.getDate() - i);

    const yStr = d.getFullYear();
    const mStr = String(d.getMonth() + 1).padStart(2, '0');
    const dStr = String(d.getDate()).padStart(2, '0');
    const dateFormatted = `${yStr}-${mStr}-${dStr}`;
    const dayLabel = `${dayNames[d.getDay()]} (${dStr}/${mStr})`;

    const filtered = records.filter(
      (r) =>
        r.tanggal === dateFormatted &&
        (!targetKelas || targetKelas === 'SEMUA' || r.kelas === targetKelas)
    );

    let hadir = 0;
    let terlambat = 0;
    let sakit = 0;
    let izin = 0;
    let alpa = 0;

    filtered.forEach((r) => {
      if (r.status === 'Hadir') hadir++;
      else if (r.status === 'Terlambat') terlambat++;
      else if (r.status === 'Sakit') sakit++;
      else if (r.status === 'Izin') izin++;
      else if (r.status === 'Alpa') alpa++;
    });

    result.push({
      date: dateFormatted,
      label: dayLabel,
      fullDate: dateFormatted,
      hadir,
      terlambat,
      sakit,
      izin,
      alpa,
      total: hadir + terlambat + sakit + izin + alpa,
    });
  }

  return result;
}

