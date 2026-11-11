export type UserRole = 'admin' | 'guru' | 'siswa';

export interface User {
  username: string;
  role: UserRole;
  kelas?: string; // e.g. "VII A"
  nama: string;
  nisn?: string; // Khusus role siswa
  studentId?: string;
  student?: Student;
}

export type AttendanceStatus = 'Hadir' | 'Terlambat' | 'Sakit' | 'Izin' | 'Alpa';

export interface Student {
  id: string;
  nis: string;
  nisn: string;
  nama: string;
  kelas: string;
  jenisKelamin: 'L' | 'P';
  foto?: string;
  qrPayload: string; // e.g. "SISWA:1001:VII A"
}

export interface Teacher {
  id: string;
  nip: string;
  nama: string;
  username: string;
  kelas?: string; // e.g. "VII A" atau "-" jika bukan wali kelas
  mapel: string;
  telepon?: string;
  status: 'Aktif' | 'Cuti';
}

export interface AttendanceScheduleConfig {
  jamMasukBuka: string; // e.g. "06:00"
  jamMasukBatas: string; // e.g. "07:15" (Batas tepat waktu vs terlambat)
  jamMasukTutup: string; // e.g. "08:00" (Batas akhir sesi masuk)
  jamPulangBuka: string; // e.g. "14:00" (Jam mulai kepulangan)
  jamPulangTutup: string; // e.g. "17:00" (Batas akhir sesi pulang)
  toleransiTerlambatMenit: number; // e.g. 15
  hariAktif: string[]; // e.g. ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"]
  pesanTerlambat: string;
  pesanTepatWaktu: string;
}

export type AttendanceSession = 'Masuk' | 'Pulang';

export interface AttendanceRecord {
  id: string;
  studentId: string;
  nis: string;
  nama: string;
  kelas: string;
  tanggal: string; // YYYY-MM-DD
  waktu: string; // HH:mm:ss
  sesi?: AttendanceSession;
  status: AttendanceStatus;
  keterangan?: string;
  metode: 'Kamera Live QR' | 'Foto Selfie' | 'Upload Foto' | 'Manual' | 'Simulasi' | 'Barcode Scanner';
  fotoBukti?: string;
  syncedToSheet?: boolean;
}

export interface ClassStats {
  totalSiswa: number;
  hadir: number;
  terlambat: number;
  sakit: number;
  izin: number;
  alpa: number;
  pulang?: number;
  belumAbsen: number;
  persentaseKehadiran: number;
}
