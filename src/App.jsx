import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/layout/Sidebar';
import Topbar from './components/layout/Topbar';
import NotificationCenter from './components/layout/NotificationCenter';
import SystemDiagnosticModal from './components/layout/SystemDiagnosticModal';
import LoginView from './components/auth/LoginView';
import LoginBriefingModal from './components/auth/LoginBriefingModal';
import DashboardView from './components/dashboard/DashboardView';
import NewSubscriptionModal from './components/subscriptions/NewSubscriptionModal';
import ColdLeadsView from './components/leads/ColdLeadsView';
import PlansView from './components/plans/PlansView';
import TemplatesView from './components/templates/TemplatesView';
import MembersDirectoryView from './components/members/MembersDirectoryView';
import KioskView from './components/kiosk/KioskView';
import PosView from './components/pos/PosView';

import { api, isSupabaseConfigured, subscribeToRealtimeChanges } from './lib/supabaseClient';

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('vitalfit_auth_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [isLoginBriefingOpen, setIsLoginBriefingOpen] = useState(false);
  const [isDiagnosticsOpen, setIsDiagnosticsOpen] = useState(false);

  const [currentView, setCurrentView] = useState('dashboard');
  const [isNewSubModalOpen, setIsNewSubModalOpen] = useState(false);
  const [selectedClientForSub, setSelectedClientForSub] = useState(null);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Application Data States
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    kpis: {},
    vencimientos: [],
    ausencias: [],
    leadsFrios: [],
  });
  const [planes, setPlanes] = useState([]);
  const [plantillas, setPlantillas] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [movimientos, setMovimientos] = useState([]);
  const [asistenciasHoy, setAsistenciasHoy] = useState([]);

  const isSupabaseActive = isSupabaseConfigured();

  // Load all initial data
  const loadData = useCallback(async () => {
    try {
      const [dash, pls, tpls, clis, movs, asists] = await Promise.all([
        api.getDashboardData(),
        api.getPlanes(),
        api.getPlantillas(),
        api.getClientes('TODOS'),
        api.getCajaMovimientos(),
        api.getAsistenciasHoy(),
      ]);

      setDashboardData(dash);
      setPlanes(pls);
      setPlantillas(tpls);
      setClientes(clis);
      setMovimientos(movs);
      setAsistenciasHoy(asists || []);
    } catch (err) {
      console.error('Error cargando datos del sistema:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Sincronización en Tiempo Real Multi-Dispositivo (Supabase WebSockets & BroadcastChannel)
  useEffect(() => {
    const unsubscribe = subscribeToRealtimeChanges((changeEvent) => {
      console.log('🔄 Sincronización Realtime recibida:', changeEvent);
      loadData();
    });
    return () => {
      unsubscribe();
    };
  }, [loadData]);

  // Action Handlers
  const handleLogin = (user) => {
    setCurrentUser(user);
    try {
      localStorage.setItem('vitalfit_auth_user', JSON.stringify(user));
    } catch (e) {
      console.warn('Storage error:', e);
    }
    // If there are alerts, open the Login Briefing Modal once upon login
    const hasAlerts = (dashboardData.vencimientos?.length || 0) + (dashboardData.ausencias?.length || 0) > 0;
    if (hasAlerts) {
      setIsLoginBriefingOpen(true);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem('vitalfit_auth_user');
    } catch (e) {
      console.warn('Storage error:', e);
    }
    setCurrentView('dashboard');
    setIsLoginBriefingOpen(false);
  };

  const handleOpenNewSub = (client = null) => {
    setSelectedClientForSub(client);
    setIsNewSubModalOpen(true);
  };

  const handleSaveSubscription = async (payload) => {
    await api.crearNuevaSuscripcion(payload);
    await loadData();
  };

  const handleCheckInKiosk = async (dni) => {
    const res = await api.checkInKiosk(dni);
    loadData();
    return res;
  };

  const handleFreeze = async (suscripcionId, dias) => {
    const res = await api.congelarMembresia(suscripcionId, dias);
    await loadData();
    return res;
  };

  const handleInsistencia = async (clienteId, tipoEvento, mensaje) => {
    await api.registrarInsistencia(clienteId, tipoEvento, mensaje);
    await loadData();
  };

  const handleMoverLeadFrio = async (clienteId) => {
    await api.moverALeadFrio(clienteId);
    await loadData();
  };

  const handleSavePlan = async (plan) => {
    await api.savePlan(plan);
    await loadData();
  };

  const handleDeletePlan = async (planId) => {
    await api.deletePlan(planId);
    await loadData();
  };

  const handleSavePlantilla = async (plantilla) => {
    await api.savePlantilla(plantilla);
    await loadData();
  };

  const handleSaveProgress = async (registro) => {
    const res = await api.agregarProgresoFisico(registro);
    return res;
  };

  const handleGetProgress = async (clienteId) => {
    return await api.getProgresoFisico(clienteId);
  };

  const handleRegisterSale = async (movimiento) => {
    await api.registrarVentaPOS(movimiento);
    await loadData();
  };

  const handleRegisterPaseDiario = async (data) => {
    await api.registrarPaseDiario(data);
    await loadData();
  };

  // Handle counts for badges
  const counts = {
    alertasTotal:
      (dashboardData.vencimientos?.length || 0) +
      (dashboardData.ausencias?.length || 0),
    vencimientosCount: dashboardData.vencimientos?.length || 0,
    ausenciasCount: dashboardData.ausencias?.length || 0,
    totalLeadsFrios: dashboardData.leadsFrios?.length || 0,
    totalSocias: clientes.length || 0,
  };

  if (!currentUser) {
    return (
      <LoginView
        onLogin={handleLogin}
        gymName={import.meta.env.VITE_GYM_NAME || 'VitalFit Gym Club'}
      />
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50/60 text-gray-900 font-sans">
      {/* 1. Sidebar (Responsive: Desktop static + Mobile Drawer) */}
      <Sidebar
        currentView={currentView}
        setCurrentView={setCurrentView}
        isSupabaseActive={isSupabaseActive}
        counts={counts}
        onOpenNewSub={() => handleOpenNewSub(null)}
        currentUser={currentUser}
        onLogout={handleLogout}
        onOpenDiagnostics={() => setIsDiagnosticsOpen(true)}
        isMobileOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* 2. Main Content Canvas */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <Topbar
          currentView={currentView}
          setCurrentView={setCurrentView}
          onOpenNewSub={() => handleOpenNewSub(null)}
          counts={counts}
          isSupabaseActive={isSupabaseActive}
          currentUser={currentUser}
          onLogout={handleLogout}
          onOpenDiagnostics={() => setIsDiagnosticsOpen(true)}
          onOpenNotifications={() => setIsNotificationsOpen(true)}
          onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        />

        {/* Scrollable View Container (Mobile Friendly Padding) */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-6 md:p-8">
          <div className="max-w-7xl mx-auto">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-24 space-y-3">
                <div className="w-10 h-10 border-4 border-terracota border-t-transparent rounded-none animate-spin"></div>
                <p className="text-xs text-stone-500 font-mono">
                  Sincronizando estado del gimnasio...
                </p>
              </div>
            ) : (
              <>
                {currentView === 'dashboard' && (
                  <DashboardView
                    kpis={dashboardData.kpis}
                    vencimientos={dashboardData.vencimientos}
                    ausencias={dashboardData.ausencias}
                    leadsFrios={dashboardData.leadsFrios}
                    asistenciasHoy={asistenciasHoy}
                    clientes={clientes}
                    plantillas={plantillas}
                    planes={planes}
                    onOpenNewSub={() => handleOpenNewSub(null)}
                    onInsistencia={handleInsistencia}
                    onMoverLeadFrio={handleMoverLeadFrio}
                    onNavigateToLeads={() => setCurrentView('leads_frios')}
                    onRefresh={loadData}
                  />
                )}

                {currentView === 'directorio' && (
                  <MembersDirectoryView
                    clientes={clientes}
                    onFreeze={handleFreeze}
                    onSaveProgress={handleSaveProgress}
                    onGetProgress={handleGetProgress}
                    onOpenNewSub={() => handleOpenNewSub(null)}
                    onRefresh={loadData}
                  />
                )}

                {currentView === 'leads_frios' && (
                  <ColdLeadsView
                    leadsFrios={dashboardData.leadsFrios}
                    planes={planes}
                    plantillas={plantillas}
                    onInsistencia={handleInsistencia}
                    onOpenNewSub={handleOpenNewSub}
                    onRefresh={loadData}
                  />
                )}

                {currentView === 'planes' && (
                  <PlansView
                    planes={planes}
                    onSavePlan={handleSavePlan}
                    onDeletePlan={handleDeletePlan}
                    onNavigateToLeads={() => setCurrentView('leads_frios')}
                  />
                )}

                {currentView === 'plantillas' && (
                  <TemplatesView
                    plantillas={plantillas}
                    onSavePlantilla={handleSavePlantilla}
                  />
                )}

                {currentView === 'pos' && (
                  <PosView
                    movimientos={movimientos}
                    onRegisterSale={handleRegisterSale}
                    onRefresh={loadData}
                  />
                )}

                {currentView === 'kiosco' && (
                  <KioskView
                    clientes={clientes}
                    plantillas={plantillas}
                    onCheckIn={handleCheckInKiosk}
                    onOpenNewSub={handleOpenNewSub}
                    onRegisterPaseDiario={handleRegisterPaseDiario}
                    asistenciasHoy={asistenciasHoy}
                    onRefresh={loadData}
                  />
                )}
              </>
            )}
          </div>
        </main>
      </div>

      {/* 3. New Subscription Modal with WhatsApp Live Simulator */}
      <NewSubscriptionModal
        isOpen={isNewSubModalOpen}
        onClose={() => {
          setIsNewSubModalOpen(false);
          setSelectedClientForSub(null);
        }}
        planes={planes}
        plantillas={plantillas}
        clientes={clientes}
        initialClient={selectedClientForSub}
        onSaveSubscription={handleSaveSubscription}
      />

      {/* 4. Notification Center Drawer */}
      <NotificationCenter
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        vencimientos={dashboardData.vencimientos}
        ausencias={dashboardData.ausencias}
        leadsFrios={dashboardData.leadsFrios}
        plantillas={plantillas}
        onInsistencia={handleInsistencia}
        onOpenNewSub={handleOpenNewSub}
      />

      {/* 5. Resumen de Apertura solo al Iniciar Sesión (Login Briefing Modal) */}
      <LoginBriefingModal
        isOpen={isLoginBriefingOpen}
        onClose={() => setIsLoginBriefingOpen(false)}
        vencimientos={dashboardData.vencimientos}
        ausencias={dashboardData.ausencias}
        plantillas={plantillas}
        onOpenNotifications={() => {
          setIsLoginBriefingOpen(false);
          setIsNotificationsOpen(true);
        }}
      />

      {/* 6. Diagnóstico del Sistema y Verificación Realtime */}
      <SystemDiagnosticModal
        isOpen={isDiagnosticsOpen}
        onClose={() => setIsDiagnosticsOpen(false)}
      />
    </div>
  );
}

