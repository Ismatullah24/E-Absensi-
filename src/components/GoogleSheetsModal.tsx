import React, { useState } from 'react';
import {
  FileSpreadsheet,
  CheckCircle2,
  Copy,
  ExternalLink,
  RefreshCw,
  Send,
  X,
  Code2,
  AlertCircle,
  HelpCircle,
  Database
} from 'lucide-react';
import {
  GoogleSheetsConfig,
  generateGoogleAppsScriptCode,
  sendRecordToGoogleSheet,
  DEFAULT_LIBRARY_ID,
  DEFAULT_LIBRARY_URL,
} from '../utils/googleSheetsSync';
import { AttendanceRecord } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  config: GoogleSheetsConfig;
  onSaveConfig: (newConfig: GoogleSheetsConfig) => void;
  records: AttendanceRecord[];
  onNotify: (type: 'success' | 'warning' | 'info', title: string, desc: string) => void;
}

export const GoogleSheetsModal: React.FC<Props> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  records,
  onNotify,
}) => {
  const [webAppUrl, setWebAppUrl] = useState(config.webAppUrl);
  const [libraryId, setLibraryId] = useState(config.libraryId || DEFAULT_LIBRARY_ID);
  const [spreadsheetName, setSpreadsheetName] = useState(config.spreadsheetName);
  const [sheetName, setSheetName] = useState(config.sheetName);
  const [autoSync, setAutoSync] = useState(config.autoSync);
  const [activeTab, setActiveTab] = useState<'config' | 'code' | 'tutorial'>('config');
  const [isTesting, setIsTesting] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  if (!isOpen) return null;

  const scriptCode = generateGoogleAppsScriptCode(libraryId);

  const handleSave = () => {
    const updated: GoogleSheetsConfig = {
      ...config,
      webAppUrl: webAppUrl.trim(),
      libraryId: libraryId.trim(),
      spreadsheetName: spreadsheetName.trim(),
      sheetName: sheetName.trim(),
      autoSync,
      isConnected: true,
      lastSyncTime: new Date().toLocaleTimeString('id-ID'),
    };
    onSaveConfig(updated);
    onNotify(
      'success',
      'Pengaturan Google Sheets Disimpan',
      'Aplikasi siap mengirim data absensi langsung ke Spreadsheet.'
    );
    onClose();
  };

  const handleTestPing = async () => {
    setIsTesting(true);
    try {
      if (webAppUrl.trim()) {
        const testRecord: AttendanceRecord = {
          id: `test-${Date.now()}`,
          studentId: 'test-1',
          nis: 'TEST-001',
          nama: 'Uji Koneksi Sistem',
          kelas: 'VII A',
          tanggal: new Date().toISOString().split('T')[0],
          waktu: new Date().toLocaleTimeString('id-ID'),
          sesi: 'Masuk',
          status: 'Hadir',
          keterangan: 'Uji kirim data dari aplikasi presensi',
          metode: 'Simulasi',
        };

        const res = await sendRecordToGoogleSheet(testRecord, {
          ...config,
          webAppUrl: webAppUrl.trim(),
        });

        if (res.success) {
          onNotify(
            'success',
            'Koneksi Berhasil!',
            'Data uji coba berhasil dikirim ke Google Apps Script / Spreadsheet.'
          );
        } else {
          onNotify('warning', 'Respon Diterima', res.message);
        }
      } else {
        onNotify(
          'info',
          'Mode Lokal Aktif',
          'URL Web App belum diisi. Data tersimpan di browser dan siap diekspor ke Excel/CSV kapan saja.'
        );
      }
    } finally {
      setIsTesting(false);
    }
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(scriptCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 3000);
      onNotify('success', 'Kode Disalin', 'Skrip Google Apps Script berhasil disalin ke clipboard.');
    } catch {
      // fallback
    }
  };

  const handleSyncAll = async () => {
    if (records.length === 0) {
      onNotify('info', 'Tidak Ada Data', 'Belum ada catatan presensi untuk disinkronkan.');
      return;
    }

    setIsTesting(true);
    let count = 0;
    for (const rec of records) {
      await sendRecordToGoogleSheet(rec, { ...config, webAppUrl });
      count++;
    }
    setIsTesting(false);
    onNotify(
      'success',
      'Sinkronisasi Selesai',
      `${count} data absensi diproses ke antrean Google Sheets.`
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-3xl w-full p-6 shadow-2xl max-h-[92vh] flex flex-col border border-emerald-100">
        {/* Header with Google Sheets branding */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-gray-900">
                  Integrasi Google Spreadsheet &amp; Apps Script
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Siap Sinkron
                </span>
              </div>
              <p className="text-xs text-gray-500">
                Terhubung dengan Library ID: <code className="bg-gray-100 px-1 py-0.5 rounded text-gray-700 font-mono">{libraryId}</code> (Versi 5)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100 transition-colors"
            aria-label="Tutup modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switchers */}
        <div className="flex items-center gap-1 bg-gray-100/80 p-1 rounded-xl my-3 shrink-0 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('config')}
            className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'config'
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Database className="w-4 h-4" />
            Pengaturan Webhook &amp; Sheet
          </button>
          <button
            onClick={() => setActiveTab('code')}
            className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'code'
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Code2 className="w-4 h-4" />
            Salin Skrip Code.gs
          </button>
          <button
            onClick={() => setActiveTab('tutorial')}
            className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'tutorial'
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            Panduan Pemasangan
          </button>
        </div>

        {/* Content body */}
        <div className="overflow-y-auto flex-1 pr-1 space-y-4">
          {activeTab === 'config' && (
            <div className="space-y-4">
              {/* Apps Script library banner */}
              <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl flex items-start justify-between gap-3 text-xs">
                <div>
                  <div className="font-bold text-emerald-950 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    Library Google Apps Script Terdeteksi
                  </div>
                  <p className="text-emerald-800 mt-1 leading-relaxed">
                    ID Library: <span className="font-mono font-semibold">{libraryId}</span> (Versi 5). Skrip ini memproses pencatatan baris absensi baru ke Google Sheet secara otomatis tiap kali QR dipindai.
                  </p>
                </div>
                <a
                  href={DEFAULT_LIBRARY_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="shrink-0 px-3 py-1.5 bg-white text-emerald-700 font-bold rounded-xl border border-emerald-300 hover:bg-emerald-100 flex items-center gap-1 shadow-xs transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Buka Library
                </a>
              </div>

              {/* Form inputs */}
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-gray-700 uppercase tracking-wider mb-1">
                    URL Deployment Web App Google Apps Script
                  </label>
                  <input
                    type="url"
                    value={webAppUrl}
                    onChange={(e) => setWebAppUrl(e.target.value)}
                    placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                    className="w-full text-xs p-3 bg-gray-50 rounded-xl border border-gray-200 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                  <p className="text-[11px] text-gray-500 mt-1">
                    Didapat dari menu <strong>Deploy &gt; New deployment &gt; Web app</strong> (Who has access: <em>Anyone</em>).
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-gray-700 uppercase tracking-wider mb-1">
                      Nama File Spreadsheet
                    </label>
                    <input
                      type="text"
                      value={spreadsheetName}
                      onChange={(e) => setSpreadsheetName(e.target.value)}
                      placeholder="Database Absensi Siswa"
                      className="w-full text-xs p-2.5 bg-gray-50 rounded-xl border border-gray-200 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-gray-700 uppercase tracking-wider mb-1">
                      Nama Tab Sheet Tujuan
                    </label>
                    <input
                      type="text"
                      value={sheetName}
                      onChange={(e) => setSheetName(e.target.value)}
                      placeholder="Log_Absen"
                      className="w-full text-xs p-2.5 bg-gray-50 rounded-xl border border-gray-200 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                {/* Toggles */}
                <div className="pt-2 flex items-center justify-between p-3.5 bg-gray-50 rounded-2xl border border-gray-200">
                  <div>
                    <div className="font-bold text-gray-900">Sinkronisasi Otomatis Realtime</div>
                    <div className="text-[11px] text-gray-500">
                      Kirim data langsung ke Spreadsheet setiap kali siswa berhasil memindai QR
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoSync}
                      onChange={(e) => setAutoSync(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleTestPing}
                  disabled={isTesting}
                  className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold rounded-xl border border-emerald-200 flex items-center gap-1.5 text-xs transition-colors cursor-pointer"
                >
                  <Send className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                  {isTesting ? 'Menguji...' : 'Uji Kirim Data Sampel'}
                </button>

                <button
                  type="button"
                  onClick={handleSyncAll}
                  disabled={isTesting || records.length === 0}
                  className="px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl flex items-center gap-1.5 text-xs transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Kirim Ulang {records.length} Data Absensi ke Sheet
                </button>
              </div>
            </div>
          )}

          {activeTab === 'code' && (
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <p className="text-gray-600 font-medium">
                  Salin skrip backend berikut dan tempelkan pada editor <strong>Google Apps Script</strong> di spreadsheet Anda:
                </p>
                <button
                  onClick={handleCopyCode}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copiedCode ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copiedCode ? 'Tersalin!' : 'Salin Semua Kode'}
                </button>
              </div>

              <pre className="p-4 bg-slate-900 text-slate-100 rounded-2xl font-mono text-[11px] overflow-x-auto max-h-72 border border-slate-800 leading-relaxed">
                {scriptCode}
              </pre>
            </div>
          )}

          {activeTab === 'tutorial' && (
            <div className="space-y-3 text-xs text-gray-700">
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-3">
                <div className="font-bold text-gray-900 text-sm">
                  Cara Menyambungkan ke Google Spreadsheet:
                </div>
                <ol className="list-decimal pl-5 space-y-2 leading-relaxed">
                  <li>
                    Buka Google Drive Anda, buat <strong>Google Spreadsheet</strong> baru (misal: <em>Database Absensi Siswa</em>).
                  </li>
                  <li>
                    Buka menu <strong>Ekstensi &gt; Apps Script</strong>.
                  </li>
                  <li>
                    Salin kode pada tab <strong>&quot;Salin Skrip Code.gs&quot;</strong> di atas, lalu gantikan semua kode default di Apps Script dengan kode tersebut.
                  </li>
                  <li>
                    Klik tombol biru <strong>Deploy &gt; New deployment (Deployment baru)</strong> di kanan atas:
                    <ul className="list-disc pl-5 mt-1 text-gray-600">
                      <li>Pilih jenis: <strong>Web app</strong></li>
                      <li>Description: <em>Absensi Siswa v5</em></li>
                      <li>Execute as: <strong>Me (email Anda)</strong></li>
                      <li>Who has access: <strong>Anyone (Siapa saja)</strong></li>
                    </ul>
                  </li>
                  <li>
                    Klik <strong>Deploy</strong>, izinkan akses akun Google Anda, kemudian salin <strong>Web App URL</strong> (berakhiran <code>/exec</code>) dan tempelkan ke form di tab Pengaturan!
                  </li>
                </ol>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-2 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-800 rounded-xl hover:bg-gray-100 transition-colors"
          >
            Batal
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-xl shadow-md shadow-emerald-600/20 transition-all cursor-pointer flex items-center gap-1.5"
          >
            <CheckCircle2 className="w-4 h-4" />
            Simpan Pengaturan
          </button>
        </div>
      </div>
    </div>
  );
};
