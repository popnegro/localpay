import React from 'react';
import { ShieldAlert, AlertTriangle, CheckCircle, ArrowRight, Layers, Lock, Cpu, Database, Compass } from 'lucide-react';
import { MODULE_SUMMARIES } from '../data/auditData';

interface OverviewTabProps {
  onSelectModule: (moduleId: string) => void;
  onOpenSimulator: () => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({ onSelectModule, onOpenSimulator }) => {
  return (
    <div className="space-y-8">
      {/* Executive Summary Card */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-700/80 rounded-2xl p-6 sm:p-8 text-white shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-300 border border-rose-500/20">
              <ShieldAlert className="w-4 h-4" />
              <span>Diagnóstico Global: Proyecto en Fase Prototipo Desarticulado</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Resumen de Auditoría Técnica LocalPay
            </h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              El repositorio presenta ideas funcionales de alto valor para cobros de cercanía (como el 
              <strong className="text-blue-400"> Semáforo de Cobro</strong> y el 
              <strong className="text-blue-400"> Cierre de Caja imprimible</strong>), pero actualmente 
              <span className="text-rose-300 font-semibold"> sufre de desconexión arquitectónica severa</span>:
              existen dos dashboards paralelos que no se comunican entre sí, autenticación simulada en texto plano que provoca un 
              <strong> doble login bloqueante</strong>, y vulnerabilidades de <strong>Stored XSS</strong> en la gestión de entidades.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row lg:flex-col gap-3 min-w-[240px]">
            <button
              id="goto-simulator-btn"
              onClick={onOpenSimulator}
              className="px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Ver Simulador de Doble Login</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              id="goto-reformas-btn"
              onClick={() => onSelectModule('action-plan')}
              className="px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 font-semibold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Ir a Lista de Reformas y Mejoras</span>
            </button>
          </div>
        </div>

        {/* Global Key Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6 border-t border-slate-700/60">
          <div className="bg-slate-800/40 p-3.5 rounded-xl border border-slate-700/40">
            <p className="text-xs text-slate-400 font-medium">Salud del Código</p>
            <p className="text-2xl font-black text-amber-400 mt-1">48<span className="text-xs text-slate-400 font-normal"> /100</span></p>
            <p className="text-[11px] text-slate-400 mt-0.5">Requiere refactor</p>
          </div>
          <div className="bg-slate-800/40 p-3.5 rounded-xl border border-slate-700/40">
            <p className="text-xs text-slate-400 font-medium">Vulnerabilidades</p>
            <p className="text-2xl font-black text-rose-400 mt-1">2 <span className="text-xs text-slate-400 font-normal">críticas</span></p>
            <p className="text-[11px] text-slate-400 mt-0.5">Auth plano + XSS</p>
          </div>
          <div className="bg-slate-800/40 p-3.5 rounded-xl border border-slate-700/40">
            <p className="text-xs text-slate-400 font-medium">Dashboards</p>
            <p className="text-2xl font-black text-purple-400 mt-1">2 <span className="text-xs text-slate-400 font-normal">duplicados</span></p>
            <p className="text-[11px] text-slate-400 mt-0.5">Bootstrap vs Tailwind</p>
          </div>
          <div className="bg-slate-800/40 p-3.5 rounded-xl border border-slate-700/40">
            <p className="text-xs text-slate-400 font-medium">Aciertos Core</p>
            <p className="text-2xl font-black text-emerald-400 mt-1">4 <span className="text-xs text-slate-400 font-normal">destacados</span></p>
            <p className="text-[11px] text-slate-400 mt-0.5">Semáforo + Cierre</p>
          </div>
        </div>
      </div>

      {/* The 3 Core Files Audit Cards */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">Verificación por Archivo Clave</h3>
            <p className="text-xs text-slate-500">Evaluación detallada de login, dashboard e index</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {MODULE_SUMMARIES.filter((m) => m.id !== 'architecture').map((mod) => (
            <div
              key={mod.id}
              className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                    {mod.file}
                  </span>
                  <span
                    className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                      mod.status === 'Crítico'
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : mod.status === 'Inconsistente'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}
                  >
                    {mod.status} ({mod.score}/100)
                  </span>
                </div>

                <div>
                  <h4 className="font-bold text-slate-900 text-base">{mod.name}</h4>
                  <p className="text-xs text-slate-500 mt-0.5 font-medium">{mod.technology}</p>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">{mod.summary}</p>

                <div className="pt-2 border-t border-slate-100 space-y-1.5">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Puntos Clave:</p>
                  {mod.highlights.slice(0, 3).map((hl, i) => (
                    <div key={i} className="flex items-start gap-1.5 text-xs text-slate-600">
                      <span className="text-slate-400 mt-0.5">•</span>
                      <span>{hl}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100">
                <button
                  id={`inspect-${mod.id}-btn`}
                  onClick={() => onSelectModule(mod.id)}
                  className="w-full py-2 px-3 rounded-lg bg-slate-50 hover:bg-blue-50 hover:text-blue-700 text-slate-700 text-xs font-semibold transition-colors flex items-center justify-center gap-1 cursor-pointer border border-slate-200/80"
                >
                  <span>Inspeccionar Código y Solución</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Architectural Flow Diagram: What's happening vs what should happen */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900 mb-1">Diagnóstico de Flujo: El Conflicto de Sesiones</h3>
        <p className="text-xs text-slate-500 mb-6">
          Comparativa entre el ciclo de navegación actual en el repositorio y la arquitectura recomendada
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Broken Flow */}
          <div className="bg-rose-50/40 border border-rose-200 rounded-xl p-5 space-y-3">
            <div className="flex items-center gap-2 text-rose-700 font-bold text-sm">
              <AlertTriangle className="w-4 h-4" />
              <span>Flujo Actual en el Repositorio (Roto)</span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-white p-3 rounded-lg border border-rose-200/70 shadow-2xs">
                <div className="flex items-center justify-between text-slate-700 font-semibold mb-1">
                  <span>1. Usuario ingresa a <code className="text-rose-600">login.html</code></span>
                  <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded">Bootstrap</span>
                </div>
                <p className="text-slate-500">Completa admin@localpay.com / 123456. Se ejecuta:</p>
                <code className="block bg-slate-900 text-emerald-400 p-1.5 rounded mt-1 font-mono text-[11px]">
                  localStorage.setItem('isLoggedIn', 'true');
                  window.location.href = 'dashboard.html';
                </code>
              </div>

              <div className="text-center text-rose-500 font-bold">↓ Redirección a dashboard.html</div>

              <div className="bg-white p-3 rounded-lg border border-rose-300 shadow-2xs">
                <div className="flex items-center justify-between text-slate-700 font-semibold mb-1">
                  <span>2. Se carga <code className="text-rose-600">dashboard.html</code></span>
                  <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded">Tailwind</span>
                </div>
                <p className="text-slate-500">dashboard.html comprueba otra clave:</p>
                <code className="block bg-slate-900 text-rose-400 p-1.5 rounded mt-1 font-mono text-[11px]">
                  if (localStorage.getItem('lp_session') === 'active') // ¡ES NULL!
                </code>
                <p className="text-rose-600 font-semibold mt-1">
                  🚨 Resultado: Se activa el modal #login-screen interno. El usuario debe loguearse por 2ª vez.
                </p>
              </div>

              <div className="text-center text-rose-500 font-bold">Y paralelamente...</div>

              <div className="bg-white p-3 rounded-lg border border-amber-200 shadow-2xs">
                <div className="flex items-center justify-between text-slate-700 font-semibold mb-1">
                  <span>¿Qué pasa con <code className="text-amber-600">index.html</code>?</span>
                  <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded">Bootstrap</span>
                </div>
                <p className="text-slate-500">
                  Es otro dashboard distinto que sí usa `isLoggedIn`, pero nadie lo enlaza desde `login.html`.
                  Queda como una página huérfana inaccesible salvo escribiendo la URL manualmente.
                </p>
              </div>
            </div>
          </div>

          {/* Fixed Flow */}
          <div className="bg-emerald-50/40 border border-emerald-200 rounded-xl p-5 space-y-3">
            <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm">
              <CheckCircle className="w-4 h-4" />
              <span>Arquitectura Recomendada (Unificada)</span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-white p-3 rounded-lg border border-emerald-200/70 shadow-2xs">
                <div className="flex items-center justify-between text-slate-700 font-semibold mb-1">
                  <span>1. Entrada Pública: <code className="text-emerald-700">index.html (Landing)</code></span>
                </div>
                <p className="text-slate-500">
                  Landing page atractiva con propuesta de valor para comercios, comisiones bajas y botón
                  <strong> "Iniciar Sesión"</strong> o <strong>"Registrar Comercio"</strong>.
                </p>
              </div>

              <div className="text-center text-emerald-600 font-bold">↓ Clic en "Acceder"</div>

              <div className="bg-white p-3 rounded-lg border border-emerald-200/70 shadow-2xs">
                <div className="flex items-center justify-between text-slate-700 font-semibold mb-1">
                  <span>2. Autenticación Real: <code className="text-emerald-700">login.html</code></span>
                </div>
                <p className="text-slate-500">
                  Solicitud a backend seguro. Emisión de Token JWT o Sesión Firebase/Supabase con roles (Cajero, Dueño).
                </p>
                <code className="block bg-slate-900 text-emerald-400 p-1.5 rounded mt-1 font-mono text-[11px]">
                  sessionStorage.setItem('lp_token', token);
                  window.location.href = '/dashboard';
                </code>
              </div>

              <div className="text-center text-emerald-600 font-bold">↓ Sesión verificada</div>

              <div className="bg-white p-3 rounded-lg border border-emerald-300 shadow-2xs">
                <div className="flex items-center justify-between text-slate-700 font-semibold mb-1">
                  <span>3. Dashboard Único Consolidado: <code className="text-emerald-700">dashboard.html</code></span>
                </div>
                <p className="text-slate-500">
                  Unifica en una sola UI: el Semáforo de Cobro dinámico, la lista de movimientos persistida, el módulo de entidades sanitizado y el reporte de cierre imprimible.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
