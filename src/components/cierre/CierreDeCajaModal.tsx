import React, { useState, useMemo } from 'react';
import {
  X,
  Printer,
  Share2,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Coins,
  QrCode,
  CreditCard,
  Building2,
  ArrowDownRight,
  ArrowUpRight,
  Lock,
  Calculator,
  ChevronDown,
  ChevronUp,
  Receipt,
  FileText,
  User,
  Clock,
  Send,
  Copy,
  Check,
} from 'lucide-react';
import { dbService, CierreCajaRecord, Transaction, DesgloseMetodo } from '../../services/dbService';

interface CierreDeCajaModalProps {
  isOpen: boolean;
  onClose: () => void;
  cajaId?: string;
  cajaNombre?: string;
  cajeroNombre?: string;
  fondoInicial?: number;
  horaApertura?: string;
  onShiftClosed?: () => void;
}

export const CierreDeCajaModal: React.FC<CierreDeCajaModalProps> = ({
  isOpen,
  onClose,
  cajaId = 'CAJA-01',
  cajaNombre = 'Terminal Mostrador Principal',
  cajeroNombre = 'Cajero 01',
  fondoInicial = 15000,
  horaApertura = '08:30',
  onShiftClosed,
}) => {
  const [activeTab, setActiveTab] = useState<'arqueo' | 'ticketZ'>('arqueo');
  const [observaciones, setObservaciones] = useState<string>('');
  const [conteoManual, setConteoManual] = useState<string>('');
  const [showCalculadoraBilletes, setShowCalculadoraBilletes] = useState<boolean>(false);
  const [isClosing, setIsClosing] = useState<boolean>(false);
  const [closureSuccess, setClosureSuccess] = useState<CierreCajaRecord | null>(null);
  const [copiedWA, setCopiedWA] = useState<boolean>(false);

  // Denominación de Billetes en Pesos Argentinos (ARS)
  const [billetes, setBilletes] = useState<{ [denominacion: number]: number }>({
    20000: 0,
    10000: 0,
    2000: 0,
    1000: 0,
    500: 0,
    200: 0,
    100: 0,
  });

  // Cálculo del desglose de la caja actual
  const desgloseData = useMemo(() => {
    return dbService.getDesgloseMetodos(cajaId);
  }, [cajaId, isOpen]);

  // Cálculo de efectivo contado (manual o asistido por calculadora)
  const totalBilletesCalculados = useMemo(() => {
    return Object.entries(billetes).reduce((acc, [den, cant]) => acc + Number(den) * cant, 0);
  }, [billetes]);

  // Si el usuario usó la calculadora de billetes y hay valor, toma ese; si no, el input directo
  const efectivoRealContado = useMemo(() => {
    if (totalBilletesCalculados > 0) return totalBilletesCalculados;
    const parsed = parseFloat(conteoManual);
    return isNaN(parsed) ? fondoInicial + desgloseData.totalEfectivoIngresos - desgloseData.totalEfectivoEgresos : parsed;
  }, [conteoManual, totalBilletesCalculados, fondoInicial, desgloseData]);

  // Efectivo teórico en gaveta
  const efectivoEsperado = useMemo(() => {
    return fondoInicial + desgloseData.totalEfectivoIngresos - desgloseData.totalEfectivoEgresos;
  }, [fondoInicial, desgloseData]);

  // Diferencia de gaveta
  const diferenciaEfectivo = efectivoRealContado - efectivoEsperado;

  // Actualizar conteo de billetes
  const handleUpdateBillete = (denominacion: number, cantidad: number) => {
    const val = Math.max(0, isNaN(cantidad) ? 0 : cantidad);
    setBilletes((prev) => ({
      ...prev,
      [denominacion]: val,
    }));
  };

  const horaActual = useMemo(() => {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }, []);

  const fechaHoy = useMemo(() => {
    return new Date().toISOString().substring(0, 10);
  }, []);

  const cierreRecord: CierreCajaRecord = useMemo(() => {
    return {
      id: `Z-${cajaId}-${Date.now().toString().slice(-6)}`,
      cajaId,
      cajaNombre,
      cajero: cajeroNombre,
      fecha: fechaHoy,
      horaApertura,
      horaCierre: horaActual,
      fondoInicial,
      totalEfectivoIngresos: desgloseData.totalEfectivoIngresos,
      totalEfectivoEgresos: desgloseData.totalEfectivoEgresos,
      efectivoEsperado,
      efectivoRealContado,
      diferenciaEfectivo,
      totalDigital: desgloseData.totalDigital,
      desgloseDigital: desgloseData.desgloseDigital,
      desgloseEfectivo: desgloseData.desgloseEfectivo,
      totalFacturado: desgloseData.totalFacturado,
      totalOperaciones: desgloseData.totalOperaciones,
      ticketPromedio: desgloseData.ticketPromedio,
      observaciones,
      creadoEn: new Date().toISOString(),
    };
  }, [
    cajaId,
    cajaNombre,
    cajeroNombre,
    fechaHoy,
    horaApertura,
    horaActual,
    fondoInicial,
    desgloseData,
    efectivoEsperado,
    efectivoRealContado,
    diferenciaEfectivo,
    observaciones,
  ]);

  if (!isOpen) return null;

  // Manejar exportación CSV consolidado
  const handleExportCSV = () => {
    dbService.exportCierreConsolidadoCSV(cierreRecord, desgloseData.transacciones);
  };

  // Manejar impresión del Ticket Z
  const handlePrintTicket = () => {
    window.print();
  };

  // Formatear texto para compartir por WhatsApp
  const generateWhatsAppMessage = () => {
    const difStr =
      cierreRecord.diferenciaEfectivo === 0
        ? '✅ Gaveta Cuadrada ($0)'
        : cierreRecord.diferenciaEfectivo > 0
        ? `⚠️ Sobrante: +$${cierreRecord.diferenciaEfectivo.toLocaleString('es-AR')}`
        : `🚨 FALTANTE: -$${Math.abs(cierreRecord.diferenciaEfectivo).toLocaleString('es-AR')}`;

    return `*📊 REPORTE DE CIERRE DE CAJA (ARQUEO Z)*
*LocalPay POS - Terminal ${cierreRecord.cajaId}*
━━━━━━━━━━━━━━━━━━━━
📅 *Fecha:* ${cierreRecord.fecha}
⏰ *Turno:* ${cierreRecord.horaApertura} a ${cierreRecord.horaCierre}
👤 *Operador:* ${cierreRecord.cajero}
━━━━━━━━━━━━━━━━━━━━
💰 *TOTAL FACTURADO:* $${cierreRecord.totalFacturado.toLocaleString('es-AR')}
🧾 *Operaciones Aprobadas:* ${cierreRecord.totalOperaciones}
📊 *Ticket Promedio:* $${cierreRecord.ticketPromedio.toLocaleString('es-AR')}

*💳 DESGLOSE POR MÉTODO:*
• *Efectivo Mostrador:* $${cierreRecord.totalEfectivoIngresos.toLocaleString('es-AR')} (${desgloseData.porcentajeEfectivo}%)
• *Cobros Digitales (QR/Tarjetas):* $${cierreRecord.totalDigital.toLocaleString('es-AR')} (${desgloseData.porcentajeDigital}%)

*💵 AUDITORÍA DE GAVETA:*
• Fondo Inicial Apertura: $${cierreRecord.fondoInicial.toLocaleString('es-AR')}
• (+) Entradas Efectivo: $${cierreRecord.totalEfectivoIngresos.toLocaleString('es-AR')}
• (-) Salidas Mostrador: $${cierreRecord.totalEfectivoEgresos.toLocaleString('es-AR')}
• (=) Efectivo Esperado: $${cierreRecord.efectivoEsperado.toLocaleString('es-AR')}
• (✓) Efectivo Real Contado: $${cierreRecord.efectivoRealContado.toLocaleString('es-AR')}
• *Diferencia:* ${difStr}
━━━━━━━━━━━━━━━━━━━━
${cierreRecord.observaciones ? `📝 *Observaciones:* ${cierreRecord.observaciones}\n━━━━━━━━━━━━━━━━━━━━\n` : ''}🔒 *Estado:* Turno Finalizado y Sincronizado en Cloud`;
  };

  const handleShareWhatsApp = () => {
    const text = generateWhatsAppMessage();
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleCopySummary = () => {
    navigator.clipboard.writeText(generateWhatsAppMessage());
    setCopiedWA(true);
    setTimeout(() => setCopiedWA(false), 2500);
  };

  // Confirmar y guardar Cierre de Turno
  const handleFinalizeShift = async () => {
    setIsClosing(true);
    try {
      await dbService.saveCierreCaja(cierreRecord);
      setClosureSuccess(cierreRecord);
      if (onShiftClosed) {
        onShiftClosed();
      }
    } catch (e) {
      console.error('Error cerrando caja:', e);
    } finally {
      setIsClosing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        {/* HEADER MODAL */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white">Arqueo & Cierre de Caja (Z)</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {cajaId}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Operador: <strong className="text-slate-200">{cajeroNombre}</strong> • Apertura: {horaApertura} hs
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Tabs Arqueo vs Ticket Z */}
            <div className="hidden sm:flex bg-slate-800 p-1 rounded-xl border border-slate-700 text-xs">
              <button
                onClick={() => setActiveTab('arqueo')}
                className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                  activeTab === 'arqueo' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                Auditoría & Desglose
              </button>
              <button
                onClick={() => setActiveTab('ticketZ')}
                className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'ticketZ' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>Ticket Z Oficial</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* CONTENIDO PRINCIPAL */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* SI EL CIERRE YA SE COMPLETÓ CON ÉXITO */}
          {closureSuccess ? (
            <div className="text-center py-8 space-y-4 max-w-lg mx-auto">
              <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-3xl flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-xl font-black text-white">¡Turno Finalizado & Caja Cerrada!</h4>
                <p className="text-xs text-slate-400 mt-1">
                  El arqueo {closureSuccess.id} ha sido consolidado y guardado en Firestore. El balance neto final fue de{' '}
                  <strong className="text-emerald-400">
                    ${(closureSuccess.totalFacturado - closureSuccess.totalEfectivoEgresos).toLocaleString('es-AR')}
                  </strong>
                  .
                </p>
              </div>

              {/* Botones de acción post-cierre */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <button
                  onClick={handleExportCSV}
                  className="py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-98 transition"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Descargar CSV Consolidado</span>
                </button>
                <button
                  onClick={handleShareWhatsApp}
                  className="py-3 px-4 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer border border-slate-700 active:scale-98 transition"
                >
                  <Share2 className="w-4 h-4 text-emerald-400" />
                  <span>Enviar a Supervisor</span>
                </button>
              </div>

              <div className="pt-4">
                <button
                  onClick={onClose}
                  className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Volver al Mostrador
                </button>
              </div>
            </div>
          ) : activeTab === 'arqueo' ? (
            <>
              {/* TOP CARDS: RESUMEN EJECUTIVO */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {/* Total Facturado */}
                <div className="p-3.5 bg-slate-800/80 border border-slate-700/80 rounded-2xl">
                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
                    <span>Total Facturado</span>
                    <span className="text-emerald-400 font-bold">{desgloseData.totalOperaciones} ops</span>
                  </div>
                  <p className="text-lg sm:text-xl font-black text-white font-mono mt-1">
                    ${desgloseData.totalFacturado.toLocaleString('es-AR')}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Ticket Promedio: ${desgloseData.ticketPromedio.toLocaleString('es-AR')}
                  </p>
                </div>

                {/* Total Efectivo */}
                <div className="p-3.5 bg-emerald-950/40 border border-emerald-600/30 rounded-2xl">
                  <div className="flex items-center justify-between text-[11px] text-emerald-300 font-medium">
                    <span className="flex items-center gap-1">
                      <Coins className="w-3.5 h-3.5 text-emerald-400" /> Efectivo
                    </span>
                    <span className="text-[10px] font-bold bg-emerald-500/20 px-1.5 py-0.2 rounded text-emerald-300 font-mono">
                      {desgloseData.porcentajeEfectivo}%
                    </span>
                  </div>
                  <p className="text-lg sm:text-xl font-black text-emerald-400 font-mono mt-1">
                    ${desgloseData.totalEfectivoIngresos.toLocaleString('es-AR')}
                  </p>
                  <p className="text-[10px] text-emerald-300/70 mt-0.5">
                    Mostrador físico
                  </p>
                </div>

                {/* Total Digital */}
                <div className="p-3.5 bg-blue-950/40 border border-blue-600/30 rounded-2xl">
                  <div className="flex items-center justify-between text-[11px] text-blue-300 font-medium">
                    <span className="flex items-center gap-1">
                      <QrCode className="w-3.5 h-3.5 text-blue-400" /> Digital
                    </span>
                    <span className="text-[10px] font-bold bg-blue-500/20 px-1.5 py-0.2 rounded text-blue-300 font-mono">
                      {desgloseData.porcentajeDigital}%
                    </span>
                  </div>
                  <p className="text-lg sm:text-xl font-black text-blue-400 font-mono mt-1">
                    ${desgloseData.totalDigital.toLocaleString('es-AR')}
                  </p>
                  <p className="text-[10px] text-blue-300/70 mt-0.5">
                    QR, Tarjetas y MODO
                  </p>
                </div>

                {/* Salidas / Egresos */}
                <div className="p-3.5 bg-rose-950/30 border border-rose-600/30 rounded-2xl">
                  <div className="flex items-center justify-between text-[11px] text-rose-300 font-medium">
                    <span className="flex items-center gap-1">
                      <ArrowDownRight className="w-3.5 h-3.5 text-rose-400" /> Salidas Caja
                    </span>
                  </div>
                  <p className="text-lg sm:text-xl font-black text-rose-400 font-mono mt-1">
                    -${desgloseData.totalEfectivoEgresos.toLocaleString('es-AR')}
                  </p>
                  <p className="text-[10px] text-rose-300/70 mt-0.5">
                    Gastos / Proveedores
                  </p>
                </div>
              </div>

              {/* GRILLA: DESGLOSE DETALLADO EFECTIVO VS DIGITAL */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* COLUMNA 1: DESGLOSE DE COBROS DIGITALES */}
                <div className="p-4 bg-slate-800/60 border border-slate-700/80 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-700/60 pb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400">
                        <CreditCard className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                          Canales Digitales (Sin Efectivo)
                        </h4>
                        <p className="text-[10px] text-slate-400">
                          Acreditación inmediata vía Webhooks y QR interoperable
                        </p>
                      </div>
                    </div>
                    <span className="font-mono font-bold text-xs text-blue-400">
                      ${desgloseData.totalDigital.toLocaleString('es-AR')}
                    </span>
                  </div>

                  {desgloseData.desgloseDigital.length === 0 ? (
                    <p className="text-xs text-slate-400 py-3 text-center italic">
                      No se registraron cobros digitales en este turno.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {desgloseData.desgloseDigital.map((met) => (
                        <div
                          key={met.metodo}
                          className="p-2.5 bg-slate-900/60 rounded-xl border border-slate-700/40 flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center gap-2">
                            {met.metodo.toLowerCase().includes('qr') || met.metodo.toLowerCase().includes('pago') ? (
                              <QrCode className="w-4 h-4 text-emerald-400" />
                            ) : met.metodo.toLowerCase().includes('tarjeta') ? (
                              <CreditCard className="w-4 h-4 text-purple-400" />
                            ) : (
                              <Building2 className="w-4 h-4 text-blue-400" />
                            )}
                            <div>
                              <p className="font-bold text-white">{met.metodo}</p>
                              <p className="text-[10px] text-slate-400">
                                {met.operaciones} {met.operaciones === 1 ? 'ticket' : 'tickets'} • {met.porcentaje}% del total
                              </p>
                            </div>
                          </div>
                          <span className="font-mono font-bold text-sm text-white">
                            ${met.monto.toLocaleString('es-AR')}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="p-2.5 bg-blue-950/30 rounded-xl border border-blue-500/20 text-[11px] text-blue-300 flex justify-between">
                    <span>Comisión estimada de procesamiento digital (~1.2%):</span>
                    <span className="font-mono font-bold">
                      -${Math.round(desgloseData.totalDigital * 0.012).toLocaleString('es-AR')}
                    </span>
                  </div>
                </div>

                {/* COLUMNA 2: ARQUEO DE GAVETA & EFECTIVO FÍSICO */}
                <div className="p-4 bg-slate-800/60 border border-slate-700/80 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-700/60 pb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                        <Coins className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                          Arqueo de Gaveta (Efectivo)
                        </h4>
                        <p className="text-[10px] text-slate-400">
                          Balance teórico vs conteo físico del cajero
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowCalculadoraBilletes(!showCalculadoraBilletes)}
                      className="text-[10px] font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-500/20"
                    >
                      <Calculator className="w-3 h-3" />
                      <span>{showCalculadoraBilletes ? 'Ocultar Billetes' : 'Contar Billetes'}</span>
                    </button>
                  </div>

                  {/* Tabla de arqueo de gaveta */}
                  <div className="bg-slate-900/80 rounded-xl p-3 space-y-1.5 font-mono text-xs border border-slate-800">
                    <div className="flex justify-between text-slate-400">
                      <span>Fondo Inicial Apertura:</span>
                      <span className="text-white font-bold">${fondoInicial.toLocaleString('es-AR')}</span>
                    </div>
                    <div className="flex justify-between text-emerald-400 font-bold">
                      <span>(+) Ventas Mostrador (Efectivo):</span>
                      <span>+${desgloseData.totalEfectivoIngresos.toLocaleString('es-AR')}</span>
                    </div>
                    <div className="flex justify-between text-rose-400 font-bold">
                      <span>(-) Salidas y Gastos:</span>
                      <span>-${desgloseData.totalEfectivoEgresos.toLocaleString('es-AR')}</span>
                    </div>
                    <div className="border-t border-slate-700 pt-1.5 flex justify-between font-black text-sm text-white">
                      <span>EFECTIVO ESPERADO EN GAVETA:</span>
                      <span className="text-blue-400">${efectivoEsperado.toLocaleString('es-AR')}</span>
                    </div>
                  </div>

                  {/* DESPLEGABLE CALCULADORA DE BILLETES ARS */}
                  {showCalculadoraBilletes && (
                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2 text-xs">
                      <div className="flex justify-between items-center text-[11px] font-bold text-emerald-300">
                        <span>Denominación (ARS)</span>
                        <span>Cantidad Billetes</span>
                        <span>Subtotal</span>
                      </div>
                      <div className="space-y-1 max-h-44 overflow-y-auto pr-1">
                        {[20000, 10000, 2000, 1000, 500, 200, 100].map((den) => (
                          <div key={den} className="flex items-center justify-between gap-2">
                            <span className="w-16 font-mono text-slate-300 font-bold">${den}</span>
                            <input
                              type="number"
                              min="0"
                              value={billetes[den] || ''}
                              placeholder="0"
                              onChange={(e) => handleUpdateBillete(den, parseInt(e.target.value) || 0)}
                              className="w-20 p-1 text-center bg-slate-800 border border-slate-700 rounded text-xs font-mono text-white"
                            />
                            <span className="w-24 text-right font-mono font-bold text-slate-300">
                              ${((billetes[den] || 0) * den).toLocaleString('es-AR')}
                            </span>
                          </div>
                        ))}
                      </div>
                      <div className="border-t border-slate-800 pt-1.5 flex justify-between font-bold text-xs text-emerald-400">
                        <span>Total Contado Billetes:</span>
                        <span className="font-mono">${totalBilletesCalculados.toLocaleString('es-AR')}</span>
                      </div>
                    </div>
                  )}

                  {/* INPUT CONTEO FÍSICO REAL & RESULTADO AUDITORÍA */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <label className="font-bold text-slate-300">Efectivo Físico Contado:</label>
                      <div className="relative w-40">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono">$</span>
                        <input
                          type="number"
                          placeholder={efectivoEsperado.toString()}
                          value={conteoManual}
                          onChange={(e) => setConteoManual(e.target.value)}
                          className="w-full pl-7 pr-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs font-mono font-bold text-right text-white focus:outline-hidden focus:border-blue-500"
                        />
                      </div>
                    </div>

                    {/* Badge de Diferencia de Gaveta */}
                    <div
                      className={`p-2.5 rounded-xl border flex items-center justify-between text-xs font-mono font-bold ${
                        diferenciaEfectivo === 0
                          ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500/30'
                          : diferenciaEfectivo > 0
                          ? 'bg-blue-950/40 text-blue-300 border-blue-500/30'
                          : 'bg-rose-950/40 text-rose-400 border-rose-500/30'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        {diferenciaEfectivo === 0 ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-amber-400" />
                        )}
                        <span>
                          {diferenciaEfectivo === 0
                            ? 'Gaveta Cuadrada Exacta'
                            : diferenciaEfectivo > 0
                            ? 'Sobrante de Caja'
                            : 'FALTANTE DE CAJA'}
                        </span>
                      </div>
                      <span className="text-sm">
                        {diferenciaEfectivo > 0 ? '+' : ''}${diferenciaEfectivo.toLocaleString('es-AR')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* OBSERVACIONES */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Observaciones del Turno / Justificación de Gastos:</label>
                <textarea
                  rows={2}
                  placeholder="Ej: Se retiró efectivo para flete; caja cerrada en horario normal sin incidentes..."
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  className="w-full p-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-blue-500"
                />
              </div>

              {/* BOTONERA INFERIOR DE ACCIONES */}
              <div className="pt-2 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={handleExportCSV}
                    className="py-2.5 px-3.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer border border-slate-700 transition"
                    title="Exportar CSV con formato RFC-4180 y UTF-8 BOM para Excel"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                    <span>Exportar CSV Consolidado</span>
                  </button>

                  <button
                    onClick={handleShareWhatsApp}
                    className="py-2.5 px-3.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer border border-slate-700 transition"
                  >
                    <Share2 className="w-4 h-4 text-emerald-400" />
                    <span>WhatsApp</span>
                  </button>

                  <button
                    onClick={handleCopySummary}
                    className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1 cursor-pointer border border-slate-700 transition"
                    title="Copiar texto de cierre"
                  >
                    {copiedWA ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => setActiveTab('ticketZ')}
                    className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer border border-slate-700 transition sm:hidden"
                  >
                    <Receipt className="w-4 h-4" />
                    <span>Ver Ticket Z</span>
                  </button>

                  <button
                    onClick={handleFinalizeShift}
                    disabled={isClosing}
                    className="flex-1 sm:flex-none py-3 px-6 bg-rose-600 hover:bg-rose-500 active:scale-98 text-white font-black text-xs rounded-xl shadow-xl flex items-center justify-center gap-2 cursor-pointer transition"
                  >
                    <Lock className="w-4 h-4" />
                    <span>{isClosing ? 'CERRANDO TURNO...' : 'FINALIZAR TURNO & CERRAR CAJA'}</span>
                  </button>
                </div>
              </div>
            </>
          ) : (
            /* TAB 2: PREVISUALIZACIÓN DE TICKET TÉRMICO Z (80MM OFICIAL) */
            <div className="space-y-4 max-w-md mx-auto">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Formato de impresión: <strong>Ticket Fiscal Z (80 mm)</strong></span>
                <button
                  onClick={() => setActiveTab('arqueo')}
                  className="text-blue-400 hover:underline font-bold"
                >
                  ← Volver a edición
                </button>
              </div>

              {/* TICKET TÉRMICO Z SIMULADO */}
              <div
                id="thermal-receipt-container"
                className="bg-white text-slate-950 p-6 rounded-2xl shadow-xl font-mono text-xs space-y-3 border border-slate-300 select-text"
              >
                {/* CABECERA */}
                <div className="text-center pb-3 border-b-2 border-dashed border-slate-900 space-y-1">
                  <p className="font-black text-base tracking-wider">LOCALPAY POS</p>
                  <p className="text-[10px] font-bold text-slate-600">SISTEMA INTEGRADO DE MOSTRADOR</p>
                  <p className="text-[10px] text-slate-500">CUIT: 30-71889922-4 • IVA RESPONSABLE INSCRIPTO</p>
                  <div className="pt-1">
                    <span className="inline-block px-2 py-0.5 bg-slate-950 text-white font-bold text-[10px] rounded">
                      COMPROBANTE OFICIAL DE CIERRE Z
                    </span>
                  </div>
                  <p className="text-[9px] text-slate-400 pt-1">ID: {cierreRecord.id}</p>
                </div>

                {/* METADATOS */}
                <div className="space-y-1 text-[11px] pb-2 border-b border-dashed border-slate-300">
                  <div className="flex justify-between">
                    <span>TERMINAL / CAJA:</span>
                    <span className="font-bold">{cajaId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>CAJERO / OPERADOR:</span>
                    <span className="font-bold">{cajeroNombre}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>FECHA:</span>
                    <span>{fechaHoy}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>TURNO:</span>
                    <span>{horaApertura} hs a {horaActual} hs</span>
                  </div>
                </div>

                {/* DESGLOSE POR MÉTODO DE PAGO */}
                <div className="space-y-1 pb-2 border-b border-dashed border-slate-300">
                  <p className="font-bold text-[11px] uppercase">1. DESGLOSE POR MÉTODO:</p>
                  <div className="flex justify-between text-slate-800">
                    <span>Efectivo Mostrador:</span>
                    <span className="font-bold">${desgloseData.totalEfectivoIngresos.toLocaleString('es-AR')}</span>
                  </div>
                  {desgloseData.desgloseDigital.map((d) => (
                    <div key={d.metodo} className="flex justify-between text-slate-800">
                      <span>{d.metodo} ({d.operaciones}):</span>
                      <span className="font-bold">${d.monto.toLocaleString('es-AR')}</span>
                    </div>
                  ))}
                  <div className="border-t border-slate-300 pt-1 flex justify-between font-black text-xs">
                    <span>TOTAL FACTURADO:</span>
                    <span>${desgloseData.totalFacturado.toLocaleString('es-AR')}</span>
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-600">
                    <span>Tickets Emitidos:</span>
                    <span>{desgloseData.totalOperaciones} comprobantes</span>
                  </div>
                </div>

                {/* AUDITORÍA DE GAVETA */}
                <div className="space-y-1 pb-2 border-b border-dashed border-slate-300">
                  <p className="font-bold text-[11px] uppercase">2. AUDITORÍA DE GAVETA:</p>
                  <div className="flex justify-between">
                    <span>Fondo Inicial:</span>
                    <span>${fondoInicial.toLocaleString('es-AR')}</span>
                  </div>
                  <div className="flex justify-between text-slate-800">
                    <span>(+) Entradas Efectivo:</span>
                    <span>+${desgloseData.totalEfectivoIngresos.toLocaleString('es-AR')}</span>
                  </div>
                  <div className="flex justify-between text-slate-800">
                    <span>(-) Salidas / Egresos:</span>
                    <span>-${desgloseData.totalEfectivoEgresos.toLocaleString('es-AR')}</span>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span>(=) Efectivo Esperado:</span>
                    <span>${efectivoEsperado.toLocaleString('es-AR')}</span>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span>(✓) Efectivo Contado:</span>
                    <span>${efectivoRealContado.toLocaleString('es-AR')}</span>
                  </div>
                  <div className="flex justify-between font-black pt-1 border-t border-slate-200">
                    <span>DIFERENCIA:</span>
                    <span className={diferenciaEfectivo < 0 ? 'text-rose-600' : 'text-slate-900'}>
                      {diferenciaEfectivo === 0
                        ? '$0 (EXACTA)'
                        : `${diferenciaEfectivo > 0 ? '+' : ''}$${diferenciaEfectivo.toLocaleString('es-AR')}`}
                    </span>
                  </div>
                </div>

                {observaciones && (
                  <div className="pb-2 border-b border-dashed border-slate-300 text-[10px]">
                    <p className="font-bold">OBSERVACIONES:</p>
                    <p className="text-slate-700 italic">{observaciones}</p>
                  </div>
                )}

                {/* FIRMAS DE RESPONSABILIDAD */}
                <div className="pt-4 grid grid-cols-2 gap-4 text-center text-[10px]">
                  <div className="border-t border-slate-400 pt-1">
                    <p className="font-bold">FIRMA CAJERO</p>
                    <p className="text-[9px] text-slate-500">{cajeroNombre}</p>
                  </div>
                  <div className="border-t border-slate-400 pt-1">
                    <p className="font-bold">FIRMA SUPERVISOR</p>
                    <p className="text-[9px] text-slate-500">Auditoría / Gerencia</p>
                  </div>
                </div>

                {/* PIE DE SEGURIDAD */}
                <div className="text-center pt-2 text-[9px] text-slate-500">
                  <p>REGISTRO ENCRIPTADO Y SINCRONIZADO</p>
                  <p>LOCALPAY CLOUD DATABASE • FIRESTORE OK</p>
                </div>
              </div>

              {/* ACCIONES TICKET */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={handlePrintTicket}
                  className="py-3 bg-white hover:bg-slate-100 text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition shadow-sm"
                >
                  <Printer className="w-4 h-4 text-slate-900" />
                  <span>Imprimir Ticket Z</span>
                </button>
                <button
                  onClick={handleShareWhatsApp}
                  className="py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition shadow-sm border border-slate-700"
                >
                  <Share2 className="w-4 h-4 text-emerald-400" />
                  <span>WhatsApp</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
