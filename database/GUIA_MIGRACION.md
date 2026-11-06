# 🚀 GUÍA DE INSTALACIÓN Y MIGRACIÓN EN 2 MINUTOS ("One-Click Supabase Setup")

Este sistema fue diseñado con una **Arquitectura Multi-Cuenta Descentralizada**. No necesitas pagar un servidor central ni bases de datos costosas. Cada gimnasio o cliente puede tener su propio proyecto **100% gratuito** en Supabase usando su propia cuenta de Google.

---

## 📋 Pasos para Instalar en un Nuevo Gimnasio

### Paso 1: Crear el Proyecto Gratuito en Supabase (60 segundos)
1. Ingresa a [https://supabase.com](https://supabase.com) e inicia sesión con la cuenta de Google del dueño del gimnasio o la tuya.
2. Haz clic en **"New project"**.
3. Completa los datos:
   - **Name:** Nombre del gimnasio (ej. `VitalFit-Gym`)
   - **Database Password:** Crea una contraseña segura (guárdala).
   - **Region:** Selecciona `South America (São Paulo)` para menor latencia en Perú, o `US East`.
   - **Pricing Plan:** Free ($0/mes).
4. Haz clic en **"Create new project"** y espera 1 minuto a que se aprovisione.

---

### Paso 2: Ejecutar el Script Maestro de Base de Datos (30 segundos)
1. En el panel izquierdo de Supabase, entra al **SQL Editor** (ícono de terminal `>_`).
2. Haz clic en **"New query"**.
3. Abre el archivo `database/init_schema.sql` (o `database/schema_portable.db.sql`) de este proyecto, copia todo su contenido y pégalo en el editor de Supabase.
4. Haz clic en el botón verde **"Run"** (o presiona `Ctrl + Enter`).
5. ✅ Verás el mensaje **`Success. No rows returned`**. 
   *¡Listo! En este único paso se crearon automáticamente:*
   - Todas las tablas con claves foráneas e integridad referencial.
   - Vistas inteligentes de vencimiento (`vista_alertas_vencimiento`), inasistencia (`vista_alertas_inasistencia`), leads fríos (`vista_leads_frios`) y KPIs.
   - Funciones almacenadas transaccionales (Check-in Kiosco por DNI con semáforo, congelamiento, etc.).
   - Políticas RLS para portabilidad inmediata.
   - Los 4 planes base oficiales (`S/ 40`, `S/ 60`, `S/ 100`, `S/ 150`) y la promoción para leads fríos.
   - Las 7 plantillas redactadas de WhatsApp listas para usar.
   - Socias demostrativas para validar la operatividad al instante.

---

### Paso 3: Conectar la Aplicación Frontend (30 segundos)
1. En el panel de Supabase del nuevo gimnasio, ve a:
   ⚙️ **Project Settings** (engranaje inferior izquierdo) -> **API**.
2. Copia estos dos valores:
   - **Project URL:** `https://xyzcompany.supabase.co`
   - **Project API Keys:** La clave pública llamada `anon` / `public`.
3. En la carpeta raíz del sistema, abre o crea el archivo `.env`:
   ```env
   VITE_SUPABASE_URL=https://xyzcompany.supabase.co
   VITE_SUPABASE_ANON_KEY=tu_clave_anon_copiada_aqui

   # Personalización del Gimnasio
   VITE_GYM_NAME="VitalFit Gym & Club"
   VITE_GYM_PHONE="51999888777"
   VITE_GYM_CITY="Lima, Perú"
   ```
4. Guarda los cambios. ¡El sistema ya está completamente operativo y conectado a la nueva base de datos del cliente!

---

## 🔄 ¿Cómo migrar de un cliente A a un cliente B?
Solo repites el Paso 1 y Paso 2 en la nueva cuenta de Google/Supabase, y en el archivo `.env` del equipo o hosting de ese cliente reemplazas las 2 líneas `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.

¡Cero servidores VPS que configurar, cero cobros mensuales de base de datos y total independencia para cada cliente!

