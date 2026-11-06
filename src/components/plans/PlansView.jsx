import { createPortal } from 'react-dom';
import React, { useState } from 'react';
import {
  CreditCard,
  Plus,
  Edit3,
  Trash2,
  Check,
  Sparkles,
  Snowflake,
  CheckCircle2,
  AlertCircle,
  Clock,
  Shield,
  Layers,
  ArrowRight
} from 'lucide-react';

export default function PlansView({
  planes = [],
  onSavePlan,
  onDeletePlan,
  onNavigateToLeads
}) {
  const [editingPlan, setEditingPlan] = useState(null);
  const [newServiceInput, setNewServiceInput] = useState('');

  const activePromo = planes.find(p => p.es_promocion && p.activo);

  const handleOpenEdit = (plan) => {
    setEditingPlan({
      ...plan,
      servicios_incluidos: Array.isArray(plan.servicios_incluidos)
        ? [...plan.servicios_incluidos]
        : []
    });
    setNewServiceInput('');
  };

  const handleOpenNew = () => {
    setEditingPlan({
      nombre: '',
      duracion_dias: 30,
      precio: 40.00,
      servicios_incluidos: [
        'Acceso libre a máquinas y peso libre',
        'Vestidores y casilleros',
        'Rutina básica inicial'
      ],
      dias_congelamiento_permitidos: 0,
      es_promocion: false,
      activo: true
    });
    setNewServiceInput('');
  };

  const handleAddService = () => {
    if (!newServiceInput.trim()) return;
    setEditingPlan({
      ...editingPlan,
      servicios_incluidos: [...editingPlan.servicios_incluidos, newServiceInput.trim()]
    });
    setNewServiceInput('');
  };

  const handleRemoveService = (index) => {
    const updated = editingPlan.servicios_incluidos.filter((_, idx) => idx !== index);
    setEditingPlan({
      ...editingPlan,
      servicios_incluidos: updated
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!editingPlan.nombre.trim() || !editingPlan.duracion_dias || !editingPlan.precio) {
      alert('Por favor completa todos los campos requeridos.');
      return;
    }

    if (onSavePlan) {
      await onSavePlan(editingPlan);
    }
    setEditingPlan(null);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner (Apollo Style) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-none border border-gray-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-gray-950 tracking-tight">
            Planes, Tarifas y Campañas Promocionales
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            Personaliza los precios oficiales, días de duración y beneficios que se comunican automáticamente a las clientas por WhatsApp.
          </p>
        </div>
        <button
          onClick={handleOpenNew}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-none bg-gray-950 hover:bg-black text-white text-xs font-semibold shadow-xs transition-all self-start md:self-auto active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          <span>Crear Nuevo Plan</span>
        </button>
      </div>

      {/* Promotional Banner Alert if an active promo exists */}
      {activePromo && (
        <div className="bg-emerald-50/50 p-4 rounded-none border border-emerald-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-none bg-emerald-800 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-emerald-900 uppercase tracking-wide">
                  Campaña para Leads Fríos Activa
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-none bg-emerald-200 text-emerald-900 font-bold border border-emerald-300">
                  S/ {Number(activePromo.precio).toFixed(2)}
                </span>
              </div>
              <h3 className="text-sm font-bold text-gray-950 mt-0.5">
                {activePromo.nombre} ({activePromo.duracion_dias} días)
              </h3>
              <p className="text-xs text-gray-600">
                Esta oferta está lista para enviarse en 1 clic a todas las socias catalogadas como Leads Fríos.
              </p>
            </div>
          </div>

          <button
            onClick={onNavigateToLeads}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-none bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold shadow-xs transition-all"
          >
            <span>Ver Leads Fríos y Enviar</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {planes.map((plan) => {
          const isPromo = plan.es_promocion;
          const servicios = Array.isArray(plan.servicios_incluidos)
            ? plan.servicios_incluidos
            : [];

          return (
            <div
              key={plan.id}
              className={`rounded-none border p-5 flex flex-col justify-between transition-all bg-white shadow-xs ${isPromo
                  ? 'border-emerald-300 ring-1 ring-emerald-300/40'
                  : 'border-gray-200 hover:border-gray-300'
                }`}
            >
              <div>
                {/* Header Tag */}
                <div className="flex items-center justify-between mb-3">
                  <span
                    className={`text-[10px] font-mono font-bold tracking-wider uppercase px-2 py-0.5 rounded-none border ${isPromo
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-gray-100 text-gray-700 border-gray-200'
                      }`}
                  >
                    {isPromo ? 'Promoción Leads Fríos' : 'Plan Base'}
                  </span>

                  <span className="text-xs text-gray-400 font-mono font-medium">
                    {plan.duracion_dias} días
                  </span>
                </div>

                {/* Plan Name */}
                <h3 className="text-base font-bold text-gray-950 leading-snug">
                  {plan.nombre}
                </h3>

                {/* Price Display */}
                <div className="my-3 flex items-baseline gap-1">
                  <span className="text-xs font-bold text-gray-400">S/</span>
                  <span className="text-3xl font-black font-mono text-gray-950">
                    {Number(plan.precio).toFixed(2)}
                  </span>
                </div>

                {/* Freezing info */}
                <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-4 pb-3 border-b border-gray-100">
                  <Clock className="w-3.5 h-3.5 text-gray-400" />
                  <span>
                    Congelamiento: <strong className="text-gray-800 font-mono">{plan.dias_congelamiento_permitidos || 0} días</strong>
                  </span>
                </div>

                {/* Included Services */}
                <div className="space-y-1.5 mb-6">
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                    Beneficios en WhatsApp:
                  </span>
                  {servicios.map((srv, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-gray-700">
                      <Check className="w-3.5 h-3.5 text-emerald-600 mt-0.5 flex-shrink-0" />
                      <span className="line-clamp-2">{srv}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => handleOpenEdit(plan)}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-none border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-semibold transition-colors shadow-xs"
                >
                  <Edit3 className="w-3.5 h-3.5 text-gray-500" />
                  <span>Editar Plan</span>
                </button>

                {isPromo && onDeletePlan && (
                  <button
                    onClick={() => {
                      if (confirm(`¿Eliminar la promoción "${plan.nombre}"?`)) {
                        onDeletePlan(plan.id);
                      }
                    }}
                    className="p-2 rounded-none text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    title="Eliminar Promoción"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit / Create Modal */}
      {editingPlan && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[9999] overflow-y-auto bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-none shadow-2xl border border-gray-200 max-w-lg w-full p-6">
            <h2 className="text-base font-bold text-gray-950 mb-4 pb-2 border-b border-gray-100 flex items-center justify-between">
              <span>{editingPlan.id ? 'Editar Plan / Tarifa' : 'Crear Nuevo Plan'}</span>
              <button
                onClick={() => setEditingPlan(null)}
                className="text-gray-400 hover:text-gray-600 text-sm p-1 rounded-none hover:bg-gray-100"
              >
                ✕
              </button>
            </h2>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Nombre del Plan *
                </label>
                <input
                  type="text"
                  required
                  value={editingPlan.nombre}
                  onChange={(e) => setEditingPlan({ ...editingPlan, nombre: e.target.value })}
                  placeholder="Ej. Plan Trimestral Especial"
                  className="w-full px-3 py-2 rounded-none border border-gray-200 text-xs outline-none focus:border-gray-950"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Duración (Días) *
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={editingPlan.duracion_dias}
                    onChange={(e) => setEditingPlan({ ...editingPlan, duracion_dias: parseInt(e.target.value) || 30 })}
                    className="w-full px-3 py-2 rounded-none border border-gray-200 font-mono text-xs outline-none focus:border-gray-950"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Precio Oficial (S/) *
                  </label>
                  <input
                    type="number"
                    step="0.50"
                    required
                    value={editingPlan.precio}
                    onChange={(e) => setEditingPlan({ ...editingPlan, precio: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-none border border-gray-200 font-mono font-bold text-xs outline-none focus:border-gray-950"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Días de Congelamiento Permitidos
                </label>
                <input
                  type="number"
                  min={0}
                  value={editingPlan.dias_congelamiento_permitidos || 0}
                  onChange={(e) => setEditingPlan({ ...editingPlan, dias_congelamiento_permitidos: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 rounded-none border border-gray-200 font-mono text-xs outline-none focus:border-gray-950"
                />
              </div>

              {/* Servicios Incluidos */}
              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Servicios y Beneficios Incluidos
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newServiceInput}
                    onChange={(e) => setNewServiceInput(e.target.value)}
                    placeholder="Agregar beneficio..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddService();
                      }
                    }}
                    className="flex-1 px-3 py-1.5 rounded-none border border-gray-200 text-xs outline-none focus:border-gray-950"
                  />
                  <button
                    type="button"
                    onClick={handleAddService}
                    className="px-3 py-1.5 rounded-none bg-gray-950 hover:bg-black text-white font-semibold text-xs shadow-xs"
                  >
                    Agregar
                  </button>
                </div>

                <div className="space-y-1 max-h-36 overflow-y-auto p-1 bg-gray-50 rounded-none border border-gray-200">
                  {editingPlan.servicios_incluidos.map((srv, idx) => (
                    <div key={idx} className="flex items-center justify-between py-1 px-2 bg-white rounded-none border border-gray-200 text-xs text-gray-700">
                      <span>• {srv}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveService(idx)}
                        className="text-gray-400 hover:text-rose-600 font-bold ml-2"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Switch Promoción para Leads Fríos */}
              <div className="pt-2 border-t border-gray-100">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={editingPlan.es_promocion || false}
                    onChange={(e) => setEditingPlan({ ...editingPlan, es_promocion: e.target.checked })}
                    className="h-4 w-4 rounded-none border-gray-300 text-gray-950 focus:ring-gray-950"
                  />
                  <div>
                    <span className="font-bold text-gray-950 block">
                      ¿Es una promoción para Leads Fríos?
                    </span>
                    <span className="text-gray-500 text-[11px]">
                      Aparecerá en el lanzador de campañas masivas de recuperación.
                    </span>
                  </div>
                </label>
              </div>

              <div className="pt-3 border-t border-gray-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingPlan(null)}
                  className="px-4 py-2 rounded-none border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 shadow-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-none bg-gray-950 hover:bg-black text-white font-semibold shadow-xs"
                >
                  Guardar Plan
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

