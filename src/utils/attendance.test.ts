import test from 'node:test';
import assert from 'node:assert/strict';
import {
  determineAttendanceStatus,
  recordAttendance,
  calculateClassStats,
  generateCsvAttendance,
  calculateDailyAttendanceTrend,
} from './attendance';
import { findStudentByQrPayload, generateInitialStudents } from './students';
import { authenticateUser, authenticateStudentByNisn } from './auth';
import { AttendanceRecord, Student } from '../types';

test('determineAttendanceStatus correctly flags on-time vs late', () => {
  assert.equal(determineAttendanceStatus('06:45', '07:15'), 'Hadir');
  assert.equal(determineAttendanceStatus('07:10', '07:15'), 'Hadir');
  assert.equal(determineAttendanceStatus('07:15', '07:15'), 'Hadir');
  assert.equal(determineAttendanceStatus('07:16', '07:15'), 'Terlambat');
  assert.equal(determineAttendanceStatus('08:00', '07:15'), 'Terlambat');
  // Custom cutoff time e.g. 07:30
  assert.equal(determineAttendanceStatus('07:20', '07:30'), 'Hadir');
  assert.equal(determineAttendanceStatus('07:35', '07:30'), 'Terlambat');
});

test('authenticateUser works for admin and teachers', () => {
  const admin = authenticateUser('admin', 'admin123');
  assert.ok(admin);
  assert.equal(admin?.role, 'admin');

  const guru1 = authenticateUser('guru1', 'guru123');
  assert.ok(guru1);
  assert.equal(guru1?.role, 'guru');
  assert.equal(guru1?.kelas, 'VII A');

  const guru20 = authenticateUser('guru20', 'guru123');
  assert.ok(guru20);
  assert.equal(guru20?.kelas, 'IX G');

  const invalid = authenticateUser('guru1', 'wrongpass');
  assert.equal(invalid, null);
});

test('authenticateStudentByNisn allows student login with NISN only', () => {
  const students: Student[] = [
    {
      id: 'std-1',
      nis: '240001',
      nisn: '002401001',
      nama: 'Ahmad Fauzan Pratama',
      kelas: 'VII A',
      jenisKelamin: 'L',
      qrPayload: 'SISWA:240001:VII A:Ahmad Fauzan Pratama',
    },
  ];

  const sample = students[0];
  const user = authenticateStudentByNisn(sample.nisn, students);
  assert.ok(user);
  assert.equal(user?.role, 'siswa');
  assert.equal(user?.nama, sample.nama);
  assert.equal(user?.nisn, sample.nisn);
  assert.equal(user?.studentId, sample.id);

  // Invalid NISN
  const invalid = authenticateStudentByNisn('9999999999', students);
  assert.equal(invalid, null);

  // Empty NISN
  const empty = authenticateStudentByNisn('', students);
  assert.equal(empty, null);
});

test('findStudentByQrPayload matches payload properly', () => {
  const students: Student[] = [
    {
      id: 'std-1',
      nis: '240001',
      nisn: '002401001',
      nama: 'Ahmad Fauzan Pratama',
      kelas: 'VII A',
      jenisKelamin: 'L',
      qrPayload: 'SISWA:240001:VII A:Ahmad Fauzan Pratama',
    },
  ];

  const sampleStudent = students[0];
  // Match by exact QR payload
  const match1 = findStudentByQrPayload(sampleStudent.qrPayload, students);
  assert.equal(match1?.id, sampleStudent.id);

  // Match by NIS
  const match2 = findStudentByQrPayload(sampleStudent.nis, students);
  assert.equal(match2?.id, sampleStudent.id);

  // Match by payload formatted as SISWA:nis:kelas
  const match3 = findStudentByQrPayload(`SISWA:${sampleStudent.nis}:${sampleStudent.kelas}`, students);
  assert.equal(match3?.id, sampleStudent.id);
});

test('recordAttendance adds new record and replaces duplicates on same date', () => {
  const student: Student = {
    id: 'std-test-1',
    nis: '9901',
    nisn: '009901',
    nama: 'Budi Santoso',
    kelas: 'VII A',
    jenisKelamin: 'L',
    qrPayload: 'SISWA:9901:VII A:Budi',
  };

  const records: AttendanceRecord[] = [];
  const res1 = recordAttendance({
    student,
    tanggal: '2026-11-05',
    waktu: '07:05:00',
    metode: 'Kamera Live QR',
    existingRecords: records,
  });

  assert.equal(res1.success, true);
  assert.equal(res1.record?.status, 'Hadir');
  assert.equal(res1.updatedRecords.length, 1);

  // Attempt duplicate scan on the same date later
  const res2 = recordAttendance({
    student,
    tanggal: '2026-11-05',
    waktu: '07:30:00',
    statusOverride: 'Terlambat',
    metode: 'Kamera Live QR',
    existingRecords: res1.updatedRecords,
  });

  assert.equal(res2.success, true);
  assert.equal(res2.record?.status, 'Terlambat');
  // Length should still be 1 (replaced/updated, not duplicated)
  assert.equal(res2.updatedRecords.length, 1);
});

test('calculateClassStats generates correct summaries', () => {
  const students: Student[] = [
    { id: '1', nis: '101', nisn: '01', nama: 'S1', kelas: 'VII A', jenisKelamin: 'L', qrPayload: '1' },
    { id: '2', nis: '102', nisn: '02', nama: 'S2', kelas: 'VII A', jenisKelamin: 'P', qrPayload: '2' },
    { id: '3', nis: '103', nisn: '03', nama: 'S3', kelas: 'VII A', jenisKelamin: 'L', qrPayload: '3' },
    { id: '4', nis: '104', nisn: '04', nama: 'S4', kelas: 'VII A', jenisKelamin: 'P', qrPayload: '4' },
  ];

  const records: AttendanceRecord[] = [
    { id: 'r1', studentId: '1', nis: '101', nama: 'S1', kelas: 'VII A', tanggal: '2026-11-05', waktu: '07:00:00', status: 'Hadir', metode: 'Kamera Live QR' },
    { id: 'r2', studentId: '2', nis: '102', nama: 'S2', kelas: 'VII A', tanggal: '2026-11-05', waktu: '07:20:00', status: 'Terlambat', metode: 'Kamera Live QR' },
    { id: 'r3', studentId: '3', nis: '103', nama: 'S3', kelas: 'VII A', tanggal: '2026-11-05', waktu: '08:00:00', status: 'Sakit', metode: 'Manual' },
  ];

  const stats = calculateClassStats(students, records, 'VII A', '2026-11-05');
  assert.equal(stats.totalSiswa, 4);
  assert.equal(stats.hadir, 1);
  assert.equal(stats.terlambat, 1);
  assert.equal(stats.sakit, 1);
  assert.equal(stats.belumAbsen, 1); // Student 4 hasn't checked in
  assert.equal(stats.persentaseKehadiran, 50); // (1 hadir + 1 terlambat) / 4 = 50%
});

test('generateCsvAttendance produces valid CSV header and rows', () => {
  const records: AttendanceRecord[] = [
    { id: 'r1', studentId: '1', nis: '101', nama: 'Ahmad "Fauzi"', kelas: 'VII A', tanggal: '2026-11-05', waktu: '07:00:00', status: 'Hadir', metode: 'Kamera Live QR', keterangan: 'Tepat waktu' },
  ];
  const csv = generateCsvAttendance(records);
  assert.ok(csv.includes('No,Tanggal,Waktu,NIS,Nama Siswa,Kelas,Sesi,Status,Metode,Keterangan'));
  assert.ok(csv.includes('"Ahmad ""Fauzi"""'));
  assert.ok(csv.includes('"VII A"'));
});

test('calculateDailyAttendanceTrend correctly aggregates counts for class', () => {
  const records: AttendanceRecord[] = [
    { id: '1', studentId: '1', nis: '101', nama: 'S1', kelas: 'VII A', tanggal: '2026-11-05', waktu: '07:00:00', status: 'Hadir', metode: 'Kamera Live QR' },
    { id: '2', studentId: '2', nis: '102', nama: 'S2', kelas: 'VII A', tanggal: '2026-11-05', waktu: '07:20:00', status: 'Terlambat', metode: 'Kamera Live QR' },
    { id: '3', studentId: '3', nis: '103', nama: 'S3', kelas: 'VII A', tanggal: '2026-11-05', waktu: '08:00:00', status: 'Sakit', metode: 'Manual' },
    { id: '4', studentId: '4', nis: '104', nama: 'S4', kelas: 'VII A', tanggal: '2026-11-05', waktu: '08:00:00', status: 'Izin', metode: 'Manual' },
    { id: '5', studentId: '5', nis: '105', nama: 'S5', kelas: 'VII B', tanggal: '2026-11-05', waktu: '07:00:00', status: 'Hadir', metode: 'Kamera Live QR' },
    { id: '6', studentId: '1', nis: '101', nama: 'S1', kelas: 'VII A', tanggal: '2026-11-04', waktu: '07:00:00', status: 'Hadir', metode: 'Kamera Live QR' },
  ];

  const trend = calculateDailyAttendanceTrend(records, 'VII A', '2026-11-05', 3);
  assert.equal(trend.length, 3);
  // Last entry is baseDate (2026-11-05)
  const todayEntry = trend[trend.length - 1];
  assert.equal(todayEntry.date, '2026-11-05');
  assert.equal(todayEntry.hadir, 1);
  assert.equal(todayEntry.terlambat, 1);
  assert.equal(todayEntry.sakit, 1);
  assert.equal(todayEntry.izin, 1);
  assert.equal(todayEntry.total, 4); // S5 from VII B is excluded

  // Previous day entry (2026-11-04)
  const yesterdayEntry = trend[trend.length - 2];
  assert.equal(yesterdayEntry.date, '2026-11-04');
  assert.equal(yesterdayEntry.hadir, 1);
  assert.equal(yesterdayEntry.total, 1);
});


