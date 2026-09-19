import React, { useState } from 'react';
import {
  QrCode,
  ShieldCheck,
  Zap,
  TrendingUp,
  CheckCircle2,
  ArrowRight,
  Store,
  Smartphone,
  ReceiptText,
  Lock,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

interface LandingViewProps {
  onNavigateLogin: () => void;
  onNavigatePOS: () => void;
  onNavigateMobile?: () => void;
}

export const LandingView: React.FC<LandingViewProps> = ({
  onNavigateLogin,
  onNavigatePOS,
  onNavigateMobile,
}) => {
  const [leadSent, setLeadSent] = useState(false);
  const [leadForm, setLeadForm] = useState({
    nombre: '',
    email: '',
    telefono: '',
    rubro: 'comercio',
  });

  const handleLeadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLeadSent(true);
    setTimeout(() => {
      setLeadSent(false);
      setLeadForm({ nombre: '', email: '', telefono: '', rubro: 'comercio' });
    }, 4000);
  };

  return (
    <div className="space-y-12">
      {/* Banner de Reforma */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-2xl p-5 shadow-lg flex flex-col md:flex-row items-center justify-between gap-4 border border-blue-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-700/60 rounded-xl">
            <Sparkles className="w-6 h-6 text-blue-300" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-300">
              Arquitectura Corregida • Vercel Ready
            </span>
            <h4 className="text-base font-semibold text-white">
              index.html ahora opera como la Landing Oficial del producto
            </h4>
            <p className="text-xs text-blue-200">
              Se eliminó la redirección forzada a login y se centralizó la captación comercial y acceso al POS.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {onNavigateMobile && (
            <button
              onClick={onNavigateMobile}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow transition cursor-pointer flex items-center gap-1.5"
            >
              <Smartphone className="w-4 h-4" /> Terminal Mobile First
            </button>
          )}
          <button
            onClick={onNavigatePOS}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow transition cursor-pointer flex items-center gap-1.5"
          >
            <Zap className="w-4 h-4" /> POS Desktop
          </button>
          <button
            onClick={onNavigateLogin}
            className="px-4 py-2 bg-white/15 hover:bg-white/25 text-white font-semibold text-xs rounded-xl transition cursor-pointer flex items-center gap-1.5"
          >
            <Lock className="w-4 h-4" /> Acceso Cajero
          </button>
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-slate-900 text-white p-8 md:p-14 border border-slate-800 shadow-2xl">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-20 w-80 h-80 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold">
            <QrCode className="w-3.5 h-3.5" /> Cobros QR Interoperables para el Comercio Físico
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Cobrá al instante en tu mostrador con{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-teal-300">
              confirmación visual inmediata
            </span>
            .
          </h1>

          <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl">
            LocalPay elimina las esperas en caja. Tu cliente escanea con Mercado Pago, MODO o cualquier billetera bancaria,
            y tu semáforo de cobro se enciende en verde al instante. Sin comisiones abusivas ni alquiler de posnet.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-4">
            {onNavigateMobile && (
              <button
                onClick={onNavigateMobile}
                className="px-6 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl shadow-lg shadow-emerald-500/20 flex items-center gap-2 text-sm transition cursor-pointer active:scale-95"
              >
                <Smartphone className="w-4 h-4" /> Probar Mobile POS (One-Thumb)
              </button>
            )}
            <button
              onClick={onNavigatePOS}
              className="px-6 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-600/30 flex items-center gap-2 text-sm transition cursor-pointer"
            >
              Terminal Desktop <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={onNavigateLogin}
              className="px-6 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl border border-slate-700 text-sm transition cursor-pointer flex items-center gap-2"
            >
              <Lock className="w-4 h-4 text-slate-400" /> Iniciar Sesión
            </button>
          </div>

          <div className="pt-6 border-t border-slate-800 grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> 0.8% comisión fija
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Acreditación en 0 seg
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Cierre de caja térmico
            </div>
          </div>
        </div>
      </section>

      {/* Funcionalidades del POS */}
      <section id="funcionalidades" className="scroll-mt-24 space-y-6">
        <div className="max-w-2xl">
          <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Producto</span>
          <h3 className="text-2xl font-bold text-slate-900 mt-1">Qué funcionalidades contiene el POS</h3>
          <p className="text-sm text-slate-600 mt-2">
            Terminal mobile-first lista para mostrador: cobro QR, cámara, cierre de caja y validación en pantalla.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-2">Semáforo de Validación</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Indicador ultra claro para el cajero. El radar detecta la transferencia y valida el cobro en pantalla gigante
              sin que el cliente deba mostrar el comprobante en su teléfono.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
              <QrCode className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-2">QR Autónomo Sin Dependencias</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Generación local en canvas mediante motor criptográfico interno. No depende de servidores caídos de terceros;
              tu mostrador nunca se queda sin cobrar.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition">
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4">
              <ReceiptText className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-2">Cierre de Caja y Fiscal</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Balance instantáneo de turnos, discriminación de clientes vs proveedores con validación de CUIT AFIP y exportación
              sanitizada sin riesgo de inyecciones CSV.
            </p>
          </div>
        </div>
      </section>

      {/* Comparativa vs Posnet Tradicional */}
      <section id="por-que" className="scroll-mt-24 bg-white rounded-3xl p-8 border border-slate-200 shadow-xs">
        <div className="max-w-2xl mb-6">
          <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Ahorro Directo</span>
          <h3 className="text-2xl font-bold text-slate-900 mt-1">¿Por qué cambiar tu terminal tradicional por LocalPay?</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-700">
                <th className="p-3 font-bold">Característica</th>
                <th className="p-3 font-bold text-slate-400">Posnet Tradicional</th>
                <th className="p-3 font-bold text-blue-600 bg-blue-50/60">LocalPay (Reforma Vercel)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              <tr>
                <td className="p-3 font-medium text-slate-900">Alquiler mensual del equipo</td>
                <td className="p-3 text-red-600 font-medium">$35.000 - $60.000 / mes</td>
                <td className="p-3 text-emerald-700 font-bold bg-blue-50/30">$0 (Cualquier celular o PC)</td>
              </tr>
              <tr>
                <td className="p-3 font-medium text-slate-900">Comisión por cobro QR</td>
                <td className="p-3 text-slate-600">3.5% a 6.0% + IVA</td>
                <td className="p-3 text-emerald-700 font-bold bg-blue-50/30">0.8% a 1.2% final</td>
              </tr>
              <tr>
                <td className="p-3 font-medium text-slate-900">Tiempo de Acreditación</td>
                <td className="p-3 text-slate-600">2 a 18 días hábiles</td>
                <td className="p-3 text-emerald-700 font-bold bg-blue-50/30">En el instante (CBU/CVU)</td>
              </tr>
              <tr>
                <td className="p-3 font-medium text-slate-900">Seguridad en Auth y Datos</td>
                <td className="p-3 text-slate-600">Cerrado / propietario</td>
                <td className="p-3 text-emerald-700 font-bold bg-blue-50/30">Tokens JWT + Vercel Serverless</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Formulario de Alta de Comercio */}
      <section className="bg-gradient-to-br from-slate-900 to-blue-950 rounded-3xl p-8 md:p-12 text-white shadow-xl border border-slate-800">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div className="space-y-4">
            <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">
              Formulario de Contacto
            </span>
            <h3 className="text-2xl sm:text-3xl font-bold">Sumá tu comercio a LocalPay</h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Dejanos los datos de tu negocio para activar tu caja en menos de 10 minutos.
            </p>
            <div className="flex items-center gap-4 text-xs text-blue-200">
              <span className="flex items-center gap-1.5">
                <Store className="w-4 h-4 text-teal-400" /> Apto almacén, súper, bazar
              </span>
              <span className="flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-teal-400" /> Sin hardware extra
              </span>
            </div>
          </div>

          <div className="bg-white text-slate-900 p-6 rounded-2xl shadow-xl">
            {leadSent ? (
              <div className="text-center py-8 space-y-3">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h4 className="font-bold text-lg text-slate-900">¡Solicitud Recibida!</h4>
                <p className="text-xs text-slate-600">
                  Nos comunicaremos a {leadForm.email || 'tu correo'} en los próximos minutos para dar de alta tu caja.
                </p>
              </div>
            ) : (
              <form onSubmit={handleLeadSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nombre del Comercio o Titular</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Autoservicio Mendoza"
                    value={leadForm.nombre}
                    onChange={(e) => setLeadForm({ ...leadForm, nombre: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Email de Contacto</label>
                    <input
                      type="email"
                      required
                      placeholder="comercio@ejemplo.com"
                      value={leadForm.email}
                      onChange={(e) => setLeadForm({ ...leadForm, email: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">WhatsApp / Teléfono</label>
                    <input
                      type="tel"
                      required
                      placeholder="+54 261 ..."
                      value={leadForm.telefono}
                      onChange={(e) => setLeadForm({ ...leadForm, telefono: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Rubro Principal</label>
                  <select
                    value={leadForm.rubro}
                    onChange={(e) => setLeadForm({ ...leadForm, rubro: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  >
                    <option value="comercio">Comercio Minorista / Almacén</option>
                    <option value="gastronomia">Gastronomía / Cafetería / Bar</option>
                    <option value="mayorista">Distribuidora / Mayorista</option>
                    <option value="servicios">Servicios / Profesionales</option>
                  </select>
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow transition cursor-pointer mt-2"
                >
                  Solicitar Activación de Cuenta
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};
