import { User, Student } from '../types';

export interface UserCredential {
  username: string;
  password: string;
  role: 'admin' | 'guru';
  kelas?: string;
  nama: string;
}

export const USER_ACCOUNTS: UserCredential[] = [
  { username: 'admin', password: 'admin123', role: 'admin', nama: 'Administrator Sekolah' },
  { username: 'guru1', password: 'guru123', role: 'guru', kelas: 'VII A', nama: 'Wali Kelas VII A' },
  { username: 'guru2', password: 'guru123', role: 'guru', kelas: 'VII B', nama: 'Wali Kelas VII B' },
  { username: 'guru3', password: 'guru123', role: 'guru', kelas: 'VII C', nama: 'Wali Kelas VII C' },
  { username: 'guru4', password: 'guru123', role: 'guru', kelas: 'VII D', nama: 'Wali Kelas VII D' },
  { username: 'guru5', password: 'guru123', role: 'guru', kelas: 'VII E', nama: 'Wali Kelas VII E' },
  { username: 'guru6', password: 'guru123', role: 'guru', kelas: 'VII F', nama: 'Wali Kelas VII F' },
  { username: 'guru7', password: 'guru123', role: 'guru', kelas: 'VII G', nama: 'Wali Kelas VII G' },
  { username: 'guru8', password: 'guru123', role: 'guru', kelas: 'VIII A', nama: 'Wali Kelas VIII A' },
  { username: 'guru9', password: 'guru123', role: 'guru', kelas: 'VIII B', nama: 'Wali Kelas VIII B' },
  { username: 'guru10', password: 'guru123', role: 'guru', kelas: 'VIII C', nama: 'Wali Kelas VIII C' },
  { username: 'guru11', password: 'guru123', role: 'guru', kelas: 'VIII D', nama: 'Wali Kelas VIII D' },
  { username: 'guru12', password: 'guru123', role: 'guru', kelas: 'VIII E', nama: 'Wali Kelas VIII E' },
  { username: 'guru13', password: 'guru123', role: 'guru', kelas: 'VIII F', nama: 'Wali Kelas VIII F' },
  { username: 'guru14', password: 'guru123', role: 'guru', kelas: 'IX A', nama: 'Wali Kelas IX A' },
  { username: 'guru15', password: 'guru123', role: 'guru', kelas: 'IX B', nama: 'Wali Kelas IX B' },
  { username: 'guru16', password: 'guru123', role: 'guru', kelas: 'IX C', nama: 'Wali Kelas IX C' },
  { username: 'guru17', password: 'guru123', role: 'guru', kelas: 'IX D', nama: 'Wali Kelas IX D' },
  { username: 'guru18', password: 'guru123', role: 'guru', kelas: 'IX E', nama: 'Wali Kelas IX E' },
  { username: 'guru19', password: 'guru123', role: 'guru', kelas: 'IX F', nama: 'Wali Kelas IX F' },
  { username: 'guru20', password: 'guru123', role: 'guru', kelas: 'IX G', nama: 'Wali Kelas IX G' },
];

export function authenticateUser(username: string, password: string): User | null {
  const cleanUsername = username.trim().toLowerCase();
  const found = USER_ACCOUNTS.find(
    (u) => u.username.toLowerCase() === cleanUsername && u.password === password
  );
  if (!found) return null;

  return {
    username: found.username,
    role: found.role,
    kelas: found.kelas,
    nama: found.nama,
  };
}

export function authenticateStudentByNisn(nisnInput: string, students: Student[]): User | null {
  if (!nisnInput) return null;
  const cleanInput = nisnInput.trim().replace(/\D/g, '');
  if (!cleanInput) return null;

  const found = students.find((s) => {
    const studentNisn = s.nisn.replace(/\D/g, '');
    return studentNisn === cleanInput || studentNisn.endsWith(cleanInput) || cleanInput.endsWith(studentNisn);
  });

  if (!found) return null;

  return {
    username: found.nisn,
    role: 'siswa',
    kelas: found.kelas,
    nama: found.nama,
    nisn: found.nisn,
    studentId: found.id,
    student: found,
  };
}
