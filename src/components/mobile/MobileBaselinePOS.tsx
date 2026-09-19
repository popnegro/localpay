import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import {
  Smartphone,
  Zap,
  Receipt,
  Users,
  Wallet,
  CheckCircle2,
  AlertTriangle,
  QrCode,
  Radio,
  Plus,
  Trash2,
  Search,
  ArrowUpRight,
  ArrowDownLeft,
  DollarSign,
  Share2,
  Printer,
  X,
  Sparkles,
  Volume2,
  VolumeX,
  Eye,
  Building2,
  Phone,
  ShieldCheck,
  RefreshCw,
  Clock,
  ArrowRight,
  Lock,
  KeyRound,
  ChevronRight,
  Maximize2,
  Minimize2,
  Compass,
  Check,
  Award,
  Layers,
  Info,
  Wifi,
  WifiOff,
  Coins,
  FileSpreadsheet,
  Calculator,
  CreditCard,
} from 'lucide-react';
import { dbService, Transaction, Entity, NetworkSyncState, DesgloseMetodo, CierreCajaRecord } from '../../services/dbService';
import { validateCUIT } from '../../utils/cuitValidator';
import { POS_ROADMAP_STEPS, RoadmapStep } from '../../data/roadmapData';
import type { AuthUser } from '../../services/authService';
import { DigitalReceiptModal } from './DigitalReceiptModal';
import { CierreDeCajaModal } from '../cierre/CierreDeCajaModal';

interface MobileBaselinePOSProps {
  currentUser: AuthUser | null;
  onLogout: () => void;
  onOpenAuditTab?: () => void;
}

export const MobileBaselinePOS: React.FC<MobileBaselinePOSProps> = ({
  currentUser,
  onLogout,
  onOpenAuditTab,
}) => {
  // Modos de visualización: Mockup en Desktop vs Móvil Full Screen
  const [isFullScreenMobile, setIsFullScreenMobile] = useState<boolean>(false);
  const [deviceModel, setDeviceModel] = useState<'iphone' | 'pixel' | 'sunmi-pos'>('iphone');
  const [showThumbOverlay, setShowThumbOverlay] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [showRoadmapDrawerMobile, setShowRoadmapDrawerMobile] = useState<boolean>(false);

  // Estado del Roadmap y flujo de la aplicación
  const [activeRoadmapStep, setActiveRoadmapStep] = useState<number>(3); // Default en Numpad Mostrador
  const [appStage, setAppStage] = useState<'login' | 'apertura' | 'pos' | 'qr' | 'semaforo' | 'cierre'>('pos');
  
  // Sub-pestañas dentro del POS (cuando está en etapa pos)
  const [posTab, setPosTab] = useState<'cobrar' | 'movimientos' | 'entidades' | 'caja'>('cobrar');

  // Estado de Login en el teléfono
  const [pinValue, setPinValue] = useState<string>('1234');
  const [pinError, setPinError] = useState<string | null>(null);
  const [isPhoneLoggedIn, setIsPhoneLoggedIn] = useState<boolean>(true);
  const [cajaAsignada, setCajaAsignada] = useState<string>(currentUser?.cajaId || 'CAJA-01');

  // Estado de Apertura de Caja
  const [fondoInicial, setFondoInicial] = useState<string>('15000');
  const [isCajaAbierta, setIsCajaAbierta] = useState<boolean>(true);
  const [horaApertura, setHoraApertura] = useState<string>('08:30');

  // Estado del Numpad táctil y Cobro
  const [numpadValue, setNumpadValue] = useState<string>('4500');
  const [concepto, setConcepto] = useState<string>('Venta Mostrador');
  const [quickConceptos] = useState<string[]>([
    'Venta Mostrador',
    'Café & Pastelería',
    'Bebidas & Snacks',
    'Artículos Varios',
  ]);

  // Estado del QR y Cobro Interoperable
  const qrCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [qrTimer, setQrTimer] = useState<number>(60);
  const [simulandoPago, setSimulandoPago] = useState<boolean>(false);
  const [ultimoCobroAprobado, setUltimoCobroAprobado] = useState<{
    id: string;
    monto: number;
    hora: string;
    metodo: string;
  } | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState<boolean>(false);
  const [showCierreModal, setShowCierreModal] = useState<boolean>(false);
  const [conteoFisicoArqueo, setConteoFisicoArqueo] = useState<string>('');
  const [cierreObservaciones, setCierreObservaciones] = useState<string>('');
  const [networkState, setNetworkState] = useState<NetworkSyncState>(dbService.getNetworkSyncState());

  // Transacciones y KPIs
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [kpis, setKpis] = useState(dbService.getKPIs());
  const [filtroTx, setFiltroTx] = useState<'todos' | 'ingreso' | 'egreso'>('todos');
  const [busquedaTx, setBusquedaTx] = useState<string>('');
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  // Entidades
  const [entities, setEntities] = useState<Entity[]>([]);
  const [filtroEntidad, setFiltroEntidad] = useState<'todos' | 'cliente' | 'proveedor'>('todos');
  const [busquedaEntidad, setBusquedaEntidad] = useState<string>('');
  const [showNewEntityDrawer, setShowNewEntityDrawer] = useState<boolean>(false);
  const [nuevoTipo, setNuevoTipo] = useState<'cliente' | 'proveedor'>('cliente');
  const [nuevoNombre, setNuevoNombre] = useState<string>('');
  const [nuevoContacto, setNuevoContacto] = useState<string>('');
  const [nuevoExtra, setNuevoExtra] = useState<string>('');
  const [cuitFeedback, setCuitFeedback] = useState<{ valid: boolean; message: string } | null>(null);

  // Generador de audio sintetizado háptico
  const playTone = (freq: number, duration: number = 0.08) => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
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
      // Audio context silently ignored
    }
  };

  const refreshData = () => {
    setTransactions(dbService.getTransactions());
    setEntities(dbService.getEntities());
    setKpis(dbService.getKPIs());
  };

  useEffect(() => {
    refreshData();
    dbService.initCloudSync(cajaAsignada);

    const unsubTx = dbService.subscribeTransactions((updatedTxs) => {
      setTransactions(updatedTxs);
      setKpis(dbService.getKPIs());
    });

    const unsubWebhook = dbService.subscribeWebhookArrival((event) => {
      if (event.cajaId === cajaAsignada || event.cajaId === 'ALL') {
        playTone(1050, 0.2);
        setUltimoCobroAprobado({
          id: event.referencia || 'TX-' + Date.now(),
          monto: event.monto,
          hora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          metodo: `${event.provider === 'mercadopago' ? 'Mercado Pago' : event.provider.toUpperCase()} (Webhook SSE)`,
        });
        setAppStage('semaforo');
        setActiveRoadmapStep(5);
      }
    });

    const unsubNetwork = dbService.subscribeNetworkSync((state) => {
      setNetworkState(state);
    });

    return () => {
      unsubTx();
      unsubWebhook();
      unsubNetwork();
    };
  }, [cajaAsignada]);

  // Generación reactiva de QR sobre Canvas
  useEffect(() => {
    if (appStage === 'qr' && qrCanvasRef.current) {
      const montoNum = parseInt(numpadValue, 10) || 0;
      const payload = `localpay://pay?amount=${montoNum}&caja=${cajaAsignada}&ref=TX-${Date.now()}`;

      QRCode.toCanvas(
        qrCanvasRef.current,
        payload,
        {
          width: 200,
          margin: 1,
          color: {
            dark: '#090d16',
            light: '#ffffff',
          },
        },
        (err) => {
          if (err) console.error('Error generando QR:', err);
        }
      );

      // Temporizador de expiración de sesión QR
      setQrTimer(60);
      const interval = setInterval(() => {
        setQrTimer((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [appStage, numpadValue, cajaAsignada]);

  // Sincronizar selección de Roadmap con la pantalla del celular
  const handleSelectRoadmapStep = (step: RoadmapStep) => {
    setActiveRoadmapStep(step.id);
    playTone(600, 0.05);

    if (step.slug === 'login') {
      setIsPhoneLoggedIn(false);
      setAppStage('login');
    } else if (step.slug === 'apertura') {
      setIsPhoneLoggedIn(true);
      setIsCajaAbierta(false);
      setAppStage('apertura');
    } else if (step.slug === 'pos-numpad') {
      setIsPhoneLoggedIn(true);
      setIsCajaAbierta(true);
      setAppStage('pos');
      setPosTab('cobrar');
    } else if (step.slug === 'qr-display') {
      setIsPhoneLoggedIn(true);
      setIsCajaAbierta(true);
      if (parseInt(numpadValue, 10) <= 0) setNumpadValue('3500');
      setAppStage('qr');
    } else if (step.slug === 'semaforo') {
      setIsPhoneLoggedIn(true);
      setIsCajaAbierta(true);
      if (!ultimoCobroAprobado) {
        setUltimoCobroAprobado({
          id: 'TX-' + Math.floor(100 + Math.random() * 900),
          monto: parseInt(numpadValue, 10) || 4500,
          hora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          metodo: 'Mercado Pago (QR)',
        });
      }
      setAppStage('semaforo');
    } else if (step.slug === 'cierre-caja') {
      setIsPhoneLoggedIn(true);
      setIsCajaAbierta(true);
      setAppStage('cierre');
    }
  };

  // Manejo de pulsación en el Numpad
  const handleNumpadPress = (val: string) => {
    playTone(520, 0.05);
    if (val === 'DEL') {
      setNumpadValue((prev) => (prev.length > 1 ? prev.slice(0, -1) : '0'));
    } else if (val === 'CLR') {
      setNumpadValue('0');
    } else {
      setNumpadValue((prev) => {
        if (prev === '0') return val;
        if (prev.length >= 8) return prev;
        return prev + val;
      });
    }
  };

  const handleQuickAdd = (amount: number) => {
    playTone(640, 0.06);
    const current = parseInt(numpadValue, 10) || 0;
    setNumpadValue(String(current + amount));
  };

  // Simulación de aprobación de pago
  const handleAprobarCobro = (metodo: string = 'Mercado Pago (QR)') => {
    setSimulandoPago(true);
    playTone(880, 0.08);

    setTimeout(() => {
      const monto = parseInt(numpadValue, 10) || 4500;
      const nuevaTx = dbService.addTransaction({
        tipo: 'ingreso',
        concepto: `${concepto} (${metodo})`,
        monto: monto,
        metodo: 'QR Interoperable',
        estado: 'aprobado',
        cajero: currentUser?.name || 'Cajero 01',
      });

      setUltimoCobroAprobado({
        id: nuevaTx.id,
        monto: monto,
        hora: nuevaTx.hora,
        metodo: metodo,
      });

      setSimulandoPago(false);
      setAppStage('semaforo');
      setActiveRoadmapStep(5);
      refreshData();
      playTone(1050, 0.15);
    }, 650);
  };

  // Manejo de Login por PIN dentro del celular
  const handlePinPress = (digit: string) => {
    playTone(580, 0.04);
    if (digit === 'DEL') {
      setPinValue((prev) => prev.slice(0, -1));
      setPinError(null);
    } else if (digit === 'CLR') {
      setPinValue('');
      setPinError(null);
    } else {
      if (pinValue.length < 4) {
        const next = pinValue + digit;
        setPinValue(next);
        if (next.length === 4) {
          // Auto-login con PIN válido
          setTimeout(() => {
            if (next === '1234' || next === '0000') {
              setIsPhoneLoggedIn(true);
              setPinError(null);
              setAppStage('apertura');
              setActiveRoadmapStep(2);
              playTone(880, 0.1);
            } else {
              setPinError('PIN incorrecto. Ingrese 1234 (Demo)');
              playTone(300, 0.2);
            }
          }, 200);
        }
      }
    }
  };

  const handleConfirmApertura = () => {
    setIsCajaAbierta(true);
    setHoraApertura(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    setAppStage('pos');
    setActiveRoadmapStep(3);
    playTone(880, 0.1);
  };

  // Obtener step actual del roadmap
  const currentStepData = POS_ROADMAP_STEPS.find((s) => s.id === activeRoadmapStep) || POS_ROADMAP_STEPS[2];

  return (
    <div className="space-y-6">
      {/* Barra de Encabezado y Control del Workspace */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-emerald-600" /> BASELINE MOBILE-FIRST
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
              Terminal POS de Mostrador
            </span>
          </div>
          <h2 className="text-xl font-black text-slate-900 mt-1 flex items-center gap-2">
            <span>Terminal POS de Mostrador • Ergonomía 100% Mobile-First</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Vista en Desktop con <strong>Mockup del Celular</strong> e interactividad completa, o <strong>Vista Móvil Full Screen</strong> para operaciones reales de mostrador.
          </p>
        </div>

        {/* Controles de Vista y Simulación */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          {/* Toggle Full Screen Móvil */}
          <button
            onClick={() => setIsFullScreenMobile(!isFullScreenMobile)}
            className={`px-3.5 py-2 rounded-xl text-xs font-black border transition flex items-center gap-2 cursor-pointer ${
              isFullScreenMobile
                ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                : 'bg-slate-900 border-slate-900 text-white hover:bg-slate-800'
            }`}
          >
            {isFullScreenMobile ? (
              <>
                <Minimize2 className="w-4 h-4" />
                <span>Volver a Mockup Desktop</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-4 h-4" />
                <span>Vista Móvil Full Screen</span>
              </>
            )}
          </button>

          {/* Selector de Chasis (solo activo en modo mockup) */}
          {!isFullScreenMobile && (
            <div className="inline-flex p-1 bg-slate-100 rounded-xl text-xs font-bold border border-slate-200">
              <button
                onClick={() => setDeviceModel('iphone')}
                className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                  deviceModel === 'iphone' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                iPhone 15 Pro
              </button>
              <button
                onClick={() => setDeviceModel('pixel')}
                className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                  deviceModel === 'pixel' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Pixel 8
              </button>
              <button
                onClick={() => setDeviceModel('sunmi-pos')}
                className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                  deviceModel === 'sunmi-pos' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                POS Handheld
              </button>
            </div>
          )}

          {/* Toggle Heatmap del Pulgar */}
          <button
            onClick={() => setShowThumbOverlay(!showThumbOverlay)}
            className={`px-3 py-2 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 cursor-pointer ${
              showThumbOverlay
                ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
            title="Visualizar zonas ergonómicas (Steven Hoober)"
          >
            <Eye className="w-4 h-4" />
            <span className="hidden sm:inline">{showThumbOverlay ? 'Ocultar Heatmap' : 'Zona Pulgar'}</span>
          </button>

          {/* Toggle Sonido / Háptico */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-xl border text-xs font-bold transition cursor-pointer ${
              soundEnabled
                ? 'bg-slate-100 text-slate-800 border-slate-300'
                : 'bg-white text-slate-400 border-slate-200 hover:bg-slate-50'
            }`}
            title={soundEnabled ? 'Sonido activado' : 'Sonido silenciado'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-600" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {onOpenAuditTab && (
            <button
              onClick={onOpenAuditTab}
              className="px-3 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs border border-indigo-200 transition cursor-pointer flex items-center gap-1"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Auditoría UX/UI</span>
            </button>
          )}
        </div>
      </div>

      {/* CONTENIDO PRINCIPAL: 2 COLUMNAS EN DESKTOP / 1 COLUMNA EN MOBILE */}
      <div className={`grid gap-8 items-start ${isFullScreenMobile ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-12'}`}>
        
        {/* COLUMNA IZQUIERDA (ROADMAP COMPLETO DESDE LOGIN) - Oculto en modo Full Screen Puro para dar 100% foco */}
        {!isFullScreenMobile && (
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                    <Compass className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 text-base">Roadmap Completo del POS</h3>
                    <p className="text-xs text-slate-500">Flujo integral de mostrador, desde login hasta cierre</p>
                  </div>
                </div>
                <span className="text-xs font-bold px-2 py-1 bg-slate-100 text-slate-700 rounded-lg">
                  Paso {activeRoadmapStep} de 6
                </span>
              </div>

              {/* Stepper de Hitos */}
              <div className="space-y-2">
                {POS_ROADMAP_STEPS.map((step) => {
                  const isActive = activeRoadmapStep === step.id;
                  const isCompleted = activeRoadmapStep > step.id;

                  return (
                    <div
                      key={step.id}
                      onClick={() => handleSelectRoadmapStep(step)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                        isActive
                          ? 'bg-blue-50/70 border-blue-500/80 shadow-xs ring-2 ring-blue-500/20'
                          : isCompleted
                          ? 'bg-white border-slate-200 hover:border-slate-300'
                          : 'bg-white border-slate-200 hover:border-slate-300 opacity-80'
                      }`}
                    >
                      {/* Indicador de número / check */}
                      <div
                        className={`w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs shrink-0 mt-0.5 ${
                          isActive
                            ? 'bg-blue-600 text-white'
                            : isCompleted
                            ? 'bg-emerald-500 text-white'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {isCompleted ? <Check className="w-4 h-4" /> : step.id}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className={`text-xs font-black ${isActive ? 'text-blue-900' : 'text-slate-800'}`}>
                            {step.shortTitle}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                              isActive
                                ? 'bg-blue-200/60 text-blue-800'
                                : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            {step.stage}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                          {step.uxHeuristic}
                        </p>
                      </div>

                      <ChevronRight
                        className={`w-4 h-4 shrink-0 mt-1 transition-transform ${
                          isActive ? 'text-blue-600 translate-x-0.5' : 'text-slate-300'
                        }`}
                      />
                    </div>
                  );
                })}
              </div>

              {/* Ficha Detallada del Hito Seleccionado */}
              <div className="mt-4 p-4 rounded-2xl bg-slate-900 text-white space-y-3 shadow-md">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                    {currentStepData.badge}
                  </span>
                  <button
                    onClick={() => handleSelectRoadmapStep(currentStepData)}
                    className="text-[11px] font-bold text-blue-300 hover:text-white underline cursor-pointer flex items-center gap-1"
                  >
                    <span>Ver en Celular</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>

                <h4 className="text-sm font-bold text-white leading-tight">
                  {currentStepData.title}
                </h4>

                <p className="text-xs text-slate-300 leading-relaxed">
                  {currentStepData.description}
                </p>

                <div className="pt-2 border-t border-slate-800 grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Original (Legacy)</span>
                    <span className="text-rose-300 font-semibold">{currentStepData.metrics.legacy}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Baseline Mobile</span>
                    <span className="text-emerald-400 font-semibold">{currentStepData.metrics.baseline}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-300">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Stack & Blindaje</span>
                  <p className="font-mono text-[10px] text-indigo-200 mt-0.5">{currentStepData.techStack}</p>
                </div>
              </div>

              {/* Atajos Rápidos para Probar Etapas */}
              <div className="pt-2 flex flex-wrap items-center gap-1.5 text-xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase mr-1">Saltar directo a:</span>
                <button
                  onClick={() => handleSelectRoadmapStep(POS_ROADMAP_STEPS[0])}
                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-[11px] cursor-pointer"
                >
                  1. Login PIN
                </button>
                <button
                  onClick={() => handleSelectRoadmapStep(POS_ROADMAP_STEPS[1])}
                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-[11px] cursor-pointer"
                >
                  2. Apertura
                </button>
                <button
                  onClick={() => handleSelectRoadmapStep(POS_ROADMAP_STEPS[2])}
                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-[11px] cursor-pointer"
                >
                  3. Numpad
                </button>
                <button
                  onClick={() => handleSelectRoadmapStep(POS_ROADMAP_STEPS[3])}
                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-[11px] cursor-pointer"
                >
                  4. QR
                </button>
                <button
                  onClick={() => handleSelectRoadmapStep(POS_ROADMAP_STEPS[4])}
                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-[11px] cursor-pointer"
                >
                  5. Semáforo
                </button>
                <button
                  onClick={() => handleSelectRoadmapStep(POS_ROADMAP_STEPS[5])}
                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-[11px] cursor-pointer"
                >
                  6. Cierre
                </button>
              </div>
            </div>
          </div>
        )}

        {/* COLUMNA DERECHA: MOCKUP DEL CELULAR (DESKTOP) O FULL SCREEN NATIVO (MÓVIL) */}
        <div className={`${isFullScreenMobile ? 'w-full' : 'lg:col-span-7'} flex justify-center items-start`}>
          
          {/* CHASIS EXTERNO DEL CELULAR (CONDICIONADO POR MOCKUP VS FULL SCREEN) */}
          <div
            className={`transition-all duration-300 ${
              isFullScreenMobile
                ? 'w-full max-w-md mx-auto bg-slate-950 rounded-none sm:rounded-3xl p-0 sm:p-2 shadow-2xl border-0 sm:border border-slate-800 flex flex-col justify-between'
                : deviceModel === 'iphone'
                ? 'w-full max-w-[393px] aspect-[9/19.5] min-h-[770px] max-h-[852px] bg-slate-950 rounded-[54px] p-3 shadow-2xl border-[10px] border-slate-800 relative flex flex-col justify-between overflow-hidden ring-1 ring-white/10'
                : deviceModel === 'pixel'
                ? 'w-full max-w-[412px] min-h-[780px] max-h-[860px] bg-slate-900 rounded-[44px] p-3.5 shadow-2xl border-[9px] border-slate-700 relative flex flex-col justify-between overflow-hidden ring-1 ring-white/10'
                : 'w-full max-w-[400px] min-h-[780px] bg-slate-950 rounded-[36px] p-4 shadow-2xl border-[12px] border-amber-900/40 relative flex flex-col justify-between overflow-hidden'
            }`}
          >
            {/* BOTONES FÍSICOS DEL MARCO EN MOCKUP (VOLUMEN Y POWER) */}
            {!isFullScreenMobile && (
              <>
                {/* Botón de bloqueo derecho */}
                <div className="absolute right-[-13px] top-[140px] w-[3px] h-[55px] bg-slate-700 rounded-r-sm pointer-events-none" />
                {/* Botones de volumen izquierdo */}
                <div className="absolute left-[-13px] top-[120px] w-[3px] h-[45px] bg-slate-700 rounded-l-sm pointer-events-none" />
                <div className="absolute left-[-13px] top-[175px] w-[3px] h-[45px] bg-slate-700 rounded-l-sm pointer-events-none" />
              </>
            )}

            {/* PANTALLA TÁCTIL INTERNA (VIEWPORT 100% OPERATIVO) */}
            <div
              className={`flex-1 bg-slate-100 text-slate-900 flex flex-col overflow-hidden relative shadow-inner ${
                isFullScreenMobile
                  ? 'rounded-none sm:rounded-2xl min-h-[100dvh]'
                  : deviceModel === 'iphone'
                  ? 'rounded-[42px]'
                  : 'rounded-[32px]'
              }`}
            >
              {/* OVERLAY HEATMAP DE LA ZONA DEL PULGAR (OPCIONAL) */}
              {showThumbOverlay && (
                <div className="absolute inset-0 z-50 pointer-events-none flex flex-col justify-between text-center select-none font-bold text-xs">
                  {/* 25% Superior: Zona Roja (Hard to reach) */}
                  <div className="h-[25%] bg-rose-500/25 border-b-2 border-dashed border-rose-500 flex flex-col items-center justify-center p-2 text-rose-900 backdrop-blur-[1px]">
                    <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white text-[10px] uppercase font-black tracking-wider shadow-xs">
                      Hard to Reach (25%)
                    </span>
                    <p className="text-[10px] text-rose-950 font-bold mt-1">
                      Solo indicadores / logout
                    </p>
                  </div>

                  {/* 35% Intermedio: Zona Amarilla (Stretch) */}
                  <div className="h-[35%] bg-amber-500/20 border-b-2 border-dashed border-amber-500 flex flex-col items-center justify-center p-2 text-amber-900 backdrop-blur-[1px]">
                    <span className="px-2 py-0.5 rounded-full bg-amber-600 text-white text-[10px] uppercase font-black tracking-wider shadow-xs">
                      Stretch Zone (35%)
                    </span>
                    <p className="text-[10px] text-amber-950 font-bold mt-1">
                      Display importe / chips rápidos
                    </p>
                  </div>

                  {/* 40% Inferior: Zona Verde (Natural Thumb Zone) */}
                  <div className="h-[40%] bg-emerald-500/30 flex flex-col items-center justify-center p-2 text-emerald-950 backdrop-blur-[1px] ring-4 ring-emerald-500/50">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-700 text-white text-[10px] uppercase font-black tracking-wider shadow-xs">
                      Natural Thumb Zone (40%)
                    </span>
                    <p className="text-[10px] text-emerald-950 font-black mt-1">
                      Numpad 56px • Botón Cobrar • Bottom Bar
                    </p>
                  </div>
                </div>
              )}

              {/* DYNAMIC ISLAND / STATUS BAR NATIVA */}
              <div className="px-5 pt-3 pb-2 bg-slate-900 text-white flex items-center justify-between text-xs font-semibold shrink-0 select-none">
                <div className="flex items-center gap-2">
                  <span className="font-bold tracking-tight">14:50</span>
                  <span className="text-[10px] px-1.5 py-0.2 bg-slate-800 text-emerald-400 rounded-md font-mono">
                    {cajaAsignada}
                  </span>
                </div>

                {/* Dynamic Island / Cámara */}
                {!isFullScreenMobile && (
                  <div className="w-24 h-4.5 bg-black rounded-full flex items-center justify-center px-2 gap-1.5 shadow-xs">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[9px] font-bold text-slate-300">LocalPay</span>
                  </div>
                )}

                <div className="flex items-center gap-1.5 text-slate-300 text-[11px]">
                  {networkState.isOnline ? (
                    <span
                      title="Conectado con Firestore en tiempo real"
                      className="flex items-center gap-1 text-[9px] text-emerald-400 font-bold bg-emerald-500/20 px-1.5 py-0.5 rounded font-mono"
                    >
                      <Wifi className="w-2.5 h-2.5 text-emerald-400" />
                      {networkState.pendingQueueCount > 0 ? `${networkState.pendingQueueCount} cola` : 'Online'}
                    </span>
                  ) : (
                    <span
                      title="Sin conexión: operando en modo offline"
                      className="flex items-center gap-1 text-[9px] text-amber-300 font-bold bg-amber-500/25 px-1.5 py-0.5 rounded font-mono animate-pulse"
                    >
                      <WifiOff className="w-2.5 h-2.5 text-amber-400" />
                      {networkState.pendingQueueCount > 0 ? `${networkState.pendingQueueCount} cola` : 'Offline'}
                    </span>
                  )}
                  <span className="text-[10px] font-bold">5G</span>
                  <div className="w-5 h-2.5 border border-slate-400 rounded-xs p-0.5 flex items-center">
                    <div className="w-3.5 h-full bg-emerald-400 rounded-2xs" />
                  </div>
                </div>
              </div>

              {/* BOTÓN FLOTANTE ROADMAP EN MODO MÓVIL FULL SCREEN */}
              {isFullScreenMobile && (
                <div className="bg-blue-600 text-white px-4 py-2 flex items-center justify-between text-xs shadow-md">
                  <div className="flex items-center gap-1.5">
                    <Compass className="w-4 h-4 text-blue-200" />
                    <span className="font-black">Hito {activeRoadmapStep}:</span>
                    <span className="font-medium truncate max-w-[170px]">{currentStepData.shortTitle}</span>
                  </div>
                  <button
                    onClick={() => setShowRoadmapDrawerMobile(!showRoadmapDrawerMobile)}
                    className="px-2 py-0.5 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-lg text-[11px] cursor-pointer"
                  >
                    Cambiar Hito
                  </button>
                </div>
              )}

              {/* SUB-DRAWER DE ROADMAP PARA MODO MÓVIL */}
              {showRoadmapDrawerMobile && isFullScreenMobile && (
                <div className="p-3 bg-slate-900 text-white border-b border-slate-800 space-y-2 animate-in slide-in-from-top-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-400">
                    <span>Seleccionar Etapa del Roadmap</span>
                    <button onClick={() => setShowRoadmapDrawerMobile(false)} className="text-slate-400 hover:text-white">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {POS_ROADMAP_STEPS.map((step) => (
                      <button
                        key={step.id}
                        onClick={() => {
                          handleSelectRoadmapStep(step);
                          setShowRoadmapDrawerMobile(false);
                        }}
                        className={`p-2 rounded-xl text-left text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                          activeRoadmapStep === step.id
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        <span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-[10px]">
                          {step.id}
                        </span>
                        <span className="truncate">{step.shortTitle}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* ------------------------------------------------------------- */}
              {/* PANTALLA 1: LOGIN POR PIN NUMÉRICO (HITO 1)                   */}
              {/* ------------------------------------------------------------- */}
              {appStage === 'login' && (
                <div className="flex-1 flex flex-col justify-between p-5 bg-gradient-to-b from-slate-900 to-slate-950 text-white">
                  <div className="space-y-4 text-center pt-4">
                    <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 shadow-lg">
                      <KeyRound className="w-7 h-7" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-white">Acceso a Caja</h3>
                      <p className="text-xs text-slate-400 mt-1">Ingrese su PIN de 4 dígitos para iniciar turno</p>
                    </div>

                    {/* PIN Display Bubbles */}
                    <div className="flex justify-center items-center gap-3 py-3">
                      {[0, 1, 2, 3].map((idx) => {
                        const filled = pinValue.length > idx;
                        return (
                          <div
                            key={idx}
                            className={`w-4 h-4 rounded-full border-2 transition-all ${
                              filled
                                ? 'bg-emerald-400 border-emerald-400 scale-110 shadow-md shadow-emerald-400/50'
                                : 'border-slate-600 bg-transparent'
                            }`}
                          />
                        );
                      })}
                    </div>

                    {pinError && (
                      <p className="text-xs font-bold text-rose-400 animate-bounce">{pinError}</p>
                    )}
                  </div>

                  {/* Numpad de PIN */}
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-2.5 max-w-[280px] mx-auto">
                      {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'CLR', '0', 'DEL'].map((k) => (
                        <button
                          key={k}
                          onClick={() => handlePinPress(k)}
                          className={`h-14 rounded-2xl font-black text-lg transition-all active:scale-95 flex items-center justify-center cursor-pointer ${
                            k === 'DEL' || k === 'CLR'
                              ? 'bg-slate-800 text-slate-300 text-xs hover:bg-slate-700'
                              : 'bg-slate-800/90 hover:bg-slate-700 text-white shadow-xs'
                          }`}
                        >
                          {k === 'DEL' ? 'Borrar' : k === 'CLR' ? 'C' : k}
                        </button>
                      ))}
                    </div>

                    {/* Acceso Rápido Demo */}
                    <div className="pt-2 text-center">
                      <button
                        onClick={() => {
                          setPinValue('1234');
                          setTimeout(() => {
                            setIsPhoneLoggedIn(true);
                            setAppStage('apertura');
                            setActiveRoadmapStep(2);
                            playTone(880, 0.1);
                          }, 150);
                        }}
                        className="text-xs font-bold text-blue-400 hover:text-blue-300 underline cursor-pointer"
                      >
                        Autocompletar PIN Demo (1234)
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ------------------------------------------------------------- */}
              {/* PANTALLA 2: APERTURA DE CAJA & FONDO INICIAL (HITO 2)          */}
              {/* ------------------------------------------------------------- */}
              {appStage === 'apertura' && (
                <div className="flex-1 flex flex-col justify-between p-5 bg-white text-slate-900">
                  <div className="space-y-4 pt-2">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Operador Autenticado
                    </div>

                    <div>
                      <h3 className="text-xl font-black text-slate-900">Apertura de Caja</h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Declare el saldo inicial de billetes en gaveta antes de comenzar a cobrar.
                      </p>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500 font-medium">Terminal Física:</span>
                        <span className="font-bold text-slate-900">{cajaAsignada}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500 font-medium">Sucursal:</span>
                        <span className="font-bold text-slate-900">{currentUser?.branch || 'Mendoza Centro'}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500 font-medium">Cajero a cargo:</span>
                        <span className="font-bold text-slate-900">{currentUser?.name || 'Cajero 01'}</span>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-black text-slate-700 uppercase">Fondo Inicial de Cambio (ARS)</label>
                      <div className="relative">
                        <DollarSign className="w-5 h-5 absolute left-3 top-3 text-slate-400" />
                        <input
                          type="number"
                          value={fondoInicial}
                          onChange={(e) => setFondoInicial(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 bg-white border-2 border-slate-300 rounded-xl font-black text-lg text-slate-900 focus:border-blue-600 outline-hidden"
                        />
                      </div>
                      <p className="text-[11px] text-slate-400">Importe sugerido para cambio: $15.000 ARS</p>
                    </div>
                  </div>

                  <div className="space-y-2 pt-4">
                    <button
                      onClick={handleConfirmApertura}
                      className="w-full h-14 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm rounded-2xl shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 cursor-pointer active:scale-98 transition"
                    >
                      <span>ABRIR CAJA Y EMPEZAR A COBRAR</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* ------------------------------------------------------------- */}
              {/* PANTALLA 3: TERMINAL POS MOSTRADOR CON NUMPAD (HITO 3)         */}
              {/* ------------------------------------------------------------- */}
              {appStage === 'pos' && (
                <div className="flex-1 flex flex-col justify-between overflow-hidden">
                  
                  {/* TOP BAR MOSTRADOR */}
                  <div className="p-3 bg-white border-b border-slate-200/80 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                      <span className="text-xs font-black text-slate-900">Caja Abierta ({horaApertura})</span>
                    </div>
                    <button
                      onClick={() => {
                        setAppStage('cierre');
                        setActiveRoadmapStep(6);
                      }}
                      className="text-[11px] font-bold text-rose-600 hover:text-rose-700 bg-rose-50 px-2 py-1 rounded-lg cursor-pointer"
                    >
                      Cierre Z
                    </button>
                  </div>

                  {/* CONTENIDO SEGÚN SUB-PESTAÑA (COBRAR / MOVIMIENTOS / ENTIDADES / CAJA) */}
                  <div className="flex-1 overflow-y-auto p-3.5 flex flex-col justify-between space-y-2">
                    
                    {/* SUB-TAB 1: COBRAR CON NUMPAD TÁCTIL (ONE-THUMB) */}
                    {posTab === 'cobrar' && (
                      <div className="flex-1 flex flex-col justify-between space-y-2">
                        {/* ZONA DE STRETCH (35%): DISPLAY DE IMPORTE & CONCEPTOS */}
                        <div className="space-y-2">
                          {/* Banner de contingencia Offline si no hay conexión */}
                          {!networkState.isOnline && (
                            <div className="px-2.5 py-1.5 bg-amber-500/15 border border-amber-500/30 rounded-xl flex items-center justify-between text-[11px] text-amber-900">
                              <div className="flex items-center gap-1.5">
                                <WifiOff className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                <span><strong>Modo Offline:</strong> Cobros en cola local.</span>
                              </div>
                              {networkState.pendingQueueCount > 0 && (
                                <span className="font-mono font-bold bg-amber-200 text-amber-900 px-1.5 py-0.2 rounded text-[10px]">
                                  {networkState.pendingQueueCount} en cola
                                </span>
                              )}
                            </div>
                          )}

                          {/* Concepto Rápido */}
                          <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                            {quickConceptos.map((c) => (
                              <button
                                key={c}
                                onClick={() => {
                                  setConcepto(c);
                                  playTone(600, 0.04);
                                }}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                                  concepto === c
                                    ? 'bg-slate-900 text-white'
                                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                                }`}
                              >
                                {c}
                              </button>
                            ))}
                          </div>

                          {/* Display Gigante del Importe */}
                          <div className="bg-white rounded-2xl p-3 border border-slate-200/90 shadow-xs flex flex-col justify-between">
                            <div className="flex justify-between items-center text-xs text-slate-400">
                              <span className="font-bold uppercase tracking-wider text-[10px]">Importe a Cobrar</span>
                              <span className="font-medium">{concepto}</span>
                            </div>
                            <div className="flex items-baseline justify-end gap-1 mt-1">
                              <span className="text-xl font-bold text-slate-400">$</span>
                              <span className="text-3xl font-black text-slate-950 tracking-tight font-mono">
                                {Number(numpadValue || '0').toLocaleString('es-AR')}
                              </span>
                              <span className="text-xs text-slate-400 font-bold">ARS</span>
                            </div>
                          </div>

                          {/* Chips de Billetes Rápidos (Adición con 1 Toque) */}
                          <div className="grid grid-cols-4 gap-1.5">
                            {[1000, 2000, 5000, 10000].map((billete) => (
                              <button
                                key={billete}
                                onClick={() => handleQuickAdd(billete)}
                                className="py-2 bg-emerald-50 hover:bg-emerald-100 active:bg-emerald-200 text-emerald-800 text-xs font-black rounded-xl border border-emerald-200 transition cursor-pointer active:scale-95"
                              >
                                +${billete.toLocaleString('es-AR')}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* ZONA NATURAL DEL PULGAR (40% INFERIOR): TECLADO NUMPAD TÁCTIL (56px) */}
                        <div className="space-y-2 pt-1">
                          <div className="grid grid-cols-3 gap-2">
                            {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'CLR', '0', 'DEL'].map((btn) => (
                              <button
                                key={btn}
                                onClick={() => handleNumpadPress(btn)}
                                className={`h-13 rounded-2xl font-black text-lg transition-all active:scale-95 flex items-center justify-center cursor-pointer select-none ${
                                  btn === 'DEL' || btn === 'CLR'
                                    ? 'bg-slate-200/80 hover:bg-slate-300 text-slate-700 text-xs font-bold'
                                    : 'bg-white hover:bg-slate-50 text-slate-900 border border-slate-200 shadow-xs'
                                }`}
                              >
                                {btn === 'DEL' ? '⌫' : btn === 'CLR' ? 'C' : btn}
                              </button>
                            ))}
                          </div>

                          {/* BOTÓN PRINCIPAL: COBRAR CON QR */}
                          <button
                            onClick={() => {
                              const monto = parseInt(numpadValue, 10) || 0;
                              if (monto > 0) {
                                setAppStage('qr');
                                setActiveRoadmapStep(4);
                                playTone(740, 0.08);
                              }
                            }}
                            className="w-full h-14 bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-slate-950 font-black text-sm rounded-2xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer transition active:scale-98"
                          >
                            <QrCode className="w-5 h-5" />
                            <span>COBRAR CON QR • 0 MS</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* SUB-TAB 2: MOVIMIENTOS EN CAJA (TARJETAS APILADAS) */}
                    {posTab === 'movimientos' && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-black text-sm text-slate-900">Historial en Tarjetas</h4>
                          <button
                            onClick={() => dbService.exportTransactionsToCSV()}
                            className="text-xs font-bold text-blue-600 underline cursor-pointer"
                          >
                            Exportar CSV
                          </button>
                        </div>

                        {/* Buscador */}
                        <div className="relative">
                          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                          <input
                            type="text"
                            placeholder="Buscar cobro..."
                            value={busquedaTx}
                            onChange={(e) => setBusquedaTx(e.target.value)}
                            className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs"
                          />
                        </div>

                        {/* Lista de Tarjetas Apiladas (0 scroll horizontal) */}
                        <div className="space-y-2 max-h-[360px] overflow-y-auto pr-0.5">
                          {transactions
                            .filter((t) =>
                              t.concepto.toLowerCase().includes(busquedaTx.toLowerCase()) ||
                              t.codigo.toLowerCase().includes(busquedaTx.toLowerCase())
                            )
                            .map((tx) => (
                              <div
                                key={tx.id}
                                onClick={() => setSelectedTx(tx)}
                                className="p-2.5 bg-white rounded-xl border border-slate-200 shadow-xs flex items-center justify-between cursor-pointer hover:border-blue-400 transition"
                              >
                                <div className="flex items-center gap-2">
                                  <div
                                    className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                                      tx.tipo === 'ingreso' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                                    }`}
                                  >
                                    {tx.tipo === 'ingreso' ? '+' : '-'}
                                  </div>
                                  <div>
                                    <p className="font-black text-xs text-slate-900 line-clamp-1">{tx.concepto}</p>
                                    <p className="text-[10px] text-slate-400">{tx.hora} • {tx.metodo}</p>
                                  </div>
                                </div>
                                <span className="font-black text-xs text-emerald-600 font-mono">
                                  +${tx.monto.toLocaleString('es-AR')}
                                </span>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}

                    {/* SUB-TAB 3: CONTACTOS / CUIT (AFIP MÓDULO 11) */}
                    {posTab === 'entidades' && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-black text-sm text-slate-900">Directorio de Clientes</h4>
                          <button
                            onClick={() => setShowNewEntityDrawer(true)}
                            className="text-xs font-bold text-blue-600 flex items-center gap-1 cursor-pointer"
                          >
                            <Plus className="w-3 h-3" /> Alta CUIT
                          </button>
                        </div>

                        <div className="space-y-2 max-h-[360px] overflow-y-auto pr-0.5">
                          {entities.map((e) => (
                            <div key={e.id} className="p-2.5 bg-white rounded-xl border border-slate-200 text-xs space-y-1">
                              <div className="flex justify-between font-bold text-slate-900">
                                <span>{e.nombre}</span>
                                <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 rounded-md uppercase">
                                  {e.tipo}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500">{e.contacto} • {e.extra}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* SUB-TAB 4: RESUMEN DE CAJA EN VIVO */}
                    {posTab === 'caja' && (
                      <div className="space-y-3">
                        <h4 className="font-black text-sm text-slate-900">Balance del Turno</h4>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="p-3 bg-white rounded-xl border border-slate-200">
                            <span className="text-[10px] uppercase font-bold text-slate-400">Ingresos</span>
                            <p className="text-base font-black text-emerald-600">${kpis.ingresos.toLocaleString('es-AR')}</p>
                          </div>
                          <div className="p-3 bg-white rounded-xl border border-slate-200">
                            <span className="text-[10px] uppercase font-bold text-slate-400">Egresos</span>
                            <p className="text-base font-black text-rose-600">${kpis.egresos.toLocaleString('es-AR')}</p>
                          </div>
                          <div className="col-span-2 p-3 bg-slate-900 text-white rounded-xl">
                            <span className="text-[10px] uppercase font-bold text-slate-400">Balance Neto</span>
                            <p className="text-xl font-black text-emerald-400">${kpis.balanceNeto.toLocaleString('es-AR')}</p>
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            setAppStage('cierre');
                            setActiveRoadmapStep(6);
                          }}
                          className="w-full py-3 bg-rose-600 text-white font-black text-xs rounded-xl shadow-xs cursor-pointer"
                        >
                          Efectuar Cierre de Caja Z
                        </button>
                      </div>
                    )}
                  </div>

                  {/* BOTTOM NAVIGATION BAR (NATIVE MOBILE FEEL) */}
                  <div className="bg-white border-t border-slate-200/80 p-1.5 flex items-center justify-around shrink-0 text-[10px] font-bold">
                    <button
                      onClick={() => {
                        setPosTab('cobrar');
                        playTone(500, 0.03);
                      }}
                      className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition cursor-pointer ${
                        posTab === 'cobrar' ? 'text-emerald-600 font-black' : 'text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      <Zap className="w-4 h-4" />
                      <span>Cobrar</span>
                    </button>
                    <button
                      onClick={() => {
                        setPosTab('movimientos');
                        playTone(500, 0.03);
                      }}
                      className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition cursor-pointer ${
                        posTab === 'movimientos' ? 'text-blue-600 font-black' : 'text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      <Receipt className="w-4 h-4" />
                      <span>Movimientos</span>
                    </button>
                    <button
                      onClick={() => {
                        setPosTab('entidades');
                        playTone(500, 0.03);
                      }}
                      className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition cursor-pointer ${
                        posTab === 'entidades' ? 'text-indigo-600 font-black' : 'text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      <Users className="w-4 h-4" />
                      <span>Clientes</span>
                    </button>
                    <button
                      onClick={() => {
                        setPosTab('caja');
                        playTone(500, 0.03);
                      }}
                      className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition cursor-pointer ${
                        posTab === 'caja' ? 'text-purple-600 font-black' : 'text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      <Wallet className="w-4 h-4" />
                      <span>Caja</span>
                    </button>
                  </div>
                </div>
              )}

              {/* ------------------------------------------------------------- */}
              {/* PANTALLA 4: PRESENTACIÓN DE QR INTEROPERABLE (HITO 4)          */}
              {/* ------------------------------------------------------------- */}
              {appStage === 'qr' && (
                <div className="flex-1 flex flex-col justify-between p-4 bg-slate-900 text-white">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Mostrador • Cobro QR
                    </span>
                    <button
                      onClick={() => setAppStage('pos')}
                      className="text-xs font-bold text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
                    >
                      <X className="w-4 h-4" /> Cancelar
                    </button>
                  </div>

                  <div className="text-center space-y-3 my-auto">
                    <div className="bg-white text-slate-950 p-4 rounded-3xl inline-block shadow-2xl">
                      <canvas ref={qrCanvasRef} className="mx-auto block" />
                      <div className="mt-2 pt-2 border-t border-slate-200 text-center">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Total a Pagar</span>
                        <p className="text-2xl font-black text-slate-950 font-mono">
                          ${Number(numpadValue || '0').toLocaleString('es-AR')} ARS
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
                      <Clock className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                      <span>Expira en <strong>{qrTimer} seg</strong></span>
                      <span>•</span>
                      <span className="text-emerald-400 font-semibold">Caja {cajaAsignada}</span>
                    </div>
                  </div>

                  {/* Simulador de Aprobación Omnicanal */}
                  <div className="space-y-2 pt-2">
                    <p className="text-[10px] uppercase font-bold text-slate-400 text-center">
                      Simular Pago de Cliente en Mostrador:
                    </p>
                    <div className="grid grid-cols-3 gap-1.5">
                      <button
                        onClick={() => handleAprobarCobro('Mercado Pago (QR)')}
                        disabled={simulandoPago}
                        className="py-2.5 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-bold text-[11px] rounded-xl transition cursor-pointer text-center"
                      >
                        Mercado Pago
                      </button>
                      <button
                        onClick={() => handleAprobarCobro('MODO (Bancario)')}
                        disabled={simulandoPago}
                        className="py-2.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-[11px] rounded-xl transition cursor-pointer text-center"
                      >
                        MODO
                      </button>
                      <button
                        onClick={() => handleAprobarCobro('Cuenta DNI')}
                        disabled={simulandoPago}
                        className="py-2.5 bg-teal-600 hover:bg-teal-500 active:scale-95 text-white font-bold text-[11px] rounded-xl transition cursor-pointer text-center"
                      >
                        Cuenta DNI
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ------------------------------------------------------------- */}
              {/* PANTALLA 5: SEMÁFORO DE CONFIRMACIÓN VISUAL A 1.5M (HITO 5)    */}
              {/* ------------------------------------------------------------- */}
              {appStage === 'semaforo' && (
                <div className="flex-1 flex flex-col justify-between p-5 bg-emerald-500 text-slate-950">
                  <div className="text-center pt-2">
                    <span className="px-3 py-1 rounded-full bg-slate-950 text-emerald-400 text-xs font-black uppercase tracking-wider">
                      CONFIRMACIÓN VISUAL 1.5 METROS
                    </span>
                  </div>

                  {/* Semáforo Verde Gigante */}
                  <div className="my-auto text-center space-y-3">
                    <div className="w-24 h-24 mx-auto rounded-full bg-slate-950 text-emerald-400 flex items-center justify-center shadow-2xl border-4 border-white/40 animate-pulse">
                      <Check className="w-14 h-14 stroke-[3]" />
                    </div>

                    <div>
                      <h2 className="text-3xl font-black text-slate-950 tracking-tight uppercase">
                        PAGO APROBADO
                      </h2>
                      <p className="text-4xl font-black text-slate-950 font-mono mt-1">
                        ${ultimoCobroAprobado?.monto.toLocaleString('es-AR')}
                      </p>
                      <p className="text-xs font-bold text-slate-900 mt-1">
                        {ultimoCobroAprobado?.metodo} • {ultimoCobroAprobado?.hora}
                      </p>
                    </div>
                  </div>

                  {/* Acciones de Cierre de Venta */}
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setShowReceiptModal(true)}
                        className="py-3 bg-slate-950 hover:bg-slate-900 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition shadow-sm"
                      >
                        <Share2 className="w-4 h-4 text-emerald-400" />
                        <span>Enviar WhatsApp</span>
                      </button>
                      <button
                        onClick={() => setShowReceiptModal(true)}
                        className="py-3 bg-white hover:bg-slate-100 text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition shadow-sm"
                      >
                        <Printer className="w-4 h-4 text-slate-900" />
                        <span>Imprimir Ticket</span>
                      </button>
                    </div>

                    <button
                      onClick={() => setShowReceiptModal(true)}
                      className="w-full py-2.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-slate-950 font-bold text-xs rounded-xl border border-slate-950/20 flex items-center justify-center gap-1.5 cursor-pointer active:scale-98 transition"
                    >
                      <Receipt className="w-4 h-4" />
                      <span>Ver Comprobante Digital (58mm/80mm)</span>
                    </button>

                    <button
                      onClick={() => {
                        setAppStage('pos');
                        setNumpadValue('0');
                        setActiveRoadmapStep(3);
                      }}
                      className="w-full py-4 bg-slate-950 hover:bg-slate-900 text-white font-black text-sm rounded-2xl shadow-xl flex items-center justify-center gap-2 cursor-pointer active:scale-98 transition"
                    >
                      <Plus className="w-5 h-5" />
                      <span>NUEVA VENTA EN MOSTRADOR</span>
                    </button>
                  </div>
                </div>
              )}

              {/* ------------------------------------------------------------- */}
              {/* PANTALLA 6: CIERRE DE CAJA & ARQUEO Z (HITO 6)                 */}
              {/* ------------------------------------------------------------- */}
              {appStage === 'cierre' && (() => {
                const desglose = dbService.getDesgloseMetodos(cajaAsignada);
                const efEsperado = Number(fondoInicial) + desglose.totalEfectivoIngresos - desglose.totalEfectivoEgresos;
                const parsedContado = parseFloat(conteoFisicoArqueo);
                const efContado = isNaN(parsedContado) ? efEsperado : parsedContado;
                const difGaveta = efContado - efEsperado;

                const handleFinalizarTurnoMobile = async () => {
                  const cierreRec: CierreCajaRecord = {
                    id: `Z-${cajaAsignada}-${Date.now().toString().slice(-6)}`,
                    cajaId: cajaAsignada,
                    cajaNombre: `Terminal ${cajaAsignada}`,
                    cajero: currentUser?.name || 'Cajero 01',
                    fecha: new Date().toISOString().substring(0, 10),
                    horaApertura,
                    horaCierre: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    fondoInicial: Number(fondoInicial),
                    totalEfectivoIngresos: desglose.totalEfectivoIngresos,
                    totalEfectivoEgresos: desglose.totalEfectivoEgresos,
                    efectivoEsperado: efEsperado,
                    efectivoRealContado: efContado,
                    diferenciaEfectivo: difGaveta,
                    totalDigital: desglose.totalDigital,
                    desgloseDigital: desglose.desgloseDigital,
                    desgloseEfectivo: desglose.desgloseEfectivo,
                    totalFacturado: desglose.totalFacturado,
                    totalOperaciones: desglose.totalOperaciones,
                    ticketPromedio: desglose.ticketPromedio,
                    observaciones: cierreObservaciones,
                    creadoEn: new Date().toISOString(),
                  };

                  await dbService.saveCierreCaja(cierreRec);
                  alert(`✅ ¡Turno Finalizado!\nCaja ${cajaAsignada} cerrada con éxito.\nTotal Facturado: $${desglose.totalFacturado.toLocaleString('es-AR')}\nEl reporte fue guardado y sincronizado.`);
                  setIsCajaAbierta(false);
                  setIsPhoneLoggedIn(false);
                  setAppStage('login');
                  setActiveRoadmapStep(1);
                };

                const handleExportarCSVMobile = () => {
                  const cierreRec: CierreCajaRecord = {
                    id: `Z-${cajaAsignada}-${Date.now().toString().slice(-6)}`,
                    cajaId: cajaAsignada,
                    cajaNombre: `Terminal ${cajaAsignada}`,
                    cajero: currentUser?.name || 'Cajero 01',
                    fecha: new Date().toISOString().substring(0, 10),
                    horaApertura,
                    horaCierre: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    fondoInicial: Number(fondoInicial),
                    totalEfectivoIngresos: desglose.totalEfectivoIngresos,
                    totalEfectivoEgresos: desglose.totalEfectivoEgresos,
                    efectivoEsperado: efEsperado,
                    efectivoRealContado: efContado,
                    diferenciaEfectivo: difGaveta,
                    totalDigital: desglose.totalDigital,
                    desgloseDigital: desglose.desgloseDigital,
                    desgloseEfectivo: desglose.desgloseEfectivo,
                    totalFacturado: desglose.totalFacturado,
                    totalOperaciones: desglose.totalOperaciones,
                    ticketPromedio: desglose.ticketPromedio,
                    observaciones: cierreObservaciones,
                    creadoEn: new Date().toISOString(),
                  };
                  dbService.exportCierreConsolidadoCSV(cierreRec, desglose.transacciones);
                };

                return (
                  <div className="flex-1 flex flex-col justify-between p-3.5 bg-slate-50 text-slate-900 overflow-y-auto space-y-3">
                    <div className="space-y-2.5">
                      {/* Cabecera */}
                      <div className="flex items-center justify-between pb-1 border-b border-slate-200">
                        <div>
                          <h3 className="text-sm font-black text-slate-900">Arqueo & Cierre de Caja Z</h3>
                          <p className="text-[10px] text-slate-500">
                            {cajaAsignada} • Turno {horaApertura} a {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        <button
                          onClick={() => setAppStage('pos')}
                          className="text-[11px] font-bold text-slate-500 hover:text-slate-800 bg-white border border-slate-200 px-2 py-1 rounded-lg cursor-pointer"
                        >
                          Volver al POS
                        </button>
                      </div>

                      {/* Card Resumen Rápido */}
                      <div className="grid grid-cols-2 gap-1.5">
                        <div className="p-2.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
                          <span className="text-[9px] font-bold text-slate-400 uppercase">Total Facturado</span>
                          <p className="text-base font-black text-slate-900 font-mono">
                            ${desglose.totalFacturado.toLocaleString('es-AR')}
                          </p>
                          <span className="text-[9px] text-slate-500">{desglose.totalOperaciones} ventas aprobadas</span>
                        </div>
                        <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200/60 shadow-2xs">
                          <span className="text-[9px] font-bold text-emerald-700 uppercase">Efectivo Mostrador</span>
                          <p className="text-base font-black text-emerald-700 font-mono">
                            ${desglose.totalEfectivoIngresos.toLocaleString('es-AR')}
                          </p>
                          <span className="text-[9px] text-emerald-600 font-bold">{desglose.porcentajeEfectivo}% del total</span>
                        </div>
                      </div>

                      {/* Desglose por Método de Pago */}
                      <div className="p-2.5 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-1.5">
                        <div className="flex items-center justify-between text-[11px] font-black text-slate-800 border-b border-slate-100 pb-1">
                          <span className="flex items-center gap-1">
                            <CreditCard className="w-3.5 h-3.5 text-blue-600" />
                            Cobros Digitales ({desglose.porcentajeDigital}%)
                          </span>
                          <span className="font-mono text-blue-600 font-bold">
                            ${desglose.totalDigital.toLocaleString('es-AR')}
                          </span>
                        </div>

                        {desglose.desgloseDigital.length === 0 ? (
                          <p className="text-[10px] text-slate-400 italic text-center py-1">Sin cobros digitales</p>
                        ) : (
                          <div className="space-y-1">
                            {desglose.desgloseDigital.map((d) => (
                              <div key={d.metodo} className="flex justify-between items-center text-[10px] text-slate-600">
                                <span>{d.metodo} ({d.operaciones} ops)</span>
                                <span className="font-mono font-bold text-slate-900">${d.monto.toLocaleString('es-AR')}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Auditoría de Gaveta (Efectivo) */}
                      <div className="p-2.5 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-1.5 font-mono text-[11px]">
                        <div className="flex items-center justify-between font-black text-slate-900 font-sans border-b border-slate-100 pb-1">
                          <span className="flex items-center gap-1">
                            <Coins className="w-3.5 h-3.5 text-emerald-600" />
                            Auditoría de Gaveta
                          </span>
                          <span className="text-[10px] text-slate-400 font-normal">Fondo Inicial: ${Number(fondoInicial).toLocaleString('es-AR')}</span>
                        </div>

                        <div className="flex justify-between text-slate-600 text-[10px]">
                          <span>(+) Cobros Efectivo:</span>
                          <span className="font-bold text-emerald-600">+${desglose.totalEfectivoIngresos.toLocaleString('es-AR')}</span>
                        </div>
                        <div className="flex justify-between text-slate-600 text-[10px]">
                          <span>(-) Egresos Mostrador:</span>
                          <span className="font-bold text-rose-600">-${desglose.totalEfectivoEgresos.toLocaleString('es-AR')}</span>
                        </div>
                        <div className="flex justify-between font-bold text-slate-900 border-t border-slate-100 pt-1 text-[11px]">
                          <span>Efectivo Esperado:</span>
                          <span className="text-blue-600">${efEsperado.toLocaleString('es-AR')}</span>
                        </div>

                        {/* Conteo Real & Diferencia */}
                        <div className="pt-1 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-sans font-bold text-slate-700">Efectivo Físico Contado:</span>
                            <div className="relative w-28">
                              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-[10px]">$</span>
                              <input
                                type="number"
                                placeholder={efEsperado.toString()}
                                value={conteoFisicoArqueo}
                                onChange={(e) => setConteoFisicoArqueo(e.target.value)}
                                className="w-full pl-5 pr-2 py-1 text-right bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 focus:outline-hidden focus:border-blue-600"
                              />
                            </div>
                          </div>

                          <div
                            className={`p-1.5 rounded-lg border text-[10px] font-bold flex items-center justify-between ${
                              difGaveta === 0
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                : difGaveta > 0
                                ? 'bg-blue-50 text-blue-700 border-blue-300'
                                : 'bg-rose-50 text-rose-700 border-rose-300'
                            }`}
                          >
                            <span>
                              {difGaveta === 0 ? 'Gaveta Cuadrada Exacta' : difGaveta > 0 ? 'Sobrante en Gaveta' : 'Faltante en Gaveta'}
                            </span>
                            <span>{difGaveta > 0 ? '+' : ''}${difGaveta.toLocaleString('es-AR')}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Botonera de Exportación y Finalización de Turno */}
                    <div className="space-y-1.5 pt-1 shrink-0">
                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          onClick={handleExportarCSVMobile}
                          className="py-2.5 px-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-[11px] rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-98 transition"
                          title="Descargar reporte oficial consolidado"
                        >
                          <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Exportar CSV</span>
                        </button>

                        <button
                          onClick={() => setShowCierreModal(true)}
                          className="py-2.5 px-2 bg-white hover:bg-slate-100 text-slate-900 font-bold text-[11px] rounded-xl border border-slate-300 flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs active:scale-98 transition"
                        >
                          <Printer className="w-3.5 h-3.5 text-slate-700" />
                          <span>Ticket Z Fiscal</span>
                        </button>
                      </div>

                      <button
                        onClick={handleFinalizarTurnoMobile}
                        className="w-full py-3 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs rounded-xl shadow-md shadow-rose-600/20 flex items-center justify-center gap-2 cursor-pointer active:scale-98 transition"
                      >
                        <Lock className="w-4 h-4" />
                        <span>FINALIZAR TURNO & CERRAR CAJA</span>
                      </button>
                    </div>
                  </div>
                );
              })()}

              {/* DRAWER NUEVA ENTIDAD CUIT */}
              {showNewEntityDrawer && (
                <div className="absolute inset-0 z-40 bg-black/60 flex flex-col justify-end">
                  <div className="bg-white rounded-t-3xl p-5 space-y-3">
                    <div className="flex justify-between items-center">
                      <h4 className="font-black text-slate-900 text-sm">Alta de Cliente / Proveedor</h4>
                      <button onClick={() => setShowNewEntityDrawer(false)} className="text-slate-400 hover:text-slate-600">
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <input
                      type="text"
                      placeholder="Nombre o Razón Social"
                      value={nuevoNombre}
                      onChange={(e) => setNuevoNombre(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                    />

                    <input
                      type="text"
                      placeholder="CUIT (ej: 30-71122334-8)"
                      value={nuevoExtra}
                      onChange={(e) => {
                        setNuevoExtra(e.target.value);
                        setCuitFeedback(validateCUIT(e.target.value));
                      }}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                    />

                    {cuitFeedback && (
                      <p className={`text-[10px] font-bold ${cuitFeedback.valid ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {cuitFeedback.message}
                      </p>
                    )}

                    <button
                      onClick={() => {
                        if (nuevoNombre.trim()) {
                          dbService.saveEntity({
                            tipo: nuevoTipo,
                            nombre: nuevoNombre,
                            contacto: nuevoContacto || 'Sin contacto',
                            extra: nuevoExtra || 'Consumidor Final',
                            cuitValido: cuitFeedback?.valid || false,
                          });
                          refreshData();
                          setShowNewEntityDrawer(false);
                          setNuevoNombre('');
                          setNuevoExtra('');
                          setCuitFeedback(null);
                        }
                      }}
                      className="w-full py-3 bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
                    >
                      Guardar
                    </button>
                  </div>
                </div>
              )}

              {/* MODAL DE COMPROBANTE DIGITAL (TICKET TÉRMICO + ENVÍO WHATSAPP) */}
              <DigitalReceiptModal
                isOpen={showReceiptModal || selectedTx !== null}
                onClose={() => {
                  setShowReceiptModal(false);
                  setSelectedTx(null);
                }}
                receiptData={
                  selectedTx
                    ? {
                        id: selectedTx.id,
                        monto: selectedTx.monto,
                        hora: selectedTx.hora,
                        fecha: selectedTx.fecha,
                        metodo: selectedTx.metodo,
                        concepto: selectedTx.concepto,
                        cajaId: selectedTx.cajaId || cajaAsignada,
                        cajero: selectedTx.cajero || currentUser?.name || 'Cajero 01',
                      }
                    : {
                        id: ultimoCobroAprobado?.id || 'TX-901',
                        monto: ultimoCobroAprobado?.monto || 0,
                        hora:
                          ultimoCobroAprobado?.hora ||
                          new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                        metodo: ultimoCobroAprobado?.metodo || 'Mercado Pago (QR)',
                        concepto: concepto || 'Cobro Mostrador',
                        cajaId: cajaAsignada,
                        cajero: currentUser?.name || 'Cajero 01',
                      }
                }
                onNewSale={() => {
                  setShowReceiptModal(false);
                  setSelectedTx(null);
                  setAppStage('pos');
                  setNumpadValue('0');
                  setActiveRoadmapStep(3);
                }}
              />

              {/* MODAL COMPLETO DE CIERRE DE CAJA & ARQUEO Z (AUDITORÍA & EXPORTACIÓN CONSOLIDADA) */}
              <CierreDeCajaModal
                isOpen={showCierreModal}
                onClose={() => setShowCierreModal(false)}
                cajaId={cajaAsignada}
                cajaNombre={`Terminal ${cajaAsignada}`}
                cajeroNombre={currentUser?.name || 'Cajero 01'}
                fondoInicial={Number(fondoInicial)}
                horaApertura={horaApertura}
                onCierreSuccess={() => {
                  setShowCierreModal(false);
                  setIsCajaAbierta(false);
                  setIsPhoneLoggedIn(false);
                  setAppStage('login');
                  setActiveRoadmapStep(1);
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
