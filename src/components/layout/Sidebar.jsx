import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Snowflake, 
  CreditCard, 
  MessageSquare, 
  Tv, 
  ShoppingBag,
  Dumbbell,
  ShieldCheck,
  X,
  Plus,
  Search,
  MoreVertical,
  Bell,
  PanelLeftClose,
  LogOut
} from 'lucide-react';

export default function Sidebar({ 
  currentView, 
  setCurrentView, 
  isSupabaseActive, 
  counts = {},
  onOpenNewSub,
  currentUser = null,
  onLogout,
  isMobileOpen = false,
  onCloseMobile
}) {
  const navigationSections = [
    {
      title: 'Operaciones Diarias',
      items: [
        {
          id: 'dashboard',
          label: 'Panel Principal',
          icon: LayoutDashboard,
          badge: counts.alertasTotal > 0 ? counts.alertasTotal : null,
          badgeColor: 'bg-amber-100 text-amber-900 border border-amber-200',
        },
        {
          id: 'kiosco',
          label: 'Check-in Recepción',
          icon: Tv,
          badge: 'En Vivo',
          badgeColor: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
        },
        {
          id: 'pos',
          label: 'Caja & POS Rápido',
          icon: ShoppingBag,
        },
      ]
    },
    {
      title: 'Clientas y Retención',
      items: [
        {
          id: 'directorio',
          label: 'Directorio de Socias',
          icon: Users,
          badge: counts.totalSocias || null,
          badgeColor: 'bg-gray-100 text-gray-700 border border-gray-200',
        },
        {
          id: 'leads_frios',
          label: 'Leads Fríos & Promos',
          icon: Snowflake,
          badge: counts.totalLeadsFrios > 0 ? counts.totalLeadsFrios : null,
          badgeColor: 'bg-slate-100 text-slate-700 border border-slate-200',
        },
      ]
    },
    {
      title: 'Configuración',
      items: [
        {
          id: 'planes',
          label: 'Planes y Tarifas',
          icon: CreditCard,
        },
        {
          id: 'plantillas',
          label: 'Plantillas WhatsApp',
          icon: MessageSquare,
        },
      ]
    }
  ];

  const handleItemClick = (id) => {
    setCurrentView(id);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  const gymName = import.meta.env.VITE_GYM_NAME || 'VitalFit Club';

  const sidebarContent = (
    <div className="w-64 bg-white text-gray-900 flex flex-col h-full border-r border-gray-200 select-none">
      {/* Brand Header (Gumloop style) */}
      <div className="p-4 border-b border-gray-200/80 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="w-8 h-8 rounded-none bg-gray-950 flex items-center justify-center text-white shadow-xs flex-shrink-0">
            <Dumbbell className="w-4 h-4 stroke-[2.2]" />
          </div>
          <div className="overflow-hidden">
            <h1 className="font-bold text-sm text-gray-950 tracking-tight leading-tight truncate">
              {gymName}
            </h1>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-none bg-emerald-500 animate-pulse"></span>
              <p className="text-[10px] font-medium text-gray-500 tracking-wide uppercase">
                Gym CRM & ERP
              </p>
            </div>
          </div>
        </div>

        {/* Mobile close button */}
        {onCloseMobile && (
          <button 
            onClick={onCloseMobile}
            className="md:hidden p-1.5 rounded-none text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Primary "+ Nueva Membresía" Action Button (Linear / Gumloop Style) */}
      <div className="px-3 pt-3">
        <button
          onClick={() => {
            if (onOpenNewSub) onOpenNewSub();
            if (onCloseMobile) onCloseMobile();
          }}
          className="w-full py-2 px-3 rounded-none border border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-900 text-xs font-semibold flex items-center justify-center gap-2 shadow-xs transition-all active:scale-[0.98]"
        >
          <Plus className="w-4 h-4 text-gray-700" />
          <span>Nueva Membresía</span>
        </button>
      </div>

      {/* Main Navigation with Organized Categories */}
      <div className="flex-1 py-3 px-3 space-y-4 overflow-y-auto">
        {navigationSections.map((section, sIdx) => (
          <div key={sIdx} className="space-y-0.5">
            <div className="px-3 pb-1 pt-1 text-[10px] font-bold tracking-wider text-gray-400 uppercase">
              {section.title}
            </div>

            {section.items.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-none text-xs sm:text-sm font-medium transition-all group ${
                    isActive
                      ? 'bg-gray-100 text-gray-950 font-bold shadow-xs'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Icon
                      className={`w-4 h-4 flex-shrink-0 transition-transform group-hover:scale-105 ${
                        isActive ? 'text-gray-950' : 'text-gray-500 group-hover:text-gray-700'
                      }`}
                    />
                    <span className="truncate">{item.label}</span>
                  </div>

                  {item.badge && (
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded-none font-bold ml-2 flex-shrink-0 ${item.badgeColor}`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Status Card (Styled like Gumloop's "Credits Remaining") */}
      <div className="p-3 m-3 rounded-none bg-gray-50 border border-gray-200 text-xs">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] font-semibold text-gray-700">Socias Activas</span>
          <span className="font-mono text-[11px] font-bold text-gray-900">
            {counts.totalSocias || 0} registradas
          </span>
        </div>
        <div className="w-full bg-gray-200 h-1.5 rounded-none-xs overflow-hidden">
          <div 
            className="bg-gray-900 h-full rounded-none-xs transition-all" 
            style={{ width: `${Math.min(100, Math.max(15, (counts.totalSocias || 0) * 10))}%` }}
          />
        </div>
        <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-gray-200/60 text-[10px]">
          <span className="flex items-center gap-1.5 text-gray-500 font-medium">
            <span className={`w-1.5 h-1.5 rounded-none ${isSupabaseActive ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            {isSupabaseActive ? 'Supabase Conectado' : 'Modo Portátil'}
          </span>
          <ShieldCheck className="w-3.5 h-3.5 text-gray-400" />
        </div>
      </div>

      {/* Admin Profile Footer */}
      <div className="p-3 border-t border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="w-8 h-8 rounded-none bg-gray-950 text-white flex items-center justify-center font-bold text-xs flex-shrink-0 font-mono">
            {currentUser?.name ? currentUser.name.charAt(0) : 'A'}
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-bold text-gray-900 leading-tight truncate">
              {currentUser?.name || 'Administración'}
            </p>
            <p className="text-[10px] text-gray-400 font-medium truncate font-mono">
              {currentUser?.role === 'ADMIN' ? 'Control General' : 'Recepción & Caja'}
            </p>
          </div>
        </div>
        <button 
          onClick={onLogout}
          className="p-1.5 rounded-none text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
          title="Cerrar Sesión"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Static Sidebar (Visible on md and up) */}
      <aside className="hidden md:flex h-screen flex-shrink-0 z-30">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer (Visible when isMobileOpen is true) */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-[9999] md:hidden flex">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          {/* Slide Drawer */}
          <div className="relative z-10 flex h-full animate-in slide-in-from-left duration-200 shadow-2xl">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
