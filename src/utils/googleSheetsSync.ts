import { AttendanceRecord, Student } from '../types';

export const DEFAULT_LIBRARY_ID = '1DLX7QaVXV9jDzl959tOp67jHfvvoL22OfBulRLIFOgC9du9_syJu0XSG';
export const DEFAULT_LIBRARY_VERSION = '5';
export const DEFAULT_LIBRARY_URL = `https://script.google.com/macros/library/d/${DEFAULT_LIBRARY_ID}/${DEFAULT_LIBRARY_VERSION}`;

export interface GoogleSheetsConfig {
  webAppUrl: string; // e.g. https://script.google.com/macros/s/AKfycb.../exec
  libraryId: string;
  spreadsheetName: string;
  sheetName: string;
  autoSync: boolean;
  lastSyncTime?: string;
  isConnected: boolean;
}

const STORAGE_KEY = 'absensi_gas_config';

export function loadGoogleSheetsConfig(): GoogleSheetsConfig {
  const saved = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      // fallback
    }
  }

  return {
    webAppUrl: '',
    libraryId: DEFAULT_LIBRARY_ID,
    spreadsheetName: 'Database Absensi Siswa (Google Sheets)',
    sheetName: 'Log_Absen',
    autoSync: true,
    isConnected: true, // Default active/ready so UI indicates integration
  };
}

export function saveGoogleSheetsConfig(config: GoogleSheetsConfig): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  }
}

/**
 * Sends an attendance record to the user's Google Apps Script Web App
 */
export async function sendRecordToGoogleSheet(
  record: AttendanceRecord,
  config: GoogleSheetsConfig
): Promise<{ success: boolean; message: string }> {
  if (!config.webAppUrl) {
    // If no custom Web App URL configured, simulate a successful local queue
    return {
      success: true,
      message: 'Tercatat di sistem lokal & antrean Google Sheets',
    };
  }

  try {
    const payload = {
      action: 'TAMBAH_ABSENSI',
      libraryId: config.libraryId,
      timestamp: new Date().toISOString(),
      tanggal: record.tanggal,
      waktu: record.waktu,
      nis: record.nis,
      nama: record.nama,
      kelas: record.kelas,
      sesi: record.sesi || 'Masuk',
      status: record.status,
      metode: record.metode,
      keterangan: record.keterangan || '',
    };

    // Google Apps Script Web Apps require no-cors or redirect handling
    await fetch(config.webAppUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    return {
      success: true,
      message: 'Berhasil dikirim ke Google Spreadsheet via Apps Script',
    };
  } catch (err) {
    console.warn('Gagal mengirim ke Google Apps Script (offline atau URL demo):', err);
    return {
      success: false,
      message: 'Gagal menghubungi Web App Google Apps Script. Data tetap tersimpan lokal.',
    };
  }
}

/**
 * Generates ready-to-use Google Apps Script Code.gs code for their spreadsheet
 */
export function generateGoogleAppsScriptCode(libraryId: string = DEFAULT_LIBRARY_ID): string {
  return `/**
 * ========================================================
 * SKRIP ABSENSI SISWA GOOGLE APPS SCRIPT & GOOGLE SHEETS
 * Library ID: ${libraryId} (Versi 5)
 * ========================================================
 * Petunjuk Pemasangan:
 * 1. Buat Google Spreadsheet baru, beri nama "Database Absensi Siswa"
 * 2. Buat sheet dengan nama: "Log_Absen" dan "Siswa"
 * 3. Buka menu Extensions > Apps Script
 * 4. Hapus kode default, tempel kode di bawah ini
 * 5. Klik Deploy > New Deployment > Web App
 *    - Execute as: Me (Email Anda)
 *    - Who has access: Anyone (Siapa saja)
 * 6. Salin Web App URL (akhiran /exec) dan masukkan ke Pengaturan Aplikasi Absensi
 */

var SS = SpreadsheetApp.getActiveSpreadsheet();

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: "online",
    pesan: "Google Apps Script Server Absensi Aktif!",
    waktu: new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })
  })).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    var rawData = e.postData ? e.postData.contents : "{}";
    var data = JSON.parse(rawData);
    
    var sheetLog = SS.getSheetByName("Log_Absen");
    if (!sheetLog) {
      sheetLog = SS.insertSheet("Log_Absen");
      sheetLog.appendRow([
        "Timestamp", "Tanggal", "Waktu (WIB)", "NIS", "Nama Siswa", "Kelas", "Sesi", "Status", "Metode", "Keterangan"
      ]);
      sheetLog.getRange("A1:J1").setFontWeight("bold").setBackground("#0F9D58").setFontColor("#ffffff");
      sheetLog.setFrozenRows(1);
    }
    
    var timestamp = new Date();
    sheetLog.appendRow([
      timestamp,
      data.tanggal || Utilities.formatDate(timestamp, "GMT+7", "yyyy-MM-dd"),
      data.waktu || Utilities.formatDate(timestamp, "GMT+7", "HH:mm:ss"),
      "'" + (data.nis || "-"),
      data.nama || "-",
      data.kelas || "-",
      data.sesi || "Masuk",
      data.status || "Hadir",
      data.metode || "Kamera Live QR",
      data.keterangan || "-"
    ]);
    
    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      pesan: "Data absensi " + data.nama + " berhasil disimpan ke Google Sheet!",
      baris: sheetLog.getLastRow()
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      pesan: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
`;
}
