import { AttendanceScheduleConfig } from '../types';

export const DEFAULT_SCHEDULE: AttendanceScheduleConfig = {
  jamMasukBuka: '06:00',
  jamMasukBatas: '07:15',
  jamMasukTutup: '08:00',
  jamPulangBuka: '14:00',
  jamPulangTutup: '17:00',
  toleransiTerlambatMenit: 15,
  hariAktif: ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'],
  pesanTerlambat: 'Hadir melewati batas waktu (Terlambat)',
  pesanTepatWaktu: 'Hadir tepat waktu',
};

const SCHEDULE_STORAGE_KEY = 'absen_schedule_config';

export function loadScheduleConfig(): AttendanceScheduleConfig {
  try {
    const raw = localStorage.getItem(SCHEDULE_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_SCHEDULE, ...parsed };
    }
  } catch (err) {
    console.warn('Failed to load schedule config from localStorage:', err);
  }
  return DEFAULT_SCHEDULE;
}

export function saveScheduleConfig(config: AttendanceScheduleConfig): void {
  try {
    localStorage.setItem(SCHEDULE_STORAGE_KEY, JSON.stringify(config));
  } catch (err) {
    console.warn('Failed to save schedule config to localStorage:', err);
  }
}
