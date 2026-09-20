import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Camera, CameraOff, SwitchCamera, X, AlertTriangle } from 'lucide-react';

export interface QrScanResult {
  text: string;
  format?: string;
}

interface QrCameraScannerProps {
  onScan: (result: QrScanResult) => void;
  onClose: () => void;
  /** Prefer rear (environment) or front (user) */
  facingMode?: 'environment' | 'user';
}

const REGION_ID = 'localpay-qr-reader';

async function pickCameraId(facing: 'environment' | 'user'): Promise<string | { facingMode: string }> {
  try {
    const cams = await Html5Qrcode.getCameras();
    if (!cams.length) return { facingMode: facing };
    const label = (s: string) => s.toLowerCase();
    const front = cams.find((c) => /front|user|facing\s*front|selfie/i.test(label(c.label)));
    const back = cams.find((c) => /back|rear|environment|facing\s*back/i.test(label(c.label)));
    if (facing === 'user') {
      return front?.id || (cams.length > 1 ? cams[1].id : cams[0].id);
    }
    return back?.id || cams[0].id;
  } catch {
    return { facingMode: facing };
  }
}

export const QrCameraScanner: React.FC<QrCameraScannerProps> = ({
  onScan,
  onClose,
  facingMode = 'environment',
}) => {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const onScanRef = useRef(onScan);
  onScanRef.current = onScan;
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(true);
  const [facing, setFacing] = useState<'environment' | 'user'>(facingMode);
  const [retryKey, setRetryKey] = useState(0);
  const handledRef = useRef(false);

  useEffect(() => {
    handledRef.current = false;
    let cancelled = false;
    const scanner = new Html5Qrcode(REGION_ID, {
      formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
      verbose: false,
    });
    scannerRef.current = scanner;

    const start = async () => {
      setStarting(true);
      setError(null);
      try {
        try {
          if (scanner.isScanning) await scanner.stop();
        } catch {
          /* ignore */
        }

        const cameraConfig = await pickCameraId(facing);
        await scanner.start(
          cameraConfig,
          {
            fps: 15,
            qrbox: (viewW, viewH) => {
              const side = Math.min(Math.floor(viewW * 0.72), Math.floor(viewH * 0.55), 280);
              return { width: side, height: side };
            },
            aspectRatio: 1.333,
            disableFlip: false,
          },
          (decodedText) => {
            if (handledRef.current || cancelled) return;
            handledRef.current = true;
            scanner
              .stop()
              .catch(() => undefined)
              .finally(() => {
                onScanRef.current({ text: decodedText });
              });
          },
          () => {
            /* no code in frame */
          }
        );

        const video = document.querySelector(`#${REGION_ID} video`) as HTMLVideoElement | null;
        if (video) {
          video.style.transform = facing === 'user' ? 'scaleX(-1)' : 'none';
          video.style.objectFit = 'cover';
          video.style.width = '100%';
          video.style.height = '100%';
        }

        if (!cancelled) setStarting(false);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        if (!cancelled) {
          setStarting(false);
          if (/NotAllowedError|Permission/i.test(msg)) {
            setError('Permiso de cámara denegado. Activá el acceso en el navegador o en Ajustes del sistema.');
          } else if (/NotFoundError|DevicesNotFound|no camera/i.test(msg)) {
            setError('No se encontró cámara. Probá con otro dispositivo o cambiá de cámara.');
          } else if (/NotReadableError|TrackStartError|in use/i.test(msg)) {
            setError('La cámara está en uso por otra app. Cerrala e intentá de nuevo.');
          } else {
            setError(msg || 'No se pudo iniciar la cámara.');
          }
        }
      }
    };

    start();

    return () => {
      cancelled = true;
      const s = scannerRef.current;
      scannerRef.current = null;
      if (s) {
        s.stop()
          .then(() => s.clear())
          .catch(() => undefined);
      }
    };
  }, [facing, retryKey]);

  const toggleFacing = async () => {
    const s = scannerRef.current;
    try {
      if (s?.isScanning) await s.stop();
    } catch {
      /* ignore */
    }
    setFacing((f) => (f === 'environment' ? 'user' : 'environment'));
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-slate-950 text-white">
      <div className="px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-2 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Camera className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-black uppercase tracking-wider text-slate-300">
            Escanear QR · {facing === 'user' ? 'Frontal' : 'Trasera'}
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer"
          aria-label="Cerrar escáner"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="relative flex-1 min-h-0 mx-3 mb-3 rounded-2xl overflow-hidden border border-slate-700 bg-black">
        <div id={REGION_ID} className="w-full h-full [&_video]:object-cover [&_video]:w-full [&_video]:h-full" />

        {starting && !error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-slate-950/80 z-10">
            <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-bold text-slate-300">
              Iniciando cámara {facing === 'user' ? 'frontal' : 'trasera'}…
            </p>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 bg-slate-950 z-10 text-center">
            <CameraOff className="w-10 h-10 text-rose-400" />
            <p className="text-sm font-bold text-rose-200 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </p>
            <button
              type="button"
              onClick={() => setRetryKey((k) => k + 1)}
              className="px-4 py-2 rounded-xl bg-emerald-600 text-slate-950 text-xs font-black cursor-pointer"
            >
              Reintentar
            </button>
          </div>
        )}

        {!error && !starting && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="w-[72%] max-w-[280px] aspect-square border-2 border-emerald-400/80 rounded-2xl shadow-[0_0_0_9999px_rgba(2,6,23,0.45)]" />
          </div>
        )}
      </div>

      <div className="px-4 pb-[max(1rem,env(safe-area-inset-bottom))] space-y-2 shrink-0">
        <p className="text-[11px] text-slate-400 text-center font-medium">
          {facing === 'user'
            ? 'Cámara frontal activa (espejada). Ideal para escanear el QR del cliente frente a vos.'
            : 'Cámara trasera. Usá “Cambiar cámara” para pasar a la frontal.'}
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => void toggleFacing()}
            className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer min-h-12"
          >
            <SwitchCamera className="w-4 h-4 text-emerald-400" />
            {facing === 'user' ? 'Usar trasera' : 'Usar frontal'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold cursor-pointer min-h-12"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};
