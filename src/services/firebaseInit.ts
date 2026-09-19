import {
  collection,
  doc,
  setDoc,
  getDocs,
  onSnapshot,
  query,
  orderBy,
  limit,
} from 'firebase/firestore';
import { getFirebaseDb } from './firebase';
import { Transaction, CajaTerminal } from './dbService';

export const INITIAL_CAJAS_DATA: CajaTerminal[] = [
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
    ultimoUpdate: 'En vivo (Firestore)',
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
    ultimoUpdate: 'En vivo (Firestore)',
  },
  {
    id: 'CAJA-03',
    nombre: 'Terminal Sucursal Godoy Cruz',
    sucursal: 'Godoy Cruz',
    operador: 'Supervisor Sucursal',
    estado: 'cerrada',
    fondoInicial: 12000,
    horaApertura: '--:--',
    ingresosTotal: 0,
    egresosTotal: 0,
    balanceNeto: 0,
    ultimoUpdate: 'Turno finalizado',
  },
];

export const INITIAL_TRANSACCIONES_DATA: Transaction[] = [
  {
    id: 'tx_901',
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
    id: 'tx_902',
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
    id: 'tx_903',
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
    id: 'tx_904',
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

let isInitialized = false;

/**
 * Inicializa y asegura la estructura de colecciones 'transacciones' y 'cajas' en Firestore
 */
export async function bootstrapFirestoreCollections(): Promise<{
  success: boolean;
  transaccionesCount: number;
  cajasCount: number;
}> {
  const db = getFirebaseDb();
  if (!db) {
    console.warn('[Firestore] No se pudo inicializar la base de datos Firestore');
    return { success: false, transaccionesCount: 0, cajasCount: 0 };
  }

  try {
    // 1. Verificar y sembrar la colección 'cajas'
    const cajasColl = collection(db, 'cajas');
    const cajasSnapshot = await getDocs(cajasColl);
    let seededCajas = cajasSnapshot.size;

    if (cajasSnapshot.empty) {
      console.log('[Firestore] Sembrando estructura inicial de la colección "cajas"...');
      for (const caja of INITIAL_CAJAS_DATA) {
        const cajaRef = doc(db, 'cajas', caja.id);
        await setDoc(cajaRef, caja, { merge: true });
        seededCajas++;
      }
    }

    // 2. Verificar y sembrar la colección 'transacciones'
    const txsColl = collection(db, 'transacciones');
    const txsSnapshot = await getDocs(txsColl);
    let seededTxs = txsSnapshot.size;

    if (txsSnapshot.empty) {
      console.log('[Firestore] Sembrando estructura inicial de la colección "transacciones"...');
      for (const tx of INITIAL_TRANSACCIONES_DATA) {
        const txRef = doc(db, 'transacciones', tx.id);
        await setDoc(txRef, tx, { merge: true });
        seededTxs++;
      }
    }

    isInitialized = true;
    console.log(`[Firestore] Colecciones "cajas" (${seededCajas}) y "transacciones" (${seededTxs}) listas.`);
    return {
      success: true,
      transaccionesCount: seededTxs,
      cajasCount: seededCajas,
    };
  } catch (error) {
    console.warn('[Firestore] Error al sembrar colecciones:', error);
    return { success: false, transaccionesCount: 0, cajasCount: 0 };
  }
}
