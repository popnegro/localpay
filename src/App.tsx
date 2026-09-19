import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { LandingView } from './components/reformed/LandingView';
import { LoginView } from './components/reformed/LoginView';
import { DashboardView } from './components/reformed/DashboardView';
import { VercelIntegrationView } from './components/reformed/VercelIntegrationView';
import { MobilePOSDemo } from './components/mobile/MobilePOSDemo';
import { CloudSyncWebhooksTab } from './components/cloud/CloudSyncWebhooksTab';
import { authService, AuthUser } from './services/authService';
import { Check } from 'lucide-react';

function resolveInitialTab(): string {
  if (typeof window === 'undefined') return 'app-mobile';
  const params = new URLSearchParams(window.location.search);
  const view = (params.get('view') || params.get('v') || '').toLowerCase();
  if (view === 'landing' || view === 'home' || view === 'marketing') return 'app-landing';
  if (view === 'pos' || view === 'mobile' || view === 'terminal') return 'app-mobile';
  if (view === 'login') return 'app-login';
  if (view === 'desktop') return 'app-pos';

  const hash = (window.location.hash || '').replace(/^#/, '').toLowerCase();
  if (
    hash === 'landing' ||
    hash.startsWith('por-que') ||
    hash.startsWith('funcionalidades') ||
    hash === 'features'
  ) {
    return 'app-landing';
  }
  if (hash === 'pos' || hash === 'mobile') return 'app-mobile';

  // Demo-first por defecto: terminal POS
  return 'app-mobile';
}

export default function App() {
  const [activeTab, setActiveTab] = useState<string>(() => resolveInitialTab());
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    const user = authService.getCurrentUser();
    if (user) setCurrentUser(user);
  }, []);

  // Scroll a anclas de la landing cuando corresponde
  useEffect(() => {
    if (activeTab !== 'app-landing') return;
    const hash = (window.location.hash || '').replace(/^#/, '');
    if (!hash) return;
    const t = window.setTimeout(() => {
      const el = document.getElementById(hash);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 120);
    return () => window.clearTimeout(t);
  }, [activeTab]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleLoginSuccess = () => {
    const user = authService.getCurrentUser();
    setCurrentUser(user);
    setActiveTab('app-mobile');
    showToast('¡Sesión iniciada!');
  };

  const handleLogout = () => {
    authService.logout();
    setCurrentUser(null);
    setActiveTab('app-login');
    showToast('Sesión finalizada.');
  };

  const demoUser: AuthUser = {
    id: 'usr_admin_01',
    email: 'admin@localpay.com',
    name: 'Administrador General',
    role: 'admin',
    branch: 'Sucursal Mendoza Centro',
    cajaId: 'CAJA-01',
  };

  const isMobilePOS = activeTab === 'app-mobile';

  if (isMobilePOS) {
    return (
      <div className="pos-mobile-shell">
        <MobilePOSDemo
          currentUser={currentUser || demoUser}
          onLogout={handleLogout}
        />
        {toastMessage && (
          <div className="fixed top-3 left-1/2 -translate-x-1/2 z-[60] bg-slate-900 text-white px-4 py-2.5 rounded-full shadow-2xl border border-slate-700 flex items-center gap-2 text-xs font-semibold max-w-[90vw]">
            <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="truncate">{toastMessage}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'app-landing' && (
          <LandingView
            onNavigateLogin={() => setActiveTab('app-login')}
            onNavigateMobile={() => {
              if (currentUser || authService.isAuthenticated()) {
                setActiveTab('app-mobile');
              } else {
                authService.login('admin@localpay.com', '123456').then(() => {
                  setCurrentUser(authService.getCurrentUser());
                  setActiveTab('app-mobile');
                });
              }
            }}
            onNavigatePOS={() => {
              if (currentUser || authService.isAuthenticated()) {
                setActiveTab('app-pos');
              } else {
                authService.login('admin@localpay.com', '123456').then(() => {
                  setCurrentUser(authService.getCurrentUser());
                  setActiveTab('app-pos');
                });
              }
            }}
          />
        )}

        {activeTab === 'app-login' && (
          <LoginView
            onLoginSuccess={handleLoginSuccess}
            onNavigateHome={() => setActiveTab('app-landing')}
          />
        )}

        {activeTab === 'app-pos' && (
          <DashboardView
            currentUser={currentUser || demoUser}
            onLogout={handleLogout}
          />
        )}

        {activeTab === 'app-vercel' && <VercelIntegrationView />}

        {activeTab === 'app-cloud' && <CloudSyncWebhooksTab />}
      </main>

      <footer className="bg-white border-t border-slate-200 py-6 text-xs text-slate-500 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>LocalPay • Terminal POS Mobile-First</p>
          <div className="flex flex-wrap items-center gap-4">
            <button onClick={() => setActiveTab('app-landing')} className="hover:text-blue-600 underline font-medium cursor-pointer">
              Landing
            </button>
            <span>•</span>
            <button onClick={() => setActiveTab('app-mobile')} className="hover:text-emerald-600 underline font-bold text-emerald-700 cursor-pointer">
              📱 Mobile POS
            </button>
            <span>•</span>
            <button onClick={() => setActiveTab('app-pos')} className="hover:text-blue-600 underline font-medium cursor-pointer">
              Desktop POS
            </button>
          </div>
        </div>
      </footer>

      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl border border-slate-700 flex items-center gap-3 text-xs font-semibold">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
