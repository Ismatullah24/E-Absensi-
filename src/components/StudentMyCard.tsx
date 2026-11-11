import React, { useEffect, useState, useRef } from 'react';
import QRCode from 'qrcode';
import {
  Download,
  Printer,
  QrCode,
  ShieldCheck,
  CheckCircle,
  Sparkles,
  Info,
  Calendar,
  Share2
} from 'lucide-react';
import { Student } from '../types';

interface Props {
  student: Student;
  onNotify: (type: 'success' | 'warning' | 'info', title: string, desc: string) => void;
}

export const StudentMyCard: React.FC<Props> = ({ student, onNotify }) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    QRCode.toDataURL(student.qrPayload, {
      width: 280,
      margin: 1,
      color: {
        dark: '#064e3b',
        light: '#ffffff',
      },
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.warn('QR generation error in StudentMyCard:', err));
  }, [student]);

  const handleDownload = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `QR-Presensi-${student.nis}-${student.nama.replace(/\s+/g, '_')}.png`;
    a.click();
    onNotify('success', 'QR Code Diunduh', `File QR presensi atas nama ${student.nama} berhasil disimpan.`);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-in fade-in max-w-4xl mx-auto">
      {/* Header Info */}
      <div className="bg-gradient-to-r from-teal-900 via-emerald-800 to-slate-900 rounded-3xl p-6 text-white shadow-md flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 backdrop-blur-md mb-2">
            <QrCode className="w-3.5 h-3.5 text-emerald-300" />
            <span>Kartu Identitas Presensi Digital</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight">
            Kartu Pelajar &amp; QR Presensi Saya
          </h2>
          <p className="text-xs sm:text-sm text-emerald-100 mt-1 max-w-xl">
            Tunjukkan kode QR ini ke kamera scanner sekolah di gerbang masuk saat pagi dan saat jam pulang sekolah.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-white text-emerald-900 hover:bg-emerald-50 active:bg-emerald-100 font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all cursor-pointer"
          >
            <Download className="w-4 h-4 text-emerald-700" />
            <span>Unduh QR</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-950/60 hover:bg-emerald-950 text-white font-bold text-xs sm:text-sm rounded-xl border border-white/20 transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4 text-emerald-300" />
            <span>Cetak Kartu</span>
          </button>
        </div>
      </div>

      {/* Main Digital Card Display */}
      <div className="flex justify-center p-2 sm:p-6">
        <div
          ref={cardRef}
          className="w-full max-w-md bg-white rounded-3xl border-2 border-emerald-500 shadow-2xl overflow-hidden relative"
        >
          {/* Card Top Decorative Bar */}
          <div className="bg-gradient-to-r from-emerald-800 via-teal-700 to-emerald-900 p-5 text-white relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white text-emerald-800 flex items-center justify-center font-black text-base shadow-sm">
                  SMP
                </div>
                <div>
                  <div className="text-[10px] font-bold tracking-widest text-emerald-200 uppercase">
                    Kartu Tanda Siswa (KTS)
                  </div>
                  <div className="text-sm font-extrabold tracking-tight">
                    SMP NEGERI 1 TELADAN
                  </div>
                  <div className="text-[10px] text-emerald-200">
                    Tahun Ajaran 2026 / 2027
                  </div>
                </div>
              </div>

              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-white border border-white/20">
                Resmi
              </span>
            </div>
          </div>

          {/* Card Body */}
          <div className="p-6 space-y-6">
            {/* Student Profile Row */}
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-black text-2xl shadow-md shrink-0 border-2 border-white">
                {student.nama
                  .split(' ')
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join('')}
              </div>

              <div className="min-w-0 flex-1 space-y-0.5">
                <h3 className="text-base font-extrabold text-slate-900 truncate">
                  {student.nama}
                </h3>
                <div className="text-xs font-mono text-slate-500">
                  NIS: <span className="font-bold text-slate-800">{student.nis}</span>
                </div>
                <div className="text-xs font-mono text-slate-500">
                  NISN: <span className="font-bold text-emerald-700">{student.nisn}</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    Kelas {student.kelas}
                  </span>
                  <span className="text-xs text-slate-500">
                    {student.jenisKelamin === 'L' ? 'Laki-laki' : 'Perempuan'}
                  </span>
                </div>
              </div>
            </div>

            {/* QR Code Container */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col items-center justify-center text-center space-y-2">
              <div className="bg-white p-3 rounded-2xl border-2 border-emerald-400 shadow-sm">
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt={`QR Code ${student.nama}`}
                    className="w-48 h-48 object-contain"
                  />
                ) : (
                  <div className="w-48 h-48 flex items-center justify-center text-slate-400 text-xs">
                    Membuat QR...
                  </div>
                )}
              </div>
              <div className="text-[11px] font-mono text-slate-600 font-semibold">
                PAYLOAD: {student.qrPayload}
              </div>
              <div className="text-[10px] text-slate-400">
                Posisikan QR ini di depan kamera scanner sekolah
              </div>
            </div>

            {/* Card Footer Authenticity info */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Terverifikasi Sistem
              </span>
              <span className="font-mono text-[11px] text-slate-400">
                SMPN1-PRESENSI-2026
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Usage Tips Card */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
          <Info className="w-4 h-4 text-indigo-600" />
          <span>Petunjuk Penggunaan Kartu Presensi</span>
        </div>
        <ul className="text-xs text-slate-600 space-y-2 pl-5 list-disc leading-relaxed">
          <li>
            Kartu digital ini dapat disimpan di galeri smartphone atau dicetak di atas kertas foto/kartu PVC.
          </li>
          <li>
            Pastikan layar HP cukup terang saat mengarahkan kode QR ke kamera pemindai di gerbang atau ruang kelas.
          </li>
          <li>
            Jika kamera tidak membawa kartu fisik, Anda dapat menyebutkan nomor <strong>NIS ({student.nis})</strong> kepada wali kelas untuk presensi manual.
          </li>
        </ul>
      </div>
    </div>
  );
};
