import React from 'react';
import { createPortal } from 'react-dom';
import { 
  AlertTriangle, 
  Clock, 
  Send, 
  X, 
  ArrowRight, 
  CheckCircle2, 
  Users, 
  Calendar,
  Sparkles
} from 'lucide-react';
import { openWhatsApp, parseWhatsAppTemplate } from '../../lib/whatsappParser';

export default function LoginBriefingModal({ 
  isOpen, 
  onClose, 
  vencimientos = [], 
  ausencias = [], 
  plantillas = [], 
  onOpenNotifications 
}) {
  if (!isOpen || typeof document === 'undefined') return null;

  const totalAlerts = vencimientos.length + ausencias.length;

  const handleSendWhatsAppVencimiento = (item) => {
    let tplCode = 'VENCE_3_DIAS';
    if (item.dias_restantes <= 0) tplCode = 'VENCE_HOY';
    else if (item.dias_restantes === 1) tplCode = 'VENCE_2_DIAS';
    else if (item.dias_restantes === 2) tplCode = 'VENCE_2_DIAS';

    const tpl = plantillas.find(p => p.codigo_evento === tplCode) || plantillas[0];
    const text = tpl 
      ? parseWhatsAppTemplate(tpl.contenido_plantilla, {
          nombre: item.nombre_completo,
          plan: item.plan_nombre,
          fecha_fin: item.fecha_fin,
          dias_restantes: item.dias_restantes
        })
      : `Hola ${item.nombre_completo}, te recordamos que tu membresía vence pronto en VitalFit Gym.`;

    openWhatsApp(item.telefono, text);
  };

  const handleSendWhatsAppAusencia = (item) => {
    const tpl = plantillas.find(p => p.codigo_evento === 'AUSENCIA_3_5_DIAS') || plantillas[0];
    const text = tpl 
      ? parseWhatsAppTemplate(tpl.contenido_plantilla, {
          nombre: item.nombre_completo,
          dias_sin_asistir: item.dias_sin_asistir,
          plan: item.plan_nombre
        })
      : `Hola ${item.nombre_completo}, te extrañamos en VitalFit Gym!`;

    openWhatsApp(item.telefono, text);
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-none border border-gray-300 shadow-2xl max-w-2xl w-full overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        
        {/* Cabecera Rectangular */}
        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between bg-white">
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-amber-50 text-amber-900 border border-amber-200 rounded-none">
              <AlertTriangle className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-gray-950 tracking-tight">
                  Resumen Operativo de Apertura
                </h2>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 bg-amber-100 text-amber-900 border border-amber-300 rounded-none">
                  {totalAlerts} alertas hoy
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Casos prioritarios detectados para gestionar al inicio de tu turno.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-none text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            title="Cerrar resumen"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido Scrolleable */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-gray-50/50">
          
          {/* Sección 1: Vencimientos Inmediatos */}
          {vencimientos.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-none p-4 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-600" />
                  <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                    Membresías por Vencer ({vencimientos.length})
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-gray-400">Renovación Preventiva</span>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {vencimientos.slice(0, 4).map((item) => (
                  <div
                    key={item.id}
                    className="p-2.5 bg-gray-50 border border-gray-200 rounded-none flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-gray-950 flex items-center gap-2">
                        <span>{item.nombre_completo}</span>
                        <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-none border ${
                          item.dias_restantes <= 0
                            ? 'bg-rose-100 text-rose-800 border-rose-200'
                            : 'bg-amber-100 text-amber-800 border-amber-200'
                        }`}>
                          {item.dias_restantes <= 0 ? '¡Vence Hoy!' : `Vence en ${item.dias_restantes}d`}
                        </span>
                      </div>
                      <div className="text-[11px] text-gray-500 font-mono mt-0.5">
                        {item.plan_nombre} • Fin: {item.fecha_fin}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleSendWhatsAppVencimiento(item)}
                      className="px-2.5 py-1.5 rounded-none bg-[#166534] hover:bg-[#14532D] text-white text-[11px] font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
                    >
                      <Send className="w-3 h-3" />
                      <span>WhatsApp</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sección 2: Ausencias en Riesgo de Abandono */}
          {ausencias.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-none p-4 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                    Socias Ausentes ({ausencias.length})
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-gray-400">Riesgo de Abandono</span>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {ausencias.slice(0, 4).map((item) => (
                  <div
                    key={item.id}
                    className="p-2.5 bg-gray-50 border border-gray-200 rounded-none flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-gray-950 flex items-center gap-2">
                        <span>{item.nombre_completo}</span>
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-none bg-rose-100 text-rose-800 border border-rose-200">
                          {item.dias_sin_asistir} días sin asistir
                        </span>
                      </div>
                      <div className="text-[11px] text-gray-500 font-mono mt-0.5">
                        {item.plan_nombre} • DNI: {item.dni}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleSendWhatsAppAusencia(item)}
                      className="px-2.5 py-1.5 rounded-none bg-[#166534] hover:bg-[#14532D] text-white text-[11px] font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
                    >
                      <Send className="w-3 h-3" />
                      <span>WhatsApp</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {totalAlerts === 0 && (
            <div className="bg-white border border-gray-200 rounded-none p-8 text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
              <h3 className="text-sm font-bold text-gray-950">¡Todo en Orden Hoy!</h3>
              <p className="text-xs text-gray-500">
                No hay alertas urgentes pendientes de vencimiento ni socias en riesgo crítico de abandono.
              </p>
            </div>
          )}
        </div>

        {/* Footer con Acciones */}
        <div className="p-4 border-t border-gray-200 bg-white flex flex-col sm:flex-row items-center justify-between gap-3">
          {totalAlerts > 4 ? (
            <button
              type="button"
              onClick={() => {
                onClose();
                if (onOpenNotifications) onOpenNotifications();
              }}
              className="text-xs font-semibold text-gray-700 hover:text-gray-950 flex items-center gap-1 underline"
            >
              <span>Ver todas las {totalAlerts} alertas en el centro de control</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <span className="text-[11px] font-mono text-gray-400">
              Sesión iniciada con éxito
            </span>
          )}

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2 rounded-none bg-gray-950 hover:bg-black text-white text-xs font-bold shadow-xs transition-all active:scale-[0.98]"
            >
              Continuar al Panel Principal ↵
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

