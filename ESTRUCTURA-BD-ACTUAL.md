# 🗄️ ESTRUCTURA BASE DE DATOS - ESTADO ACTUAL

## 📊 Información General
- **Database**: PostgreSQL 17.6
- **Plataforma**: Supabase
- **Schema**: public
- **Estado**: 90% perfecto para MVP QR

---

## 📋 TABLAS PRINCIPALES

### 👥 administradores
```sql
CREATE TABLE public.administradores (
  id integer NOT NULL DEFAULT nextval('administradores_id_seq'::regclass),
  nombre character varying NOT NULL,
  correo character varying NOT NULL UNIQUE,
  password character varying NOT NULL,
  rol character varying NOT NULL CHECK (rol::text = ANY (ARRAY['super_admin'::character varying, 'marketing_admin'::character varying]::text[])),
  permisos jsonb DEFAULT '{}'::jsonb,
  fecha_creacion timestamp with time zone DEFAULT venezuela_now(),
  ultimo_acceso timestamp with time zone,
  activo boolean DEFAULT true,
  metadata jsonb DEFAULT '{}'::jsonb,
  CONSTRAINT administradores_pkey PRIMARY KEY (id)
);
```
**🎯 Uso:** Login panel admin (tickets y marketing)

---

### 🎫 compras
```sql
CREATE TABLE public.compras (
  id integer NOT NULL DEFAULT nextval('compras_id_seq'::regclass),
  usuario_id integer,
  payment_method character varying,
  monto numeric DEFAULT 5.00,
  verified boolean DEFAULT false,
  datos_verificacion jsonb DEFAULT '{}'::jsonb,
  fecha_compra timestamp with time zone DEFAULT venezuela_now(),
  fecha_verificacion timestamp with time zone,
  metadata jsonb DEFAULT '{}'::jsonb,
  qr_code character varying UNIQUE,
  ticket_usado boolean DEFAULT false,
  fecha_validacion timestamp with time zone,
  metodo_validacion character varying DEFAULT 'digital'::character varying,
  validador_id integer,
  ticket_fisico_entregado boolean DEFAULT false,
  CONSTRAINT compras_pkey PRIMARY KEY (id),
  CONSTRAINT compras_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id),
  CONSTRAINT compras_validador_id_fkey FOREIGN KEY (validador_id) REFERENCES public.administradores(id)
);
```
**🎯 Uso:** Core sistema tickets QR (90% perfecto)

---

### 👤 usuarios
```sql
CREATE TABLE public.usuarios (
  id integer NOT NULL DEFAULT nextval('usuarios_id_seq'::regclass),
  nombre character varying NOT NULL,
  correo character varying NOT NULL UNIQUE,
  telefono character varying,
  genero character varying CHECK (genero::text = ANY (ARRAY['hombre'::character varying, 'mujer'::character varying]::text[])),
  cedula character varying,
  edad integer,
  fuente character varying DEFAULT 'directo'::character varying,
  status character varying DEFAULT 'lead'::character varying,
  fecha_registro timestamp with time zone DEFAULT venezuela_now(),
  ultima_actualizacion timestamp with time zone DEFAULT venezuela_now(),
  etiquetas jsonb DEFAULT '[]'::jsonb,
  notas text,
  metadata jsonb DEFAULT '{}'::jsonb,
  CONSTRAINT usuarios_pkey PRIMARY KEY (id)
);
```
**🎯 Uso:** Base usuarios para detección inteligente

---

### 🎪 eventos
```sql
CREATE TABLE public.eventos (
  id integer NOT NULL DEFAULT nextval('eventos_id_seq'::regclass),
  nombre character varying NOT NULL,
  descripcion text,
  fecha_evento timestamp with time zone,
  ubicacion character varying,
  capacidad integer,
  precio_base numeric,
  activo boolean DEFAULT true,
  metadata jsonb DEFAULT '{}'::jsonb,
  fecha_creacion timestamp with time zone DEFAULT venezuela_now(),
  fecha_actualizacion timestamp with time zone DEFAULT venezuela_now(),
  CONSTRAINT eventos_pkey PRIMARY KEY (id)
);
```
**🎯 Uso:** Información del evento LA MUBI

---

### 📊 interacciones
```sql
CREATE TABLE public.interacciones (
  id integer NOT NULL DEFAULT nextval('interacciones_id_seq'::regclass),
  usuario_id integer,
  tipo character varying NOT NULL,
  fuente character varying,
  detalles jsonb DEFAULT '{}'::jsonb,
  fecha timestamp with time zone DEFAULT venezuela_now(),
  metadata jsonb DEFAULT '{}'::jsonb,
  CONSTRAINT interacciones_pkey PRIMARY KEY (id),
  CONSTRAINT interacciones_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id)
);
```
**🎯 Uso:** Tracking marketing (panel marketing)

---

## 📊 VIEWS (VISTAS)

### 📈 funnel_completo
```sql
CREATE VIEW funnel_completo AS
SELECT u.id, u.nombre, u.correo, u.telefono, u.fuente, u.status, u.fecha_registro,
       c.id AS compra_id, c.fecha_compra, c.verified,
       CASE 
         WHEN c.verified = true THEN 'compra_verificada'
         WHEN c.id IS NOT NULL THEN 'compra_pendiente'
         WHEN u.status = 'cliente' THEN 'cliente_sin_compra'
         WHEN u.status = 'prospecto' THEN 'prospecto'
         ELSE 'lead'
       END AS funnel_stage
FROM usuarios u LEFT JOIN compras c ON u.id = c.usuario_id;
```
**🎯 Uso:** Dashboard marketing (NO panel tickets)

---

### 📊 stats_marketing
```sql
CREATE VIEW stats_marketing AS
SELECT fuente, status, count(*) AS total,
       count(DISTINCT date(fecha_registro)) AS dias_activos,
       min(fecha_registro) AS primer_registro,
       max(fecha_registro) AS ultimo_registro
FROM usuarios GROUP BY fuente, status;
```
**🎯 Uso:** Estadísticas marketing (NO panel tickets)

---

### 👥 usuarios_con_compras
```sql
CREATE VIEW usuarios_con_compras AS
SELECT u.id, u.nombre, u.correo, u.telefono, u.genero, u.cedula, u.edad,
       u.fuente, u.status, u.fecha_registro, u.ultima_actualizacion,
       u.etiquetas, u.notas, u.metadata,
       c.id AS compra_id, c.payment_method, c.monto, c.verified, c.fecha_compra
FROM usuarios u LEFT JOIN LATERAL (
  SELECT * FROM compras 
  WHERE compras.usuario_id = u.id 
  ORDER BY fecha_compra DESC LIMIT 1
) c ON true;
```
**🎯 Uso:** Dashboard panel tickets (USAR ESTA)

---

## 🔧 CAMPOS FALTANTES PARA MVP

### 📝 Agregar a tabla compras:
```sql
-- Solo 4 campos necesarios
ALTER TABLE compras ADD COLUMN comprobante_url TEXT;
ALTER TABLE compras ADD COLUMN qr_generado BOOLEAN DEFAULT false;
ALTER TABLE compras ADD COLUMN codigo_unico VARCHAR(255) UNIQUE;
ALTER TABLE compras ADD COLUMN email_enviado BOOLEAN DEFAULT false;
```

### 📝 Crear tabla nueva:
```sql
CREATE TABLE configuracion_sistema (
    id SERIAL PRIMARY KEY,
    clave VARCHAR(255) UNIQUE NOT NULL,
    valor TEXT NOT NULL,
    descripcion TEXT,
    activo BOOLEAN DEFAULT true,
    fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT venezuela_now()
);
```

---

## 📱 STORAGE CONFIGURACIÓN

### 🗄️ Bucket: lamubi-comprobantes
```sql
-- Políticas ya creadas:
CREATE POLICY "Allow uploads" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'lamubi-comprobantes');

CREATE POLICY "Allow public read" ON storage.objects
FOR SELECT USING (bucket_id = 'lamubi-comprobantes');
```

### 📊 Límites:
- **Storage**: 1GB gratuito
- **Compresión**: 200KB por imagen
- **Formatos**: JPG, PNG, WebP, HEIC

---

## 🎯 RELACIONES CLAVE

### 📊 Diagrama de Relaciones:
```
usuarios (1) → (N) compras
administradores (1) → (N) compras (validador_id)
eventos (1) → (N) compras
usuarios (1) → (N) interacciones
```

### 🔗 Claves Foráneas:
- `compras.usuario_id` → `usuarios.id`
- `compras.validador_id` → `administradores.id`
- `interacciones.usuario_id` → `usuarios.id`

---

## 📊 ESTADÍSTICAS ACTUALES

### 📈 Datos para Panel Tickets:
```sql
-- Usuarios con tickets
SELECT COUNT(*) FROM usuarios_con_compras WHERE compra_id IS NOT NULL;

-- Compras por verificar
SELECT COUNT(*) FROM compras WHERE verified = false;

-- Tickets vendidos
SELECT COUNT(*) FROM compras WHERE verified = true;

-- Monto total vendido
SELECT SUM(monto) FROM compras WHERE verified = true;
```

---

## 🚀 ESTADO MVP

### ✅ Listo para usar:
- **90% estructura completa**
- **Relaciones funcionales**
- **Campos QR existentes**
- **Vistas útiles disponibles**

### 🔧 Mejoras necesarias:
- **4 campos adicionales** en compras
- **1 tabla nueva** (configuracion_sistema)
- **Conexión frontend**

---

*Documentación BD creada: 28 Ene 2026*  
*Estado: Análisis completo - Listo para MVP*
