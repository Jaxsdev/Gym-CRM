import { createClient } from '@supabase/supabase-js';
import { format, addDays, differenceInCalendarDays, subDays, isSameDay } from 'date-fns';

// 1. Lectura de Variables de Entorno (Compatible con Vite y Node Test Runner)
const env = (typeof import.meta !== 'undefined' && import.meta.env) 
  ? import.meta.env 
  : (typeof process !== 'undefined' && process.env ? process.env : {});

const supabaseUrl = env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = () => {
  return Boolean(
    supabaseUrl && 
    supabaseAnonKey && 
    supabaseUrl.startsWith('https://') && 
    !supabaseUrl.includes('tu-proyecto-aqui') &&
    !supabaseUrl.includes('xyzcompany')
  );
};

// 2. Creación del Cliente Supabase
export const supabase = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// ==============================================================================
// 3. DATOS SEMILLA LOCALES (Para demo instantánea y fallback de alta fidelidad)
// ==============================================================================
const STORAGE_KEY = 'gym_crm_local_db_v1';

const getInitialSeedData = () => {
  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');
  const minus10 = format(subDays(today, 10), 'yyyy-MM-dd');
  const plus20 = format(addDays(today, 20), 'yyyy-MM-dd');
  const minus28 = format(subDays(today, 28), 'yyyy-MM-dd');
  const plus2 = format(addDays(today, 2), 'yyyy-MM-dd');
  const minus40 = format(subDays(today, 40), 'yyyy-MM-dd');
  const plus50 = format(addDays(today, 50), 'yyyy-MM-dd');
  const minus29 = format(subDays(today, 29), 'yyyy-MM-dd');
  const plus1 = format(addDays(today, 1), 'yyyy-MM-dd');
  const minus50 = format(subDays(today, 50), 'yyyy-MM-dd');
  const minus20 = format(subDays(today, 20), 'yyyy-MM-dd');

  return {
    planes: [
      {
        id: 'plan-1',
        nombre: 'Plan Mensual',
        duracion_dias: 30,
        precio: 40.00,
        servicios_incluidos: [
          'Acceso libre a sala de máquinas',
          'Zona cardiovascular',
          'Casilleros y vestidores',
          'Rutina introductoria personalizada'
        ],
        dias_congelamiento_permitidos: 0,
        es_promocion: false,
        activo: true
      },
      {
        id: 'plan-2',
        nombre: 'Plan Trimestral',
        duracion_dias: 90,
        precio: 60.00,
        servicios_incluidos: [
          'Acceso total a máquinas y pesas',
          'Clases grupales (Baile / Funcional)',
          '1 Asesoría de nutrición',
          '3 días de congelamiento libre'
        ],
        dias_congelamiento_permitidos: 3,
        es_promocion: false,
        activo: true
      },
      {
        id: 'plan-3',
        nombre: 'Plan Semestral',
        duracion_dias: 180,
        precio: 100.00,
        servicios_incluidos: [
          'Acceso libre Full Time',
          'Clases grupales ilimitadas',
          'Evaluación y control mensual de medidas',
          '7 días de congelamiento libre'
        ],
        dias_congelamiento_permitidos: 7,
        es_promocion: false,
        activo: true
      },
      {
        id: 'plan-4',
        nombre: 'Plan Anual VIP',
        duracion_dias: 365,
        precio: 150.00,
        servicios_incluidos: [
          'Acceso VIP Total 365 días',
          'Todas las clases y talleres',
          'Evaluación corporal bimestral',
          '15 días de congelamiento libre',
          '1 Pase de cortesía mensual para invitada'
        ],
        dias_congelamiento_permitidos: 15,
        es_promocion: false,
        activo: true
      },
      {
        id: 'plan-5',
        nombre: 'Promo Retorno Flash (Leads Fríos)',
        duracion_dias: 90,
        precio: 50.00,
        servicios_incluidos: [
          'Reactivación con matrícula 100% gratis',
          'Acceso total a máquinas y cardio',
          'Clases grupales incluidas',
          'Rutina express de re-adaptación'
        ],
        dias_congelamiento_permitidos: 0,
        es_promocion: true,
        activo: true
      }
    ],
    plantillas: [
      {
        id: 'tpl-1',
        codigo_evento: 'BIENVENIDA_SUSCRIPCION',
        titulo_panel: 'Bienvenida / Activación de Membresía',
        contenido_plantilla: '¡Hola {nombre}! 🏋️‍♀️✨ ¡Bienvenida oficial a nuestro Gimnasio! Tu {plan} ha sido activado con éxito desde el {fecha_inicio} hasta el {fecha_fin}. Incluye: {servicios}. Recuerda ingresar digitando tu DNI ({dni}) en la pantalla de recepción. ¡Estamos listas para acompañarte a cumplir tus metas! 💪🔥'
      },
      {
        id: 'tpl-2',
        codigo_evento: 'VENCE_3_DIAS',
        titulo_panel: 'Aviso Preventivo: Faltan 3 Días',
        contenido_plantilla: '¡Hola {nombre}! Esperamos que estés teniendo una excelente semana 🌟 Te recordamos que a tu {plan} le quedan solo {dias_restantes} días (vence el {fecha_fin}). ¡Renueva hoy mismo en recepción o por Yape/Plin para no perder tu ritmo de entrenamiento ni tu tarifa! 🏋️‍♀️✨'
      },
      {
        id: 'tpl-3',
        codigo_evento: 'VENCE_2_DIAS',
        titulo_panel: 'Aviso: Faltan 2 Días / Mañana',
        contenido_plantilla: '¡Hola {nombre}! 👋 Tu membresía ({plan}) está por culminar en {dias_restantes} días ({fecha_fin}). Mantén tu hábito y no dejes enfriar tu progreso. Acércate hoy a recepción para asegurar tu renovación con tu tarifa preferencial. ¡Tu bienestar es prioridad! 💛'
      },
      {
        id: 'tpl-4',
        codigo_evento: 'VENCE_HOY',
        titulo_panel: 'Aviso Urgente: Vence Hoy (Último Día)',
        contenido_plantilla: '¡Atención {nombre}! ⚠️ ¡Hoy {fecha_fin} es el último día de tu {plan}! Queremos que continúes firme y no pierdas ni un solo día de tus metas. Pasa hoy por recepción o respóndenos por aquí para renovar al instante por Yape/Plin. ¡No te detengas! 🚀💥'
      },
      {
        id: 'tpl-5',
        codigo_evento: 'MEMBRESIA_VENCIDA',
        titulo_panel: 'Membresía Vencida (Invitación a Renovar)',
        contenido_plantilla: '¡Hola {nombre}! Notamos que tu membresía culminó el {fecha_fin}. Sabemos lo ocupadas que pueden ser las semanas, pero tu salud y energía merecen ese espacio. Te tenemos reservada tu vacante con beneficio especial si renuevas esta semana. ¿Cuándo vienes a entrenar? 💪😊'
      },
      {
        id: 'tpl-6',
        codigo_evento: 'AUSENCIA_3_5_DIAS',
        titulo_panel: 'Alerta Retención: Te Extrañamos (3 a 5+ Días Ausente)',
        contenido_plantilla: '¡Hola {nombre}! 💛 Te extrañamos mucho en el gimnasio, hace {dias_sin_asistir} días que no te vemos por aquí. ¿Todo bien con tu rutina? Recuerda que la constancia es el verdadero secreto. ¡Tu espacio y tu energía hacen falta en la sala! Vente hoy aunque sea 40 minutos a moverte 🏋️‍♀️✨'
      },
      {
        id: 'tpl-7',
        codigo_evento: 'PROMOCION_LEAD_FRIO',
        titulo_panel: 'Oferta Especial de Reactivación (Leads Fríos)',
        contenido_plantilla: '¡Hola {nombre}! 👋 Tenemos una gran noticia para ti: ¡Queremos verte de regreso entrenando! Te habilitamos la promoción exclusiva: *{promo_nombre}* a solo *S/ {promo_precio}*. Incluye: {servicios}. Promoción válida por pocos cupos. ¿Te reservamos el tuyo hoy mismo? 🎁🔥'
      }
    ],
    clientes: [
      {
        id: 'cli-1',
        dni: '47895612',
        nombre_completo: 'Luciana Paredes Vega',
        telefono: '51994512300',
        fecha_nacimiento: '1995-04-12',
        contacto_emergencia: 'Carlos Paredes (Hermano) - 987654321',
        observaciones_medicas: 'Sin restricciones. Ninguna lesión.',
        ultima_asistencia: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
        estado_ciclo_vida: 'ACTIVA',
        intentos_recuperacion: 0,
        created_at: new Date(Date.now() - 60 * 86400 * 1000).toISOString()
      },
      {
        id: 'cli-2',
        dni: '72145896',
        nombre_completo: 'Valeria Ramos Montes',
        telefono: '51982145780',
        fecha_nacimiento: '1998-08-23',
        contacto_emergencia: 'Rosa Montes (Mamá) - 984512789',
        observaciones_medicas: 'Tendinitis leve en rodilla derecha.',
        ultima_asistencia: new Date(Date.now() - 1 * 86400 * 1000).toISOString(),
        estado_ciclo_vida: 'POR_VENCER',
        intentos_recuperacion: 0,
        created_at: new Date(Date.now() - 30 * 86400 * 1000).toISOString()
      },
      {
        id: 'cli-3',
        dni: '45127896',
        nombre_completo: 'Camila Flores Salazar',
        telefono: '51976543210',
        fecha_nacimiento: '1992-11-05',
        contacto_emergencia: 'Jorge Flores (Esposo) - 974125896',
        observaciones_medicas: 'Hipertensión controlada.',
        ultima_asistencia: new Date(Date.now() - 4 * 86400 * 1000).toISOString(),
        estado_ciclo_vida: 'EN_RIESGO_AUSENCIA',
        intentos_recuperacion: 1,
        created_at: new Date(Date.now() - 45 * 86400 * 1000).toISOString()
      },
      {
        id: 'cli-4',
        dni: '70985412',
        nombre_completo: 'Andrea Morales Castro',
        telefono: '51987456123',
        fecha_nacimiento: '2000-02-14',
        contacto_emergencia: 'Elena Castro - 991245789',
        observaciones_medicas: 'Ninguna.',
        ultima_asistencia: new Date(Date.now() - 5 * 86400 * 1000).toISOString(),
        estado_ciclo_vida: 'EN_RIESGO_AUSENCIA',
        intentos_recuperacion: 2,
        created_at: new Date(Date.now() - 35 * 86400 * 1000).toISOString()
      },
      {
        id: 'cli-5',
        dni: '43258741',
        nombre_completo: 'Mariana Silva Quispe',
        telefono: '51963258741',
        fecha_nacimiento: '1990-09-30',
        contacto_emergencia: 'Manuel Silva - 963147852',
        observaciones_medicas: 'Lumbalgia ocasional.',
        ultima_asistencia: new Date(Date.now() - 22 * 86400 * 1000).toISOString(),
        estado_ciclo_vida: 'LEAD_FRIO',
        intentos_recuperacion: 3,
        created_at: new Date(Date.now() - 90 * 86400 * 1000).toISOString()
      },
      {
        id: 'cli-6',
        dni: '48963214',
        nombre_completo: 'Daniela Gómez Mendoza',
        telefono: '51951478963',
        fecha_nacimiento: '1996-06-18',
        contacto_emergencia: 'Carla Gómez - 958741236',
        observaciones_medicas: 'Asma controlada.',
        ultima_asistencia: new Date(Date.now() - 35 * 86400 * 1000).toISOString(),
        estado_ciclo_vida: 'LEAD_FRIO',
        intentos_recuperacion: 4,
        created_at: new Date(Date.now() - 120 * 86400 * 1000).toISOString()
      }
    ],
    suscripciones: [
      {
        id: 'sub-1',
        cliente_id: 'cli-1',
        plan_id: 'plan-2',
        fecha_inicio: minus10,
        fecha_fin: plus20,
        precio_pactado: 60.00,
        monto_pagado: 60.00,
        saldo_pendiente: 0.00,
        metodo_pago: 'YAPE',
        dias_congelados_usados: 0,
        estado: 'ACTIVA',
        whatsapp_bienvenida_confirmado: true,
        created_at: minus10
      },
      {
        id: 'sub-2',
        cliente_id: 'cli-2',
        plan_id: 'plan-1',
        fecha_inicio: minus28,
        fecha_fin: plus2, // Vence en 2 días!
        precio_pactado: 40.00,
        monto_pagado: 40.00,
        saldo_pendiente: 0.00,
        metodo_pago: 'PLIN',
        dias_congelados_usados: 0,
        estado: 'ACTIVA',
        whatsapp_bienvenida_confirmado: true,
        created_at: minus28
      },
      {
        id: 'sub-3',
        cliente_id: 'cli-3',
        plan_id: 'plan-3',
        fecha_inicio: minus40,
        fecha_fin: plus50, // Activa pero ausente hace 4 días!
        precio_pactado: 100.00,
        monto_pagado: 100.00,
        saldo_pendiente: 0.00,
        metodo_pago: 'EFECTIVO',
        dias_congelados_usados: 0,
        estado: 'ACTIVA',
        whatsapp_bienvenida_confirmado: true,
        created_at: minus40
      },
      {
        id: 'sub-4',
        cliente_id: 'cli-4',
        plan_id: 'plan-1',
        fecha_inicio: minus29,
        fecha_fin: plus1, // Vence mañana y ausente hace 5 días!
        precio_pactado: 40.00,
        monto_pagado: 30.00,
        saldo_pendiente: 10.00,
        metodo_pago: 'YAPE',
        dias_congelados_usados: 0,
        estado: 'ACTIVA',
        whatsapp_bienvenida_confirmado: true,
        created_at: minus29
      },
      {
        id: 'sub-5',
        cliente_id: 'cli-5',
        plan_id: 'plan-1',
        fecha_inicio: minus50,
        fecha_fin: minus20, // Vencida hace 20 días -> Lead Frío!
        precio_pactado: 40.00,
        monto_pagado: 40.00,
        saldo_pendiente: 0.00,
        metodo_pago: 'EFECTIVO',
        dias_congelados_usados: 0,
        estado: 'VENCIDA',
        whatsapp_bienvenida_confirmado: true,
        created_at: minus50
      }
    ],
    asistencias: [
      {
        id: 'att-1',
        cliente_id: 'cli-1',
        suscripcion_id: 'sub-1',
        fecha_hora_entrada: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
        alerta_mostrada: 'ACCESO_CORRECTO'
      },
      {
        id: 'att-2',
        cliente_id: 'cli-2',
        suscripcion_id: 'sub-2',
        fecha_hora_entrada: new Date(Date.now() - 26 * 3600 * 1000).toISOString(),
        alerta_mostrada: 'ALERTA_POR_VENCER'
      }
    ],
    notificaciones_log: [
      {
        id: 'log-1',
        cliente_id: 'cli-3',
        tipo_evento: 'AUSENCIA_3_5_DIAS',
        mensaje_enviado: '¡Hola Camila! 💛 Te extrañamos mucho...',
        confirmado_entregado: true,
        fecha_envio: new Date(Date.now() - 24 * 3600 * 1000).toISOString()
      }
    ],
    progreso_fisico: [
      {
        id: 'prog-1',
        cliente_id: 'cli-1',
        fecha_registro: format(subDays(today, 30), 'yyyy-MM-dd'),
        peso_kg: 62.5,
        cintura_cm: 72,
        cadera_cm: 98,
        brazo_cm: 27,
        pierna_cm: 54,
        porcentaje_grasa: 24.5,
        notas: 'Inicio de plan. Muy motivada.'
      },
      {
        id: 'prog-2',
        cliente_id: 'cli-1',
        fecha_registro: todayStr,
        peso_kg: 60.8,
        cintura_cm: 69.5,
        cadera_cm: 96,
        brazo_cm: 26.5,
        pierna_cm: 53.5,
        porcentaje_grasa: 22.8,
        notas: 'Excelente evolución. Reducción de 2.5cm de cintura.'
      }
    ],
    caja_movimientos: [
      {
        id: 'caja-1',
        fecha_hora: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
        tipo_movimiento: 'INGRESO',
        concepto: 'Renovación Plan Trimestral (Luciana Paredes)',
        monto: 60.00,
        metodo_pago: 'YAPE'
      },
      {
        id: 'caja-2',
        fecha_hora: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
        tipo_movimiento: 'INGRESO',
        concepto: 'Agua Mineral San Luis 625ml',
        monto: 2.00,
        metodo_pago: 'EFECTIVO'
      },
      {
        id: 'caja-3',
        fecha_hora: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
        tipo_movimiento: 'INGRESO',
        concepto: 'Rehidratante Sporade 500ml',
        monto: 5.00,
        metodo_pago: 'PLIN'
      },
      {
        id: 'caja-4',
        fecha_hora: new Date(Date.now() - 1 * 3600 * 1000).toISOString(),
        tipo_movimiento: 'INGRESO',
        concepto: 'Batido de Proteína Whey Isolate',
        monto: 8.00,
        metodo_pago: 'YAPE'
      },
      {
        id: 'caja-5',
        fecha_hora: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        tipo_movimiento: 'INGRESO',
        concepto: 'Pase Diario de Entrenamiento',
        monto: 5.00,
        metodo_pago: 'EFECTIVO'
      }
    ]
  };
};

export const getLocalDB = () => {
  try {
    const storage = typeof window !== 'undefined' ? window.localStorage : (typeof globalThis !== 'undefined' ? globalThis.localStorage : null);
    if (!storage) return getInitialSeedData();
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial = getInitialSeedData();
      storage.setItem(STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error leyendo Local DB:', e);
    return getInitialSeedData();
  }
};

const localBroadcast = typeof window !== 'undefined' && 'BroadcastChannel' in window
  ? new BroadcastChannel('gym_crm_realtime_bus')
  : null;

export const saveLocalDB = (data) => {
  try {
    const storage = typeof window !== 'undefined' ? window.localStorage : (typeof globalThis !== 'undefined' ? globalThis.localStorage : null);
    if (storage) {
      storage.setItem(STORAGE_KEY, JSON.stringify(data));
      storage.setItem('gym_crm_sync_signal', Date.now().toString());
    }
    localBroadcast?.postMessage({ type: 'DATA_MUTATED', timestamp: Date.now() });
  } catch (e) {
    console.error('Error guardando Local DB:', e);
  }
};

// ==============================================================================
// 3.1. SUSCRIPCIÓN EN TIEMPO REAL MULTI-DISPOSITIVO (REALTIME SYNC)
// ==============================================================================
export const subscribeToRealtimeChanges = (callback) => {
  const cleanups = [];

  // 1. Supabase Cloud Realtime (WebSockets entre múltiples dispositivos / computadoras / teléfonos)
  if (isSupabaseConfigured() && supabase) {
    try {
      const channel = supabase
        .channel('gym-realtime-global')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'asistencias' }, (p) => {
          callback({ table: 'asistencias', event: p, mode: 'SUPABASE' });
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'suscripciones' }, (p) => {
          callback({ table: 'suscripciones', event: p, mode: 'SUPABASE' });
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'clientes' }, (p) => {
          callback({ table: 'clientes', event: p, mode: 'SUPABASE' });
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'caja_movimientos' }, (p) => {
          callback({ table: 'caja_movimientos', event: p, mode: 'SUPABASE' });
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'planes' }, (p) => {
          callback({ table: 'planes', event: p, mode: 'SUPABASE' });
        })
        .subscribe();

      cleanups.push(() => {
        supabase.removeChannel(channel);
      });
    } catch (err) {
      console.warn('Error suscribiendo a Supabase Realtime:', err);
    }
  }

  // 2. Realtime Local (Multi-pestañas / ventanas simultáneas sin delay)
  if (typeof window !== 'undefined') {
    const handleStorage = (e) => {
      if (e.key === STORAGE_KEY || e.key === 'gym_crm_sync_signal') {
        callback({ type: 'LOCAL_SYNC', source: 'storage' });
      }
    };
    window.addEventListener('storage', handleStorage);
    cleanups.push(() => window.removeEventListener('storage', handleStorage));

    if ('BroadcastChannel' in window) {
      const bc = new BroadcastChannel('gym_crm_realtime_bus');
      bc.onmessage = () => {
        callback({ type: 'LOCAL_SYNC', source: 'broadcast' });
      };
      cleanups.push(() => bc.close());
    }
  }

  return () => {
    cleanups.forEach(fn => fn());
  };
};

// ==============================================================================
// 4. API UNIFICADA (Consumo desde Supabase o Mock Adapter reactivo)
// ==============================================================================

export const api = {
  // --- DASHBOARD & KPIS ---
  async getDashboardData() {
    if (isSupabaseConfigured() && supabase) {
      try {
        const [kpiRes, vencRes, ausRes, leadsRes] = await Promise.all([
          supabase.from('vista_kpis_dashboard').select('*').single(),
          supabase.from('vista_alertas_vencimiento').select('*'),
          supabase.from('vista_alertas_inasistencia').select('*'),
          supabase.from('vista_leads_frios').select('*'),
        ]);

        if (!kpiRes.error && !vencRes.error) {
          return {
            kpis: kpiRes.data || {},
            vencimientos: vencRes.data || [],
            ausencias: ausRes.data || [],
            leadsFrios: leadsRes.data || [],
          };
        }
      } catch (err) {
        console.warn('Fallo Supabase, usando Local DB:', err);
      }
    }

    // Local Mock Calculation
    const db = getLocalDB();
    const today = new Date();
    const todayStr = format(today, 'yyyy-MM-dd');

    // 1. Alertas de vencimiento (<= 3 días hasta -7 días)
    const vencimientos = [];
    db.suscripciones.forEach((sub) => {
      if (sub.estado !== 'ACTIVA') return;
      const cliente = db.clientes.find((c) => c.id === sub.cliente_id);
      const plan = db.planes.find((p) => p.id === sub.plan_id);
      if (!cliente || !plan) return;

      const fechaFin = new Date(sub.fecha_fin);
      const diasRestantes = differenceInCalendarDays(fechaFin, today);

      if (diasRestantes <= 3 && diasRestantes >= -7) {
        let estadoAlerta = 'POR_VENCER';
        if (diasRestantes < 0) estadoAlerta = 'VENCIDA';
        else if (diasRestantes === 0) estadoAlerta = 'VENCE_HOY';
        else if (diasRestantes === 1) estadoAlerta = 'VENCE_1_DIA';
        else if (diasRestantes === 2) estadoAlerta = 'VENCE_2_DIAS';
        else if (diasRestantes === 3) estadoAlerta = 'VENCE_3_DIAS';

        const notificadaHoy = db.notificaciones_log.some(
          (n) => n.cliente_id === cliente.id && n.fecha_envio.startsWith(todayStr)
        );

        vencimientos.push({
          cliente_id: cliente.id,
          dni: cliente.dni,
          nombre_completo: cliente.nombre_completo,
          telefono: cliente.telefono,
          estado_ciclo_vida: cliente.estado_ciclo_vida,
          intentos_recuperacion: cliente.intentos_recuperacion,
          suscripcion_id: sub.id,
          plan_nombre: plan.nombre,
          plan_precio: plan.precio,
          fecha_inicio: sub.fecha_inicio,
          fecha_fin: sub.fecha_fin,
          saldo_pendiente: sub.saldo_pendiente,
          dias_restantes: diasRestantes,
          estado_alerta: estadoAlerta,
          notificada_hoy: notificadaHoy,
        });
      }
    });

    // 2. Alertas de inasistencia (Activas sin asistir 3 a 5+ días)
    const ausencias = [];
    db.clientes.forEach((cliente) => {
      const sub = db.suscripciones.find(
        (s) => s.cliente_id === cliente.id && s.estado === 'ACTIVA' && new Date(s.fecha_fin) >= today
      );
      if (!sub) return;
      const plan = db.planes.find((p) => p.id === sub.plan_id);

      const refDate = cliente.ultima_asistencia
        ? new Date(cliente.ultima_asistencia)
        : new Date(sub.fecha_inicio);
      const diasSinAsistir = differenceInCalendarDays(today, refDate);

      if (diasSinAsistir >= 3) {
        const notificadaHoy = db.notificaciones_log.some(
          (n) =>
            n.cliente_id === cliente.id &&
            n.tipo_evento === 'AUSENCIA_3_5_DIAS' &&
            n.fecha_envio.startsWith(todayStr)
        );

        ausencias.push({
          cliente_id: cliente.id,
          dni: cliente.dni,
          nombre_completo: cliente.nombre_completo,
          telefono: cliente.telefono,
          ultima_asistencia: cliente.ultima_asistencia,
          intentos_recuperacion: cliente.intentos_recuperacion,
          suscripcion_id: sub.id,
          plan_nombre: plan ? plan.nombre : 'Plan',
          fecha_fin: sub.fecha_fin,
          dias_sin_asistir: diasSinAsistir,
          notificada_hoy: notificadaHoy,
        });
      }
    });

    // 3. Leads Fríos
    const leadsFrios = [];
    db.clientes.forEach((cliente) => {
      const activeSub = db.suscripciones.find(
        (s) => s.cliente_id === cliente.id && s.estado === 'ACTIVA' && new Date(s.fecha_fin) >= today
      );
      const isCold =
        cliente.estado_ciclo_vida === 'LEAD_FRIO' ||
        (!activeSub && (cliente.intentos_recuperacion >= 3));

      if (isCold) {
        const lastSub = db.suscripciones
          .filter((s) => s.cliente_id === cliente.id)
          .sort((a, b) => new Date(b.fecha_fin) - new Date(a.fecha_fin))[0];

        const ultimaFechaFin = lastSub ? lastSub.fecha_fin : cliente.created_at;
        const diasInactiva = differenceInCalendarDays(today, new Date(ultimaFechaFin));
        const promosRecibidas = db.notificaciones_log.filter(
          (n) => n.cliente_id === cliente.id && n.tipo_evento === 'PROMOCION_LEAD_FRIO'
        ).length;

        leadsFrios.push({
          cliente_id: cliente.id,
          dni: cliente.dni,
          nombre_completo: cliente.nombre_completo,
          telefono: cliente.telefono,
          estado_ciclo_vida: 'LEAD_FRIO',
          intentos_recuperacion: cliente.intentos_recuperacion,
          ultima_asistencia: cliente.ultima_asistencia,
          ultima_fecha_fin: ultimaFechaFin,
          dias_inactiva: diasInactiva,
          promos_recibidas: promosRecibidas,
        });
      }
    });

    // 4. KPIs
    const totalActivas = db.suscripciones.filter(
      (s) => s.estado === 'ACTIVA' && new Date(s.fecha_fin) >= today
    ).length;

    const asistenciasHoy = db.asistencias.filter((a) =>
      a.fecha_hora_entrada.startsWith(todayStr)
    ).length;

    const cajaHoy = db.caja_movimientos.filter(
      (c) => c.tipo_movimiento === 'INGRESO' && c.fecha_hora.startsWith(todayStr)
    );

    const totalIngresosHoy = cajaHoy.reduce((acc, curr) => acc + Number(curr.monto || 0), 0);
    const digitalHoy = cajaHoy
      .filter((c) => ['YAPE', 'PLIN'].includes(c.metodo_pago))
      .reduce((acc, curr) => acc + Number(curr.monto || 0), 0);
    const efectivoHoy = cajaHoy
      .filter((c) => c.metodo_pago === 'EFECTIVO')
      .reduce((acc, curr) => acc + Number(curr.monto || 0), 0);

    return {
      kpis: {
        total_activas: totalActivas,
        por_vencer_3dias: vencimientos.filter((v) => v.dias_restantes >= 0 && v.dias_restantes <= 3).length,
        ausentes_3a5dias: ausencias.length,
        total_leads_frios: leadsFrios.length,
        asistencias_hoy: asistenciasHoy,
        total_ingresos_hoy: totalIngresosHoy,
        digital_hoy: digitalHoy,
        efectivo_hoy: efectivoHoy,
      },
      vencimientos,
      ausencias,
      leadsFrios,
    };
  },

  // --- PLANES Y PROMOCIONES ---
  async getPlanes() {
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase.from('planes').select('*').order('precio');
        if (!error && data) return data;
      } catch (e) {
        console.warn('Fallback a local para planes:', e);
      }
    }
    const db = getLocalDB();
    return db.planes || [];
  },

  async savePlan(planData) {
    if (isSupabaseConfigured() && supabase) {
      try {
        if (planData.id && !planData.id.startsWith('plan-')) {
          const { data, error } = await supabase
            .from('planes')
            .update(planData)
            .eq('id', planData.id)
            .select()
            .single();
          if (!error) return data;
        } else {
          const { id, ...createData } = planData;
          const { data, error } = await supabase
            .from('planes')
            .insert([createData])
            .select()
            .single();
          if (!error) return data;
        }
      } catch (e) {
        console.warn('Fallback a local guardando plan:', e);
      }
    }

    const db = getLocalDB();
    if (planData.id) {
      const idx = db.planes.findIndex((p) => p.id === planData.id);
      if (idx !== -1) {
        db.planes[idx] = { ...db.planes[idx], ...planData };
      } else {
        db.planes.push(planData);
      }
    } else {
      const newPlan = {
        ...planData,
        id: `plan-${Date.now()}`,
        activo: true,
      };
      db.planes.push(newPlan);
    }
    saveLocalDB(db);
    return planData;
  },

  async deletePlan(planId) {
    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase.from('planes').delete().eq('id', planId);
      } catch (e) {
        console.warn('Fallback a local eliminando plan:', e);
      }
    }
    const db = getLocalDB();
    db.planes = db.planes.filter((p) => p.id !== planId);
    saveLocalDB(db);
    return true;
  },

  // --- PLANTILLAS WHATSAPP ---
  async getPlantillas() {
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase.from('plantillas_whatsapp').select('*');
        if (!error && data) return data;
      } catch (e) {
        console.warn('Fallback a local para plantillas:', e);
      }
    }
    const db = getLocalDB();
    return db.plantillas || [];
  },

  async savePlantilla(plantilla) {
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase
          .from('plantillas_whatsapp')
          .update({
            contenido_plantilla: plantilla.contenido_plantilla,
            titulo_panel: plantilla.titulo_panel,
            updated_at: new Date().toISOString(),
          })
          .eq('codigo_evento', plantilla.codigo_evento)
          .select()
          .single();
        if (!error) return data;
      } catch (e) {
        console.warn('Fallback a local para actualizar plantilla:', e);
      }
    }

    const db = getLocalDB();
    const idx = db.plantillas.findIndex((p) => p.codigo_evento === plantilla.codigo_evento);
    if (idx !== -1) {
      db.plantillas[idx] = { ...db.plantillas[idx], ...plantilla };
      saveLocalDB(db);
    }
    return plantilla;
  },

  // --- CLIENTES Y DIRECTORIO ---
  async getClientes(filtro = 'TODOS') {
    if (isSupabaseConfigured() && supabase) {
      try {
        let query = supabase.from('clientes').select(`
          *,
          suscripciones (
            id,
            plan_id,
            fecha_inicio,
            fecha_fin,
            precio_pactado,
            monto_pagado,
            saldo_pendiente,
            estado,
            planes (nombre, precio)
          )
        `).order('nombre_completo');

        if (filtro !== 'TODOS') {
          query = query.eq('estado_ciclo_vida', filtro);
        }

        const { data, error } = await query;
        if (!error && data) return data;
      } catch (e) {
        console.warn('Fallback a local para clientes:', e);
      }
    }

    const db = getLocalDB();
    const today = new Date();

    const clientesConSuscripcion = db.clientes.map((c) => {
      const subs = db.suscripciones
        .filter((s) => s.cliente_id === c.id)
        .map((s) => ({
          ...s,
          planes: db.planes.find((p) => p.id === s.plan_id) || { nombre: 'Plan' },
        }));

      const activeSub = subs.find((s) => s.estado === 'ACTIVA' && new Date(s.fecha_fin) >= today);
      const latestSub = subs.sort((a, b) => new Date(b.fecha_fin) - new Date(a.fecha_fin))[0];

      return {
        ...c,
        suscripciones: subs,
        suscripcion_actual: activeSub || latestSub,
      };
    });

    if (filtro === 'TODOS') return clientesConSuscripcion;
    return clientesConSuscripcion.filter((c) => c.estado_ciclo_vida === filtro);
  },

  // --- CREAR SUSCRIPCIÓN NUEVA (MÓDULO 2) ---
  async crearNuevaSuscripcion({ cliente, planId, fechaInicio, metodoPago, montoPagado, whatsappConfirmado }) {
    const db = getLocalDB();
    const plan = db.planes.find((p) => p.id === planId) || db.planes[0];
    const fechaIni = new Date(fechaInicio || new Date());
    const fechaFin = addDays(fechaIni, plan.duracion_dias);
    const fechaFinStr = format(fechaFin, 'yyyy-MM-dd');
    const fechaIniStr = format(fechaIni, 'yyyy-MM-dd');
    const saldoPendiente = Math.max(0, plan.precio - Number(montoPagado || 0));

    // Si Supabase está disponible
    if (isSupabaseConfigured() && supabase) {
      try {
        // 1. Insert or update cliente
        let clienteId = cliente.id;
        if (!clienteId) {
          const { data: cData, error: cErr } = await supabase
            .from('clientes')
            .upsert({
              dni: cliente.dni,
              nombre_completo: cliente.nombre_completo,
              telefono: cliente.telefono,
              fecha_nacimiento: cliente.fecha_nacimiento || null,
              contacto_emergencia: cliente.contacto_emergencia || null,
              observaciones_medicas: cliente.observaciones_medicas || null,
              estado_ciclo_vida: 'ACTIVA',
              intentos_recuperacion: 0,
            }, { onConflict: 'dni' })
            .select()
            .single();

          if (!cErr && cData) {
            clienteId = cData.id;
          }
        }

        if (clienteId) {
          // 2. Insertar suscripción
          const { data: subData, error: subErr } = await supabase
            .from('suscripciones')
            .insert({
              cliente_id: clienteId,
              plan_id: plan.id,
              fecha_inicio: fechaIniStr,
              fecha_fin: fechaFinStr,
              precio_pactado: plan.precio,
              monto_pagado: Number(montoPagado),
              saldo_pendiente: saldoPendiente,
              metodo_pago: metodoPago,
              estado: 'ACTIVA',
              whatsapp_bienvenida_confirmado: whatsappConfirmado,
            })
            .select()
            .single();

          // 3. Registrar en caja si hubo pago
          if (Number(montoPagado) > 0) {
            await supabase.from('caja_movimientos').insert({
              tipo_movimiento: 'INGRESO',
              concepto: `Alta / Renovación ${plan.nombre} (${cliente.nombre_completo})`,
              monto: Number(montoPagado),
              metodo_pago: metodoPago,
              cliente_id: clienteId,
            });
          }

          if (!subErr) return { ok: true, clienteId, subData };
        }
      } catch (e) {
        console.warn('Fallback a local para crear suscripción:', e);
      }
    }

    // Modo local
    let clienteObj = db.clientes.find((c) => c.dni === cliente.dni);
    if (!clienteObj) {
      clienteObj = {
        id: `cli-${Date.now()}`,
        dni: cliente.dni,
        nombre_completo: cliente.nombre_completo,
        telefono: cliente.telefono,
        fecha_nacimiento: cliente.fecha_nacimiento || '',
        contacto_emergencia: cliente.contacto_emergencia || '',
        observaciones_medicas: cliente.observaciones_medicas || '',
        ultima_asistencia: null,
        estado_ciclo_vida: 'ACTIVA',
        intentos_recuperacion: 0,
        created_at: new Date().toISOString(),
      };
      db.clientes.push(clienteObj);
    } else {
      clienteObj.nombre_completo = cliente.nombre_completo;
      clienteObj.telefono = cliente.telefono;
      clienteObj.estado_ciclo_vida = 'ACTIVA';
      clienteObj.intentos_recuperacion = 0;
    }

    const nuevaSub = {
      id: `sub-${Date.now()}`,
      cliente_id: clienteObj.id,
      plan_id: plan.id,
      fecha_inicio: fechaIniStr,
      fecha_fin: fechaFinStr,
      precio_pactado: plan.precio,
      monto_pagado: Number(montoPagado),
      saldo_pendiente: saldoPendiente,
      metodo_pago: metodoPago,
      dias_congelados_usados: 0,
      estado: 'ACTIVA',
      whatsapp_bienvenida_confirmado: whatsappConfirmado,
      created_at: new Date().toISOString(),
    };

    db.suscripciones.push(nuevaSub);

    // Movimiento en caja
    if (Number(montoPagado) > 0) {
      db.caja_movimientos.unshift({
        id: `caja-${Date.now()}`,
        fecha_hora: new Date().toISOString(),
        tipo_movimiento: 'INGRESO',
        concepto: `Alta ${plan.nombre} (${clienteObj.nombre_completo})`,
        monto: Number(montoPagado),
        metodo_pago: metodoPago,
        cliente_id: clienteObj.id,
      });
    }

    saveLocalDB(db);
    return { ok: true, cliente: clienteObj, suscripcion: nuevaSub };
  },

  // --- CHECK-IN KIOSCO POR DNI ---
  async checkInKiosk(dni) {
    const cleanDni = dni.trim();

    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase.rpc('registrar_asistencia_kiosk', {
          p_dni: cleanDni,
        });
        if (!error && data) return data;
      } catch (e) {
        console.warn('Fallback a local en kiosk:', e);
      }
    }

    const db = getLocalDB();
    const cliente = db.clientes.find((c) => c.dni === cleanDni);
    if (!cliente) {
      return {
        ok: false,
        codigo: 'NO_REGISTRADA',
        mensaje: 'DNI no encontrado en el sistema. Acércate a recepción.',
        semaforo: 'ROJO',
      };
    }

    // Buscar suscripción activa o última
    const subs = db.suscripciones
      .filter((s) => s.cliente_id === cliente.id)
      .sort((a, b) => new Date(b.fecha_fin) - new Date(a.fecha_fin));

    const sub = subs[0];
    if (!sub) {
      return {
        ok: false,
        codigo: 'SIN_PLAN',
        nombre: cliente.nombre_completo,
        mensaje: 'No tienes una suscripción registrada. Acércate a recepción.',
        semaforo: 'ROJO',
      };
    }

    const plan = db.planes.find((p) => p.id === sub.plan_id) || { nombre: 'Plan' };
    const today = new Date();
    const fechaFin = new Date(sub.fecha_fin);
    const diasRestantes = differenceInCalendarDays(fechaFin, today);

    // Actualizar última asistencia
    cliente.ultima_asistencia = new Date().toISOString();
    cliente.intentos_recuperacion = 0;

    // Registrar en tabla asistencias
    let semaforo = 'VERDE';
    let codigo = 'ACTIVA';
    let mensaje = `¡Bienvenida a entrenar! Te quedan ${diasRestantes} días de suscripción.`;

    if (sub.estado === 'CONGELADA') {
      semaforo = 'AMBAR';
      codigo = 'CONGELADA';
      mensaje = 'Tu membresía se encuentra en periodo de congelamiento.';
    } else if (diasRestantes < 0 || sub.estado === 'VENCIDA') {
      semaforo = 'ROJO';
      codigo = 'VENCIDA';
      cliente.estado_ciclo_vida = 'VENCIDA';
      mensaje = `Tu membresía venció hace ${Math.abs(diasRestantes)} día(s). Por favor renueva en recepción.`;
    } else if (diasRestantes <= 3) {
      semaforo = 'AMBAR';
      codigo = 'POR_VENCER';
      cliente.estado_ciclo_vida = 'POR_VENCER';
      mensaje =
        diasRestantes === 0
          ? '¡Bienvenida! Tu membresía vence HOY. No olvides renovar en recepción.'
          : `¡Bienvenida! Te quedan solo ${diasRestantes} día(s) de membresía. ¡Recuerda renovar pronto!`;
      
      db.asistencias.unshift({
        id: `att-${Date.now()}`,
        cliente_id: cliente.id,
        suscripcion_id: sub.id,
        fecha_hora_entrada: new Date().toISOString(),
        alerta_mostrada: 'ALERTA_POR_VENCER',
      });
    } else {
      semaforo = 'VERDE';
      cliente.estado_ciclo_vida = 'ACTIVA';
      db.asistencias.unshift({
        id: `att-${Date.now()}`,
        cliente_id: cliente.id,
        suscripcion_id: sub.id,
        fecha_hora_entrada: new Date().toISOString(),
        alerta_mostrada: 'ACCESO_CORRECTO',
      });
    }

    saveLocalDB(db);

    return {
      ok: semaforo !== 'ROJO',
      codigo,
      cliente_id: cliente.id,
      dni: cliente.dni,
      nombre: cliente.nombre_completo,
      telefono: cliente.telefono,
      plan: plan.nombre,
      dias_restantes: diasRestantes,
      fecha_fin: sub.fecha_fin,
      saldo_pendiente: sub.saldo_pendiente,
      mensaje,
      semaforo,
    };
  },

  // --- ASISTENCIAS DEL DÍA (FEED DE RECEPCIÓN) ---
  async getAsistenciasHoy() {
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase
          .from('asistencias')
          .select(`
            id,
            fecha_hora_entrada,
            alerta_mostrada,
            cliente_id,
            suscripcion_id,
            clientes (id, dni, nombre_completo, telefono),
            suscripciones (planes (nombre))
          `)
          .gte('fecha_hora_entrada', `${todayStr}T00:00:00`)
          .order('fecha_hora_entrada', { ascending: false });
        if (!error && data) {
          return data.map(a => ({
            id: a.id,
            fecha_hora_entrada: a.fecha_hora_entrada,
            alerta_mostrada: a.alerta_mostrada,
            cliente_id: a.cliente_id,
            dni: a.clientes?.dni,
            nombre_completo: a.clientes?.nombre_completo,
            telefono: a.clientes?.telefono,
            plan_nombre: a.suscripciones?.planes?.nombre || 'Membresía'
          }));
        }
      } catch (e) {
        console.warn('Fallback asistencias hoy:', e);
      }
    }

    const db = getLocalDB();
    const hoy = (db.asistencias || []).filter(a => {
      if (!a.fecha_hora_entrada) return false;
      try {
        return isSameDay(new Date(a.fecha_hora_entrada), new Date());
      } catch {
        return false;
      }
    });
    return hoy.map(a => {
      const c = db.clientes?.find(cli => cli.id === a.cliente_id);
      const sub = db.suscripciones?.find(s => s.id === a.suscripcion_id);
      const plan = db.planes?.find(p => p.id === sub?.plan_id);
      return {
        id: a.id,
        fecha_hora_entrada: a.fecha_hora_entrada,
        alerta_mostrada: a.alerta_mostrada,
        cliente_id: a.cliente_id,
        dni: c ? c.dni : (a.dni || ''),
        nombre_completo: c ? c.nombre_completo : (a.nombre || 'Visitante'),
        telefono: c ? c.telefono : '',
        plan_nombre: a.alerta_mostrada === 'PASE_DIARIO' ? 'Pase Diario Libre' : (plan ? plan.nombre : 'Membresía')
      };
    });
  },

  // --- REGISTRAR PASE DIARIO RÁPIDO (S/ 5.00 O PERSONALIZADO) ---
  async registrarPaseDiario({ cliente_id, nombre, dni, metodoPago = 'EFECTIVO', monto = 5.00 }) {
    const db = getLocalDB();
    const c = cliente_id ? db.clientes?.find(cli => cli.id === cliente_id) : (dni ? db.clientes?.find(cli => cli.dni === dni) : null);
    const finalClienteId = c ? c.id : null;
    const finalNombre = c ? c.nombre_completo : (nombre || (dni ? `Visitante DNI ${dni}` : 'Visitante Pase Diario'));
    const finalMonto = Number(monto) > 0 ? Number(monto) : 5.00;

    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase.from('caja_movimientos').insert({
          tipo_movimiento: 'INGRESO',
          concepto: `Pase Diario de Entrenamiento (${finalNombre})`,
          monto: finalMonto,
          metodo_pago: metodoPago,
          cliente_id: finalClienteId
        });

        await supabase.from('asistencias').insert({
          cliente_id: finalClienteId,
          alerta_mostrada: 'PASE_DIARIO'
        });

        if (finalClienteId) {
          await supabase.from('clientes').update({ ultima_asistencia: new Date().toISOString() }).eq('id', finalClienteId);
        }
        return { ok: true };
      } catch (e) {
        console.warn('Fallback pase diario:', e);
      }
    }

    // Local
    db.caja_movimientos.unshift({
      id: `caja-${Date.now()}`,
      fecha_hora: new Date().toISOString(),
      tipo_movimiento: 'INGRESO',
      concepto: `Pase Diario de Entrenamiento (${finalNombre})`,
      monto: finalMonto,
      metodo_pago: metodoPago,
      cliente_id: finalClienteId
    });

    db.asistencias.unshift({
      id: `att-${Date.now()}`,
      cliente_id: finalClienteId,
      nombre: finalNombre,
      dni: dni || (c ? c.dni : ''),
      fecha_hora_entrada: new Date().toISOString(),
      alerta_mostrada: 'PASE_DIARIO'
    });

    if (c) {
      c.ultima_asistencia = new Date().toISOString();
    }
    saveLocalDB(db);
    return { ok: true };
  },

  // --- CONGELAMIENTO DE MEMBRESÍA ---
  async congelarMembresia(suscripcionId, dias) {
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase.rpc('congelar_suscripcion', {
          p_suscripcion_id: suscripcionId,
          p_dias: Number(dias),
        });
        if (!error && data) return data;
      } catch (e) {
        console.warn('Fallback a local en congelamiento:', e);
      }
    }

    const db = getLocalDB();
    const sub = db.suscripciones.find((s) => s.id === suscripcionId);
    if (!sub) return { ok: false, mensaje: 'Suscripción no encontrada' };

    const nuevaFechaFin = addDays(new Date(sub.fecha_fin), Number(dias));
    sub.fecha_fin = format(nuevaFechaFin, 'yyyy-MM-dd');
    sub.dias_congelados_usados = (sub.dias_congelados_usados || 0) + Number(dias);
    sub.estado = 'ACTIVA';

    const cliente = db.clientes.find((c) => c.id === sub.cliente_id);
    if (cliente) {
      cliente.estado_ciclo_vida = 'ACTIVA';
    }

    saveLocalDB(db);
    return { ok: true, nueva_fecha_fin: sub.fecha_fin, dias_agregados: dias };
  },

  // --- REGISTRAR NOTIFICACIÓN / INCREMENTAR INSISTENCIA ---
  async registrarInsistencia(clienteId, tipoEvento, mensaje) {
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase.rpc('registrar_insistencia_whatsapp', {
          p_cliente_id: clienteId,
          p_tipo_evento: tipoEvento,
          p_mensaje: mensaje,
        });
        if (!error && data) return data;
      } catch (e) {
        console.warn('Fallback a local para registrar insistencia:', e);
      }
    }

    const db = getLocalDB();
    const cliente = db.clientes.find((c) => c.id === clienteId);
    if (!cliente) return { ok: false };

    cliente.intentos_recuperacion = (cliente.intentos_recuperacion || 0) + 1;
    if (cliente.intentos_recuperacion >= 3 && cliente.estado_ciclo_vida !== 'ACTIVA') {
      cliente.estado_ciclo_vida = 'LEAD_FRIO';
    }

    db.notificaciones_log.unshift({
      id: `log-${Date.now()}`,
      cliente_id: clienteId,
      tipo_evento: tipoEvento,
      mensaje_enviado: mensaje,
      confirmado_entregado: true,
      fecha_envio: new Date().toISOString(),
    });

    saveLocalDB(db);
    return {
      ok: true,
      intentos_recuperacion: cliente.intentos_recuperacion,
      estado_ciclo_vida: cliente.estado_ciclo_vida,
    };
  },

  // --- MOVER A LEAD FRÍO MANUALMENTE ---
  async moverALeadFrio(clienteId) {
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase.rpc('mover_a_lead_frio', {
          p_cliente_id: clienteId,
        });
        if (!error) return data;
      } catch (e) {
        console.warn('Fallback a local en mover a lead frio:', e);
      }
    }

    const db = getLocalDB();
    const cliente = db.clientes.find((c) => c.id === clienteId);
    if (cliente) {
      cliente.estado_ciclo_vida = 'LEAD_FRIO';
      saveLocalDB(db);
    }
    return { ok: true, estado: 'LEAD_FRIO' };
  },

  // --- MEDIDAS Y PROGRESO FÍSICO ---
  async getProgresoFisico(clienteId) {
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase
          .from('progreso_fisico')
          .select('*')
          .eq('cliente_id', clienteId)
          .order('fecha_registro', { ascending: false });
        if (!error && data) return data;
      } catch (e) {
        console.warn('Fallback a local en progreso físico:', e);
      }
    }

    const db = getLocalDB();
    return (db.progreso_fisico || []).filter((p) => p.cliente_id === clienteId);
  },

  async agregarProgresoFisico(registro) {
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase
          .from('progreso_fisico')
          .insert([registro])
          .select()
          .single();
        if (!error && data) return data;
      } catch (e) {
        console.warn('Fallback a local para agregar progreso:', e);
      }
    }

    const db = getLocalDB();
    const nuevo = {
      ...registro,
      id: `prog-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    db.progreso_fisico.unshift(nuevo);
    saveLocalDB(db);
    return nuevo;
  },

  // --- CAJA / POS ---
  async getCajaMovimientos() {
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase
          .from('caja_movimientos')
          .select('*')
          .order('fecha_hora', { ascending: false })
          .limit(50);
        if (!error && data) return data;
      } catch (e) {
        console.warn('Fallback a local en caja:', e);
      }
    }

    const db = getLocalDB();
    return db.caja_movimientos || [];
  },

  async registrarVentaPOS(movimiento) {
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase
          .from('caja_movimientos')
          .insert([movimiento])
          .select()
          .single();
        if (!error && data) return data;
      } catch (e) {
        console.warn('Fallback a local para venta POS:', e);
      }
    }

    const db = getLocalDB();
    const nuevo = {
      ...movimiento,
      id: `caja-${Date.now()}`,
      fecha_hora: new Date().toISOString(),
    };
    db.caja_movimientos.unshift(nuevo);
    saveLocalDB(db);
    return nuevo;
  },

  // --- DIAGNÓSTICO EN VIVO DEL SISTEMA (TEST & HEALTH CHECK) ---
  async checkHealth() {
    const start = performance.now();
    const isConfigured = isSupabaseConfigured() && supabase !== null;

    if (isConfigured) {
      try {
        const [cliTest, planTest, attTest, cajaTest] = await Promise.all([
          supabase.from('clientes').select('id', { count: 'exact', head: true }),
          supabase.from('planes').select('id', { count: 'exact', head: true }),
          supabase.from('asistencias').select('id', { count: 'exact', head: true }),
          supabase.from('caja_movimientos').select('id', { count: 'exact', head: true })
        ]);

        const latency = Math.round(performance.now() - start);
        const hasErrors = cliTest.error || planTest.error;

        if (!hasErrors) {
          return {
            ok: true,
            mode: 'SUPABASE_CLOUD',
            latencyMs: latency,
            endpoint: supabaseUrl,
            counts: {
              clientes: cliTest.count || 0,
              planes: planTest.count || 0,
              asistencias: attTest.count || 0,
              caja: cajaTest.count || 0
            },
            realtime: 'ACTIVO_WEBSOCKETS',
            message: 'Conectado exitosamente a Supabase Cloud (PostgreSQL)'
          };
        }
      } catch (e) {
        console.warn('Fallo test Supabase, fallback a local:', e);
      }
    }

    // Modo Local
    const db = getLocalDB();
    const latency = Math.round(performance.now() - start);
    return {
      ok: true,
      mode: 'LOCAL_FALLBACK',
      latencyMs: latency,
      endpoint: 'Cache Local Navegador (LocalStorage / BroadcastChannel)',
      counts: {
        clientes: db.clientes?.length || 0,
        planes: db.planes?.length || 0,
        asistencias: db.asistencias?.length || 0,
        caja: db.caja_movimientos?.length || 0
      },
      realtime: 'ACTIVO_BROADCAST_CHANNEL',
      message: 'Base de datos local activa (Modo Portátil con soporte Realtime local)'
    };
  }
};

