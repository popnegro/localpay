export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'positive';
export type AuditModuleId = 'login' | 'dashboard' | 'index' | 'architecture';

export interface AuditFinding {
  id: string;
  moduleId: AuditModuleId;
  title: string;
  category: 'Seguridad' | 'Arquitectura' | 'Funcionalidad' | 'UX/UI' | 'Rendimiento' | 'Acierto';
  severity: Severity;
  summary: string;
  detail: string;
  codeSnippet?: {
    file: string;
    lines: string;
    code: string;
  };
  solutionSnippet?: {
    file: string;
    description: string;
    code: string;
  };
  impact: string;
  recommendation: string;
}

export interface ModuleAuditSummary {
  id: AuditModuleId;
  name: string;
  file: string;
  technology: string;
  score: number;
  status: 'Crítico' | 'Inconsistente' | 'Aceptable' | 'Bueno';
  summary: string;
  stats: {
    critical: number;
    warnings: number;
    positives: number;
  };
  highlights: string[];
}
