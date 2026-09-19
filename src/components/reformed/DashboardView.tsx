import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import {
  QrCode,
  Radio,
  CheckCircle2,
  AlertTriangle,
  Printer,
  Download,
  Plus,
  Trash2,
  Search,
  ArrowUpRight,
  ArrowDownLeft,
  DollarSign,
  TrendingUp,
  Store,
  User,
  ShieldCheck,
  Building2,
  RefreshCw,
  BellRing,
  Sparkles,
  Lock,
} from 'lucide-react';
import { dbService, Entity, Transaction } from '../../services/dbService';
import { validateCUIT } from '../../utils/cuitValidator';
import type { AuthUser } from '../../services/authService';
import { CierreDeCajaModal } from '../cierre/CierreDeCajaModal';

interface DashboardViewProps {
  currentUser: AuthUser | null;
  onLogout: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ currentUser, onLogout }) => {
  // Modal de Cierre de Caja & Arqueo Z
  const [showCierreModal, setShowCierreModal] = useState<boolean>(false);

  // Estado de cobro y semáforo
  const [cobroMonto, setCobroMonto] = useState<number>(4500);
  const [cobroConcepto, setCobroConcepto] = useState<string>('Venta Mostrador');
  const [semaforoEstado, setSemaforoEstado] = useState<'esperando' | 'aprobado'>('esperando');
  const [ultimoCobroAprobado, setUltimoCobroAprobado] = useState<{
    id: string;
    monto: number;
    hora: string;
    metodo: string;
  } | null>(null);

  // Canvas del QR autónomo local
  const qrCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [qrPayload, setQrPayload] = useState<string>('');

  // Transacciones y KPIs
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [kpis, setKpis] = useState(dbService.getKPIs());
  const [filtroTx, setFiltroTx] = useState<'todos' | 'ingreso' | 'egreso'>('todos');
  const [busquedaTx, setBusquedaTx] = useState<string>('');

  // Entidades (Clientes / Proveedores)
  const [entities, setEntities] = useState<Entity[]>([]);
  const [filtroEntidad, setFiltroEntidad] = useState<'todos' | 'cliente' | 'proveedor'>('todos');
  const [busquedaEntidad, setBusquedaEntidad] = useState<string>('');

  // Formulario nueva entidad
  const [nuevoTipo, setNuevoTipo] = useState<'cliente' | 'proveedor'>('cliente');
  const [nuevoNombre, setNuevoNombre] = useState<string>('');
  const [nuevoContacto, setNuevoContacto] = useState<string>('');
  const [nuevoExtra, setNuevoExtra] = useState<string>('');
  const [cuitFeedback, setCuitFeedback] = useState<{ valid: boolean; message: string } | null>(null);

  // Radar simulación
  const [radarActivo, setRadarActivo] = useState<boolean>(true);
  const [simulandoPago, setSimulandoPago] = useState<boolean>(false);

  // Cargar datos iniciales
  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    setTransactions(dbService.getTransactions());
    setEntities(dbService.getEntities());
    setKpis(dbService.getKPIs());
  };

  // Generar QR Autónomo localmente sin api.qrserver.com
  useEffect(() => {
    const payload = `localpay://pay?amount=${cobroMonto}&caja=${currentUser?.cajaId || 'CAJA-01'}&ref=TX-${Date.now()}`;
    setQrPayload(payload);

    if (qrCanvasRef.current) {
      QRCode.toCanvas(
        qrCanvasRef.current,
        payload,
        {
          width: 180,
          margin: 1,
          color: {
            dark: '#0f172a',
            light: '#ffffff',
          },
        },
        (error) => {
          if (error) console.error('Error generando QR local:', error);
        }
      );
    }
  }, [cobroMonto, currentUser]);

  // Validar CUIT en vivo cuando cambia el campo extra en proveedores
  useEffect(() => {
    if (nuevoTipo === 'proveedor' && nuevoExtra.trim().length > 0) {
      const res = validateCUIT(nuevoExtra);
      setCuitFeedback({ valid: res.valid, message: res.message });
    } else {
      setCuitFeedback(null);
    }
  }, [nuevoTipo, nuevoExtra]);

  // Simulación de detección en el Radar (llamada a /api/cobros/webhook)
  const handleSimularPagoCliente = async () => {
    setSimulandoPago(true);

    try {
      // Intento de notificación a Vercel Serverless
      await fetch('/api/cobros/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentId: 'PAY-' + Date.now(),
          amount: cobroMonto,
          payerInfo: 'Cliente Billetera QR (Mercado Pago)',
        }),
      }).catch(() => null);
    } catch {
      // Ignorar si offline
    }

    setTimeout(() => {
      setSimulandoPago(false);
      // Cambiar semáforo a aprobado
      setSemaforoEstado('aprobado');

      // Persistir transacción en dbService
      const newTx = dbService.addTransaction({
        tipo: 'ingreso',
        metodo: 'QR Interoperable',
        monto: cobroMonto,
        concepto: cobroConcepto,
        cajero: currentUser?.name || 'Caja 01',
        estado: 'aprobado',
      });

      setUltimoCobroAprobado({
        id: newTx.codigo,
        monto: newTx.monto,
        hora: newTx.hora,
        metodo: newTx.metodo,
      });

      refreshData();
    }, 1200);
  };

  const handleNuevoCobro = () => {
    setSemaforoEstado('esperando');
    setUltimoCobroAprobado(null);
    setCobroMonto(3200);
    setCobroConcepto('Venta Mostrador');
  };

  const handleCrearEntidad = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoNombre.trim()) return;

    if (nuevoTipo === 'proveedor') {
      const cuitCheck = validateCUIT(nuevoExtra);
      if (!cuitCheck.valid) {
        alert('Por favor ingrese un CUIT fiscalmente válido para el proveedor.');
        return;
      }
    }

    dbService.saveEntity({
      tipo: nuevoTipo,
      nombre: nuevoNombre,
      contacto: nuevoContacto,
      extra: nuevoExtra,
      cuitValido: nuevoTipo === 'proveedor',
    });

    setNuevoNombre('');
    setNuevoContacto('');
    setNuevoExtra('');
    setCuitFeedback(null);
    refreshData();
  };

  const handleEliminarEntidad = (id: string) => {
    dbService.deleteEntity(id);
    refreshData();
  };

  const handleImprimirCierre = () => {
    window.print();
  };

  // Filtrado de transacciones
  const filteredTxs = transactions.filter((t) => {
    const matchTipo = filtroTx === 'todos' || t.tipo === filtroTx;
    const matchBusqueda =
      t.concepto.toLowerCase().includes(busquedaTx.toLowerCase()) ||
      t.codigo.toLowerCase().includes(busquedaTx.toLowerCase());
    return matchTipo && matchBusqueda;
  });

  // Filtrado de entidades
  const filteredEntities = entities.filter((e) => {
    const matchTipo = filtroEntidad === 'todos' || e.tipo === filtroEntidad;
    const matchBusqueda =
      e.nombre.toLowerCase().includes(busquedaEntidad.toLowerCase()) ||
      e.contacto.toLowerCase().includes(busquedaEntidad.toLowerCase()) ||
      e.extra.toLowerCase().includes(busquedaEntidad.toLowerCase());
    return matchTipo && matchBusqueda;
  });

  return (
    <div className="space-y-8">
      {/* Barra superior de estado de sesión unificada */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4 no-print">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900">
                LocalPay Terminal • {currentUser?.branch || 'Sucursal Principal'}
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                Sesión Unificada Activa
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Operador: <strong>{currentUser?.name || 'Administrador'}</strong> ({currentUser?.role?.toUpperCase() || 'ADMIN'}) • ID de Caja:{' '}
              <code>{currentUser?.cajaId || 'CAJA-01'}</code>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCierreModal(true)}
            className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
          >
            <Lock className="w-4 h-4 text-rose-600" /> Cierre de Caja & Arqueo Z
          </button>
          <button
            onClick={handleImprimirCierre}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
          >
            <Printer className="w-4 h-4" /> Imprimir Ticket
          </button>
          <button
            onClick={onLogout}
            className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl text-xs font-semibold transition cursor-pointer"
          >
            Cerrar Sesión
          </button>
        </div>
      </div>

      {/* Tarjetas de KPIs Dinámicos */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 no-print">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase">Ingresos de Hoy</span>
          <p className="text-xl font-extrabold text-emerald-600 mt-1">
            ${kpis.ingresos.toLocaleString('es-AR')}
          </p>
          <span className="text-[10px] text-slate-400">Total cobrado en mostrador</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase">Egresos / Gastos</span>
          <p className="text-xl font-extrabold text-red-600 mt-1">
            ${kpis.egresos.toLocaleString('es-AR')}
          </p>
          <span className="text-[10px] text-slate-400">Salidas y pagos a proveedores</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase">Balance Neto en Caja</span>
          <p className="text-xl font-extrabold text-slate-900 mt-1">
            ${kpis.balanceNeto.toLocaleString('es-AR')}
          </p>
          <span className="text-[10px] text-emerald-600 font-semibold">Calculado en tiempo real</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase">Ticket Promedio</span>
          <p className="text-xl font-extrabold text-blue-600 mt-1">
            ${kpis.ticketPromedio.toLocaleString('es-AR')}
          </p>
          <span className="text-[10px] text-slate-400">{kpis.totalVentas} cobros aprobados</span>
        </div>
      </div>

      {/* Bloque Central: Mostrador POS + Semáforo de Cobro + QR Autónomo */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 no-print">
        {/* Panel Izquierdo: Cobro y QR Autónomo */}
        <div className="lg:col-span-6 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <QrCode className="w-5 h-5 text-blue-600" />
                Generador de Cobro QR (Autónomo)
              </h3>
              <p className="text-xs text-slate-500">
                Renderizado en Canvas local. Sin depender de servidores caídos externos.
              </p>
            </div>
            <span className="px-2.5 py-1 bg-blue-50 text-blue-700 text-[10px] font-bold rounded-lg border border-blue-200">
              Offline-Ready
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Monto a Cobrar ($)</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 font-bold">$</span>
                <input
                  type="number"
                  min="100"
                  step="100"
                  value={cobroMonto}
                  onChange={(e) => setCobroMonto(Number(e.target.value))}
                  className="w-full pl-8 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-base font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Concepto</label>
              <input
                type="text"
                value={cobroConcepto}
                onChange={(e) => setCobroConcepto(e.target.value)}
                placeholder="Ej. Artículos Varios"
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Canvas Local de QR */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-center gap-6">
            <div className="p-3 bg-white rounded-xl shadow-xs border border-slate-200 flex items-center justify-center">
              <canvas ref={qrCanvasRef} className="rounded-lg max-w-[180px] max-h-[180px]" />
            </div>

            <div className="space-y-3 text-center sm:text-left">
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400">Total a Pagar</span>
                <p className="text-2xl font-black text-slate-900">
                  ${cobroMonto.toLocaleString('es-AR')}
                </p>
                <p className="text-[11px] text-slate-500">Escaneable con cualquier app bancaria o billetera</p>
              </div>

              <div className="pt-2">
                <button
                  onClick={handleSimularPagoCliente}
                  disabled={simulandoPago || semaforoEstado === 'aprobado'}
                  className="w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-300 text-white font-bold text-xs rounded-xl shadow transition cursor-pointer flex items-center justify-center gap-2"
                >
                  {simulandoPago ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" /> Procesando pago del cliente...
                    </>
                  ) : semaforoEstado === 'aprobado' ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-300" /> Cobro Aprobado
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-blue-200" /> Simular Pago de Cliente
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Panel Derecho: Semáforo de Cobro y Radar */}
        <div className="lg:col-span-6 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Radio className="w-5 h-5 text-emerald-600" />
                  Semáforo de Validación en Mostrador
                </h3>
                <p className="text-xs text-slate-500">
                  Confirmación sensorial inmediata para el cajero (Acierto clave de UX de LocalPay)
                </p>
              </div>

              <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-600">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Radar Conectado
              </div>
            </div>

            {/* Visual del Semáforo */}
            {semaforoEstado === 'esperando' ? (
              <div className="p-8 rounded-3xl bg-slate-900 text-white text-center space-y-4 border border-slate-800 relative overflow-hidden">
                <div className="w-20 h-20 rounded-full bg-amber-500/20 border-4 border-amber-400/80 mx-auto flex items-center justify-center animate-pulse">
                  <Radio className="w-10 h-10 text-amber-400" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-white">Esperando Lectura de Pago...</h4>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                    El radar escucha activamente transferencias y billeteras interoperables. Al impactar el pago, el
                    semáforo cambiará a verde automáticamente.
                  </p>
                </div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 text-slate-300 text-xs">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                  Terminal lista en espera de ${cobroMonto.toLocaleString('es-AR')}
                </div>
              </div>
            ) : (
              <div className="p-8 rounded-3xl bg-emerald-600 text-white text-center space-y-4 border border-emerald-500 shadow-xl shadow-emerald-600/20">
                <div className="w-20 h-20 rounded-full bg-white/20 border-4 border-white mx-auto flex items-center justify-center">
                  <CheckCircle2 className="w-12 h-12 text-white" />
                </div>
                <div>
                  <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-200">
                    Transacción Confirmada
                  </span>
                  <h4 className="text-3xl font-black text-white mt-1">¡COBRO APROBADO!</h4>
                  <p className="text-sm text-emerald-100 font-semibold mt-1">
                    ${ultimoCobroAprobado?.monto.toLocaleString('es-AR')} acreditados en cuenta
                  </p>
                </div>

                <div className="bg-emerald-700/60 rounded-xl p-3 text-xs text-emerald-100 flex items-center justify-around">
                  <span>Código: <strong>{ultimoCobroAprobado?.id}</strong></span>
                  <span>Hora: <strong>{ultimoCobroAprobado?.hora}</strong></span>
                  <span>Método: <strong>{ultimoCobroAprobado?.metodo}</strong></span>
                </div>
              </div>
            )}
          </div>

          <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
            <button
              onClick={handleNuevoCobro}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition cursor-pointer"
            >
              + Nuevo Cobro en Mostrador
            </button>
            <span className="text-[11px] text-slate-400">
              Registrado por {currentUser?.name || 'Cajero'}
            </span>
          </div>
        </div>
      </div>

      {/* Sección: Gestión de Entidades (XSS Protegido + CUIT Módulo 11) */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-6 no-print">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-600" />
              <h3 className="text-base font-bold text-slate-900">
                Directorio de Entidades (Clientes y Proveedores)
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Reforma Crítica P0 aplicada: Inyecciones XSS neutralizadas y CUITs auditados con algoritmo Módulo 11.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => dbService.exportEntitiesToCSV()}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl flex items-center gap-1.5 transition cursor-pointer"
              title="Descarga CSV saneado con comillas RFC y neutralización de inyección de fórmulas"
            >
              <Download className="w-4 h-4 text-slate-600" /> Exportar CSV Seguro
            </button>
          </div>
        </div>

        {/* Formulario de Registro Seguro */}
        <form onSubmit={handleCrearEntidad} className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
          <span className="text-xs font-bold text-slate-700 block">Registrar Nueva Entidad</span>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Tipo</label>
              <select
                value={nuevoTipo}
                onChange={(e) => setNuevoTipo(e.target.value as any)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              >
                <option value="cliente">Cliente (Consumidor / Comercio)</option>
                <option value="proveedor">Proveedor (Con CUIT obligatorio)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Nombre / Razón Social</label>
              <input
                type="text"
                required
                placeholder="Ej. Distribuidora Andes"
                value={nuevoNombre}
                onChange={(e) => setNuevoNombre(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Email o Teléfono</label>
              <input
                type="text"
                placeholder="contacto@empresa.com"
                value={nuevoContacto}
                onChange={(e) => setNuevoContacto(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                {nuevoTipo === 'proveedor' ? 'CUIT (11 Dígitos AFIP)' : 'Rubro / Actividad'}
              </label>
              <input
                type="text"
                required
                placeholder={nuevoTipo === 'proveedor' ? '30-71122334-8' : 'Ej. Panadería'}
                value={nuevoExtra}
                onChange={(e) => setNuevoExtra(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>
          </div>

          {cuitFeedback && (
            <div
              className={`p-2 rounded-xl text-xs flex items-center gap-2 ${
                cuitFeedback.valid
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}
            >
              {cuitFeedback.valid ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              )}
              <span>{cuitFeedback.message}</span>
            </div>
          )}

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow transition cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Guardar Entidad Segura
            </button>
          </div>
        </form>

        {/* Tabla de Entidades */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
              <button
                onClick={() => setFiltroEntidad('todos')}
                className={`px-3 py-1 rounded-lg cursor-pointer transition ${
                  filtroEntidad === 'todos' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-600'
                }`}
              >
                Todos ({entities.length})
              </button>
              <button
                onClick={() => setFiltroEntidad('cliente')}
                className={`px-3 py-1 rounded-lg cursor-pointer transition ${
                  filtroEntidad === 'cliente' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-600'
                }`}
              >
                Clientes
              </button>
              <button
                onClick={() => setFiltroEntidad('proveedor')}
                className={`px-3 py-1 rounded-lg cursor-pointer transition ${
                  filtroEntidad === 'proveedor' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-600'
                }`}
              >
                Proveedores
              </button>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={busquedaEntidad}
                onChange={(e) => setBusquedaEntidad(e.target.value)}
                placeholder="Buscar entidad..."
                className="pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 w-full sm:w-64 focus:outline-hidden focus:border-blue-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-2xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 font-bold">
                  <th className="p-3">Tipo</th>
                  <th className="p-3">Nombre / Razón Social</th>
                  <th className="p-3">Contacto</th>
                  <th className="p-3">CUIT / Rubro</th>
                  <th className="p-3">Registrado</th>
                  <th className="p-3 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEntities.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-slate-400">
                      No se encontraron entidades registradas con ese criterio.
                    </td>
                  </tr>
                ) : (
                  filteredEntities.map((ent) => (
                    <tr key={ent.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                            ent.tipo === 'cliente'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-purple-100 text-purple-800'
                          }`}
                        >
                          {ent.tipo.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-3 font-semibold text-slate-900">{ent.nombre}</td>
                      <td className="p-3 text-slate-600">{ent.contacto || '-'}</td>
                      <td className="p-3 font-mono text-slate-700">
                        {ent.extra}
                        {ent.tipo === 'proveedor' && (
                          <span className="ml-1.5 inline-block text-[10px] text-emerald-600 font-bold font-sans">
                            ✓ AFIP
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-slate-400 text-[11px]">{ent.fechaRegistro}</td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => handleEliminarEntidad(ent.id)}
                          className="p-1 text-slate-400 hover:text-red-600 rounded-lg transition cursor-pointer"
                          title="Eliminar entidad"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Historial de Movimientos Persistente */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4 no-print">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">Historial de Transacciones de Turno</h3>
            <p className="text-xs text-slate-500">
              Persistido localmente con cálculo dinámico de caja. No se borra al recargar la página.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={busquedaTx}
                onChange={(e) => setBusquedaTx(e.target.value)}
                placeholder="Buscar por código o concepto..."
                className="pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 w-full sm:w-60 focus:outline-hidden focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded-2xl">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 font-bold">
                <th className="p-3">Código</th>
                <th className="p-3">Concepto</th>
                <th className="p-3">Método</th>
                <th className="p-3">Cajero</th>
                <th className="p-3">Hora</th>
                <th className="p-3 text-right">Monto</th>
                <th className="p-3 text-center">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTxs.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50/80 transition">
                  <td className="p-3 font-mono font-bold text-slate-900">{t.codigo}</td>
                  <td className="p-3 font-medium text-slate-800">{t.concepto}</td>
                  <td className="p-3 text-slate-600">{t.metodo}</td>
                  <td className="p-3 text-slate-500">{t.cajero}</td>
                  <td className="p-3 text-slate-400">{t.hora}</td>
                  <td
                    className={`p-3 text-right font-bold font-mono ${
                      t.tipo === 'ingreso' ? 'text-emerald-600' : 'text-red-600'
                    }`}
                  >
                    {t.tipo === 'ingreso' ? '+' : '-'}${t.monto.toLocaleString('es-AR')}
                  </td>
                  <td className="p-3 text-center">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      {t.estado.toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Comprobante de Cierre de Caja Optimizado para Impresión (@media print) */}
      <div className="hidden print:block font-mono text-slate-900 p-4 max-w-sm mx-auto text-xs space-y-4">
        <div className="text-center border-b pb-3 space-y-1">
          <h2 className="text-base font-bold tracking-tight">LOCALPAY - CIERRE DE CAJA</h2>
          <p className="text-[10px]">COMPROBANTE OFICIAL DE TURNO</p>
          <p className="text-[10px]">Sucursal: {currentUser?.branch || 'Mendoza Centro'}</p>
          <p className="text-[10px]">Caja: {currentUser?.cajaId || 'CAJA-01'}</p>
          <p className="text-[10px]">Fecha: {new Date().toLocaleDateString('es-AR')}</p>
          <p className="text-[10px]">Hora: {new Date().toLocaleTimeString('es-AR')}</p>
        </div>

        <div className="space-y-1 border-b pb-3 text-xs">
          <div className="flex justify-between">
            <span>OPERADOR:</span>
            <span className="font-bold">{currentUser?.name || 'Cajero'}</span>
          </div>
          <div className="flex justify-between">
            <span>TOTAL INGRESOS:</span>
            <span className="font-bold">${kpis.ingresos.toLocaleString('es-AR')}</span>
          </div>
          <div className="flex justify-between">
            <span>TOTAL EGRESOS:</span>
            <span className="font-bold">${kpis.egresos.toLocaleString('es-AR')}</span>
          </div>
          <div className="flex justify-between font-bold text-sm pt-1 border-t">
            <span>BALANCE NETO:</span>
            <span>${kpis.balanceNeto.toLocaleString('es-AR')}</span>
          </div>
        </div>

        <div className="space-y-1 border-b pb-3">
          <span className="font-bold block">ÚLTIMAS TRANSACCIONES:</span>
          {transactions.slice(0, 5).map((t) => (
            <div key={t.id} className="flex justify-between text-[10px]">
              <span>{t.codigo} ({t.metodo.substring(0, 10)})</span>
              <span>${t.monto.toLocaleString('es-AR')}</span>
            </div>
          ))}
        </div>

        <div className="text-center pt-2 space-y-2">
          <p className="text-[10px]">Firma de conformidad del responsable de turno:</p>
          <div className="h-10 border-b border-dashed border-slate-400 w-3/4 mx-auto" />
          <p className="text-[9px] text-slate-500">Sistema LocalPay verificado en Vercel Serverless</p>
        </div>
      </div>

      {/* Modal Completo de Cierre de Caja & Arqueo Z */}
      <CierreDeCajaModal
        isOpen={showCierreModal}
        onClose={() => setShowCierreModal(false)}
        cajaId={currentUser?.cajaId || 'CAJA-01'}
        cajaNombre={`Terminal ${currentUser?.cajaId || 'CAJA-01'}`}
        cajeroNombre={currentUser?.name || 'Administrador'}
        fondoInicial={15000}
        horaApertura="08:00"
        onCierreSuccess={() => {
          setShowCierreModal(false);
          setKpis(dbService.getKPIs());
          setTransactions(dbService.getTransactions());
        }}
      />
    </div>
  );
};
