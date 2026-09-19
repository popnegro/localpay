import React, { useState } from 'react';
import { ShieldAlert, Sparkles, CheckCircle2, Copy, Check, Filter, Download } from 'lucide-react';

interface ActionItem {
  id: string;
  type: 'reforma' | 'mejora' | 'bien';
  priority: 'P0 - Bloqueante' | 'P1 - Alta' | 'P2 - Media' | 'Fortaleza';
  title: string;
  scope: string;
  description: string;
  fixGuide: string;
}

const ACTION_ITEMS: ActionItem[] = [
  // --- REFORMAS (CRÍTICAS / OBLIGATORIAS) ---
  {
    id: 'ref-auth',
    type: 'reforma',
    priority: 'P0 - Bloqueante',
    title: 'Eliminar credenciales en frontend y crear autenticación segura',
    scope: 'localpay/login.html & dashboard.html',
    description: 'Tanto login.html como dashboard.html tienen admin@localpay.com y 123456 en texto plano accesibles para cualquiera.',
    fixGuide: 'Implementar una API REST /api/auth/login con contraseñas hasheadas (bcrypt) o servicio de Auth (Firebase/Supabase), devolviendo token JWT o cookie HttpOnly.',
  },
  {
    id: 'ref-double-login',
    type: 'reforma',
    priority: 'P0 - Bloqueante',
    title: 'Eliminar el doble login y unificar la clave de sesión',
    scope: 'login.html -> dashboard.html',
    description: 'login.html guarda "isLoggedIn" pero dashboard.html comprueba "lp_session", forzando al usuario a loguearse dos veces seguidas.',
    fixGuide: 'Eliminar el elemento #login-screen de dashboard.html. Crear un único guard de autenticación compartido que valide el token y redirija solo si no existe.',
  },
  {
    id: 'ref-xss',
    type: 'reforma',
    priority: 'P0 - Bloqueante',
    title: 'Corregir vulnerabilidad de Stored XSS en Entidades',
    scope: 'localpay/dashboard.html (Línea 185)',
    description: 'renderEntities() concatena strings directamente a innerHTML sin escapar entidades HTML, permitiendo ejecución de código malicioso al cargar clientes o proveedores.',
    fixGuide: 'Reemplazar innerHTML con textContent o crear nodos createElement() para los textos de nombre, contacto y CUIT.',
  },
  {
    id: 'ref-architecture',
    type: 'reforma',
    priority: 'P1 - Alta',
    title: 'Unificar los dos dashboards en conflicto (index vs dashboard)',
    scope: 'Arquitectura global',
    description: 'index.html y dashboard.html son dos paneles operativos paralelos no sincronizados con tecnologías opuestas (Bootstrap vs Tailwind).',
    fixGuide: 'Convertir index.html en la Landing Page pública de LocalPay y consolidar todas las funciones (semáforo, QR, movimientos, entidades) en un único Dashboard.',
  },
  {
    id: 'ref-csv',
    type: 'reforma',
    priority: 'P1 - Alta',
    title: 'Sanitizar la exportación a CSV (CSV Injection & escape de comas)',
    scope: 'localpay/dashboard.html (Línea 215)',
    description: 'exportToCSV() no encierra valores entre comillas dobles ni previene fórmulas maliciosas de Excel (=, +, -, @).',
    fixGuide: 'Envolver cada celda con comillas dobles, escapar las comillas internas con "" y anteponer apóstrofe si inicia con caracteres de fórmula.',
  },
  {
    id: 'ref-qr-local',
    type: 'reforma',
    priority: 'P1 - Alta',
    title: 'Generar códigos QR localmente sin depender de terceros',
    scope: 'localpay/index.html & dashboard.html',
    description: 'index.html solicita la imagen a api.qrserver.com, generando un punto único de fallo externo que no funciona offline.',
    fixGuide: 'Utilizar una librería cliente autónoma como qrcode o qrcode.react para renderizar sobre un elemento <canvas> nativo.',
  },
  {
    id: 'ref-persistence',
    type: 'reforma',
    priority: 'P1 - Alta',
    title: 'Persistir transacciones y recalcular métricas reales',
    scope: 'localpay/index.html',
    description: 'Los cobros agregados solo se insertan en el DOM y se borran al recargar. Las estadísticas (ventas, egresos, neto) están hardcodeadas.',
    fixGuide: 'Almacenar las transacciones en localStorage o BD Firestore y calcular automáticamente el total de ventas sumando los cobros registrados.',
  },

  // --- MEJORAS (RECOMENDADAS PARA PRODUCCIÓN) ---
  {
    id: 'mej-ui-stack',
    type: 'mejora',
    priority: 'P2 - Media',
    title: 'Estandarizar un único framework CSS en todo el proyecto',
    scope: 'Todo el proyecto',
    description: 'Actualmente el proyecto carga Bootstrap 5.3 CDN en unas vistas y Tailwind CDN en otras, duplicando pesos y rompiendo la consistencia de diseño.',
    fixGuide: 'Consolidar el proyecto 100% en Tailwind CSS (o 100% en Bootstrap) con un sistema unificado de colores, tipografías y bordes.',
  },
  {
    id: 'mej-radar-realtime',
    type: 'mejora',
    priority: 'P2 - Media',
    title: 'Dotar de tiempo real al "Radar de Cobro" (WebSockets o SSE)',
    scope: 'localpay/dashboard.html',
    description: 'La pestaña Radar solo tiene un spinner CSS infinito sin conexión a ningún evento de pago de billeteras virtuales o terminales.',
    fixGuide: 'Conectar un webhook o canal WebSocket que cambie el estado de "Esperando Pago" a "Cobro Exitoso" automáticamente cuando el cliente pague desde su app.',
  },
  {
    id: 'mej-mobile-responsive',
    type: 'mejora',
    priority: 'P2 - Media',
    title: 'Hacer responsiva la barra lateral (Sidebar) para smartphones',
    scope: 'localpay/index.html',
    description: 'La sidebar fija de 280px con margen izquierdo bloquea la pantalla en dispositivos móviles.',
    fixGuide: 'Agregar un botón hamburguesa y un drawer colapsable con overlay para pantallas menores a 768px.',
  },
  {
    id: 'mej-lead-form',
    type: 'mejora',
    priority: 'P2 - Media',
    title: 'Configurar el formulario de captura en lead.html',
    scope: 'localpay/lead.html',
    description: 'El formulario apunta a https://formspree.io/f/tu_id_aqui, por lo que las respuestas de comerciantes interesados nunca llegan.',
    fixGuide: 'Reemplazar tu_id_aqui con el ID real de Formspree o conectar el endpoint a una API propia.',
  },
  {
    id: 'mej-cuit-checksum',
    type: 'mejora',
    priority: 'P2 - Media',
    title: 'Implementar cálculo de dígito verificador para CUIT argentino',
    scope: 'localpay/dashboard.html',
    description: 'Solo valida que tenga 11 caracteres pero no que sea un CUIT tributariamente válido.',
    fixGuide: 'Agregar algoritmo de validación módulo 11 ponderado (coeficientes 5,4,3,2,7,6,5,4,3,2) para evitar errores de tipeo de proveedores.',
  },

  // --- QUÉ ESTÁ BIEN (ACIERTOS Y FORTALEZAS) ---
  {
    id: 'bien-semaforo',
    type: 'bien',
    priority: 'Fortaleza',
    title: 'El concepto del "Semáforo de Cobro"',
    scope: 'localpay/index.html',
    description: 'UX brillante para comercios físicos: el cambio inmediato a verde grande (#f0fdf4) evita confusiones al cajero.',
    fixGuide: 'Mantener como el elemento central del punto de venta y potenciarlo con sonido de confirmación ("bip" de cobro).',
  },
  {
    id: 'bien-print',
    type: 'bien',
    priority: 'Fortaleza',
    title: 'Soporte de impresión de ticket de Cierre de Caja (@media print)',
    scope: 'localpay/index.html',
    description: 'La hoja de estilos de impresión oculta menús innecesarios (.no-print) y genera un comprobante físico limpio del turno.',
    fixGuide: 'Mantener e incorporar opciones de ancho de 58mm y 80mm para impresoras térmicas de tickets (ESC/POS).',
  },
  {
    id: 'bien-entidades',
    type: 'bien',
    priority: 'Fortaleza',
    title: 'Gestión de Entidades diferenciada (Clientes vs Proveedores)',
    scope: 'localpay/dashboard.html',
    description: 'Excelente decisión de negocio: permitir registrar tanto clientes para cobro como proveedores con CUIT y rubro.',
    fixGuide: 'Conservar la estructura de datos ampliando con campos de cuenta bancaria / alias para pagos a proveedores.',
  },
  {
    id: 'bien-filtros',
    type: 'bien',
    priority: 'Fortaleza',
    title: 'Filtro reactivo por búsqueda y categoría en tiempo real',
    scope: 'localpay/index.html',
    description: 'La función smartFilter() filtra en vivo por texto o tipo de movimiento (ingreso/egreso) de manera ágil.',
    fixGuide: 'Mantener el buscador añadiendo selector de rango de fechas.',
  },
  {
    id: 'bien-glassmorphism',
    type: 'bien',
    priority: 'Fortaleza',
    title: 'Diseño visual de la tarjeta de login',
    scope: 'localpay/login.html',
    description: 'Estética atractiva con fondo radial degradado, desenfoque de fondo y sombras limpias.',
    fixGuide: 'Adoptar esta línea gráfica como la identidad visual definitiva de LocalPay.',
  },
];

export const ActionPlanTab: React.FC = () => {
  const [filter, setFilter] = useState<'all' | 'reforma' | 'mejora' | 'bien'>('all');
  const [checkedItems, setCheckedItems] = useState<{ [key: string]: boolean }>({});
  const [copied, setCopied] = useState(false);

  const toggleCheck = (id: string) => {
    setCheckedItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredItems = ACTION_ITEMS.filter((item) => {
    if (filter === 'all') return true;
    return item.type === filter;
  });

  const generateMarkdownReport = () => {
    let md = `# INFORME DE AUDITORÍA TÉCNICA - LOCALPAY\n`;
    md += `Repositorio: https://github.com/popnegro/smartweb/tree/main/localpay\n`;
    md += `Fecha: ${new Date().toLocaleDateString()}\n`;
    md += `Calificación Global: 48/100 (Requiere Refactorización)\n\n`;

    md += `## 1. REFORMAS CRÍTICAS (Correcciones Obligatorias)\n`;
    ACTION_ITEMS.filter((i) => i.type === 'reforma').forEach((item, idx) => {
      md += `### 1.${idx + 1}. [${item.priority}] ${item.title}\n`;
      md += `- **Alcance:** ${item.scope}\n`;
      md += `- **Diagnóstico:** ${item.description}\n`;
      md += `- **Solución recomendada:** ${item.fixGuide}\n\n`;
    });

    md += `## 2. MEJORAS RECOMENDADAS (Optimizaciones y Arquitectura)\n`;
    ACTION_ITEMS.filter((i) => i.type === 'mejora').forEach((item, idx) => {
      md += `### 2.${idx + 1}. [${item.priority}] ${item.title}\n`;
      md += `- **Alcance:** ${item.scope}\n`;
      md += `- **Diagnóstico:** ${item.description}\n`;
      md += `- **Solución recomendada:** ${item.fixGuide}\n\n`;
    });

    md += `## 3. QUÉ ESTÁ BIEN (Fortalezas y Aciertos a Mantener)\n`;
    ACTION_ITEMS.filter((i) => i.type === 'bien').forEach((item, idx) => {
      md += `### 3.${idx + 1}. [${item.priority}] ${item.title}\n`;
      md += `- **Alcance:** ${item.scope}\n`;
      md += `- **Valor:** ${item.description}\n`;
      md += `- **Recomendación:** ${item.fixGuide}\n\n`;
    });

    return md;
  };

  const handleCopyReport = () => {
    const report = generateMarkdownReport();
    navigator.clipboard.writeText(report);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Action Plan Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Plan de Acción: Reformas, Mejoras y Aciertos
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Checklist interactivo de remediación técnica y recomendaciones de arquitectura.
          </p>
        </div>

        <button
          onClick={handleCopyReport}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow transition-colors cursor-pointer"
        >
          {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Download className="w-4 h-4" />}
          <span>{copied ? '¡Informe Markdown Copiado!' : 'Copiar Informe Markdown'}</span>
        </button>
      </div>

      {/* Filter Chips */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
            filter === 'all'
              ? 'bg-slate-900 text-white shadow'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Todos ({ACTION_ITEMS.length})
        </button>
        <button
          onClick={() => setFilter('reforma')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
            filter === 'reforma'
              ? 'bg-rose-600 text-white shadow'
              : 'bg-white text-rose-700 border border-rose-200 hover:bg-rose-50'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          Reformas Críticas ({ACTION_ITEMS.filter((i) => i.type === 'reforma').length})
        </button>
        <button
          onClick={() => setFilter('mejora')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
            filter === 'mejora'
              ? 'bg-blue-600 text-white shadow'
              : 'bg-white text-blue-700 border border-blue-200 hover:bg-blue-50'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          Mejoras Recomendadas ({ACTION_ITEMS.filter((i) => i.type === 'mejora').length})
        </button>
        <button
          onClick={() => setFilter('bien')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
            filter === 'bien'
              ? 'bg-emerald-600 text-white shadow'
              : 'bg-white text-emerald-700 border border-emerald-200 hover:bg-emerald-50'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          Qué está bien ({ACTION_ITEMS.filter((i) => i.type === 'bien').length})
        </button>
      </div>

      {/* Items List */}
      <div className="space-y-3">
        {filteredItems.map((item) => {
          const isDone = !!checkedItems[item.id];
          return (
            <div
              key={item.id}
              className={`bg-white rounded-xl border p-5 shadow-xs transition-all ${
                isDone
                  ? 'border-emerald-200 bg-emerald-50/20 opacity-75'
                  : item.type === 'reforma'
                  ? 'border-rose-200/80 hover:border-rose-300'
                  : item.type === 'mejora'
                  ? 'border-blue-200/80 hover:border-blue-300'
                  : 'border-emerald-200/80 hover:border-emerald-300'
              }`}
            >
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id={`chk-${item.id}`}
                  checked={isDone}
                  onChange={() => toggleCheck(item.id)}
                  className="mt-1 w-4 h-4 rounded text-blue-600 cursor-pointer accent-blue-600"
                />

                <div className="flex-1 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded tracking-wide ${
                        item.type === 'reforma'
                          ? 'bg-rose-100 text-rose-800'
                          : item.type === 'mejora'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {item.priority}
                    </span>
                    <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      {item.scope}
                    </span>
                  </div>

                  <h3
                    className={`text-sm font-bold ${
                      isDone ? 'line-through text-slate-500' : 'text-slate-900'
                    }`}
                  >
                    {item.title}
                  </h3>

                  <p className="text-xs text-slate-600 leading-relaxed">{item.description}</p>

                  <div className="mt-2 pt-2 border-t border-slate-100 text-xs">
                    <strong className="text-slate-700">Acción a realizar: </strong>
                    <span className="text-slate-600">{item.fixGuide}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
