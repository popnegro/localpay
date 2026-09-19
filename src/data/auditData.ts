import { AuditFinding, ModuleAuditSummary } from '../types';

export const MODULE_SUMMARIES: ModuleAuditSummary[] = [
  {
    id: 'login',
    name: 'Login (Acceso Seguro)',
    file: 'localpay/login.html',
    technology: 'Bootstrap 5.3 + Bootstrap Icons + Vanilla JS',
    score: 42,
    status: 'Crítico',
    summary: 'La autenticación está 100% simulada en el cliente con credenciales visibles en código fuente y en pantalla. Además, guarda una clave de sesión incompatible con dashboard.html.',
    stats: {
      critical: 2,
      warnings: 3,
      positives: 2,
    },
    highlights: [
      'Credenciales en texto plano en frontend (admin@localpay.com / 123456).',
      'Desconexión total con dashboard.html: guarda "isLoggedIn" pero dashboard busca "lp_session".',
      'Alertas nativas del navegador (alert) sin validación visual inline.',
      'Diseño visual limpio con efecto glassmorphism y Bootstrap 5.',
    ],
  },
  {
    id: 'dashboard',
    name: 'Merchant Dashboard',
    file: 'localpay/dashboard.html',
    technology: 'Tailwind CSS (CDN) + Lucide Icons + Vanilla JS',
    score: 38,
    status: 'Crítico',
    summary: 'Contiene un segundo login propio que duplica la autenticación. Posee vulnerabilidad de XSS almacenado en Entidades, código QR no funcional (solo alert), y cambio radical de stack visual frente a login/index.',
    stats: {
      critical: 3,
      warnings: 4,
      positives: 3,
    },
    highlights: [
      'Doble pantalla de login: el usuario que viene de login.html queda atrapado en una 2ª pantalla de login.',
      'Inyección XSS Directa en tabla de Entidades (innerHTML con datos de usuario sin sanear).',
      'Generador de cobro falso: solo dispara alert("QR Generado (Simulación)") sin generar QR real.',
      'Stack visual incongruente: estética Metro blanco/negro en Tailwind, incompatible con index y login.',
      'Módulo de Entidades funcional en localStorage con validación de CUIT (11 dígitos) y export CSV.',
    ],
  },
  {
    id: 'index',
    name: 'Panel Operativo (Index)',
    file: 'localpay/index.html',
    technology: 'Bootstrap 5.3 + Bootstrap Icons + qrserver.com API',
    score: 65,
    status: 'Inconsistente',
    summary: 'Index no es una landing pública sino otro Dashboard paralelo construido con Bootstrap. Tiene una excelente idea de Semáforo de Cobro y Cierre de Caja imprimible, pero está desvinculado del flujo de login.',
    stats: {
      critical: 1,
      warnings: 4,
      positives: 4,
    },
    highlights: [
      'Arquitectura invertida: index.html no es landing ni punto de entrada público, redirige de inmediato a login.html si no hay sesión.',
      'Existe duplicación con dashboard.html: son dos dashboards paralelos con distintas librerías y lógicas.',
      'Excelente feature de "Semáforo de Cobro": simulación interactiva con temporizador y cambio visual a verde.',
      'Generación de QR funcional pero dependiente de API externa (api.qrserver.com).',
      'Soporte nativo para impresión de ticket de cierre de caja (@media print).',
    ],
  },
  {
    id: 'architecture',
    name: 'Arquitectura Global',
    file: 'localpay/*',
    technology: 'Vanilla Multi-page HTML/JS Híbrido (Bootstrap + Tailwind)',
    score: 46,
    status: 'Inconsistente',
    summary: 'Falta de backend unificado, mezcla de librerías CSS que compiten entre sí, enrutamiento desordenado y estado fragmentado en diferentes claves de localStorage.',
    stats: {
      critical: 2,
      warnings: 5,
      positives: 2,
    },
    highlights: [
      'Dos dashboards en competencia dentro de la misma carpeta sin ruta clara.',
      'Sin backend ni API: todo el modelo de datos vive en localStorage de forma volátil.',
      'lead.html con endpoint no configurado (formspree.io/f/tu_id_aqui).',
    ],
  },
];

export const AUDIT_FINDINGS: AuditFinding[] = [
  // --- LOGIN ---
  {
    id: 'login-hardcoded-creds',
    moduleId: 'login',
    title: 'Credenciales en código duro y visibles en texto plano',
    category: 'Seguridad',
    severity: 'critical',
    summary: 'El usuario y contraseña están expuestos en el código HTML y validados en JavaScript cliente.',
    detail: 'En login.html líneas 24 y 43, la contraseña "123456" y el usuario "admin@localpay.com" se le muestran al usuario en un párrafo visible y luego se evalúan en una sentencia if() en el navegador. Cualquier usuario puede ver el código fuente y saltarse la autenticación ejecutando directamente localStorage.setItem("isLoggedIn", "true").',
    codeSnippet: {
      file: 'localpay/login.html (Líneas 41-47)',
      lines: '41-47',
      code: `const email = document.getElementById('email').value;
const pass = document.getElementById('password').value;
if(email === "admin@localpay.com" && pass === "123456") {
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('userName', 'Admin Sucursal');
    window.location.href = 'dashboard.html';
} else { alert("Credenciales incorrectas..."); }`,
    },
    solutionSnippet: {
      file: 'Backend / Auth Service (Recomendación)',
      description: 'Implementar autenticación real con API POST /api/auth/login y token firmado o cookie HttpOnly',
      code: `// Cliente (login.ts)
const res = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
});
if (res.ok) {
  const { user, token } = await res.json();
  sessionStorage.setItem('auth_token', token);
  window.location.href = '/dashboard';
} else {
  showFormError('Usuario o contraseña no válidos');
}`,
    },
    impact: 'Cualquier persona puede ingresar sin permiso o manipular su rol sin control de backend.',
    recommendation: 'Mover la autenticación a un servicio backend con hashing de contraseña (bcrypt/Argon2) o proveedor de identidad (Firebase Auth / Supabase Auth / OAuth2).',
  },
  {
    id: 'login-broken-session-key',
    moduleId: 'login',
    title: 'Desconexión de clave de sesión con dashboard.html (Doble Login Forzado)',
    category: 'Arquitectura',
    severity: 'critical',
    summary: 'login.html escribe una clave que dashboard.html ignora, provocando que el usuario tenga que loguearse 2 veces.',
    detail: 'login.html hace `localStorage.setItem("isLoggedIn", "true")` y redirige a `dashboard.html`. Sin embargo, `dashboard.html` verifica `localStorage.getItem("lp_session") === "active"`. Como `lp_session` nunca se seteó, al cargar `dashboard.html` se activa su modal de login interno (`#login-screen`), exigiendo volver a escribir usuario y clave.',
    codeSnippet: {
      file: 'Comparación: login.html vs dashboard.html',
      lines: 'login.html:44 vs dashboard.html:161',
      code: `// En login.html:
localStorage.setItem('isLoggedIn', 'true');
window.location.href = 'dashboard.html';

// En dashboard.html:
if(localStorage.getItem('lp_session') === 'active') {
    document.getElementById('login-screen').classList.add('hidden');
} // <-- ¡Falla! Busca 'lp_session' en vez de 'isLoggedIn'`,
    },
    solutionSnippet: {
      file: 'Unificación de Estado',
      description: 'Estandarizar una única clave de sesión o usar un módulo Auth compartido',
      code: `// Definir constante compartida o token
const SESSION_KEY = 'localpay_auth_session';

// Helper común:
export const authService = {
  isAuthenticated: () => !!localStorage.getItem(SESSION_KEY),
  login: (userData) => localStorage.setItem(SESSION_KEY, JSON.stringify(userData)),
  logout: () => {
    localStorage.removeItem(SESSION_KEY);
    window.location.href = 'login.html';
  }
};`,
    },
    impact: 'Experiencia de usuario quebrada: el operador inicia sesión y de inmediato recibe otro formulario de login idéntico.',
    recommendation: 'Eliminar el segundo formulario de login embebido en dashboard.html y usar un guard de autenticación centralizado.',
  },
  {
    id: 'login-ux-alerts',
    moduleId: 'login',
    title: 'Uso de alert() sincrónico bloqueante y falta de estados de carga',
    category: 'UX/UI',
    severity: 'medium',
    summary: 'Los errores se muestran mediante popups nativos del navegador que bloquean la ejecución.',
    detail: 'El uso de window.alert() rompe la experiencia visual en dispositivos móviles y de escritorio. Además, el botón no tiene spinner ni deshabilitación de envío múltiple mientras se procesa la solicitud.',
    impact: 'Interfaz poco profesional y susceptible a envíos dobles involuntarios.',
    recommendation: 'Agregar un alert flotante con Bootstrap/Tailwind estilizado y deshabilitar el botón con estado "Ingresando...".',
  },
  {
    id: 'login-visual-positive',
    moduleId: 'login',
    title: 'Diseño visual y composición de login card',
    category: 'Acierto',
    severity: 'positive',
    summary: 'La estética con fondo oscuro degradado y tarjeta en glassmorphism es atractiva y moderna.',
    detail: 'login.html tiene una muy buena combinación estética con fondo radial (#1e293b a #0f172a), desenfoque backdrop-filter: blur(15px), sombras suaves y tipografía Inter. Es un punto fuerte a conservar como base de diseño para la identidad de LocalPay.',
    impact: 'Buena primera impresión visual para el usuario.',
    recommendation: 'Mantener la estética visual pero aplicarle la lógica de autenticación real.',
  },

  // --- DASHBOARD ---
  {
    id: 'dash-stored-xss',
    moduleId: 'dashboard',
    title: 'Vulnerabilidad de Stored XSS en tabla de Entidades',
    category: 'Seguridad',
    severity: 'critical',
    summary: 'Inserción directa de datos no escapados mediante innerHTML en el DOM.',
    detail: 'En dashboard.html línea 185, la función renderEntities() toma las propiedades nombre, extra y contacto del array e interpola directamente en una cadena HTML que asigna a tbody.innerHTML. Si un usuario registra un cliente con nombre `<img src=x onerror="alert(document.cookie)">`, el código malicioso se ejecuta en el navegador cada vez que se carga la tabla.',
    codeSnippet: {
      file: 'localpay/dashboard.html (Líneas 184-187)',
      lines: '184-187',
      code: `data.forEach(e => {
    // VULNERABLE: Inyección HTML sin escapar
    tbody.innerHTML += \`<tr>
      <td class="p-4"><p class="font-bold">\${e.nombre}</p><p class="text-[9px]">\${e.extra}</p></td>
      <td class="p-4"><span class="...">\${e.tipo}</span></td>
      <td class="p-4 text-xs font-medium">\${e.contacto}</td>
    </tr>\`;
});`,
    },
    solutionSnippet: {
      file: 'Función segura con sanitización o DOM API',
      description: 'Crear elementos con textContent o escapar caracteres especiales con helper',
      code: `function escapeHTML(str) {
  const p = document.createElement('p');
  p.textContent = str || '';
  return p.innerHTML;
}

// O crear nodos DOM nativos:
data.forEach(e => {
  const tr = document.createElement('tr');
  const tdName = document.createElement('td');
  tdName.className = 'p-4';
  
  const pBold = document.createElement('p');
  pBold.className = 'font-bold';
  pBold.textContent = e.nombre; // Seguro contra XSS
  
  tdName.appendChild(pBold);
  tr.appendChild(tdName);
  tbody.appendChild(tr);
});`,
    },
    impact: 'Robo de sesiones, secuestro de interfaz y ejecución de scripts arbitrarios en el contexto del usuario.',
    recommendation: 'Reemplazar innerHTML con textContent o usar librerías de renderizado con auto-escape (como React) o DOMPurify.',
  },
  {
    id: 'dash-csv-formula-injection',
    moduleId: 'dashboard',
    title: 'CSV Injection y rotura de formato en exportación',
    category: 'Seguridad',
    severity: 'high',
    summary: 'La exportación a CSV no escapa comas, comillas ni fórmulas peligrosas (=, +, -, @).',
    detail: 'En exportToCSV(), se concatena `${e.nombre},${e.tipo},${e.contacto},${e.extra}\\n`. Si el nombre tiene comas (ej. "Comercializadora Norte, S.A."), desplaza las columnas. Además, si comienza con =, Excel lo interpreta como comando ejecutable (DDE / CSV Formula Injection).',
    codeSnippet: {
      file: 'localpay/dashboard.html (Líneas 213-220)',
      lines: '213-220',
      code: `function exportToCSV() {
    let csv = "Nombre,Tipo,Contacto,Extra\\n";
    entidades.forEach(e => csv += \`\${e.nombre},\${e.tipo},\${e.contacto},\${e.extra}\\n\`);
    const blob = new Blob([csv], { type: 'text/csv' });
    // ...
}`,
    },
    solutionSnippet: {
      file: 'Exportador CSV Sanitizado',
      description: 'Envolver campos en comillas y neutralizar caracteres de fórmula',
      code: `function cleanCsvCell(val) {
  let str = String(val ?? '');
  // Neutralizar fórmulas de Excel peligrosas
  if (/^[=+-\@]/.test(str)) {
    str = "'" + str;
  }
  // Escapar comillas dobles y envolver
  return '"' + str.replace(/"/g, '""') + '"';
}

function exportToCSV(entidades) {
  const headers = ['Nombre', 'Tipo', 'Contacto', 'Extra'].map(cleanCsvCell).join(',');
  const rows = entidades.map(e => [e.nombre, e.tipo, e.contacto, e.extra].map(cleanCsvCell).join(','));
  const csvContent = "\\uFEFF" + [headers, ...rows].join('\\r\\n'); // Con BOM para UTF-8 en Excel
  // ...
}`,
    },
    impact: 'Archivos CSV corruptos al abrir en Excel y riesgo de ejecución de fórmulas si hay datos de terceros.',
    recommendation: 'Implementar formateo CSV RFC 4180 con escapado de comillas y neutralización de prefijos de fórmula.',
  },
  {
    id: 'dash-stubbed-tabs',
    moduleId: 'dashboard',
    title: 'Pestañas con funciones simuladas o incompletas (Radar, Cobrar, Movimientos)',
    category: 'Funcionalidad',
    severity: 'high',
    summary: 'Las pestañas principales no realizan operaciones reales.',
    detail: '1. "Radar": Muestra un spinner infinito con el texto "Esperando Pago...", pero no tiene sockets ni verificación de cobro. 2. "Cobrar": Tiene un input gigante de monto y un botón que solo llama a `alert("QR Generado (Simulación)")`, sin generar QR. 3. "Movimientos": Lista una sola transacción escrita estáticamente en el HTML.',
    impact: 'El dashboard no puede ser utilizado operativamente por un cajero o comercio real.',
    recommendation: 'Conectar el generador de QR dinámico (como el que sí está en index.html) y simular o conectar el webhook de aprobación en tiempo real.',
  },
  {
    id: 'dash-event-bug',
    moduleId: 'dashboard',
    title: 'Error con variable obsoleta "event" en filterEntities()',
    category: 'Funcionalidad',
    severity: 'medium',
    summary: 'filterEntities() utiliza event.currentTarget sin que "event" se reciba como parámetro.',
    detail: 'En el HTML se llama onclick="filterEntities(\'todos\')" sin pasar (event). Dentro de la función, la línea `event.currentTarget.classList.add(\'active-filter\');` asume la existencia de la variable global window.event, lo cual falla en Firefox estricto y en módulos ES6 modernos.',
    impact: 'Puede arrojar "Uncaught ReferenceError: event is not defined" al hacer clic en los botones de filtro.',
    recommendation: 'Pasar el evento explícitamente en el handler o usar addEventListener con delegación.',
  },
  {
    id: 'dash-cuit-positive',
    moduleId: 'dashboard',
    title: 'Validación de CUIT y campos condicionales para Proveedores',
    category: 'Acierto',
    severity: 'positive',
    summary: 'La lógica para desplegar CUIT y Rubro solo cuando el tipo es Proveedor está bien concebida.',
    detail: 'dashboard.html incluye un toggle dinámico para mostrar los inputs de CUIT y Rubro según el radio button seleccionado, y valida que el CUIT contenga 11 caracteres. Es una consideración de negocio muy adecuada para comercios en Argentina.',
    impact: 'Captura estructurada de datos fiscales para proveedores comerciales.',
    recommendation: 'Mantener y fortalecer con el algoritmo de dígito verificador módulo 11 del CUIT argentino.',
  },

  // --- INDEX ---
  {
    id: 'index-inverted-architecture',
    moduleId: 'index',
    title: 'Index.html no es landing ni catálogo: es un segundo Dashboard paralelo',
    category: 'Arquitectura',
    severity: 'high',
    summary: 'Existe confusión estructural: index.html es un panel operativo cerrado que compite con dashboard.html.',
    detail: 'Normalmente, index.html es la puerta de entrada de un sitio web (la landing page con beneficios, precios y llamada a la acción hacia /login). En LocalPay, index.html contiene un dashboard completo ("Panel Operativo"), mientras que dashboard.html contiene otro ("Merchant Dashboard"). Tienen componentes duplicados (ambos tienen generador de cobro y tabla de movimientos), pero están hechos con tecnologías visuales distintas (Bootstrap vs Tailwind).',
    impact: 'Confusión total sobre cuál es la vista principal del sistema. Si un visitante nuevo entra al dominio raíz, es expulsado inmediatamente a login.html.',
    recommendation: 'Convertir index.html en una Landing Page atractiva del producto (o redirigir limpiamente a la app unificada) y consolidar todas las funciones operativas en un único Dashboard.',
  },
  {
    id: 'index-qr-external-api',
    moduleId: 'index',
    title: 'Generación de QR dependiente de servicio externo (api.qrserver.com)',
    category: 'Rendimiento',
    severity: 'medium',
    summary: 'La imagen del QR se solicita a un servidor externo de terceros mediante URL.',
    detail: 'En updateQR(), se asigna `img.src = "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=LocalPay_" + amount`. Si la conexión a internet es lenta, si el servicio externo sufre una caída o bloquea la IP por límite de peticiones, el comercio no puede cobrar.',
    impact: 'Punto único de fallo externo (SPOF) en la función más crítica de cobro del comercio.',
    recommendation: 'Generar los códigos QR en el cliente o backend usando una librería autónoma como qrcode o qrcode.react.',
  },
  {
    id: 'index-volatile-dom-state',
    moduleId: 'index',
    title: 'Cobros no persistidos: se borran al recargar la página',
    category: 'Funcionalidad',
    severity: 'high',
    summary: 'Las transacciones aprobadas solo se insertan en el HTML como cadenas efímeras.',
    detail: 'Al aprobarse un cobro en confirmarCobro(), la fila se inserta con insertAdjacentHTML en el tbody, pero no se guarda en localStorage ni en backend. Al recargar la página o al usar "Guardar Cambios" de perfil (que ejecuta location.reload()), se pierden todos los cobros del día.',
    impact: 'Pérdida de datos del cajero; el total de caja no refleja las transacciones pasadas.',
    recommendation: 'Guardar el array de transacciones en localStorage (o base de datos Firestore/SQL) y recalcular KPIs automáticamente a partir de la lista.',
  },
  {
    id: 'index-print-feature-positive',
    moduleId: 'index',
    title: 'Cierre de caja con soporte de impresión física (@media print)',
    category: 'Acierto',
    severity: 'positive',
    summary: 'Excelente consideración práctica para negocios con impresoras de tickets.',
    detail: 'index.html cuenta con estilos dedicados para @media print (.no-print, formateo limpio de encabezado de cierre) y la función imprimirCierre(), permitiendo que el comercio imprima el balance diario sin menús ni elementos sobrantes.',
    impact: 'Facilita la operativa física en mostrador para conciliar el dinero del turno.',
    recommendation: 'Conservar e integrar soporte para formato térmico estándar de 58mm y 80mm.',
  },
  {
    id: 'index-semaforo-positive',
    moduleId: 'index',
    title: 'Concepto de "Semáforo de Cobro" visual con temporizador',
    category: 'Acierto',
    severity: 'positive',
    summary: 'El semáforo (esperando pago -> pago aprobado) es sumamente intuitivo para cajeros.',
    detail: 'La animación pulsante del indicador y el cambio a verde brillante con fondo resaltado (#f0fdf4) brindan una respuesta sensorial inmediata al cajero sin necesidad de leer textos pequeños. Es el concepto nuclear más valioso de la UX de LocalPay.',
    impact: 'Reduce errores de cobro en mostrador y agiliza la atención al cliente.',
    recommendation: 'Convertir el temporizador simulado de 3s en un listener de eventos por WebSocket/Webhooks en vivo.',
  },
];
