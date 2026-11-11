import { Teacher } from '../types';
import { ALL_CLASSES } from './students';

const TEACHER_NAMES = [
  'Drs. H. Mulyadi, M.Pd.',
  'Siti Nurhaliza, S.Pd.',
  'Bambang Wijaya, S.Pd.I',
  'Rina Marlina, M.Si.',
  'Agus Setiawan, S.Pd.',
  'Sri Wahyuni, M.Pd.',
  'Eko Prasetyo, S.Kom.',
  'Nur Hidayati, S.Pd.',
  'Hendro Wicaksono, M.Pd.',
  'Ratna Dewi, S.Pd.',
  'Tri Haryanto, S.Pd.',
  'Endang Lestari, S.Pd.',
  'Yusuf Mansur, S.Pd.I',
  'Dewi Kartika, M.Pd.',
  'Wahyu Hidayat, S.Pd.',
  'Fitri Handayani, S.Pd.',
  'Arief Budiman, M.Pd.',
  'Lestari Rahayu, S.Pd.',
  'Fajar Nugroho, S.Pd.',
  'Sri Mulyani, S.Pd.',
];

const MAPEL_LIST = [
  'Matematika',
  'Bahasa Indonesia',
  'Pendidikan Agama Islam',
  'Ilmu Pengetahuan Alam (IPA)',
  'Ilmu Pengetahuan Sosial (IPS)',
  'Bahasa Inggris',
  'Informatika',
  'Pendidikan Pancasila & Kewarganegaraan',
  'Pendidikan Jasmani & Olahraga',
  'Seni Budaya',
];

export function generateInitialTeachers(): Teacher[] {
  return ALL_CLASSES.map((kelas, idx) => {
    const num = idx + 1;
    return {
      id: `guru-${num}`,
      nip: `198${5 + (idx % 10)}0${(idx % 12) + 1}201001${1000 + num}`,
      nama: TEACHER_NAMES[idx] || `Guru Wali Kelas ${kelas}`,
      username: `guru${num}`,
      kelas,
      mapel: MAPEL_LIST[idx % MAPEL_LIST.length],
      telepon: `0812-3456-${String(7000 + num)}`,
      status: 'Aktif',
    };
  });
}

export const INITIAL_TEACHERS: Teacher[] = generateInitialTeachers();

export function loadTeachers(): Teacher[] {
  try {
    const saved = localStorage.getItem('absen_teachers_list');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Failed to parse teachers from localStorage:', err);
  }
  return INITIAL_TEACHERS;
}

export function saveTeachers(teachers: Teacher[]): void {
  try {
    localStorage.setItem('absen_teachers_list', JSON.stringify(teachers));
  } catch (err) {
    console.warn('Failed to save teachers to localStorage:', err);
  }
}
