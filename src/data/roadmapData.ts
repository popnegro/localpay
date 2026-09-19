export interface RoadmapStep {
  id: number;
  slug: 'login' | 'apertura' | 'pos-numpad' | 'qr-display' | 'semaforo' | 'cierre-caja';
  title: string;
  shortTitle: string;
  stage: string;
  badge: string;
  description: string;
  uxHeuristic: string;
  techStack: string;
  keyBenefits: string[];
  metrics: {
    legacy: string;
    baseline: string;
  };
}

export const POS_ROADMAP_STEPS: RoadmapStep[] = [
  {
    id: 1,
    slug: 'login',
    title: 'Hito 1: Autenticación Segura & PIN de Acceso Rápido',
    shortTitle: '1. Login & PIN',
    stage: 'Control de Acceso',
    badge: 'Seguridad Vercel',
    description:
      'Ingreso ágil mediante PIN numérico de 4 dígitos o credenciales de cajero/admin. Emisión de token de sesión unificado sin exponer claves en el HTML del frontend ni provocar doble pantalla de autenticación.',
    uxHeuristic: 'Ergonomía de Teclado Numérico (Numpad PIN 56px) • Reducción de Fricción Cognitiva',
    techStack: 'Vercel Serverless /api/auth/login • JWT unificado • bcrypt • Sanitización de inputs',
    keyBenefits: [
      'Eliminación del tag <p> con contraseña en texto plano del frontend original',
      'Corrección del bug de superposición z-[2000] que forzaba doble login repetitivo',
      'Autenticación biométrica o PIN en 1.2 segundos sin teclado del SO',
    ],
    metrics: {
      legacy: 'Doble login manual (18 seg)',
      baseline: 'PIN ágil 4 dígitos (1.5 seg)',
    },
  },
  {
    id: 2,
    slug: 'apertura',
    title: 'Hito 2: Apertura de Caja & Fondo Inicial',
    shortTitle: '2. Apertura Caja',
    stage: 'Turno de Mostrador',
    badge: 'Persistencia Local',
    description:
      'Declaración obligatoria del fondo de cambio inicial en mostrador, asignación de caja (CAJA-01) y verificación de conectividad para cobros offline u online.',
    uxHeuristic: 'Visibilidad del Estado del Sistema (Nielsen #1) • Confirmación de Apertura',
    techStack: 'localStorage tipado + dbService • Sincronización de balance de apertura',
    keyBenefits: [
      'Registro inmutable de saldo base de inicio de turno',
      'Asignación unívoca de cajero, sucursal y terminal física',
      'Prevención de descuadres de caja desde el minuto cero',
    ],
    metrics: {
      legacy: 'Sin registro de fondo inicial',
      baseline: 'Arqueo inicial verificado en 2 clics',
    },
  },
  {
    id: 3,
    slug: 'pos-numpad',
    title: 'Hito 3: Terminal POS Mostrador con Numpad One-Thumb',
    shortTitle: '3. Numpad Mostrador',
    stage: 'Operación Táctil',
    badge: 'Thumb Zone 40%',
    description:
      'Teclado numérico táctil de alta densidad ubicado en la zona natural del pulgar (40% inferior). Previene que el sistema operativo despliegue el teclado virtual que tapa la pantalla y genera zoom descontrolado.',
    uxHeuristic: 'Zona Natural del Pulgar (Steven Hoober) • Ley de Fitts (Botones de 56px)',
    techStack: 'Numpad sintético reactivo • Billetes rápidos de un toque • Web Audio API para feedback háptico',
    keyBenefits: [
      '100% de operaciones de carga de importe sin desplazar la mano',
      'Billetes rápidos (+$1.000, +$2.000, +$5.000, +$10.000, +$20.000)',
      'Retroalimentación sonora instantánea que confirma pulsación en ambientes ruidosos',
    ],
    metrics: {
      legacy: 'Input nativo con teclado SO (8 errores/hora)',
      baseline: 'Numpad táctil ergonómico (<0.5 errores/hora)',
    },
  },
  {
    id: 4,
    slug: 'qr-display',
    title: 'Hito 4: Presentación de QR Interoperable (EMVCo)',
    shortTitle: '4. QR Interoperable',
    stage: 'Cobro Omnicanal',
    badge: 'Canvas Autónomo 0ms',
    description:
      'Generación local inmediata del código QR interoperable con importe dinámico codificado. Compatible con billeteras Mercado Pago, MODO, Cuenta DNI, BNA+ y banca móvil.',
    uxHeuristic: 'Eficiencia de Uso (Nielsen #7) • Enfoque Monotarea con Temporizador de Sesión',
    techStack: 'qrcode engine sobre <canvas> local • 0 ms de latencia • Sin dependencia de api.qrserver.com',
    keyBenefits: [
      'Eliminación de la dependencia crítica externa que dejaba la caja inoperativa sin internet externo',
      'Temporizador visual de sesión de cobro para evitar bloqueos en mostrador',
      'Simulador de aprobación omnicanal para auditoría y testing en vivo',
    ],
    metrics: {
      legacy: 'API externa (1.8s a 4s de carga)',
      baseline: 'Render local instantáneo (0 ms)',
    },
  },
  {
    id: 5,
    slug: 'semaforo',
    title: 'Hito 5: Semáforo de Confirmación a 1.5m & Ticket',
    shortTitle: '5. Semáforo 1.5m',
    stage: 'Feedback Mostrador',
    badge: 'WCAG AAA Contrast',
    description:
      'Confirmación visual cromática ultra-contrastada visible a más de 1.5 metros tanto por el cliente como por el cajero. Emisión de comprobante digital y envío directo por WhatsApp.',
    uxHeuristic: 'Diseño para Ambientes Físicos Hostiles • Confirmación Sonora y Cromática Instantánea',
    techStack: 'Tokens de color WCAG AAA • Generador de comprobantes • Impresión térmica 58mm/80mm',
    keyBenefits: [
      'El cajero y el cliente verifican el pago aprobado sin tener que estirarse para ver la pantalla',
      'Tono acústico armónico que ratifica la transacción con certeza',
      'Compartir comprobante por WhatsApp en 1 toque',
    ],
    metrics: {
      legacy: 'Alerta nativa alert() invasiva e ilegible',
      baseline: 'Semáforo de alta visibilidad a 1.5 metros',
    },
  },
  {
    id: 6,
    slug: 'cierre-caja',
    title: 'Hito 6: Conciliación, Tarjetas Apiladas & Cierre de Caja',
    shortTitle: '6. Cierre de Caja',
    stage: 'Conciliación & Cierre',
    badge: 'Blindaje CSV',
    description:
      'Monitoreo del balance neto en tiempo real con historial en tarjetas apiladas (sin scroll horizontal en smartphones) y arqueo de caja con exportación blindada contra inyección de fórmulas.',
    uxHeuristic: 'Arquitectura de Información Adaptativa (Stacked Cards) • Control y Libertad del Usuario',
    techStack: 'Cálculo reactivo de KPIs • Saneamiento CSV RFC 4180 con comillas y prefijo apóstrofe anti Formula Injection',
    keyBenefits: [
      'Sustitución de tablas de 6 columnas con scroll horizontal por tarjetas táctiles densas',
      'Balance neto calculado al instante: Cobros QR + Efectivo - Gastos',
      'Ticket de cierre imprimible con desglose fiscal por turnos',
    ],
    metrics: {
      legacy: 'Tabla rota en móvil con scroll horizontal',
      baseline: 'Tarjetas apiladas legibles en 360px',
    },
  },
];
