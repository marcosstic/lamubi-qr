# 🎯 PLAN MVP ACTUAL - LA MUBI TICKETS

## 📋 OBJETIVO PRINCIPAL
Sistema de venta de tickets digitales con códigos QR para eventos LA MUBI.
**Entrega en 3 días** - Sin verificación de correo (post-MVP).

## ✅ ESTADO ACTUAL (80% Completado)

### **Fases Completadas:**
- ✅ **FASE 1**: Limpieza y simplificación (4→2 métodos)
- ✅ **FASE 2**: Corrección Zelle (timestamp + contenido dinámico)
- ✅ **FASE 3**: Sección dinámica (contenido específico por método)
- ✅ **FASE 4**: Validación completa (conversión + debounce)

### **Funcionalidad Actual:**
- Flujo completo: selección → pago → verificación → confirmación
- 2 métodos: Pago Móvil y Zelle
- Validación automática con tasa dinámica
- Upload de comprobantes
- Timestamps automáticos UTC-4

## ⏳ FASES PENDIENTES (20% MVP - 3 Días)

### **🏗️ FASE 5: INTEGRACIÓN USUARIOS + BASE DATOS**
**Duración: 1 día**
**Prioridad: CRÍTICA**

#### **🎯 Objetivos:**
1. Integrar `user-detection-api.js` con flujo de tickets
2. Crear tabla `verificaciones_pagos` en Supabase
3. Conectar `verificacion.html` con base de datos
4. Implementar detección de usuarios registrados

#### **📋 Estructura SQL:**
```sql
CREATE TABLE verificaciones_pagos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email_temporal VARCHAR(100),
    metodo_pago VARCHAR(20) NOT NULL,
    monto DECIMAL(10,2) NOT NULL,
    referencia VARCHAR(50),
    confirmacion_zelle VARCHAR(50),
    email_remitente VARCHAR(100),
    fecha_pago TIMESTAMP NOT NULL,
    comprobante_url TEXT,
    estado VARCHAR(20) DEFAULT 'pendiente',
    datos_compra JSONB,
    fecha_creacion TIMESTAMP DEFAULT NOW(),
    fecha_actualizacion TIMESTAMP DEFAULT NOW()
);
```

#### **📋 Entregables:**
- Sistema detecta si usuario ya está registrado
- Verificaciones se guardan en BD
- Persistencia de datos completa

---

### **🎫 FASE 6: GENERACIÓN TICKETS QR**
**Duración: 1 día**
**Prioridad: ALTA**

#### **🎯 Objetivos:**
1. Modificar `confirmacion.html` para generar QR
2. Crear sistema de tickets digitales únicos
3. Implementar validación básica de tickets
4. Conectar con tabla de usuarios

#### **📋 Estructura SQL:**
```sql
CREATE TABLE tickets_digitales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    verificacion_id UUID REFERENCES verificaciones_pagos(id),
    qr_code TEXT UNIQUE NOT NULL,
    qr_url TEXT,
    evento_id UUID,
    nombre_evento VARCHAR(200),
    fecha_evento TIMESTAMP,
    estado VARCHAR(20) DEFAULT 'activo',
    usado BOOLEAN DEFAULT FALSE,
    fecha_uso TIMESTAMP,
    fecha_creacion TIMESTAMP DEFAULT NOW()
);
```

#### **📋 Entregables:**
- Tickets QR funcionales
- Página confirmación mejorada
- Sistema de validación básico

---

### **⚙️ FASE 7: ADAPTACIÓN PANEL ADMIN**
**Duración: 1 día**
**Prioridad: MEDIA**

#### **🎯 Objetivos:**
1. Modificar `admin/index.html` existente
2. Agregar sección `verificaciones_pagos`
3. Implementar estados básicos
4. Vista de comprobantes y acciones

#### **📋 Funcionalidades:**
- Dashboard simple: lista de verificaciones
- Estados básicos: pendiente/aprobado/rechazado
- Vista comprobantes: preview de imágenes
- Acciones básicas: aprobar/rechazar individual

#### **📋 Entregables:**
- Panel adaptado para gestionar verificaciones
- Sistema completo funcional

---

## 🚀 PLAN DE EJECUCIÓN - 3 DÍAS

### **DÍA 1: FASE 5**
- **Mañana**: Analizar `user-detection-api.js`
- **Tarde**: Crear tabla SQL + conectar verificación.html
- **Noche**: Testing integración usuarios

### **DÍA 2: FASE 6**
- **Mañana**: Diseñar sistema QR
- **Tarde**: Modificar confirmación.html
- **Noche**: Testing tickets QR

### **DÍA 3: FASE 7**
- **Mañana**: Adaptar panel admin
- **Tarde**: Implementar acciones básicas
- **Noche**: Testing final + entrega

---

## 🔧 TECNOLOGÍA EXISTENTE

### **Archivos a Modificar:**
- `verificacion.html` → conectar con BD
- `confirmacion.html` → generar QR
- `admin/index.html` → agregar verificaciones
- `user-detection-api.js` → integrar

### **Archivos a Crear:**
- SQL para tablas nuevas
- Lógica de generación QR
- Scripts de admin adaptados

---

## 📋 POST-MVP (Futuro)

### **Funcionalidades para Escalar:**
- Verificación de correo antes de registro
- Sistema de login/logout
- Historial de compras por usuario
- Compras futuras sin repetir datos
- Dashboard personal de usuario

### **Base del Plan Actual:**
- ✅ Estructura de datos compatible
- ✅ Sistema de detección existente
- ✅ Escalable sin romper
- ✅ Aprovecha código existente

---

## 🎯 ENTREGA FINAL MVP

### **Características Completas:**
- ✅ Flujo completo de compra
- ✅ 2 métodos de pago funcionando
- ✅ Tickets QR digitales
- ✅ Panel admin básico
- ✅ Persistencia de datos
- ✅ Detección de usuarios registrados

### **No Incluye (Post-MVP):**
- ❌ Verificación de correo
- ❌ Sistema de login
- ❌ Historial de compras
- ❌ Compras futuras rápidas

---

## 📊 Métricas de Éxito

### **Funcionales:**
- Flujo completo 100% operativo
- Tickets QR generados correctamente
- Panel admin gestionando verificaciones
- Base de datos persistente

### **Técnicas:**
- Sin errores en consola
- Upload de comprobantes funcionando
- Validaciones correctas
- Rendimiento optimizado

---

## 🎯 LISTO PARA EJECUTAR

**Plan estructurado, dependencias claras, 3 días definidos, MVP funcional garantizado.**

*Documentación completa - Plan 3 días - MVP definido - Post-MVP identificado - Listo para comenzar*
