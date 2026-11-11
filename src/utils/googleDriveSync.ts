import { Student, Teacher, AttendanceRecord } from '../types';

export interface DriveSpreadsheetMeta {
  id: string;
  name: string;
  webViewLink?: string;
}

export interface GoogleDriveSyncState {
  spreadsheetId: string | null;
  spreadsheetName: string;
  spreadsheetUrl: string | null;
  lastSyncTime: string | null;
  lastSyncStatus: 'idle' | 'syncing' | 'success' | 'error';
  errorMessage?: string;
}

const DRIVE_SYNC_STORAGE_KEY = 'absensi_drive_sync_meta';

export function loadDriveSyncState(): GoogleDriveSyncState {
  if (typeof window === 'undefined') {
    return {
      spreadsheetId: null,
      spreadsheetName: 'REMIX E-ABSENSI',
      spreadsheetUrl: null,
      lastSyncTime: null,
      lastSyncStatus: 'idle',
    };
  }
  const saved = localStorage.getItem(DRIVE_SYNC_STORAGE_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      // ignore
    }
  }
  return {
    spreadsheetId: null,
    spreadsheetName: 'REMIX E-ABSENSI',
    spreadsheetUrl: null,
    lastSyncTime: null,
    lastSyncStatus: 'idle',
  };
}

export function saveDriveSyncState(state: GoogleDriveSyncState): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(DRIVE_SYNC_STORAGE_KEY, JSON.stringify(state));
  }
}

/**
 * Searches user's Google Drive for existing spreadsheets created with app
 */
export async function searchDriveSpreadsheets(
  accessToken: string
): Promise<DriveSpreadsheetMeta[]> {
  const query = encodeURIComponent("mimeType='application/vnd.google-apps.spreadsheet' and trashed=false");
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,webViewLink)&pageSize=20&orderBy=modifiedTime desc`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Gagal mencari file Google Drive: ${errorText}`);
  }

  const data = await res.json();
  return data.files || [];
}

/**
 * Creates a brand new Google Spreadsheet on Google Drive with 3 dedicated sheets:
 * 1. "DATA_SISWA"
 * 2. "DATA_GURU"
 * 3. "LOG_PRESENSI"
 */
export async function createDriveDatabaseSpreadsheet(
  accessToken: string,
  spreadsheetTitle: string = 'REMIX E-ABSENSI',
  students: Student[],
  teachers: Teacher[],
  records: AttendanceRecord[]
): Promise<{ spreadsheetId: string; spreadsheetUrl: string }> {
  // Step 1: Create spreadsheet with Sheets API
  const createPayload = {
    properties: {
      title: spreadsheetTitle,
    },
    sheets: [
      { properties: { title: 'DATA_SISWA', index: 0 } },
      { properties: { title: 'DATA_GURU', index: 1 } },
      { properties: { title: 'LOG_PRESENSI', index: 2 } },
    ],
  };

  const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(createPayload),
  });

  if (!createRes.ok) {
    const err = await createRes.text();
    throw new Error(`Gagal membuat Google Spreadsheet di Google Drive: ${err}`);
  }

  const sheetData = await createRes.json();
  const spreadsheetId = sheetData.spreadsheetId;
  const spreadsheetUrl =
    sheetData.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  // Step 2: Push initial records to sheets
  await pushAllDataToSpreadsheet(accessToken, spreadsheetId, students, teachers, records);

  return { spreadsheetId, spreadsheetUrl };
}

/**
 * Pushes local Students, Teachers, and Attendance records into Google Drive Spreadsheet
 */
export async function pushAllDataToSpreadsheet(
  accessToken: string,
  spreadsheetId: string,
  students: Student[],
  teachers: Teacher[],
  records: AttendanceRecord[]
): Promise<void> {
  // Prepare DATA_SISWA
  const studentRows: (string | number)[][] = [
    ['No', 'ID', 'NIS', 'NISN', 'Nama Lengkap', 'Kelas', 'Jenis Kelamin (L/P)', 'QR Payload'],
    ...students.map((s, idx) => [
      idx + 1,
      s.id,
      s.nis,
      s.nisn,
      s.nama,
      s.kelas,
      s.jenisKelamin,
      s.qrPayload,
    ]),
  ];

  // Prepare DATA_GURU
  const teacherRows: (string | number)[][] = [
    ['No', 'ID', 'NIP', 'Nama Lengkap Guru', 'Wali Kelas / Tugas', 'Mata Pelajaran', 'Username Login'],
    ...teachers.map((t, idx) => [
      idx + 1,
      t.id,
      t.nip,
      t.nama,
      t.kelas || '-',
      t.mapel,
      t.username,
    ]),
  ];

  // Prepare LOG_PRESENSI
  const attendanceRows: (string | number)[][] = [
    ['No', 'Tanggal', 'Waktu (WIB)', 'NIS', 'Nama Siswa', 'Kelas', 'Sesi', 'Status Kehadiran', 'Metode Presensi', 'Keterangan'],
    ...records.map((r, idx) => [
      idx + 1,
      r.tanggal,
      r.waktu,
      r.nis,
      r.nama,
      r.kelas,
      r.sesi || 'Masuk',
      r.status,
      r.metode,
      r.keterangan || '',
    ]),
  ];

  const updatePayload = {
    valueInputOption: 'USER_ENTERED',
    data: [
      {
        range: 'DATA_SISWA!A1:H',
        values: studentRows,
      },
      {
        range: 'DATA_GURU!A1:G',
        values: teacherRows,
      },
      {
        range: 'LOG_PRESENSI!A1:J',
        values: attendanceRows,
      },
    ],
  };

  const updateRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updatePayload),
    }
  );

  if (!updateRes.ok) {
    const err = await updateRes.text();
    throw new Error(`Gagal memperbarui spreadsheet Google Drive: ${err}`);
  }
}

/**
 * Reads Students and Teachers from Google Drive Spreadsheet to update app database
 */
export async function pullDataFromSpreadsheet(
  accessToken: string,
  spreadsheetId: string
): Promise<{
  students: Student[];
  teachers: Teacher[];
}> {
  // First, verify existing sheet names in spreadsheet
  const metaRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties.title`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!metaRes.ok) {
    throw new Error('Gagal mengambil metadata Google Spreadsheet dari Drive.');
  }

  const metaData = await metaRes.json();
  const sheetTitles: string[] = metaData.sheets.map(
    (s: { properties: { title: string } }) => s.properties.title
  );

  const studentSheet = sheetTitles.find(
    (t) => t.toUpperCase().includes('SISWA') || t === 'DATA_SISWA'
  ) || sheetTitles[0];

  const teacherSheet = sheetTitles.find(
    (t) => t.toUpperCase().includes('GURU') || t === 'DATA_GURU'
  );

  // Fetch student values
  const studentRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(
      studentSheet
    )}!A2:H500`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  const studentData = await studentRes.json();
  const studentValues: string[][] = studentData.values || [];

  const parsedStudents: Student[] = [];
  studentValues.forEach((row, idx) => {
    // Row mapping:
    // row[0]=No, row[1]=id, row[2]=nis, row[3]=nisn, row[4]=nama, row[5]=kelas, row[6]=jenisKelamin, row[7]=qrPayload
    const nis = row[2]?.toString().trim() || row[1]?.toString().trim() || `24${String(idx + 1).padStart(4, '0')}`;
    const nama = row[4]?.toString().trim() || row[2]?.toString().trim() || `Siswa ${idx + 1}`;
    const kelas = row[5]?.toString().trim() || 'VII A';
    const nisn = row[3]?.toString().trim() || `00240${nis}`;
    const jenisKelamin = (row[6]?.toString().trim().toUpperCase() === 'P' ? 'P' : 'L') as 'L' | 'P';
    const id = row[1]?.toString().trim() || `std-${nis}`;
    const qrPayload = row[7]?.toString().trim() || `SISWA:${nis}:${kelas}:${nama}`;

    if (nama && nis) {
      parsedStudents.push({
        id,
        nis,
        nisn,
        nama,
        kelas,
        jenisKelamin,
        qrPayload,
      });
    }
  });

  // Fetch teacher values if exists
  const parsedTeachers: Teacher[] = [];
  if (teacherSheet) {
    const teacherRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(
        teacherSheet
      )}!A2:G200`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );
    const teacherData = await teacherRes.json();
    const teacherValues: string[][] = teacherData.values || [];

    teacherValues.forEach((row, idx) => {
      // row[0]=No, row[1]=id, row[2]=nip, row[3]=nama, row[4]=kelas, row[5]=mapel, row[6]=username
      const nip = row[2]?.toString().trim() || `198501012010011${String(idx + 1).padStart(3, '0')}`;
      const nama = row[3]?.toString().trim() || row[2]?.toString().trim() || `Guru ${idx + 1}`;
      const kelas = row[4]?.toString().trim() || 'VII A';
      const mapel = row[5]?.toString().trim() || 'Mata Pelajaran';
      const username = row[6]?.toString().trim() || `guru${idx + 1}`;
      const id = row[1]?.toString().trim() || `t-${idx + 1}`;

      if (nama) {
        parsedTeachers.push({
          id,
          nip,
          nama,
          kelas,
          mapel,
          username,
          status: 'Aktif',
        });
      }
    });
  }

  return {
    students: parsedStudents,
    teachers: parsedTeachers,
  };
}
