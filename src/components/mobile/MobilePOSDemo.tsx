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
  Zap,
  Receipt,
  Users,
  Wallet,
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
  const [posTab, setPosTab] = useState<'cobrar' | 'movimientos' | 'entidades' | 'caja'>('cobrar');
  const [numpadValue, setNumpadValue] = useState('4500');
  const [concepto] = useState('Venta Mostrador');
  const [soundEnabled] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [networkState, setNetworkState] = useState<NetworkSyncState>(dbService.getNetworkSyncState());
  const [qrTimer, setQrTimer] = useState(60);
  const [ultimoCobro, setUltimoCobro] = useState<{
    id: string;
    monto: number;
    hora: string;
    metodo: string;
  } | null>(null);
  const [simulando, setSimulando] = useState(false);
  const qrCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const cajaId = currentUser?.cajaId || 'CAJA-01';

  const playTone = (freq: number, duration = 0.08) => {
    if (!soundEnabled) return;
    try {
      const Ctx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
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
      width: 200,
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
      <div className="h-full w-full min-h-0 flex flex-col bg-slate-950 overflow-hidden">
        <QrCameraScanner onScan={onScan} onClose={() => setStage('pos')} />
      </div>
    );
  }

  if (stage === 'qr') {
    return (
      <div className="h-full w-full min-h-0 flex flex-col bg-slate-900 text-white overflow-hidden">
        <div className="pos-safe-top px-4 pb-2 flex items-center justify-between shrink-0">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Cobro QR</span>
          <button
            type="button"
            onClick={() => setStage('pos')}
            className="min-h-11 min-w-11 flex items-center justify-center rounded-xl text-slate-300 hover:bg-slate-800 cursor-pointer"
            aria-label="Cancelar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 min-h-0 flex flex-col items-center justify-center gap-4 px-4">
          <div className="bg-white text-slate-950 p-5 rounded-3xl shadow-xl">
            <canvas ref={qrCanvasRef} className="mx-auto block max-w-full" />
            <p className="text-center text-2xl font-black font-mono mt-3 tracking-tight">
              ${Number(numpadValue || 0).toLocaleString('es-AR')}
            </p>
            <p className="text-center text-[10px] text-slate-500 font-bold uppercase mt-0.5">ARS</p>
          </div>
          <p className="text-[11px] text-slate-500 text-center max-w-[16rem]">
            QR listo · el cliente escanea y paga
          </p>
          <p className="text-xs text-slate-400 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            Expira en {qrTimer}s · {cajaId}
          </p>
        </div>

        <div className="pos-safe-bottom px-4 pt-2 space-y-2 shrink-0">
          <button
            type="button"
            onClick={() => setStage('scan')}
            className="w-full min-h-12 rounded-2xl bg-slate-800 text-emerald-300 font-bold text-sm flex items-center justify-center gap-2 cursor-pointer border border-slate-600 active:scale-[0.98]"
          >
            <Camera className="w-4 h-4" /> Escanear QR del cliente
          </button>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              disabled={simulando}
              onClick={() => aprobar('Mercado Pago (QR)')}
              className="min-h-12 bg-blue-600 text-white font-bold text-xs rounded-2xl cursor-pointer active:scale-[0.98] disabled:opacity-50"
            >
              Mercado Pago
            </button>
            <button
              type="button"
              disabled={simulando}
              onClick={() => aprobar('Plex (QR)')}
              className="min-h-12 bg-violet-600 text-white font-bold text-xs rounded-2xl cursor-pointer active:scale-[0.98] disabled:opacity-50"
            >
              Plex
            </button>
            <button
              type="button"
              disabled={simulando}
              onClick={() => aprobar('Efectivo')}
              className="min-h-12 bg-emerald-600 text-white font-bold text-xs rounded-2xl cursor-pointer active:scale-[0.98] disabled:opacity-50"
            >
              Efectivo
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (stage === 'semaforo') {
    return (
      <div className="h-full w-full min-h-0 flex flex-col bg-emerald-500 text-slate-950 overflow-hidden">
        <div className="pos-safe-top text-center px-4">
          <span className="inline-block px-3 py-1.5 rounded-full bg-slate-950 text-emerald-400 text-[11px] font-black uppercase tracking-wide">
            Pago aprobado
          </span>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center gap-3 px-6 text-center">
          <div className="w-28 h-28 rounded-full bg-slate-950 text-emerald-400 flex items-center justify-center border-4 border-white/40 shadow-lg">
            <Check className="w-16 h-16 stroke-[3]" />
          </div>
          <p className="text-4xl font-black font-mono tracking-tight">
            ${(ultimoCobro?.monto || 0).toLocaleString('es-AR')}
          </p>
          <p className="text-sm font-bold text-slate-800 max-w-[90%] truncate">{ultimoCobro?.metodo}</p>
          <p className="text-[11px] text-slate-700 font-medium">
            {ultimoCobro?.id} · {ultimoCobro?.hora}
          </p>
        </div>
        <div className="pos-safe-bottom px-4 shrink-0">
          <button
            type="button"
            onClick={() => {
              setStage('pos');
              setNumpadValue('0');
            }}
            className="w-full min-h-14 bg-slate-950 text-white font-black text-base rounded-2xl cursor-pointer active:scale-[0.98]"
          >
            Nuevo cobro
          </button>
        </div>
      </div>
    );
  }

  const totalHoy = transactions
    .filter((tx) => tx.estado === 'aprobado')
    .reduce((s, tx) => s + (tx.tipo === 'egreso' ? -tx.monto : tx.monto), 0);

  return (
    <div className="h-full w-full min-h-0 flex flex-col bg-slate-100 text-slate-900 overflow-hidden">
      <header className="pos-safe-top px-4 pb-2.5 bg-slate-900 text-white flex items-center justify-between text-xs shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-bold tabular-nums">
            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          <span className="text-[10px] px-1.5 py-0.5 bg-slate-800 text-emerald-400 rounded font-mono shrink-0">
            {cajaId}
          </span>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {networkState.isOnline ? (
            <span className="flex items-center gap-1 text-emerald-400 text-[10px] font-bold">
              <Wifi className="w-3.5 h-3.5" /> Online
            </span>
          ) : (
            <span className="flex items-center gap-1 text-amber-300 text-[10px] font-bold">
              <WifiOff className="w-3.5 h-3.5" /> Offline
            </span>
          )}
          <button
            type="button"
            onClick={onLogout}
            className="text-slate-400 text-[10px] font-bold underline cursor-pointer min-h-8 px-1"
          >
            Salir
          </button>
        </div>
      </header>

      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
        {posTab === 'cobrar' && (
          <div className="px-4 pt-3 pb-2 space-y-3 max-w-md mx-auto w-full">
            <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm text-center sm:text-left">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Importe a cobrar</p>
              <p className="text-[2.5rem] leading-none font-black font-mono text-slate-950 tracking-tight mt-1 break-all">
                ${Number(numpadValue || 0).toLocaleString('es-AR')}
              </p>
              <p className="text-xs text-slate-500 mt-2">
                {concepto} · {currentUser?.name || 'Cajero'}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[1000, 2000, 5000].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => quickAdd(n)}
                  className="min-h-11 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 cursor-pointer active:bg-slate-50 active:scale-[0.98]"
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
                  className={`min-h-14 rounded-2xl font-black text-xl cursor-pointer active:scale-[0.96] transition select-none ${
                    k === 'DEL' || k === 'CLR'
                      ? 'bg-slate-200 text-slate-700 text-base'
                      : 'bg-white border border-slate-200 text-slate-900 shadow-sm'
                  }`}
                >
                  {k === 'DEL' ? '⌫' : k === 'CLR' ? 'C' : k}
                </button>
              ))}
            </div>

            <div className="pt-1 space-y-2">
              <button
                type="button"
                onClick={() => {
                  if ((parseInt(numpadValue, 10) || 0) > 0) {
                    setStage('qr');
                    playTone(740, 0.08);
                  }
                }}
                className="w-full min-h-14 bg-emerald-500 text-slate-950 font-black text-sm rounded-2xl flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/25 active:scale-[0.98]"
              >
                <QrCode className="w-5 h-5 shrink-0" />
                <span>Generar QR</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setStage('scan');
                  playTone(740, 0.08);
                }}
                className="w-full py-2 text-center text-xs font-semibold text-slate-500 hover:text-emerald-700 underline underline-offset-2 cursor-pointer bg-transparent border-0"
              >
                Escanear QR
              </button>
            </div>
          </div>
        )}

        {posTab === 'movimientos' && (
          <div className="px-4 pt-3 pb-2 space-y-2 max-w-md mx-auto w-full">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Movimientos del turno</p>
            {transactions.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center text-sm text-slate-500">
                Todavía no hay cobros en este turno.
              </div>
            ) : (
              transactions.slice(0, 20).map((tx) => (
                <div
                  key={tx.id}
                  className="flex justify-between items-center gap-2 text-xs bg-white rounded-xl border border-slate-200 px-3 py-3"
                >
                  <div className="min-w-0">
                    <p className="font-bold text-slate-800 truncate">{tx.concepto}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {tx.hora} · {tx.metodo}
                    </p>
                  </div>
                  <span
                    className={`font-mono font-bold shrink-0 ${
                      tx.tipo === 'egreso' ? 'text-rose-600' : 'text-emerald-600'
                    }`}
                  >
                    {tx.tipo === 'egreso' ? '-' : '+'}${tx.monto.toLocaleString('es-AR')}
                  </span>
                </div>
              ))
            )}
          </div>
        )}

        {posTab === 'entidades' && (
          <div className="px-4 pt-3 pb-2 space-y-3 max-w-md mx-auto w-full">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Clientes frecuentes</p>
            <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 overflow-hidden">
              {[
                { nombre: 'Consumidor final', doc: '—', nota: 'Mostrador' },
                { nombre: 'Autoservicio Norte', doc: '30-71234567-8', nota: 'Cuenta corriente' },
                { nombre: 'Panadería El Sol', doc: '20-30111222-3', nota: 'Mayorista' },
              ].map((c) => (
                <div key={c.nombre} className="px-4 py-3 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                    <Users className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900 truncate">{c.nombre}</p>
                    <p className="text-[10px] text-slate-500">
                      {c.doc} · {c.nota}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-slate-400 text-center">Demo · datos mock</p>
          </div>
        )}

        {posTab === 'caja' && (
          <div className="px-4 pt-3 pb-2 space-y-3 max-w-md mx-auto w-full">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Estado de caja</p>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-white rounded-2xl border border-slate-200 p-3">
                <span className="text-[10px] uppercase font-bold text-slate-400">Cobros</span>
                <p className="text-lg font-black text-slate-900">{transactions.length}</p>
              </div>
              <div className="bg-white rounded-2xl border border-slate-200 p-3">
                <span className="text-[10px] uppercase font-bold text-slate-400">Balance</span>
                <p className="text-lg font-black text-emerald-600">
                  ${totalHoy.toLocaleString('es-AR')}
                </p>
              </div>
            </div>
            <div className="bg-slate-900 text-white rounded-2xl p-4">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Caja abierta</p>
              <p className="text-sm font-bold mt-1">{cajaId}</p>
              <p className="text-xs text-slate-400 mt-1">{currentUser?.name || 'Cajero'} · turno demo</p>
            </div>
            <button
              type="button"
              onClick={() => {
                playTone(500, 0.05);
                setPosTab('cobrar');
              }}
              className="w-full min-h-12 rounded-2xl bg-emerald-500 text-slate-950 font-black text-sm cursor-pointer active:scale-[0.98]"
            >
              Volver a cobrar
            </button>
          </div>
        )}
      </div>

      <nav className="bg-white border-t border-slate-200/80 shrink-0 pos-safe-bottom">
        <div className="flex items-stretch justify-around max-w-md mx-auto w-full px-1 pt-1.5 pb-1 text-[10px] font-bold">
          <button
            type="button"
            onClick={() => {
              setPosTab('cobrar');
              playTone(500, 0.03);
            }}
            className={`flex flex-1 flex-col items-center justify-center gap-0.5 min-h-12 rounded-xl transition cursor-pointer ${
              posTab === 'cobrar' ? 'text-emerald-600' : 'text-slate-400'
            }`}
          >
            <Zap className={`w-5 h-5 ${posTab === 'cobrar' ? 'stroke-[2.5]' : ''}`} />
            <span className={posTab === 'cobrar' ? 'font-black' : ''}>Cobrar</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setPosTab('movimientos');
              playTone(500, 0.03);
            }}
            className={`flex flex-1 flex-col items-center justify-center gap-0.5 min-h-12 rounded-xl transition cursor-pointer ${
              posTab === 'movimientos' ? 'text-blue-600' : 'text-slate-400'
            }`}
          >
            <Receipt className={`w-5 h-5 ${posTab === 'movimientos' ? 'stroke-[2.5]' : ''}`} />
            <span className={posTab === 'movimientos' ? 'font-black' : ''}>Movimientos</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setPosTab('entidades');
              playTone(500, 0.03);
            }}
            className={`flex flex-1 flex-col items-center justify-center gap-0.5 min-h-12 rounded-xl transition cursor-pointer ${
              posTab === 'entidades' ? 'text-indigo-600' : 'text-slate-400'
            }`}
          >
            <Users className={`w-5 h-5 ${posTab === 'entidades' ? 'stroke-[2.5]' : ''}`} />
            <span className={posTab === 'entidades' ? 'font-black' : ''}>Clientes</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setPosTab('caja');
              playTone(500, 0.03);
            }}
            className={`flex flex-1 flex-col items-center justify-center gap-0.5 min-h-12 rounded-xl transition cursor-pointer ${
              posTab === 'caja' ? 'text-purple-600' : 'text-slate-400'
            }`}
          >
            <Wallet className={`w-5 h-5 ${posTab === 'caja' ? 'stroke-[2.5]' : ''}`} />
            <span className={posTab === 'caja' ? 'font-black' : ''}>Caja</span>
          </button>
        </div>
      </nav>
    </div>
  );
};
