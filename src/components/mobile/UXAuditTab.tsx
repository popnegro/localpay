import React, { useState } from 'react';
import {
  Smartphone,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Layout,
  Layers,
  ArrowRight,
  Sparkles,
  Zap,
  Sliders,
  Scale,
  ShieldAlert,
  ChevronRight,
  Code2,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import {
  UX_SCORECARD,
  UX_HEURISTICS,
  BEFORE_AFTER_COMPARISONS,
  MOBILE_DESIGN_TOKENS,
} from '../../data/uxAuditData';

interface UXAuditTabProps {
  onLaunchMobilePOS: () => void;
}

export const UXAuditTab: React.FC<UXAuditTabProps> = ({ onLaunchMobilePOS }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');
  const [selectedComparisonId, setSelectedComparisonId] = useState<string>('numpad-vs-input');
  const [showCodeDiff, setShowCodeDiff] = useState<boolean>(false);
  const [activeThumbView, setActiveThumbView] = useState<'both' | 'natural' | 'stretch' | 'hard'>('both');

  const filteredHeuristics =
    selectedCategory === 'todos'
      ? UX_HEURISTICS
      : UX_HEURISTICS.filter((h) => h.category === selectedCategory);

  const activeComparison =
    BEFORE_AFTER_COMPARISONS.find((c) => c.id === selectedComparisonId) ||
    BEFORE_AFTER_COMPARISONS[0];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Banner Principal de la Auditoría UX/UI */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-indigo-900/50 relative overflow-hidden">
        <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-1/4 -top-12 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold mb-3">
              <Smartphone className="w-3.5 h-3.5 text-indigo-400" />
              <span>Auditoría UX/UI & Baseline Mobile-First</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
              De la Fricción Desktop al Flujo Operativo de Mostrador con Una Sola Mano
            </h2>
            <p className="text-sm text-slate-300 mt-2.5 leading-relaxed">
              El análisis ergonómico del repositorio original reveló que LocalPay fue concebido como un dashboard de escritorio (sidebar de 280px, tablas anchas y teclado virtual). Esta auditoría establece el nuevo <strong>Baseline Mobile-First</strong>: Ley de Fitts, zona natural del pulgar, Numpad táctil y retroalimentación de cobro a distancia.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
            <button
              onClick={onLaunchMobilePOS}
              className="px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all active:scale-95 cursor-pointer"
            >
              <Zap className="w-4 h-4 fill-current" />
              <span>Probar Terminal Mobile Baseline</span>
            </button>
          </div>
        </div>

        {/* Scorecard Comparativo Global */}
        <div className="mt-8 pt-6 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-slate-800/60 backdrop-blur-xs p-4 rounded-2xl border border-slate-700/60">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Score Global</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-rose-400">34</span>
              <span className="text-xs text-slate-400">vs</span>
              <span className="text-2xl font-black text-emerald-400">96</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Legacy vs Mobile Baseline</p>
          </div>

          {UX_SCORECARD.categories.map((cat, i) => (
            <div key={i} className="bg-slate-800/40 p-3.5 rounded-2xl border border-slate-700/40">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 truncate" title={cat.name}>
                {cat.name}
              </p>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-lg font-bold text-slate-400 line-through">{cat.legacy}</span>
                <ArrowRight className="w-3 h-3 text-slate-500" />
                <span className="text-xl font-black text-emerald-300">{cat.baseline}</span>
              </div>
              <div className="w-full bg-slate-700/60 rounded-full h-1.5 mt-2 overflow-hidden">
                <div
                  className="bg-emerald-400 h-full rounded-full transition-all duration-700"
                  style={{ width: `${cat.baseline}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECCIÓN 1: ZONA DEL PULGAR Y ERGONOMÍA (INTERACTIVA) */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full mb-1">
              <Flame className="w-3.5 h-3.5 text-emerald-600" />
              <span>Ergonomía de Steven Hoober & Ley de Fitts</span>
            </div>
            <h3 className="text-xl font-black text-slate-900">
              Mapeo de la Zona del Pulgar (Thumb Zone) en Terminales de Mostrador
            </h3>
            <p className="text-xs text-slate-600 mt-1 max-w-3xl">
              El 75% de los cobros en mostradores con smartphones o terminales Android (Sunmi/Pax) se ejecutan con <strong>una sola mano</strong>. Colocar botones en el tercio superior fuerza micro-movimientos constantes que provocan errores de cobro o caídas del equipo.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-600">Ver Zonas:</span>
            <div className="inline-flex p-1 bg-slate-100 rounded-xl text-xs font-bold">
              <button
                onClick={() => setActiveThumbView('both')}
                className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                  activeThumbView === 'both' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Todas
              </button>
              <button
                onClick={() => setActiveThumbView('natural')}
                className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                  activeThumbView === 'natural' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Natural (40%)
              </button>
              <button
                onClick={() => setActiveThumbView('stretch')}
                className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                  activeThumbView === 'stretch' ? 'bg-amber-500 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Stretch (35%)
              </button>
              <button
                onClick={() => setActiveThumbView('hard')}
                className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                  activeThumbView === 'hard' ? 'bg-rose-500 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Hard (25%)
              </button>
            </div>
          </div>
        </div>

        {/* Diagrama Interactivo de la Pantalla */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center mt-6">
          {/* Mockup de la Pantalla y Heatmap */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="w-full max-w-[280px] sm:max-w-[310px] aspect-[9/19] bg-slate-950 rounded-[44px] p-3 shadow-2xl border-4 border-slate-800 relative flex flex-col justify-between overflow-hidden">
              {/* Dynamic Island / Notch */}
              <div className="w-24 h-4 bg-black rounded-full mx-auto mb-2 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-slate-800" />
              </div>

              {/* Zonas Ergonómicas Simuladas */}
              <div className="flex-1 flex flex-col rounded-[32px] overflow-hidden text-center text-xs font-bold relative border border-slate-800">
                {/* 1. Zona Difícil (25% Superior) */}
                <div
                  className={`flex-1 flex flex-col items-center justify-center p-3 transition-all duration-300 ${
                    activeThumbView === 'both' || activeThumbView === 'hard'
                      ? 'bg-rose-500/25 border-b-2 border-dashed border-rose-500 text-rose-300'
                      : 'opacity-20 bg-slate-900 text-slate-600'
                  }`}
                >
                  <span className="px-2 py-0.5 rounded-full bg-rose-500/30 text-[10px] uppercase font-black tracking-wider text-rose-200">
                    Hard to Reach (25%)
                  </span>
                  <p className="text-[11px] font-normal text-slate-300 mt-1">
                    Solo para: Sucursal, Perfil, Logout.
                  </p>
                  <span className="text-[9px] text-rose-400 font-mono mt-0.5">Requiere estirar el pulgar</span>
                </div>

                {/* 2. Zona de Esfuerzo Moderado (35% Medio) */}
                <div
                  className={`flex-[1.4] flex flex-col items-center justify-center p-3 transition-all duration-300 ${
                    activeThumbView === 'both' || activeThumbView === 'stretch'
                      ? 'bg-amber-500/25 border-b-2 border-dashed border-amber-500 text-amber-300'
                      : 'opacity-20 bg-slate-900 text-slate-600'
                  }`}
                >
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/30 text-[10px] uppercase font-black tracking-wider text-amber-200">
                    Stretch Zone (35%)
                  </span>
                  <p className="text-[11px] font-normal text-slate-300 mt-1">
                    Display de Monto, Semáforo QR, Resumen de Ventas.
                  </p>
                  <span className="text-[9px] text-amber-400 font-mono mt-0.5">Lectura visual directa</span>
                </div>

                {/* 3. Zona Natural (40% Inferior) */}
                <div
                  className={`flex-[2] flex flex-col items-center justify-center p-3 transition-all duration-300 ${
                    activeThumbView === 'both' || activeThumbView === 'natural'
                      ? 'bg-emerald-500/30 text-emerald-200 ring-2 ring-emerald-500/50'
                      : 'opacity-20 bg-slate-900 text-slate-600'
                  }`}
                >
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/40 text-[10px] uppercase font-black tracking-wider text-emerald-200">
                    Natural Thumb Zone (40%)
                  </span>
                  <p className="text-[11px] font-bold text-white mt-1">
                    Numpad Táctil, Billetes Rápidos, Botón Cobrar, Bottom Bar.
                  </p>
                  <span className="text-[9px] text-emerald-300 font-mono mt-1">
                    Zona de Mínimo Esfuerzo Físico
                  </span>
                </div>
              </div>

              {/* Barra Inferior del Dispositivo (Home Indicator) */}
              <div className="w-28 h-1 bg-slate-600 rounded-full mx-auto mt-2" />
            </div>
          </div>

          {/* Explicación de los 3 Principios Aplicados */}
          <div className="lg:col-span-7 space-y-4">
            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-emerald-600 text-white shrink-0 mt-0.5">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900">
                    Principio 1: Bottom-Heavy Architecture (Centro de Gravedad en el Pulgar)
                  </h4>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    A diferencia del dashboard legacy donde el botón de cobro requería hacer scroll o tocar en esquinas superiores, en el <strong>Mobile Baseline</strong> el teclado numérico de 54px y el botón primario de cobro están permanentemente anclados en los 300px inferiores del viewport.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200/80">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-indigo-600 text-white shrink-0 mt-0.5">
                  <Sliders className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900">
                    Principio 2: Numpad Integrado vs Teclado Virtual del Sistema
                  </h4>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    Hacer foco en un input nativo en Safari o Chrome despliega un teclado de 300px que empuja la página hacia arriba, corta el contexto de la transacción y exige dos manos para no errar el botón "Done". El Numpad dedicado de LocalPay elimina este retraso en un 100%.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-slate-800 text-white shrink-0 mt-0.5">
                  <Scale className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900">
                    Principio 3: Targets Táctiles Cumpliendo WCAG 2.5.5 (48x48px Mínimo)
                  </h4>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    Cada tecla numérica mide <strong>56px de alto</strong> con padding horizontal generoso y efecto activo háptico simulado. Ningún botón de acción interactivo tiene menos de 48px, garantizando cero clics erróneos durante turnos intensos de mostrador.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECCIÓN 2: COMPARATIVA INTERACTIVA ANTES (LEGACY) VS DESPUÉS (MOBILE BASELINE) */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full mb-1">
              <Layers className="w-3.5 h-3.5 text-indigo-600" />
              <span>Auditoría Componente por Componente</span>
            </div>
            <h3 className="text-xl font-black text-slate-900">
              Comparativa Visual y de Código: Legacy vs Mobile Baseline
            </h3>
            <p className="text-xs text-slate-600 mt-1">
              Seleccione una interacción clave de mostrador para examinar la resolución de las fallas UX.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCodeDiff(!showCodeDiff)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold cursor-pointer"
            >
              <Code2 className="w-3.5 h-3.5 text-slate-500" />
              <span>{showCodeDiff ? 'Ocultar Código' : 'Ver Snippets HTML/TSX'}</span>
            </button>
          </div>
        </div>

        {/* Tabs de Selección de Componentes */}
        <div className="flex flex-wrap gap-2 mt-6">
          {BEFORE_AFTER_COMPARISONS.map((item) => (
            <button
              key={item.id}
              onClick={() => setSelectedComparisonId(item.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedComparisonId === item.id
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {item.feature}
            </button>
          ))}
        </div>

        {/* Panel Comparativo */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card ANTES (Legacy) */}
          <div className="rounded-2xl border-2 border-rose-200 bg-rose-50/30 p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-rose-200">
                <span className="px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 text-[11px] font-black uppercase tracking-wider flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-600" /> Versión Legacy (index / dashboard.html)
                </span>
                <span className="text-xs font-bold text-rose-600">Falla UX Crítica</span>
              </div>

              <h4 className="font-bold text-slate-900 text-sm mt-3">{activeComparison.legacyDescription}</h4>

              <div className="mt-4 space-y-2">
                {activeComparison.legacyIssues.map((issue, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-rose-900">
                    <span className="text-rose-500 font-bold shrink-0">✕</span>
                    <span>{issue}</span>
                  </div>
                ))}
              </div>
            </div>

            {showCodeDiff && (
              <div className="mt-4 pt-3 border-t border-rose-200">
                <p className="text-[10px] font-bold text-rose-700 uppercase mb-1">Snippet Original:</p>
                <pre className="p-2.5 rounded-xl bg-slate-900 text-rose-300 font-mono text-[11px] overflow-x-auto leading-relaxed">
                  {activeComparison.legacySnippet}
                </pre>
              </div>
            )}
          </div>

          {/* Card DESPUÉS (Mobile Baseline) */}
          <div className="rounded-2xl border-2 border-emerald-300 bg-emerald-50/40 p-5 flex flex-col justify-between shadow-xs">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-emerald-200">
                <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-black uppercase tracking-wider flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Mobile Baseline Unificado
                </span>
                <span className="text-xs font-bold text-emerald-700">Resuelto 100%</span>
              </div>

              <h4 className="font-bold text-slate-900 text-sm mt-3">{activeComparison.baselineDescription}</h4>

              <div className="mt-4 space-y-2">
                {activeComparison.baselineBenefits.map((benefit, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-emerald-950 font-medium">
                    <span className="text-emerald-600 font-bold shrink-0">✓</span>
                    <span>{benefit}</span>
                  </div>
                ))}
              </div>
            </div>

            {showCodeDiff && (
              <div className="mt-4 pt-3 border-t border-emerald-200">
                <p className="text-[10px] font-bold text-emerald-700 uppercase mb-1">Implementación Baseline:</p>
                <pre className="p-2.5 rounded-xl bg-slate-900 text-emerald-300 font-mono text-[11px] overflow-x-auto leading-relaxed">
                  {activeComparison.baselineSnippet}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SECCIÓN 3: TABLA DE HEURÍSTICAS Y CRITERIOS DE ACCESIBILIDAD */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-full mb-1">
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
              <span>Matriz Heurística Exhaustiva</span>
            </div>
            <h3 className="text-xl font-black text-slate-900">
              Evaluación de las 7 Heurísticas de Usabilidad y Accesibilidad
            </h3>
            <p className="text-xs text-slate-600 mt-1">
              Filtre por categoría para auditar el diagnóstico técnico de cada dimensión de interfaz.
            </p>
          </div>

          {/* Filtros de Categorías */}
          <div className="flex flex-wrap gap-1.5">
            {['todos', 'Ergonomía', 'Accesibilidad', 'Velocidad Operativa en Mostrador', 'Carga Cognitiva', 'Feedback Mostrador', 'Design System'].map(
              (cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat === 'todos' ? 'Todas' : cat}
                </button>
              )
            )}
          </div>
        </div>

        {/* Lista de Hallazgos Heurísticos */}
        <div className="mt-6 space-y-4">
          {filteredHeuristics.map((h) => (
            <div
              key={h.id}
              className="p-5 rounded-2xl bg-slate-50/70 border border-slate-200/80 hover:border-slate-300 transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200/60">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-200 text-slate-800">
                    {h.category}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      h.impactScore === 'Crítico'
                        ? 'bg-rose-100 text-rose-700 border border-rose-200'
                        : 'bg-amber-100 text-amber-700 border border-amber-200'
                    }`}
                  >
                    Impacto: {h.impactScore}
                  </span>
                </div>

                {h.wcagReference && (
                  <span className="text-[11px] font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                    {h.wcagReference}
                  </span>
                )}
              </div>

              <h4 className="font-extrabold text-slate-900 text-sm mt-3">{h.title}</h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3 text-xs">
                <div className="p-3 rounded-xl bg-rose-50/50 border border-rose-100 text-slate-700">
                  <p className="font-bold text-rose-800 text-[11px] uppercase mb-1">Diagnóstico en Código Legacy:</p>
                  <p className="leading-relaxed">{h.problemLegacy}</p>
                </div>

                <div className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-100 text-slate-700">
                  <p className="font-bold text-emerald-800 text-[11px] uppercase mb-1">Solución Mobile Baseline:</p>
                  <p className="leading-relaxed">{h.solutionBaseline}</p>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Métrica de Impacto:</span>
                <span className="font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg">
                  {h.metricChange}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECCIÓN 4: DESIGN TOKENS Y SISTEMA TIPOGRÁFICO */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs">
        <h3 className="text-xl font-black text-slate-900 mb-2">
          Design Tokens Oficiales del Baseline Mobile-First
        </h3>
        <p className="text-xs text-slate-600 mb-6">
          Tokens estandarizados para garantizar consistencia visual, prevención de autozoom en iOS y cumplimiento de WCAG 2.1 AA.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Escala Tipográfica */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200">
            <h4 className="font-bold text-slate-900 text-sm mb-3">Escala Tipográfica Mobile</h4>
            <div className="space-y-3 text-xs">
              {MOBILE_DESIGN_TOKENS.typographyScale.map((t, idx) => (
                <div key={idx} className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                  <div>
                    <span className="font-mono font-bold text-indigo-600">{t.token}</span>
                    <span className="ml-2 text-slate-400">({t.size})</span>
                  </div>
                  <span className="text-slate-600 text-right font-medium">{t.mobileRole}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Targets Táctiles */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
            <div>
              <h4 className="font-bold text-slate-900 text-sm mb-3">Targets Táctiles & Ergonomía (Touch Targets)</h4>
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                  <span className="text-slate-700 font-medium">Estándar Mínimo Accesible:</span>
                  <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-mono">
                    {MOBILE_DESIGN_TOKENS.touchTargets.minimum}
                  </span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                  <span className="text-slate-700 font-medium">Teclas del Numpad Táctil:</span>
                  <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md font-mono">
                    {MOBILE_DESIGN_TOKENS.touchTargets.numpadKeys}
                  </span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                  <span className="text-slate-700 font-medium">Botón Primario de Cobro:</span>
                  <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md font-mono">
                    {MOBILE_DESIGN_TOKENS.touchTargets.primaryButtons}
                  </span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                  <span className="text-slate-700 font-medium">Chips de Billetes Rápidos:</span>
                  <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md font-mono">
                    {MOBILE_DESIGN_TOKENS.touchTargets.chips}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-200">
              <button
                onClick={onLaunchMobilePOS}
                className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Probar Componentes en Vivo</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
