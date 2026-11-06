import { createPortal } from 'react-dom';
import React, { useState, useEffect } from 'react';
import { 
  X, 
  User, 
  CreditCard, 
  Smartphone, 
  Send, 
  Check, 
  Calendar, 
  AlertCircle, 
  Sparkles, 
  Clock, 
  Dumbbell,
  CheckCircle2,
  Search
} from 'lucide-react';
import { format, addDays } from 'date-fns';
import { openWhatsApp, parseWhatsAppTemplate } from '../../lib/whatsappParser';

export default function NewSubscriptionModal({ 
  isOpen, 
  onClose, 
  planes = [], 
  plantillas = [], 
  clientes = [], 
  initialClient = null,
  onSaveSubscription 
}) {
  const [dni, setDni] = useState('');
  const [nombreCompleto, setNombreCompleto] = useState('');
  const [telefono, setTelefono] = useState('');
  const [fechaNacimiento, setFechaNacimiento] = useState('');
  const [contactoEmergencia, setContactoEmergencia] = useState('');
  const [observacionesMedicas, setObservacionesMedicas] = useState('');
  
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [fechaInicio, setFechaInicio] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [metodoPago, setMetodoPago] = useState('YAPE');
  const [montoPagado, setMontoPagado] = useState('');
  const [whatsappConfirmado, setWhatsappConfirmado] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Initialize with initialClient if passed
  useEffect(() => {
    if (initialClient) {
      setDni(initialClient.dni || '');
      setNombreCompleto(initialClient.nombre_completo || '');
      setTelefono(initialClient.telefono || '');
      setFechaNacimiento(initialClient.fecha_nacimiento || '');
      setContactoEmergencia(initialClient.contacto_emergencia || '');
      setObservacionesMedicas(initialClient.observaciones_medicas || '');
    } else {
      setDni('');
      setNombreCompleto('');
      setTelefono('');
      setFechaNacimiento('');
      setContactoEmergencia('');
      setObservacionesMedicas('');
    }
  }, [initialClient, isOpen]);

  // Set default plan
  useEffect(() => {
    if (planes.length > 0 && !selectedPlanId) {
      const defaultPlan = planes.find(p => !p.es_promocion) || planes[0];
      setSelectedPlanId(defaultPlan.id);
      setMontoPagado(defaultPlan.precio.toString());
    }
  }, [planes, selectedPlanId]);

  if (!isOpen) return null;

  const currentPlan = planes.find(p => p.id === selectedPlanId) || planes[0] || {
    nombre: 'Plan Mensual',
    precio: 40.00,
    duracion_dias: 30,
    servicios_incluidos: ['Acceso total a sala de pesas y máquinas']
  };

  // Calcular fecha de fin automáticamente
  const startDate = new Date(fechaInicio || new Date());
  const calculatedEndDate = addDays(startDate, currentPlan.duracion_dias || 30);
  const fechaFinStr = format(calculatedEndDate, 'yyyy-MM-dd');

  const precioPlan = Number(currentPlan.precio || 0);
  const pagado = Number(montoPagado || 0);
  const saldoPendiente = Math.max(0, precioPlan - pagado);

  // Buscar plantilla de bienvenida
  const welcomeTemplate = plantillas.find(p => p.codigo_evento === 'BIENVENIDA_SUSCRIPCION') || {
    contenido_plantilla: '¡Hola {nombre}! 🏋️‍♀️✨ ¡Bienvenida a nuestro Gimnasio! Tu {plan} está activo desde {fecha_inicio} hasta {fecha_fin}. Incluye: {servicios}. Recuerda ingresar con tu DNI ({dni}). ¡A darlo todo! 💪🔥'
  };

  // Mensaje simulado en tiempo real
  const renderedMessage = parseWhatsAppTemplate(welcomeTemplate.contenido_plantilla, {
    nombre: nombreCompleto || 'Camila Paredes',
    plan: currentPlan.nombre,
    fecha_inicio: fechaInicio,
    fecha_fin: fechaFinStr,
    servicios: currentPlan.servicios_incluidos,
    dni: dni || '12345678',
    precio: precioPlan
  });

  // Autocompletar datos si el DNI ya existe
  const handleDniSearch = () => {
    if (!dni.trim()) return;
    const found = clientes.find(c => c.dni.trim() === dni.trim());
    if (found) {
      setNombreCompleto(found.nombre_completo);
      setTelefono(found.telefono);
      setFechaNacimiento(found.fecha_nacimiento || '');
      setContactoEmergencia(found.contacto_emergencia || '');
      setObservacionesMedicas(found.observaciones_medicas || '');
    }
  };

  const handlePlanSelect = (plan) => {
    setSelectedPlanId(plan.id);
    setMontoPagado(plan.precio.toString());
  };

  const handleSubmit = async (andSendWhatsApp = false) => {
    if (!dni.trim() || !nombreCompleto.trim() || !telefono.trim()) {
      alert('Por favor completa DNI, Nombre Completo y Teléfono.');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        cliente: {
          id: initialClient?.cliente_id || initialClient?.id,
          dni: dni.trim(),
          nombre_completo: nombreCompleto.trim(),
          telefono: telefono.trim(),
          fecha_nacimiento: fechaNacimiento || null,
          contacto_emergencia: contactoEmergencia || null,
          observaciones_medicas: observacionesMedicas || null,
        },
        planId: currentPlan.id,
        fechaInicio: fechaInicio,
        metodoPago: metodoPago,
        montoPagado: pagado,
        whatsappConfirmado: whatsappConfirmado
      };

      if (onSaveSubscription) {
        await onSaveSubscription(payload);
      }

      if (andSendWhatsApp) {
        openWhatsApp(telefono, renderedMessage);
      }

      onClose();
    } catch (err) {
      console.error('Error al registrar suscripción:', err);
      alert('Error al registrar la membresía.');
    } finally {
      setIsSaving(false);
    }
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] overflow-y-auto bg-black/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="relative w-full max-w-5xl bg-white rounded-none shadow-2xl border border-gray-200 overflow-hidden flex flex-col max-h-[94vh] sm:max-h-[92vh]">
        {/* Modal Header (Apollo Style) */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-gray-200 flex items-center justify-between bg-white">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-gray-950 tracking-tight flex items-center gap-2">
              <span>Nueva Membresía / Renovación</span>
              <span className="hidden sm:inline text-xs font-mono font-semibold bg-gray-100 text-gray-800 px-2 py-0.5 rounded-none border border-gray-200">
                Alta Inmediata
              </span>
            </h2>
            <p className="text-[11px] sm:text-xs text-gray-500 mt-0.5">
              Registra los datos de la socia, selecciona su plan y previsualiza su mensaje de alta.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-none text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2-Column Body */}
        <div className="flex-1 overflow-y-auto p-3.5 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 bg-gray-50/50">
          {/* Left Column: Form (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            {/* 1. Datos Personales */}
            <div className="bg-white p-4 rounded-none border border-gray-200 shadow-xs space-y-3.5">
              <h3 className="text-xs font-bold text-gray-950 uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-4 h-4 text-gray-700" />
                <span>1. Datos de la Socia</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* DNI */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    DNI / Documento *
                  </label>
                  <div className="relative flex">
                    <input
                      type="text"
                      maxLength={15}
                      value={dni}
                      onChange={(e) => setDni(e.target.value)}
                      onBlur={handleDniSearch}
                      placeholder="Ej. 72145896"
                      className="w-full px-3 py-2 rounded-none border border-gray-200 focus:border-gray-950 focus:ring-1 focus:ring-gray-950 text-sm font-mono outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleDniSearch}
                      title="Buscar DNI existente"
                      className="ml-1.5 px-2.5 py-2 rounded-none bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors text-xs border border-gray-200"
                    >
                      <Search className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Teléfono WhatsApp */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Celular WhatsApp *
                  </label>
                  <input
                    type="tel"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    placeholder="999888777 (o 51999888777)"
                    className="w-full px-3 py-2 rounded-none border border-gray-200 focus:border-gray-950 focus:ring-1 focus:ring-gray-950 text-sm font-mono outline-none"
                  />
                </div>

                {/* Nombre Completo */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Nombre Completo *
                  </label>
                  <input
                    type="text"
                    value={nombreCompleto}
                    onChange={(e) => setNombreCompleto(e.target.value)}
                    placeholder="Ej. Mariana Sofía Silva Quispe"
                    className="w-full px-3 py-2 rounded-none border border-gray-200 focus:border-gray-950 focus:ring-1 focus:ring-gray-950 text-sm outline-none"
                  />
                </div>

                {/* Contacto Emergencia */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Contacto de Emergencia
                  </label>
                  <input
                    type="text"
                    value={contactoEmergencia}
                    onChange={(e) => setContactoEmergencia(e.target.value)}
                    placeholder="Mamá: Rosa 984512789"
                    className="w-full px-3 py-2 rounded-none border border-gray-200 text-xs outline-none focus:border-gray-950"
                  />
                </div>

                {/* Observaciones Médicas */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Restricciones / Médicas
                  </label>
                  <input
                    type="text"
                    value={observacionesMedicas}
                    onChange={(e) => setObservacionesMedicas(e.target.value)}
                    placeholder="Ninguna / Lesión en hombro..."
                    className="w-full px-3 py-2 rounded-none border border-gray-200 text-xs outline-none focus:border-gray-950"
                  />
                </div>
              </div>
            </div>

            {/* 2. Selector Visual de Planes */}
            <div className="bg-white p-4 rounded-none border border-gray-200 shadow-xs space-y-3">
              <h3 className="text-xs font-bold text-gray-950 uppercase tracking-wider flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-gray-700" />
                  <span>2. Seleccionar Plan de Entrenamiento</span>
                </span>
                <span className="text-[11px] text-gray-400 font-normal">Precios oficiales en Soles</span>
              </h3>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                {planes.map((p) => {
                  const isSelected = p.id === selectedPlanId;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handlePlanSelect(p)}
                      className={`p-3 rounded-none border text-left transition-all relative flex flex-col justify-between ${
                        isSelected
                          ? 'border-gray-950 bg-gray-50/70 shadow-xs ring-1 ring-gray-950/20'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      {p.es_promocion && (
                        <span className="absolute -top-2 right-2 bg-emerald-700 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-none uppercase">
                          Promo
                        </span>
                      )}
                      <div>
                        <span className="text-xs font-bold text-gray-950 line-clamp-1">
                          {p.nombre}
                        </span>
                        <div className="text-xs text-gray-500 font-mono mt-0.5">
                          {p.duracion_dias} días
                        </div>
                      </div>

                      <div className="mt-2 text-base font-black font-mono text-gray-950">
                        S/ {Number(p.precio).toFixed(0)}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Fecha inicio y fin */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Fecha de Inicio
                  </label>
                  <input
                    type="date"
                    value={fechaInicio}
                    onChange={(e) => setFechaInicio(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-none border border-gray-200 text-xs font-mono outline-none focus:border-gray-950"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Fecha de Vencimiento
                  </label>
                  <input
                    type="date"
                    disabled
                    value={fechaFinStr}
                    className="w-full px-3 py-1.5 rounded-none border border-gray-200 bg-gray-100 text-xs font-mono text-gray-700 outline-none cursor-not-allowed"
                  />
                </div>
              </div>
            </div>

            {/* 3. Pago y Arqueo */}
            <div className="bg-white p-4 rounded-none border border-gray-200 shadow-xs space-y-3">
              <h3 className="text-xs font-bold text-gray-950 uppercase tracking-wider flex items-center justify-between">
                <span>3. Modalidad de Pago</span>
                <span className="font-mono text-xs font-bold text-gray-950">
                  Total Plan: S/ {precioPlan.toFixed(2)}
                </span>
              </h3>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {['YAPE', 'PLIN', 'EFECTIVO', 'TARJETA'].map((metodo) => (
                  <button
                    key={metodo}
                    type="button"
                    onClick={() => setMetodoPago(metodo)}
                    className={`py-2 px-3 rounded-none border text-xs font-bold font-mono transition-all text-center ${
                      metodoPago === metodo
                        ? 'border-gray-950 bg-gray-950 text-white shadow-xs'
                        : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {metodo}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Monto Pagado Hoy (S/)
                  </label>
                  <input
                    type="number"
                    step="0.50"
                    value={montoPagado}
                    onChange={(e) => setMontoPagado(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-none border border-gray-200 font-mono font-bold text-sm outline-none focus:border-gray-950"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Saldo Pendiente
                  </label>
                  <div className={`px-3 py-1.5 rounded-none border font-mono font-bold text-sm ${
                    saldoPendiente > 0 
                      ? 'bg-rose-50 text-rose-700 border-rose-200' 
                      : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  }`}>
                    S/ {saldoPendiente.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: WhatsApp Live Simulator (5 cols) */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
            <div className="bg-white p-4 rounded-none border border-gray-200 shadow-xs flex-1 flex flex-col">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-emerald-700" />
                  <span className="text-xs font-bold text-gray-950">
                    Simulador WhatsApp en Vivo
                  </span>
                </div>
                <span className="text-[10px] font-mono text-emerald-800 font-semibold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-none">
                  Plantilla Bienvenida
                </span>
              </div>

              {/* Simulated Phone Chat Body */}
              <div className="flex-1 bg-[#EFEAE2] p-3.5 rounded-none border border-gray-300 mt-3 flex flex-col justify-end min-h-[300px]">
                {/* Gym Sender Info */}
                <div className="bg-white/90 backdrop-blur-xs px-3 py-1.5 rounded-none text-center mb-3 text-[11px] text-gray-700 font-medium border border-gray-200 shadow-xs">
                  {import.meta.env.VITE_GYM_NAME || 'VitalFit Club'} • Notificación Oficial
                </div>

                {/* WhatsApp Chat Bubble */}
                <div className="bg-white rounded-none rounded-none-tl-none p-3 shadow-xs text-xs text-gray-900 leading-relaxed space-y-2 relative border border-gray-200">
                  <p className="whitespace-pre-line text-[11px]">
                    {renderedMessage}
                  </p>
                  
                  <div className="text-[10px] text-gray-400 text-right font-mono flex items-center justify-end gap-1">
                    <span>{format(new Date(), 'HH:mm')}</span>
                    <span className="text-sky-600 font-bold">✓✓</span>
                  </div>
                </div>
              </div>

              {/* Confirmation Checkbox Requirement */}
              <div className="mt-4 p-3 bg-gray-50 rounded-none border border-gray-200">
                <label className="flex items-start gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={whatsappConfirmado}
                    onChange={(e) => setWhatsappConfirmado(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded-none border-gray-300 text-gray-950 focus:ring-gray-950"
                  />
                  <div className="text-xs">
                    <span className="font-bold text-gray-950 block">
                      Confirmar que la socia recibió su mensaje
                    </span>
                    <span className="text-gray-500 text-[11px]">
                      Se registrará en la ficha como confirmación de bienvenida entregada.
                    </span>
                  </div>
                </label>
              </div>
            </div>

            {/* Modal Bottom Action Buttons (Apollo Style) */}
            <div className="space-y-2">
              <button
                type="button"
                disabled={isSaving}
                onClick={() => handleSubmit(true)}
                className="w-full py-2.5 px-4 rounded-none bg-[#166534] hover:bg-[#14532D] text-white text-xs font-semibold shadow-xs transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Guardar y Enviar WhatsApp (wa.me)</span>
              </button>

              <button
                type="button"
                disabled={isSaving}
                onClick={() => handleSubmit(false)}
                className="w-full py-2 px-4 rounded-none bg-gray-950 hover:bg-black text-white text-xs font-semibold transition-all shadow-xs active:scale-[0.98]"
              >
                Guardar Membresía (Solo Registro)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

