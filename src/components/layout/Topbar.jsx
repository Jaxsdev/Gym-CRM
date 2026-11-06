import React from 'react';
import { 
  Bell, 
  UserPlus, 
  Tv, 
  Calendar,
  Menu,
  ShieldCheck,
  LogOut
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function Topbar({ 
  currentView, 
  setCurrentView, 
  onOpenNewSub, 
  counts = {}, 
  isSupabaseActive,
  currentUser = null,
  onLogout,
  onOpenDiagnostics,
  onOpenNotifications,
  onToggleMobileMenu
}) {
  const todayFormatted = format(new Date(), "EEEE, d 'de' MMMM", { locale: es });
  const capitalizedDate = todayFormatted.charAt(0).toUpperCase() + todayFormatted.slice(1);

  const getBreadcrumbTitle = () => {
    switch (currentView) {
      case 'dashboard': return 'Panel de Control';
      case 'directorio': return 'Directorio de Socias';
      case 'leads_frios': return 'Leads Fríos & Promos';
      case 'planes': return 'Planes y Tarifas';
      case 'plantillas': return 'Plantillas WhatsApp';
      case 'kiosco': return 'Control de Asistencia & Recepción';
      case 'pos': return 'Caja y POS Rápido';
      default: return 'GymFlow CRM';
    }
  };

  const totalAlerts = (counts.vencimientosCount || 0) + (counts.ausenciasCount || 0);

  return (
    <header className="h-14 sm:h-16 bg-white border-b border-gray-200 px-3 sm:px-6 flex items-center justify-between sticky top-0 z-20 shadow-xs">
      {/* Left: Mobile Hamburger & Title */}
      <div className="flex items-center gap-2 sm:gap-4 overflow-hidden">
        {/* Mobile Hamburger Button */}
        <button
          onClick={onToggleMobileMenu}
          className="md:hidden p-2 rounded-none text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors flex-shrink-0"
          title="Abrir menú"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="overflow-hidden">
          <h2 className="text-sm sm:text-base font-bold text-gray-950 tracking-tight leading-tight truncate">
            {getBreadcrumbTitle()}
          </h2>
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-gray-400 mt-0.5">
            <Calendar className="w-3.5 h-3.5 text-gray-400" />
            <span className="truncate">{capitalizedDate}</span>
          </div>
        </div>
      </div>

      {/* Right Action Buttons & Alerts */}
      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
        {/* Realtime Diagnostic Status Pill */}
        <button
          onClick={onOpenDiagnostics}
          className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-none border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 text-[11px] font-mono font-semibold transition-colors"
          title="Verificar conexión en tiempo real y base de datos"
        >
          <span className={`w-1.5 h-1.5 rounded-none ${isSupabaseActive ? 'bg-emerald-500' : 'bg-amber-500'} animate-pulse`} />
          <span>{isSupabaseActive ? 'Realtime Cloud' : 'Realtime Local'}</span>
        </button>

        {/* Quick Kiosk Access */}
        <button
          onClick={() => setCurrentView('kiosco')}
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-none border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs font-semibold transition-all shadow-xs"
          title="Abrir pantalla para registro de asistencia de socias"
        >
          <Tv className="w-3.5 h-3.5 text-gray-900" />
          <span>Check-in DNI</span>
        </button>

        {/* Global Primary Action Button (Linear / Gumloop Style) */}
        <button
          onClick={onOpenNewSub}
          className="inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-none bg-gray-950 hover:bg-black text-white text-xs font-bold transition-all shadow-xs active:scale-[0.98]"
        >
          <UserPlus className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="hidden sm:inline">Nueva Membresía</span>
          <span className="sm:hidden">+ Membresía</span>
        </button>

        <div className="h-5 w-px bg-gray-200 mx-0.5"></div>

        {/* Interactive Notification Bell */}
        <button
          onClick={onOpenNotifications}
          className="relative p-2 rounded-none text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors"
          title="Ver alertas de vencimiento e inasistencia"
        >
          <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
          {totalAlerts > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-4.5 px-1 rounded-none bg-amber-500 text-white text-[10px] font-mono font-bold flex items-center justify-center border-2 border-white shadow-xs">
              {totalAlerts}
            </span>
          )}
        </button>

        {/* Botón Salir / Logout */}
        {onLogout && (
          <button
            onClick={onLogout}
            className="p-2 rounded-none text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors ml-1"
            title="Cerrar Sesión"
          >
            <LogOut className="w-4 h-4" />
          </button>
        )}
      </div>
    </header>
  );
}
