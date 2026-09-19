import React, { useState, useEffect, useRef, useCallback } from 'react';
import QRCode from 'qrcode';
import {
  QrCode,
  Camera,
  X,
  Check,
  Wifi,
  WifiOff,
  Clock,
} from 'lucide-react';
import { dbService, Transaction, NetworkSyncState } from '../../services/dbService';
import type { AuthUser } from '../../services/authService';
import { QrCameraScanner, type QrScanResult } from './QrCameraScanner';

interface Props {
  currentUser: AuthUser | null;
  onLogout: () => void;
}

type Stage = 'pos' | 'qr' | 'scan' | 'semaforo';

export const MobilePOSDemo: React.FC<Props> = ({ currentUser, onLogout }) => {
  const [stage, setStage] = useState<Stage>('pos');
  const [numpadValue, setNumpadValue] = useState('4500');
  const [concepto] = useState('Venta Mostrador');
  const [soundEnabled] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [networkState, setNetworkState] = useState<NetworkSyncState>(dbService.getNetworkSyncState());
  const [qrTimer, setQrTimer] = useState(60);
  const [ultimoCobro, setUltimoCobro] = useState<{ id: string; monto: number; hora: string; metodo: string } | null>(null);
  const [simulando, setSimulando] = useState(false);
  const qrCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const cajaId = currentUser?.cajaId || 'CAJA-01';

  const playTone = (freq: number, duration = 0.08) => {
    if (!soundEnabled) return;
    try {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!Ctx) return;
      const ctx = new Ctx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.14, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    setTransactions(dbService.getTransactions());
    dbService.initCloudSync(cajaId);
    const unsubTx = dbService.subscribeTransactions(setTransactions);
    const unsubNet = dbService.subscribeNetworkSync(setNetworkState);
    return () => {
      unsubTx();
      unsubNet();
    };
  }, [cajaId]);

  useEffect(() => {
    if (stage !== 'qr' || !qrCanvasRef.current) return;
    const monto = parseInt(numpadValue, 10) || 0;
    const payload = `localpay://pay?amount=${monto}&caja=${cajaId}&ref=TX-${Date.now()}`;
    QRCode.toCanvas(qrCanvasRef.current, payload, {
      width: 220,
      margin: 1,
      color: { dark: '#090d16', light: '#ffffff' },
    });
    setQrTimer(60);
    const id = setInterval(() => setQrTimer((t) => (t <= 1 ? 0 : t - 1)), 1000);
    return () => clearInterval(id);
  }, [stage, numpadValue, cajaId]);

  const press = (val: string) => {
    playTone(520, 0.05);
    if (val === 'DEL') setNumpadValue((p) => (p.length > 1 ? p.slice(0, -1) : '0'));
    else if (val === 'CLR') setNumpadValue('0');
    else
      setNumpadValue((p) => {
        if (p === '0') return val;
        if (p.length >= 8) return p;
        return p + val;
      });
  };

  const quickAdd = (n: number) => {
    playTone(640, 0.05);
    setNumpadValue(String((parseInt(numpadValue, 10) || 0) + n));
  };

  const aprobar = (metodo: string) => {
    setSimulando(true);
    playTone(880, 0.08);
    setTimeout(() => {
      const monto = parseInt(numpadValue, 10) || 4500;
      const tx = dbService.addTransaction({
        tipo: 'ingreso',
        concepto: `${concepto} (${metodo})`,
        monto,
        metodo: 'QR Interoperable',
        estado: 'aprobado',
        cajero: currentUser?.name || 'Cajero',
      });
      setUltimoCobro({ id: tx.id, monto, hora: tx.hora, metodo });
      setSimulando(false);
      setStage('semaforo');
      setTransactions(dbService.getTransactions());
      playTone(1050, 0.15);
    }, 500);
  };

  const onScan = useCallback(
    (result: QrScanResult) => {
      const raw = (result.text || '').trim();
      playTone(880, 0.1);
      let monto = parseInt(numpadValue, 10) || 0;
      let metodo = 'QR Cámara (Escaneo)';
      try {
        if (raw.includes('amount=') || raw.startsWith('localpay://')) {
          const query = raw.includes('?') ? raw.slice(raw.indexOf('?') + 1) : raw;
          const a = new URLSearchParams(query).get('amount');
          if (a && !Number.isNaN(Number(a))) monto = Number(a);
          metodo = 'QR Interoperable (Escaneo)';
        } else if (/^\d+(\.\d+)?$/.test(raw)) {
          monto = Math.round(Number(raw));
        }
      } catch {
        /* numpad */
      }
      if (monto <= 0) monto = parseInt(numpadValue, 10) || 4500;
      setNumpadValue(String(monto));
      const tx = dbService.addTransaction({
        tipo: 'ingreso',
        concepto: 'Cobro QR escaneado',
        monto,
        metodo: 'QR Interoperable',
        estado: 'aprobado',
        cajero: currentUser?.name || 'Cajero',
      });
      setUltimoCobro({
        id: tx.id,
        monto,
        hora: tx.hora,
        metodo: `${metodo} · ${raw.slice(0, 24)}${raw.length > 24 ? '…' : ''}`,
      });
      setStage('semaforo');
      setTransactions(dbService.getTransactions());
      playTone(1050, 0.15);
    },
    [numpadValue, currentUser?.name]
  );

  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'CLR', '0', 'DEL'];

  if (stage === 'scan') {
    return (
      <div className="h-full min-h-0 flex flex-col bg-slate-950">
        <QrCameraScanner onScan={onScan} onClose={() => setStage('pos')} />
      </div>
    );
  }

  if (stage === 'qr') {
    return (
      <div className="h-full flex flex-col bg-slate-900 text-white p-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-400 uppercase">Cobro QR</span>
          <button type="button" onClick={() => setStage('pos')} className="text-slate-400 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center gap-3">
          <div className="bg-white text-slate-950 p-4 rounded-3xl">
            <canvas ref={qrCanvasRef} className="mx-auto block" />
            <p className="text-center text-2xl font-black font-mono mt-2">
              ${Number(numpadValue || 0).toLocaleString('es-AR')}
            </p>
          </div>
          <p className="text-xs text-slate-400 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-amber-400" /> Expira en {qrTimer}s · {cajaId}
          </p>
        </div>
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => setStage('scan')}
            className="w-full py-3 rounded-xl bg-slate-800 text-emerald-300 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer border border-slate-600"
          >
            <Camera className="w-4 h-4" /> Escanear QR del cliente
          </button>
          <div className="grid grid-cols-3 gap-1.5">
            <button type="button" disabled={simulando} onClick={() => aprobar('Mercado Pago (QR)')} className="py-2.5 bg-blue-600 text-white font-bold text-[11px] rounded-xl cursor-pointer">
              Mercado Pago
            </button>
            <button type="button" disabled={simulando} onClick={() => aprobar('Plex (QR)')} className="py-2.5 bg-violet-600 text-white font-bold text-[11px] rounded-xl cursor-pointer">
              Plex
            </button>
            <button type="button" disabled={simulando} onClick={() => aprobar('Efectivo')} className="py-2.5 bg-emerald-600 text-white font-bold text-[11px] rounded-xl cursor-pointer">
              Efectivo
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (stage === 'semaforo') {
    return (
      <div className="h-full flex flex-col bg-emerald-500 text-slate-950 p-5 justify-between">
        <div className="text-center pt-4">
          <span className="px-3 py-1 rounded-full bg-slate-950 text-emerald-400 text-xs font-black uppercase">Pago aprobado</span>
        </div>
        <div className="text-center space-y-3">
          <div className="w-24 h-24 mx-auto rounded-full bg-slate-950 text-emerald-400 flex items-center justify-center border-4 border-white/40">
            <Check className="w-14 h-14 stroke-[3]" />
          </div>
          <p className="text-3xl font-black font-mono">${(ultimoCobro?.monto || 0).toLocaleString('es-AR')}</p>
          <p className="text-xs font-bold text-slate-800">{ultimoCobro?.metodo}</p>
          <p className="text-[10px] text-slate-700">{ultimoCobro?.id} · {ultimoCobro?.hora}</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setStage('pos');
            setNumpadValue('0');
          }}
          className="w-full py-4 bg-slate-950 text-white font-black rounded-2xl cursor-pointer"
        >
          Nuevo cobro
        </button>
      </div>
    );
  }

  return (
    <div className="h-full min-h-0 flex flex-col bg-slate-100 text-slate-900">
      <div className="px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-2 bg-slate-900 text-white flex items-center justify-between text-xs shrink-0">
        <div className="flex items-center gap-2">
          <span className="font-bold">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          <span className="text-[10px] px-1.5 py-0.5 bg-slate-800 text-emerald-400 rounded font-mono">{cajaId}</span>
        </div>
        <div className="flex items-center gap-2">
          {networkState.isOnline ? (
            <span className="flex items-center gap-1 text-emerald-400 text-[10px] font-bold">
              <Wifi className="w-3 h-3" /> Online
            </span>
          ) : (
            <span className="flex items-center gap-1 text-amber-300 text-[10px] font-bold">
              <WifiOff className="w-3 h-3" /> Offline
            </span>
          )}
          <button type="button" onClick={onLogout} className="text-slate-400 text-[10px] font-bold underline cursor-pointer">
            Salir
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <p className="text-[10px] font-bold uppercase text-slate-400">Importe a cobrar</p>
          <p className="text-4xl font-black font-mono text-slate-950 tracking-tight">
            ${Number(numpadValue || 0).toLocaleString('es-AR')}
          </p>
          <p className="text-xs text-slate-500 mt-1">{concepto} · {currentUser?.name || 'Cajero'}</p>
        </div>

        <div className="flex gap-2">
          {[1000, 2000, 5000].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => quickAdd(n)}
              className="flex-1 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 cursor-pointer"
            >
              +${n.toLocaleString('es-AR')}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-2">
          {keys.map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => press(k)}
              className={`h-14 rounded-2xl font-black text-lg cursor-pointer active:scale-95 transition ${
                k === 'DEL' || k === 'CLR'
                  ? 'bg-slate-200 text-slate-700 text-sm'
                  : 'bg-white border border-slate-200 text-slate-900 shadow-xs'
              }`}
            >
              {k === 'DEL' ? '⌫' : k === 'CLR' ? 'C' : k}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            type="button"
            onClick={() => {
              if ((parseInt(numpadValue, 10) || 0) > 0) {
                setStage('qr');
                playTone(740, 0.08);
              }
            }}
            className="h-14 bg-emerald-500 text-slate-950 font-black text-xs rounded-2xl flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-500/20"
          >
            <QrCode className="w-4 h-4" /> Mostrar QR
          </button>
          <button
            type="button"
            onClick={() => {
              setStage('scan');
              playTone(740, 0.08);
            }}
            className="h-14 bg-slate-900 text-white font-black text-xs rounded-2xl border border-emerald-500/40 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Camera className="w-4 h-4 text-emerald-400" /> Escanear QR
          </button>
        </div>

        {transactions.slice(0, 3).length > 0 && (
          <div className="pt-2 space-y-1.5">
            <p className="text-[10px] font-bold uppercase text-slate-400">Últimos cobros</p>
            {transactions.slice(0, 3).map((tx) => (
              <div key={tx.id} className="flex justify-between text-xs bg-white rounded-xl border border-slate-200 px-3 py-2">
                <span className="text-slate-600 truncate mr-2">{tx.concepto}</span>
                <span className="font-mono font-bold text-emerald-600">+${tx.monto.toLocaleString('es-AR')}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
