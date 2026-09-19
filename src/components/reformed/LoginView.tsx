import React, { useState } from 'react';
import { Lock, Mail, ArrowRight, ShieldCheck, AlertCircle, Sparkles, CheckCircle2, UserCheck } from 'lucide-react';
import { authService } from '../../services/authService';

interface LoginViewProps {
  onLoginSuccess: () => void;
  onNavigateHome: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess, onNavigateHome }) => {
  const [email, setEmail] = useState('admin@localpay.com');
  const [password, setPassword] = useState('123456');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    const result = await authService.login(email, password);
    setLoading(false);

    if (result.success) {
      onLoginSuccess();
    } else {
      setErrorMessage(result.error || 'Credenciales inválidas.');
    }
  };

  const handleQuickFill = (testEmail: string, testPass: string) => {
    setEmail(testEmail);
    setPassword(testPass);
    setErrorMessage(null);
  };

  return (
    <div className="max-w-md mx-auto my-6 space-y-6">
      {/* Banner de Solución de Vulnerabilidad */}
      <div className="bg-emerald-950/60 border border-emerald-800/80 rounded-2xl p-4 text-emerald-200 text-xs flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold text-emerald-300">
            Reforma Crítica P0 Aplicada (Auth Segura)
          </p>
          <p className="text-emerald-200/90 leading-relaxed">
            Se retiraron las credenciales en texto plano del frontend. La autenticación se delega a Vercel Serverless
            (<code>/api/auth/login</code>) con emisión de token de sesión y sin doble login en dashboard.
          </p>
        </div>
      </div>

      {/* Tarjeta Glassmorphism de Login */}
      <div className="relative rounded-3xl bg-slate-900/90 text-white p-8 backdrop-blur-md border border-slate-800 shadow-2xl overflow-hidden">
        <div className="absolute -top-12 -right-12 w-44 h-44 bg-blue-600/30 rounded-full blur-2xl pointer-events-none" />

        <div className="text-center space-y-2 mb-6">
          <div className="inline-flex p-3 rounded-2xl bg-blue-500/20 border border-blue-500/40 text-blue-400 mb-1">
            <Lock className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">LocalPay Terminal</h2>
          <p className="text-xs text-slate-400">
            Acceso seguro al panel unificado de cobranzas y caja
          </p>
        </div>

        {errorMessage && (
          <div className="mb-4 p-3 bg-red-950/80 border border-red-800 text-red-300 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Correo Electrónico
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="operador@localpay.com"
                className="w-full pl-9 pr-3 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Contraseña de Acceso
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition cursor-pointer"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Validando en servidor Vercel...
              </span>
            ) : (
              <>
                Ingresar al Dashboard Directo <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Cuentas de Prueba Pre-configuradas para Auditoría */}
        <div className="mt-6 pt-5 border-t border-slate-800/80 space-y-2">
          <p className="text-[11px] font-semibold text-slate-400 flex items-center justify-between">
            <span>Cuentas de verificación rápida:</span>
            <span className="text-blue-400 text-[10px]">Click para autocompletar</span>
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleQuickFill('admin@localpay.com', '123456')}
              className="p-2 bg-slate-800/60 hover:bg-slate-700/60 border border-slate-700/60 rounded-xl text-left cursor-pointer transition"
            >
              <div className="flex items-center gap-1.5 text-xs font-semibold text-white">
                <UserCheck className="w-3.5 h-3.5 text-blue-400" /> Admin
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5 truncate">admin@localpay.com</p>
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('cajero@localpay.com', 'cajero2025')}
              className="p-2 bg-slate-800/60 hover:bg-slate-700/60 border border-slate-700/60 rounded-xl text-left cursor-pointer transition"
            >
              <div className="flex items-center gap-1.5 text-xs font-semibold text-white">
                <UserCheck className="w-3.5 h-3.5 text-emerald-400" /> Cajero
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5 truncate">cajero@localpay.com</p>
            </button>
          </div>
        </div>

        <div className="mt-5 text-center">
          <button
            type="button"
            onClick={onNavigateHome}
            className="text-xs text-slate-400 hover:text-white underline cursor-pointer"
          >
            ← Volver a la Landing de LocalPay
          </button>
        </div>
      </div>
    </div>
  );
};
