import { Student } from '../types';

export const ALL_CLASSES = [
  'VII A', 'VII B', 'VII C', 'VII D', 'VII E', 'VII F', 'VII G',
  'VIII A', 'VIII B', 'VIII C', 'VIII D', 'VIII E', 'VIII F',
  'IX A', 'IX B', 'IX C', 'IX D', 'IX E', 'IX F', 'IX G'
];

const STUDENT_TEMPLATES = [
  { nama: 'Ahmad Fauzan Pratama', jk: 'L' as const },
  { nama: 'Aisyah Putri Azzahra', jk: 'P' as const },
  { nama: 'Budi Santoso', jk: 'L' as const },
  { nama: 'Dewi Sekar Sari', jk: 'P' as const },
  { nama: 'Dimas Aditya Nugraha', jk: 'L' as const },
  { nama: 'Farah Nabila Ramadhani', jk: 'P' as const },
  { nama: 'Gilang Ramadhan', jk: 'L' as const },
  { nama: 'Hana Khairunnisa', jk: 'P' as const },
];

export function generateInitialStudents(): Student[] {
  return [];
}

export const INITIAL_STUDENTS: Student[] = [];

export function findStudentByQrPayload(payload: string, students: Student[]): Student | null {
  if (!payload) return null;
  const cleanPayload = payload.trim();

  // Try exact QR payload match
  const exact = students.find((s) => s.qrPayload === cleanPayload);
  if (exact) return exact;

  // Try parsing "SISWA:nis:kelas" or similar pattern
  if (cleanPayload.startsWith('SISWA:')) {
    const parts = cleanPayload.split(':');
    const nis = parts[1];
    const match = students.find((s) => s.nis === nis);
    if (match) return match;
  }

  // Try direct NIS match
  const byNis = students.find((s) => s.nis === cleanPayload);
  if (byNis) return byNis;

  // Try name match (case-insensitive substring)
  const byName = students.find((s) => s.nama.toLowerCase().includes(cleanPayload.toLowerCase()));
  if (byName) return byName;

  return null;
}

const STUDENTS_STORAGE_KEY = 'absen_students_list';

export function loadStudents(): Student[] {
  try {
    const raw = localStorage.getItem(STUDENTS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Failed to load students from localStorage:', err);
  }
  return [];
}

export function saveStudents(students: Student[]): void {
  try {
    localStorage.setItem(STUDENTS_STORAGE_KEY, JSON.stringify(students));
  } catch (err) {
    console.warn('Failed to save students to localStorage:', err);
  }
}

