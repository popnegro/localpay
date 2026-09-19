import React, { useState, useEffect, useRef } from 'react';
import {
  Wifi,
  WifiOff,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Clock,
  Layers,
  ChevronDown,
  X,
  Zap,
  ArrowUpRight,
  ShieldCheck,
} from 'lucide-react';
import { dbService, NetworkSyncState } from '../../services/dbService';

export const NetworkStatusIndicator: React.FC = () => {
  const [networkState, setNetworkState] = useState<NetworkSyncState>(dbService.getNetworkSyncState());
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  const [isManualSyncing, setIsManualSyncing] = useState<boolean>(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Inicializar listeners de sincronización de red
    const unsubscribe = dbService.subscribeNetworkSync((state) => {
      setNetworkState(state);
    });

    // Cerrar dropdown al hacer click afuera
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      unsubscribe();
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleToggleSimulatedOffline = async () => {
    const nextVal = !networkState.isSimulatedOffline;
    await dbService.setSimulateOffline(nextVal);
    setSyncFeedback(nextVal ? 'Modo Offline de Contingencia activado' : 'Conexión restablecida. Sincronizando cola...');
    setTimeout(() => setSyncFeedback(null), 3000);
  };

  const handleManualSync = async () => {
    setIsManualSyncing(true);
    try {
      const res = await dbService.reSyncPendingTransactions();
      if (res.syncedCount > 0) {
        setSyncFeedback(`¡${res.syncedCount} transacciones sincronizadas con Firestore!`);
      } else if (res.errors > 0) {
        setSyncFeedback('Error sincronizando algunas transacciones.');
      } else {
        setSyncFeedback('La cola ya se encuentra al día.');
      }
    } catch {
      setSyncFeedback('Error al sincronizar.');
    } finally {
      setIsManualSyncing(false);
      setTimeout(() => setSyncFeedback(null), 3000);
    }
  };

  const isOnline = networkState.isOnline;
  const isSyncing = networkState.syncStatus === 'syncing' || isManualSyncing;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* BADGE PRINCIPAL EN EL HEADER */}
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs border cursor-pointer select-none ${
          isOnline
            ? 'bg-slate-800/90 hover:bg-slate-800 text-emerald-300 border-emerald-500/30'
            : 'bg-amber-950/80 hover:bg-amber-900/80 text-amber-300 border-amber-500/40 animate-pulse'
        }`}
        title="Estado de sincronización Firestore y modo offline"
      >
        {/* Indicador LED con estado */}
        <div className="flex items-center gap-1.5">
          {isOnline ? (
            <>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <Wifi className="w-3.5 h-3.5 text-emerald-400" />
            </>
          ) : (
            <>
              <span className="inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              <WifiOff className="w-3.5 h-3.5 text-amber-400" />
            </>
          )}

          <span className="font-mono text-[11px] tracking-tight">
            {isOnline ? 'Online' : 'Offline'}
          </span>
        </div>

        {/* Separador */}
        <span className="text-slate-600">•</span>

        {/* Detalle de estado */}
        {networkState.pendingQueueCount > 0 ? (
          <span className="px-1.5 py-0.2 rounded-md bg-amber-500/20 text-amber-300 text-[10px] font-mono font-bold">
            {isSyncing ? 'Sincronizando...' : `${networkState.pendingQueueCount} en cola`}
          </span>
        ) : (
          <span className="text-[10px] text-slate-400 font-normal hidden sm:inline">
            Cloud Sync OK
          </span>
        )}

        <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
      </button>

      {/* DROPDOWN FLOTANTE DE DETALLE & ACCIONES */}
      {showDropdown && (
        <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-4 z-50 text-white space-y-3 animate-in fade-in slide-in-from-top-2">
          {/* Header del panel */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              {isOnline ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <AlertCircle className="w-4 h-4 text-amber-400" />
              )}
              <h4 className="font-bold text-xs text-white">Sincronización Firestore</h4>
            </div>
            <button
              onClick={() => setShowDropdown(false)}
              className="text-slate-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Feedback de sincronización */}
          {syncFeedback && (
            <div className="p-2 bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-[11px] rounded-xl font-medium flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>{syncFeedback}</span>
            </div>
          )}

          {/* Tarjeta de métricas de red */}
          <div className="bg-slate-950/80 rounded-xl p-2.5 space-y-1.5 border border-slate-800 text-xs">
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-slate-400">Estado de Conexión:</span>
              <span className={`font-bold font-mono ${isOnline ? 'text-emerald-400' : 'text-amber-400'}`}>
                {isOnline ? 'CONECTADO (Firestore Activo)' : 'MODO CONTINGENCIA (Local)'}
              </span>
            </div>

            <div className="flex justify-between items-center text-[11px]">
              <span className="text-slate-400">Transacciones en Cola:</span>
              <span className="font-mono font-bold text-white">
                {networkState.pendingQueueCount}{' '}
                {networkState.pendingQueueCount === 1 ? 'operación' : 'operaciones'}
              </span>
            </div>

            <div className="flex justify-between items-center text-[11px]">
              <span className="text-slate-400">Última Sincronización:</span>
              <span className="text-slate-300 font-mono text-[10px]">
                {networkState.lastSyncTime || 'Al iniciar'}
              </span>
            </div>
          </div>

          {/* Listado de items en cola si los hay */}
          {networkState.pendingQueueCount > 0 && (
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                Operaciones pendientes de subida:
              </span>
              <div className="max-h-28 overflow-y-auto space-y-1 pr-1">
                {networkState.pendingTransactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="p-1.5 bg-slate-800/80 rounded-lg border border-slate-700/60 flex items-center justify-between text-[10px]"
                  >
                    <div>
                      <p className="font-bold text-white">{tx.concepto}</p>
                      <p className="text-slate-400">{tx.codigo} • {tx.hora}</p>
                    </div>
                    <span className="font-bold text-amber-300 font-mono">
                      +${tx.monto.toLocaleString('es-AR')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Botones de acción */}
          <div className="space-y-2 pt-1 border-t border-slate-800">
            {/* Botón Re-sincronizar */}
            <button
              onClick={handleManualSync}
              disabled={isSyncing || !isOnline}
              className={`w-full py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                isOnline
                  ? 'bg-blue-600 hover:bg-blue-500 active:scale-98 text-white shadow-md'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Sincronizando con Firestore...' : 'Re-sincronizar Cola Ahora'}</span>
            </button>

            {/* Switch de simulación de corte de internet */}
            <div className="flex items-center justify-between pt-1 px-1">
              <span className="text-[11px] text-slate-300 font-medium">
                Simular Corte de Internet:
              </span>
              <button
                type="button"
                onClick={handleToggleSimulatedOffline}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                  networkState.isSimulatedOffline ? 'bg-amber-600' : 'bg-slate-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                    networkState.isSimulatedOffline ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
