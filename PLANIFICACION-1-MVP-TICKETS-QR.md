# 🎯 PLANIFICACIÓN 1 - MVP VENTA TICKETS ONLINE CON QR

## 📋 INFORMACIÓN GENERAL

**Fecha:** 28 de Enero de 2026  
**Timeline:** 4 días para MVP  
**Estado:** Planificación completa - Listo para implementación  
**Base de Datos:** PostgreSQL (Supabase)  
**Filosofía:** Diseño LA MUBI consistente  

---

## 🗄️ ESTADO ACTUAL BASE DE DATOS

### Tablas Encontradas (8 totales):
✅ **administradores** - Panel admin (roles: super_admin, marketing_admin)  
✅ **compras** - Core sistema tickets (90% perfecto para QR)  
✅ **eventos** - Gestión eventos  
✅ **funnel_completo** - Vista usuarios + compras + funnel_stage  
✅ **interacciones** - Tracking usuarios  
✅ **stats_marketing** - Vista estadísticas por fuente/status  
✅ **usuarios** - Base usuarios (leads, prospectos, clientes)  
✅ **usuarios_con_compras** - Vista usuarios con última compra  

### Storage:
- **Bucket**: lamubi-comprobantes (configurado)
- **Políticas**: CREATE POLICY para uploads y lectura pública
- **Espacio**: 1GB límite Supabase

---

## 🎯 SISTEMAS SEPARADOS

### 🌐 Web Registro (registro.mcbo.com)
- **Enfoque**: Marketing y Leads
- **Panel**: Marketing Admin (existente)
- **Maneja**: usuarios, interacciones, stats_marketing
- **NO maneja**: tickets, compras, QR

### 🎫 Web Tickets (actual)
- **Enfoque**: Venta de Tickets
- **Panel**: Tickets Admin (nuevo/específico)
- **Maneja**: compras, verificación, QR, tasa dólar
- **NO maneja**: registro usuarios, marketing

---

## 📋 PLANIFICACIÓN DETALLADA - 4 DÍAS

### 🗓️ DÍA 1: Fundamentos Críticos

#### ✅ Mañana (4h) - Base Técnica
```
🔧 Tareas:
├── 📄 config.js (credenciales Supabase)
├── 🗄️ Agregar 4 campos a compras:
│   ├── comprobante_url TEXT
│   ├── qr_generado BOOLEAN DEFAULT false
│   ├── codigo_unico VARCHAR(255) UNIQUE
│   └── email_enviado BOOLEAN DEFAULT false
├── 🗄️ Crear tabla configuracion_sistema
├── 📄 supabase-storage.js (upload comprimido)
├── 🔍 API detección usuarios (nueva)
└── ✅ Confirmar bucket políticas
```

#### ✅ Tarde (4h) - Panel Tickets Admin
```
🔐 Tareas:
├── 📄 admin/login.html (diseño LA MUBI)
├── 📄 admin/login.js (credenciales BD existentes)
├── 📄 admin/index.html (SOLO dashboard tickets)
├── 💰 Configurar tasa dólar (SOLO para tickets)
├── ✅ Verificación de pagos (SOLO tickets)
├── 🎫 Gestión de tickets (SOLO tickets)
└── 📊 Estadísticas de tickets (usar usuarios_con_compras)
```

### 🗓️ DÍA 2: Formularios Inteligentes

#### ✅ Mañana (4h) - Formulario Compra Inteligente
```
🎫 Tareas:
├── 📄 comprar.html (detección email)
├── 🔍 API detección usuarios en tiempo real
├── 📝 Formulario dinámico (campos faltantes)
├── 👤 Datos existentes (solo lectura)
├── 🔲 Campos faltantes (editable)
└── 🎫 Lógica de registro/compra
```

#### ✅ Tarde (4h) - Verificación Mejorada
```
✅ Tareas:
├── 📄 verificacion.html (rediseño LA MUBI)
├── 💰 Campo monto en bolívares
├── 📊 Tasa dólar desde panel admin
├── 🧮 Cálculo automático (5 USD × tasa)
├── 📱 Upload comprobante bucket
└── ✅ Progress bars y feedback
```

### 🗓️ DÍA 3: Sistema QR

#### ✅ Mañana (4h) - QR Generator
```
📱 Tareas:
├── 📄 qr-generator.js
├── 🎫 Usar campo qr_code existente
├── 📄 confirmacion-qr.html (diseño LA MUBI)
├── 💾 Guardar en BD
└── 📱 QR instantáneo en pantalla
```

#### ✅ Tarde (4h) - Validación y Testing
```
🧪 Tareas:
├── 📄 validar-qr.html
├── 📷 Escáner básico
├── 🔍 Verificación en campo qr_code
├── 🔄 Testing flujo completo
└── 🐛 Bug fixing
```

### 🗓️ DÍA 4: Pulido y Deploy

#### ✅ Mañana (4h) - Dashboards y Pulido
```
✨ Tareas:
├── 📊 Dashboard admin con usuarios_con_compras
├── 🎨 Diseño LA MUBI consistente
├── 📱 Responsive perfecto
└── ⚡ Optimización rendimiento
```

#### ✅ Tarde (4h) - Deploy y Demo
```
🚀 Tareas:
├── 📦 Deploy producción
├── 🎯 Demo cliente funcional
├── 📋 Documentación básica
└── ✅ Entrega MVP completa
```

---

## 🎨 FILOSOFÍA DISEÑO LA MUBI

### Colores Principales:
```css
:root {
    --primary: #bb1175;      /* Rosa principal */
    --secondary: #f43cb8;    /* Rosa secundario */
    --accent: #f361e5;       /* Magenta acento */
    --black: #000000;        /* Negro puro */
    --white: #FFFFFF;        /* Blanco puro */
    --gray: #666666;         /* Gris neutro */
}
```

### Estilo Característico:
- **Font**: Montserrat (siempre)
- **Gradientes**: linear-gradient(45deg, var(--primary), var(--secondary))
- **Minimalista/moderno**
- **Animaciones suaves**
- **Responsive perfecto**
- **Backdrop blur effects**

---

## 🔧 ESPECIFICACIONES TÉCNICAS

### 💰 Tasa Dólar Dinámica:
```sql
-- Tabla configuracion_sistema
CREATE TABLE configuracion_sistema (
    id SERIAL PRIMARY KEY,
    clave VARCHAR(255) UNIQUE NOT NULL,
    valor TEXT NOT NULL,
    descripcion TEXT,
    activo BOOLEAN DEFAULT true,
    fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT venezuela_now()
);

-- Insertar tasa inicial
INSERT INTO configuracion_sistema (clave, valor, descripcion) 
VALUES ('tasa_dolar_bcv', '1.234,56', 'Tasa del dólar para conversión de tickets');
```

### 📱 Upload Imágenes:
```javascript
// Bucket: lamubi-comprobantes
// Compresión: 200KB máximo
// Formatos: JPG, PNG, WebP, HEIC
// Políticas: Ya creadas
```

### 🎫 QR Digital:
```javascript
// Usar campo existente: compras.qr_code
// Formato: LAMUBI_[timestamp]_[random]
// Datos: JSON con info completa
// Validación: Campo ticket_usado
```

### 🔍 Detección Usuarios:
```javascript
// Flujo inteligente:
1. Usuario ingresa email
2. Buscar en tabla usuarios
3. Si encontrado → mostrar solo campos faltantes
4. Si no encontrado → formulario completo
```

---

## 📁 ESTRUCTURA ARCHIVOS MVP

### Core Sistema:
```
📄 config.js (credenciales Supabase)
📄 supabase-storage.js (upload imágenes)
📄 qr-generator.js (generación QR)
📄 comprar.html (formulario inteligente)
📄 verificacion.html (mejorada)
📄 confirmacion-qr.html (QR instantáneo)
📄 validar-qr.html (validación entrada)
```

### Panel Admin Tickets:
```
📄 admin/login.html (acceso)
📄 admin/login.js (autenticación)
📄 admin/index.html (dashboard)
📄 admin/admin-panel.js (gestión)
```

### Vistas SQL Utilizadas:
```sql
-- Panel Tickets (SOLO estas):
✅ usuarios_con_compras (dashboard)
✅ compras (verificación)
✅ eventos (info evento)

-- NO usar (marketing):
❌ funnel_completo
❌ stats_marketing
```

---

## 🎯 OBJETIVOS MVP

### ✅ Funcionalidades Clave:
1. **Detección inteligente** de usuarios registrados
2. **Formulario dinámico** según estado del usuario
3. **Tasa dólar configurable** desde panel admin
4. **Monto en bolívares** con cálculo automático
5. **Upload imágenes** con compresión
6. **QR digital instantáneo** sin correo
7. **Panel admin específico** para tickets
8. **Validación QR** en evento

### 🚀 Flujo Usuario Final:
```
🌐 comprar.html → 🔍 Detección email → 📝 Formulario dinámico 
→ 💰 Pago → 📱 verificacion.html → ✅ Aprobación admin 
→ 📱 confirmacion-qr.html → 🎫 QR instantáneo → 🎫 Entrada lista
```

### 🔐 Flujo Admin:
```
🔐 admin/login.html → 📊 Dashboard tickets → 💰 Configurar tasa 
→ ✅ Verificar pagos → 📱 Validar QR → 📊 Reportes
```

---

## 📊 MÉTRICAS ÉXITO

### 🎯 MVP Exitoso Si:
- ✅ Usuarios pueden comprar tickets en <5 minutos
- ✅ QR generado y visible instantáneamente
- ✅ Admin puede configurar tasa dólar
- ✅ Upload de comprobantes funciona
- ✅ Validación QR funciona en evento
- ✅ Dashboard muestra estadísticas reales
- ✅ Diseño LA MUBI consistente

### 📈 KPIs Medir:
- **Tiempo promedio compra**
- **Tasa conversión** (formulario → compra)
- **Tickets generados** vs **aprobados**
- **Uso de validación QR**
- **Configuraciones tasa dólar**

---

## 🚀 PRÓXIMOS PASOS

### Inmediato (Día 1):
1. ✅ Guardar esta planificación en Git
2. ✅ Ejecutar cambios en base de datos
3. ✅ Crear estructura de archivos
4. ✅ Empezar implementación

### Post-MVP:
1. 📱 App móvil para QR
2. 📊 Analytics avanzados
3. 🎫 Múltiples eventos
4. 💳 Pagos online directos
5. 📧 Email automatización

---

## 📝 NOTAS IMPORTANTES

### ⚠️ Restricciones:
- **1GB storage** Supabase → compresión esencial
- **Sin pagos online** → solo verificación manual
- **Panel separado** → tickets vs marketing

### 🎯 Ventajas:
- **95% estructura ya existe**
- **Campos QR ya definidos**
- **Base enterprise-level**
- **Separación limpia de sistemas**

### 🔧 Decisiones Tomadas:
- **QR instantáneo** (sin correo) para MVP rápido
- **Panel tickets específico** para enfoque claro
- **Detección usuarios** para mejor experiencia
- **Tasa dólar centralizada** para consistencia

---

*Documentación creada: 28 Ene 2026*  
*Estado: Planificación completa - Listo para implementación*  
*Próximo: Iniciar Día 1 - Fundamentos*
