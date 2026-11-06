import React, { useState } from 'react';
import { 
  Snowflake, 
  Send, 
  Sparkles, 
  ExternalLink, 
  CheckCircle2, 
  Clock, 
  UserCheck, 
  Tag, 
  ArrowRight,
  UserPlus,
  RefreshCw
} from 'lucide-react';
import { openWhatsApp, parseWhatsAppTemplate } from '../../lib/whatsappParser';

export default function ColdLeadsView({ 
  leadsFrios = [], 
  planes = [], 
  plantillas = [], 
  onInsistencia,
  onOpenNewSub,
  onRefresh
}) {
  const [selectedPromoId, setSelectedPromoId] = useState('');
  const [sentLeadIds, setSentLeadIds] = useState(new Set());

  // Promociones disponibles
  const promoPlanes = planes.filter((p) => p.es_promocion && p.activo);
  const defaultPromo = promoPlanes[0] || planes[0];

  React.useEffect(() => {
    if (defaultPromo && !selectedPromoId) {
      setSelectedPromoId(defaultPromo.id);
    }
  }, [defaultPromo, selectedPromoId]);

  const currentPromo = planes.find((p) => p.id === selectedPromoId) || defaultPromo;

  // Plantilla comercial para Leads Fríos
  const promoTemplate = plantillas.find((p) => p.codigo_evento === 'PROMOCION_LEAD_FRIO') || {
    contenido_plantilla: '¡Hola {nombre}! 👋 Tenemos una gran noticia: ¡Queremos verte de regreso! Te habilitamos la promoción exclusiva: *{promo_nombre}* a solo *S/ {promo_precio}*. Incluye: {servicios}. ¿Te reservamos un cupo? 🎁🔥'
  };

  const handleSendPromo = (lead) => {
    if (!currentPromo) {
      alert('Por favor selecciona una promoción activa.');
      return;
    }

    const mensaje = parseWhatsAppTemplate(promoTemplate.contenido_plantilla, {
      nombre: lead.nombre_completo,
      promo_nombre: currentPromo.nombre,
      promo_precio: currentPromo.precio,
      servicios: currentPromo.servicios_incluidos,
      telefono: lead.telefono,
      dni: lead.dni
    });

    openWhatsApp(lead.telefono, mensaje);

    if (onInsistencia) {
      onInsistencia(lead.cliente_id, 'PROMOCION_LEAD_FRIO', mensaje);
    }

    setSentLeadIds((prev) => new Set(prev).add(lead.cliente_id));
  };

  return (
    <div className="space-y-6">
      {/* Header (Apollo Style) */}
      <div className="bg-white p-5 rounded-none border border-gray-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-950 tracking-tight flex items-center gap-2">
            <span className="p-1.5 rounded-none bg-gray-100 text-gray-900">
              <Snowflake className="w-4 h-4" />
            </span>
            <span>Gestor de Leads Fríos y Lanzador de Promociones</span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            Convierte clientas inactivas o perdidas en ventas nuevas ofreciéndoles planes especiales de reactivación.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onRefresh}
            className="p-2 rounded-none border border-gray-200 hover:bg-gray-50 text-gray-600 transition-colors shadow-xs"
            title="Refrescar lista"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Campaign Launcher Configuration Card */}
      <div className="bg-white p-5 rounded-none border border-gray-200 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-none bg-gray-950 text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-950">
                1. Selecciona la Promoción Activa para esta Campaña
              </h2>
              <p className="text-xs text-gray-500">
                Se inyectará el nombre, precio y beneficios de esta promoción en cada mensaje de WhatsApp.
              </p>
            </div>
          </div>

          {/* Selector de Promoción */}
          <div className="flex items-center gap-2">
            <select
              value={selectedPromoId}
              onChange={(e) => setSelectedPromoId(e.target.value)}
              className="px-3 py-1.5 rounded-none border border-gray-200 bg-white text-xs font-semibold text-gray-800 shadow-xs outline-none focus:border-gray-950 focus:ring-1 focus:ring-gray-950"
            >
              {planes.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.es_promocion ? '⭐ [PROMO] ' : ''}{p.nombre} — S/ {Number(p.precio).toFixed(2)} ({p.duracion_dias}d)
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Selected Promo Preview Pill */}
        {currentPromo && (
          <div className="bg-gray-50 p-3.5 rounded-none border border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <Tag className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <div>
                <strong className="text-gray-950 font-bold">{currentPromo.nombre}</strong>
                <span className="text-gray-500 ml-2">
                  Duración: <strong className="font-mono text-gray-800">{currentPromo.duracion_dias} días</strong>
                </span>
                <span className="text-gray-500 ml-2">
                  Precio Campaña: <strong className="font-mono text-gray-950 font-bold">S/ {Number(currentPromo.precio).toFixed(2)}</strong>
                </span>
              </div>
            </div>

            <div className="text-[11px] text-gray-500">
              Plantilla vinculada: <strong className="text-gray-800 font-mono">PROMOCION_LEAD_FRIO</strong>
            </div>
          </div>
        )}
      </div>

      {/* Cold Leads Table */}
      <div className="bg-white rounded-none border border-gray-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-950">
              Listado de Ex-Socias Clasificadas como "Lead Frío"
            </span>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-none bg-gray-100 text-gray-700 border border-gray-200">
              {leadsFrios.length} socias
            </span>
          </div>

          <div className="text-xs text-gray-500">
            Regla: ≥ 3 insistencias o &gt;15 días vencidas
          </div>
        </div>

        {leadsFrios.length === 0 ? (
          <div className="text-center py-16 bg-gray-50/30">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-gray-950">¡Excelente retención!</h3>
            <p className="text-xs text-gray-500 mt-1">No hay usuarias estancadas en el estado de Lead Frío.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm min-w-[580px]">
              <thead>
                <tr className="border-b border-gray-200 text-[11px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50/50">
                  <th className="pb-3 px-4 pt-3">Socia / DNI</th>
                  <th className="pb-3 px-4 pt-3">Inactiva Desde</th>
                  <th className="pb-3 px-4 pt-3">Intentos Previos</th>
                  <th className="pb-3 px-4 pt-3">Promos Recibidas</th>
                  <th className="pb-3 px-4 pt-3 text-right">Lanzar WhatsApp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {leadsFrios.map((lead) => {
                  const wasSent = sentLeadIds.has(lead.cliente_id);
                  return (
                    <tr key={lead.cliente_id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-gray-950 leading-tight">
                          {lead.nombre_completo}
                        </div>
                        <div className="text-xs text-gray-400 font-mono mt-0.5">
                          DNI: {lead.dni} • Cel: {lead.telefono}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="text-xs font-mono font-semibold text-gray-700 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded-none">
                          {lead.dias_inactiva || 20} días sin entrenar
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-xs font-semibold text-gray-600">
                        {lead.intentos_recuperacion || 3} recordatorios
                      </td>

                      <td className="py-3.5 px-4 font-mono text-xs font-semibold text-gray-600">
                        {lead.promos_recibidas || 0} recibidas
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* Re-activar Plan Manualmente */}
                          <button
                            onClick={() => onOpenNewSub && onOpenNewSub(lead)}
                            className="px-2.5 py-1.5 rounded-none border border-gray-200 hover:border-gray-950 hover:text-gray-950 text-gray-700 text-xs font-semibold transition-colors shadow-xs"
                            title="Reactivar plan a esta socia"
                          >
                            <UserPlus className="w-3.5 h-3.5 inline mr-1 text-stone-400" />
                            <span>Reactivar Plan</span>
                          </button>

                          {/* Enviar Promoción WhatsApp */}
                          <button
                            onClick={() => handleSendPromo(lead)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-none text-xs font-semibold shadow-xs transition-all ${
                              wasSent
                                ? 'bg-gray-100 text-gray-600 border border-gray-200'
                                : 'bg-[#166534] hover:bg-[#14532D] text-white'
                            }`}
                          >
                            <Send className="w-3 h-3" />
                            <span>{wasSent ? 'Enviado ✓' : 'Enviar Promo WhatsApp'}</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

