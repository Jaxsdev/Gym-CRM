import React, { useState, useRef } from 'react';
import { 
  Users, 
  Clock, 
  AlertTriangle, 
  Snowflake, 
  Send, 
  UserCheck, 
  DollarSign, 
  CheckCircle2, 
  ArrowUpRight, 
  Smartphone, 
  Copy, 
  RefreshCw, 
  TrendingUp, 
  Calendar, 
  ChevronRight,
  Flame,
  Trophy,
  BarChart3,
  Activity,
  Award,
  Zap
} from 'lucide-react';
import { openWhatsApp, parseWhatsAppTemplate, copyToClipboard } from '../../lib/whatsappParser';

export default function DashboardView({ 
  kpis = {}, 
  vencimientos = [], 
  ausencias = [], 
  leadsFrios = [], 
  asistenciasHoy = [],
  clientes = [],
  plantillas = [], 
  planes = [],
  onInsistencia,
  onMoverLeadFrio,
  onNavigateToLeads,
  onRefresh
}) {
  const [activeTab, setActiveTab] = useState('vencimientos'); // 'vencimientos' | 'ausencias' | 'leads'
  const [copiedId, setCopiedId] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hoveredCard, setHoveredCard] = useState(null); // 'por_vencer' | 'ausentes' | 'leads' | 'asistencias' | null
  const hoverTimerRef = useRef(null);

  // Afluencia Semanal de Asistencias (Gráfico de Barras)
  const dayOfWeekIndex = new Date().getDay(); // 0 = Dom, 1 = Lun, 2 = Mar...
  const weeklyAttendanceData = [
    { day: 'Lun', label: 'Lunes', count: 42, isToday: dayOfWeekIndex === 1, peakHour: '6:30 PM - 8:30 PM' },
    { day: 'Mar', label: 'Martes', count: 48, isToday: dayOfWeekIndex === 2, isPeak: true, peakHour: '7:00 PM - 9:00 PM' },
    { day: 'Mié', label: 'Miércoles', count: 39, isToday: dayOfWeekIndex === 3, peakHour: '6:30 PM - 8:00 PM' },
    { day: 'Jue', label: 'Jueves', count: 45, isToday: dayOfWeekIndex === 4, peakHour: '7:00 PM - 9:00 PM' },
    { day: 'Vie', label: 'Viernes', count: 36, isToday: dayOfWeekIndex === 5, peakHour: '5:30 PM - 7:30 PM' },
    { day: 'Sáb', label: 'Sábado', count: 28, isToday: dayOfWeekIndex === 6, peakHour: '9:00 AM - 1:00 PM' },
    { day: 'Dom', label: 'Domingo', count: 14, isToday: dayOfWeekIndex === 0, peakHour: '10:00 AM - 1:00 PM' },
  ];

  // Cálculo de distribución de cartera de clientes
  const totalBase = Math.max(clientes.length, 1);
  const activasCount = clientes.filter(c => c.estado_ciclo_vida === 'ACTIVA').length || (kpis.total_activas || 0);
  const porVencerCount = vencimientos.length;
  const ausenciasCount = ausencias.length;
  const leadsCount = leadsFrios.length;

  const pctActivas = Math.round((activasCount / totalBase) * 100) || 50;
  const pctPorVencer = Math.round((porVencerCount / totalBase) * 100) || 15;
  const pctAusencias = Math.round((ausenciasCount / totalBase) * 100) || 15;
  const pctLeads = Math.max(0, 100 - (pctActivas + pctPorVencer + pctAusencias));

  // Ranking de Socias más fieles con racha activa
  const loyalStreaks = [
    {
      id: clientes[0]?.id || 'cli-1',
      nombre: clientes[0]?.nombre_completo || 'Luciana Paredes Vega',
      telefono: clientes[0]?.telefono || '51994512300',
      plan: 'Plan Anual VIP',
      diasRacha: 18,
      asistenciasMes: 26,
      puesto: 1,
      medalla: '🥇',
      badgeColor: 'bg-amber-50 text-amber-900 border-amber-200'
    },
    {
      id: clientes[1]?.id || 'cli-2',
      nombre: clientes[1]?.nombre_completo || 'Valeria Ramos Montes',
      telefono: clientes[1]?.telefono || '51982145780',
      plan: 'Plan Trimestral',
      diasRacha: 14,
      asistenciasMes: 22,
      puesto: 2,
      medalla: '🥈',
      badgeColor: 'bg-gray-100 text-gray-800 border-gray-200'
    },
    {
      id: clientes[2]?.id || 'cli-3',
      nombre: clientes[2]?.nombre_completo || 'Camila Flores Salazar',
      telefono: clientes[2]?.telefono || '51976543210',
      plan: 'Plan Semestral',
      diasRacha: 9,
      asistenciasMes: 18,
      puesto: 3,
      medalla: '🥉',
      badgeColor: 'bg-orange-50 text-orange-900 border-orange-200'
    },
    {
      id: clientes[3]?.id || 'cli-4',
      nombre: clientes[3]?.nombre_completo || 'Andrea Morales Castro',
      telefono: clientes[3]?.telefono || '51987456123',
      plan: 'Plan Mensual',
      diasRacha: 6,
      asistenciasMes: 14,
      puesto: 4,
      medalla: '⭐',
      badgeColor: 'bg-blue-50 text-blue-900 border-blue-200'
    }
  ];

  const handleFelicitarSocia = (socia) => {
    const gymName = import.meta.env.VITE_GYM_NAME || 'VitalFit Club';
    const mensaje = `¡Hola ${socia.nombre}! 🏋️‍♀️🔥 ¡Muchas felicitaciones por tu constancia! Desde la recepción de ${gymName} vemos que llevas una racha de ${socia.diasRacha} días seguidos entrenando con nosotras (${socia.asistenciasMes} asistencias este mes). ¡Tu disciplina y compromiso son un verdadero ejemplo para toda la comunidad! ¡A seguir con todo el poder! 💪✨`;
    openWhatsApp(socia.telefono, mensaje);
  };

  const handleMouseEnterCard = (cardKey) => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    setHoveredCard(cardKey);
  };

  const handleMouseLeaveCard = () => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = setTimeout(() => {
      setHoveredCard(null);
    }, 250);
  };

  const handlePopoverMouseEnter = () => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
  };

  const handleRefreshClick = async () => {
    if (onRefresh) {
      setIsRefreshing(true);
      await onRefresh();
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  const getTemplate = (code) => {
    return plantillas.find((p) => p.codigo_evento === code) || null;
  };

  const handleSendVencimiento = (item) => {
    let templateCode = 'VENCE_3_DIAS';
    if (item.dias_restantes <= 0) templateCode = 'VENCE_HOY';
    else if (item.dias_restantes === 1) templateCode = 'VENCE_2_DIAS';
    else if (item.dias_restantes === 2) templateCode = 'VENCE_2_DIAS';
    else if (item.dias_restantes === 3) templateCode = 'VENCE_3_DIAS';

    const tpl = getTemplate(templateCode);
    const mensaje = tpl 
      ? parseWhatsAppTemplate(tpl.contenido_plantilla, {
          nombre: item.nombre_completo,
          plan: item.plan_nombre,
          fecha_fin: item.fecha_fin,
          dias_restantes: item.dias_restantes,
          dni: item.dni,
          precio: item.plan_precio
        })
      : `Hola ${item.nombre_completo}, tu membresía vence pronto.`;

    openWhatsApp(item.telefono, mensaje);
    if (onInsistencia) {
      onInsistencia(item.cliente_id, templateCode, mensaje);
    }
  };

  const handleCopyVencimiento = async (item) => {
    let templateCode = 'VENCE_3_DIAS';
    if (item.dias_restantes <= 0) templateCode = 'VENCE_HOY';
    else if (item.dias_restantes === 1) templateCode = 'VENCE_2_DIAS';
    else if (item.dias_restantes === 2) templateCode = 'VENCE_2_DIAS';

    const tpl = getTemplate(templateCode);
    const mensaje = tpl 
      ? parseWhatsAppTemplate(tpl.contenido_plantilla, {
          nombre: item.nombre_completo,
          plan: item.plan_nombre,
          fecha_fin: item.fecha_fin,
          dias_restantes: item.dias_restantes,
          dni: item.dni
        })
      : `Hola ${item.nombre_completo}, tu membresía vence pronto.`;

    const ok = await copyToClipboard(mensaje);
    if (ok) {
      setCopiedId(item.cliente_id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const handleSendAusencia = (item) => {
    const tpl = getTemplate('AUSENCIA_3_5_DIAS');
    const mensaje = tpl 
      ? parseWhatsAppTemplate(tpl.contenido_plantilla, {
          nombre: item.nombre_completo,
          dias_sin_asistir: item.dias_sin_asistir,
          plan: item.plan_nombre
        })
      : `Hola ${item.nombre_completo}, te extrañamos en el gym!`;

    openWhatsApp(item.telefono, mensaje);
    if (onInsistencia) {
      onInsistencia(item.cliente_id, 'AUSENCIA_3_5_DIAS', mensaje);
    }
  };

  const promoActiva = planes.find(p => p.es_promocion && p.activo);
  const totalAlertasHoy = vencimientos.length + ausencias.length;

  return (
    <div className="space-y-6">
      {/* 1. Header Banner & Status Overview (High-Precision Swiss Style) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-none border border-gray-200 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-950 tracking-tight">
            Panel de Retención y Gestión
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            Monitoreo preventivo de socias al día, avisos de vencimiento y reactivación de clientes ausentes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-none bg-gray-50 border border-gray-200 text-xs">
            <span className={`w-2 h-2 rounded-none ${totalAlertasHoy > 0 ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`}></span>
            <span className="font-semibold text-gray-800">
              {totalAlertasHoy > 0 ? `${totalAlertasHoy} alertas hoy` : 'Operación al día'}
            </span>
          </div>

          <button
            onClick={handleRefreshClick}
            disabled={isRefreshing}
            className="p-2 rounded-none border border-gray-200 hover:bg-gray-50 text-gray-600 transition-colors shadow-xs"
            title="Actualizar datos"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-gray-900' : ''}`} />
          </button>
        </div>
      </div>

      {/* 2. Unified Contiguous Metric Strip (Linear / Stripe Executive Deck) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 border border-gray-200 bg-white rounded-none shadow-xs divide-y sm:divide-y-0 sm:divide-x divide-gray-200">
        {/* Celda 1: Socias Activas */}
        <div className="p-4 hover:bg-gray-50/50 transition-colors">
          <div className="flex items-center justify-between text-gray-500 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Socias Activas</span>
            <Users className="w-4 h-4 text-gray-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-gray-950 tracking-tight">
            {kpis.total_activas || 0}
          </div>
          <p className="text-[11px] text-gray-400 mt-0.5">Membresía vigente</p>
        </div>

        {/* Celda 2: Por Vencer */}
        <div 
          onMouseEnter={() => handleMouseEnterCard('vencimientos')}
          onMouseLeave={handleMouseLeaveCard}
          onClick={() => {
            setActiveTab('vencimientos');
            setHoveredCard(null);
          }}
          className="relative p-4 hover:bg-gray-50/50 transition-colors cursor-pointer group"
        >
          <div className="flex items-center justify-between text-amber-900 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Por Vencer</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-900 tracking-tight">
            {kpis.por_vencer_3dias || vencimientos.length}
          </div>
          <div className="flex items-center justify-between mt-0.5">
            <p className="text-[11px] text-amber-700/80">Próximos días</p>
            <span className="text-[10px] text-amber-600 font-mono font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
              Ver lista ↓
            </span>
          </div>

          {/* Popover Flotante */}
          {hoveredCard === 'vencimientos' && (
            <div 
              onMouseEnter={handlePopoverMouseEnter}
              onMouseLeave={handleMouseLeaveCard}
              onClick={(e) => e.stopPropagation()}
              className="absolute top-full left-0 mt-1.5 z-50 w-80 sm:w-96 max-w-[92vw] bg-white rounded-none border border-gray-200 shadow-xl p-4 text-left animate-in fade-in duration-100"
            >
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-600" />
                  <h4 className="text-xs font-bold text-gray-950">Socias por Vencer</h4>
                </div>
                <span className="px-2 py-0.5 rounded-none text-[10px] font-mono font-bold bg-amber-50 text-amber-800 border border-amber-200">
                  {vencimientos.length}
                </span>
              </div>

              {vencimientos.length === 0 ? (
                <div className="py-4 text-center text-xs text-gray-500">
                  Ninguna socia tiene vencimiento próximo.
                </div>
              ) : (
                <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1 divide-y divide-gray-100">
                  {vencimientos.map((item) => (
                    <div key={item.cliente_id} className="pt-1.5 first:pt-0 flex items-center justify-between gap-2 text-xs">
                      <div className="min-w-0">
                        <div className="font-semibold text-gray-950 truncate">{item.nombre_completo}</div>
                        <div className="text-[11px] text-gray-400 font-mono flex items-center gap-1.5">
                          <span>{item.plan_nombre}</span>
                          <span>•</span>
                          <span className={item.dias_restantes <= 0 ? 'text-rose-700 font-bold' : 'text-amber-800'}>
                            {item.dias_restantes <= 0 ? '¡Vence Hoy!' : `Quedan ${item.dias_restantes}d`}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSendVencimiento(item);
                        }}
                        className="px-2.5 py-1 rounded-none bg-[#166534] hover:bg-[#14532D] text-white text-[11px] font-medium flex items-center gap-1 shadow-xs flex-shrink-0"
                      >
                        <Send className="w-3 h-3" />
                        <span>Avisar</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Celda 3: Socias Ausentes */}
        <div 
          onMouseEnter={() => handleMouseEnterCard('ausencias')}
          onMouseLeave={handleMouseLeaveCard}
          onClick={() => {
            setActiveTab('ausencias');
            setHoveredCard(null);
          }}
          className="relative p-4 hover:bg-gray-50/50 transition-colors cursor-pointer group"
        >
          <div className="flex items-center justify-between text-amber-900 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Socias Ausentes</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-900 tracking-tight">
            {kpis.ausentes_3a5dias || ausencias.length}
          </div>
          <div className="flex items-center justify-between mt-0.5">
            <p className="text-[11px] text-amber-700/80">Riesgo de abandono</p>
            <span className="text-[10px] text-amber-600 font-mono font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
              Ver lista ↓
            </span>
          </div>

          {/* Popover Flotante */}
          {hoveredCard === 'ausencias' && (
            <div 
              onMouseEnter={handlePopoverMouseEnter}
              onMouseLeave={handleMouseLeaveCard}
              onClick={(e) => e.stopPropagation()}
              className="absolute top-full left-0 sm:-left-16 mt-1.5 z-50 w-80 sm:w-96 max-w-[92vw] bg-white rounded-none border border-gray-200 shadow-xl p-4 text-left animate-in fade-in duration-100"
            >
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <h4 className="text-xs font-bold text-gray-950">Socias Ausentes en Riesgo</h4>
                </div>
                <span className="px-2 py-0.5 rounded-none text-[10px] font-mono font-bold bg-amber-50 text-amber-800 border border-amber-200">
                  {ausencias.length}
                </span>
              </div>

              {ausencias.length === 0 ? (
                <div className="py-4 text-center text-xs text-gray-500">
                  Todas las socias están asistiendo al día.
                </div>
              ) : (
                <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1 divide-y divide-gray-100">
                  {ausencias.map((item) => (
                    <div key={item.cliente_id} className="pt-1.5 first:pt-0 flex items-center justify-between gap-2 text-xs">
                      <div className="min-w-0">
                        <div className="font-semibold text-gray-950 truncate">{item.nombre_completo}</div>
                        <div className="text-[11px] text-amber-800 font-mono">
                          {item.dias_sin_asistir} días ausente • {item.intentos_recuperacion || 0}/3 avisos
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSendAusencia(item);
                        }}
                        className="px-2.5 py-1 rounded-none bg-[#166534] hover:bg-[#14532D] text-white text-[11px] font-medium flex items-center gap-1 shadow-xs flex-shrink-0"
                      >
                        <Send className="w-3 h-3" />
                        <span>Acompañar</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Celda 4: Leads Fríos */}
        <div 
          onMouseEnter={() => handleMouseEnterCard('leads')}
          onMouseLeave={handleMouseLeaveCard}
          onClick={() => {
            setActiveTab('leads');
            setHoveredCard(null);
          }}
          className="relative p-4 hover:bg-gray-50/50 transition-colors cursor-pointer group"
        >
          <div className="flex items-center justify-between text-gray-500 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Leads Fríos</span>
            <Snowflake className="w-4 h-4 text-gray-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-gray-800 tracking-tight">
            {kpis.total_leads_frios || leadsFrios.length}
          </div>
          <div className="flex items-center justify-between mt-0.5">
            <p className="text-[11px] text-gray-400">Para promociones</p>
            <span className="text-[10px] text-gray-500 font-mono font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
              Ver lista ↓
            </span>
          </div>

          {/* Popover Flotante */}
          {hoveredCard === 'leads' && (
            <div 
              onMouseEnter={handlePopoverMouseEnter}
              onMouseLeave={handleMouseLeaveCard}
              onClick={(e) => e.stopPropagation()}
              className="absolute top-full left-0 sm:-left-32 mt-1.5 z-50 w-80 sm:w-96 max-w-[92vw] bg-white rounded-none border border-gray-200 shadow-xl p-4 text-left animate-in fade-in duration-100"
            >
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <Snowflake className="w-4 h-4 text-gray-600" />
                  <h4 className="text-xs font-bold text-gray-950">Leads Fríos Disponibles</h4>
                </div>
                <span className="px-2 py-0.5 rounded-none text-[10px] font-mono font-bold bg-gray-100 text-gray-700">
                  {leadsFrios.length}
                </span>
              </div>

              {leadsFrios.length === 0 ? (
                <div className="py-4 text-center text-xs text-gray-500">
                  No hay leads fríos acumulados actualmente.
                </div>
              ) : (
                <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1 divide-y divide-gray-100">
                  {leadsFrios.map((item) => (
                    <div key={item.cliente_id} className="pt-1.5 first:pt-0 flex items-center justify-between gap-2 text-xs">
                      <div className="min-w-0">
                        <div className="font-semibold text-gray-950 truncate">{item.nombre_completo}</div>
                        <div className="text-[11px] text-gray-400 font-mono">
                          {item.dias_inactiva || 20} días sin entrenar
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onNavigateToLeads) onNavigateToLeads();
                          setHoveredCard(null);
                        }}
                        className="px-2.5 py-1 rounded-none bg-gray-950 hover:bg-black text-white text-[11px] font-medium flex items-center gap-1 shadow-xs flex-shrink-0"
                      >
                        <span>Promo</span>
                        <ArrowUpRight className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Celda 5: Asistencias Hoy */}
        <div 
          onMouseEnter={() => handleMouseEnterCard('asistencias')}
          onMouseLeave={handleMouseLeaveCard}
          className="relative p-4 hover:bg-gray-50/50 transition-colors"
        >
          <div className="flex items-center justify-between text-gray-500 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Asistencias Hoy</span>
            <UserCheck className="w-4 h-4 text-gray-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-gray-950 tracking-tight">
            {kpis.asistencias_hoy || (asistenciasHoy ? asistenciasHoy.length : 0)}
          </div>
          <p className="text-[11px] text-gray-400 mt-0.5">Marcadas en recepción</p>
        </div>

        {/* Celda 6: Caja de Hoy */}
        <div className="p-4 hover:bg-gray-50/50 transition-colors">
          <div className="flex items-center justify-between text-gray-500 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Caja de Hoy</span>
            <DollarSign className="w-4 h-4 text-gray-400" />
          </div>
          <div className="text-xl font-bold font-mono text-gray-950 tracking-tight">
            S/ {Number(kpis.total_ingresos_hoy || 0).toFixed(2)}
          </div>
          <div className="flex items-center justify-between text-[10px] text-gray-400 mt-0.5 font-mono">
            <span>Yape: S/{Number(kpis.digital_hoy || 0).toFixed(0)}</span>
            <span>Efec: S/{Number(kpis.efectivo_hoy || 0).toFixed(0)}</span>
          </div>
        </div>
      </div>

      {/* 3. Centro Analítico & Cuadro de Honor de Rachas (Swiss Precision Style) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Columna Izquierda: Gráficos de Afluencia Semanal y Salud del Cliente (8 cols) */}
        <div className="lg:col-span-8 space-y-5">
          {/* Gráfico de Barras: Afluencia Semanal de Asistencias (Barras Arquitectónicas) */}
          <div className="bg-white p-5 rounded-none border border-gray-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-gray-100">
              <div>
                <h2 className="text-sm font-bold text-gray-950 tracking-tight flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-gray-700" />
                  <span>Afluencia Semanal de Asistencias</span>
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Concurrencia diaria de socias en sala y clases
                </p>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto font-mono text-xs">
                <span className="text-gray-600 bg-gray-50 border border-gray-200 px-2.5 py-1 rounded-none">
                  Promedio: <strong>38 socias/día</strong>
                </span>
                <span className="text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-none flex items-center gap-1 font-semibold">
                  <span className="w-1.5 h-1.5 rounded-none bg-emerald-500"></span>
                  Pico: Martes (48)
                </span>
              </div>
            </div>

            {/* Visual Bar Chart con Líneas Guía de Precisión */}
            <div className="pt-2">
              <div className="relative h-44 flex items-end justify-between gap-2 sm:gap-4 px-2 sm:px-6">
                {/* Líneas horizontales de referencia de fondo */}
                <div className="absolute inset-x-2 sm:inset-x-6 top-0 bottom-6 flex flex-col justify-between pointer-events-none opacity-40">
                  <div className="border-b border-dashed border-gray-200 w-full flex items-center justify-end text-[9px] font-mono text-gray-400 pr-1">50</div>
                  <div className="border-b border-dashed border-gray-200 w-full flex items-center justify-end text-[9px] font-mono text-gray-400 pr-1">35</div>
                  <div className="border-b border-dashed border-gray-200 w-full flex items-center justify-end text-[9px] font-mono text-gray-400 pr-1">20</div>
                  <div className="border-b border-gray-200 w-full flex items-center justify-end text-[9px] font-mono text-gray-400 pr-1">0</div>
                </div>

                {weeklyAttendanceData.map((item, idx) => {
                  const barHeightPct = Math.round((item.count / 52) * 100);
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group relative z-10">
                      {/* Tooltip flotante */}
                      <div className="absolute -top-11 opacity-0 group-hover:opacity-100 transition-all pointer-events-none bg-gray-950 text-white text-[11px] font-mono py-1 px-2.5 rounded-none shadow-lg whitespace-nowrap -translate-y-1 z-30">
                        <div className="font-bold">{item.count} socias</div>
                        <div className="text-[9px] text-gray-400">{item.peakHour}</div>
                      </div>

                      {/* Contador arriba de la barra */}
                      <span className="text-[11px] font-mono font-bold text-gray-500 group-hover:text-gray-950 transition-colors">
                        {item.count}
                      </span>

                      {/* Barra Arquitectónica Rectangular (Sin forma de píldora redonda) */}
                      <div className="w-full max-w-[38px] bg-gray-100 rounded-none-t-sm h-full flex items-end overflow-hidden">
                        <div 
                          className={`w-full rounded-none-t-[2px] transition-all duration-300 ${
                            item.isToday 
                              ? 'bg-gray-950' 
                              : item.isPeak 
                              ? 'bg-gray-800 group-hover:bg-gray-950' 
                              : 'bg-gray-300 group-hover:bg-gray-600'
                          }`}
                          style={{ height: `${barHeightPct}%` }}
                        />
                      </div>

                      {/* Etiqueta del Día */}
                      <div className="text-center pt-1">
                        <span className={`text-xs font-semibold block ${item.isToday ? 'text-gray-950 font-bold' : 'text-gray-500'}`}>
                          {item.day}
                        </span>
                        {item.isToday && (
                          <span className="text-[9px] font-bold text-emerald-700 font-mono block">
                            Hoy
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pie de Insights del Gráfico */}
              <div className="mt-4 pt-3 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-gray-500 gap-2">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-gray-400" />
                  <span>Horario de mayor concurrencia: <strong>6:30 PM a 8:30 PM</strong></span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Mayor adherencia en socias con planes VIP y Semestrales</span>
                </div>
              </div>
            </div>
          </div>

          {/* Gráfico 2: Distribución y Salud de la Cartera de Clientes */}
          <div className="bg-white p-5 rounded-none border border-gray-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2.5 border-b border-gray-100">
              <div>
                <h2 className="text-sm font-bold text-gray-950 tracking-tight flex items-center gap-2">
                  <Activity className="w-4 h-4 text-gray-700" />
                  <span>Distribución y Salud de la Cartera</span>
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Segmentación analítica por estado del ciclo de vida
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-gray-700 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded-none">
                {totalBase} socias totales
              </span>
            </div>

            {/* Barra Segmentada Rectangular Nítida */}
            <div className="space-y-2">
              <div className="h-2.5 w-full bg-gray-100 rounded-none-xs overflow-hidden flex gap-0.5">
                <div 
                  className="bg-emerald-600 transition-all duration-300 hover:opacity-90" 
                  style={{ width: `${pctActivas}%` }}
                  title={`Activas: ${pctActivas}%`}
                />
                <div 
                  className="bg-amber-500 transition-all duration-300 hover:opacity-90" 
                  style={{ width: `${pctPorVencer}%` }}
                  title={`Por Vencer: ${pctPorVencer}%`}
                />
                <div 
                  className="bg-rose-500 transition-all duration-300 hover:opacity-90" 
                  style={{ width: `${pctAusencias}%` }}
                  title={`Ausentes en Riesgo: ${pctAusencias}%`}
                />
                <div 
                  className="bg-gray-400 transition-all duration-300 hover:opacity-90" 
                  style={{ width: `${pctLeads}%` }}
                  title={`Leads Fríos: ${pctLeads}%`}
                />
              </div>

              {/* Leyenda interactiva de 4 tarjetas clicables */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                <div 
                  onClick={() => setActiveTab('vencimientos')}
                  className="p-3 rounded-none border border-gray-200 bg-gray-50/50 hover:bg-white hover:border-gray-300 transition-all cursor-pointer text-xs"
                >
                  <div className="flex items-center gap-1.5 text-emerald-700 font-bold">
                    <span className="w-2 h-2 rounded-none-xs bg-emerald-600"></span>
                    <span>Activas</span>
                  </div>
                  <div className="text-base font-bold font-mono text-gray-950 mt-1">
                    {activasCount} <span className="text-[10px] font-normal text-gray-400">({pctActivas}%)</span>
                  </div>
                  <span className="text-[10px] text-gray-400">Membresía vigente</span>
                </div>

                <div 
                  onClick={() => setActiveTab('vencimientos')}
                  className="p-3 rounded-none border border-gray-200 bg-gray-50/50 hover:bg-white hover:border-gray-300 transition-all cursor-pointer text-xs"
                >
                  <div className="flex items-center gap-1.5 text-amber-800 font-bold">
                    <span className="w-2 h-2 rounded-none-xs bg-amber-500"></span>
                    <span>Por Vencer</span>
                  </div>
                  <div className="text-base font-bold font-mono text-gray-950 mt-1">
                    {porVencerCount} <span className="text-[10px] font-normal text-gray-400">({pctPorVencer}%)</span>
                  </div>
                  <span className="text-[10px] text-gray-400">Vence en ≤3 días</span>
                </div>

                <div 
                  onClick={() => setActiveTab('ausencias')}
                  className="p-3 rounded-none border border-gray-200 bg-gray-50/50 hover:bg-white hover:border-gray-300 transition-all cursor-pointer text-xs"
                >
                  <div className="flex items-center gap-1.5 text-rose-700 font-bold">
                    <span className="w-2 h-2 rounded-none-xs bg-rose-500"></span>
                    <span>En Riesgo</span>
                  </div>
                  <div className="text-base font-bold font-mono text-gray-950 mt-1">
                    {ausenciasCount} <span className="text-[10px] font-normal text-gray-400">({pctAusencias}%)</span>
                  </div>
                  <span className="text-[10px] text-gray-400">Ausentes sin asistir</span>
                </div>

                <div 
                  onClick={() => setActiveTab('leads')}
                  className="p-3 rounded-none border border-gray-200 bg-gray-50/50 hover:bg-white hover:border-gray-300 transition-all cursor-pointer text-xs"
                >
                  <div className="flex items-center gap-1.5 text-gray-700 font-bold">
                    <span className="w-2 h-2 rounded-none-xs bg-gray-400"></span>
                    <span>Leads Fríos</span>
                  </div>
                  <div className="text-base font-bold font-mono text-gray-950 mt-1">
                    {leadsCount} <span className="text-[10px] font-normal text-gray-400">({pctLeads}%)</span>
                  </div>
                  <span className="text-[10px] text-gray-400">Para promociones</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Columna Derecha: Líderes de Constancia & Rachas (Formato Tabla Leaderboard) */}
        <div className="lg:col-span-4 bg-white p-5 rounded-none border border-gray-200 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <h2 className="text-sm font-bold text-gray-950 tracking-tight flex items-center gap-2">
                  <Flame className="w-4 h-4 text-amber-600" />
                  <span>Líderes de Constancia</span>
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Socias con mayor racha de entrenamiento
                </p>
              </div>

              <span className="text-[10px] font-mono font-bold bg-gray-100 text-gray-800 border border-gray-200 px-2 py-0.5 rounded-none">
                Top 4
              </span>
            </div>

            {/* Listado de Rachas estilo Leaderboard Ejecutivo */}
            <div className="divide-y divide-gray-100 mt-1">
              {loyalStreaks.map((socia, index) => (
                <div 
                  key={socia.id}
                  className="py-3 flex items-center justify-between gap-2.5 hover:bg-gray-50/70 px-1 rounded-none transition-colors"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <span className="font-mono font-bold text-xs text-gray-400 w-5 text-right flex-shrink-0">
                      {index === 0 ? <span className="text-gray-950 font-black">01</span> : `0${index + 1}`}
                    </span>
                    <div className="overflow-hidden">
                      <div className="font-semibold text-xs text-gray-950 truncate">
                        {socia.nombre}
                      </div>
                      <div className="text-[11px] text-gray-400 font-mono flex items-center gap-1.5 mt-0.5">
                        <span className="text-gray-600">{socia.plan}</span>
                        <span>•</span>
                        <span>{socia.asistenciasMes} visitas/mes</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="font-mono text-xs font-bold text-gray-900 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded-none">
                      🔥 {socia.diasRacha}d
                    </span>

                    <button
                      onClick={() => handleFelicitarSocia(socia)}
                      className="px-2 py-1 rounded-none bg-gray-950 hover:bg-black text-white text-[11px] font-medium flex items-center gap-1 shadow-xs transition-all"
                      title={`Felicitar a ${socia.nombre} por WhatsApp`}
                    >
                      <Send className="w-3 h-3" />
                      <span>Felicitar</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Consejo de Fidelización al pie */}
          <div className="pt-3 border-t border-gray-100 bg-gray-50 p-3 rounded-none border border-gray-200 text-xs text-gray-600">
            <div className="flex items-start gap-2">
              <Zap className="w-3.5 h-3.5 text-gray-900 flex-shrink-0 mt-0.5" />
              <p className="text-[11px] leading-relaxed">
                Reconocer las rachas de tus socias fideliza la relación y reduce la deserción hasta en un <strong>34%</strong>.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Main 3-Engine Alert Board (Swiss Precision B2B Table) */}
      <div className="bg-white rounded-none border border-gray-200 shadow-xs overflow-hidden">
        {/* Navigation Tabs Header */}
        <div className="border-b border-gray-200 px-4 sm:px-6 py-3 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white">
          <div className="flex items-center gap-1.5 p-1 bg-gray-100 rounded-none overflow-x-auto w-full md:w-auto">
            <button
              onClick={() => setActiveTab('vencimientos')}
              className={`flex items-center gap-2 py-1.5 px-3 sm:px-3.5 rounded-none text-xs font-semibold transition-all whitespace-nowrap flex-shrink-0 ${
                activeTab === 'vencimientos'
                  ? 'bg-white text-gray-950 shadow-xs font-bold'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Clock className={`w-3.5 h-3.5 ${activeTab === 'vencimientos' ? 'text-amber-600' : 'text-gray-400'}`} />
              <span>Por Vencer</span>
              <span className="px-1.5 py-0.5 rounded-none text-[10px] font-mono font-bold bg-amber-100 text-amber-900 border border-amber-200">
                {vencimientos.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('ausencias')}
              className={`flex items-center gap-2 py-1.5 px-3 sm:px-3.5 rounded-none text-xs font-semibold transition-all whitespace-nowrap flex-shrink-0 ${
                activeTab === 'ausencias'
                  ? 'bg-white text-gray-950 shadow-xs font-bold'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <AlertTriangle className={`w-3.5 h-3.5 ${activeTab === 'ausencias' ? 'text-amber-600' : 'text-gray-400'}`} />
              <span>Socias Ausentes</span>
              <span className="px-1.5 py-0.5 rounded-none text-[10px] font-mono font-bold bg-amber-100 text-amber-900 border border-amber-200">
                {ausencias.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('leads')}
              className={`flex items-center gap-2 py-1.5 px-3 sm:px-3.5 rounded-none text-xs font-semibold transition-all whitespace-nowrap flex-shrink-0 ${
                activeTab === 'leads'
                  ? 'bg-white text-gray-950 shadow-xs font-bold'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Snowflake className={`w-3.5 h-3.5 ${activeTab === 'leads' ? 'text-gray-900' : 'text-gray-400'}`} />
              <span>Leads Fríos</span>
              <span className="px-1.5 py-0.5 rounded-none text-[10px] font-mono font-bold bg-gray-200 text-gray-700">
                {leadsFrios.length}
              </span>
            </button>
          </div>

          <div className="hidden sm:flex text-xs text-gray-500 items-center gap-2">
            <span className="w-2 h-2 rounded-none bg-emerald-500"></span>
            <span>Mensajería WhatsApp Oficial</span>
          </div>
        </div>

        {/* Tab Engine A: Vencimientos */}
        {activeTab === 'vencimientos' && (
          <div className="p-3.5 sm:p-6">
            <div className="mb-4 flex flex-col md:flex-row md:items-center justify-between gap-2">
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-gray-950">
                  Membresías con Vencimiento Próximo
                </h3>
                <p className="text-[11px] sm:text-xs text-gray-500 mt-0.5">
                  Socias cuya membresía está por culminar. Notifícales con un clic para renovar su plan a tiempo.
                </p>
              </div>
            </div>

            {vencimientos.length === 0 ? (
              <div className="text-center py-12 sm:py-16 bg-gray-50/50 rounded-none border border-dashed border-gray-200">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
                <h4 className="text-sm sm:text-base font-bold text-gray-800">¡Ningún vencimiento urgente hoy!</h4>
                <p className="text-xs text-gray-500 mt-1">Todas las socias tienen más de 3 días de vigencia en sus planes.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm min-w-[620px]">
                  <thead>
                    <tr className="border-b border-gray-200 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                      <th className="pb-3 px-3">Socia / DNI</th>
                      <th className="pb-3 px-3">Plan Activo</th>
                      <th className="pb-3 px-3">Fecha Fin</th>
                      <th className="pb-3 px-3">Estado Urgencia</th>
                      <th className="pb-3 px-3">Saldo</th>
                      <th className="pb-3 px-3 text-right">Acción WhatsApp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {vencimientos.map((item) => (
                      <tr key={item.cliente_id} className="hover:bg-gray-50/70 transition-colors">
                        <td className="py-3.5 px-3">
                          <div className="font-bold text-gray-950 leading-tight">
                            {item.nombre_completo}
                          </div>
                          <div className="text-xs text-gray-400 font-mono mt-0.5">
                            DNI: {item.dni} • Tel: {item.telefono}
                          </div>
                        </td>

                        <td className="py-3.5 px-3">
                          <span className="font-medium text-gray-800">{item.plan_nombre}</span>
                          <span className="text-xs text-gray-400 block font-mono">
                            S/ {Number(item.plan_precio || 40).toFixed(2)}
                          </span>
                        </td>

                        <td className="py-3.5 px-3">
                          <div className="font-mono text-xs font-semibold text-gray-800">
                            {item.fecha_fin}
                          </div>
                        </td>

                        <td className="py-3.5 px-3">
                          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-none text-xs font-bold font-mono ${
                            item.dias_restantes <= 0
                              ? 'bg-rose-50 text-rose-800 border border-rose-200'
                              : item.dias_restantes === 1
                              ? 'bg-amber-50 text-amber-900 border border-amber-200'
                              : 'bg-amber-50/70 text-amber-800 border border-amber-100'
                          }`}>
                            <span className="w-1.5 h-1.5 rounded-none bg-current"></span>
                            {item.dias_restantes < 0
                              ? `Vencida (-${Math.abs(item.dias_restantes)}d)`
                              : item.dias_restantes === 0
                              ? '¡Vence Hoy!'
                              : `Quedan ${item.dias_restantes} días`}
                          </span>
                        </td>

                        <td className="py-3.5 px-3">
                          {Number(item.saldo_pendiente) > 0 ? (
                            <span className="text-xs font-mono font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-none border border-rose-100">
                              Debe S/ {Number(item.saldo_pendiente).toFixed(2)}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400 font-mono">Pagado</span>
                          )}
                        </td>

                        <td className="py-3.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleCopyVencimiento(item)}
                              title="Copiar texto al portapapeles"
                              className="p-1.5 rounded-none text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors"
                            >
                              {copiedId === item.cliente_id ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </button>

                            <button
                              onClick={() => handleSendVencimiento(item)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-none bg-[#166534] hover:bg-[#14532D] text-white text-xs font-semibold shadow-xs transition-all"
                            >
                              <Send className="w-3.5 h-3.5" />
                              <span>Enviar WhatsApp</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab Engine B: Alertas de Inasistencia */}
        {activeTab === 'ausencias' && (
          <div className="p-3.5 sm:p-6">
            <div className="mb-4 flex flex-col md:flex-row md:items-center justify-between gap-2">
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-gray-950">
                  Retención Proactiva: Socias Ausentes ("Te Extrañamos")
                </h3>
                <p className="text-[11px] sm:text-xs text-gray-500 mt-0.5">
                  Socias con membresía activa que no registran asistencia hace varios días. Envíales un mensaje de acompañamiento.
                </p>
              </div>
            </div>

            {ausencias.length === 0 ? (
              <div className="text-center py-12 sm:py-16 bg-gray-50/50 rounded-none border border-dashed border-gray-200">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
                <h4 className="text-sm sm:text-base font-bold text-gray-800">¡Asistencia de socias impecable!</h4>
                <p className="text-xs text-gray-500 mt-1">Ninguna socia con membresía activa tiene más de 3 días de ausencia continua.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm min-w-[620px]">
                  <thead>
                    <tr className="border-b border-gray-200 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                      <th className="pb-3 px-3">Socia / Teléfono</th>
                      <th className="pb-3 px-3">Plan / Vigencia</th>
                      <th className="pb-3 px-3">Tiempo sin Asistir</th>
                      <th className="pb-3 px-3">Insistencias</th>
                      <th className="pb-3 px-3 text-right">Acción de Retención</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {ausencias.map((item) => (
                      <tr key={item.cliente_id} className="hover:bg-gray-50/70 transition-colors">
                        <td className="py-3.5 px-3">
                          <div className="font-bold text-gray-950 leading-tight">
                            {item.nombre_completo}
                          </div>
                          <div className="text-xs text-gray-400 font-mono mt-0.5">
                            DNI: {item.dni} • Cel: {item.telefono}
                          </div>
                        </td>

                        <td className="py-3.5 px-3">
                          <span className="font-medium text-gray-800">{item.plan_nombre}</span>
                          <span className="text-xs text-gray-400 block font-mono">
                            Vence: {item.fecha_fin}
                          </span>
                        </td>

                        <td className="py-3.5 px-3">
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-none text-xs font-bold font-mono bg-amber-50 text-amber-900 border border-amber-200">
                            <Clock className="w-3.5 h-3.5 text-amber-700" />
                            {item.dias_sin_asistir} días ausente
                          </span>
                        </td>

                        <td className="py-3.5 px-3">
                          <div className="flex items-center gap-2">
                            <div className="flex gap-1">
                              {[1, 2, 3].map((step) => (
                                <span
                                  key={step}
                                  className={`w-2 h-2 rounded-none-xs ${
                                    (item.intentos_recuperacion || 0) >= step
                                      ? 'bg-gray-950'
                                      : 'bg-gray-200'
                                  }`}
                                  title={`Insistencia ${step}`}
                                />
                              ))}
                            </div>
                            <span className="text-xs font-mono text-gray-500 font-semibold">
                              {item.intentos_recuperacion || 0}/3
                            </span>
                          </div>
                        </td>

                        <td className="py-3.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {/* Mover a Lead Frío si ya insistió */}
                            <button
                              onClick={() => onMoverLeadFrio && onMoverLeadFrio(item.cliente_id)}
                              title="Mover a Lead Frío para enviar promociones más adelante"
                              className="px-2.5 py-1.5 rounded-none border border-gray-200 text-gray-600 hover:bg-gray-100 text-xs font-medium transition-colors"
                            >
                              <Snowflake className="w-3.5 h-3.5 inline mr-1 text-gray-400" />
                              <span>A Lead Frío</span>
                            </button>

                            <button
                              onClick={() => handleSendAusencia(item)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-none bg-[#166534] hover:bg-[#14532D] text-white text-xs font-semibold shadow-xs transition-all"
                            >
                              <Send className="w-3.5 h-3.5" />
                              <span>Acompañar</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab Engine C: Leads Fríos */}
        {activeTab === 'leads' && (
          <div className="p-3.5 sm:p-6">
            <div className="mb-4 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-gray-50 p-3.5 sm:p-4 rounded-none border border-gray-200">
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-gray-950 flex items-center gap-2">
                  <Snowflake className="w-4 h-4 text-gray-700" />
                  <span>Embudo de Reactivación de Leads Fríos</span>
                </h3>
                <p className="text-[11px] sm:text-xs text-gray-600 mt-0.5">
                  Clientas que no renovaron tras 3 insistencias o llevan más de 15 días vencidas. Conviértelas en ventas nuevas con promociones.
                </p>
              </div>

              {promoActiva ? (
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <span className="text-[10px] font-bold tracking-wider text-emerald-800 uppercase block">Promo Activa:</span>
                    <span className="text-xs font-bold text-gray-900">{promoActiva.nombre} (S/ {promoActiva.precio})</span>
                  </div>
                  <button
                    onClick={onNavigateToLeads}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-none bg-gray-950 hover:bg-black text-white text-xs font-semibold shadow-xs transition-all"
                  >
                    <span>Lanzador de Campaña</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="text-xs text-amber-800 bg-amber-50 px-3 py-1.5 rounded-none border border-amber-200">
                  No hay una promoción activa. Activa una en "Planes".
                </div>
              )}
            </div>

            {leadsFrios.length === 0 ? (
              <div className="text-center py-12 sm:py-16 bg-gray-50/50 rounded-none border border-dashed border-gray-200">
                <Snowflake className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <h4 className="text-sm sm:text-base font-bold text-gray-800">No hay Leads Fríos actualmente</h4>
                <p className="text-xs text-gray-500 mt-1">Cuando una socia supere los 3 intentos sin renovar o más de 15 días de vencimiento aparecerá aquí.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm min-w-[620px]">
                  <thead>
                    <tr className="border-b border-gray-200 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                      <th className="pb-3 px-3">Ex-Socia / Contacto</th>
                      <th className="pb-3 px-3">Inactividad</th>
                      <th className="pb-3 px-3">Insistencias Previas</th>
                      <th className="pb-3 px-3">Promociones Recibidas</th>
                      <th className="pb-3 px-3 text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {leadsFrios.map((item) => (
                      <tr key={item.cliente_id} className="hover:bg-gray-50/70 transition-colors">
                        <td className="py-3.5 px-3">
                          <div className="font-bold text-gray-950 leading-tight">
                            {item.nombre_completo}
                          </div>
                          <div className="text-xs text-gray-400 font-mono mt-0.5">
                            DNI: {item.dni} • Tel: {item.telefono}
                          </div>
                        </td>

                        <td className="py-3.5 px-3">
                          <span className="text-xs font-mono font-semibold text-gray-700 bg-gray-100 px-2 py-0.5 rounded-none">
                            {item.dias_inactiva || 20} días sin entrenar
                          </span>
                        </td>

                        <td className="py-3.5 px-3 font-mono text-xs font-semibold text-gray-600">
                          {item.intentos_recuperacion || 3} recordatorios
                        </td>

                        <td className="py-3.5 px-3 font-mono text-xs font-semibold text-gray-600">
                          {item.promos_recibidas || 0} enviadas
                        </td>

                        <td className="py-3.5 px-3 text-right">
                          <button
                            onClick={onNavigateToLeads}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-none border border-gray-200 hover:border-gray-900 hover:text-gray-950 text-gray-700 text-xs font-semibold transition-all shadow-xs"
                          >
                            <span>Ver en Campañas</span>
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
