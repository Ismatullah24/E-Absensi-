import React, { useEffect, useRef, useState, useCallback } from 'react';
import jsQR from 'jsqr';
import QRCode from 'qrcode';
import {
  Camera,
  CameraOff,
  FlipHorizontal,
  Zap,
  ZapOff,
  AlertCircle,
  HelpCircle,
  Upload,
  CheckCircle,
  Sparkles,
  Maximize2,
  Barcode,
  Volume2,
  VolumeX,
  FileSpreadsheet,
  CornerDownLeft,
  RefreshCw,
  Play,
  RotateCw
} from 'lucide-react';
import { soundManager } from '../utils/sound';
import { CameraTroubleshooterModal } from './CameraTroubleshooterModal';
import { AttendanceSession, Student } from '../types';
import { INITIAL_STUDENTS } from '../utils/students';

interface Props {
  onScanSuccess: (payload: string, fotoBukti?: string) => void;
  activeClass?: string;
  activeSession?: AttendanceSession;
  autoStart?: boolean;
}

export const CameraScanner: React.FC<Props> = ({
  onScanSuccess,
  activeClass,
  activeSession = 'Masuk',
  autoStart = true,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const virtualCanvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const virtualAnimRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [isVirtualCamera, setIsVirtualCamera] = useState<boolean>(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [hasTorch, setHasTorch] = useState<boolean>(false);
  const [isTorchOn, setIsTorchOn] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraErrorType, setCameraErrorType] = useState<string | null>(null);
  const [isTroubleshootOpen, setIsTroubleshootOpen] = useState<boolean>(false);
  const [availableDevices, setAvailableDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [lastScannedPayload, setLastScannedPayload] = useState<string | null>(null);
  const [lastScanTime, setLastScanTime] = useState<number>(0);
  const [scanStatusMessage, setScanStatusMessage] = useState<string | null>(null);
  const [isCapturingSelfie, setIsCapturingSelfie] = useState<boolean>(false);
  const [barcodeInput, setBarcodeInput] = useState<string>('');
  const [voiceEnabled, setVoiceEnabled] = useState<boolean>(true);

  // Virtual Camera student state
  const classStudents = React.useMemo(() => {
    const list = INITIAL_STUDENTS.filter((s) => !activeClass || activeClass === 'SEMUA' || s.kelas === activeClass);
    return list.length > 0 ? list : INITIAL_STUDENTS;
  }, [activeClass]);
  const [virtualStudentIdx, setVirtualStudentIdx] = useState<number>(0);
  const currentVirtualStudent: Student = classStudents[virtualStudentIdx % classStudents.length];
  const [virtualQrDataUrl, setVirtualQrDataUrl] = useState<string>('');

  // Generate QR data URL for current virtual student
  useEffect(() => {
    if (!currentVirtualStudent) return;
    QRCode.toDataURL(currentVirtualStudent.qrPayload, {
      width: 160,
      margin: 1,
      color: { dark: '#064e3b', light: '#ffffff' },
    })
      .then((url) => setVirtualQrDataUrl(url))
      .catch((e) => console.warn('Could not generate virtual QR:', e));
  }, [currentVirtualStudent]);

  // Stop camera tracks cleanly
  const stopCamera = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          // ignore
        }
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
    setIsTorchOn(false);
    setHasTorch(false);
  }, []);

  // Stop virtual camera
  const stopVirtualCamera = useCallback(() => {
    if (virtualAnimRef.current) {
      cancelAnimationFrame(virtualAnimRef.current);
      virtualAnimRef.current = null;
    }
    setIsVirtualCamera(false);
  }, []);

  // Check available camera devices
  const updateDeviceList = useCallback(async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = devices.filter((d) => d.kind === 'videoinput');
        setAvailableDevices(videoInputs);
        if (videoInputs.length > 0 && !selectedDeviceId) {
          const backCam = videoInputs.find((d) =>
            d.label.toLowerCase().includes('back') || d.label.toLowerCase().includes('belakang')
          );
          setSelectedDeviceId(backCam ? backCam.deviceId : videoInputs[0].deviceId);
        }
      }
    } catch (err) {
      console.warn('Could not enumerate devices:', err);
    }
  }, [selectedDeviceId]);

  // Start camera with fallback cascade
  const startCamera = useCallback(async () => {
    stopCamera();
    stopVirtualCamera();
    setCameraError(null);
    setCameraErrorType(null);
    setScanStatusMessage('Menghubungkan ke sensor kamera...');

    if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      const err = 'Browser Anda tidak mendukung Web Media API kamera.';
      setCameraError(err);
      setCameraErrorType('NotSupported');
      setScanStatusMessage(null);
      return;
    }

    try {
      let stream: MediaStream | null = null;

      try {
        const constraints: MediaStreamConstraints = {
          audio: false,
          video: selectedDeviceId
            ? {
                deviceId: { exact: selectedDeviceId },
                width: { ideal: 1280 },
                height: { ideal: 720 },
              }
            : {
                facingMode: facingMode,
                width: { ideal: 1280 },
                height: { ideal: 720 },
              },
        };
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (err1) {
        console.warn('Attempt 1 with full constraints failed, trying fallback...', err1);
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            audio: false,
            video: { facingMode: facingMode },
          });
        } catch (err2) {
          console.warn('Attempt 2 failed, falling back to basic video: true...', err2);
          stream = await navigator.mediaDevices.getUserMedia({
            audio: false,
            video: true,
          });
        }
      }

      if (!stream) {
        throw new Error('Tidak dapat memperoleh stream video.');
      }

      streamRef.current = stream;

      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        const capabilities = videoTrack.getCapabilities ? videoTrack.getCapabilities() : null;
        if (capabilities && (capabilities as unknown as { torch?: boolean }).torch) {
          setHasTorch(true);
        }
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.muted = true;
        await videoRef.current.play();
        setIsCameraActive(true);
        setScanStatusMessage('Kamera aktif! Arahkan ke Kartu QR Siswa');
        updateDeviceList();
      }
    } catch (err: unknown) {
      // Use console.warn instead of console.error for expected browser permission or device limits
      console.warn('Camera access unavailable or permission denied:', err);
      let message = 'Gagal membuka kamera.';
      const errorObj = err as { name?: string; message?: string };
      const name = errorObj?.name || '';

      if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
        message = 'Izin kamera belum diberikan atau diblokir oleh browser. Klik tombol di bawah atau izinkan pada ikon gembok bilah alamat.';
        setCameraErrorType('PermissionDenied');
      } else if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
        message = 'Perangkat kamera tidak ditemukan di komputer/ponsel ini.';
        setCameraErrorType('NotFound');
      } else if (name === 'NotReadableError' || name === 'TrackStartError') {
        message = 'Kamera sedang digunakan aplikasi lain (Zoom, Meet, dsb). Tutup aplikasi tersebut dan coba lagi.';
        setCameraErrorType('InUse');
      } else if (name === 'OverconstrainedError') {
        message = 'Konfigurasi kamera tidak cocok dengan perangkat Anda.';
        setCameraErrorType('Overconstrained');
      } else {
        message = `Kamera tidak dapat diakses (${errorObj?.message || 'Perangkat tidak tersedia'}).`;
        setCameraErrorType('Unknown');
      }

      setCameraError(message);
      setScanStatusMessage(null);
    }
  }, [stopCamera, stopVirtualCamera, selectedDeviceId, facingMode, updateDeviceList]);

  // Activate Virtual Camera Mode
  const startVirtualCamera = useCallback(() => {
    stopCamera();
    setCameraError(null);
    setCameraErrorType(null);
    setIsVirtualCamera(true);
    setScanStatusMessage('Kamera Virtual aktif • Mode Simulasi Siap');
  }, [stopCamera]);

  // Toggle torch / flashlight
  const toggleTorch = async () => {
    if (!streamRef.current || !hasTorch) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (track) {
      try {
        const nextState = !isTorchOn;
        await (track as unknown as { applyConstraints: (c: unknown) => Promise<void> }).applyConstraints({
          advanced: [{ torch: nextState }],
        });
        setIsTorchOn(nextState);
      } catch (err) {
        console.warn('Torch failed:', err);
      }
    }
  };

  // Flip camera between front and back
  const handleFlipCamera = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
    setSelectedDeviceId('');
  };

  // Continuous frame scanner loop for live camera
  const tick = useCallback(() => {
    if (!videoRef.current || videoRef.current.readyState < 2) {
      animationFrameRef.current = requestAnimationFrame(tick);
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!canvas) {
      animationFrameRef.current = requestAnimationFrame(tick);
      return;
    }

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) {
      animationFrameRef.current = requestAnimationFrame(tick);
      return;
    }

    if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    try {
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert',
      });

      if (code && code.data) {
        const now = Date.now();
        if (code.data !== lastScannedPayload || now - lastScanTime > 2500) {
          setLastScannedPayload(code.data);
          setLastScanTime(now);
          soundManager.playSuccessBeep();

          setScanStatusMessage(`QR Terdeteksi: ${code.data.slice(0, 30)}...`);
          onScanSuccess(code.data);
        }
      }
    } catch (e) {
      console.warn('QR decode tick error:', e);
    }

    animationFrameRef.current = requestAnimationFrame(tick);
  }, [lastScannedPayload, lastScanTime, onScanSuccess]);

  // Start tick loop when real camera is active
  useEffect(() => {
    if (isCameraActive) {
      animationFrameRef.current = requestAnimationFrame(tick);
    }
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isCameraActive, tick]);

  // Virtual Camera Canvas Animation loop
  useEffect(() => {
    if (!isVirtualCamera) return;

    let scanY = 120;
    let scanDirection = 1.2;

    const renderVirtual = () => {
      const cvs = virtualCanvasRef.current;
      if (!cvs) {
        virtualAnimRef.current = requestAnimationFrame(renderVirtual);
        return;
      }
      const ctx = cvs.getContext('2d');
      if (!ctx) {
        virtualAnimRef.current = requestAnimationFrame(renderVirtual);
        return;
      }

      const w = cvs.width || 640;
      const h = cvs.height || 360;

      // Dark futuristic slate backdrop with vignette
      const bgGrad = ctx.createRadialGradient(w / 2, h / 2, 40, w / 2, h / 2, w / 1.5);
      bgGrad.addColorStop(0, '#091524');
      bgGrad.addColorStop(1, '#020617');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);

      // Tech grid lines
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.08)';
      ctx.lineWidth = 1;
      for (let x = 0; x < w; x += 32) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += 32) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // Draw Virtual Student ID Card in center
      const cardW = 320;
      const cardH = 190;
      const cardX = (w - cardW) / 2;
      const cardY = (h - cardH) / 2 - 10;

      // Card Shadow
      ctx.shadowColor = 'rgba(16, 185, 129, 0.35)';
      ctx.shadowBlur = 24;

      // Card Base
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.roundRect(cardX, cardY, cardW, cardH, 16);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Card Header Banner
      ctx.fillStyle = '#065f46';
      ctx.beginPath();
      ctx.roundRect(cardX, cardY, cardW, 40, [16, 16, 0, 0]);
      ctx.fill();

      // Card Header Text
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText('KARTU PRESENSI DIGITAL • SMP NEGERI 1', cardX + 14, cardY + 24);

      // Student info on the left
      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 13px sans-serif';
      const studentName = currentVirtualStudent?.nama || 'Siswa Sekolah';
      ctx.fillText(studentName.length > 20 ? studentName.slice(0, 19) + '...' : studentName, cardX + 14, cardY + 70);

      ctx.fillStyle = '#64748b';
      ctx.font = '11px monospace';
      ctx.fillText(`NIS: ${currentVirtualStudent?.nis || '240001'}`, cardX + 14, cardY + 92);
      ctx.fillText(`Kelas: ${currentVirtualStudent?.kelas || activeClass || 'VII A'}`, cardX + 14, cardY + 110);
      ctx.fillText(`Sesi: ${activeSession}`, cardX + 14, cardY + 128);

      // Status pill on card
      ctx.fillStyle = '#dcfce7';
      ctx.beginPath();
      ctx.roundRect(cardX + 14, cardY + 146, 120, 24, 6);
      ctx.fill();
      ctx.fillStyle = '#166534';
      ctx.font = 'bold 10px sans-serif';
      ctx.fillText('• STATUS AKTIF', cardX + 24, cardY + 162);

      // Render actual QR image inside card
      if (virtualQrDataUrl) {
        const qrImg = new Image();
        qrImg.src = virtualQrDataUrl;
        const qrSize = 110;
        const qrX = cardX + cardW - qrSize - 16;
        const qrY = cardY + 54;
        ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

        // QR frame border
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(qrX, qrY, qrSize, qrSize);
      }

      // Viewfinder Reticle Box
      const boxSize = 220;
      const boxX = (w - boxSize) / 2;
      const boxY = (h - boxSize) / 2 - 10;

      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 2;
      ctx.strokeRect(boxX, boxY, boxSize, boxSize);

      // Corner Brackets
      const bLen = 16;
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#34d399';
      // TL
      ctx.beginPath();
      ctx.moveTo(boxX - 2, boxY + bLen);
      ctx.lineTo(boxX - 2, boxY - 2);
      ctx.lineTo(boxX + bLen, boxY - 2);
      ctx.stroke();
      // TR
      ctx.beginPath();
      ctx.moveTo(boxX + boxSize - bLen, boxY - 2);
      ctx.lineTo(boxX + boxSize + 2, boxY - 2);
      ctx.lineTo(boxX + boxSize + 2, boxY + bLen);
      ctx.stroke();
      // BL
      ctx.beginPath();
      ctx.moveTo(boxX - 2, boxY + boxSize - bLen);
      ctx.lineTo(boxX - 2, boxY + boxSize + 2);
      ctx.lineTo(boxX + bLen, boxY + boxSize + 2);
      ctx.stroke();
      // BR
      ctx.beginPath();
      ctx.moveTo(boxX + boxSize - bLen, boxY + boxSize + 2);
      ctx.lineTo(boxX + boxSize + 2, boxY + boxSize + 2);
      ctx.lineTo(boxX + boxSize + 2, boxY + boxSize + 2);
      ctx.stroke();

      // Animated Laser Scan Line
      scanY += scanDirection;
      if (scanY > boxY + boxSize - 10) scanDirection = -1.2;
      if (scanY < boxY + 10) scanDirection = 1.2;

      ctx.save();
      ctx.strokeStyle = '#34d399';
      ctx.shadowColor = '#10b981';
      ctx.shadowBlur = 12;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(boxX + 10, scanY);
      ctx.lineTo(boxX + boxSize - 10, scanY);
      ctx.stroke();
      ctx.restore();

      // Top badge
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.beginPath();
      ctx.roundRect(14, 14, 170, 24, 12);
      ctx.fill();
      ctx.fillStyle = '#34d399';
      ctx.font = 'bold 10px sans-serif';
      ctx.fillText('● KAMERA VIRTUAL / DEMO', 26, 30);

      virtualAnimRef.current = requestAnimationFrame(renderVirtual);
    };

    virtualAnimRef.current = requestAnimationFrame(renderVirtual);

    return () => {
      if (virtualAnimRef.current) {
        cancelAnimationFrame(virtualAnimRef.current);
      }
    };
  }, [isVirtualCamera, currentVirtualStudent, virtualQrDataUrl, activeClass, activeSession]);

  // Auto-start handling: safely check permissions first
  useEffect(() => {
    let isCancelled = false;

    const checkAndStart = async () => {
      if (!autoStart) return;

      // Check permission if browser supports query
      if (typeof navigator !== 'undefined' && navigator.permissions && navigator.permissions.query) {
        try {
          const perm = await navigator.permissions.query({ name: 'camera' as PermissionName });
          if (perm.state === 'denied') {
            if (!isCancelled) {
              setCameraError(
                'Izin kamera belum diberikan atau diblokir oleh browser. Klik tombol di bawah atau izinkan pada ikon gembok URL bar, atau gunakan Kamera Virtual.'
              );
              setCameraErrorType('PermissionDenied');
              setIsCameraActive(false);
            }
            return;
          }
        } catch {
          // Permissions API query for camera not supported in all browsers, proceed safely
        }
      }

      if (!isCancelled) {
        startCamera();
      }
    };

    checkAndStart();

    return () => {
      isCancelled = true;
      stopCamera();
      stopVirtualCamera();
    };
  }, [facingMode, selectedDeviceId, autoStart, startCamera, stopCamera, stopVirtualCamera]);

  // Trigger scan of current virtual card
  const handleVirtualScanTrigger = () => {
    if (!currentVirtualStudent) return;
    soundManager.playSuccessBeep();
    setLastScannedPayload(currentVirtualStudent.qrPayload);
    setLastScanTime(Date.now());
    setScanStatusMessage(`Berhasil scan simulasi: ${currentVirtualStudent.nama}`);

    // Generate selfie snapshot from virtual canvas
    let fotoBukti: string | undefined;
    if (virtualCanvasRef.current) {
      try {
        fotoBukti = virtualCanvasRef.current.toDataURL('image/jpeg', 0.85);
      } catch {
        // safe
      }
    }

    onScanSuccess(currentVirtualStudent.qrPayload, fotoBukti);
  };

  // Next student in virtual simulation
  const handleNextVirtualStudent = () => {
    setVirtualStudentIdx((prev) => prev + 1);
  };

  // Capture snapshot for attendance proof
  const handleCaptureSnapshot = () => {
    if (isVirtualCamera && virtualCanvasRef.current) {
      try {
        soundManager.playSuccessBeep();
        const dataUrl = virtualCanvasRef.current.toDataURL('image/jpeg', 0.85);
        onScanSuccess(currentVirtualStudent?.qrPayload || `SNAPSHOT:${Date.now()}`, dataUrl);
      } catch {
        // safe
      }
      return;
    }

    if (!videoRef.current || !isCameraActive) return;
    setIsCapturingSelfie(true);

    try {
      const snapCanvas = document.createElement('canvas');
      snapCanvas.width = videoRef.current.videoWidth || 640;
      snapCanvas.height = videoRef.current.videoHeight || 480;
      const ctx = snapCanvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);

        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(0, snapCanvas.height - 40, snapCanvas.width, 40);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 14px sans-serif';
        const nowStr = new Date().toLocaleString('id-ID');
        ctx.fillText(`Presensi ${activeClass || 'Sekolah'} • ${nowStr}`, 14, snapCanvas.height - 16);

        const dataUrl = snapCanvas.toDataURL('image/jpeg', 0.85);
        soundManager.playSuccessBeep();
        onScanSuccess(`SNAPSHOT:${Date.now()}`, dataUrl);
      }
    } finally {
      setIsCapturingSelfie(false);
    }
  };

  // Handle uploading QR photo from file
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = img.width;
        tempCanvas.height = img.height;
        const tempCtx = tempCanvas.getContext('2d');
        if (tempCtx) {
          tempCtx.drawImage(img, 0, 0);
          const imgData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
          const decoded = jsQR(imgData.data, imgData.width, imgData.height);
          if (decoded && decoded.data) {
            soundManager.playSuccessBeep();
            setScanStatusMessage(`Berhasil scan dari file: ${decoded.data}`);
            onScanSuccess(decoded.data, event.target?.result as string);
          } else {
            soundManager.playErrorBeep();
            setScanStatusMessage('Tidak ditemukan kode QR pada foto yang diunggah.');
          }
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Handle barcode / manual NIS keyboard submission
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = barcodeInput.trim();
    if (!query) return;

    soundManager.playSuccessBeep();
    onScanSuccess(query);
    setBarcodeInput('');
    barcodeInputRef.current?.focus();
  };

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Scanner Header with Session & Google Sheets Sync Status */}
      <div className="px-5 py-3.5 bg-gradient-to-r from-gray-50 to-emerald-50/40 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className={`p-2.5 rounded-2xl shadow-xs transition-colors ${
              isCameraActive
                ? 'bg-emerald-600 text-white shadow-emerald-600/20'
                : isVirtualCamera
                ? 'bg-teal-600 text-white shadow-teal-600/20'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            <Camera className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-gray-900">
                Pemindai Kamera &amp; Kartu Siswa
              </h2>
              {/* Sesi Tag */}
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                  activeSession === 'Masuk'
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-blue-100 text-blue-800 border border-blue-300'
                }`}
              >
                Sesi {activeSession}
              </span>
              {isCameraActive && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Kamera Fisik
                </span>
              )}
              {isVirtualCamera && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-teal-100 text-teal-800 border border-teal-300">
                  <Sparkles className="w-3 h-3 text-teal-600" />
                  Kamera Virtual (Demo)
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500">
              {activeClass ? `Fokus Presensi Kelas: ${activeClass}` : 'Arahkan QR ke kotak pemindai'} • Auto-Sync Google Sheet
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Voice Prompt Toggle */}
          <button
            onClick={() => setVoiceEnabled(!voiceEnabled)}
            className={`p-2 rounded-xl border text-xs flex items-center gap-1 transition-all cursor-pointer ${
              voiceEnabled
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-gray-100 text-gray-500 border-gray-200'
            }`}
            title={voiceEnabled ? 'Suara Asisten Aktif' : 'Suara Asisten Nonaktif'}
          >
            {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Troubleshooting Button */}
          <button
            onClick={() => setIsTroubleshootOpen(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-xl border border-amber-200 transition-colors cursor-pointer"
            title="Bantuan panduan izin kamera"
            aria-label="Petunjuk bantuan kamera"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Bantuan</span>
          </button>

          {/* Toggle Virtual Camera Button */}
          {!isCameraActive && (
            <button
              onClick={isVirtualCamera ? stopVirtualCamera : startVirtualCamera}
              className={`flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-xl border transition-colors cursor-pointer ${
                isVirtualCamera
                  ? 'bg-teal-50 text-teal-800 border-teal-300 hover:bg-teal-100'
                  : 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>{isVirtualCamera ? 'Tutup Virtual' : 'Kamera Virtual'}</span>
            </button>
          )}

          {/* Toggle Physical Camera On/Off */}
          {isCameraActive ? (
            <button
              onClick={stopCamera}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 rounded-xl border border-red-200 transition-colors cursor-pointer"
              aria-label="Matikan kamera"
            >
              <CameraOff className="w-3.5 h-3.5" />
              Matikan
            </button>
          ) : (
            <button
              onClick={startCamera}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-xl shadow-xs transition-colors cursor-pointer"
              aria-label="Nyalakan kamera fisik"
            >
              <Camera className="w-3.5 h-3.5" />
              Buka Kamera
            </button>
          )}
        </div>
      </div>

      {/* Main Viewfinder Section */}
      <div className="relative bg-slate-950 aspect-video max-h-[380px] w-full flex items-center justify-center overflow-hidden">
        {/* Hidden internal processing canvas for live video */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Video Element for real camera stream */}
        <video
          ref={videoRef}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            isCameraActive ? 'opacity-100' : 'opacity-0 hidden pointer-events-none'
          }`}
          playsInline
          muted
          autoPlay
        />

        {/* Virtual Camera Canvas Feed */}
        {isVirtualCamera && (
          <div className="relative w-full h-full flex items-center justify-center">
            <canvas
              ref={virtualCanvasRef}
              width={640}
              height={360}
              className="w-full h-full object-contain"
            />
            {/* Virtual HUD Controls Overlay */}
            <div className="absolute bottom-3 inset-x-3 flex items-center justify-between gap-2 z-20 pointer-events-auto">
              <div className="bg-black/80 backdrop-blur-md px-3 py-1 rounded-xl text-white text-xs border border-white/10 flex items-center gap-2">
                <span className="font-semibold text-emerald-400 truncate max-w-[150px] sm:max-w-[200px]">
                  {currentVirtualStudent.nama}
                </span>
                <span className="text-gray-400 font-mono text-[10px]">
                  ({currentVirtualStudent.kelas})
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleNextVirtualStudent}
                  className="px-3 py-1.5 bg-black/75 hover:bg-black/90 text-white text-xs font-medium rounded-xl border border-white/20 backdrop-blur-md transition-all flex items-center gap-1 cursor-pointer"
                  title="Ganti siswa simulasi berikutnya"
                >
                  <RotateCw className="w-3 h-3 text-emerald-400" />
                  <span>Ganti Siswa</span>
                </button>
                <button
                  onClick={handleVirtualScanTrigger}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                  title="Pindai kartu siswa virtual ini"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Pindai Kartu Ini</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Live HUD Overlay when Physical Camera is active */}
        {isCameraActive && (
          <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
            {/* Target Reticle Box with Animated Scanning Laser */}
            <div className="relative w-56 h-56 sm:w-64 sm:h-64 border-2 border-emerald-400/70 rounded-2xl flex items-center justify-center shadow-2xl">
              {/* Corner brackets */}
              <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-emerald-400 -translate-x-1 -translate-y-1 rounded-tl-lg"></div>
              <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-emerald-400 translate-x-1 -translate-y-1 rounded-tr-lg"></div>
              <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-emerald-400 -translate-x-1 translate-y-1 rounded-bl-lg"></div>
              <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-emerald-400 translate-x-1 translate-y-1 rounded-br-lg"></div>

              {/* Laser scanning line effect */}
              <div className="absolute left-3 right-3 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_12px_#34d399] animate-bounce"></div>

              <span className="text-[11px] font-medium text-white/90 bg-black/60 px-2.5 py-0.5 rounded-full backdrop-blur-xs border border-white/10">
                Posisikan QR di dalam bingkai
              </span>
            </div>

            {/* Status ticker */}
            {scanStatusMessage && (
              <div className="absolute bottom-3 bg-black/75 backdrop-blur-md px-3.5 py-1 rounded-full text-xs text-white flex items-center gap-2 border border-white/10 shadow-lg">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
                <span>{scanStatusMessage}</span>
              </div>
            )}
          </div>
        )}

        {/* Viewfinder Controls Overlay */}
        {isCameraActive && (
          <div className="absolute top-3 right-3 flex items-center gap-2 z-10">
            {/* Flip camera */}
            <button
              onClick={handleFlipCamera}
              className="p-2 rounded-xl bg-black/60 hover:bg-black/80 text-white backdrop-blur-md border border-white/20 transition-all shadow-md cursor-pointer"
              title="Ganti Kamera Depan / Belakang"
              aria-label="Putar kamera"
            >
              <FlipHorizontal className="w-4 h-4" />
            </button>

            {/* Torch toggle */}
            {hasTorch && (
              <button
                onClick={toggleTorch}
                className={`p-2 rounded-xl backdrop-blur-md border border-white/20 transition-all shadow-md cursor-pointer ${
                  isTorchOn ? 'bg-amber-500 text-white' : 'bg-black/60 hover:bg-black/80 text-white'
                }`}
                title="Senter / Flashlight"
                aria-label="Nyalakan senter"
              >
                {isTorchOn ? <Zap className="w-4 h-4" /> : <ZapOff className="w-4 h-4" />}
              </button>
            )}
          </div>
        )}

        {/* Device selector if multiple cameras detected */}
        {isCameraActive && availableDevices.length > 1 && (
          <div className="absolute top-3 left-3 z-10">
            <select
              value={selectedDeviceId}
              onChange={(e) => setSelectedDeviceId(e.target.value)}
              className="text-xs bg-black/70 text-white border border-white/20 rounded-xl px-2.5 py-1 backdrop-blur-md focus:outline-hidden cursor-pointer"
              aria-label="Pilih perangkat kamera"
            >
              {availableDevices.map((dev, i) => (
                <option key={dev.deviceId || i} value={dev.deviceId} className="bg-gray-800 text-white">
                  {dev.label || `Kamera ${i + 1}`}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Offline / Error / Standby Screen */}
        {!isCameraActive && !isVirtualCamera && (
          <div className="relative z-10 flex flex-col items-center justify-center p-6 text-center max-w-md">
            {cameraError ? (
              <div className="space-y-3">
                <div className="w-12 h-12 mx-auto rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-semibold text-white">
                  {cameraErrorType === 'PermissionDenied'
                    ? 'Izin Akses Kamera Dibatasi'
                    : 'Kamera Belum Dapat Diakses'}
                </h3>
                <p className="text-xs text-gray-400 leading-relaxed">{cameraError}</p>
                <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                  <button
                    onClick={startCamera}
                    className="px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Coba Buka Kamera Lagi
                  </button>
                  <button
                    onClick={startVirtualCamera}
                    className="px-3.5 py-1.5 text-xs font-semibold text-emerald-200 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/40 rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                    Gunakan Kamera Virtual
                  </button>
                  <button
                    onClick={() => setIsTroubleshootOpen(true)}
                    className="px-3 py-1.5 text-xs font-medium text-amber-300 bg-amber-950/60 hover:bg-amber-900/60 border border-amber-500/30 rounded-xl transition-all cursor-pointer flex items-center gap-1"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    Panduan Izin
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="w-12 h-12 mx-auto rounded-full bg-gray-800 text-gray-400 flex items-center justify-center">
                  <CameraOff className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-semibold text-gray-300">Kamera Siap Diaktifkan</h3>
                <p className="text-xs text-gray-400">
                  Nyalakan kamera fisik untuk memindai kartu QR siswa secara langsung atau aktifkan Kamera Virtual untuk mode demo.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                  <button
                    onClick={startCamera}
                    className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-xl shadow-md transition-all inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Camera className="w-4 h-4" />
                    Nyalakan Kamera Fisik
                  </button>
                  <button
                    onClick={startVirtualCamera}
                    className="px-3.5 py-2 text-xs font-semibold text-emerald-200 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/40 rounded-xl transition-all inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                    Kamera Virtual / Demo
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* USB Barcode Gun & Quick NIS Input Bar */}
      <div className="p-3 bg-gray-50/90 border-t border-gray-100">
        <form onSubmit={handleBarcodeSubmit} className="flex items-center gap-2">
          <div className="relative flex-1">
            <Barcode className="w-4 h-4 text-emerald-600 absolute left-3 top-2.5" />
            <input
              ref={barcodeInputRef}
              type="text"
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              placeholder="Scan dengan Barcode Gun USB atau ketik NIS siswa..."
              className="w-full text-xs pl-9 pr-3 py-2 bg-white rounded-xl border border-gray-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-mono shadow-2xs"
            />
          </div>
          <button
            type="submit"
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer shrink-0"
          >
            <span>Absen</span>
            <CornerDownLeft className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>

      {/* Alternative Input Bar & Fast Action Fallbacks */}
      <div className="p-3 bg-white border-t border-gray-100 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          {/* Snapshot Button (works in both physical and virtual modes) */}
          {(isCameraActive || isVirtualCamera) && (
            <button
              onClick={handleCaptureSnapshot}
              disabled={isCapturingSelfie}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl shadow-2xs transition-colors cursor-pointer"
              title="Ambil foto selfie bukti kehadiran siswa"
            >
              <Maximize2 className="w-3.5 h-3.5 text-emerald-600" />
              Foto Selfie Bukti
            </button>
          )}

          {/* Upload file fallback */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl shadow-2xs transition-colors cursor-pointer"
            title="Scan QR dari file foto atau galeri smartphone"
          >
            <Upload className="w-3.5 h-3.5 text-gray-500" />
            Scan Foto File
          </button>
        </div>

        <div className="text-xs text-gray-500 flex items-center gap-1.5">
          <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
          <span>Terhubung Google Spreadsheet</span>
        </div>
      </div>

      {/* Camera Troubleshooter Modal */}
      <CameraTroubleshooterModal
        isOpen={isTroubleshootOpen}
        onClose={() => setIsTroubleshootOpen(false)}
        onRetry={startCamera}
        onStartVirtual={startVirtualCamera}
        lastErrorMessage={cameraError || undefined}
      />
    </div>
  );
};
