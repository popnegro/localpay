import React, { useState } from 'react';
import { ShieldAlert, CheckCircle2, RotateCcw, ArrowRight, Play, Lock, AlertOctagon, Terminal } from 'lucide-react';

export const FlowSimulator: React.FC = () => {
  const [mode, setMode] = useState<'broken' | 'fixed'>('broken');
  const [step, setStep] = useState<number>(1);
  const [loginEmail, setLoginEmail] = useState('admin@localpay.com');
  const [loginPass, setLoginPass] = useState('123456');
  const [dashEmail, setDashEmail] = useState('');
  const [dashPass, setDashPass] = useState('');
  const [sessionKeys, setSessionKeys] = useState<{ [key: string]: string | null }>({});

  const resetSimulation = () => {
    setStep(1);
    setSessionKeys({});
    setDashEmail('');
    setDashPass('');
  };

  const handleModeSwitch = (newMode: 'broken' | 'fixed') => {
    setMode(newMode);
    resetSimulation();
  };

  const executeFirstLogin = () => {
    if (mode === 'broken') {
      // Current repository behavior in login.html:
      const newKeys = {
        isLoggedIn: 'true',
        userName: 'Admin Sucursal',
      };
      setSessionKeys(newKeys);
      setStep(2); // Redirects to dashboard.html
    } else {
      // Fixed unified auth behavior:
      const newKeys = {
        lp_token: 'jwt_mock_secure_token_98234710',
        lp_user: JSON.stringify({ name: 'Admin Sucursal', role: 'admin' }),
      };
      setSessionKeys(newKeys);
      setStep(3); // Directly enters unified dashboard without 2nd login!
    }
  };

  const executeSecondLogin = () => {
    // Current repository behavior in dashboard.html:
    setSessionKeys((prev) => ({
      ...prev,
      lp_session: 'active',
    }));
    setStep(3);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Terminal className="w-5 h-5 text-blue-600" />
              <span>Simulador Interactivo: Conflicto de Sesión & Solución</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Experimenta el bug real de navegación entre <code>login.html</code> y <code>dashboard.html</code> y compáralo con el flujo refactorizado.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => handleModeSwitch('broken')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                mode === 'broken'
                  ? 'bg-rose-600 text-white shadow'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Comportamiento Actual (Roto)
            </button>
            <button
              onClick={() => handleModeSwitch('fixed')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                mode === 'fixed'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Comportamiento Corregido (Fix)
            </button>
          </div>
        </div>

        {/* LocalStorage state bar */}
        <div className="mt-5 p-3 rounded-xl bg-slate-900 text-white font-mono text-xs flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">localStorage simulado:</span>
            {Object.keys(sessionKeys).length === 0 ? (
              <span className="text-slate-500 italic">[Vacío - No hay sesión iniciada]</span>
            ) : (
              Object.entries(sessionKeys).map(([k, v]) => (
                <span key={k} className="bg-slate-800 px-2 py-0.5 rounded border border-slate-700 text-emerald-400">
                  {k}: <span className="text-amber-300">"{v}"</span>
                </span>
              ))
            )}
          </div>
          <button
            onClick={resetSimulation}
            className="text-slate-400 hover:text-white flex items-center gap-1 text-[11px] underline ml-auto"
          >
            <RotateCcw className="w-3 h-3" /> Reiniciar Simulación
          </button>
        </div>
      </div>

      {/* Simulator Workspace Screen */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Step Stepper */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Pasos de la Simulación</h3>

          <div className="space-y-3 text-xs">
            <div
              className={`p-3 rounded-xl border transition-all ${
                step === 1
                  ? 'bg-blue-50 border-blue-300 ring-1 ring-blue-200'
                  : 'bg-slate-50 border-slate-200 text-slate-500'
              }`}
            >
              <div className="flex items-center gap-2 font-bold mb-1">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">
                  1
                </span>
                <span>Página login.html</span>
              </div>
              <p className="text-[11px] text-slate-600">
                El usuario envía credenciales en el primer formulario de acceso.
              </p>
            </div>

            {mode === 'broken' && (
              <div
                className={`p-3 rounded-xl border transition-all ${
                  step === 2
                    ? 'bg-rose-50 border-rose-300 ring-1 ring-rose-200'
                    : 'bg-slate-50 border-slate-200 text-slate-500'
                }`}
              >
                <div className="flex items-center gap-2 font-bold mb-1 text-rose-800">
                  <span className="w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center text-[10px]">
                    2
                  </span>
                  <span>dashboard.html (Doble Login)</span>
                </div>
                <p className="text-[11px] text-rose-700">
                  🚨 Como falta <code>lp_session</code>, se activa el segundo modal de login bloqueando el dashboard.
                </p>
              </div>
            )}

            <div
              className={`p-3 rounded-xl border transition-all ${
                step === 3
                  ? 'bg-emerald-50 border-emerald-300 ring-1 ring-emerald-200'
                  : 'bg-slate-50 border-slate-200 text-slate-500'
              }`}
            >
              <div className="flex items-center gap-2 font-bold mb-1 text-emerald-800">
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">
                  {mode === 'broken' ? 3 : 2}
                </span>
                <span>Dashboard Desbloqueado</span>
              </div>
              <p className="text-[11px] text-emerald-700">
                El usuario finalmente accede a las pestañas del sistema.
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 space-y-1.5">
            <p className="font-bold text-slate-800">Causa Raíz del Repositorio:</p>
            <p>
              <code>login.html</code> guarda <code>isLoggedIn = true</code>, pero <code>dashboard.html</code> exige{' '}
              <code>lp_session = active</code>. Son dos scripts escritos en momentos distintos con nombres de variables divergentes.
            </p>
          </div>
        </div>

        {/* Right: Interactive Mock Screen */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl min-h-[460px] flex flex-col">
          {/* Browser Topbar Bar */}
          <div className="bg-slate-950 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></span>
              <span className="font-mono text-[11px] ml-2 text-slate-300 bg-slate-900 px-3 py-0.5 rounded-full border border-slate-800">
                {step === 1 ? 'https://localpay.com/login.html' : 'https://localpay.com/dashboard.html'}
              </span>
            </div>
            <span className="text-[11px] font-mono text-slate-500">
              Modo: {mode === 'broken' ? 'Repo Actual' : 'Solución Unificada'}
            </span>
          </div>

          {/* Browser Content Area */}
          <div className="flex-1 p-6 flex flex-col items-center justify-center relative">
            {/* STEP 1: login.html */}
            {step === 1 && (
              <div className="w-full max-w-sm bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 backdrop-blur-md shadow-2xl text-white space-y-4">
                <div className="text-center space-y-1">
                  <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-xl mx-auto shadow-lg shadow-blue-500/30">
                    ⚡
                  </div>
                  <h4 className="text-lg font-bold">LocalPay Admin (login.html)</h4>
                  <p className="text-[11px] text-slate-400">
                    {mode === 'broken'
                      ? 'Texto en código fuente: admin@localpay.com / 123456'
                      : 'Autenticación con API backend /api/auth/login'}
                  </p>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="text-[11px] text-slate-300 font-medium block mb-1">Correo Electrónico</label>
                    <input
                      type="text"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-300 font-medium block mb-1">Contraseña</label>
                    <input
                      type="password"
                      value={loginPass}
                      onChange={(e) => setLoginPass(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white outline-none focus:border-blue-500"
                    />
                  </div>
                  <button
                    onClick={executeFirstLogin}
                    className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all shadow-md shadow-blue-500/20 mt-2 cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>Iniciar Sesión en login.html</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: The Trap (Only in broken mode) */}
            {step === 2 && mode === 'broken' && (
              <div className="w-full max-w-sm bg-white text-black p-8 shadow-2xl border-4 border-rose-500 relative">
                <div className="absolute -top-3 left-4 bg-rose-600 text-white px-3 py-0.5 text-[10px] font-black uppercase tracking-wider">
                  ¡Atrapado! 2º Formulario de Login (#login-screen)
                </div>

                <div className="text-center mb-6">
                  <h4 className="text-3xl font-black italic tracking-tighter uppercase">LOCALPAY</h4>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-neutral-400 mt-1">
                    Merchant Dashboard (dashboard.html)
                  </p>
                </div>

                <div className="bg-rose-50 border border-rose-200 p-2.5 text-xs text-rose-800 rounded mb-4">
                  <strong>🚨 Error de Flujo:</strong> Ya iniciaste sesión, pero <code>dashboard.html</code> buscó{' '}
                  <code>lp_session</code> (que está vacía) y te exige volver a ingresar.
                </div>

                <div className="space-y-3 text-xs">
                  <input
                    type="email"
                    placeholder="Email (admin@localpay.com)"
                    value={dashEmail}
                    onChange={(e) => setDashEmail(e.target.value)}
                    className="w-full bg-neutral-100 p-3 font-medium outline-none border border-neutral-300"
                  />
                  <input
                    type="password"
                    placeholder="Contraseña (123456)"
                    value={dashPass}
                    onChange={(e) => setDashPass(e.target.value)}
                    className="w-full bg-neutral-100 p-3 font-medium outline-none border border-neutral-300"
                  />
                  <button
                    onClick={executeSecondLogin}
                    className="w-full bg-black text-white font-bold uppercase p-3 hover:bg-neutral-800 cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>Ingresar por 2ª Vez</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: Logged in Dashboard View */}
            {step === 3 && (
              <div className="w-full h-full bg-white text-slate-800 rounded-xl p-6 flex flex-col justify-between">
                <div className="border-b pb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-lg tracking-tight">LOCALPAY</span>
                    <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-bold">
                      {mode === 'broken' ? 'Sesión Doble Resuelta' : 'Sesión Unificada Activa'}
                    </span>
                  </div>
                  <button
                    onClick={resetSimulation}
                    className="text-xs text-rose-600 hover:underline font-semibold"
                  >
                    Cerrar Sesión
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
                  <div className="p-3 bg-slate-50 border rounded-lg">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Estado Radar</span>
                    <p className="font-bold text-sm text-blue-600">Activo</p>
                  </div>
                  <div className="p-3 bg-slate-50 border rounded-lg">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Caja 01</span>
                    <p className="font-bold text-sm text-slate-800">$45.200</p>
                  </div>
                  <div className="p-3 bg-slate-50 border rounded-lg">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Semáforo</span>
                    <p className="font-bold text-sm text-emerald-600">Listo</p>
                  </div>
                  <div className="p-3 bg-slate-50 border rounded-lg">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Entidades</span>
                    <p className="font-bold text-sm text-slate-800">1 Cliente</p>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border text-xs text-slate-600">
                  <strong className="text-slate-800">Lección de la Auditoría:</strong>
                  {mode === 'broken' ? (
                    <p className="mt-1">
                      El operador del comercio tuvo que rellenar dos formularios idénticos en menos de 10 segundos.
                      Esto causa frustración y abandono del software en puntos de venta reales.
                    </p>
                  ) : (
                    <p className="mt-1 text-emerald-700">
                      Con la sesión unificada (Auth Token / Guard centralizado), el inicio de sesión es instantáneo y transparente.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
