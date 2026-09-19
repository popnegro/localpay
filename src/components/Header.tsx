import React from 'react';
import {
  Store,
  Lock,
  Zap,
  Cloud,
  Smartphone,
  Radio,
} from 'lucide-react';
import { NetworkStatusIndicator } from './network/NetworkStatusIndicator';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenCierre?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab, onOpenCierre }) => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between py-3.5 gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center font-black text-xl shadow-lg shadow-blue-500/30">
              LP
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white">
                  LocalPay
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <Cloud className="w-3 h-3 text-emerald-400" /> POS Live
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                <span>Terminal de cobros • Multi-caja • Webhooks</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <NetworkStatusIndicator />

            {onOpenCierre && (
              <button
                id="header-cierre-caja-btn"
                onClick={onOpenCierre}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/40 text-rose-300 hover:text-white transition-colors cursor-pointer shadow-xs"
                title="Efectuar Cierre de Caja & Arqueo Z"
              >
                <Lock className="w-3.5 h-3.5 text-rose-400" />
                <span>Cierre Z</span>
              </button>
            )}
          </div>
        </div>

        <div className="border-t border-slate-800/80 pt-2 pb-2 flex flex-wrap items-center gap-2 text-xs">
          <div className="flex items-center gap-1 bg-slate-800/60 p-1 rounded-xl border border-slate-700/60">
            <button
              onClick={() => setActiveTab('app-landing')}
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition cursor-pointer ${
                activeTab === 'app-landing'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
              }`}
            >
              <Store className="w-3.5 h-3.5" /> Landing
            </button>

            <button
              onClick={() => setActiveTab('app-login')}
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition cursor-pointer ${
                activeTab === 'app-login'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
              }`}
            >
              <Lock className="w-3.5 h-3.5" /> Login
            </button>

            <button
              onClick={() => setActiveTab('app-mobile')}
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition cursor-pointer ${
                activeTab === 'app-mobile'
                  ? 'bg-emerald-500 text-slate-950 shadow-xs'
                  : 'text-emerald-300 hover:text-white hover:bg-slate-700/60'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" /> Mobile POS
            </button>

            <button
              onClick={() => setActiveTab('app-pos')}
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition cursor-pointer ${
                activeTab === 'app-pos'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
              }`}
            >
              <Zap className="w-3.5 h-3.5" /> POS Desktop
            </button>

            <button
              onClick={() => setActiveTab('app-vercel')}
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition cursor-pointer ${
                activeTab === 'app-vercel'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
              }`}
            >
              <Cloud className="w-3.5 h-3.5" /> Vercel
            </button>

            <button
              onClick={() => setActiveTab('app-cloud')}
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition cursor-pointer ${
                activeTab === 'app-cloud'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-indigo-300 hover:text-white hover:bg-slate-700/60'
              }`}
            >
              <Radio className="w-3.5 h-3.5 text-indigo-400" /> Cloud & Webhooks
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
