import { createPortal } from 'react-dom';
import React, { useState } from 'react';
import { 
  Bell, 
  Clock, 
  AlertTriangle, 
  Snowflake, 
  Send, 
  ExternalLink, 
  CheckCircle2, 
  X,
  PhoneCall
} from 'lucide-react';
import { openWhatsApp, parseWhatsAppTemplate } from '../../lib/whatsappParser';

export default function NotificationCenter({ 
  isOpen, 
  onClose, 
  vencimientos = [], 
  ausencias = [], 
  leadsFrios = [],
  plantillas = [],
  onInsistencia,
  onOpenNewSub
}) {
  const [activeTab, setActiveTab] = useState('vencimientos');

  if (!isOpen) return null;

  const getTemplate = (code) => {
    return plantillas.find(p => p.codigo_evento === code) || null;
  };

  const handleSendWhatsAppVencimiento = (item) => {
    let templateCode = 'VENCE_3_DIAS';
    if (item.dias_restantes <= 0) templateCode = 'VENCE_HOY';
    else if (item.dias_restantes === 1) templateCode = 'VENCE_2_DIAS';
    else if (item.dias_restantes === 2) templateCode = 'VENCE_2_DIAS';
    else if (item.dias_restantes === 3) templateCode = 'VENCE_3_DIAS';

    const tpl = getTemplate(templateCode);
    const text = tpl 
      ? parseWhatsAppTemplate(tpl.contenido_plantilla, {
          nombre: item.nombre_completo,
          plan: item.plan_nombre,
          fecha_fin: item.fecha_fin,
          dias_restantes: item.dias_restantes,
          dni: item.dni
        })
      : `Hola ${item.nombre_completo}, tu membresía vence pronto.`;

    openWhatsApp(item.telefono, text);
    if (onInsistencia) {
      onInsistencia(item.cliente_id, templateCode, text);
    }
  };

  const handleSendWhatsAppAusencia = (item) => {
    const tpl = getTemplate('AUSENCIA_3_5_DIAS');
    const text = tpl 
      ? parseWhatsAppTemplate(tpl.contenido_plantilla, {
          nombre: item.nombre_completo,
          dias_sin_asistir: item.dias_sin_asistir,
          plan: item.plan_nombre
        })
      : `Hola ${item.nombre_completo}, te extrañamos en el gym!`;

    openWhatsApp(item.telefono, text);
    if (onInsistencia) {
      onInsistencia(item.cliente_id, 'AUSENCIA_3_5_DIAS', text);
    }
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] overflow-hidden flex justify-end">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col z-10 border-l border-gray-200">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-none bg-gray-100 text-gray-900 flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-gray-950 text-sm">Centro de Notificaciones</h3>
              <p className="text-[11px] text-gray-500">Alertas operativas prioritarias</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-none text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="grid grid-cols-3 border-b border-gray-200 bg-white text-xs font-semibold">
          <button
            onClick={() => setActiveTab('vencimientos')}
            className={`py-3 px-2 flex flex-col items-center gap-1 border-b-2 transition-all ${
              activeTab === 'vencimientos'
                ? 'border-gray-950 text-gray-950 bg-gray-50 font-bold'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span>Por Vencer</span>
            </div>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-none font-bold bg-amber-100 text-amber-900 border border-amber-200">
              {vencimientos.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('ausencias')}
            className={`py-3 px-2 flex flex-col items-center gap-1 border-b-2 transition-all ${
              activeTab === 'ausencias'
                ? 'border-gray-950 text-gray-950 bg-gray-50 font-bold'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Ausentes</span>
            </div>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-none font-bold bg-amber-100 text-amber-900 border border-amber-200">
              {ausencias.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('leads')}
            className={`py-3 px-2 flex flex-col items-center gap-1 border-b-2 transition-all ${
              activeTab === 'leads'
                ? 'border-gray-950 text-gray-950 bg-gray-50 font-bold'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center gap-1">
              <Snowflake className="w-3.5 h-3.5" />
              <span>Leads Fríos</span>
            </div>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-none font-bold bg-gray-100 text-gray-700">
              {leadsFrios.length}
            </span>
          </button>
        </div>

        {/* Content List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/60">
          {activeTab === 'vencimientos' && (
            <>
              <div className="text-xs text-gray-500 font-medium pb-1 flex justify-between items-center">
                <span>Planes que vencen en 3 días o menos:</span>
                <span className="font-mono text-[11px] text-gray-600 font-bold">{vencimientos.length} activas</span>
              </div>

              {vencimientos.length === 0 ? (
                <div className="text-center py-12 px-4 bg-white rounded-none border border-dashed border-gray-200 text-gray-500">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-gray-800">¡Al día!</p>
                  <p className="text-xs text-gray-500 mt-1">No hay membresías por vencer en los próximos 3 días.</p>
                </div>
              ) : (
                vencimientos.map((item) => (
                  <div 
                    key={item.cliente_id}
                    className="p-3.5 rounded-none bg-white border border-gray-200 shadow-xs hover:border-gray-300 transition-all"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="text-sm font-bold text-gray-950 leading-tight">
                          {item.nombre_completo}
                        </h4>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {item.plan_nombre} • Vence: <strong className="text-gray-800">{item.fecha_fin}</strong>
                        </p>
                      </div>

                      <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-none flex-shrink-0 ${
                        item.dias_restantes <= 0
                          ? 'bg-rose-50 text-rose-800 border border-rose-200'
                          : 'bg-amber-50 text-amber-800 border border-amber-200'
                      }`}>
                        {item.dias_restantes <= 0 ? '¡Vence Hoy!' : `Quedan ${item.dias_restantes}d`}
                      </span>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between gap-2">
                      <span className="text-[11px] text-gray-400 font-mono">
                        DNI: {item.dni}
                      </span>
                      <button
                        onClick={() => handleSendWhatsAppVencimiento(item)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-none bg-[#166534] hover:bg-[#14532D] text-white text-xs font-semibold shadow-xs transition-all"
                      >
                        <Send className="w-3 h-3" />
                        <span>Avisar WhatsApp</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </>
          )}

          {activeTab === 'ausencias' && (
            <>
              <div className="text-xs text-gray-500 font-medium pb-1 flex justify-between items-center">
                <span>Socias activas ausentes:</span>
                <span className="font-mono text-[11px] text-amber-700 font-bold">{ausencias.length} en riesgo</span>
              </div>

              {ausencias.length === 0 ? (
                <div className="text-center py-12 px-4 bg-white rounded-none border border-dashed border-gray-200 text-gray-500">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-gray-800">Asistencia perfecta</p>
                  <p className="text-xs text-gray-500 mt-1">Ninguna socia lleva más de 3 días sin registrar asistencia.</p>
                </div>
              ) : (
                ausencias.map((item) => (
                  <div 
                    key={item.cliente_id}
                    className="p-3.5 rounded-none bg-white border border-gray-200 shadow-xs hover:border-amber-200 transition-all"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="text-sm font-bold text-gray-950 leading-tight">
                          {item.nombre_completo}
                        </h4>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {item.plan_nombre}
                        </p>
                      </div>

                      <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-none bg-amber-50 text-amber-800 border border-amber-200 flex-shrink-0">
                        {item.dias_sin_asistir} días ausente
                      </span>
                    </div>

                    <div className="mt-2.5 text-xs text-gray-600 flex items-center justify-between">
                      <span>Insistencias: <strong className="font-mono">{item.intentos_recuperacion || 0} / 3</strong></span>
                      {item.notificada_hoy && (
                        <span className="text-[10px] text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded-none">
                          Notificada hoy
                        </span>
                      )}
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between gap-2">
                      <button
                        onClick={() => handleSendWhatsAppAusencia(item)}
                        className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-none bg-[#166534] hover:bg-[#14532D] text-white text-xs font-semibold shadow-xs transition-all"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Enviar "¿Todo bien? Te extrañamos"</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </>
          )}

          {activeTab === 'leads' && (
            <>
              <div className="text-xs text-gray-500 font-medium pb-1 flex justify-between items-center">
                <span>Leads Fríos disponibles para promociones:</span>
                <span className="font-mono text-[11px] text-gray-600 font-bold">{leadsFrios.length} socias</span>
              </div>

              {leadsFrios.length === 0 ? (
                <div className="text-center py-12 px-4 bg-white rounded-none border border-dashed border-gray-200 text-gray-500">
                  <Snowflake className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-gray-800">Sin Leads Fríos</p>
                  <p className="text-xs text-gray-500 mt-1">Todas las socias se mantienen activas o en seguimiento.</p>
                </div>
              ) : (
                leadsFrios.map((item) => (
                  <div 
                    key={item.cliente_id}
                    className="p-3.5 rounded-none bg-white border border-gray-200 shadow-xs hover:border-gray-300 transition-all"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="text-sm font-bold text-gray-950 leading-tight">
                          {item.nombre_completo}
                        </h4>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Inactiva hace {item.dias_inactiva || 15} días
                        </p>
                      </div>

                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-none bg-gray-100 text-gray-700 font-semibold flex-shrink-0">
                        Lead Frío
                      </span>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between gap-2">
                      <span className="text-xs text-gray-400 font-mono">
                        {item.promos_recibidas || 0} promos enviadas
                      </span>
                      <button
                        onClick={() => {
                          onClose();
                          if (onOpenNewSub) onOpenNewSub(item);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-none bg-gray-950 hover:bg-black text-white text-xs font-semibold shadow-xs transition-all"
                      >
                        <span>Reactivar Plan</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

