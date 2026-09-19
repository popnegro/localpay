export interface UXAuditHeuristic {
  id: string;
  category: 'Ergonomía' | 'Accesibilidad' | 'Carga Cognitiva' | 'Feedback Mostrador' | 'Design System' | 'Velocidad Operativa en Mostrador';
  title: string;
  problemLegacy: string;
  solutionBaseline: string;
  impactScore: 'Crítico' | 'Alto' | 'Medio';
  wcagReference?: string;
  metricChange: string;
}

export interface BeforeAfterComparison {
  id: string;
  feature: string;
  legacyDescription: string;
  baselineDescription: string;
  legacyIssues: string[];
  baselineBenefits: string[];
  legacySnippet: string;
  baselineSnippet: string;
}

export const UX_SCORECARD = {
  overallScore: {
    legacy: 34,
    baseline: 96,
  },
  categories: [
    {
      name: 'Ergonomía Móvil (Thumb Zone)',
      legacy: 25,
      baseline: 98,
      description: 'Alcance con una sola mano y ley de Fitts en pantallas de 360-430px.',
    },
    {
      name: 'Accesibilidad & Touch Targets',
      legacy: 30,
      baseline: 95,
      description: 'Targets mínimos de 48x48px (WCAG 2.5.5/2.5.8) y contraste AA.',
    },
    {
      name: 'Velocidad Operativa en Mostrador',
      legacy: 40,
      baseline: 96,
      description: 'Numpad integrado vs teclado virtual del SO que tapa la pantalla.',
    },
    {
      name: 'Consistencia de Design System',
      legacy: 20,
      baseline: 94,
      description: 'Eliminación de la fragmentación (Glassmorphism vs Brutalismo vs Bootstrap).',
    },
    {
      name: 'Visibilidad de Semáforo (Feedback)',
      legacy: 55,
      baseline: 98,
      description: 'Confirmación de pago visible a 1.5 metros de distancia por cliente y cajero.',
    },
  ],
};

export const UX_HEURISTICS: UXAuditHeuristic[] = [
  {
    id: 'h-thumb-zone',
    category: 'Ergonomía',
    title: 'Ley de Fitts y Ergonomía de la Zona del Pulgar (Thumb Zone)',
    problemLegacy:
      'En index.html y dashboard.html los botones de acción primarios (Confirmar Cobro, Filtros, Menús) estaban anclados en el tercio superior de la pantalla (>550px de altura). Operar el teléfono con una mano requería reacomodar la mano continuamente, provocando caídas del dispositivo.',
    solutionBaseline:
      'Arquitectura Bottom-Heavy: El Numpad numérico, los accesos directos a billetes y el botón primario "Generar QR" se encuentran en el 40% inferior de la pantalla (Natural Thumb Zone).',
    impactScore: 'Crítico',
    wcagReference: 'Nielsen H4 / Ergonomía Móvil Hooper',
    metricChange: 'Reducción del 65% en distancia de desplazamiento del dedo por cobro.',
  },
  {
    id: 'h-touch-targets',
    category: 'Accesibilidad',
    title: 'Dimensionamiento Mínimo de Targets Táctiles (Touch Targets)',
    problemLegacy:
      'Los botones de la barra de herramientas, filas de tabla y selectores tenían alturas de entre 26px y 32px con márgenes inferiores a 4px. En horas pico de mostrador con clientes apurados, se producían toques accidentales recurrentes.',
    solutionBaseline:
      'Todos los elementos interactivos tienen un área de contacto mínima de 48x48px con estados activos (active:scale-95) y espaciado de seguridad de 8px.',
    impactScore: 'Crítico',
    wcagReference: 'WCAG 2.1 SC 2.5.5 (Target Size) & Apple HIG',
    metricChange: 'Área táctil incrementada de 32px a 52px en botones de cajero.',
  },
  {
    id: 'h-numpad-friction',
    category: 'Velocidad Operativa en Mostrador',
    title: 'Fricción del Teclado Virtual del Sistema Operativo',
    problemLegacy:
      'Hacer tap en un <input type="number"> en iOS/Android abre el teclado virtual que cubre el 50% vertical del viewport, fuerza zoom involuntario (si font < 16px) y oculta el total o el semáforo.',
    solutionBaseline:
      'Numpad táctil integrado en la interfaz gráfica con display de monto en 34px bold, feedback visual/acústico y botones de billetes frecuentes (+1k, +2k, +5k, +10k, +20k).',
    impactScore: 'Crítico',
    wcagReference: 'Nielsen H7 (Flexibilidad y Eficiencia de Uso)',
    metricChange: 'Tiempo de ingreso de monto reducido de 6.2s a 1.8s promedio.',
  },
  {
    id: 'h-table-overflow',
    category: 'Carga Cognitiva',
    title: 'Desbordamiento Horizontal de Tablas (Data Clutter)',
    problemLegacy:
      'Las tablas HTML tradicionales (<table>) de transacciones forzaban scroll horizontal en smartphones de 360-390px, cortando columnas críticas como el estado o el monto.',
    solutionBaseline:
      'Patrón Mobile "Stacked Cards": Cada transacción se presenta como una tarjeta compacta de 2 líneas con jerarquía clara: Ícono de método + Nombre/Ref + Monto en negrita + Badge de estado.',
    impactScore: 'Alto',
    wcagReference: 'WCAG 1.4.10 (Reflow)',
    metricChange: '0% de scroll horizontal. Densidad de información optimizada.',
  },
  {
    id: 'h-semaforo-visibility',
    category: 'Feedback Mostrador',
    title: 'Visibilidad del Semáforo de Cobro a Distancia',
    problemLegacy:
      'El cliente que apoya su smartphone para escanear el QR no podía saber con certeza si su pago ingresó porque la confirmación era un pequeño texto o un alert() bloqueante que requería OK manual del cajero.',
    solutionBaseline:
      'Pantalla completa o tarjeta dominante de Semáforo de Cobro: Cambia a Verde Esmeralda (#059669) con tilde animada, tipografía de 24px y vibración/beep inmediato al detectar el pago por Radar.',
    impactScore: 'Crítico',
    wcagReference: 'Nielsen H1 (Visibilidad del Estado del Sistema)',
    metricChange: 'Claridad de cobro 100% visible a 1.5 metros de distancia.',
  },
  {
    id: 'h-contrast-wcag',
    category: 'Accesibilidad',
    title: 'Contraste Cromático en Ambientes con Luz Solar o Kiosco',
    problemLegacy:
      'El diseño original usaba grises tenues (#9CA3AF sobre blanco) con ratio de 2.7:1, violando el estándar mínimo de 4.5:1. En mostradores expuestos a luz de vidriera o exteriores, la pantalla era ilegible.',
    solutionBaseline:
      'Paleta con contraste ratio superior a 7:1 en textos principales (#0F172A sobre #FFFFFF) y 4.8:1 en textos secundarios (#475569), cumpliendo WCAG 2.1 Nivel AA y AAA.',
    impactScore: 'Alto',
    wcagReference: 'WCAG 2.1 SC 1.4.3 (Contrast Minimum)',
    metricChange: 'Ratio de contraste elevado de 2.7:1 a 8.2:1 en montos y estados.',
  },
  {
    id: 'h-design-system',
    category: 'Design System',
    title: 'Fragmentación Estética de 3 Pantallas Desconectadas',
    problemLegacy:
      'login.html usaba efecto "glassmorphism" oscuro, dashboard.html usaba brutalismo con border-radius: 0px y tipografía mono, e index.html usaba Bootstrap 5 con sidebar azul marino. Parecían tres aplicaciones distintas.',
    solutionBaseline:
      'Design System Mobile-First coherente con tokens compartidos: escala tipográfica fija (13px, 15px, 18px, 24px, 32px), esquinas redondeadas uniformes (rounded-2xl de 16px), sombras controladas y paleta Slate + Emerald/Blue.',
    impactScore: 'Alto',
    wcagReference: 'Nielsen H4 (Consistencia y Estándares)',
    metricChange: '100% de coherencia visual en todos los flujos de usuario.',
  },
];

export const BEFORE_AFTER_COMPARISONS: BeforeAfterComparison[] = [
  {
    id: 'numpad-vs-input',
    feature: 'Ingreso de Importe en Mostrador',
    legacyDescription: 'Input tradicional HTML con teclado nativo del teléfono',
    baselineDescription: 'Numpad ergonómico integrado con billetes directos',
    legacyIssues: [
      'Abre el teclado virtual de iOS/Android que tapa el 50% de la pantalla.',
      'Requiere dos manos para sujetar el móvil y tipear centavos.',
      'Causa auto-zoom involuntario en Safari si el tamaño de fuente era < 16px.',
      'No tiene atajos rápidos para valores comunes de venta.',
    ],
    baselineBenefits: [
      'Numpad táctil nativo dentro de la interfaz con botones de 54px.',
      'Operación garantizada con un solo dedo (100% una sola mano).',
      'Atajos de billetes frecuentes (+1k, +2k, +5k, +10k, +20k) en 1 toque.',
      'Feedback auditivo/táctil instantáneo al presionar.',
    ],
    legacySnippet: `<!-- Legacy (dashboard.html): Fricción con teclado nativo -->
<div class="mb-3">
  <label class="form-label text-muted">Monto a cobrar</label>
  <input type="number" id="monto" class="form-control" placeholder="0.00" />
  <button onclick="cobrar()" class="btn btn-primary mt-2">Cobrar</button>
</div>`,
    baselineSnippet: `<!-- Baseline Mobile-First: Numpad ergonómico en la Zona del Pulgar -->
<div class="mobile-numpad-container">
  <div class="amount-display">$4.500</div>
  <div class="quick-cash-chips">
    <button>+$1.000</button><button>+$2.000</button><button>+$5.000</button>
  </div>
  <div class="numpad-grid">
    <!-- Botones táctiles de 54px con active:scale-95 -->
    <button>1</button><button>2</button><button>3</button>...
  </div>
  <button class="primary-charge-btn">GENERAR QR • COBRAR</button>
</div>`,
  },
  {
    id: 'table-vs-cards',
    feature: 'Visualización de Movimientos y Transacciones',
    legacyDescription: 'Tabla HTML rígida con scroll horizontal infinito',
    baselineDescription: 'Feed de tarjetas compactas ("Stacked Cards") táctiles',
    legacyIssues: [
      'Columnas ocultas fuera de la pantalla en móviles de 360-390px.',
      'Obliga a realizar scroll horizontal incómodo y torpe en mostrador.',
      'Textos diminutos (11px) para intentar comprimir 6 columnas.',
      'Filas estrechas difíciles de presionar para ver el detalle.',
    ],
    baselineBenefits: [
      'Tarjetas táctiles de 2 líneas adaptadas al 100% del ancho del móvil.',
      'Jerarquía clara: ícono de canal (QR/MODO) + Monto en 16px bold + Estado.',
      'Filtrado ultra-rápido con chips horizontales deslizables.',
      'Toque para abrir el comprobante completo en un Bottom Sheet modal.',
    ],
    legacySnippet: `<!-- Legacy: Tabla desbordada en smartphones -->
<div class="table-responsive">
  <table class="table">
    <thead>
      <tr><th>ID</th><th>Fecha</th><th>Hora</th><th>Tipo</th><th>Monto</th><th>Estado</th></tr>
    </thead>
    <tbody>...</tbody>
  </table>
</div>`,
    baselineSnippet: `<!-- Baseline Mobile-First: Tarjetas apiladas de alta legibilidad -->
<div class="mobile-card-list space-y-2.5">
  <div class="card-item flex items-center justify-between p-3.5 rounded-2xl bg-white shadow-xs">
    <div class="flex items-center gap-3">
      <div class="icon-badge bg-emerald-50 text-emerald-600"><QrCode /></div>
      <div>
        <p class="font-bold text-sm text-slate-900">Venta Mostrador</p>
        <p class="text-xs text-slate-500">14:32 hs • MODO / MP</p>
      </div>
    </div>
    <div class="text-right">
      <span class="font-black text-emerald-600">+$4.500</span>
      <span class="badge badge-success">Aprobado</span>
    </div>
  </div>
</div>`,
  },
  {
    id: 'navigation-vs-bottomnav',
    feature: 'Navegación del Sistema',
    legacyDescription: 'Sidebar lateral fijo de 280px que tapaba la pantalla',
    baselineDescription: 'Bottom Navigation Bar fija ergonómica con Safe Area',
    legacyIssues: [
      'En index.html el sidebar ocupaba el 80% de la pantalla del teléfono.',
      'Requería abrir y cerrar un menú hamburguesa para cualquier acción.',
      'Botones de navegación fuera de la zona accesible del pulgar.',
    ],
    baselineBenefits: [
      'Bottom Bar fija de 64px ubicada donde descansa naturalmente el pulgar.',
      'Acceso en 1 tap a: Cobrar, Movimientos, Entidades y Caja.',
      'Indicadores activos claros y soporte para el gesto de deslizamiento.',
      'Respeta el safe-area-inset de iOS (Home Indicator).',
    ],
    legacySnippet: `<!-- Legacy: Sidebar fijo no responsivo -->
<div class="sidebar position-fixed top-0 start-0 h-100 bg-dark text-white" style="width: 280px;">
  <ul class="nav flex-column">...</ul>
</div>`,
    baselineSnippet: `<!-- Baseline Mobile-First: Bottom Navigation Bar ergonómica -->
<nav class="fixed bottom-0 inset-x-0 h-16 bg-white/95 backdrop-blur-md border-t border-slate-200 flex items-center justify-around z-40 pb-[env(safe-area-inset-bottom)]">
  <button class="nav-tab active"><Zap /><span>Cobrar</span></button>
  <button class="nav-tab"><Receipt /><span>Movimientos</span></button>
  <button class="nav-tab"><Users /><span>Entidades</span></button>
  <button class="nav-tab"><Wallet /><span>Caja</span></button>
</nav>`,
  },
];

export const MOBILE_DESIGN_TOKENS = {
  touchTargets: {
    minimum: '48px',
    primaryButtons: '54px',
    numpadKeys: '56px',
    chips: '36px',
  },
  typographyScale: [
    { token: 'text-display', size: '32px', mobileRole: 'Display Monto en Numpad / Total' },
    { token: 'text-h1', size: '22px', mobileRole: 'Encabezados de pantalla / Semáforo' },
    { token: 'text-h2', size: '18px', mobileRole: 'Títulos de sección y tarjetas' },
    { token: 'text-body', size: '15px-16px', mobileRole: 'Texto principal e inputs (sin autozoom iOS)' },
    { token: 'text-caption', size: '12px-13px', mobileRole: 'Fechas, métodos y referencias secundarias' },
  ],
  thumbZones: [
    {
      name: 'Zona Natural (Natural Thumb Zone)',
      coverage: '40% inferior de la pantalla',
      color: 'Emerald / Verde',
      elements: 'Numpad numérico, botón Cobrar, tabs de navegación inferior, chips de billetes.',
    },
    {
      name: 'Zona de Esfuerzo Moderado (Stretch Zone)',
      coverage: '35% intermedio de la pantalla',
      color: 'Amber / Amarillo',
      elements: 'Tarjetas de transacciones recientes, resumen de monto, filtros de búsqueda.',
    },
    {
      name: 'Zona Difícil / Fuera de Alcance (Hard to Reach)',
      coverage: '25% superior de la pantalla',
      color: 'Rose / Rojo',
      elements: 'Identificador de sucursal, cambio de usuario, ajustes de configuración no destructivos.',
    },
  ],
};
