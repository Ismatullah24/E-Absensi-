import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { X, Printer, QrCode, Sparkles, User, Check } from 'lucide-react';
import { Student } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  currentClass: string;
  onSimulateScan: (student: Student) => void;
}

export const StudentCardsModal: React.FC<Props> = ({
  isOpen,
  onClose,
  students,
  currentClass,
  onSimulateScan,
}) => {
  const [qrImages, setQrImages] = useState<Record<string, string>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const classStudents = students.filter((s) => s.kelas === currentClass);

  useEffect(() => {
    if (!isOpen) return;

    classStudents.forEach(async (student) => {
      try {
        const url = await QRCode.toDataURL(student.qrPayload, {
          width: 200,
          margin: 1,
          color: {
            dark: '#1e1b4b',
            light: '#ffffff',
          },
        });
        setQrImages((prev) => ({ ...prev, [student.id]: url }));
      } catch (err) {
        console.warn('Failed to generate QR for student:', student.nama, err);
      }
    });
  }, [isOpen, currentClass, classStudents]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 rounded-xl text-indigo-600">
              <QrCode className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                Kartu QR Siswa Kelas {currentClass}
              </h3>
              <p className="text-xs text-gray-500">
                Dapat dipindai langsung dengan kamera laptop/HP, dicetak, atau diuji dengan tombol simulasi.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <Printer className="w-4 h-4" />
              Cetak Kartu
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Tutup modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Instructions banner */}
        <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center justify-between">
          <span>
            💡 <strong>Tips Menguji Kamera:</strong> Tampilkan QR ini di layar ponsel lain atau klik tombol <strong>&quot;Uji Pindai&quot;</strong> di bawah masing-masing kartu untuk verifikasi instan.
          </span>
        </div>

        {/* Student Cards Grid */}
        <div className="overflow-y-auto p-2 my-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {classStudents.map((student) => {
            const qrUrl = qrImages[student.id];

            return (
              <div
                key={student.id}
                className="bg-white border-2 border-indigo-100 rounded-2xl p-4 shadow-xs hover:shadow-md transition-shadow flex flex-col items-center text-center relative group"
              >
                {/* School Header Badge */}
                <div className="w-full text-left pb-2 mb-2 border-b border-gray-100 flex items-center justify-between">
                  <span className="text-[10px] font-bold tracking-wider uppercase text-indigo-700">
                    KARTU PRESENSI
                  </span>
                  <span className="text-[10px] font-semibold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                    {student.kelas}
                  </span>
                </div>

                {/* QR Code image */}
                <div className="bg-white p-2 rounded-xl border border-gray-200 shadow-inner mb-3">
                  {qrUrl ? (
                    <img
                      src={qrUrl}
                      alt={`QR Code ${student.nama}`}
                      className="w-36 h-36 object-contain"
                    />
                  ) : (
                    <div className="w-36 h-36 flex items-center justify-center text-gray-400 text-xs">
                      Memuat QR...
                    </div>
                  )}
                </div>

                {/* Student Info */}
                <h4 className="text-sm font-bold text-gray-900 leading-tight">
                  {student.nama}
                </h4>
                <div className="text-xs text-gray-500 mt-0.5">NIS: {student.nis}</div>
                <div className="text-[11px] text-gray-400 font-mono mt-0.5">
                  NISN: {student.nisn}
                </div>

                {/* Instant Simulation Action */}
                <div className="w-full mt-3 pt-3 border-t border-gray-100">
                  <button
                    onClick={() => {
                      onSimulateScan(student);
                      setCopiedId(student.id);
                      setTimeout(() => setCopiedId(null), 1500);
                    }}
                    className={`w-full py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                      copiedId === student.id
                        ? 'bg-emerald-600 text-white'
                        : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700'
                    }`}
                  >
                    {copiedId === student.id ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        Tercatat!
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                        Uji Pindai (Simulasi)
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
          {classStudents.length === 0 && (
            <div className="col-span-full py-12 text-center text-slate-500 space-y-2">
              <QrCode className="w-12 h-12 text-slate-300 mx-auto" />
              <div className="text-sm font-bold text-slate-800">Belum Ada Data Siswa</div>
              <div className="text-xs text-slate-400 max-w-sm mx-auto">
                Tambahkan siswa baru melalui menu Data Siswa atau tarik data langsung dari Google Drive.
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500 shrink-0">
          <span>Total {classStudents.length} siswa di kelas {currentClass}</span>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-xl font-medium"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
