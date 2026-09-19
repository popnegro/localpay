import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { LandingView } from './components/reformed/LandingView';
import { LoginView } from './components/reformed/LoginView';
import { DashboardView } from './components/reformed/DashboardView';
import { VercelIntegrationView } from './components/reformed/VercelIntegrationView';
import { MobileBaselinePOS } from './components/mobile/MobileBaselinePOS';
import { CloudSyncWebhooksTab } from './components/cloud/CloudSyncWebhooksTab';
import { authService, AuthUser } from './services/authService';
import { Check } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('app-landing');
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    const user = authService.getCurrentUser();
    if (user) {
      setCurrentUser(user);
    }
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleLoginSuccess = () => {
    const user = authService.getCurrentUser();
    setCurrentUser(user);
    setActiveTab('app-mobile');
    showToast('¡Sesión iniciada! Accediendo a la Terminal Mobile.');
  };

  const handleLogout = () => {
    authService.logout();
    setCurrentUser(null);
    setActiveTab('app-login');
    showToast('Sesión finalizada de manera segura.');
  };

  const demoUser: AuthUser = {
    id: 'usr_admin_01',
    email: 'admin@localpay.com',
    name: 'Administrador General',
    role: 'admin',
    branch: 'Sucursal Mendoza Centro',
    cajaId: 'CAJA-01',
  };

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

        {activeTab === 'app-mobile' && (
          <MobileBaselinePOS
            currentUser={currentUser || demoUser}
            onLogout={handleLogout}
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
          <p>
            LocalPay • Terminal POS Mobile-First con sincronización multi-caja y webhooks.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <button
              onClick={() => setActiveTab('app-landing')}
              className="hover:text-blue-600 underline font-medium cursor-pointer"
            >
              Landing
            </button>
            <span>•</span>
            <button
              onClick={() => setActiveTab('app-mobile')}
              className="hover:text-emerald-600 underline font-bold text-emerald-700 cursor-pointer"
            >
              📱 Mobile POS
            </button>
            <span>•</span>
            <button
              onClick={() => setActiveTab('app-pos')}
              className="hover:text-blue-600 underline font-medium cursor-pointer"
            >
              Desktop POS
            </button>
            <span>•</span>
            <button
              onClick={() => setActiveTab('app-cloud')}
              className="hover:text-indigo-600 underline font-bold text-indigo-700 cursor-pointer"
            >
              ☁️ Cloud & Webhooks
            </button>
          </div>
        </div>
      </footer>

      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl border border-slate-700 flex items-center gap-3 text-xs font-semibold animate-fade-in no-print">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
