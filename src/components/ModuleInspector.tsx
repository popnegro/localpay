import React, { useState } from 'react';
import { AuditFinding, ModuleAuditSummary } from '../types';
import { ShieldAlert, AlertTriangle, CheckCircle, Info, Copy, Check, Code2, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';

interface ModuleInspectorProps {
  moduleSummary: ModuleAuditSummary;
  findings: AuditFinding[];
}

export const ModuleInspector: React.FC<ModuleInspectorProps> = ({ moduleSummary, findings }) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(findings[0]?.id || null);

  const handleCopy = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <ShieldAlert className="w-3.5 h-3.5 text-rose-600" /> Crítico
          </span>
        );
      case 'high':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> Alto
          </span>
        );
      case 'medium':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <Info className="w-3.5 h-3.5 text-blue-600" /> Medio
          </span>
        );
      case 'positive':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Qué está bien
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Module Header Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xs text-blue-700 font-semibold bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                {moduleSummary.file}
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs font-medium text-slate-500">{moduleSummary.technology}</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">{moduleSummary.name}</h2>
            <p className="text-sm text-slate-600 mt-2 max-w-3xl">{moduleSummary.summary}</p>
          </div>

          <div className="flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
            <div className="text-right">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider block">Calificación</span>
              <span className={`text-3xl font-black ${
                moduleSummary.score < 50 ? 'text-rose-600' : moduleSummary.score < 70 ? 'text-amber-600' : 'text-emerald-600'
              }`}>
                {moduleSummary.score}<span className="text-sm font-normal text-slate-400">/100</span>
              </span>
            </div>
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full mt-1 ${
              moduleSummary.status === 'Crítico'
                ? 'bg-rose-100 text-rose-800'
                : moduleSummary.status === 'Inconsistente'
                ? 'bg-amber-100 text-amber-800'
                : 'bg-emerald-100 text-emerald-800'
            }`}>
              Estado: {moduleSummary.status}
            </span>
          </div>
        </div>

        {/* Highlights Pills */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-5 pt-4 border-t border-slate-100">
          {moduleSummary.highlights.map((h, i) => (
            <div key={i} className="flex items-center gap-2 text-xs text-slate-700 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200/60">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0"></span>
              <span>{h}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Findings List */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-slate-900 tracking-tight flex items-center justify-between">
          <span>Detalle de Hallazgos y Soluciones ({findings.length})</span>
          <span className="text-xs font-normal text-slate-500">Haz clic en cada tarjeta para expandir el código y la solución</span>
        </h3>

        {findings.map((f) => {
          const isExpanded = expandedId === f.id;
          return (
            <div
              key={f.id}
              className={`bg-white rounded-xl border transition-all duration-200 overflow-hidden shadow-xs ${
                isExpanded ? 'border-slate-300 ring-1 ring-slate-200 shadow-md' : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              {/* Header Toggle */}
              <div
                onClick={() => setExpandedId(isExpanded ? null : f.id)}
                className="p-5 cursor-pointer flex items-start justify-between gap-4 select-none hover:bg-slate-50/50"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {getSeverityBadge(f.severity)}
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                      {f.category}
                    </span>
                  </div>
                  <h4 className="text-base font-bold text-slate-900">{f.title}</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">{f.summary}</p>
                </div>

                <button
                  type="button"
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-lg mt-1"
                >
                  {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </button>
              </div>

              {/* Expanded Detail Body */}
              {isExpanded && (
                <div className="px-5 pb-6 pt-2 border-t border-slate-100 space-y-5 text-xs">
                  {/* Detailed Description */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                    <p className="font-semibold text-slate-800 mb-1">Análisis Técnico Detallado:</p>
                    <p className="text-slate-600 leading-relaxed">{f.detail}</p>
                    
                    <div className="mt-3 pt-3 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <strong className="text-slate-700">Impacto en el negocio: </strong>
                        <span className="text-slate-600">{f.impact}</span>
                      </div>
                    </div>
                  </div>

                  {/* Code Snippet Comparison */}
                  {f.codeSnippet && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {/* Current Code */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-slate-700 font-semibold">
                          <span className="flex items-center gap-1.5 text-rose-700 font-mono text-[11px]">
                            <Code2 className="w-3.5 h-3.5" />
                            {f.codeSnippet.file}
                          </span>
                          <button
                            onClick={() => handleCopy(f.codeSnippet?.code || '', `curr-${f.id}`)}
                            className="text-[11px] text-slate-500 hover:text-slate-800 flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100"
                          >
                            {copiedId === `curr-${f.id}` ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                            <span>{copiedId === `curr-${f.id}` ? 'Copiado' : 'Copiar'}</span>
                          </button>
                        </div>
                        <pre className="bg-slate-950 text-rose-300 p-3.5 rounded-xl font-mono text-[11px] overflow-x-auto leading-relaxed border border-slate-800 max-h-60">
                          <code>{f.codeSnippet.code}</code>
                        </pre>
                      </div>

                      {/* Solution Code */}
                      {f.solutionSnippet && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-slate-700 font-semibold">
                            <span className="flex items-center gap-1.5 text-emerald-700 font-mono text-[11px]">
                              <Sparkles className="w-3.5 h-3.5" />
                              {f.solutionSnippet.description}
                            </span>
                            <button
                              onClick={() => handleCopy(f.solutionSnippet?.code || '', `sol-${f.id}`)}
                              className="text-[11px] text-emerald-700 hover:text-emerald-900 flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200"
                            >
                              {copiedId === `sol-${f.id}` ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                              <span>{copiedId === `sol-${f.id}` ? 'Copiado' : 'Copiar Fix'}</span>
                            </button>
                          </div>
                          <pre className="bg-slate-950 text-emerald-400 p-3.5 rounded-xl font-mono text-[11px] overflow-x-auto leading-relaxed border border-slate-800 max-h-60">
                            <code>{f.solutionSnippet.code}</code>
                          </pre>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Recommendation Box */}
                  <div className="bg-blue-50/50 border border-blue-200/80 rounded-xl p-3.5 flex items-start gap-2.5">
                    <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-blue-900">Recomendación Directa:</p>
                      <p className="text-blue-800/90 mt-0.5">{f.recommendation}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
