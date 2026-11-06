-- ==============================================================================
-- SISTEMA INTEGRAL DE GESTIÓN Y RETENCIÓN PARA GIMNASIOS (GYM-CRM & ERP)
-- SCRIPT DE INICIALIZACIÓN IDEMPOTENTE (ONE-CLICK SUPABASE SETUP)
-- Zona Horaria de Referencia: America/Lima (Perú)
-- ==============================================================================

-- 1. Habilitar extensiones requeridas
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 2. CREACIÓN DE TABLAS PRINCIPALES
-- ==============================================================================

-- 2.1. Tabla: clientes (Socias / Usuarios)
CREATE TABLE IF NOT EXISTS clientes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dni VARCHAR(15) UNIQUE NOT NULL,
    nombre_completo VARCHAR(150) NOT NULL,
    telefono VARCHAR(20) NOT NULL,
    fecha_nacimiento DATE,
    contacto_emergencia VARCHAR(150),
    observaciones_medicas TEXT,
    ultima_asistencia TIMESTAMP WITH TIME ZONE,
    estado_ciclo_vida VARCHAR(30) DEFAULT 'ACTIVA' 
        CHECK (estado_ciclo_vida IN ('ACTIVA', 'EN_RIESGO_AUSENCIA', 'POR_VENCER', 'VENCIDA', 'LEAD_FRIO', 'CONGELADA')),
    intentos_recuperacion INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2.2. Tabla: planes
CREATE TABLE IF NOT EXISTS planes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(100) NOT NULL,
    duracion_dias INT NOT NULL CHECK (duracion_dias > 0),
    precio NUMERIC(10,2) NOT NULL CHECK (precio >= 0),
    servicios_incluidos JSONB DEFAULT '[]'::jsonb,
    dias_congelamiento_permitidos INT DEFAULT 0,
    es_promocion BOOLEAN DEFAULT FALSE,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2.3. Tabla: suscripciones
CREATE TABLE IF NOT EXISTS suscripciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES planes(id),
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    precio_pactado NUMERIC(10,2) NOT NULL,
    monto_pagado NUMERIC(10,2) NOT NULL,
    saldo_pendiente NUMERIC(10,2) DEFAULT 0.00,
    metodo_pago VARCHAR(30) NOT NULL CHECK (metodo_pago IN ('YAPE', 'PLIN', 'EFECTIVO', 'TARJETA', 'MIXTO')),
    dias_congelados_usados INT DEFAULT 0,
    estado VARCHAR(20) DEFAULT 'ACTIVA' CHECK (estado IN ('ACTIVA', 'VENCIDA', 'CONGELADA', 'CANCELADA')),
    whatsapp_bienvenida_confirmado BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2.4. Tabla: asistencias (Check-in Kiosco)
CREATE TABLE IF NOT EXISTS asistencias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
    suscripcion_id UUID REFERENCES suscripciones(id) ON DELETE SET NULL,
    fecha_hora_entrada TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    alerta_mostrada VARCHAR(50) DEFAULT 'OK_ACTIVA'
);

-- 2.5. Tabla: plantillas_whatsapp
CREATE TABLE IF NOT EXISTS plantillas_whatsapp (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo_evento VARCHAR(50) UNIQUE NOT NULL,
    titulo_panel VARCHAR(100) NOT NULL,
    contenido_plantilla TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2.6. Tabla: notificaciones_whatsapp_log
CREATE TABLE IF NOT EXISTS notificaciones_whatsapp_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE,
    tipo_evento VARCHAR(50) NOT NULL,
    mensaje_enviado TEXT NOT NULL,
    confirmado_entregado BOOLEAN DEFAULT TRUE,
    fecha_envio TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2.7. Tabla: progreso_fisico
CREATE TABLE IF NOT EXISTS progreso_fisico (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
    fecha_registro DATE DEFAULT CURRENT_DATE,
    peso_kg NUMERIC(5,2),
    cintura_cm NUMERIC(5,2),
    cadera_cm NUMERIC(5,2),
    brazo_cm NUMERIC(5,2),
    pierna_cm NUMERIC(5,2),
    porcentaje_grasa NUMERIC(4,2),
    notas TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2.8. Tabla: caja_movimientos (POS / Ventas Diarias)
CREATE TABLE IF NOT EXISTS caja_movimientos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fecha_hora TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    tipo_movimiento VARCHAR(20) DEFAULT 'INGRESO' CHECK (tipo_movimiento IN ('INGRESO', 'EGRESO')),
    concepto VARCHAR(150) NOT NULL,
    monto NUMERIC(10,2) NOT NULL,
    metodo_pago VARCHAR(30) NOT NULL CHECK (metodo_pago IN ('YAPE', 'PLIN', 'EFECTIVO', 'TARJETA')),
    cliente_id UUID REFERENCES clientes(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================================================
-- 3. ÍNDICES DE RENDIMIENTO
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_clientes_dni ON clientes(dni);
CREATE INDEX IF NOT EXISTS idx_clientes_estado ON clientes(estado_ciclo_vida);
CREATE INDEX IF NOT EXISTS idx_clientes_ultima_asistencia ON clientes(ultima_asistencia);
CREATE INDEX IF NOT EXISTS idx_suscripciones_cliente ON suscripciones(cliente_id);
CREATE INDEX IF NOT EXISTS idx_suscripciones_estado_fechas ON suscripciones(estado, fecha_fin);
CREATE INDEX IF NOT EXISTS idx_asistencias_cliente ON asistencias(cliente_id, fecha_hora_entrada DESC);
CREATE INDEX IF NOT EXISTS idx_caja_fecha ON caja_movimientos(fecha_hora);

-- ==============================================================================
-- 4. VISTAS INTELIGENTES DE NEGOCIO (LÓGICA AUTOMÁTICA EN POSTGRESQL)
-- ==============================================================================

-- 4.1. Vista: Alertas de Vencimiento (<= 3 días hasta 0 días)
CREATE OR REPLACE VIEW vista_alertas_vencimiento AS
SELECT 
    c.id AS cliente_id,
    c.dni,
    c.nombre_completo,
    c.telefono,
    c.estado_ciclo_vida,
    c.intentos_recuperacion,
    s.id AS suscripcion_id,
    p.nombre AS plan_nombre,
    p.precio AS plan_precio,
    s.fecha_inicio,
    s.fecha_fin,
    s.saldo_pendiente,
    (s.fecha_fin - (CURRENT_TIMESTAMP AT TIME ZONE 'America/Lima')::date) AS dias_restantes,
    CASE 
        WHEN (s.fecha_fin - (CURRENT_TIMESTAMP AT TIME ZONE 'America/Lima')::date) < 0 THEN 'VENCIDA'
        WHEN (s.fecha_fin - (CURRENT_TIMESTAMP AT TIME ZONE 'America/Lima')::date) = 0 THEN 'VENCE_HOY'
        WHEN (s.fecha_fin - (CURRENT_TIMESTAMP AT TIME ZONE 'America/Lima')::date) = 1 THEN 'VENCE_1_DIA'
        WHEN (s.fecha_fin - (CURRENT_TIMESTAMP AT TIME ZONE 'America/Lima')::date) = 2 THEN 'VENCE_2_DIAS'
        WHEN (s.fecha_fin - (CURRENT_TIMESTAMP AT TIME ZONE 'America/Lima')::date) = 3 THEN 'VENCE_3_DIAS'
        ELSE 'POR_VENCER'
    END AS estado_alerta,
    (
        SELECT COUNT(*) 
        FROM notificaciones_whatsapp_log n 
        WHERE n.cliente_id = c.id 
          AND n.fecha_envio::date = (CURRENT_TIMESTAMP AT TIME ZONE 'America/Lima')::date
    ) > 0 AS notificada_hoy
FROM suscripciones s
INNER JOIN clientes c ON s.cliente_id = c.id
INNER JOIN planes p ON s.plan_id = p.id
WHERE s.estado = 'ACTIVA'
  AND (s.fecha_fin - (CURRENT_TIMESTAMP AT TIME ZONE 'America/Lima')::date) BETWEEN -7 AND 3
ORDER BY dias_restantes ASC;

-- 4.2. Vista: Alerta de Inasistencia / Retención ("Te Extrañamos" - 3 a 5+ días)
CREATE OR REPLACE VIEW vista_alertas_inasistencia AS
SELECT 
    c.id AS cliente_id,
    c.dni,
    c.nombre_completo,
    c.telefono,
    c.ultima_asistencia,
    c.intentos_recuperacion,
    s.id AS suscripcion_id,
    p.nombre AS plan_nombre,
    s.fecha_fin,
    COALESCE(
        ((CURRENT_TIMESTAMP AT TIME ZONE 'America/Lima')::date - (c.ultima_asistencia AT TIME ZONE 'America/Lima')::date),
        ((CURRENT_TIMESTAMP AT TIME ZONE 'America/Lima')::date - s.fecha_inicio)
    ) AS dias_sin_asistir,
    (
        SELECT COUNT(*) 
        FROM notificaciones_whatsapp_log n 
        WHERE n.cliente_id = c.id 
          AND n.tipo_evento = 'AUSENCIA_3_5_DIAS'
          AND n.fecha_envio::date = (CURRENT_TIMESTAMP AT TIME ZONE 'America/Lima')::date
    ) > 0 AS notificada_hoy
FROM clientes c
INNER JOIN suscripciones s ON s.cliente_id = c.id AND s.estado = 'ACTIVA'
INNER JOIN planes p ON s.plan_id = p.id
WHERE s.fecha_fin >= (CURRENT_TIMESTAMP AT TIME ZONE 'America/Lima')::date
  AND COALESCE(
        ((CURRENT_TIMESTAMP AT TIME ZONE 'America/Lima')::date - (c.ultima_asistencia AT TIME ZONE 'America/Lima')::date),
        ((CURRENT_TIMESTAMP AT TIME ZONE 'America/Lima')::date - s.fecha_inicio)
      ) >= 3
ORDER BY dias_sin_asistir DESC;

-- 4.3. Vista: Leads Fríos (Para Campañas y Promociones)
CREATE OR REPLACE VIEW vista_leads_frios AS
SELECT 
    c.id AS cliente_id,
    c.dni,
    c.nombre_completo,
    c.telefono,
    c.estado_ciclo_vida,
    c.intentos_recuperacion,
    c.ultima_asistencia,
    COALESCE(MAX(s.fecha_fin), c.created_at::date) AS ultima_fecha_fin,
    ((CURRENT_TIMESTAMP AT TIME ZONE 'America/Lima')::date - COALESCE(MAX(s.fecha_fin), c.created_at::date)) AS dias_inactiva,
    (
        SELECT COUNT(*) 
        FROM notificaciones_whatsapp_log n 
        WHERE n.cliente_id = c.id 
          AND n.tipo_evento = 'PROMOCION_LEAD_FRIO'
    ) AS promos_recibidas
FROM clientes c
LEFT JOIN suscripciones s ON c.id = s.cliente_id
WHERE c.estado_ciclo_vida = 'LEAD_FRIO'
   OR (
       c.id NOT IN (SELECT cliente_id FROM suscripciones WHERE estado = 'ACTIVA' AND fecha_fin >= (CURRENT_TIMESTAMP AT TIME ZONE 'America/Lima')::date)
       AND (
           c.intentos_recuperacion >= 3 
           OR ((CURRENT_TIMESTAMP AT TIME ZONE 'America/Lima')::date - COALESCE(s.fecha_fin, c.created_at::date)) > 15
       )
   )
GROUP BY c.id, c.dni, c.nombre_completo, c.telefono, c.estado_ciclo_vida, c.intentos_recuperacion, c.ultima_asistencia, c.created_at
ORDER BY dias_inactiva DESC;

-- 4.4. Vista: Resumen Ejecutivo / Dashboard KPIs
CREATE OR REPLACE VIEW vista_kpis_dashboard AS
SELECT 
    (SELECT COUNT(*) FROM suscripciones WHERE estado = 'ACTIVA' AND fecha_fin >= (CURRENT_TIMESTAMP AT TIME ZONE 'America/Lima')::date) AS total_activas,
    (SELECT COUNT(*) FROM vista_alertas_vencimiento WHERE dias_restantes BETWEEN 0 AND 3) AS por_vencer_3dias,
    (SELECT COUNT(*) FROM vista_alertas_inasistencia) AS ausentes_3a5dias,
    (SELECT COUNT(*) FROM vista_leads_frios) AS total_leads_frios,
    (SELECT COUNT(*) FROM asistencias WHERE fecha_hora_entrada::date = (CURRENT_TIMESTAMP AT TIME ZONE 'America/Lima')::date) AS asistencias_hoy,
    COALESCE((
        SELECT SUM(monto) 
        FROM caja_movimientos 
        WHERE tipo_movimiento = 'INGRESO' 
          AND fecha_hora::date = (CURRENT_TIMESTAMP AT TIME ZONE 'America/Lima')::date
    ), 0.00) AS total_ingresos_hoy,
    COALESCE((
        SELECT SUM(monto) 
        FROM caja_movimientos 
        WHERE tipo_movimiento = 'INGRESO' 
          AND metodo_pago IN ('YAPE', 'PLIN')
          AND fecha_hora::date = (CURRENT_TIMESTAMP AT TIME ZONE 'America/Lima')::date
    ), 0.00) AS digital_hoy,
    COALESCE((
        SELECT SUM(monto) 
        FROM caja_movimientos 
        WHERE tipo_movimiento = 'INGRESO' 
          AND metodo_pago = 'EFECTIVO'
          AND fecha_hora::date = (CURRENT_TIMESTAMP AT TIME ZONE 'America/Lima')::date
    ), 0.00) AS efectivo_hoy;

-- ==============================================================================
-- 5. FUNCIONES RPC (LÓGICA TRANSACCIONAL DE NEGOCIO)
-- ==============================================================================

-- 5.1. RPC: Check-in por DNI en Modo Kiosco
CREATE OR REPLACE FUNCTION registrar_asistencia_kiosk(p_dni VARCHAR)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    v_cliente RECORD;
    v_suscripcion RECORD;
    v_hoy DATE := (CURRENT_TIMESTAMP AT TIME ZONE 'America/Lima')::date;
    v_dias_restantes INT;
    v_resultado JSONB;
    v_alerta VARCHAR(50);
BEGIN
    -- 1. Buscar socia
    SELECT * INTO v_cliente FROM clientes WHERE dni = TRIM(p_dni) LIMIT 1;
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'ok', false,
            'codigo', 'NO_REGISTRADA',
            'mensaje', 'DNI no encontrado en el sistema. Acércate a recepción.',
            'semaforo', 'ROJO'
        );
    END IF;

    -- 2. Buscar última suscripción
    SELECT s.*, p.nombre AS plan_nombre 
    INTO v_suscripcion 
    FROM suscripciones s
    JOIN planes p ON s.plan_id = p.id
    WHERE s.cliente_id = v_cliente.id
    ORDER BY s.fecha_fin DESC
    LIMIT 1;

    -- Si nunca tuvo suscripción
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'ok', false,
            'codigo', 'SIN_PLAN',
            'nombre', v_cliente.nombre_completo,
            'mensaje', 'No tienes una suscripción registrada. Acércate a recepción.',
            'semaforo', 'ROJO'
        );
    END IF;

    v_dias_restantes := (v_suscripcion.fecha_fin - v_hoy);

    -- 3. Evaluar estado de membresía
    IF v_suscripcion.estado = 'CONGELADA' THEN
        v_alerta := 'MEMBRESIA_CONGELADA';
        RETURN jsonb_build_object(
            'ok', false,
            'codigo', 'CONGELADA',
            'nombre', v_cliente.nombre_completo,
            'plan', v_suscripcion.plan_nombre,
            'mensaje', 'Tu membresía se encuentra en periodo de congelamiento.',
            'semaforo', 'AMBAR'
        );
    ELSIF v_dias_restantes < 0 OR v_suscripcion.estado = 'VENCIDA' THEN
        v_alerta := 'MEMBRESIA_VENCIDA';
        -- Marcar cliente vencido
        UPDATE clientes SET estado_ciclo_vida = 'VENCIDA' WHERE id = v_cliente.id;
        
        RETURN jsonb_build_object(
            'ok', false,
            'codigo', 'VENCIDA',
            'nombre', v_cliente.nombre_completo,
            'plan', v_suscripcion.plan_nombre,
            'dias_vencida', ABS(v_dias_restantes),
            'fecha_fin', v_suscripcion.fecha_fin,
            'mensaje', 'Tu membresía venció hace ' || ABS(v_dias_restantes) || ' día(s). Por favor renueva en recepción.',
            'semaforo', 'ROJO'
        );
    ELSIF v_dias_restantes <= 3 THEN
        -- Vence pronto (Ámbar) pero SÍ puede ingresar
        v_alerta := 'ALERTA_POR_VENCER';
        
        -- Registrar check-in
        INSERT INTO asistencias (cliente_id, suscripcion_id, alerta_mostrada)
        VALUES (v_cliente.id, v_suscripcion.id, v_alerta);

        -- Actualizar última asistencia y estado
        UPDATE clientes 
        SET ultima_asistencia = NOW(), 
            estado_ciclo_vida = 'POR_VENCER',
            intentos_recuperacion = 0
        WHERE id = v_cliente.id;

        RETURN jsonb_build_object(
            'ok', true,
            'codigo', 'POR_VENCER',
            'nombre', v_cliente.nombre_completo,
            'plan', v_suscripcion.plan_nombre,
            'dias_restantes', v_dias_restantes,
            'fecha_fin', v_suscripcion.fecha_fin,
            'saldo_pendiente', v_suscripcion.saldo_pendiente,
            'mensaje', CASE 
                WHEN v_dias_restantes = 0 THEN '¡Bienvenida! Tu membresía vence HOY. No olvides renovar en recepción.'
                ELSE '¡Bienvenida! Te quedan ' || v_dias_restantes || ' día(s) de membresía. ¡Recuerda renovar pronto!'
            END,
            'semaforo', 'AMBAR'
        );
    ELSE
        -- Todo en orden (Verde)
        v_alerta := 'ACCESO_CORRECTO';
        
        INSERT INTO asistencias (cliente_id, suscripcion_id, alerta_mostrada)
        VALUES (v_cliente.id, v_suscripcion.id, v_alerta);

        UPDATE clientes 
        SET ultima_asistencia = NOW(), 
            estado_ciclo_vida = 'ACTIVA',
            intentos_recuperacion = 0
        WHERE id = v_cliente.id;

        RETURN jsonb_build_object(
            'ok', true,
            'codigo', 'ACTIVA',
            'nombre', v_cliente.nombre_completo,
            'plan', v_suscripcion.plan_nombre,
            'dias_restantes', v_dias_restantes,
            'fecha_fin', v_suscripcion.fecha_fin,
            'mensaje', '¡Bienvenida a entrenar! Te quedan ' || v_dias_restantes || ' días de suscripción.',
            'semaforo', 'VERDE'
        );
    END IF;
END;
$$;

-- 5.2. RPC: Registrar Intento de Insistencia / Notificación WhatsApp
CREATE OR REPLACE FUNCTION registrar_insistencia_whatsapp(
    p_cliente_id UUID,
    p_tipo_evento VARCHAR,
    p_mensaje TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    v_nuevos_intentos INT;
    v_nuevo_estado VARCHAR(30);
BEGIN
    -- Guardar log de mensaje
    INSERT INTO notificaciones_whatsapp_log (cliente_id, tipo_evento, mensaje_enviado, confirmado_entregado)
    VALUES (p_cliente_id, p_tipo_evento, p_mensaje, TRUE);

    -- Incrementar contador de intentos de insistencia
    UPDATE clientes 
    SET intentos_recuperacion = intentos_recuperacion + 1
    WHERE id = p_cliente_id
    RETURNING intentos_recuperacion, estado_ciclo_vida INTO v_nuevos_intentos, v_nuevo_estado;

    -- Si llega a 3 intentos o más sin respuesta, pasa a LEAD_FRIO
    IF v_nuevos_intentos >= 3 AND v_nuevo_estado != 'ACTIVA' THEN
        UPDATE clientes 
        SET estado_ciclo_vida = 'LEAD_FRIO'
        WHERE id = p_cliente_id;
        v_nuevo_estado := 'LEAD_FRIO';
    END IF;

    RETURN jsonb_build_object(
        'ok', true,
        'intentos_recuperacion', v_nuevos_intentos,
        'estado_ciclo_vida', v_nuevo_estado
    );
END;
$$;

-- 5.3. RPC: Congelar Membresía por X días
CREATE OR REPLACE FUNCTION congelar_suscripcion(
    p_suscripcion_id UUID,
    p_dias INT
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    v_suscripcion RECORD;
    v_nueva_fecha_fin DATE;
BEGIN
    SELECT * INTO v_suscripcion FROM suscripciones WHERE id = p_suscripcion_id;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('ok', false, 'mensaje', 'Suscripción no encontrada');
    END IF;

    v_nueva_fecha_fin := v_suscripcion.fecha_fin + p_dias;

    UPDATE suscripciones 
    SET fecha_fin = v_nueva_fecha_fin,
        dias_congelados_usados = dias_congelados_usados + p_dias,
        estado = 'ACTIVA'
    WHERE id = p_suscripcion_id;

    UPDATE clientes 
    SET estado_ciclo_vida = 'ACTIVA' 
    WHERE id = v_suscripcion.cliente_id;

    RETURN jsonb_build_object(
        'ok', true,
        'dias_agregados', p_dias,
        'nueva_fecha_fin', v_nueva_fecha_fin
    );
END;
$$;

-- 5.4. RPC: Mover Manualmente a Lead Frío
CREATE OR REPLACE FUNCTION mover_a_lead_frio(p_cliente_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE clientes 
    SET estado_ciclo_vida = 'LEAD_FRIO'
    WHERE id = p_cliente_id;

    RETURN jsonb_build_object('ok', true, 'estado', 'LEAD_FRIO');
END;
$$;

-- ==============================================================================
-- 6. POLÍTICAS DE ACCESO (ROW LEVEL SECURITY - RLS PORTABLE)
-- ==============================================================================
-- Para permitir portabilidad multi-cuenta sin fricción, se configuran accesos públicos/anon.
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE planes ENABLE ROW LEVEL SECURITY;
ALTER TABLE suscripciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE asistencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE plantillas_whatsapp ENABLE ROW LEVEL SECURITY;
ALTER TABLE notificaciones_whatsapp_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE progreso_fisico ENABLE ROW LEVEL SECURITY;
ALTER TABLE caja_movimientos ENABLE ROW LEVEL SECURITY;

-- Políticas de acceso completo para el frontend
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'acceso_total_clientes') THEN
        CREATE POLICY acceso_total_clientes ON clientes FOR ALL USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'acceso_total_planes') THEN
        CREATE POLICY acceso_total_planes ON planes FOR ALL USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'acceso_total_suscripciones') THEN
        CREATE POLICY acceso_total_suscripciones ON suscripciones FOR ALL USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'acceso_total_asistencias') THEN
        CREATE POLICY acceso_total_asistencias ON asistencias FOR ALL USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'acceso_total_plantillas') THEN
        CREATE POLICY acceso_total_plantillas ON plantillas_whatsapp FOR ALL USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'acceso_total_notif_log') THEN
        CREATE POLICY acceso_total_notif_log ON notificaciones_whatsapp_log FOR ALL USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'acceso_total_progreso') THEN
        CREATE POLICY acceso_total_progreso ON progreso_fisico FOR ALL USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'acceso_total_caja') THEN
        CREATE POLICY acceso_total_caja ON caja_movimientos FOR ALL USING (true) WITH CHECK (true);
    END IF;
END $$;

-- ==============================================================================
-- 7. SEED DATA (DATOS BASE INICIALES)
-- ==============================================================================

-- 7.1. Los 4 Planes Base del Gimnasio + Plan Promoción Leads Fríos
INSERT INTO planes (nombre, duracion_dias, precio, servicios_incluidos, dias_congelamiento_permitidos, es_promocion, activo)
VALUES 
(
    'Plan Mensual', 
    30, 
    40.00, 
    '["Acceso libre a sala de máquinas", "Zona cardiovascular", "Casilleros y vestidores", "Rutina introductoria personalizada"]'::jsonb, 
    0, 
    FALSE, 
    TRUE
),
(
    'Plan Trimestral', 
    90, 
    60.00, 
    '["Acceso total a máquinas y pesas", "Clases grupales (Baile / Funcional)", "1 Asesoría de nutrición", "3 días de congelamiento libre"]'::jsonb, 
    3, 
    FALSE, 
    TRUE
),
(
    'Plan Semestral', 
    180, 
    100.00, 
    '["Acceso libre Full Time", "Clases grupales ilimitadas", "Evaluación y control mensual de medidas", "7 días de congelamiento libre"]'::jsonb, 
    7, 
    FALSE, 
    TRUE
),
(
    'Plan Anual VIP', 
    365, 
    150.00, 
    '["Acceso VIP Total 365 días", "Todas las clases y talleres", "Evaluación corporal bimestral", "15 días de congelamiento libre", "1 Pase de cortesía mensual para invitada"]'::jsonb, 
    15, 
    FALSE, 
    TRUE
),
(
    'Promo Retorno Flash (Leads Fríos)', 
    90, 
    50.00, 
    '["Reactivación con matrícula 100% gratis", "Acceso total a máquinas y cardio", "Clases grupales incluidas", "Rutina express de re-adaptación"]'::jsonb, 
    0, 
    TRUE, 
    TRUE
)
ON CONFLICT DO NOTHING;

-- 7.2. Las 7 Plantillas Base de WhatsApp
INSERT INTO plantillas_whatsapp (codigo_evento, titulo_panel, contenido_plantilla)
VALUES 
(
    'BIENVENIDA_SUSCRIPCION',
    'Bienvenida / Activación de Membresía',
    '¡Hola {nombre}! 🏋️‍♀️✨ ¡Bienvenida oficial a nuestro Gimnasio! Tu {plan} ha sido activado con éxito desde el {fecha_inicio} hasta el {fecha_fin}. Incluye: {servicios}. Recuerda ingresar digitando tu DNI ({dni}) en la pantalla de recepción. ¡Estamos listas para acompañarte a cumplir tus metas! 💪🔥'
),
(
    'VENCE_3_DIAS',
    'Aviso Preventivo: Faltan 3 Días',
    '¡Hola {nombre}! Esperamos que estés teniendo una excelente semana 🌟 Te recordamos que a tu {plan} le quedan solo {dias_restantes} días (vence el {fecha_fin}). ¡Renueva hoy mismo en recepción o por Yape/Plin para no perder tu ritmo de entrenamiento ni tu tarifa! 🏋️‍♀️✨'
),
(
    'VENCE_2_DIAS',
    'Aviso: Faltan 2 Días / Mañana',
    '¡Hola {nombre}! 👋 Tu membresía ({plan}) está por culminar en {dias_restantes} días ({fecha_fin}). Mantén tu hábito y no dejes enfriar tu progreso. Acércate hoy a recepción para asegurar tu renovación. ¡Tu bienestar es prioridad! 💛'
),
(
    'VENCE_HOY',
    'Aviso Urgente: Vence Hoy (Último Día)',
    '¡Atención {nombre}! ⚠️ ¡Hoy {fecha_fin} es el último día de tu {plan}! Queremos que continúes firme y no pierdas ni un solo día de tus metas. Pasa hoy por recepción o respóndenos por aquí para renovar al instante por Yape/Plin. ¡No te detengas! 🚀💥'
),
(
    'MEMBRESIA_VENCIDA',
    'Membresía Vencida (Invitación a Renovar)',
    '¡Hola {nombre}! Notamos que tu membresía culminó el {fecha_fin}. Sabemos lo ocupadas que pueden ser las semanas, pero tu salud y energía merecen ese espacio. Te tenemos reservada tu vacante con beneficio especial si renuevas esta semana. ¿Cuándo vienes a entrenar? 💪😊'
),
(
    'AUSENCIA_3_5_DIAS',
    'Alerta Retención: Te Extrañamos (3 a 5+ Días Ausente)',
    '¡Hola {nombre}! 💛 Te extrañamos mucho en el gimnasio, hace {dias_sin_asistir} días que no te vemos por aquí. ¿Todo bien con tu rutina? Recuerda que la constancia es el verdadero secreto. ¡Tu espacio y tu energía hacen falta en la sala! Vente hoy aunque sea 40 minutos a moverte 🏋️‍♀️✨'
),
(
    'PROMOCION_LEAD_FRIO',
    'Oferta Especial de Reactivación (Leads Fríos)',
    '¡Hola {nombre}! 👋 Tenemos una gran noticia para ti: ¡Queremos verte de regreso entrenando! Te habilitamos la promoción exclusiva: *{promo_nombre}* a solo *S/ {promo_precio}*. Incluye: {servicios}. Promoción válida por pocos cupos. ¿Te reservamos el tuyo hoy mismo? 🎁🔥'
)
ON CONFLICT (codigo_evento) DO UPDATE 
SET titulo_panel = EXCLUDED.titulo_panel,
    contenido_plantilla = EXCLUDED.contenido_plantilla,
    updated_at = NOW();

-- 7.3. Socias Demostrativas (Casos reales para probar inmediatamente)
INSERT INTO clientes (dni, nombre_completo, telefono, fecha_nacimiento, contacto_emergencia, observaciones_medicas, ultima_asistencia, estado_ciclo_vida, intentos_recuperacion)
VALUES 
(
    '47895612', 
    'Luciana Paredes Vega', 
    '51994512300', 
    '1995-04-12', 
    'Carlos Paredes (Hermano) - 987654321', 
    'Sin restricciones. Ninguna lesión.', 
    NOW() - INTERVAL '4 hours', 
    'ACTIVA', 
    0
),
(
    '72145896', 
    'Valeria Ramos Montes', 
    '51982145780', 
    '1998-08-23', 
    'Rosa Montes (Mamá) - 984512789', 
    'Tendinitis leve en rodilla derecha.', 
    NOW() - INTERVAL '1 day', 
    'POR_VENCER', 
    0
),
(
    '45127896', 
    'Camila Flores Salazar', 
    '51976543210', 
    '1992-11-05', 
    'Jorge Flores (Esposo) - 974125896', 
    'Hipertensión controlada.', 
    NOW() - INTERVAL '4 days', 
    'EN_RIESGO_AUSENCIA', 
    1
),
(
    '70985412', 
    'Andrea Morales Castro', 
    '51987456123', 
    '2000-02-14', 
    'Elena Castro - 991245789', 
    'Ninguna.', 
    NOW() - INTERVAL '5 days', 
    'EN_RIESGO_AUSENCIA', 
    2
),
(
    '43258741', 
    'Mariana Silva Quispe', 
    '51963258741', 
    '1990-09-30', 
    'Manuel Silva - 963147852', 
    'Lumbalgia ocasional.', 
    NOW() - INTERVAL '22 days', 
    'LEAD_FRIO', 
    3
),
(
    '48963214', 
    'Daniela Gómez Mendoza', 
    '51951478963', 
    '1996-06-18', 
    'Carla Gómez - 958741236', 
    'Asma controlada.', 
    NOW() - INTERVAL '30 days', 
    'LEAD_FRIO', 
    4
)
ON CONFLICT (dni) DO NOTHING;

-- 7.4. Suscripciones Demostrativas
DO $$
DECLARE
    v_plan_mensual UUID;
    v_plan_trimestral UUID;
    v_plan_semestral UUID;
    v_cliente_luciana UUID;
    v_cliente_valeria UUID;
    v_cliente_camila UUID;
    v_cliente_andrea UUID;
    v_cliente_mariana UUID;
    v_hoy DATE := (CURRENT_TIMESTAMP AT TIME ZONE 'America/Lima')::date;
BEGIN
    SELECT id INTO v_plan_mensual FROM planes WHERE nombre = 'Plan Mensual' LIMIT 1;
    SELECT id INTO v_plan_trimestral FROM planes WHERE nombre = 'Plan Trimestral' LIMIT 1;
    SELECT id INTO v_plan_semestral FROM planes WHERE nombre = 'Plan Semestral' LIMIT 1;

    SELECT id INTO v_cliente_luciana FROM clientes WHERE dni = '47895612';
    SELECT id INTO v_cliente_valeria FROM clientes WHERE dni = '72145896';
    SELECT id INTO v_cliente_camila FROM clientes WHERE dni = '45127896';
    SELECT id INTO v_cliente_andrea FROM clientes WHERE dni = '70985412';
    SELECT id INTO v_cliente_mariana FROM clientes WHERE dni = '43258741';

    -- Luciana: Activa al día (vence en 20 días)
    IF v_cliente_luciana IS NOT NULL THEN
        INSERT INTO suscripciones (cliente_id, plan_id, fecha_inicio, fecha_fin, precio_pactado, monto_pagado, saldo_pendiente, metodo_pago, estado, whatsapp_bienvenida_confirmado)
        VALUES (v_cliente_luciana, v_plan_trimestral, v_hoy - 10, v_hoy + 20, 60.00, 60.00, 0.00, 'YAPE', 'ACTIVA', TRUE)
        ON CONFLICT DO NOTHING;
    END IF;

    -- Valeria: Vence en 2 días (Alerta Vencimiento)
    IF v_cliente_valeria IS NOT NULL THEN
        INSERT INTO suscripciones (cliente_id, plan_id, fecha_inicio, fecha_fin, precio_pactado, monto_pagado, saldo_pendiente, metodo_pago, estado, whatsapp_bienvenida_confirmado)
        VALUES (v_cliente_valeria, v_plan_mensual, v_hoy - 28, v_hoy + 2, 40.00, 40.00, 0.00, 'PLIN', 'ACTIVA', TRUE)
        ON CONFLICT DO NOTHING;
    END IF;

    -- Camila: Ausente hace 4 días (Alerta Inasistencia)
    IF v_cliente_camila IS NOT NULL THEN
        INSERT INTO suscripciones (cliente_id, plan_id, fecha_inicio, fecha_fin, precio_pactado, monto_pagado, saldo_pendiente, metodo_pago, estado, whatsapp_bienvenida_confirmado)
        VALUES (v_cliente_camila, v_plan_semestral, v_hoy - 40, v_hoy + 50, 100.00, 100.00, 0.00, 'EFECTIVO', 'ACTIVA', TRUE)
        ON CONFLICT DO NOTHING;
    END IF;

    -- Andrea: Ausente hace 5 días y vence mañana (Doble atención)
    IF v_cliente_andrea IS NOT NULL THEN
        INSERT INTO suscripciones (cliente_id, plan_id, fecha_inicio, fecha_fin, precio_pactado, monto_pagado, saldo_pendiente, metodo_pago, estado, whatsapp_bienvenida_confirmado)
        VALUES (v_cliente_andrea, v_plan_mensual, v_hoy - 29, v_hoy + 1, 40.00, 30.00, 10.00, 'YAPE', 'ACTIVA', TRUE)
        ON CONFLICT DO NOTHING;
    END IF;

    -- Mariana: Vencida hace 20 días (Lead Frío)
    IF v_cliente_mariana IS NOT NULL THEN
        INSERT INTO suscripciones (cliente_id, plan_id, fecha_inicio, fecha_fin, precio_pactado, monto_pagado, saldo_pendiente, metodo_pago, estado, whatsapp_bienvenida_confirmado)
        VALUES (v_cliente_mariana, v_plan_mensual, v_hoy - 50, v_hoy - 20, 40.00, 40.00, 0.00, 'EFECTIVO', 'VENCIDA', TRUE)
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- 7.5. Caja Inicial del Día
INSERT INTO caja_movimientos (tipo_movimiento, concepto, monto, metodo_pago)
VALUES 
('INGRESO', 'Renovación Plan Trimestral (Luciana Paredes)', 60.00, 'YAPE'),
('INGRESO', 'Agua Mineral San Luis 625ml', 2.00, 'EFECTIVO'),
('INGRESO', 'Rehidratante Sporade 500ml', 5.00, 'PLIN'),
('INGRESO', 'Batido de Proteína Whey Isolate', 8.00, 'YAPE'),
('INGRESO', 'Pase Diario de Entrenamiento', 5.00, 'EFECTIVO')
ON CONFLICT DO NOTHING;

-- ==============================================================================
-- 8. REPLICACIÓN REALTIME (SINCRONIZACIÓN MULTI-DISPOSITIVO EN TIEMPO REAL)
-- ==============================================================================
-- Transmite cada marcación de check-in, cobro o membresía a todos los dispositivos conectados
DO $$
BEGIN
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE asistencias;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE suscripciones;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE clientes;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE caja_movimientos;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE planes;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
END $$;

