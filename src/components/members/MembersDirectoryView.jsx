import { createPortal } from 'react-dom';
import React, { useState } from 'react';
import {
  Users,
  Search,
  Filter,
  Snowflake,
  Clock,
  CheckCircle2,
  Calendar,
  X,
  Send,
  Activity,
  ChevronRight,
  PhoneCall,
  AlertTriangle,
  ArrowUpRight,
  TrendingDown,
  Dumbbell,
  RefreshCw,
  Repeat
} from 'lucide-react';
import { format, differenceInCalendarDays } from 'date-fns';
import { openWhatsApp, formatPhoneNumber } from '../../lib/whatsappParser';

export default function MembersDirectoryView({
  clientes = [],
  onFreeze,
  onSaveProgress,
  onGetProgress,
  onOpenNewSub,
  onRefresh
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('TODOS');
  const [selectedMember, setSelectedMember] = useState(null);

  // Tab within member drawer
  const [drawerTab, setDrawerTab] = useState('info'); // 'info' | 'medidas' | 'congelar'
  const [progressRecords, setProgressRecords] = useState([]);
  const [freezeDays, setFreezeDays] = useState(7);
  const [isFreezing, setIsFreezing] = useState(false);

  // Form for new progress measurement
  const [newPeso, setNewPeso] = useState('');
  const [newCintura, setNewCintura] = useState('');
  const [newCadera, setNewCadera] = useState('');
  const [newBrazo, setNewBrazo] = useState('');
  const [newPierna, setNewPierna] = useState('');
  const [newGrasa, setNewGrasa] = useState('');
  const [newNotas, setNewNotas] = useState('');

  // When a member is opened, fetch their physical progress
  const handleOpenMember = async (member) => {
    setSelectedMember(member);
    setDrawerTab('info');
    if (onGetProgress) {
      const records = await onGetProgress(member.id);
      setProgressRecords(records || []);
    }
  };

  const handleFreezeSubmit = async () => {
    if (!selectedMember?.suscripcion_actual?.id) {
      alert('La socia no tiene una suscripción activa para congelar.');
      return;
    }
    setIsFreezing(true);
    try {
      if (onFreeze) {
        await onFreeze(selectedMember.suscripcion_actual.id, freezeDays);
      }
      alert(`¡Membresía congelada por ${freezeDays} días con éxito!`);
      setSelectedMember(null);
      if (onRefresh) onRefresh();
    } catch (e) {
      console.error(e);
      alert('Error al congelar la membresía.');
    } finally {
      setIsFreezing(false);
    }
  };

  const handleAddProgress = async (e) => {
    e.preventDefault();
    if (!newPeso && !newCintura) {
      alert('Ingresa al menos el peso o la cintura.');
      return;
    }

    const payload = {
      cliente_id: selectedMember.id,
      fecha_registro: format(new Date(), 'yyyy-MM-dd'),
      peso_kg: parseFloat(newPeso) || null,
      cintura_cm: parseFloat(newCintura) || null,
      cadera_cm: parseFloat(newCadera) || null,
      brazo_cm: parseFloat(newBrazo) || null,
      pierna_cm: parseFloat(newPierna) || null,
      porcentaje_grasa: parseFloat(newGrasa) || null,
      notas: newNotas || ''
    };

    if (onSaveProgress) {
      const saved = await onSaveProgress(payload);
      setProgressRecords([saved, ...progressRecords]);
      setNewPeso('');
      setNewCintura('');
      setNewCadera('');
      setNewBrazo('');
      setNewPierna('');
      setNewGrasa('');
      setNewNotas('');
    }
  };

  const handleSendProgressWhatsApp = () => {
    if (progressRecords.length === 0) return;
    const latest = progressRecords[0];
    const prev = progressRecords[1];

    let diffText = '';
    if (prev && latest.peso_kg && prev.peso_kg) {
      const diff = (latest.peso_kg - prev.peso_kg).toFixed(1);
      diffText = `\nVariación de peso: ${diff > 0 ? '+' : ''}${diff} kg`;
    }

    const gymName = import.meta.env.VITE_GYM_NAME || 'VitalFit Club';
    const text = `¡Hola ${selectedMember.nombre_completo}! 🏋️‍♀️📊\nAquí tienes el resumen de tu evolución física en ${gymName} (${latest.fecha_registro}):\n\n` +
      `• Peso: ${latest.peso_kg || '-'} kg\n` +
      `• Cintura: ${latest.cintura_cm || '-'} cm\n` +
      `• Cadera: ${latest.cadera_cm || '-'} cm\n` +
      `• Brazo: ${latest.brazo_cm || '-'} cm\n` +
      `• Pierna: ${latest.pierna_cm || '-'} cm\n` +
      (latest.porcentaje_grasa ? `• % Grasa: ${latest.porcentaje_grasa}%\n` : '') +
      diffText +
      `\n\n¡Cada entrenamiento cuenta! Sigue constante y lograrás todos tus objetivos. 💪🔥`;

    openWhatsApp(selectedMember.telefono, text);
  };

  // Filtering
  const filteredMembers = clientes.filter((c) => {
    const matchesSearch =
      c.nombre_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.dni.includes(searchTerm) ||
      c.telefono.includes(searchTerm);

    if (!matchesSearch) return false;

    if (selectedFilter === 'TODOS') return true;
    if (selectedFilter === 'ACTIVAS') return c.estado_ciclo_vida === 'ACTIVA';
    if (selectedFilter === 'POR_VENCER') return c.estado_ciclo_vida === 'POR_VENCER';
    if (selectedFilter === 'EN_RIESGO_AUSENCIA') return c.estado_ciclo_vida === 'EN_RIESGO_AUSENCIA';
    if (selectedFilter === 'VENCIDA') return c.estado_ciclo_vida === 'VENCIDA';
    if (selectedFilter === 'LEAD_FRIO') return c.estado_ciclo_vida === 'LEAD_FRIO';
    if (selectedFilter === 'CONGELADA') return c.estado_ciclo_vida === 'CONGELADA';

    return true;
  });

  const getStatusBadge = (estado) => {
    switch (estado) {
      case 'ACTIVA':
        return <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-mono font-bold px-2 py-0.5 rounded-none">Activa</span>;
      case 'POR_VENCER':
        return <span className="bg-amber-50 text-amber-900 border border-amber-200 text-[10px] font-mono font-bold px-2 py-0.5 rounded-none">Por Vencer</span>;
      case 'EN_RIESGO_AUSENCIA':
        return <span className="bg-amber-50 text-amber-900 border border-amber-200 text-[10px] font-mono font-bold px-2 py-0.5 rounded-none">Ausente</span>;
      case 'VENCIDA':
        return <span className="bg-rose-50 text-rose-800 border border-rose-200 text-[10px] font-mono font-bold px-2 py-0.5 rounded-none">Vencida</span>;
      case 'LEAD_FRIO':
        return <span className="bg-gray-100 text-gray-700 border border-gray-200 text-[10px] font-mono font-bold px-2 py-0.5 rounded-none">Lead Frío</span>;
      case 'CONGELADA':
        return <span className="bg-sky-50 text-sky-800 border border-sky-200 text-[10px] font-mono font-bold px-2 py-0.5 rounded-none">Congelada</span>;
      default:
        return <span className="bg-gray-100 text-gray-600 border border-gray-200 text-[10px] font-mono font-bold px-2 py-0.5 rounded-none">{estado}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Limpio (Apollo Style) */}
      <div className="bg-white p-5 rounded-none border border-gray-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-950 tracking-tight">
            Directorio de Socias y Ficha Médica
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            Consulta historial de asistencia, congelamiento de membresía y seguimiento de progreso corporal.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold px-3 py-1.5 rounded-none bg-gray-50 border border-gray-200 text-gray-700">
            {clientes.length} socias registradas
          </span>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-white p-4 rounded-none border border-gray-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por DNI, nombre o teléfono..."
              className="w-full pl-9 pr-4 py-2 rounded-none border border-gray-200 text-xs outline-none focus:border-gray-950 focus:ring-1 focus:ring-gray-950 transition-all placeholder:text-gray-400"
            />
          </div>

          <div className="text-xs text-gray-400 font-mono">
            {filteredMembers.length} socias encontradas
          </div>
        </div>

        {/* State Filter Buttons */}
        <div className="flex items-center gap-1 overflow-x-auto p-1 bg-gray-100 rounded-none text-xs">
          {[
            { id: 'TODOS', label: 'Todos' },
            { id: 'ACTIVAS', label: 'Activas' },
            { id: 'POR_VENCER', label: 'Por Vencer' },
            { id: 'EN_RIESGO_AUSENCIA', label: 'Socias Ausentes' },
            { id: 'CONGELADA', label: 'Congeladas' },
            { id: 'VENCIDA', label: 'Vencidas' },
            { id: 'LEAD_FRIO', label: 'Leads Fríos' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedFilter(tab.id)}
              className={`px-3 py-1.5 rounded-none font-semibold transition-all whitespace-nowrap ${selectedFilter === tab.id
                  ? 'bg-white text-gray-950 font-bold shadow-xs'
                  : 'text-gray-500 hover:text-gray-900'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Members Table */}
      <div className="bg-white rounded-none border border-gray-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm min-w-[580px]">
            <thead>
              <tr className="border-b border-gray-200 text-[11px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50/50">
                <th className="py-3 px-4">Socia / DNI</th>
                <th className="py-3 px-4">Estado Ciclo de Vida</th>
                <th className="py-3 px-4">Plan Actual</th>
                <th className="py-3 px-4">Vencimiento</th>
                <th className="py-3 px-4">Última Asistencia</th>
                <th className="py-3 px-4 text-right">Ficha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredMembers.map((member) => {
                const sub = member.suscripcion_actual;
                return (
                  <tr
                    key={member.id}
                    onClick={() => handleOpenMember(member)}
                    className="hover:bg-gray-50/70 cursor-pointer transition-colors"
                  >
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-gray-950 leading-tight">
                        {member.nombre_completo}
                      </div>
                      <div className="text-xs text-gray-400 font-mono mt-0.5">
                        DNI: {member.dni} • Cel: {member.telefono}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      {getStatusBadge(member.estado_ciclo_vida)}
                    </td>

                    <td className="py-3.5 px-4">
                      {sub ? (
                        <div>
                          <span className="font-semibold text-gray-800 text-xs">
                            {sub.planes?.nombre || 'Plan'}
                          </span>
                          <span className="text-[11px] text-gray-400 font-mono block">
                            S/ {Number(sub.precio_pactado || 0).toFixed(2)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400 italic">Sin suscripción activa</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 font-mono text-xs">
                      {sub?.fecha_fin ? (
                        <span className="font-semibold text-gray-700">{sub.fecha_fin}</span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-xs text-gray-500 font-mono">
                      {member.ultima_asistencia ? (
                        format(new Date(member.ultima_asistencia), 'dd/MM/yyyy HH:mm')
                      ) : (
                        <span className="text-gray-400 italic">Nunca asistió</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenMember(member);
                        }}
                        className="p-1.5 rounded-none text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Member Lateral Profile Drawer (Apollo Flyout Panel) */}
      {selectedMember && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[9999] overflow-hidden flex justify-end">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity"
            onClick={() => setSelectedMember(null)}
          />

          <div className="relative w-full max-w-lg bg-white h-full shadow-2xl flex flex-col z-10 border-l border-gray-200">
            {/* Header */}
            <div className="p-5 border-b border-gray-200 bg-white flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-base font-bold text-gray-950">
                    {selectedMember.nombre_completo}
                  </h2>
                  {getStatusBadge(selectedMember.estado_ciclo_vida)}
                </div>
                <div className="text-xs text-gray-500 font-mono">
                  DNI: {selectedMember.dni} • WhatsApp: {selectedMember.telefono}
                </div>
              </div>
              <button
                onClick={() => setSelectedMember(null)}
                className="p-1.5 rounded-none text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sub-tabs */}
            <div className="grid grid-cols-3 border-b border-gray-200 bg-white text-xs font-semibold">
              <button
                onClick={() => setDrawerTab('info')}
                className={`py-3 px-2 text-center border-b-2 transition-all ${drawerTab === 'info'
                    ? 'border-gray-950 text-gray-950 bg-gray-50/60 font-bold'
                    : 'border-transparent text-gray-500 hover:text-gray-900'
                  }`}
              >
                Membresía & Info
              </button>
              <button
                onClick={() => setDrawerTab('medidas')}
                className={`py-3 px-2 text-center border-b-2 transition-all ${drawerTab === 'medidas'
                    ? 'border-gray-950 text-gray-950 bg-gray-50/60 font-bold'
                    : 'border-transparent text-gray-500 hover:text-gray-900'
                  }`}
              >
                Avance Físico ({progressRecords.length})
              </button>
              <button
                onClick={() => setDrawerTab('congelar')}
                className={`py-3 px-2 text-center border-b-2 transition-all ${drawerTab === 'congelar'
                    ? 'border-gray-950 text-gray-950 bg-gray-50/60 font-bold'
                    : 'border-transparent text-gray-500 hover:text-gray-900'
                  }`}
              >
                Congelar Plan
              </button>
            </div>

            {/* Tab Contents */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-gray-50/50">
              {drawerTab === 'info' && (
                <div className="space-y-4 text-xs">
                  {/* Current Plan Card */}
                  <div className="p-4 rounded-none bg-white border border-gray-200 shadow-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                        Plan Vigente
                      </span>
                      {/* Contextual Renewal Button only if expired or ending */}
                      {onOpenNewSub && (
                        <button
                          onClick={() => {
                            const clientData = selectedMember;
                            setSelectedMember(null);
                            onOpenNewSub(clientData);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-none bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold text-[11px] transition-colors"
                        >
                          <Repeat className="w-3 h-3" />
                          <span>Renovar / Cambiar Plan</span>
                        </button>
                      )}
                    </div>

                    {selectedMember.suscripcion_actual ? (
                      <div className="space-y-1.5 pt-1">
                        <div className="flex justify-between items-center">
                          <h4 className="text-sm font-bold text-gray-950">
                            {selectedMember.suscripcion_actual.planes?.nombre}
                          </h4>
                          <span className="font-mono font-bold text-gray-950">
                            S/ {Number(selectedMember.suscripcion_actual.precio_pactado).toFixed(2)}
                          </span>
                        </div>
                        <div className="text-gray-600 flex justify-between">
                          <span>Vigencia:</span>
                          <span className="font-mono font-semibold">
                            {selectedMember.suscripcion_actual.fecha_inicio} al {selectedMember.suscripcion_actual.fecha_fin}
                          </span>
                        </div>
                        <div className="text-gray-600 flex justify-between">
                          <span>Saldo Pendiente:</span>
                          <span className={`font-mono font-bold ${Number(selectedMember.suscripcion_actual.saldo_pendiente) > 0 ? 'text-rose-600' : 'text-emerald-700'
                            }`}>
                            S/ {Number(selectedMember.suscripcion_actual.saldo_pendiente || 0).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-3">
                        <p className="text-gray-500 italic mb-2">No tiene plan activo actualmente.</p>
                        {onOpenNewSub && (
                          <button
                            onClick={() => {
                              const clientData = selectedMember;
                              setSelectedMember(null);
                              onOpenNewSub(clientData);
                            }}
                            className="px-3 py-1.5 rounded-none bg-gray-950 hover:bg-black text-white font-semibold text-xs shadow-xs"
                          >
                            Activar Membresía Ahora
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Medical and Emergency */}
                  <div className="p-4 rounded-none bg-white border border-gray-200 shadow-xs space-y-3">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                      Datos de Salud y Emergencia
                    </span>
                    <div>
                      <span className="text-gray-500 block mb-0.5">Contacto de Emergencia:</span>
                      <strong className="text-gray-900 font-medium">
                        {selectedMember.contacto_emergencia || 'No registrado'}
                      </strong>
                    </div>
                    <div>
                      <span className="text-gray-500 block mb-0.5">Restricciones / Médicas:</span>
                      <strong className="text-gray-900 font-medium">
                        {selectedMember.observaciones_medicas || 'Sin restricciones conocidas'}
                      </strong>
                    </div>
                  </div>

                  {/* Fast WhatsApp Chat */}
                  <button
                    onClick={() => openWhatsApp(selectedMember.telefono, `Hola ${selectedMember.nombre_completo}, te escribimos de ${import.meta.env.VITE_GYM_NAME || 'VitalFit'}`)}
                    className="w-full py-2.5 px-4 rounded-none bg-[#166534] hover:bg-[#14532D] text-white font-semibold flex items-center justify-center gap-2 shadow-xs transition-colors"
                  >
                    <Send className="w-4 h-4" />
                    <span>Abrir Chat de WhatsApp</span>
                  </button>
                </div>
              )}

              {drawerTab === 'medidas' && (
                <div className="space-y-4 text-xs">
                  {/* Add New Measurements */}
                  <form onSubmit={handleAddProgress} className="p-4 rounded-none bg-white border border-gray-200 shadow-xs space-y-3">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                      Registrar Nueva Medida Hoy ({format(new Date(), 'dd/MM/yyyy')})
                    </span>

                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-[11px] text-gray-600 block mb-1">Peso (kg)</label>
                        <input
                          type="number"
                          step="0.1"
                          value={newPeso}
                          onChange={(e) => setNewPeso(e.target.value)}
                          placeholder="60.5"
                          className="w-full px-2 py-1.5 rounded-none border border-gray-200 font-mono text-xs outline-none focus:border-gray-950"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-gray-600 block mb-1">Cintura (cm)</label>
                        <input
                          type="number"
                          step="0.5"
                          value={newCintura}
                          onChange={(e) => setNewCintura(e.target.value)}
                          placeholder="70"
                          className="w-full px-2 py-1.5 rounded-none border border-gray-200 font-mono text-xs outline-none focus:border-gray-950"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-gray-600 block mb-1">Cadera (cm)</label>
                        <input
                          type="number"
                          step="0.5"
                          value={newCadera}
                          onChange={(e) => setNewCadera(e.target.value)}
                          placeholder="95"
                          className="w-full px-2 py-1.5 rounded-none border border-gray-200 font-mono text-xs outline-none focus:border-gray-950"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-[11px] text-gray-600 block mb-1">Brazo (cm)</label>
                        <input
                          type="number"
                          step="0.5"
                          value={newBrazo}
                          onChange={(e) => setNewBrazo(e.target.value)}
                          placeholder="26"
                          className="w-full px-2 py-1.5 rounded-none border border-gray-200 font-mono text-xs outline-none focus:border-gray-950"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-gray-600 block mb-1">Pierna (cm)</label>
                        <input
                          type="number"
                          step="0.5"
                          value={newPierna}
                          onChange={(e) => setNewPierna(e.target.value)}
                          placeholder="53"
                          className="w-full px-2 py-1.5 rounded-none border border-gray-200 font-mono text-xs outline-none focus:border-gray-950"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-gray-600 block mb-1">% Grasa</label>
                        <input
                          type="number"
                          step="0.1"
                          value={newGrasa}
                          onChange={(e) => setNewGrasa(e.target.value)}
                          placeholder="22"
                          className="w-full px-2 py-1.5 rounded-none border border-gray-200 font-mono text-xs outline-none focus:border-gray-950"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2 rounded-none bg-gray-950 hover:bg-black text-white font-semibold text-xs mt-1 shadow-xs transition-colors"
                    >
                      Guardar Medición
                    </button>
                  </form>

                  {/* Send Progress by WhatsApp */}
                  {progressRecords.length > 0 && (
                    <button
                      onClick={handleSendProgressWhatsApp}
                      className="w-full py-2.5 px-4 rounded-none bg-[#166534] hover:bg-[#14532D] text-white font-semibold flex items-center justify-center gap-2 shadow-xs text-xs transition-colors"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Enviar Resumen de Avance por WhatsApp</span>
                    </button>
                  )}

                  {/* Historical Records */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                      Historial de Evaluaciones Físicas
                    </span>

                    {progressRecords.length === 0 ? (
                      <p className="text-gray-400 italic text-center py-4 bg-white rounded-none border border-gray-200">
                        Aún no se han registrado medidas corporales para esta socia.
                      </p>
                    ) : (
                      progressRecords.map((prog, idx) => (
                        <div key={prog.id || idx} className="p-3 bg-white rounded-none border border-gray-200 text-xs space-y-1">
                          <div className="flex justify-between items-center text-gray-500 font-mono text-[11px] pb-1 border-b border-gray-100">
                            <span>{prog.fecha_registro}</span>
                            {idx === 0 && <span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 rounded-none">Última</span>}
                          </div>
                          <div className="grid grid-cols-3 gap-2 pt-1 font-mono">
                            <div>Peso: <strong className="text-gray-900">{prog.peso_kg || '-'} kg</strong></div>
                            <div>Cintura: <strong className="text-gray-900">{prog.cintura_cm || '-'} cm</strong></div>
                            <div>Cadera: <strong className="text-gray-900">{prog.cadera_cm || '-'} cm</strong></div>
                            <div>Brazo: <strong className="text-gray-900">{prog.brazo_cm || '-'} cm</strong></div>
                            <div>Pierna: <strong className="text-gray-900">{prog.pierna_cm || '-'} cm</strong></div>
                            <div>% Grasa: <strong className="text-gray-900">{prog.porcentaje_grasa || '-'}%</strong></div>
                          </div>
                          {prog.notas && (
                            <p className="text-[11px] text-gray-500 italic mt-1 pt-1 border-t border-gray-50">
                              Nota: {prog.notas}
                            </p>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {drawerTab === 'congelar' && (
                <div className="space-y-4 text-xs">
                  <div className="p-4 rounded-none bg-white border border-gray-200 shadow-xs space-y-3">
                    <div className="flex items-center gap-2 text-gray-950 font-bold">
                      <Snowflake className="w-4 h-4 text-sky-600" />
                      <span>Congelar Membresía Temporalmente</span>
                    </div>
                    <p className="text-gray-500 leading-relaxed">
                      El congelamiento pausa los días y empuja automáticamente la fecha de vencimiento hacia adelante.
                    </p>

                    <div>
                      <label className="block text-gray-700 font-semibold mb-1">
                        Días a congelar:
                      </label>
                      <div className="grid grid-cols-4 gap-2">
                        {[3, 7, 15, 30].map((dias) => (
                          <button
                            key={dias}
                            type="button"
                            onClick={() => setFreezeDays(dias)}
                            className={`py-2 rounded-none font-mono font-bold border transition-all ${freezeDays === dias
                                ? 'bg-sky-50 border-sky-400 text-sky-900'
                                : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                              }`}
                          >
                            {dias} días
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="p-3 bg-gray-50 rounded-none border border-gray-200 text-gray-600">
                      Vencimiento actual: <strong className="font-mono text-gray-900">{selectedMember.suscripcion_actual?.fecha_fin || '-'}</strong>
                    </div>

                    <button
                      onClick={handleFreezeSubmit}
                      disabled={isFreezing || !selectedMember.suscripcion_actual}
                      className="w-full py-2.5 rounded-none bg-gray-950 hover:bg-black text-white font-bold shadow-xs transition-all"
                    >
                      {isFreezing ? 'Procesando...' : `Aplicar ${freezeDays} Días de Congelamiento`}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
