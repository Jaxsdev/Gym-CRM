import React, { useState } from 'react';
import { 
  MessageSquare, 
  Smartphone, 
  Save, 
  Sparkles, 
  Check, 
  Send, 
  Copy, 
  CheckCircle2, 
  HelpCircle,
  FileText
} from 'lucide-react';
import { parseWhatsAppTemplate, copyToClipboard, openWhatsApp } from '../../lib/whatsappParser';

export default function TemplatesView({ plantillas = [], onSavePlantilla }) {
  const [selectedCode, setSelectedCode] = useState(
    plantillas[0]?.codigo_evento || 'BIENVENIDA_SUSCRIPCION'
  );
  const [editedTemplate, setEditedTemplate] = useState(null);
  const [isSaved, setIsSaved] = useState(false);
  const [testPhone, setTestPhone] = useState('999888777');

  const currentTemplate = plantillas.find((p) => p.codigo_evento === selectedCode) || plantillas[0];

  // Sync edited template when selected code changes
  React.useEffect(() => {
    if (currentTemplate) {
      setEditedTemplate({ ...currentTemplate });
      setIsSaved(false);
    }
  }, [selectedCode, currentTemplate]);

  if (!currentTemplate || !editedTemplate) return null;

  // Variables disponibles según el tipo de plantilla
  const chipsVariables = [
    { tag: '{nombre}', desc: 'Nombre de la socia' },
    { tag: '{dni}', desc: 'DNI para check-in' },
    { tag: '{plan}', desc: 'Nombre del plan' },
    { tag: '{precio}', desc: 'Precio del plan (S/)' },
    { tag: '{servicios}', desc: 'Lista de beneficios' },
    { tag: '{fecha_inicio}', desc: 'Fecha de inicio' },
    { tag: '{fecha_fin}', desc: 'Fecha de vencimiento' },
    { tag: '{dias_restantes}', desc: 'Contador de días restantes' },
    { tag: '{dias_sin_asistir}', desc: 'Días de inasistencia' },
    { tag: '{promo_nombre}', desc: 'Nombre de la promo' },
    { tag: '{promo_precio}', desc: 'Precio de la promo' },
  ];

  const handleInsertVariable = (variableTag) => {
    setEditedTemplate((prev) => ({
      ...prev,
      contenido_plantilla: (prev.contenido_plantilla || '') + ` ${variableTag} `
    }));
  };

  const handleSave = async () => {
    if (onSavePlantilla) {
      await onSavePlantilla(editedTemplate);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2500);
    }
  };

  // Preview data demo
  const sampleVariables = {
    nombre: 'Luciana Paredes',
    dni: '47895612',
    plan: 'Plan Trimestral',
    precio: 60.00,
    servicios: ['Acceso total a máquinas', 'Clases grupales de baile', 'Asesoría nutricional'],
    fecha_inicio: '01/11/2026',
    fecha_fin: '31/01/2027',
    dias_restantes: 2,
    dias_sin_asistir: 4,
    promo_nombre: 'Promo Retorno Flash',
    promo_precio: '50.00'
  };

  const previewText = parseWhatsAppTemplate(editedTemplate.contenido_plantilla, sampleVariables);

  return (
    <div className="space-y-6">
      {/* Header (Apollo Style) */}
      <div className="bg-white p-5 rounded-none border border-gray-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-950 tracking-tight">
            Editor de Plantillas Dinámicas de WhatsApp
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            Configura los 7 eventos de mensajería automatizada con variables dinámicas que se reemplazan al instante.
          </p>
        </div>

        <button
          onClick={handleSave}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-none bg-gray-950 hover:bg-black text-white text-xs font-semibold shadow-xs transition-all self-start md:self-auto active:scale-[0.98]"
        >
          {isSaved ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Save className="w-4 h-4" />}
          <span>{isSaved ? '¡Guardado con Éxito!' : 'Guardar Cambios'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Event Selection List (4 cols) */}
        <div className="lg:col-span-4 space-y-2">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider px-2">
            7 Eventos del Sistema
          </div>

          <div className="space-y-1.5">
            {plantillas.map((p, idx) => {
              const isSelected = p.codigo_evento === selectedCode;
              return (
                <button
                  key={p.codigo_evento}
                  onClick={() => setSelectedCode(p.codigo_evento)}
                  className={`w-full text-left p-3 rounded-none border transition-all flex items-start gap-3 ${
                    isSelected
                      ? 'border-gray-950 bg-gray-50/70 shadow-xs ring-1 ring-gray-950/10'
                      : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <span
                    className={`w-6 h-6 rounded-none text-xs font-mono font-bold flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      isSelected
                        ? 'bg-gray-950 text-white'
                        : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {idx + 1}
                  </span>

                  <div className="overflow-hidden">
                    <h3 className={`text-xs font-semibold leading-snug truncate ${
                      isSelected ? 'text-gray-950 font-bold' : 'text-gray-700'
                    }`}>
                      {p.titulo_panel}
                    </h3>
                    <span className="text-[10px] font-mono text-gray-400 block mt-0.5">
                      {p.codigo_evento}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Center: Template Editor (5 cols) */}
        <div className="lg:col-span-5 bg-white p-5 rounded-none border border-gray-200 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <span className="text-[11px] font-mono text-gray-500 font-bold block uppercase">
                  {editedTemplate.codigo_evento}
                </span>
                <h2 className="text-sm font-bold text-gray-950">
                  {editedTemplate.titulo_panel}
                </h2>
              </div>
            </div>

            {/* Chips de variables */}
            <div className="my-3">
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                Insertar Variable con 1 Clic:
              </label>
              <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-1.5 bg-gray-50 rounded-none border border-gray-200">
                {chipsVariables.map((chip) => (
                  <button
                    key={chip.tag}
                    type="button"
                    onClick={() => handleInsertVariable(chip.tag)}
                    title={chip.desc}
                    className="px-2 py-0.5 bg-white hover:bg-gray-100 border border-gray-200 rounded-none text-[11px] font-mono text-gray-700 font-semibold shadow-2xs hover:border-gray-950 transition-colors"
                  >
                    + {chip.tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Textarea */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Contenido del Mensaje
              </label>
              <textarea
                rows={9}
                value={editedTemplate.contenido_plantilla}
                onChange={(e) => setEditedTemplate({ ...editedTemplate, contenido_plantilla: e.target.value })}
                className="w-full p-3 rounded-none border border-gray-200 text-xs text-gray-900 leading-relaxed outline-none focus:border-gray-950 focus:ring-1 focus:ring-gray-950 font-sans"
              />
              <p className="text-[11px] text-gray-400 mt-1">
                Usa asteriscos para negrita en WhatsApp: *texto en negrita*.
              </p>
            </div>
          </div>

          <button
            onClick={handleSave}
            className="w-full py-2.5 rounded-none bg-gray-950 hover:bg-black text-white text-xs font-semibold shadow-xs transition-all flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>Guardar Plantilla</span>
          </button>
        </div>

        {/* Right: Phone Simulator Preview (3 cols) */}
        <div className="lg:col-span-3 bg-white p-4 rounded-none border border-gray-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 pb-3 border-b border-gray-100 mb-3">
              <Smartphone className="w-4 h-4 text-emerald-700" />
              <h3 className="text-xs font-bold text-gray-950">
                Previsualización en Teléfono
              </h3>
            </div>

            {/* Simulated Phone Shell */}
            <div className="bg-[#EFEAE2] p-3 rounded-none border border-gray-300 shadow-inner flex flex-col min-h-[380px] justify-between">
              {/* WhatsApp App Bar */}
              <div className="bg-[#166534] text-white p-2.5 rounded-none flex items-center gap-2 shadow-xs">
                <div className="w-6 h-6 rounded-none bg-white/20 flex items-center justify-center text-[10px] font-bold">
                  VF
                </div>
                <div className="overflow-hidden">
                  <div className="text-[11px] font-bold truncate leading-tight">
                    {import.meta.env.VITE_GYM_NAME || 'VitalFit Club'}
                  </div>
                  <div className="text-[9px] text-emerald-200">En línea</div>
                </div>
              </div>

              {/* Message Bubble */}
              <div className="my-3 bg-white p-3 rounded-none rounded-none-tl-none shadow-xs border border-gray-200 text-xs text-gray-900 space-y-2 relative">
                <p className="whitespace-pre-line leading-relaxed text-[11px]">
                  {previewText}
                </p>
                <div className="text-[9px] text-gray-400 text-right font-mono flex items-center justify-end gap-1">
                  <span>10:30</span>
                  <span className="text-sky-600 font-bold">✓✓</span>
                </div>
              </div>

              <div className="text-center text-[10px] text-gray-400 font-medium">
                Simulación con datos de ejemplo
              </div>
            </div>
          </div>

          {/* Test Link Button */}
          <div className="mt-4 pt-3 border-t border-gray-100">
            <button
              onClick={() => openWhatsApp(testPhone, previewText)}
              className="w-full py-2 px-3 rounded-none bg-[#166534] hover:bg-[#14532D] text-white text-xs font-semibold shadow-xs transition-all flex items-center justify-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Probar en mi WhatsApp</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

