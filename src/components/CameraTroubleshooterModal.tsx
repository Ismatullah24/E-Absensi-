import React from 'react';
import { Camera, AlertTriangle, ShieldCheck, RefreshCw, X, CheckCircle2, Monitor, Smartphone, VideoOff } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onRetry: () => void;
  onStartVirtual?: () => void;
  lastErrorMessage?: string;
}

export const CameraTroubleshooterModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onRetry,
  onStartVirtual,
  lastErrorMessage,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-50 rounded-xl text-amber-600">
              <Camera className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Solusi Kamera Tidak Bisa Dibuka</h3>
              <p className="text-xs text-gray-500">Panduan perbaikan izin &amp; perangkat kamera</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Tutup panduan"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {lastErrorMessage && (
          <div className="my-4 p-3.5 bg-amber-50/90 border border-amber-200 rounded-xl flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-semibold text-amber-900">Informasi Status Kamera:</div>
              <div className="text-xs text-amber-800 font-mono mt-0.5 break-all">{lastErrorMessage}</div>
            </div>
          </div>
        )}

        <div className="space-y-4 my-4">
          <div className="bg-emerald-50/70 border border-emerald-200 p-4 rounded-xl">
            <div className="flex items-center gap-2 text-emerald-800 font-semibold text-sm">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>1. Izin Iframe &amp; Metadata</span>
            </div>
            <p className="text-xs text-emerald-700 mt-1">
              Hak akses izin kamera (<code className="bg-emerald-100 px-1 py-0.5 rounded">requestFramePermissions: [&quot;camera&quot;]</code>) telah aktif pada aplikasi.
            </p>
          </div>

          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-3">
            <div className="flex items-center gap-2 text-gray-900 font-semibold text-sm">
              <Monitor className="w-4 h-4 text-indigo-600" />
              <span>2. Periksa Izin Browser (Laptop / Desktop)</span>
            </div>
            <ul className="text-xs text-gray-600 space-y-1.5 pl-5 list-disc">
              <li>
                Klik ikon <strong>Gembok (Lock)</strong> atau <strong>Ikon Penggeser</strong> di bilah alamat (URL bar) browser Anda.
              </li>
              <li>
                Pastikan pilihan <strong>Kamera (Camera)</strong> diatur ke <strong>&quot;Allow&quot; / &quot;Izinkan&quot;</strong>.
              </li>
              <li>
                Jika menggunakan Google Chrome/Edge, buka tab baru dan periksa: <code className="bg-gray-200 px-1 py-0.5 rounded">chrome://settings/content/camera</code>.
              </li>
            </ul>
          </div>

          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-3">
            <div className="flex items-center gap-2 text-gray-900 font-semibold text-sm">
              <Smartphone className="w-4 h-4 text-indigo-600" />
              <span>3. Periksa Izin di Smartphone (Android / iOS)</span>
            </div>
            <ul className="text-xs text-gray-600 space-y-1.5 pl-5 list-disc">
              <li>
                Jika diminta popup <em>&quot;Izinkan aplikasi menggunakan kamera?&quot;</em>, pilih <strong>&quot;Saat aplikasi digunakan&quot;</strong>.
              </li>
              <li>
                Buka Pengaturan HP &rarr; Aplikasi &rarr; Browser Chrome &rarr; Izin &rarr; Kamera &rarr; Izinkan.
              </li>
            </ul>
          </div>

          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-3">
            <div className="flex items-center gap-2 text-gray-900 font-semibold text-sm">
              <VideoOff className="w-4 h-4 text-amber-600" />
              <span>4. Kamera Terkunci oleh Aplikasi Lain?</span>
            </div>
            <p className="text-xs text-gray-600">
              Kamera hanya bisa digunakan oleh satu aplikasi dalam satu waktu. Pastikan aplikasi seperti Zoom, Google Meet, Microsoft Teams, atau tab browser lain tidak sedang menyalakan kamera.
            </p>
          </div>

          <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl">
            <div className="flex items-center gap-2 text-emerald-900 font-semibold text-sm">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Solusi Instan: Mode Kamera Virtual / Scanner Demo</span>
            </div>
            <p className="text-xs text-emerald-800 mt-1">
              Jika browser memblokir kamera fisik atau perangkat tidak memiliki webcam, Anda dapat langsung mengaktifkan <strong>Kamera Virtual</strong> untuk memindai kartu QR simulasi siswa secara interaktif.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2.5 pt-4 border-t border-gray-100">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs text-gray-600 hover:text-gray-900 font-medium rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
          >
            Tutup
          </button>
          {onStartVirtual && (
            <button
              onClick={() => {
                onClose();
                onStartVirtual();
              }}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 rounded-xl transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
              Gunakan Kamera Virtual
            </button>
          )}
          <button
            onClick={() => {
              onClose();
              onRetry();
            }}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Coba Buka Kamera Fisik
          </button>
        </div>
      </div>
    </div>
  );
};
