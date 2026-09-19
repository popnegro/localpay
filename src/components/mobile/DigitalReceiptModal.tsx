import React, { useState, useRef, useEffect } from 'react';
import {
  Printer,
  Share2,
  Copy,
  Check,
  X,
  Phone,
  MessageCircle,
  FileText,
  Download,
  Store,
  Calendar,
  Clock,
  QrCode,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import QRCode from 'qrcode';

export interface ReceiptData {
  id: string;
  monto: number;
  hora: string;
  fecha?: string;
  metodo: string;
  concepto?: string;
  cajaId?: string;
  cajero?: string;
  codigoAut?: string;
}

export interface ComercioInfo {
  nombre: string;
  razonSocial: string;
  cuit: string;
  direccion: string;
  sucursal: string;
  iibb?: string;
}

interface DigitalReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  receiptData: ReceiptData;
  comercioInfo?: ComercioInfo;
  onNewSale: () => void;
}

export const DigitalReceiptModal: React.FC<DigitalReceiptModalProps> = ({
  isOpen,
  onClose,
  receiptData,
  comercioInfo = {
    nombre: 'LocalPay Comercio Demo',
    razonSocial: 'LocalPay Retail S.A.S.',
    cuit: '30-71889922-4',
    direccion: 'Av. San Martín 1045, Mendoza',
    sucursal: 'Sucursal Mendoza Centro',
    iibb: '902-458129-0',
  },
  onNewSale,
}) => {
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [countryCode, setCountryCode] = useState<string>('549');
  const [copied, setCopied] = useState<boolean>(false);
  const [activeFormat, setActiveFormat] = useState<'58mm' | '80mm'>('58mm');
  const qrRef = useRef<HTMLCanvasElement | null>(null);

  const fechaActual = receiptData.fecha || new Date().toISOString().substring(0, 10);
  const horaActual = receiptData.hora || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const codigoAut = receiptData.codigoAut || `AUTH-${Math.floor(100000 + Math.random() * 900000)}`;

  // Generar QR de validación en el ticket
  useEffect(() => {
    if (isOpen && qrRef.current) {
      const payload = `https://localpay.app/val/${receiptData.id}?m=${receiptData.monto}&c=${comercioInfo.cuit}`;
      QRCode.toCanvas(
        qrRef.current,
        payload,
        {
          width: 96,
          margin: 1,
          color: {
            dark: '#111827',
            light: '#ffffff',
          },
        },
        (err) => {
          if (err) console.error('Error generando QR del ticket:', err);
        }
      );
    }
  }, [isOpen, receiptData, comercioInfo]);

  if (!isOpen) return null;

  // Generación del texto para WhatsApp
  const generateWhatsAppMessage = () => {
    return (
      `*COMPROBANTE DE PAGO DIGITAL*\n` +
      `--------------------------------\n` +
      `🏪 *${comercioInfo.nombre}*\n` +
      `📍 ${comercioInfo.direccion} (${comercioInfo.sucursal})\n` +
      `📑 CUIT: ${comercioInfo.cuit}\n` +
      `--------------------------------\n` +
      `💳 *Importe Cobrado:* $${receiptData.monto.toLocaleString('es-AR')} ARS\n` +
      `🏷️ *Concepto:* ${receiptData.concepto || 'Cobro Mostrador'}\n` +
      `📲 *Método:* ${receiptData.metodo}\n` +
      `🔢 *Operación:* ${receiptData.id}\n` +
      `🔑 *Autorización:* ${codigoAut}\n` +
      `📅 *Fecha y Hora:* ${fechaActual} - ${horaActual}\n` +
      `🖥️ *Terminal:* ${receiptData.cajaId || 'CAJA-01'} | Op: ${receiptData.cajero || 'Cajero'}\n` +
      `--------------------------------\n` +
      `✅ _Transacción validada en 0ms vía LocalPay Cloud._\n` +
      `🔗 Ver comprobante online: https://localpay.app/val/${receiptData.id}`
    );
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(generateWhatsAppMessage());
    let cleanPhone = phoneNumber.replace(/[^0-9]/g, '');

    // Si el usuario escribió el número, construir link con destinatario; de lo contrario abre selector de chats
    let url = `https://api.whatsapp.com/send?text=${text}`;
    if (cleanPhone.length >= 7) {
      if (!cleanPhone.startsWith(countryCode)) {
        cleanPhone = `${countryCode}${cleanPhone}`;
      }
      url = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${text}`;
    }

    // Intentar Web Share API si está en dispositivo móvil sin número especificado
    if (navigator.share && !phoneNumber) {
      navigator
        .share({
          title: `Ticket LocalPay - ${receiptData.id}`,
          text: generateWhatsAppMessage(),
        })
        .catch(() => {
          window.open(url, '_blank');
        });
    } else {
      window.open(url, '_blank');
    }
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(generateWhatsAppMessage());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrintTicket = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-fade-in no-print">
      {/* Contenedor Modal */}
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* ENCABEZADO MODAL */}
        <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500 text-slate-950 flex items-center justify-center font-black text-xs">
              LP
            </div>
            <div>
              <h3 className="font-black text-sm text-white leading-tight">Comprobante Digital</h3>
              <p className="text-[10px] text-slate-400">Ticket Térmico & Envío WhatsApp</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* SELECTOR DE ANCHO TÉRMICO */}
        <div className="px-5 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs shrink-0">
          <span className="text-[11px] font-bold text-slate-500">Formato Térmico:</span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveFormat('58mm')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                activeFormat === '58mm'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              58 mm (Estándar)
            </button>
            <button
              onClick={() => setActiveFormat('80mm')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                activeFormat === '80mm'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              80 mm (Ancho)
            </button>
          </div>
        </div>

        {/* CUERPO DEL TICKET TÉRMICO (SCROLLABLE) */}
        <div className="p-4 overflow-y-auto flex-1 bg-slate-100/70 flex justify-center">
          
          {/* TICKET PAPEL REAL */}
          <div
            id="thermal-receipt-container"
            className={`bg-white p-4 shadow-sm border border-slate-300 rounded-sm font-mono text-[11px] text-slate-900 leading-tight transition-all ${
              activeFormat === '58mm' ? 'w-[260px]' : 'w-[320px]'
            }`}
          >
            {/* Header Comercio */}
            <div className="text-center pb-2 border-b border-dashed border-slate-400 space-y-0.5">
              <p className="font-black text-xs uppercase tracking-wide">{comercioInfo.nombre}</p>
              <p className="text-[10px] text-slate-600">{comercioInfo.razonSocial}</p>
              <p className="text-[10px] text-slate-600">CUIT: {comercioInfo.cuit}</p>
              <p className="text-[10px] text-slate-600">IIBB: {comercioInfo.iibb}</p>
              <p className="text-[10px] text-slate-600">{comercioInfo.direccion}</p>
              <p className="text-[10px] text-slate-600">{comercioInfo.sucursal}</p>
            </div>

            {/* Metadatos Transacción */}
            <div className="py-2 border-b border-dashed border-slate-400 space-y-0.5 text-[10px]">
              <div className="flex justify-between">
                <span>FECHA: {fechaActual}</span>
                <span>HORA: {horaActual}</span>
              </div>
              <div className="flex justify-between">
                <span>CAJA: {receiptData.cajaId || 'CAJA-01'}</span>
                <span>OP: {receiptData.cajero || 'Cajero 01'}</span>
              </div>
              <div className="flex justify-between">
                <span>TICKET #: {receiptData.id.replace('tx_', '0001-')}</span>
                <span>AUT: {codigoAut}</span>
              </div>
            </div>

            {/* Desglose de Operación */}
            <div className="py-2.5 border-b border-dashed border-slate-400 space-y-1">
              <p className="font-bold text-[10px] uppercase text-slate-700">DESCRIPCIÓN</p>
              <div className="flex justify-between items-start">
                <span className="font-bold pr-2">{receiptData.concepto || 'Cobro Mostrador'}</span>
                <span className="font-black whitespace-nowrap font-mono">
                  ${receiptData.monto.toLocaleString('es-AR')}
                </span>
              </div>
              <p className="text-[9px] text-slate-500">Forma de Pago: {receiptData.metodo}</p>
            </div>

            {/* Total Destacado */}
            <div className="py-2.5 border-b-2 border-slate-900 space-y-1">
              <div className="flex justify-between items-center text-sm font-black">
                <span>TOTAL:</span>
                <span className="text-base">${receiptData.monto.toLocaleString('es-AR')} ARS</span>
              </div>
              <div className="flex justify-between text-[9px] text-slate-500">
                <span>IVA Incluido (21%):</span>
                <span>${Math.round((receiptData.monto * 0.21) / 1.21).toLocaleString('es-AR')}</span>
              </div>
            </div>

            {/* QR y Clave de Validación */}
            <div className="pt-3 pb-1 text-center space-y-1.5 flex flex-col items-center">
              <canvas ref={qrRef} className="border border-slate-200 p-1 bg-white" />
              <p className="text-[8px] text-slate-500 max-w-[200px] leading-tight">
                Consulte validez digital de este comprobante escaneando el código QR oficial.
              </p>
              <p className="text-[9px] font-black text-slate-800">¡GRACIAS POR SU COMPRA!</p>
              <div className="text-[7px] text-slate-400 tracking-widest pt-1">
                -- LOCALPAY VERIFIED 0MS --
              </div>
            </div>
          </div>
        </div>

        {/* ACCIONES: ENVÍO POR WHATSAPP & IMPRESIÓN */}
        <div className="p-4 bg-white border-t border-slate-200 space-y-3 shrink-0">
          
          {/* Input de Teléfono para WhatsApp */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-700 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-emerald-600" />
                <span>Enviar ticket por WhatsApp al cliente:</span>
              </span>
              <span className="text-[10px] text-slate-400 font-normal">Opcional</span>
            </label>
            <div className="flex items-center gap-1.5">
              <span className="px-2.5 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 shrink-0">
                +{countryCode}
              </span>
              <input
                type="tel"
                placeholder="261 455-8899 (sin 0 ni 15)"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
              <button
                onClick={handleShareWhatsApp}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md shadow-emerald-600/20 cursor-pointer transition shrink-0"
              >
                <MessageCircle className="w-4 h-4 fill-current" />
                <span>Enviar</span>
              </button>
            </div>
          </div>

          {/* Botonera Principal de Acciones */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={handlePrintTicket}
              className="py-2.5 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-800 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 border border-slate-300 transition cursor-pointer"
            >
              <Printer className="w-4 h-4 text-slate-700" />
              <span>Imprimir Ticket</span>
            </button>

            <button
              onClick={handleCopyText}
              className="py-2.5 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-800 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 border border-slate-300 transition cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-700" />}
              <span>{copied ? '¡Texto Copiado!' : 'Copiar Texto'}</span>
            </button>
          </div>

          {/* Botón de Siguiente Venta */}
          <button
            onClick={() => {
              onClose();
              onNewSale();
            }}
            className="w-full py-3 bg-slate-950 hover:bg-slate-900 active:scale-98 text-white font-black text-xs rounded-xl shadow-lg flex items-center justify-center gap-2 cursor-pointer transition"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>LISTO • REGISTRAR NUEVA VENTA</span>
          </button>
        </div>
      </div>
    </div>
  );
};
