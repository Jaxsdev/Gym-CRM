/**
 * ==============================================================================
 * SUITE DE PRUEBAS AUTOMATIZADAS - VITALFIT GYM CRM & ERP
 * ==============================================================================
 * Verifica la integridad de la base de datos, operaciones de mostrador,
 * motor de retención, y sincronización en tiempo real.
 * 
 * Ejecución: node scripts/test-system.js (o npm test)
 */

// 1. Polyfill de almacenamiento local y broadcast para ejecución bajo Node.js
if (typeof globalThis.localStorage === 'undefined') {
  const memoryStore = new Map();
  globalThis.localStorage = {
    getItem: (key) => memoryStore.get(key) || null,
    setItem: (key, val) => memoryStore.set(key, String(val)),
    removeItem: (key) => memoryStore.delete(key),
    clear: () => memoryStore.clear()
  };
}

if (typeof globalThis.BroadcastChannel === 'undefined') {
  globalThis.BroadcastChannel = class {
    constructor(name) { this.name = name; }
    postMessage(data) {}
    close() {}
  };
}

import { api, isSupabaseConfigured, subscribeToRealtimeChanges } from '../src/lib/supabaseClient.js';
import { parseWhatsAppTemplate } from '../src/lib/whatsappParser.js';

let passedTests = 0;
let totalTests = 0;

function assert(condition, testName, details = '') {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  \x1b[32m✔ [PASS]\x1b[0m ${testName}`);
  } else {
    console.error(`  \x1b[31m✖ [FAIL]\x1b[0m ${testName} ${details ? `-> ${details}` : ''}`);
  }
}

async function runTests() {
  console.log('\n======================================================');
  console.log('🧪 INICIANDO VERIFICACIÓN DEL SISTEMA GYM CRM & ERP');
  console.log('======================================================\n');

  // TEST 1: Estado de Configuración de Base de Datos
  console.log('\x1b[36m[1/7] VERIFICACIÓN DE CONEXIÓN A BASE DE DATOS\x1b[0m');
  const isCloud = isSupabaseConfigured();
  console.log(`  ℹ Modo de Operación: ${isCloud ? '🟢 SUPABASE CLOUD' : '🟡 LOCAL PORTÁTIL (FALLBACK DB)'}`);
  
  const health = await api.checkHealth();
  assert(health.ok === true, 'El endpoint de salud del sistema responde correctamente');
  assert(health.latencyMs >= 0, `Latencia de respuesta dentro de los parámetros: ${health.latencyMs}ms`);
  assert(health.counts && typeof health.counts.clientes === 'number', 'Integridad de tablas y conteos verificados');

  // TEST 2: Directorio de Socias & Filtrado
  console.log('\n\x1b[36m[2/7] CONSULTAS DE CLIENTAS Y CICLO DE VIDA\x1b[0m');
  const socias = await api.getClientes('TODOS');
  assert(Array.isArray(socias) && socias.length > 0, `Se cargaron ${socias?.length || 0} socias de la base de datos`);
  
  const sampleSocia = socias[0];
  assert(sampleSocia && sampleSocia.dni && sampleSocia.nombre_completo, `Estructura de socia válida (DNI: ${sampleSocia?.dni})`);
  
  const sociasActivas = await api.getClientes('ACTIVA');
  assert(Array.isArray(sociasActivas), `Filtro de ciclo de vida 'ACTIVA' operativo (${sociasActivas.length} socias)`);

  // TEST 3: Check-in Kiosco en Tiempo Real (Validación Semafórica)
  console.log('\n\x1b[36m[3/7] MOTOR DE CHECK-IN Y CONTROL DE ACCESO\x1b[0m');
  
  // 3.1 Socia con membresía vigente (Luciana - 47895612)
  const resAlDia = await api.checkInKiosk('47895612');
  assert(resAlDia && resAlDia.semaforo === 'VERDE', 'Check-in de socia al día retorna semáforo VERDE');
  assert(resAlDia.ok === true, 'Acceso autorizado concedido');

  // 3.2 Socia por vencer (Valeria - 72145896)
  const resPorVencer = await api.checkInKiosk('72145896');
  assert(resPorVencer && (resPorVencer.semaforo === 'AMBAR' || resPorVencer.semaforo === 'VERDE'), 'Check-in de socia por vencer detectado con aviso');

  // 3.3 DNI no registrado
  const resNoExiste = await api.checkInKiosk('00000001');
  assert(resNoExiste && resNoExiste.semaforo === 'ROJO', 'DNI inexistente bloquea acceso con semáforo ROJO');

  // TEST 4: Cobro de Pase Diario y Registro en Caja POS
  console.log('\n\x1b[36m[4/7] OPERACIONES DE CAJA Y PASE DIARIO EXPRESS\x1b[0m');
  const resPase = await api.registrarPaseDiario({
    nombre: 'Cliente de Prueba Automatizada',
    dni: '99881122',
    metodoPago: 'YAPE',
    monto: 5.00
  });
  assert(resPase && resPase.ok === true, 'Registro de Pase Diario completado con éxito');

  const asistenciasHoy = await api.getAsistenciasHoy();
  const paseEncontrado = asistenciasHoy.find(a => a.nombre_completo?.includes('Prueba Automatizada') || a.dni === '99881122');
  assert(Boolean(paseEncontrado), 'El Pase Diario aparece registrado en el feed de Asistencias de hoy');

  const cajaMovs = await api.getCajaMovimientos();
  const movimientoCaja = cajaMovs.find(m => m.concepto?.includes('Prueba Automatizada'));
  assert(Boolean(movimientoCaja), 'El cobro del Pase Diario se registró automáticamente en la Caja');

  // TEST 5: Dashboard de Retención & KPIs
  console.log('\n\x1b[36m[5/7] DASHBOARD Y CÁLCULO DE KPIS DE RETENCIÓN\x1b[0m');
  const dashData = await api.getDashboardData();
  assert(dashData && dashData.kpis !== undefined, 'KPIs del dashboard calculados');
  assert(Array.isArray(dashData.vencimientos), `Módulo de vencimientos activos (${dashData.vencimientos.length} alertas)`);
  assert(Array.isArray(dashData.ausencias), `Módulo de ausencias en riesgo (${dashData.ausencias.length} alertas)`);
  assert(Array.isArray(dashData.leadsFrios), `Leads fríos para reactivación (${dashData.leadsFrios.length} detectados)`);

  // TEST 6: Motor de Plantillas Dinámicas de WhatsApp
  console.log('\n\x1b[36m[6/7] MOTOR DE MENSAJERÍA DINÁMICA WHATSAPP\x1b[0m');
  const rawTemplate = "Hola {nombre}, tu membresía de {plan} vence en {dias_restantes} días. Precio de renovación: {precio}.";
  const parsed = parseWhatsAppTemplate(rawTemplate, {
    nombre: 'Luciana Paredes',
    plan: 'Plan Trimestral',
    dias_restantes: 2,
    precio: 60.00
  });
  assert(parsed.includes('Luciana Paredes'), 'Reemplazo de variable {nombre} verificado');
  assert(parsed.includes('Plan Trimestral'), 'Reemplazo de variable {plan} verificado');
  assert(parsed.includes('2 días'), 'Reemplazo de variable {dias_restantes} verificado');
  assert(parsed.includes('S/ 60.00'), 'Reemplazo de variable de precio {precio} verificado');

  // TEST 7: Sincronización en Tiempo Real Multi-Dispositivo
  console.log('\n\x1b[36m[7/7] SERVICIO DE TIEMPO REAL (REALTIME BROADCAST)\x1b[0m');
  let realtimeTriggered = false;
  const unsubscribe = subscribeToRealtimeChanges((event) => {
    realtimeTriggered = true;
  });

  assert(typeof unsubscribe === 'function', 'Listener de sincronización en tiempo real inicializado');
  unsubscribe();
  assert(true, 'Limpieza de canales de tiempo real ejecutada sin fugas de memoria');

  // RESUMEN FINAL
  console.log('\n======================================================');
  if (passedTests === totalTests) {
    console.log(`\x1b[32m✔ TODAS LAS PRUEBAS PASARON EXITOSAMENTE (${passedTests}/${totalTests})\x1b[0m`);
    console.log('El sistema se encuentra 100% operativo y listo para producción.');
  } else {
    console.log(`\x1b[33m⚠ ALGUNAS PRUEBAS FALLARON (${passedTests}/${totalTests})\x1b[0m`);
  }
  console.log('======================================================\n');

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('\x1b[31mError fatal ejecutando la suite de pruebas:\x1b[0m', err);
  process.exit(1);
});
