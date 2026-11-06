import React from 'react';
import { AlertCircle, AlertTriangle, X, ArrowRight, Send } from 'lucide-react';

export default function ToastAlert({ 
  vencimientos = [], 
  ausencias = [], 
  onDismiss, 
  onOpenNotifications 
}) {
  const vencenHoy = vencimientos.filter(v => v.dias_restantes <= 0);
  const totalCritico = vencenHoy.length + ausencias.length;

  if (totalCritico === 0) return null;

  return (
    <aside aria-label="Notificaciones del sistema" className="fixed bottom-5 right-5 z-40 max-w-sm w-full bg-white rounded-none border border-gray-200 shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
      <div className="p-4 border-l-4 border-gray-950 bg-white">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 text-gray-950 font-bold text-sm">
            <span className="p-1 rounded-none bg-amber-50 text-amber-800 border border-amber-200">
              <AlertTriangle className="w-3.5 h-3.5" />
            </span>
            <span>Atención del Día</span>
          </div>
          <button 
            onClick={onDismiss}
            className="text-gray-400 hover:text-gray-700 p-1 rounded-none hover:bg-gray-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-2.5 text-xs text-gray-600 space-y-1">
          {vencenHoy.length > 0 && (
            <p className="flex items-center gap-1.5 font-medium text-gray-800">
              <span className="w-1.5 h-1.5 rounded-none bg-rose-500"></span>
              <strong>{vencenHoy.length} socia(s)</strong> vencen hoy día.
            </p>
          )}
          {ausencias.length > 0 && (
            <p className="flex items-center gap-1.5 font-medium text-gray-800">
              <span className="w-1.5 h-1.5 rounded-none bg-amber-500"></span>
              <strong>{ausencias.length} socia(s)</strong> ausentes con riesgo de abandono.
            </p>
          )}
        </div>

        <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between">
          <button
            onClick={onOpenNotifications}
            className="text-xs font-semibold text-gray-950 hover:underline inline-flex items-center gap-1"
          >
            <span>Ver y enviar mensajes</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onDismiss}
            className="text-[11px] text-gray-400 hover:text-gray-600"
          >
            Ocultar aviso
          </button>
        </div>
      </div>
    </aside>
  );
}

