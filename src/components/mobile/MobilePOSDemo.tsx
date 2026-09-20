import React, { useState, useEffect, useRef, useCallback } from 'react';
import QRCode from 'qrcode';
import {
  QrCode,
  Camera,
  X,
  Check,
  Wifi,
  WifiOff,
  Zap,
  Receipt,
  Users,
  Wallet,
  Plus,
  Pencil,
  MessageCircle,
  Download,
  ArrowDownCircle,
  ArrowUpCircle,
} from 'lucide-react';
import { dbService, Transaction, NetworkSyncState } from '../../services/dbService';
import type { AuthUser } from '../../services/authService';
import { QrCameraScanner, type QrScanResult } from './QrCameraScanner';
import { DigitalReceiptModal, type ReceiptData } from './DigitalReceiptModal';

interface Props {
  currentUser: AuthUser | null;
  onLogout: () => void;
}

type Stage = 'pos' | 'qr' | 'scan' | 'semaforo';
type PosTab = 'cobrar' | 'movimientos' | 'entidades' | 'caja';

interface Cliente {
  id: string;
  nombre: string;
  doc: string;
  telefono: string;
  nota: string;
}

const CLIENTES_KEY = 'lp_clientes_demo_v1';

const DEFAULT_CLIENTES: Cliente[] = [
  { id: 'c1', nombre: 'Consumidor final', doc: '—', telefono: '', nota: 'Mostrador' },
  { id: 'c2', nombre: 'Autoservicio Norte', doc: '30-71234567-8', telefono: '2615551234', nota: 'Cuenta corriente' },
  { id: 'c3', nombre: 'Panadería El Sol', doc: '20-30111222-3', telefono: '2614449876', nota: 'Mayorista' },
];

function loadClientes(): Cliente[] {
  try {
    const raw = localStorage.getItem(CLIENTES_KEY);
    if (raw) return JSON.parse(raw) as Cliente[];
  } catch {
    /* ignore */
  }
  return DEFAULT_CLIENTES;
}

function saveClientes(list: Cliente[]) {
  localStorage.setItem(CLIENTES_KEY, JSON.stringify(list));
}

export const MobilePOSDemo: React.FC<Props> = ({ currentUser, onLogout }) => {
  const [stage, setStage] = useState<Stage>('pos');
  const [posTab, setPosTab] = useState<PosTab>('cobrar');
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
    concepto?: string;
  } | null>(null);
  const [simulando, setSimulando] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [clientes, setClientes] = useState<Cliente[]>(() => loadClientes());
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);
  const [clienteForm, setClienteForm] = useState({ nombre: '', doc: '', telefono: '', nota: '' });
  const [cajaFiltro, setCajaFiltro] = useState<'todos' | 'ingreso' | 'egreso'>('todos');
  const [egresoMonto, setEgresoMonto] = useState('');
  const [egresoConcepto, setEgresoConcepto] = useState('Retiro de caja');
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
    if (stage !== 'qr') return;
    setQrTimer(60);
    const id = window.setInterval(() => {
      setQrTimer((t) => (t <= 1 ? 0 : t - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [stage]);

  useEffect(() => {
    if (stage !== 'qr' || !qrCanvasRef.current) return;
    const amount = parseInt(numpadValue, 10) || 0;
    const payload = `localpay://pay?amount=${amount}&caja=${cajaId}&concepto=${encodeURIComponent(concepto)}`;
    QRCode.toCanvas(qrCanvasRef.current, payload, {
      width: 220,
      margin: 2,
      color: { dark: '#0f172a', light: '#ffffff' },
    }).catch(() => undefined);
  }, [stage, numpadValue, cajaId, concepto]);

  const openReceipt = useCallback(
    (tx: { id: string; monto: number; hora: string; metodo: string; concepto?: string }) => {
      setReceiptData({
        id: tx.id,
        monto: tx.monto,
        hora: tx.hora,
        fecha: new Date().toISOString().substring(0, 10),
        metodo: tx.metodo,
        concepto: tx.concepto || concepto,
        cajaId,
        cajero: currentUser?.name || 'Cajero',
      });
      setShowReceipt(true);
    },
    [cajaId, concepto, currentUser?.name]
  );

  const aprobar = useCallback(
    (metodo: string) => {
      if (simulando) return;
      setSimulando(true);
      const monto = parseInt(numpadValue, 10) || 0;
      const tx = dbService.addTransaction({
        tipo: 'ingreso',
        concepto,
        monto,
        metodo,
        estado: 'aprobado',
        cajero: currentUser?.name || 'Cajero',
      });
      const cobro = { id: tx.id, monto, hora: tx.hora, metodo, concepto };
      setUltimoCobro(cobro);
      setSimulando(false);
      setStage('semaforo');
      setTransactions(dbService.getTransactions());
      playTone(1050, 0.15);
      setTimeout(() => openReceipt(cobro), 400);
    },
    [simulando, numpadValue, concepto, currentUser?.name, openReceipt]
  );

  const onScan = useCallback(
    (result: QrScanResult) => {
      const raw = result.text || '';
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
      const cobro = {
        id: tx.id,
        monto,
        hora: tx.hora,
        metodo: `${metodo}`,
        concepto: 'Cobro QR escaneado',
      };
      setUltimoCobro(cobro);
      setStage('semaforo');
      setTransactions(dbService.getTransactions());
      playTone(1050, 0.15);
      setTimeout(() => openReceipt(cobro), 400);
    },
    [numpadValue, currentUser?.name, openReceipt]
  );

  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'CLR', '0', 'DEL'];

  const ingresos = transactions
    .filter((t) => t.tipo === 'ingreso' && t.estado === 'aprobado')
    .reduce((s, t) => s + t.monto, 0);
  const egresos = transactions
    .filter((t) => t.tipo === 'egreso' && t.estado === 'aprobado')
    .reduce((s, t) => s + t.monto, 0);
  const balance = ingresos - egresos;

  const txsCaja = transactions.filter((t) => {
    if (cajaFiltro === 'todos') return true;
    return t.tipo === cajaFiltro;
  });

  const saveClienteForm = () => {
    if (!clienteForm.nombre.trim()) return;
    let next: Cliente[];
    if (editingCliente) {
      next = clientes.map((c) =>
        c.id === editingCliente.id
          ? {
              ...c,
              nombre: clienteForm.nombre.trim(),
              doc: clienteForm.doc.trim() || '—',
              telefono: clienteForm.telefono.trim(),
              nota: clienteForm.nota.trim(),
            }
          : c
      );
    } else {
      next = [
        {
          id: 'c_' + Date.now(),
          nombre: clienteForm.nombre.trim(),
          doc: clienteForm.doc.trim() || '—',
          telefono: clienteForm.telefono.trim(),
          nota: clienteForm.nota.trim() || 'Cliente',
        },
        ...clientes,
      ];
    }
    setClientes(next);
    saveClientes(next);
    setEditingCliente(null);
    setClienteForm({ nombre: '', doc: '', telefono: '', nota: '' });
    playTone(700, 0.06);
  };

  const startEditCliente = (c: Cliente) => {
    setEditingCliente(c);
    setClienteForm({
      nombre: c.nombre,
      doc: c.doc === '—' ? '' : c.doc,
      telefono: c.telefono,
      nota: c.nota,
    });
  };

  const registrarEgreso = () => {
    const monto = parseInt(egresoMonto.replace(/\D/g, ''), 10) || 0;
    if (monto <= 0) return;
    dbService.addTransaction({
      tipo: 'egreso',
      concepto: egresoConcepto.trim() || 'Egreso de caja',
      monto,
      metodo: 'Efectivo',
      estado: 'aprobado',
      cajero: currentUser?.name || 'Cajero',
    });
    setTransactions(dbService.getTransactions());
    setEgresoMonto('');
    playTone(400, 0.08);
  };

  const buildCajaCsv = () => {
    const lines = [
      'tipo;concepto;metodo;monto;hora;fecha;estado;cajero',
      ...transactions.map(
        (t) =>
          `${t.tipo};${(t.concepto || '').replace(/;/g, ',')};${t.metodo};${t.monto};${t.hora};${t.fecha || ''};${t.estado};${t.cajero || ''}`
      ),
      '',
      `TOTAL_INGRESOS;${ingresos}`,
      `TOTAL_EGRESOS;${egresos}`,
      `BALANCE;${balance}`,
    ];
    return lines.join('\n');
  };

  const exportCsvDownload = () => {
    const blob = new Blob([buildCajaCsv()], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `localpay-caja-${cajaId}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportCsvWhatsApp = () => {
    const resumen =
      `*LocalPay · Cierre / Caja ${cajaId}*\n` +
      `📅 ${new Date().toLocaleDateString('es-AR')}\n` +
      `--------------------------------\n` +
      `⬆️ Ingresos: $${ingresos.toLocaleString('es-AR')}\n` +
      `⬇️ Egresos: $${egresos.toLocaleString('es-AR')}\n` +
      `💰 Balance: $${balance.toLocaleString('es-AR')}\n` +
      `--------------------------------\n` +
      `Movimientos: ${transactions.length}\n` +
      `\n_CSV descargado desde la terminal (compartilo desde archivos)._\n` +
      `Detalle:\n` +
      transactions
        .slice(0, 15)
        .map(
          (t) =>
            `• ${t.tipo === 'egreso' ? '−' : '+'}$${t.monto.toLocaleString('es-AR')} ${t.concepto} (${t.hora})`
        )
        .join('\n');
    exportCsvDownload();
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(resumen)}`, '_blank');
  };

  if (stage === 'scan') {
    return (
      <div className="h-full w-full min-h-0 flex flex-col bg-slate-950 overflow-hidden">
        <QrCameraScanner onScan={onScan} onClose={() => setStage('pos')} facingMode="user" />
      </div>
    );
  }

  if (stage === 'qr') {
    return (
      <div className="h-full w-full min-h-0 flex flex-col bg-slate-900 text-white overflow-hidden">
        <div className="pos-safe-top px-4 pb-2 flex items-center justify-between shrink-0">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Cobro QR</span>
          <button type="button" onClick={() => setStage('pos')} className="min-h-11 min-w-11 flex items-center justify-center rounded-xl text-slate-300 hover:bg-slate-800 cursor-pointer" aria-label="Cancelar">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 min-h-0 flex flex-col items-center justify-center gap-4 px-4">
          <div className="bg-white text-slate-950 p-5 rounded-3xl shadow-xl">
            <canvas ref={qrCanvasRef} className="mx-auto block max-w-full" />
            <p className="text-center font-black text-2xl mt-3">${(parseInt(numpadValue, 10) || 0).toLocaleString('es-AR')}</p>
            <p className="text-center text-[10px] text-slate-500 font-bold uppercase tracking-wider">ARS</p>
          </div>
          <p className="text-sm text-slate-300 text-center font-medium">QR listo · el cliente escanea y paga</p>
          <p className="text-xs text-amber-300/90">Expira en {qrTimer}s · {cajaId}</p>
        </div>
        <div className="px-4 pb-[max(1rem,env(safe-area-inset-bottom))] space-y-2 shrink-0">
          <button type="button" onClick={() => setStage('scan')} className="w-full min-h-12 rounded-2xl bg-slate-800 text-emerald-300 font-bold text-sm flex items-center justify-center gap-2 cursor-pointer">
            <Camera className="w-4 h-4" /> Escanear QR del cliente
          </button>
          <div className="grid grid-cols-3 gap-2">
            <button type="button" disabled={simulando} onClick={() => aprobar('Mercado Pago')} className="min-h-12 rounded-xl bg-blue-600 font-bold text-xs cursor-pointer disabled:opacity-50">Mercado Pago</button>
            <button type="button" disabled={simulando} onClick={() => aprobar('Plex')} className="min-h-12 rounded-xl bg-violet-600 font-bold text-xs cursor-pointer disabled:opacity-50">Plex</button>
            <button type="button" disabled={simulando} onClick={() => aprobar('Efectivo')} className="min-h-12 rounded-xl bg-emerald-600 font-bold text-xs cursor-pointer disabled:opacity-50">Efectivo</button>
          </div>
        </div>
      </div>
    );
  }

  if (stage === 'semaforo' && ultimoCobro) {
    return (
      <>
        <div className="h-full w-full min-h-0 flex flex-col bg-emerald-500 text-slate-950 overflow-hidden">
          <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6">
            <span className="px-4 py-1.5 rounded-full bg-slate-950 text-emerald-400 text-[11px] font-black uppercase tracking-wider">Pago aprobado</span>
            <div className="w-20 h-20 rounded-full bg-slate-950 flex items-center justify-center border-4 border-slate-800">
              <Check className="w-10 h-10 text-emerald-400" strokeWidth={3} />
            </div>
            <p className="text-4xl font-black">${ultimoCobro.monto.toLocaleString('es-AR')}</p>
            <p className="text-sm font-bold text-slate-900/80">{ultimoCobro.metodo}</p>
            <p className="text-xs text-slate-900/60 font-mono">{ultimoCobro.id} · {ultimoCobro.hora}</p>
          </div>
          <div className="px-4 pb-[max(1rem,env(safe-area-inset-bottom))] space-y-2">
            <button type="button" onClick={() => ultimoCobro && openReceipt(ultimoCobro)} className="w-full min-h-12 rounded-2xl bg-white text-slate-950 font-bold text-sm flex items-center justify-center gap-2 cursor-pointer">
              <MessageCircle className="w-4 h-4 text-emerald-600" /> Enviar ticket por WhatsApp
            </button>
            <button type="button" onClick={() => { setStage('pos'); setNumpadValue('0'); setShowReceipt(false); }} className="w-full min-h-12 rounded-2xl bg-slate-950 text-white font-bold text-sm cursor-pointer">
              Nuevo cobro
            </button>
          </div>
        </div>
        {showReceipt && receiptData && (
          <DigitalReceiptModal isOpen={showReceipt} onClose={() => setShowReceipt(false)} receiptData={receiptData} onNewSale={() => { setShowReceipt(false); setStage('pos'); setNumpadValue('0'); }} />
        )}
      </>
    );
  }

  return (
    <div className="h-full w-full min-h-0 flex flex-col bg-slate-100 overflow-hidden">
      <header className="pos-safe-top shrink-0 bg-slate-950 text-white px-3 pb-2.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[11px] font-mono text-slate-400">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          <span className="text-[10px] font-black px-2 py-0.5 rounded-lg bg-slate-800 text-slate-200">{cajaId}</span>
        </div>
        <div className="flex items-center gap-2">
          {networkState.isOnline ? (
            <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400"><Wifi className="w-3.5 h-3.5" /> Online</span>
          ) : (
            <span className="flex items-center gap-1 text-[10px] font-bold text-amber-400"><WifiOff className="w-3.5 h-3.5" /> Offline</span>
          )}
          <button type="button" onClick={onLogout} className="text-[11px] font-bold text-slate-300 underline cursor-pointer">Salir</button>
        </div>
      </header>

      <main className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
        {posTab === 'cobrar' && (
          <div className="px-4 pt-3 pb-2 space-y-3 max-w-md mx-auto w-full">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-4 py-5 text-center">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Importe a cobrar</p>
              <p className="text-4xl font-black text-slate-950 tracking-tight mt-1">${(parseInt(numpadValue, 10) || 0).toLocaleString('es-AR')}</p>
              <p className="text-[11px] text-slate-500 mt-1">{concepto} · {currentUser?.name || 'Administrador General'}</p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[1000, 2000, 5000].map((n) => (
                <button key={n} type="button" onClick={() => { setNumpadValue(String((parseInt(numpadValue, 10) || 0) + n)); playTone(500, 0.03); }} className="min-h-11 rounded-xl bg-white border border-slate-200 text-sm font-bold text-slate-800 cursor-pointer">
                  +${n.toLocaleString('es-AR')}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-2">
              {keys.map((k) => (
                <button key={k} type="button" onClick={() => { if (k === 'CLR') setNumpadValue('0'); else if (k === 'DEL') setNumpadValue((v) => (v.length <= 1 ? '0' : v.slice(0, -1))); else setNumpadValue((v) => (v === '0' ? k : v + k)); playTone(450, 0.02); }} className={`min-h-12 rounded-xl text-lg font-bold cursor-pointer ${k === 'CLR' || k === 'DEL' ? 'bg-slate-200 text-slate-600' : 'bg-white border border-slate-200 text-slate-900'}`}>
                  {k === 'CLR' ? 'C' : k === 'DEL' ? '⌫' : k}
                </button>
              ))}
            </div>
            <button type="button" onClick={() => { if ((parseInt(numpadValue, 10) || 0) > 0) { setStage('qr'); playTone(600, 0.05); } }} className="w-full min-h-14 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-base flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/30 cursor-pointer">
              <QrCode className="w-5 h-5" /> Generar QR
            </button>
            <button type="button" onClick={() => { setStage('scan'); playTone(500, 0.03); }} className="w-full text-center text-sm font-semibold text-slate-500 underline underline-offset-2 py-2 cursor-pointer">
              Escanear QR
            </button>
          </div>
        )}

        {posTab === 'movimientos' && (
          <div className="px-4 pt-3 pb-2 space-y-2 max-w-md mx-auto w-full">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Últimos movimientos</p>
            {transactions.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center text-sm text-slate-500">Todavía no hay cobros en este turno.</div>
            ) : (
              transactions.slice(0, 30).map((tx) => (
                <button key={tx.id} type="button" onClick={() => { if (tx.tipo === 'ingreso') openReceipt({ id: tx.id, monto: tx.monto, hora: tx.hora, metodo: tx.metodo, concepto: tx.concepto }); }} className="w-full flex justify-between items-center gap-2 text-xs bg-white rounded-xl border border-slate-200 px-3 py-3 text-left cursor-pointer">
                  <div className="min-w-0">
                    <p className="font-bold text-slate-800 truncate">{tx.concepto}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{tx.hora} · {tx.metodo}{tx.tipo === 'ingreso' ? ' · Tocá para ticket WA' : ''}</p>
                  </div>
                  <span className={`font-mono font-bold shrink-0 ${tx.tipo === 'egreso' ? 'text-rose-600' : 'text-emerald-600'}`}>{tx.tipo === 'egreso' ? '-' : '+'}${tx.monto.toLocaleString('es-AR')}</span>
                </button>
              ))
            )}
          </div>
        )}

        {posTab === 'entidades' && (
          <div className="px-4 pt-3 pb-2 space-y-3 max-w-md mx-auto w-full">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Clientes</p>
              <button type="button" onClick={() => { setEditingCliente(null); setClienteForm({ nombre: '', doc: '', telefono: '', nota: '' }); }} className="text-[10px] font-bold text-indigo-600 flex items-center gap-1 cursor-pointer">
                <Plus className="w-3.5 h-3.5" /> Nuevo
              </button>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-3 space-y-2">
              <p className="text-[11px] font-black text-slate-700">{editingCliente ? 'Editar cliente' : 'Crear cliente'}</p>
              <input className="w-full min-h-11 px-3 rounded-xl border border-slate-200 text-sm" placeholder="Nombre / razón social" value={clienteForm.nombre} onChange={(e) => setClienteForm((f) => ({ ...f, nombre: e.target.value }))} />
              <input className="w-full min-h-11 px-3 rounded-xl border border-slate-200 text-sm" placeholder="CUIT / DNI" value={clienteForm.doc} onChange={(e) => setClienteForm((f) => ({ ...f, doc: e.target.value }))} />
              <input className="w-full min-h-11 px-3 rounded-xl border border-slate-200 text-sm" placeholder="WhatsApp (sin +54)" value={clienteForm.telefono} onChange={(e) => setClienteForm((f) => ({ ...f, telefono: e.target.value }))} />
              <input className="w-full min-h-11 px-3 rounded-xl border border-slate-200 text-sm" placeholder="Nota (mayorista, CC…)" value={clienteForm.nota} onChange={(e) => setClienteForm((f) => ({ ...f, nota: e.target.value }))} />
              <button type="button" onClick={saveClienteForm} className="w-full min-h-11 rounded-xl bg-indigo-600 text-white text-sm font-bold cursor-pointer">{editingCliente ? 'Guardar cambios' : 'Crear cliente'}</button>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 overflow-hidden">
              {clientes.map((c) => (
                <div key={c.id} className="px-4 py-3 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0"><Users className="w-4 h-4" /></div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-slate-900 truncate">{c.nombre}</p>
                    <p className="text-[10px] text-slate-500">{c.doc}{c.telefono ? ` · ${c.telefono}` : ''} · {c.nota}</p>
                  </div>
                  <button type="button" onClick={() => startEditCliente(c)} className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 cursor-pointer" aria-label="Editar"><Pencil className="w-4 h-4" /></button>
                </div>
              ))}
            </div>
          </div>
        )}

        {posTab === 'caja' && (
          <div className="px-4 pt-3 pb-2 space-y-3 max-w-md mx-auto w-full">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Caja del turno</p>
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-3 text-center">
                <ArrowUpCircle className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
                <p className="text-[9px] font-bold uppercase text-emerald-700">Ingresos</p>
                <p className="text-sm font-black text-emerald-800">${ingresos.toLocaleString('es-AR')}</p>
              </div>
              <div className="bg-rose-50 border border-rose-100 rounded-2xl p-3 text-center">
                <ArrowDownCircle className="w-4 h-4 text-rose-600 mx-auto mb-1" />
                <p className="text-[9px] font-bold uppercase text-rose-700">Egresos</p>
                <p className="text-sm font-black text-rose-800">${egresos.toLocaleString('es-AR')}</p>
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl p-3 text-center">
                <Wallet className="w-4 h-4 text-purple-600 mx-auto mb-1" />
                <p className="text-[9px] font-bold uppercase text-slate-500">Balance</p>
                <p className="text-sm font-black text-slate-900">${balance.toLocaleString('es-AR')}</p>
              </div>
            </div>
            <div className="flex gap-1 bg-slate-200/80 p-1 rounded-xl">
              {(['todos', 'ingreso', 'egreso'] as const).map((f) => (
                <button key={f} type="button" onClick={() => setCajaFiltro(f)} className={`flex-1 min-h-9 rounded-lg text-[10px] font-bold capitalize cursor-pointer ${cajaFiltro === f ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>
                  {f === 'todos' ? 'Todos' : f === 'ingreso' ? 'Ingresos' : 'Egresos'}
                </button>
              ))}
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-3 space-y-2">
              <p className="text-[11px] font-black text-slate-700">Registrar egreso</p>
              <input className="w-full min-h-11 px-3 rounded-xl border border-slate-200 text-sm" placeholder="Monto" inputMode="numeric" value={egresoMonto} onChange={(e) => setEgresoMonto(e.target.value)} />
              <input className="w-full min-h-11 px-3 rounded-xl border border-slate-200 text-sm" placeholder="Concepto" value={egresoConcepto} onChange={(e) => setEgresoConcepto(e.target.value)} />
              <button type="button" onClick={registrarEgreso} className="w-full min-h-11 rounded-xl bg-rose-600 text-white text-sm font-bold cursor-pointer">Cargar egreso</button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={exportCsvDownload} className="min-h-12 rounded-xl bg-white border border-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer">
                <Download className="w-4 h-4" /> Descargar CSV
              </button>
              <button type="button" onClick={exportCsvWhatsApp} className="min-h-12 rounded-xl bg-emerald-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer">
                <MessageCircle className="w-4 h-4" /> CSV + WhatsApp
              </button>
            </div>
            <div className="space-y-2">
              {txsCaja.slice(0, 25).map((tx) => (
                <div key={tx.id} className="flex justify-between items-center gap-2 text-xs bg-white rounded-xl border border-slate-200 px-3 py-2.5">
                  <div className="min-w-0">
                    <p className="font-bold text-slate-800 truncate">{tx.concepto}</p>
                    <p className="text-[10px] text-slate-400">{tx.tipo} · {tx.hora}</p>
                  </div>
                  <span className={`font-mono font-bold ${tx.tipo === 'egreso' ? 'text-rose-600' : 'text-emerald-600'}`}>{tx.tipo === 'egreso' ? '-' : '+'}${tx.monto.toLocaleString('es-AR')}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <nav className="shrink-0 border-t border-slate-200 bg-white pos-safe-bottom">
        <div className="flex items-stretch justify-around max-w-md mx-auto w-full px-1 pt-1.5 pb-1 text-[10px] font-bold">
          {([
            { id: 'cobrar' as const, label: 'Cobrar', icon: Zap, color: 'text-emerald-600' },
            { id: 'movimientos' as const, label: 'Movimientos', icon: Receipt, color: 'text-blue-600' },
            { id: 'entidades' as const, label: 'Clientes', icon: Users, color: 'text-indigo-600' },
            { id: 'caja' as const, label: 'Caja', icon: Wallet, color: 'text-purple-600' },
          ] as const).map(({ id, label, icon: Icon, color }) => (
            <button key={id} type="button" onClick={() => { setPosTab(id); playTone(500, 0.03); }} className={`flex flex-1 flex-col items-center justify-center gap-0.5 min-h-12 rounded-xl transition cursor-pointer ${posTab === id ? color : 'text-slate-400'}`}>
              <Icon className={`w-5 h-5 ${posTab === id ? 'stroke-[2.5]' : ''}`} />
              <span className={posTab === id ? 'font-black' : ''}>{label}</span>
            </button>
          ))}
        </div>
      </nav>

      {showReceipt && receiptData && stage === 'pos' && (
        <DigitalReceiptModal isOpen={showReceipt} onClose={() => setShowReceipt(false)} receiptData={receiptData} onNewSale={() => setShowReceipt(false)} />
      )}
    </div>
  );
};
