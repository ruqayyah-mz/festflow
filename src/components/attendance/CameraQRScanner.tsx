import { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';
import { CameraOff } from 'lucide-react';

interface Props {
  // Called once per distinct code; the same code is ignored for a few seconds to avoid double check-ins.
  onDecode: (text: string) => void;
}

const REPEAT_COOLDOWN_MS = 3000;

export function CameraQRScanner({ onDecode }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const onDecodeRef = useRef(onDecode);
  onDecodeRef.current = onDecode;
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let frame = 0;
    let cancelled = false;
    const last = { text: '', at: 0 };
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    const tick = () => {
      const video = videoRef.current;
      if (cancelled || !video || !ctx) return;
      if (video.readyState === video.HAVE_ENOUGH_DATA && video.videoWidth) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0);
        const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(img.data, img.width, img.height, { inversionAttempts: 'dontInvert' });
        const now = Date.now();
        if (code?.data && (code.data !== last.text || now - last.at > REPEAT_COOLDOWN_MS)) {
          last.text = code.data;
          last.at = now;
          onDecodeRef.current(code.data);
        }
      }
      frame = requestAnimationFrame(tick);
    };

    if (!navigator.mediaDevices?.getUserMedia) {
      // Browsers only expose the camera on https:// or localhost.
      setError('Camera is unavailable here (it needs HTTPS or localhost). Use Roster or Enter QR / Token instead.');
      return;
    }

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'environment' }, audio: false })
      .then((s) => {
        if (cancelled) {
          s.getTracks().forEach((t) => t.stop());
          return;
        }
        stream = s;
        const video = videoRef.current!;
        video.srcObject = s;
        video.play().catch(() => {});
        frame = requestAnimationFrame(tick);
      })
      .catch((err: DOMException) => {
        setError(
          err.name === 'NotAllowedError'
            ? 'Camera permission was denied. Allow camera access in your browser, or use Roster / Enter QR / Token.'
            : err.name === 'NotFoundError'
            ? 'No camera found on this device. Use Roster or Enter QR / Token instead.'
            : `Could not start the camera (${err.name}).`
        );
      });

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  if (error) {
    return (
      <div className="mx-auto w-64 h-64 bg-slate-100 border-2 border-slate-300 rounded-lg flex flex-col items-center justify-center gap-2 p-4 text-center">
        <CameraOff className="w-8 h-8 text-slate-400" />
        <p className="text-xs text-slate-600" role="alert">
          {error}
        </p>
      </div>
    );
  }

  return (
    <div className="relative mx-auto w-64 h-64 bg-slate-900 border-2 border-slate-700 rounded-lg overflow-hidden">
      <video ref={videoRef} muted playsInline className="w-full h-full object-cover" aria-label="Camera preview for QR scanning" />
      <div className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 border-emerald-400" />
      <div className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 border-emerald-400" />
      <div className="absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 border-emerald-400" />
      <div className="absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 border-emerald-400" />
      <div className="absolute bottom-2 inset-x-0 text-center text-[10px] font-mono text-emerald-300">
        Point at a volunteer's check-in QR
      </div>
    </div>
  );
}
