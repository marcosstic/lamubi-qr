-- 🎯 FASE 1: VALIDADOR QR MVP - Actualización de Base de Datos
-- 📅 Fecha: 2026-02-02
-- 🎯 Objetivo: Agregar campos para validación de tickets

-- =====================================================
-- 📋 ANÁLISIS DE IMPACTO
-- =====================================================
-- Tabla afectada: verificaciones_pagos
-- Cambios: Agregar 3 campos para tracking de validación
-- Riesgo: Bajo (solo agregamos campos, no modificamos existentes)
-- Rollback: DROP COLUMN si es necesario

-- =====================================================
-- 🔥 EJECUCIÓN DE CAMBIOS
-- =====================================================

-- 1. Agregar campo para estado de uso del QR
ALTER TABLE verificaciones_pagos 
ADD COLUMN IF NOT EXISTS qr_usado BOOLEAN DEFAULT FALSE;

-- 2. Agregar timestamp de cuándo se usó el ticket
ALTER TABLE verificaciones_pagos 
ADD COLUMN IF NOT EXISTS fecha_uso TIMESTAMP WITH TIME ZONE;

-- 3. Agregar quién validó el ticket (para auditoría)
ALTER TABLE verificaciones_pagos 
ADD COLUMN IF NOT EXISTS validador_nombre VARCHAR(100) DEFAULT 'Validador MVP';

-- 4. Agregar ubicación de validación (para análisis)
ALTER TABLE verificaciones_pagos 
ADD COLUMN IF NOT EXISTS ubicacion_validacion VARCHAR(100) DEFAULT 'Entrada Principal';

-- =====================================================
-- ✅ VERIFICACIÓN DE CAMBIOS
-- =====================================================

-- Verificar que los campos se agregaron correctamente
SELECT 
    column_name,
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'verificaciones_pagos' 
    AND column_name IN ('qr_usado', 'fecha_uso', 'validador_nombre', 'ubicacion_validacion')
ORDER BY column_name;

-- =====================================================
-- 🧪 PRUEBA DE INSERCIÓN (MVP)
-- =====================================================

-- Probar inserción con nuevos campos
INSERT INTO verificaciones_pagos (
    email_temporal,
    metodo_pago,
    monto,
    tasa_dolar,
    fecha_pago,
    estado,
    qr_usado,
    validador_nombre,
    ubicacion_validacion,
    datos_compra
) VALUES (
    'test-validador@mvp.com',
    'pago-movil',
    6173,
    1234.56,
    venezuela_now(),
    'aprobado',
    FALSE,
    'Validador Test',
    'Entrada Principal',
    '{"test": "validador-qr-mvp"}'
) 
ON CONFLICT DO NOTHING
RETURNING id, email_temporal, qr_usado, validador_nombre, fecha_creacion;

-- =====================================================
-- 📊 VISTA PARA VALIDADOR (MVP)
-- =====================================================

-- Crear vista simplificada para el validador
CREATE OR REPLACE VIEW validador_tickets_activos AS
SELECT 
    id,
    email_temporal,
    metodo_pago,
    monto,
    estado,
    qr_usado,
    fecha_uso,
    validador_nombre,
    ubicacion_validacion,
    fecha_creacion
FROM verificaciones_pagos 
WHERE estado = 'aprobado'
ORDER BY fecha_creacion DESC;

-- =====================================================
-- 🔄 ÍNDICES DE PERFORMANCE
-- =====================================================

-- Índice para búsquedas rápidas por ID (escaneo QR)
CREATE INDEX IF NOT EXISTS idx_verificaciones_id_qr 
ON verificaciones_pagos(id);

-- Índice para filtrar tickets no usados
CREATE INDEX IF NOT EXISTS idx_verificaciones_qr_no_usados 
ON verificaciones_pagos(qr_usado) 
WHERE qr_usado = FALSE;

-- Índice para búsqueda por email
CREATE INDEX IF NOT EXISTS idx_verificaciones_email_temporal 
ON verificaciones_pagos(email_temporal);

-- =====================================================
-- 🧹 LIMPIEZA DE DATOS DE PRUEBA
-- =====================================================

-- Limpiar datos de prueba (opcional, descomentar si es necesario)
-- DELETE FROM verificaciones_pagos 
-- WHERE email_temporal = 'test-validador@mvp.com';

-- =====================================================
-- 📝 COMENTARIOS Y DOCUMENTACIÓN
-- =====================================================

-- Comentarios sobre los nuevos campos
COMMENT ON COLUMN verificaciones_pagos.qr_usado IS 'Estado del ticket QR: FALSE=no usado, TRUE=usado';
COMMENT ON COLUMN verificaciones_pagos.fecha_uso IS 'Timestamp exacto de cuándo se validó el ticket';
COMMENT ON COLUMN verificaciones_pagos.validador_nombre IS 'Nombre del trabajador que validó el ticket';
COMMENT ON COLUMN verificaciones_pagos.ubicacion_validacion IS 'Lugar físico donde se validó el ticket';

-- =====================================================
-- 🎯 RESUMEN DE CAMBIOS
-- =====================================================

/*
✅ CAMBIOS REALIZADOS:
1. qr_usado (BOOLEAN) - Estado del ticket
2. fecha_uso (TIMESTAMP) - Cuándo se usó
3. validador_nombre (VARCHAR) - Quién validó
4. ubicacion_validacion (VARCHAR) - Dónde se validó

✅ VISTAS CREADAS:
- validador_tickets_activos - Vista simplificada para el validador

✅ ÍNDICES CREADOS:
- idx_verificaciones_id_qr - Búsqueda por ID (escaneo)
- idx_verificaciones_qr_no_usados - Tickets no usados
- idx_verificaciones_email_temporal - Búsqueda por email

🎯 IMPACTO:
- Cero impacto en funcionalidad existente
- Mejora de performance para consultas de validación
- Listo para implementación del validador QR
*/

-- =====================================================
-- 🚀 ESTADO FINAL
-- =====================================================

-- Verificar estado final de la tabla
SELECT 
    COUNT(*) as total_tickets,
    COUNT(CASE WHEN qr_usado = TRUE THEN 1 END) as tickets_usados,
    COUNT(CASE WHEN qr_usado = FALSE THEN 1 END) as tickets_pendientes,
    COUNT(CASE WHEN estado = 'aprobado' THEN 1 END) as tickets_aprobados
FROM verificaciones_pagos;

-- Verificar vista
SELECT COUNT(*) as tickets_activos FROM validador_tickets_activos;
