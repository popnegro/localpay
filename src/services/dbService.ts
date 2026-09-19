import {
  collection,
  doc,
  setDoc,
  onSnapshot,
  query,
  orderBy,
  limit,
  enableNetwork,
  disableNetwork,
} from 'firebase/firestore';
import { getFirebaseDb } from './firebase';
import { bootstrapFirestoreCollections } from './firebaseInit';

export interface NetworkSyncState {
  isOnline: boolean;
  isSimulatedOffline: boolean;
  pendingQueueCount: number;
  lastSyncTime: string | null;
  syncStatus: 'idle' | 'syncing' | 'synced' | 'error';
  pendingTransactions: Transaction[];
}

export interface Entity {
  id: string;
  tipo: 'cliente' | 'proveedor';
  nombre: string;
  contacto: string;
  extra: string; // CUIT o Rubro
  cuitValido?: boolean;
  fechaRegistro: string;
}

export interface Transaction {
  id: string;
  codigo: string;
  tipo: 'ingreso' | 'egreso';
  metodo: 'QR Interoperable' | 'Transferencia' | 'Efectivo' | 'Tarjeta';
  monto: number;
  concepto: string;
  hora: string;
  fecha: string;
  cajero: string;
  cajaId?: string;
  estado: 'aprobado' | 'pendiente' | 'rechazado';
}

export interface CajaTerminal {
  id: string;
  nombre: string;
  sucursal: string;
  operador: string;
  estado: 'abierta' | 'cerrada';
  fondoInicial: number;
  horaApertura: string;
  ingresosTotal: number;
  egresosTotal: number;
  balanceNeto: number;
  ultimoUpdate: string;
}

export interface DesgloseMetodo {
  metodo: string;
  categoria: 'efectivo' | 'digital';
  monto: number;
  operaciones: number;
  porcentaje: number;
}

export interface CierreCajaRecord {
  id: string;
  cajaId: string;
  cajaNombre?: string;
  cajero: string;
  fecha: string;
  horaApertura: string;
  horaCierre: string;
  fondoInicial: number;
  totalEfectivoIngresos: number;
  totalEfectivoEgresos: number;
  efectivoEsperado: number;
  efectivoRealContado: number;
  diferenciaEfectivo: number;
  totalDigital: number;
  desgloseDigital: DesgloseMetodo[];
  desgloseEfectivo: DesgloseMetodo[];
  totalFacturado: number;
  totalOperaciones: number;
  ticketPromedio: number;
  observaciones: string;
  creadoEn: string;
}

export interface WebhookHistoryItem {
  id: string;
  provider: 'mercadopago' | 'modo' | 'cuentadni';
  topic?: string;
  action?: string;
  status: 'aprobado' | 'pendiente' | 'rechazado';
  monto: number;
  cajaId: string;
  referencia: string;
  timestamp: string;
  rawPayload: unknown;
}

const ENTITIES_KEY = 'lp_entities_v2';
const TRANSACTIONS_KEY = 'lp_transactions_v2';
const CAJAS_KEY = 'lp_cajas_v2';

const INITIAL_ENTITIES: Entity[] = [
  {
    id: 'ent_01',
    tipo: 'cliente',
    nombre: 'Juan Pérez (Empresa Distribuidora)',
    contacto: 'juan@distribuidora.com',
    extra: 'Alimentos Mayoristas',
    fechaRegistro: '2026-09-18 10:30',
  },
  {
    id: 'ent_02',
    tipo: 'proveedor',
    nombre: 'Logística Cuyo S.A.',
    contacto: 'facturacion@logisticacuyo.com.ar',
    extra: '30-71122334-8',
    cuitValido: true,
    fechaRegistro: '2026-09-17 14:20',
  },
  {
    id: 'ent_03',
    tipo: 'cliente',
    nombre: 'Café & Delicias Gourmet',
    contacto: '+54 261 455-8899',
    extra: 'Gastronomía',
    fechaRegistro: '2026-09-19 09:15',
  },
];

const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 'tx_01',
    codigo: 'TX-901',
    tipo: 'ingreso',
    metodo: 'QR Interoperable',
    monto: 14500,
    concepto: 'Cobro Mostrador #01 (Mercado Pago)',
    hora: '13:45',
    fecha: '2026-09-19',
    cajero: 'Caja 01',
    cajaId: 'CAJA-01',
    estado: 'aprobado',
  },
  {
    id: 'tx_02',
    codigo: 'TX-902',
    tipo: 'ingreso',
    metodo: 'Transferencia',
    monto: 28300,
    concepto: 'Pago Mayorista Café & Delicias',
    hora: '14:02',
    fecha: '2026-09-19',
    cajero: 'Caja 01',
    cajaId: 'CAJA-01',
    estado: 'aprobado',
  },
  {
    id: 'tx_03',
    codigo: 'TX-903',
    tipo: 'egreso',
    metodo: 'Efectivo',
    monto: 5000,
    concepto: 'Pago Insumos Limpieza',
    hora: '14:15',
    fecha: '2026-09-19',
    cajero: 'Caja 01',
    cajaId: 'CAJA-01',
    estado: 'aprobado',
  },
  {
    id: 'tx_04',
    codigo: 'TX-904',
    tipo: 'ingreso',
    metodo: 'QR Interoperable',
    monto: 12400,
    concepto: 'Cobro Mostrador #02 (MODO)',
    hora: '14:28',
    fecha: '2026-09-19',
    cajero: 'Caja 02',
    cajaId: 'CAJA-02',
    estado: 'aprobado',
  },
];

const INITIAL_CAJAS: CajaTerminal[] = [
  {
    id: 'CAJA-01',
    nombre: 'Terminal Mostrador Principal',
    sucursal: 'Mendoza Centro',
    operador: 'Cajero 01',
    estado: 'abierta',
    fondoInicial: 15000,
    horaApertura: '08:30',
    ingresosTotal: 42800,
    egresosTotal: 5000,
    balanceNeto: 37800,
    ultimoUpdate: 'Hace 2 minutos',
  },
  {
    id: 'CAJA-02',
    nombre: 'Terminal Autoservicio / Barra',
    sucursal: 'Mendoza Centro',
    operador: 'Cajero 02',
    estado: 'abierta',
    fondoInicial: 10000,
    horaApertura: '09:00',
    ingresosTotal: 12400,
    egresosTotal: 0,
    balanceNeto: 12400,
    ultimoUpdate: 'Hace 15 minutos',
  },
  {
    id: 'CAJA-03',
    nombre: 'Terminal Sucursal Godoy Cruz',
    sucursal: 'Godoy Cruz',
    operador: 'Supervisor Sucursal',
    estado: 'cerrada',
    fondoInicial: 0,
    horaApertura: '--:--',
    ingresosTotal: 0,
    egresosTotal: 0,
    balanceNeto: 0,
    ultimoUpdate: 'Turno finalizado',
  },
];

// Callbacks para sincronización en tiempo real reactiva
type Listener<T> = (data: T) => void;
const txListeners: Listener<Transaction[]>[] = [];
const cajasListeners: Listener<CajaTerminal[]>[] = [];
const webhookArrivalListeners: Listener<WebhookHistoryItem>[] = [];
const networkSyncListeners: Listener<NetworkSyncState>[] = [];

const PENDING_QUEUE_KEY = 'LOCALPAY_PENDING_TXS_QUEUE';
let isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
let isSimulatedOffline = false;
let syncStatus: 'idle' | 'syncing' | 'synced' | 'error' = 'idle';
let lastSyncTime: string | null = null;
let windowNetworkListenersAttached = false;

function notifyNetworkSync() {
  const queue = dbService.getPendingQueue();
  const state: NetworkSyncState = {
    isOnline: isSimulatedOffline ? false : isOnline,
    isSimulatedOffline,
    pendingQueueCount: queue.length,
    lastSyncTime,
    syncStatus,
    pendingTransactions: queue,
  };
  networkSyncListeners.forEach((fn) => fn(state));
}

let isFirestoreListenerActive = false;
let sseEventSource: EventSource | null = null;

export const dbService = {
  // ==========================================================================
  // GESTIÓN DE COLA OFFLINE Y ESTADO DE RED
  // ==========================================================================
  getPendingQueue(): Transaction[] {
    try {
      const data = localStorage.getItem(PENDING_QUEUE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  addToPendingQueue(tx: Transaction): void {
    const queue = this.getPendingQueue();
    if (!queue.some((item) => item.id === tx.id)) {
      const updated = [tx, ...queue];
      localStorage.setItem(PENDING_QUEUE_KEY, JSON.stringify(updated));
      notifyNetworkSync();
    }
  },

  removeFromPendingQueue(txId: string): void {
    const queue = this.getPendingQueue();
    const updated = queue.filter((t) => t.id !== txId);
    localStorage.setItem(PENDING_QUEUE_KEY, JSON.stringify(updated));
    notifyNetworkSync();
  },

  clearPendingQueue(): void {
    localStorage.removeItem(PENDING_QUEUE_KEY);
    notifyNetworkSync();
  },

  getNetworkSyncState(): NetworkSyncState {
    const queue = this.getPendingQueue();
    return {
      isOnline: isSimulatedOffline ? false : isOnline,
      isSimulatedOffline,
      pendingQueueCount: queue.length,
      lastSyncTime,
      syncStatus,
      pendingTransactions: queue,
    };
  },

  subscribeNetworkSync(listener: (state: NetworkSyncState) => void): () => void {
    networkSyncListeners.push(listener);
    listener(this.getNetworkSyncState());
    return () => {
      const idx = networkSyncListeners.indexOf(listener);
      if (idx !== -1) networkSyncListeners.splice(idx, 1);
    };
  },

  async setSimulateOffline(simulate: boolean): Promise<void> {
    isSimulatedOffline = simulate;
    const firestore = getFirebaseDb();
    if (firestore) {
      try {
        if (simulate) {
          await disableNetwork(firestore);
        } else {
          await enableNetwork(firestore);
        }
      } catch (e) {
        console.warn('Firestore network toggle notice:', e);
      }
    }
    notifyNetworkSync();

    if (!simulate && isOnline) {
      await this.reSyncPendingTransactions();
    }
  },

  async reSyncPendingTransactions(): Promise<{ syncedCount: number; errors: number }> {
    const queue = this.getPendingQueue();
    if (queue.length === 0) {
      syncStatus = 'synced';
      notifyNetworkSync();
      return { syncedCount: 0, errors: 0 };
    }

    if (!isOnline || isSimulatedOffline) {
      syncStatus = 'idle';
      notifyNetworkSync();
      return { syncedCount: 0, errors: 0 };
    }

    const firestore = getFirebaseDb();
    if (!firestore) {
      return { syncedCount: 0, errors: 0 };
    }

    syncStatus = 'syncing';
    notifyNetworkSync();

    let syncedCount = 0;
    let errors = 0;
    const remainingQueue: Transaction[] = [];

    for (const tx of queue) {
      try {
        const txDocRef = doc(firestore, 'transacciones', tx.id);
        await setDoc(txDocRef, tx, { merge: true });
        syncedCount++;
      } catch (err) {
        console.warn(`[Firestore Queue] Error sincronizando ${tx.id}:`, err);
        errors++;
        remainingQueue.push(tx);
      }
    }

    localStorage.setItem(PENDING_QUEUE_KEY, JSON.stringify(remainingQueue));
    syncStatus = errors === 0 ? 'synced' : 'error';
    lastSyncTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    notifyNetworkSync();

    return { syncedCount, errors };
  },
  // ==========================================================================
  // INICIALIZACIÓN DE SINCRONIZACIÓN EN TIEMPO REAL (FIRESTORE + SSE BACKEND)
  // ==========================================================================
  initCloudSync(activeCajaId: string = 'CAJA-01') {
    // 0. Registrar listeners de ventana online/offline si aún no están activos
    if (typeof window !== 'undefined' && !windowNetworkListenersAttached) {
      window.addEventListener('online', () => {
        isOnline = true;
        notifyNetworkSync();
        this.reSyncPendingTransactions();
      });
      window.addEventListener('offline', () => {
        isOnline = false;
        notifyNetworkSync();
      });
      windowNetworkListenersAttached = true;
    }

    // 1. Sembrar y asegurar colecciones iniciales 'transacciones' y 'cajas' en Firestore
    bootstrapFirestoreCollections().catch((err) => {
      console.warn('Bootstrap Firestore notice:', err);
    });

    // 2. Iniciar listener de Firestore si la DB está disponible
    if (!isFirestoreListenerActive) {
      const firestore = getFirebaseDb();
      if (firestore) {
        try {
          // Escuchar colección principal 'transacciones' con detección de metadatos de red
          const txCollection = collection(firestore, 'transacciones');
          const q = query(txCollection, orderBy('fecha', 'desc'), limit(100));

          onSnapshot(
            q,
            { includeMetadataChanges: true },
            (snapshot) => {
              const isFromCache = snapshot.metadata.fromCache;
              // Si el snapshot llega desde el servidor y no estamos en simulación offline, confirmar online
              if (!isFromCache && !isSimulatedOffline) {
                isOnline = true;
                notifyNetworkSync();
                // Si había transacciones en cola local, disparar re-sincronización automática
                if (this.getPendingQueue().length > 0) {
                  this.reSyncPendingTransactions();
                }
              }

              if (!snapshot.empty) {
                const cloudTxs: Transaction[] = [];
                snapshot.forEach((docSnap) => {
                  const data = docSnap.data() as Transaction;
                  cloudTxs.push({ ...data, id: docSnap.id });
                });

                // Merge con datos locales
                const local = this.getTransactions();
                const mergedMap = new Map<string, Transaction>();
                local.forEach((t) => mergedMap.set(t.id, t));
                cloudTxs.forEach((t) => mergedMap.set(t.id, t));
                const merged = Array.from(mergedMap.values()).sort((a, b) => b.id.localeCompare(a.id));

                localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(merged));
                txListeners.forEach((fn) => fn(merged));
              }
            },
            (error) => {
              console.warn('Firestore snapshot notice (fallback to local):', error.message);
            }
          );

          // Listener de Cajas
          const cajasCollection = collection(firestore, 'cajas');
          onSnapshot(
            cajasCollection,
            (snapshot) => {
              if (!snapshot.empty) {
                const cloudCajas: CajaTerminal[] = [];
                snapshot.forEach((docSnap) => {
                  cloudCajas.push(docSnap.data() as CajaTerminal);
                });
                localStorage.setItem(CAJAS_KEY, JSON.stringify(cloudCajas));
                cajasListeners.forEach((fn) => fn(cloudCajas));
              }
            },
            (error) => {
              console.warn('Firestore cajas snapshot notice:', error.message);
            }
          );

          isFirestoreListenerActive = true;
        } catch (e) {
          console.warn('Firestore subscription caught error:', e);
        }
      }
    }

    // 2. Iniciar SSE listener con el backend Express (/api/pos/events)
    if (typeof window !== 'undefined' && !sseEventSource) {
      try {
        sseEventSource = new EventSource(`/api/pos/events?cajaId=${encodeURIComponent(activeCajaId)}`);

        sseEventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data && data.provider && data.status === 'aprobado') {
              // Cobro recibido automáticamente vía Webhook en el servidor
              const nuevaTx = this.addTransaction({
                tipo: 'ingreso',
                concepto: `Cobro Automático (${data.provider === 'mercadopago' ? 'Mercado Pago' : data.provider.toUpperCase()})`,
                monto: Number(data.monto) || 4500,
                metodo: 'QR Interoperable',
                cajero: `Automático (${data.cajaId || activeCajaId})`,
                cajaId: data.cajaId || activeCajaId,
                estado: 'aprobado',
              });

              // Notificar llegada de webhook
              webhookArrivalListeners.forEach((fn) => fn(data));
              console.log('[LocalPay Cloud] Webhook procesado y conciliado:', nuevaTx.codigo);
            }
          } catch (err) {
            console.error('Error parseando evento SSE:', err);
          }
        };

        sseEventSource.onerror = () => {
          // Reintentos automáticos del navegador
        };
      } catch (err) {
        console.warn('SSE EventSource not supported or blocked:', err);
      }
    }
  },

  // Suscripción a cambios de transacciones
  subscribeTransactions(listener: Listener<Transaction[]>): () => void {
    txListeners.push(listener);
    listener(this.getTransactions());
    return () => {
      const idx = txListeners.indexOf(listener);
      if (idx !== -1) txListeners.splice(idx, 1);
    };
  },

  // Suscripción a cambios de terminales multi-caja
  subscribeCajas(listener: Listener<CajaTerminal[]>): () => void {
    cajasListeners.push(listener);
    listener(this.getCajas());
    return () => {
      const idx = cajasListeners.indexOf(listener);
      if (idx !== -1) cajasListeners.splice(idx, 1);
    };
  },

  // Suscripción a llegada de webhooks en vivo
  subscribeWebhookArrival(listener: Listener<WebhookHistoryItem>): () => void {
    webhookArrivalListeners.push(listener);
    return () => {
      const idx = webhookArrivalListeners.indexOf(listener);
      if (idx !== -1) webhookArrivalListeners.splice(idx, 1);
    };
  },

  // ==========================================================================
  // GESTIÓN DE TERMINALES MULTI-CAJA
  // ==========================================================================
  getCajas(): CajaTerminal[] {
    try {
      const data = localStorage.getItem(CAJAS_KEY);
      if (!data) {
        localStorage.setItem(CAJAS_KEY, JSON.stringify(INITIAL_CAJAS));
        return INITIAL_CAJAS;
      }
      return JSON.parse(data);
    } catch {
      return INITIAL_CAJAS;
    }
  },

  updateCaja(cajaActualizada: CajaTerminal): void {
    const list = this.getCajas();
    const updated = list.map((c) => (c.id === cajaActualizada.id ? { ...cajaActualizada, ultimoUpdate: 'Ahora mismo' } : c));
    localStorage.setItem(CAJAS_KEY, JSON.stringify(updated));
    cajasListeners.forEach((fn) => fn(updated));

    // Sincronizar con Firestore si está disponible
    const firestore = getFirebaseDb();
    if (firestore) {
      try {
        const cajaRef = doc(firestore, 'cajas', cajaActualizada.id);
        setDoc(cajaRef, cajaActualizada, { merge: true }).catch((err) =>
          console.warn('Sync caja to Firestore error:', err)
        );
      } catch (err) {
        console.warn('Firestore updateCaja caught error:', err);
      }
    }
  },

  // ==========================================================================
  // GESTIÓN DE ENTIDADES CON VALIDACIÓN CUIT
  // ==========================================================================
  getEntities(): Entity[] {
    try {
      const data = localStorage.getItem(ENTITIES_KEY);
      if (!data) {
        localStorage.setItem(ENTITIES_KEY, JSON.stringify(INITIAL_ENTITIES));
        return INITIAL_ENTITIES;
      }
      return JSON.parse(data);
    } catch {
      return INITIAL_ENTITIES;
    }
  },

  saveEntity(entity: Omit<Entity, 'id' | 'fechaRegistro'>): Entity {
    const list = this.getEntities();
    const sanitize = (val: string) =>
      String(val || '')
        .trim()
        .replace(/[&<>"']/g, (match) => {
          const map: Record<string, string> = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;',
          };
          return map[match] || match;
        });

    const newEntity: Entity = {
      id: 'ent_' + Date.now(),
      tipo: entity.tipo,
      nombre: sanitize(entity.nombre),
      contacto: sanitize(entity.contacto),
      extra: sanitize(entity.extra),
      cuitValido: entity.cuitValido,
      fechaRegistro: new Date().toISOString().replace('T', ' ').substring(0, 16),
    };

    const updated = [newEntity, ...list];
    localStorage.setItem(ENTITIES_KEY, JSON.stringify(updated));

    // Guardar en Firestore
    const firestore = getFirebaseDb();
    if (firestore) {
      try {
        const docRef = doc(firestore, 'entities', newEntity.id);
        setDoc(docRef, newEntity).catch(() => {});
      } catch {
        // Fallback local
      }
    }

    return newEntity;
  },

  deleteEntity(id: string): void {
    const list = this.getEntities().filter((e) => e.id !== id);
    localStorage.setItem(ENTITIES_KEY, JSON.stringify(list));
  },

  addEntity(entity: Omit<Entity, 'id' | 'fechaRegistro'>): Entity {
    return this.saveEntity(entity);
  },

  // ==========================================================================
  // GESTIÓN DE TRANSACCIONES & SINCRONIZACIÓN
  // ==========================================================================
  getTransactions(): Transaction[] {
    try {
      const data = localStorage.getItem(TRANSACTIONS_KEY);
      if (!data) {
        localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(INITIAL_TRANSACTIONS));
        return INITIAL_TRANSACTIONS;
      }
      return JSON.parse(data);
    } catch {
      return INITIAL_TRANSACTIONS;
    }
  },

  addTransaction(tx: Omit<Transaction, 'id' | 'codigo' | 'hora' | 'fecha'>): Transaction {
    const list = this.getTransactions();
    const now = new Date();
    const newTx: Transaction = {
      id: 'tx_' + Date.now(),
      codigo: 'TX-' + Math.floor(100 + Math.random() * 900),
      tipo: tx.tipo,
      metodo: tx.metodo,
      monto: Number(tx.monto),
      concepto: tx.concepto.trim() || 'Cobro Mostrador',
      hora: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      fecha: now.toISOString().substring(0, 10),
      cajero: tx.cajero || 'Caja 01',
      cajaId: tx.cajaId || 'CAJA-01',
      estado: tx.estado || 'aprobado',
    };

    const updated = [newTx, ...list];
    localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(updated));
    txListeners.forEach((fn) => fn(updated));

    // Persistencia asíncrona en Firestore o encolado local offline
    if (!isOnline || isSimulatedOffline) {
      this.addToPendingQueue(newTx);
    } else {
      const firestore = getFirebaseDb();
      if (firestore) {
        try {
          const txDocRef = doc(firestore, 'transacciones', newTx.id);
          setDoc(txDocRef, newTx, { merge: true })
            .then(() => {
              syncStatus = 'synced';
              lastSyncTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              notifyNetworkSync();
            })
            .catch((err) => {
              console.warn('[Offline Mode] Error enviando a Firestore, guardando en cola:', err);
              this.addToPendingQueue(newTx);
            });
        } catch (err) {
          console.warn('Firestore write caught, queueing offline:', err);
          this.addToPendingQueue(newTx);
        }
      } else {
        this.addToPendingQueue(newTx);
      }
    }

    return newTx;
  },

  getKPIs() {
    const txs = this.getTransactions();
    const ingresos = txs
      .filter((t) => t.tipo === 'ingreso' && t.estado === 'aprobado')
      .reduce((acc, t) => acc + t.monto, 0);

    const egresos = txs
      .filter((t) => t.tipo === 'egreso' && t.estado === 'aprobado')
      .reduce((acc, t) => acc + t.monto, 0);

    const totalVentas = txs.filter((t) => t.tipo === 'ingreso' && t.estado === 'aprobado').length;
    const ticketPromedio = totalVentas > 0 ? Math.round(ingresos / totalVentas) : 0;

    return {
      ingresos,
      egresos,
      balanceNeto: ingresos - egresos,
      totalVentas,
      ticketPromedio,
    };
  },

  // ==========================================================================
  // CONEXIÓN BACKEND: DISPARAR SIMULACIÓN DE WEBHOOK Y OBTENER HISTORIAL
  // ==========================================================================
  async simulateWebhookPayment(
    provider: 'mercadopago' | 'modo' | 'cuentadni',
    monto: number,
    cajaId: string = 'CAJA-01'
  ): Promise<{ success: boolean; message: string }> {
    try {
      const res = await fetch('/api/pos/simulate-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, monto, cajaId }),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      return await res.json();
    } catch (err) {
      // Fallback local si el servidor no responde
      console.warn('Backend webhook simulation notice, running client fallback:', err);
      this.addTransaction({
        tipo: 'ingreso',
        concepto: `Cobro ${provider === 'mercadopago' ? 'Mercado Pago' : provider.toUpperCase()} (Simulación)`,
        monto,
        metodo: 'QR Interoperable',
        cajero: `Simulador (${cajaId})`,
        cajaId,
        estado: 'aprobado',
      });
      return { success: true, message: `Simulación local de $${monto} para ${cajaId}` };
    }
  },

  async getWebhookHistory(): Promise<WebhookHistoryItem[]> {
    try {
      const res = await fetch('/api/webhooks/history');
      if (res.ok) {
        const data = await res.json();
        return data.events || [];
      }
      return [];
    } catch {
      return [];
    }
  },

  // ==========================================================================
  // EXPORTACIÓN A CSV BLINDADA CONTRA FORMULA INJECTION (RFC 4180 + BOM)
  // ==========================================================================
  exportEntitiesToCSV(): void {
    const list = this.getEntities();
    const headers = ['Tipo', 'Nombre / Razón Social', 'Contacto / Email / Teléfono', 'CUIT / Rubro', 'Fecha'];

    const sanitizeCSVCell = (val: string | undefined): string => {
      let text = String(val || '').trim();
      if (/^[=+\-@\t\r]/.test(text)) {
        text = "'" + text;
      }
      return `"${text.replace(/"/g, '""')}"`;
    };

    const rows = list.map((e) => [
      sanitizeCSVCell(e.tipo.toUpperCase()),
      sanitizeCSVCell(e.nombre),
      sanitizeCSVCell(e.contacto),
      sanitizeCSVCell(e.extra),
      sanitizeCSVCell(e.fechaRegistro),
    ]);

    const csvContent = '\uFEFF' + [headers.map((h) => `"${h}"`).join(';'), ...rows.map((r) => r.join(';'))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `localpay_entidades_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  exportTransactionsToCSV(): void {
    const list = this.getTransactions();
    const headers = ['Código', 'Fecha', 'Hora', 'Tipo', 'Método', 'Concepto', 'Caja / Terminal', 'Cajero', 'Monto (ARS)', 'Estado'];

    const sanitizeCSVCell = (val: string | number | undefined): string => {
      let text = String(val ?? '').trim();
      if (/^[=+\-@\t\r]/.test(text)) {
        text = "'" + text;
      }
      return `"${text.replace(/"/g, '""')}"`;
    };

    const rows = list.map((t) => [
      sanitizeCSVCell(t.codigo),
      sanitizeCSVCell(t.fecha),
      sanitizeCSVCell(t.hora),
      sanitizeCSVCell(t.tipo.toUpperCase()),
      sanitizeCSVCell(t.metodo),
      sanitizeCSVCell(t.concepto),
      sanitizeCSVCell(t.cajaId || 'CAJA-01'),
      sanitizeCSVCell(t.cajero),
      sanitizeCSVCell(t.monto),
      sanitizeCSVCell(t.estado),
    ]);

    const csvContent = '\uFEFF' + [headers.map((h) => `"${h}"`).join(';'), ...rows.map((r) => r.join(';'))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `localpay_transacciones_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  // ==========================================================================
  // ARQUEO & CIERRE DE CAJA: DESGLOSE POR MÉTODO Y PERSISTENCIA CONSOLIDADA
  // ==========================================================================
  getDesgloseMetodos(cajaId?: string) {
    const allTxs = this.getTransactions().filter((t) => t.estado === 'aprobado');
    const txs = cajaId ? allTxs.filter((t) => (t.cajaId || 'CAJA-01') === cajaId) : allTxs;

    let totalEfectivoIngresos = 0;
    let totalEfectivoEgresos = 0;
    let totalDigital = 0;
    let totalFacturado = 0;
    let totalOperaciones = 0;

    const mapMetodos: Record<
      string,
      { metodo: string; categoria: 'efectivo' | 'digital'; monto: number; operaciones: number }
    > = {};

    txs.forEach((t) => {
      const isEfectivo = t.metodo.toLowerCase().includes('efectivo');
      const cat: 'efectivo' | 'digital' = isEfectivo ? 'efectivo' : 'digital';

      if (t.tipo === 'ingreso') {
        totalFacturado += t.monto;
        totalOperaciones++;
        if (isEfectivo) {
          totalEfectivoIngresos += t.monto;
        } else {
          totalDigital += t.monto;
        }
      } else if (t.tipo === 'egreso') {
        if (isEfectivo) {
          totalEfectivoEgresos += t.monto;
        }
      }

      if (!mapMetodos[t.metodo]) {
        mapMetodos[t.metodo] = { metodo: t.metodo, categoria: cat, monto: 0, operaciones: 0 };
      }
      if (t.tipo === 'ingreso') {
        mapMetodos[t.metodo].monto += t.monto;
        mapMetodos[t.metodo].operaciones++;
      }
    });

    const desgloses: DesgloseMetodo[] = Object.values(mapMetodos).map((m) => ({
      ...m,
      porcentaje: totalFacturado > 0 ? Math.round((m.monto / totalFacturado) * 100) : 0,
    }));

    const desgloseEfectivo = desgloses.filter((d) => d.categoria === 'efectivo');
    const desgloseDigital = desgloses.filter((d) => d.categoria === 'digital');

    return {
      totalFacturado,
      totalOperaciones,
      ticketPromedio: totalOperaciones > 0 ? Math.round(totalFacturado / totalOperaciones) : 0,
      totalEfectivoIngresos,
      totalEfectivoEgresos,
      totalDigital,
      porcentajeEfectivo: totalFacturado > 0 ? Math.round((totalEfectivoIngresos / totalFacturado) * 100) : 0,
      porcentajeDigital: totalFacturado > 0 ? Math.round((totalDigital / totalFacturado) * 100) : 0,
      desgloseEfectivo,
      desgloseDigital,
      todosDesgloses: desgloses,
      transacciones: txs,
    };
  },

  getCierresHistory(): CierreCajaRecord[] {
    const CIERRES_KEY = 'LOCALPAY_CIERRES_HISTORY';
    try {
      const data = localStorage.getItem(CIERRES_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  async saveCierreCaja(cierre: CierreCajaRecord): Promise<void> {
    const CIERRES_KEY = 'LOCALPAY_CIERRES_HISTORY';
    try {
      const prev = this.getCierresHistory();
      localStorage.setItem(CIERRES_KEY, JSON.stringify([cierre, ...prev]));
    } catch (e) {
      console.warn('Error guardando cierre localmente:', e);
    }

    // Persistir en Firestore colección 'cierres_caja'
    const firestore = getFirebaseDb();
    if (firestore) {
      try {
        const docRef = doc(firestore, 'cierres_caja', cierre.id);
        await setDoc(docRef, cierre, { merge: true });

        // Marcar caja como cerrada en Firestore
        const cajaDocRef = doc(firestore, 'cajas', cierre.cajaId);
        await setDoc(
          cajaDocRef,
          {
            estado: 'cerrada',
            ultimoUpdate: `Turno cerrado a las ${cierre.horaCierre}`,
            balanceNeto: cierre.totalFacturado - cierre.totalEfectivoEgresos,
          },
          { merge: true }
        );
      } catch (err) {
        console.warn('Error persistiendo cierre en Firestore:', err);
      }
    }

    // Actualizar estado de caja local
    const cajas = this.getCajas();
    const updated = cajas.map((c) =>
      c.id === cierre.cajaId
        ? {
            ...c,
            estado: 'cerrada' as const,
            ultimoUpdate: `Turno cerrado a las ${cierre.horaCierre}`,
          }
        : c
    );
    this.saveCajas(updated);
  },

  exportCierreConsolidadoCSV(cierre: CierreCajaRecord, transacciones: Transaction[]): void {
    const sanitizeCSVCell = (val: string | number | undefined): string => {
      let text = String(val ?? '').trim();
      if (/^[=+\-@\t\r]/.test(text)) {
        text = "'" + text;
      }
      return `"${text.replace(/"/g, '""')}"`;
    };

    const lines: string[] = [];

    // ENCABEZADO FISCAL / AUDITORÍA
    lines.push(sanitizeCSVCell('LOCALPAY POS - REPORTE CONSOLIDADO DE CIERRE DE CAJA & ARQUEO Z'));
    lines.push(`${sanitizeCSVCell('ID Cierre')};${sanitizeCSVCell(cierre.id)}`);
    lines.push(`${sanitizeCSVCell('Caja / Terminal')};${sanitizeCSVCell(`${cierre.cajaId} - ${cierre.cajaNombre || 'Principal'}`)}`);
    lines.push(`${sanitizeCSVCell('Cajero / Operador')};${sanitizeCSVCell(cierre.cajero)}`);
    lines.push(`${sanitizeCSVCell('Fecha')};${sanitizeCSVCell(cierre.fecha)}`);
    lines.push(`${sanitizeCSVCell('Horario Turno')};${sanitizeCSVCell(`${cierre.horaApertura} a ${cierre.horaCierre}`)}`);
    lines.push(`${sanitizeCSVCell('Estado')};${sanitizeCSVCell('CERRADA Y CONSOLIDADA')}`);
    lines.push('');

    // AUDITORÍA DE GAVETA (EFECTIVO)
    lines.push(sanitizeCSVCell('--- 1. AUDITORÍA DE GAVETA (EFECTIVO FÍSICO) ---'));
    lines.push(`${sanitizeCSVCell('Fondo Inicial de Apertura')};${sanitizeCSVCell(cierre.fondoInicial)}`);
    lines.push(`${sanitizeCSVCell('(+) Cobros en Efectivo')};${sanitizeCSVCell(cierre.totalEfectivoIngresos)}`);
    lines.push(`${sanitizeCSVCell('(-) Retiros / Egresos de Efectivo')};${sanitizeCSVCell(cierre.totalEfectivoEgresos)}`);
    lines.push(`${sanitizeCSVCell('(=) Efectivo Teórico Esperado en Gaveta')};${sanitizeCSVCell(cierre.efectivoEsperado)}`);
    lines.push(`${sanitizeCSVCell('(=) Efectivo Real Contado por Cajero')};${sanitizeCSVCell(cierre.efectivoRealContado)}`);
    const difTexto = cierre.diferenciaEfectivo === 0 ? '0 (CUADRADA EXACTA)' : `${cierre.diferenciaEfectivo > 0 ? '+' : ''}${cierre.diferenciaEfectivo} (${cierre.diferenciaEfectivo > 0 ? 'SOBRANTE' : 'FALTANTE'})`;
    lines.push(`${sanitizeCSVCell('Diferencia de Gaveta')};${sanitizeCSVCell(difTexto)}`);
    lines.push('');

    // DESGLOSE POR MÉTODO DE PAGO
    lines.push(sanitizeCSVCell('--- 2. DESGLOSE CONSOLIDADO POR MÉTODO DE PAGO ---'));
    lines.push(['Categoría', 'Método de Pago', 'Operaciones', 'Monto Total (ARS)', '% Sobre Total Facturado'].map(sanitizeCSVCell).join(';'));
    
    // Métodos Efectivo
    cierre.desgloseEfectivo.forEach((d) => {
      lines.push(['EFECTIVO', d.metodo, d.operaciones, d.monto, `${d.porcentaje}%`].map(sanitizeCSVCell).join(';'));
    });
    // Métodos Digitales
    cierre.desgloseDigital.forEach((d) => {
      lines.push(['DIGITAL', d.metodo, d.operaciones, d.monto, `${d.porcentaje}%`].map(sanitizeCSVCell).join(';'));
    });

    lines.push(['TOTAL DIGITAL', 'Cobros QR / Tarjetas / Transf.', cierre.desgloseDigital.reduce((acc, d) => acc + d.operaciones, 0), cierre.totalDigital, `${cierre.totalFacturado > 0 ? Math.round((cierre.totalDigital / cierre.totalFacturado) * 100) : 0}%`].map(sanitizeCSVCell).join(';'));
    lines.push(['TOTAL EFECTIVO', 'Ventas en Mostrador (Efectivo)', cierre.desgloseEfectivo.reduce((acc, d) => acc + d.operaciones, 0), cierre.totalEfectivoIngresos, `${cierre.totalFacturado > 0 ? Math.round((cierre.totalEfectivoIngresos / cierre.totalFacturado) * 100) : 0}%`].map(sanitizeCSVCell).join(';'));
    lines.push(['TOTAL FACTURADO BRUTO', 'Todas las Venta Aprobadas', cierre.totalOperaciones, cierre.totalFacturado, '100%'].map(sanitizeCSVCell).join(';'));
    lines.push(`${sanitizeCSVCell('Ticket Promedio')};${sanitizeCSVCell(cierre.ticketPromedio)}`);
    lines.push('');

    // DETALLE DE OPERACIONES INCLUIDAS
    lines.push(sanitizeCSVCell('--- 3. DETALLE CRONOLÓGICO DE OPERACIONES DEL TURNO ---'));
    lines.push(['Código', 'Hora', 'Tipo', 'Método', 'Concepto', 'Monto (ARS)', 'Estado', 'Cajero'].map(sanitizeCSVCell).join(';'));
    transacciones.forEach((t) => {
      lines.push([
        sanitizeCSVCell(t.codigo),
        sanitizeCSVCell(t.hora),
        sanitizeCSVCell(t.tipo.toUpperCase()),
        sanitizeCSVCell(t.metodo),
        sanitizeCSVCell(t.concepto),
        sanitizeCSVCell(t.monto),
        sanitizeCSVCell(t.estado),
        sanitizeCSVCell(t.cajero),
      ].join(';'));
    });

    const csvContent = '\uFEFF' + lines.join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `cierre_caja_${cierre.cajaId}_${cierre.id}_${cierre.fecha}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },
};
