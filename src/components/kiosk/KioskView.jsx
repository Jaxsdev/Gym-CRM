import { createPortal } from 'react-dom';
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Search, 
  Clock, 
  Dumbbell, 
  Volume2, 
  VolumeX, 
  Send, 
  UserPlus, 
  CreditCard, 
  Ticket, 
  Users, 
  ArrowRight,
  Maximize2, 
  Minimize2, 
  Check, 
  RotateCcw,
  Sparkles,
  Calendar,
  DollarSign,
  Activity,
  Filter,
  Flame,
  Phone,
  ShieldCheck,
  AlertCircle,
  X,
  ChevronRight,
  Info,
  TrendingUp,
  Zap,
  Award
} from 'lucide-react';
import { format, differenceInCalendarDays, differenceInMinutes, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import confetti from 'canvas-confetti';
import { openWhatsApp, parseWhatsAppTemplate } from '../../lib/whatsappParser';

export default function KioskView({ 
  clientes = [], 
  onCheckIn, 
  onOpenNewSub, 
  plantillas = [], 
  onRegisterPaseDiario, 
  asistenciasHoy = [], 
  onRefresh 
}) {
  const [searchInput, setSearchInput] = useState('');
  const [receptionMode, setReceptionMode] = useState('checkin'); // 'checkin' | 'consult'
  const [suggestions, setSuggestions] = useState([]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [feedFilter, setFeedFilter] = useState('TODAS'); // 'TODAS' | 'AL_DIA' | 'POR_VENCER' | 'PASES'
  const [feedSearch, setFeedSearch] = useState('');
  const [lastRegisteredId, setLastRegisteredId] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Modal para Cobro de Pase Diario Rápido
  const [isPaseModalOpen, setIsPaseModalOpen] = useState(false);
  const [paseForm, setPaseForm] = useState({
    nombre: '',
    dni: '',
    monto: 5.00,
    metodoPago: 'EFECTIVO'
  });

  const inputRef = useRef(null);

  // Reloj digital en tiempo real (segundo a segundo)
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Mantener foco en el input para lectura de lector láser o teclado
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [result, isPaseModalOpen]);

  // Manejo de atajo de teclado: ESC para limpiar y reiniciar consola
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setResult(null);
        setSearchInput('');
        setSuggestions([]);
        if (inputRef.current) inputRef.current.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Autocompletado predictivo ultra-rápido por Nombre o DNI
  useEffect(() => {
    const query = searchInput.trim().toLowerCase();
    if (query.length >= 2) {
      const matches = clientes
        .filter(c => 
          (c.nombre_completo && c.nombre_completo.toLowerCase().includes(query)) || 
          (c.dni && c.dni.includes(query))
        )
        .slice(0, 5);
      setSuggestions(matches);
    } else {
      setSuggestions([]);
    }
  }, [searchInput, clientes]);

  // Reproductor de sonido sintético con Web Audio API de alta fidelidad
  const playChime = (type) => {
    if (!soundEnabled || typeof window === 'undefined') return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();

      if (type === 'VERDE') {
        const now = ctx.currentTime;
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(523.25, now); // C5
        osc1.frequency.exponentialRampToValueAtTime(659.25, now + 0.15); // E5

        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(659.25, now + 0.1);
        osc2.frequency.exponentialRampToValueAtTime(783.99, now + 0.28); // G5

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        osc1.start(now);
        osc2.start(now + 0.08);
        osc1.stop(now + 0.35);
        osc2.stop(now + 0.45);
      } else if (type === 'AMBAR') {
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.setValueAtTime(392, now + 0.15);

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.4);
      } else if (type === 'CAJA') {
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'square';
        osc.frequency.setValueAtTime(987.77, now); // B5
        osc.frequency.setValueAtTime(1318.51, now + 0.08); // E6

        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.3);
      } else {
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.exponentialRampToValueAtTime(164.81, now + 0.25);

        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.4);
      }
    } catch (err) {
      console.warn('Audio no disponible:', err);
    }
  };

  // Mostrar mensaje flotante de confirmación temporal
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Procesar Check-in o Consulta
  const handleProcessSubmit = async (dniToSubmit) => {
    const clean = (dniToSubmit || searchInput).trim();
    if (!clean) return;

    setLoading(true);
    setSuggestions([]);

    try {
      // Modo Consulta Express (solo mirar estado sin registrar entrada)
      if (receptionMode === 'consult') {
        const found = clientes.find(c => c.dni === clean || c.nombre_completo?.toLowerCase().includes(clean.toLowerCase()));
        if (!found) {
          setResult({
            ok: false,
            codigo: 'NO_REGISTRADA',
            nombre: clean,
            dni: clean,
            semaforo: 'ROJO',
            mensaje: 'No se encontró registro para este DNI o nombre.',
            isConsultOnly: true
          });
          playChime('ROJO');
        } else {
          const diasRestantes = found.dias_restantes ?? 15;
          const isVencida = found.estado_ciclo_vida === 'VENCIDA' || found.estado_ciclo_vida === 'LEAD_FRIO';
          const isPorVencer = found.estado_ciclo_vida === 'POR_VENCER';
          const semaforo = isVencida ? 'ROJO' : isPorVencer ? 'AMBAR' : 'VERDE';

          setResult({
            ok: !isVencida,
            codigo: found.estado_ciclo_vida,
            cliente_id: found.id,
            dni: found.dni,
            nombre: found.nombre_completo,
            telefono: found.telefono,
            plan: found.plan_actual || 'Membresía Activa',
            dias_restantes: diasRestantes,
            saldo_pendiente: found.saldo_pendiente || 0,
            semaforo,
            mensaje: isVencida 
              ? `Membresía finalizada. Registra su renovación en mostrador.`
              : isPorVencer
              ? `Membresía por vencer en pocos días. Notificar oportunamente.`
              : `Membresía vigente. Todo en orden.`,
            isConsultOnly: true
          });
          playChime(semaforo);
        }
        setSearchInput('');
        return;
      }

      // Modo Check-In Oficial
      if (onCheckIn) {
        const res = await onCheckIn(clean);
        setResult(res);

        if (res.semaforo === 'VERDE') {
          playChime('VERDE');
          confetti({ particleCount: 30, spread: 45, origin: { y: 0.6 } });
          setLastRegisteredId(res.cliente_id || res.dni);
        } else if (res.semaforo === 'AMBAR') {
          playChime('AMBAR');
          setLastRegisteredId(res.cliente_id || res.dni);
        } else {
          playChime('ROJO');
        }
      }
    } catch (e) {
      console.error(e);
      setResult({
        ok: false,
        semaforo: 'ROJO',
        mensaje: 'Error de conexión. Intenta nuevamente.'
      });
      playChime('ROJO');
    } finally {
      setLoading(false);
      setSearchInput('');
      if (onRefresh) onRefresh();
    }
  };

  const handleSelectSuggestion = (client) => {
    setSearchInput(client.dni);
    setSuggestions([]);
    handleProcessSubmit(client.dni);
  };

  // Confirmar cobro de pase diario desde modal
  const handleConfirmPaseDiario = async (e) => {
    e?.preventDefault();
    if (!onRegisterPaseDiario) return;

    setLoading(true);
    try {
      await onRegisterPaseDiario({
        nombre: paseForm.nombre.trim() || 'Visitante Pase Diario',
        dni: paseForm.dni.trim() || '',
        monto: Number(paseForm.monto) || 5.00,
        metodoPago: paseForm.metodoPago
      });

      playChime('CAJA');
      confetti({ particleCount: 40, spread: 55, origin: { y: 0.55 } });
      showToast(`¡Pase Diario registrado (S/ ${Number(paseForm.monto || 5).toFixed(2)}) vía ${paseForm.metodoPago}!`);
      setIsPaseModalOpen(false);
      setPaseForm({ nombre: '', dni: '', monto: 5.00, metodoPago: 'EFECTIVO' });
      setResult(null);

      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Error registrando pase diario:', err);
    } finally {
      setLoading(false);
    }
  };

  // Abrir modal de pase diario precargando datos si hay resultado de socia vencida/visita
  const handleOpenPaseModal = (prefill = {}) => {
    setPaseForm({
      nombre: prefill.nombre || result?.nombre || '',
      dni: prefill.dni || result?.dni || searchInput || '',
      monto: 5.00,
      metodoPago: 'EFECTIVO'
    });
    setIsPaseModalOpen(true);
  };

  const handleSendReminderWhatsApp = () => {
    if (!result) return;
    const tpl = plantillas.find(p => p.codigo_evento === 'VENCE_2_DIAS') || plantillas[0];
    const text = tpl 
      ? parseWhatsAppTemplate(tpl.contenido_plantilla, {
          nombre: result.nombre,
          plan: result.plan,
          fecha_fin: result.fecha_fin,
          dias_restantes: result.dias_restantes
        })
      : `Hola ${result.nombre}, un cordial saludo de VitalFit Gym. Te recordamos renovar tu membresía en recepción. ¡Te esperamos para entrenar!`;

    openWhatsApp(result.telefono, text);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
        setIsFullscreen(false);
      }
    }
  };

  // Estadísticas operativas de recepción en tiempo real (useMemo)
  const stats = useMemo(() => {
    const totalEntries = asistenciasHoy.length;

    // Socias con membresía regular al día registradas hoy
    const alDiaCount = asistenciasHoy.filter(a => a.alerta_mostrada === 'ACCESO_CORRECTO').length;

    // Con alerta atendidas hoy (por vencer o cuota pendiente)
    const alertas = asistenciasHoy.filter(a => 
      a.alerta_mostrada === 'ALERTA_POR_VENCER' || a.alerta_mostrada === 'ALERTA_VENCIDA' || a.alerta_mostrada === 'DEUDA'
    ).length;

    // Pases diarios cobrados en mostrador hoy
    const pases = asistenciasHoy.filter(a => a.alerta_mostrada === 'PASE_DIARIO');
    const totalPasesMonto = pases.length * 5.00;

    // Distribución por turnos de llegada de hoy
    let manana = 0; // 06:00 - 12:00
    let tarde = 0;  // 12:00 - 17:00
    let noche = 0;  // 17:00 - 22:00

    asistenciasHoy.forEach(a => {
      if (!a.fecha_hora_entrada) return;
      const h = new Date(a.fecha_hora_entrada).getHours();
      if (h < 12) manana++;
      else if (h < 17) tarde++;
      else noche++;
    });

    return {
      totalEntries,
      alDiaCount,
      alertas,
      pasesCount: pases.length,
      totalPasesMonto,
      turnos: { manana, tarde, noche }
    };
  }, [asistenciasHoy]);

  // Filtrado y búsqueda interna en el feed de hoy
  const filteredFeed = useMemo(() => {
    return asistenciasHoy.filter(item => {
      // Filtro de categoría
      if (feedFilter === 'AL_DIA' && item.alerta_mostrada !== 'ACCESO_CORRECTO') return false;
      if (feedFilter === 'POR_VENCER' && item.alerta_mostrada !== 'ALERTA_POR_VENCER') return false;
      if (feedFilter === 'PASES' && item.alerta_mostrada !== 'PASE_DIARIO') return false;

      // Filtro de búsqueda por texto
      if (feedSearch.trim()) {
        const q = feedSearch.trim().toLowerCase();
        const matchesName = (item.nombre_completo || '').toLowerCase().includes(q);
        const matchesDni = (item.dni || '').includes(q);
        const matchesPlan = (item.plan_nombre || '').toLowerCase().includes(q);
        if (!matchesName && !matchesDni && !matchesPlan) return false;
      }
      return true;
    });
  }, [asistenciasHoy, feedFilter, feedSearch]);

  const capitalizedDate = format(currentTime, "EEEE, d 'de' MMMM yyyy", { locale: es });

  return (
    <div className="space-y-6">
      {/* Toast Notification flotante superior */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-gray-950 text-white px-4 py-2.5 rounded-none border border-gray-800 shadow-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. Barra de Encabezado Principal (Enterprise Reception Header) */}
      <div className="bg-white p-4 sm:p-5 rounded-none border border-gray-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <span className="p-1.5 rounded-none bg-gray-100 text-gray-950">
              <Dumbbell className="w-4 h-4" />
            </span>
            <h1 className="text-xl font-bold text-gray-950 tracking-tight">
              Control de Acceso & Mostrador de Recepción
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-none text-[10px] font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-none bg-emerald-600 animate-pulse"></span>
              MOSTRADOR ACTIVO
            </span>
          </div>
          <p className="text-xs sm:text-sm text-gray-500">
            Valida asistencias en tiempo real, registra pases diarios y gestiona alertas de cuota desde tu pantalla.
          </p>
        </div>

        {/* Terminal Controls: Reloj en vivo, Audio y Pantalla Completa */}
        <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
          {/* Reloj Digital con Micro-segundero */}
          <div className="text-right px-3 py-1.5 rounded-none bg-gray-50 border border-gray-200">
            <div className="text-sm font-bold font-mono text-gray-950 leading-tight">
              {format(currentTime, 'hh:mm:ss a')}
            </div>
            <div className="text-[10px] text-gray-400 font-medium capitalize">
              {capitalizedDate}
            </div>
          </div>

          {/* Toggle de Sonido Sintético */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-none border text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs ${
              soundEnabled 
                ? 'bg-white border-gray-200 hover:bg-gray-50 text-gray-700' 
                : 'bg-gray-100 border-gray-200 text-gray-400'
            }`}
            title={soundEnabled ? 'Silenciar sonidos de recepción' : 'Activar sonidos de recepción'}
          >
            {soundEnabled ? (
              <>
                <Volume2 className="w-4 h-4 text-emerald-600" />
                <span className="hidden sm:inline text-[11px] font-mono">Audio On</span>
              </>
            ) : (
              <>
                <VolumeX className="w-4 h-4 text-gray-400" />
                <span className="hidden sm:inline text-[11px] font-mono">Silencio</span>
              </>
            )}
          </button>

          {/* Toggle Pantalla Completa */}
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-none border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 transition-colors shadow-xs"
            title="Pantalla completa para recepción"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* 2. Franja de Métricas Operativas de Recepción (Contiguous Strip Apollo Style) */}
      <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-gray-200 border border-gray-200 bg-white rounded-none shadow-xs overflow-hidden">
        {/* Métrica 1: Ingresos Totales Hoy */}
        <div className="p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono uppercase font-bold text-gray-500 tracking-wider block">
              Asistencias Hoy
            </span>
            <div className="text-2xl font-bold font-mono text-gray-950 mt-0.5 tracking-tight">
              {stats.totalEntries}
            </div>
            <span className="text-[11px] text-gray-400 font-sans block mt-0.5">
              Registradas en sistema
            </span>
          </div>
          <div className="w-9 h-9 rounded-none bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-700 flex-shrink-0">
            <Users className="w-4 h-4" />
          </div>
        </div>

        {/* Métrica 2: Membresías Al Día */}
        <div className="p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono uppercase font-bold text-gray-500 tracking-wider block">
              Membresías Al Día
            </span>
            <div className="text-2xl font-bold font-mono text-emerald-700 mt-0.5 tracking-tight flex items-baseline gap-1.5">
              {stats.alDiaCount}
              <span className="text-xs font-normal text-gray-400 font-sans">socias</span>
            </div>
            <span className="text-[11px] text-gray-400 font-sans block mt-0.5">
              Cuota vigente activa
            </span>
          </div>
          <div className="w-9 h-9 rounded-none bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 flex-shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>

        {/* Métrica 3: Alertas Atendidas en Mostrador */}
        <div className="p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono uppercase font-bold text-gray-500 tracking-wider block">
              Alertas Atendidas
            </span>
            <div className="text-2xl font-bold font-mono text-amber-700 mt-0.5 tracking-tight">
              {stats.alertas}
            </div>
            <span className="text-[11px] text-gray-400 font-sans block mt-0.5">
              Por vencer / regularizar
            </span>
          </div>
          <div className="w-9 h-9 rounded-none bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 flex-shrink-0">
            <AlertCircle className="w-4 h-4" />
          </div>
        </div>

        {/* Métrica 4: Pases Diarios & Recaudación Mostrador */}
        <div className="p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono uppercase font-bold text-gray-500 tracking-wider block">
              Pases Diarios
            </span>
            <div className="text-2xl font-bold font-mono text-gray-950 mt-0.5 tracking-tight flex items-baseline gap-1.5">
              {stats.pasesCount}
              <span className="text-xs font-semibold text-emerald-700 font-mono">
                (S/ {stats.totalPasesMonto.toFixed(2)})
              </span>
            </div>
            <span className="text-[11px] text-gray-400 font-sans block mt-0.5">
              Cobrados en mostrador
            </span>
          </div>
          <div className="w-9 h-9 rounded-none bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 flex-shrink-0">
            <Ticket className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* 3. Panel Central: Consola Operativa (7 cols) + Monitor en Vivo (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ========================================================= */}
        {/* COLUMNA IZQUIERDA: CONSOLA DE VALIDACIÓN & CHECK-IN (7 cols) */}
        {/* ========================================================= */}
        <div className="lg:col-span-7 space-y-4">
          {/* Card Principal: Input de Validación con Selector de Modo */}
          <div className="bg-white p-5 rounded-none border border-gray-200 shadow-xs space-y-4 relative">
            {/* Cabecera de la Consola con Selector de Modo de Operación */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-gray-100">
              <div>
                <span className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider block">
                  Consola de Ingreso
                </span>
                <h2 className="text-sm font-bold text-gray-950">
                  {receptionMode === 'checkin' ? 'Registrar Asistencia de Socia' : 'Consulta Rápida de Socia (Sin Marcación)'}
                </h2>
              </div>

              {/* Pestañas de Modo */}
              <div className="inline-flex p-0.5 bg-gray-100 rounded-none border border-gray-200">
                <button
                  type="button"
                  onClick={() => setReceptionMode('checkin')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-none transition-colors flex items-center gap-1.5 ${
                    receptionMode === 'checkin'
                      ? 'bg-white text-gray-950 shadow-xs font-bold'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Marcar Asistencia</span>
                </button>
                <button
                  type="button"
                  onClick={() => setReceptionMode('consult')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-none transition-colors flex items-center gap-1.5 ${
                    receptionMode === 'consult'
                      ? 'bg-white text-gray-950 shadow-xs font-bold'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  <Search className="w-3.5 h-3.5 text-blue-600" />
                  <span>Solo Consultar</span>
                </button>
              </div>
            </div>

            {/* Formulario de Entrada Rápida */}
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                handleProcessSubmit();
              }}
              className="space-y-2 relative"
            >
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  ref={inputRef}
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Digita DNI (8 dígitos) o escribe el Nombre de la socia..."
                  className="w-full pl-10 pr-24 py-2.5 rounded-none border border-gray-200 focus:border-gray-950 focus:ring-1 focus:ring-gray-950 text-sm font-mono font-bold text-gray-950 outline-none transition-all placeholder:font-sans placeholder:font-normal placeholder:text-gray-400"
                />

                {/* Atajo de Teclado visible */}
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  {searchInput.trim() && (
                    <button
                      type="button"
                      onClick={() => setSearchInput('')}
                      className="p-1 text-gray-400 hover:text-gray-700 rounded-none hover:bg-gray-100 mr-1"
                      title="Limpiar texto"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono text-gray-400 bg-gray-50 border border-gray-200 rounded-none">
                    Enter ↵
                  </kbd>
                </div>
              </div>

              {/* Botonera de Acción de la Consola */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    disabled={loading || !searchInput.trim()}
                    className={`px-4 py-2 rounded-none text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 ${
                      loading || !searchInput.trim()
                        ? 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'
                        : receptionMode === 'checkin'
                        ? 'bg-gray-950 hover:bg-black text-white active:scale-[0.98]'
                        : 'bg-blue-600 hover:bg-blue-700 text-white active:scale-[0.98]'
                    }`}
                  >
                    <span>
                      {loading 
                        ? 'Verificando...' 
                        : receptionMode === 'checkin' 
                        ? 'Marcar Entrada' 
                        : 'Consultar Estado'}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  {result && (
                    <button
                      type="button"
                      onClick={() => {
                        setResult(null);
                        setSearchInput('');
                        if (inputRef.current) inputRef.current.focus();
                      }}
                      className="px-3 py-2 rounded-none border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs font-semibold flex items-center gap-1 shadow-xs"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-gray-500" />
                      <span>Limpiar (Esc)</span>
                    </button>
                  )}
                </div>

                {/* Acciones Rápidas Auxiliares de Mostrador */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleOpenPaseModal()}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-none border border-gray-200 bg-white hover:bg-gray-50 text-gray-800 text-xs font-semibold shadow-xs transition-colors"
                  >
                    <Ticket className="w-3.5 h-3.5 text-blue-600" />
                    <span>Cobrar Pase Diario (S/ 5)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onOpenNewSub({ dni: searchInput })}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-none border border-gray-200 bg-white hover:bg-gray-50 text-gray-800 text-xs font-semibold shadow-xs transition-colors"
                  >
                    <UserPlus className="w-3.5 h-3.5 text-gray-600" />
                    <span className="hidden sm:inline">Inscribir</span>
                  </button>
                </div>
              </div>
            </form>

            {/* Dropdown de Sugerencias Predictivas */}
            {suggestions.length > 0 && (
              <div className="absolute left-5 right-5 top-[86px] z-30 bg-white rounded-none shadow-xl border border-gray-200 overflow-hidden divide-y divide-gray-100 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3 py-1.5 bg-gray-50 text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider flex items-center justify-between">
                  <span>Socias coincidentes ({suggestions.length})</span>
                  <span>Clic para seleccionar</span>
                </div>
                {suggestions.map((cli) => (
                  <button
                    key={cli.id}
                    type="button"
                    onClick={() => handleSelectSuggestion(cli)}
                    className="w-full px-4 py-2.5 text-left hover:bg-gray-50 flex items-center justify-between text-xs transition-colors group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-none bg-gray-100 text-gray-700 font-bold text-xs flex items-center justify-center font-mono">
                        {(cli.nombre_completo || 'S').charAt(0)}
                      </div>
                      <div>
                        <strong className="text-gray-950 font-bold block group-hover:text-blue-600 transition-colors">
                          {cli.nombre_completo}
                        </strong>
                        <span className="text-gray-400 font-mono text-[11px]">
                          DNI: {cli.dni} {cli.telefono ? `• ${cli.telefono}` : ''}
                        </span>
                      </div>
                    </div>
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-none border ${
                      cli.estado_ciclo_vida === 'ACTIVA'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : cli.estado_ciclo_vida === 'POR_VENCER'
                        ? 'bg-amber-50 text-amber-800 border-amber-200'
                        : 'bg-rose-50 text-rose-800 border-rose-200'
                    }`}>
                      {cli.estado_ciclo_vida}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* Micro-Pills de prueba rápida para agilizar pruebas del dueño */}
            <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400 flex-wrap gap-2">
              <span className="text-gray-400 font-mono text-[10px] uppercase">Pruebas rápidas:</span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleProcessSubmit('47895612')}
                  className="px-2 py-0.5 rounded-none bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 transition-colors font-mono text-[11px] font-semibold"
                >
                  47895612 (Al día)
                </button>
                <button
                  type="button"
                  onClick={() => handleProcessSubmit('72145896')}
                  className="px-2 py-0.5 rounded-none bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 transition-colors font-mono text-[11px] font-semibold"
                >
                  72145896 (Por vencer)
                </button>
                <button
                  type="button"
                  onClick={() => handleProcessSubmit('43258741')}
                  className="px-2 py-0.5 rounded-none bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100 transition-colors font-mono text-[11px] font-semibold"
                >
                  43258741 (Vencida)
                </button>
              </div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* TARJETA DINÁMICA DE VERIFICACIÓN / SEMÁFORO ("LIVE PASS") */}
          {/* ========================================================= */}
          {result ? (
            <div className={`p-5 rounded-none border shadow-xs transition-all animate-in zoom-in-95 duration-150 ${
              result.semaforo === 'VERDE'
                ? 'bg-emerald-50/40 border-emerald-200 text-emerald-950'
                : result.semaforo === 'AMBAR'
                ? 'bg-amber-50/40 border-amber-200 text-amber-950'
                : 'bg-rose-50/40 border-rose-200 text-rose-950'
            }`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="flex-shrink-0 mt-0.5">
                    {result.semaforo === 'VERDE' && (
                      <div className="w-12 h-12 rounded-none bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center justify-center shadow-xs">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                    )}
                    {result.semaforo === 'AMBAR' && (
                      <div className="w-12 h-12 rounded-none bg-amber-100 text-amber-800 border border-amber-200 flex items-center justify-center shadow-xs">
                        <AlertTriangle className="w-6 h-6" />
                      </div>
                    )}
                    {result.semaforo === 'ROJO' && (
                      <div className="w-12 h-12 rounded-none bg-rose-100 text-rose-700 border border-rose-200 flex items-center justify-center shadow-xs">
                        <XCircle className="w-6 h-6" />
                      </div>
                    )}
                  </div>

                  <div>
                    {/* Header de Estado */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[10px] font-bold font-mono uppercase px-2 py-0.5 rounded-none border ${
                        result.semaforo === 'VERDE'
                          ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                          : result.semaforo === 'AMBAR'
                          ? 'bg-amber-100 text-amber-900 border-amber-300'
                          : 'bg-rose-100 text-rose-900 border-rose-300'
                      }`}>
                        {result.isConsultOnly ? '🔍 Consulta Realizada' : result.semaforo === 'VERDE' ? '🟢 Acceso Autorizado' : result.semaforo === 'AMBAR' ? '🟡 Atención / Por Vencer' : '🔴 Acceso Denegado'}
                      </span>

                      {result.codigo && (
                        <span className="text-[10px] font-mono text-gray-500 bg-white/80 border border-gray-200 px-1.5 py-0.5 rounded-none">
                          ESTADO: {result.codigo}
                        </span>
                      )}
                    </div>

                    {/* Nombre y DNI */}
                    {result.nombre && (
                      <h3 className="text-xl font-bold text-gray-950 tracking-tight mt-1.5">
                        {result.nombre}
                      </h3>
                    )}

                    <div className="text-xs font-mono font-medium text-gray-600 mt-0.5 flex items-center gap-2 flex-wrap">
                      {result.dni && <span>DNI: {result.dni}</span>}
                      {result.telefono && <span>• Tel: {result.telefono}</span>}
                      {result.plan && (
                        <span className="font-bold text-gray-950 bg-white/70 px-1.5 py-0.5 rounded-none border border-gray-200">
                          {result.plan}
                        </span>
                      )}
                    </div>

                    {/* Mensaje Informativo */}
                    <p className="text-xs font-medium text-gray-800 mt-2 leading-relaxed">
                      {result.mensaje}
                    </p>

                    {/* Cuenta regresiva de días restantes si aplica */}
                    {result.dias_restantes !== undefined && result.dias_restantes >= 0 && (
                      <div className="mt-2.5 flex items-center gap-2">
                        <div className="text-[11px] font-mono font-semibold text-gray-600">
                          Vigencia de Membresía:
                        </div>
                        <div className="flex items-center gap-1.5 text-xs font-mono font-bold">
                          <span className={`px-2 py-0.5 rounded-none ${
                            result.dias_restantes > 3
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-900'
                          }`}>
                            {result.dias_restantes === 0 ? 'Vence Hoy' : `Quedan ${result.dias_restantes} día(s)`}
                          </span>
                          {result.fecha_fin && (
                            <span className="text-gray-400 font-normal">
                              (Vence: {result.fecha_fin})
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Deuda / Saldo Pendiente */}
                    {Number(result.saldo_pendiente) > 0 && (
                      <div className="mt-2.5 text-xs font-mono font-bold text-amber-900 bg-amber-100 border border-amber-300 px-3 py-1.5 rounded-none flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-700 flex-shrink-0" />
                        <span>Socia con saldo pendiente de pago: S/ {Number(result.saldo_pendiente).toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Botón Cerrar Resultado */}
                <button
                  onClick={() => setResult(null)}
                  className="text-xs text-gray-400 hover:text-gray-700 p-1.5 rounded-none hover:bg-gray-100 transition-colors"
                  title="Cerrar ficha (Esc)"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Botonera de Acciones Inmediatas de Mostrador */}
              <div className="mt-4 pt-3 border-t border-gray-200/80 flex flex-wrap items-center gap-2">
                {/* Renovar Membresía */}
                {(result.semaforo === 'AMBAR' || result.semaforo === 'ROJO') && (
                  <button
                    onClick={() => {
                      const clientObj = clientes.find(c => c.dni === result.dni) || {
                        dni: result.dni,
                        nombre_completo: result.nombre,
                        telefono: result.telefono
                      };
                      onOpenNewSub(clientObj);
                      setResult(null);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-none bg-gray-950 hover:bg-black text-white text-xs font-semibold shadow-xs transition-all active:scale-[0.98]"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>Renovar Membresía</span>
                  </button>
                )}

                {/* Inscribir Socia si no está registrada */}
                {result.codigo === 'NO_REGISTRADA' && (
                  <button
                    onClick={() => {
                      onOpenNewSub({ dni: result.dni || searchInput || '' });
                      setResult(null);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-none bg-gray-950 hover:bg-black text-white text-xs font-semibold shadow-xs transition-all"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Inscribir Nueva Socia</span>
                  </button>
                )}

                {/* Cobrar Pase Diario de Emergencia */}
                {result.semaforo === 'ROJO' && (
                  <button
                    onClick={() => handleOpenPaseModal({ nombre: result.nombre, dni: result.dni })}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-none bg-white border border-gray-200 hover:bg-gray-50 text-gray-800 text-xs font-semibold shadow-xs transition-all"
                  >
                    <Ticket className="w-3.5 h-3.5 text-blue-600" />
                    <span>Cobrar Pase Diario (S/ 5)</span>
                  </button>
                )}

                {/* Enviar WhatsApp de Notificación */}
                {result.telefono && (
                  <button
                    onClick={handleSendReminderWhatsApp}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-none bg-[#166534] hover:bg-[#14532D] text-white text-xs font-semibold shadow-xs transition-all"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Enviar WhatsApp Oficial</span>
                  </button>
                )}

                {/* Botón Siguiente Socia */}
                <button
                  onClick={() => {
                    setResult(null);
                    setSearchInput('');
                    if (inputRef.current) inputRef.current.focus();
                  }}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-none border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 text-xs font-semibold shadow-xs transition-all ml-auto"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Siguiente (Esc)</span>
                </button>
              </div>
            </div>
          ) : (
            /* Tarjeta Informativa en Reposo cuando no hay búsqueda activa */
            <div className="bg-white p-5 rounded-none border border-dashed border-gray-200 text-center py-8">
              <div className="w-10 h-10 rounded-none bg-gray-100 text-gray-500 flex items-center justify-center mx-auto mb-2.5">
                <ShieldCheck className="w-5 h-5 text-gray-600" />
              </div>
              <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                Consola Lista para Validar
              </h3>
              <p className="text-xs text-gray-500 max-w-md mx-auto mt-1">
                Usa el lector de código de barras o escribe el DNI de la socia. El sistema validará su vigencia y registrará su entrada automáticamente.
              </p>
              <div className="mt-4 flex items-center justify-center gap-4 text-[11px] font-mono text-gray-400">
                <span>[Enter] Confirmar</span>
                <span>•</span>
                <span>[Esc] Limpiar</span>
                <span>•</span>
                <span>Soporta Pistola Láser</span>
              </div>
            </div>
          )}
        </div>

        {/* ========================================================= */}
        {/* COLUMNA DERECHA: MONITOR EN VIVO & HISTORIAL DE HOY (5 cols) */}
        {/* ========================================================= */}
        <div className="lg:col-span-5 bg-white p-5 rounded-none border border-gray-200 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            {/* Header del Feed en Vivo */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-500" />
                <h2 className="text-xs font-bold text-gray-950 uppercase tracking-wider">
                  Ingresos en Vivo de Hoy
                </h2>
              </div>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-none bg-gray-100 text-gray-800 border border-gray-200">
                {asistenciasHoy.length} registrados
              </span>
            </div>

            {/* Sub-Buscador y Filtros de Pestaña */}
            <div className="space-y-2 mb-3">
              {/* Buscador dentro del historial de hoy */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={feedSearch}
                  onChange={(e) => setFeedSearch(e.target.value)}
                  placeholder="Filtrar por nombre o DNI en la lista de hoy..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-none border border-gray-200 text-xs text-gray-900 outline-none focus:border-gray-950"
                />
                {feedSearch && (
                  <button
                    onClick={() => setFeedSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Filtros de Pestaña compactos */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1 text-xs">
                <button
                  type="button"
                  onClick={() => setFeedFilter('TODAS')}
                  className={`px-2 py-1 rounded-none text-[11px] font-semibold transition-colors flex items-center gap-1 ${
                    feedFilter === 'TODAS'
                      ? 'bg-gray-950 text-white font-bold'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Todas ({asistenciasHoy.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFeedFilter('AL_DIA')}
                  className={`px-2 py-1 rounded-none text-[11px] font-semibold transition-colors ${
                    feedFilter === 'AL_DIA'
                      ? 'bg-emerald-800 text-white font-bold'
                      : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
                  }`}
                >
                  Al Día
                </button>
                <button
                  type="button"
                  onClick={() => setFeedFilter('POR_VENCER')}
                  className={`px-2 py-1 rounded-none text-[11px] font-semibold transition-colors ${
                    feedFilter === 'POR_VENCER'
                      ? 'bg-amber-800 text-white font-bold'
                      : 'bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-200'
                  }`}
                >
                  Con Alerta
                </button>
                <button
                  type="button"
                  onClick={() => setFeedFilter('PASES')}
                  className={`px-2 py-1 rounded-none text-[11px] font-semibold transition-colors ${
                    feedFilter === 'PASES'
                      ? 'bg-blue-800 text-white font-bold'
                      : 'bg-blue-50 text-blue-900 hover:bg-blue-100 border border-blue-200'
                  }`}
                >
                  Pases Diarios
                </button>
              </div>
            </div>

            {/* Mini Indicador de Concurrencia por Turno (Dinámico) */}
            <div className="p-2.5 rounded-none bg-gray-50 border border-gray-200 mb-3">
              <div className="flex items-center justify-between text-[10px] font-mono font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                <span>Distribución por Turno Hoy:</span>
                <span className="text-gray-700 font-sans">
                  {stats.turnos.noche >= stats.turnos.tarde && stats.turnos.noche >= stats.turnos.manana
                    ? '🌙 Turno Noche con mayor afluencia'
                    : stats.turnos.tarde >= stats.turnos.manana
                    ? '☀️ Turno Tarde activo'
                    : '🌅 Turno Mañana'}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="bg-white p-1.5 rounded-none border border-gray-200">
                  <span className="text-[10px] text-gray-400 block font-mono">Mañana</span>
                  <span className="font-bold text-gray-900 font-mono">{stats.turnos.manana}</span>
                </div>
                <div className="bg-white p-1.5 rounded-none border border-gray-200">
                  <span className="text-[10px] text-gray-400 block font-mono">Tarde</span>
                  <span className="font-bold text-gray-900 font-mono">{stats.turnos.tarde}</span>
                </div>
                <div className="bg-white p-1.5 rounded-none border border-gray-200">
                  <span className="text-[10px] text-gray-400 block font-mono">Noche</span>
                  <span className="font-bold text-gray-900 font-mono">{stats.turnos.noche}</span>
                </div>
              </div>
            </div>

            {/* Listado de Entradas Scrolleable estilo Apollo */}
            <div className="space-y-1.5 max-h-[380px] overflow-y-auto pr-1 divide-y divide-gray-100">
              {filteredFeed.length === 0 ? (
                <div className="text-center py-12 text-gray-400 text-xs">
                  {feedSearch 
                    ? `No se encontraron coincidencias para "${feedSearch}".`
                    : 'Aún no se han registrado ingresos en esta categoría hoy.'}
                </div>
              ) : (
                filteredFeed.map((item, idx) => {
                  const isNew = item.cliente_id === lastRegisteredId || idx === 0;
                  return (
                    <div
                      key={item.id || idx}
                      className={`pt-2 first:pt-0 pb-1.5 rounded-none px-2.5 transition-all flex items-center justify-between text-xs ${
                        isNew ? 'bg-emerald-50/40 border border-emerald-200/60' : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        <div className={`w-7 h-7 rounded-none flex items-center justify-center font-bold text-xs flex-shrink-0 font-mono ${
                          item.alerta_mostrada === 'ACCESO_CORRECTO'
                            ? 'bg-emerald-100 text-emerald-800'
                            : item.alerta_mostrada === 'ALERTA_POR_VENCER'
                            ? 'bg-amber-100 text-amber-900'
                            : item.alerta_mostrada === 'PASE_DIARIO'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}>
                          {(item.nombre_completo || 'S').charAt(0)}
                        </div>

                        <div className="overflow-hidden">
                          <div className="font-semibold text-gray-950 truncate flex items-center gap-1.5">
                            <span>{item.nombre_completo}</span>
                            {isNew && (
                              <span className="text-[9px] font-mono font-bold px-1 rounded-none bg-emerald-600 text-white uppercase">
                                Nuevo
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-gray-400 font-mono mt-0.5 flex items-center gap-1.5">
                            <span className="text-gray-900 font-bold">
                              {item.fecha_hora_entrada ? format(new Date(item.fecha_hora_entrada), 'hh:mm a') : 'Hoy'}
                            </span>
                            <span>•</span>
                            <span className="text-gray-600 truncate">{item.plan_nombre}</span>
                            {item.dni && <span className="hidden sm:inline text-gray-400">({item.dni})</span>}
                          </div>
                        </div>
                      </div>

                      {/* Tag de Estado y Acción Rápida */}
                      <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-mono font-semibold px-2 py-0.5 rounded-none border ${
                          item.alerta_mostrada === 'ACCESO_CORRECTO'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : item.alerta_mostrada === 'ALERTA_POR_VENCER'
                            ? 'bg-amber-50 text-amber-900 border-amber-200'
                            : item.alerta_mostrada === 'PASE_DIARIO'
                            ? 'bg-blue-50 text-blue-800 border-blue-200'
                            : 'bg-rose-50 text-rose-800 border-rose-200'
                        }`}>
                          <span className="w-1.5 h-1.5 rounded-none bg-current"></span>
                          {item.alerta_mostrada === 'ACCESO_CORRECTO' 
                            ? 'Al día' 
                            : item.alerta_mostrada === 'ALERTA_POR_VENCER' 
                            ? 'Por Vencer' 
                            : item.alerta_mostrada === 'PASE_DIARIO' 
                            ? 'Pase Diario' 
                            : 'Alerta'}
                        </span>

                        {item.telefono && (
                          <button
                            type="button"
                            onClick={() => openWhatsApp(item.telefono, `Hola ${item.nombre_completo}, esperamos que tengas un gran entrenamiento hoy en VitalFit Gym!`)}
                            className="p-1 rounded-none text-[#166534] hover:bg-emerald-50 border border-transparent hover:border-emerald-200 transition-colors"
                            title="Enviar saludo por WhatsApp"
                          >
                            <Send className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Footer del Monitor: Cobro Express de Pase Diario */}
          <div className="pt-3 border-t border-gray-100">
            <button
              onClick={() => handleOpenPaseModal()}
              className="w-full py-2.5 px-3 rounded-none border border-gray-200 hover:border-gray-950 bg-gray-50 hover:bg-white text-gray-900 text-xs font-semibold flex items-center justify-between transition-all shadow-xs group"
            >
              <div className="flex items-center gap-2">
                <Ticket className="w-4 h-4 text-blue-600 group-hover:scale-110 transition-transform" />
                <span>Cobro Rápido de Pase Diario Libre</span>
              </div>
              <span className="font-mono font-bold text-gray-950 bg-white group-hover:bg-gray-100 px-2 py-0.5 rounded-none border border-gray-200">
                S/ 5.00
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 4. MODAL PROFESIONAL: COBRO DE PASE DIARIO EXPRESS */}
      {/* ========================================================= */}
      {isPaseModalOpen && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-none border border-gray-200 shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-none bg-blue-50 text-blue-700 border border-blue-200">
                  <Ticket className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-gray-950">
                    Cobro de Pase Diario de Entrenamiento
                  </h3>
                  <span className="text-[11px] text-gray-400 font-mono">
                    Registra el ingreso en caja y la asistencia de hoy
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsPaseModalOpen(false)}
                className="text-gray-400 hover:text-gray-700 p-1 rounded-none hover:bg-gray-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleConfirmPaseDiario} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Nombre del Visitante / Cliente
                </label>
                <input
                  type="text"
                  required
                  value={paseForm.nombre}
                  onChange={(e) => setPaseForm({ ...paseForm, nombre: e.target.value })}
                  placeholder="Ej: Luciana Morales (o visitante)"
                  className="w-full px-3 py-2 rounded-none border border-gray-200 text-xs text-gray-900 outline-none focus:border-gray-950 font-medium"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  DNI (Opcional para registro)
                </label>
                <input
                  type="text"
                  maxLength={8}
                  value={paseForm.dni}
                  onChange={(e) => setPaseForm({ ...paseForm, dni: e.target.value })}
                  placeholder="8 dígitos de DNI"
                  className="w-full px-3 py-2 rounded-none border border-gray-200 text-xs font-mono text-gray-900 outline-none focus:border-gray-950"
                />
              </div>

              {/* Selector de Monto */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Tarifa de Pase Diario (S/)
                </label>
                <div className="grid grid-cols-3 gap-2 mb-2">
                  {[5.00, 7.00, 10.00].map((tarifa) => (
                    <button
                      key={tarifa}
                      type="button"
                      onClick={() => setPaseForm({ ...paseForm, monto: tarifa })}
                      className={`py-1.5 text-xs font-mono font-bold rounded-none border transition-all ${
                        Number(paseForm.monto) === tarifa
                          ? 'bg-gray-950 text-white border-gray-950 shadow-xs'
                          : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      S/ {tarifa.toFixed(2)}
                    </button>
                  ))}
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono text-gray-400">S/</span>
                  <input
                    type="number"
                    step="0.50"
                    min="1"
                    value={paseForm.monto}
                    onChange={(e) => setPaseForm({ ...paseForm, monto: e.target.value })}
                    className="w-full pl-8 pr-3 py-1.5 rounded-none border border-gray-200 text-xs font-mono font-bold text-gray-900 outline-none focus:border-gray-950"
                  />
                </div>
              </div>

              {/* Método de Pago */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Método de Pago
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {['EFECTIVO', 'YAPE', 'PLIN', 'TARJETA'].map((metodo) => (
                    <button
                      key={metodo}
                      type="button"
                      onClick={() => setPaseForm({ ...paseForm, metodoPago: metodo })}
                      className={`py-1.5 text-[11px] font-mono font-bold rounded-none border transition-all ${
                        paseForm.metodoPago === metodo
                          ? 'bg-gray-950 text-white border-gray-950 shadow-xs'
                          : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {metodo}
                    </button>
                  ))}
                </div>
              </div>

              {/* Botones del Modal */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsPaseModalOpen(false)}
                  className="px-3.5 py-2 rounded-none border border-gray-200 text-gray-700 text-xs font-semibold hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 rounded-none bg-gray-950 hover:bg-black text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 active:scale-[0.98]"
                >
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Confirmar e Ingresar (S/ {Number(paseForm.monto || 5).toFixed(2)})</span>
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
