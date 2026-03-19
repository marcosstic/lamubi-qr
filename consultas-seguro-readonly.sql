-- 🎯 LA MUBI - Consultas SEGURO de solo lectura (sin modificar la BD)
-- Transacción BEGIN/ROLLBACK para máxima protección
-- Autor: Asistente IA para cliente LA MUBI

-- =================================================================
-- 1. VERIFICAR PUNTO DE CORTE (reya44438@gmail.com)
-- =================================================================
BEGIN; -- Iniciar transacción de solo lectura

-- Encuentra el primer ID real y cuántos registros hay de reya44438@gmail.com
SELECT 
    MIN(id) AS primer_id_real,
    MIN(fecha_creacion) AS primera_fecha_real,
    COUNT(*) AS total_reya_registros,
    STRING_AGG(DISTINCT estado, ', ') AS estados_de_reya
FROM verificaciones_pagos
WHERE email_temporal = 'reya44438@gmail.com';

-- =================================================================
-- 2. CONTEO EXACTO DE ENTRADAS REALES APROBADAS
-- =================================================================
-- Consulta principal para el cliente
SELECT 
    COUNT(*) AS entradas_vendidas_reales,
    COUNT(DISTINCT email_temporal) AS compradores_unicos,
    MIN(fecha_creacion) AS primera_compra_real,
    MAX(fecha_creacion) AS ultima_compra_real,
    'Compras aprobadas y reales (excluye pruebas)' AS descripcion
FROM verificaciones_pagos
WHERE 
    estado = 'aprobado'
    AND id >= (SELECT MIN(id) FROM verificaciones_pagos WHERE email_temporal = 'reya44438@gmail.com')
    -- Excluir patrones de prueba (case-insensitive)
    AND email_temporal NOT ILIKE '%test%'
    AND email_temporal NOT ILIKE '%prueba%'
    AND email_temporal NOT ILIKE '%febrero%'
    AND datos_compra::text NOT ILIKE '%test%'
    AND datos_compra::text NOT ILIKE '%prueba%'
    AND datos_compra::text NOT ILIKE '%febrero%';

-- =================================================================
-- 3. DESGLOSE POR ESTADO (para validación)
-- =================================================================
SELECT 
    estado,
    COUNT(*) AS cantidad,
    COUNT(DISTINCT email_temporal) AS compradores_unicos,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) AS porcentaje
FROM verificaciones_pagos
WHERE 
    id >= (SELECT MIN(id) FROM verificaciones_pagos WHERE email_temporal = 'reya44438@gmail.com')
    -- Excluir patrones de prueba
    AND email_temporal NOT ILIKE '%test%'
    AND email_temporal NOT ILIKE '%prueba%'
    AND email_temporal NOT ILIKE '%febrero%'
    AND datos_compra::text NOT ILIKE '%test%'
    AND datos_compra::text NOT ILIKE '%prueba%'
    AND datos_compra::text NOT ILIKE '%febrero%'
GROUP BY estado
ORDER BY cantidad DESC;

-- =================================================================
-- 4. MÉTODOS DE PAGO (estadística útil para el cliente)
-- =================================================================
SELECT 
    metodo_pago,
    COUNT(*) AS cantidad,
    COUNT(DISTINCT email_temporal) AS compradores_unicos,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) AS porcentaje
FROM verificaciones_pagos
WHERE 
    estado = 'aprobado'
    AND id >= (SELECT MIN(id) FROM verificaciones_pagos WHERE email_temporal = 'reya44438@gmail.com')
    -- Excluir patrones de prueba
    AND email_temporal NOT ILIKE '%test%'
    AND email_temporal NOT ILIKE '%prueba%'
    AND email_temporal NOT ILIKE '%febrero%'
    AND datos_compra::text NOT ILIKE '%test%'
    AND datos_compra::text NOT ILIKE '%prueba%'
    AND datos_compra::text NOT ILIKE '%febrero%'
GROUP BY metodo_pago
ORDER BY cantidad DESC;

-- =================================================================
-- 5. VERIFICACIÓN: QUÉ REGISTROS SE EXCLUYEN
-- =================================================================
-- Muestra cuántos registros se consideran "prueba"
SELECT 
    'Pruebas por email' AS categoria,
    COUNT(*) AS cantidad,
    STRING_AGG(DISTINCT estado, ', ') AS estados
FROM verificaciones_pagos
WHERE 
    (email_temporal ILIKE '%test%' OR email_temporal ILIKE '%prueba%' OR email_temporal ILIKE '%febrero%')
    OR datos_compra::text ILIKE '%test%'
    OR datos_compra::text ILIKE '%prueba%'
    OR datos_compra::text ILIKE '%febrero%'

UNION ALL

SELECT 
    'Compras anteriores a reya44438@gmail.com' AS categoria,
    COUNT(*) AS cantidad,
    STRING_AGG(DISTINCT estado, ', ') AS estados
FROM verificaciones_pagos
WHERE 
    id < COALESCE((SELECT MIN(id) FROM verificaciones_pagos WHERE email_temporal = 'reya44438@gmail.com'), 999999);

-- =================================================================
-- 6. MUESTRA DE PRIMERAS 20 COMPRAS REALES (validación visual)
-- =================================================================
SELECT 
    id,
    email_temporal,
    estado,
    metodo_pago,
    monto,
    fecha_creacion,
    -- Extraer nombre del comprador desde datos_compra
    CASE 
        WHEN datos_compra::jsonb ? 'nombre' THEN datos_compra::jsonb->>'nombre'
        ELSE 'Sin nombre'
    END AS nombre_comprador
FROM verificaciones_pagos
WHERE 
    id >= COALESCE((SELECT MIN(id) FROM verificaciones_pagos WHERE email_temporal = 'reya44438@gmail.com'), 1)
    -- Excluir patrones de prueba
    AND email_temporal NOT ILIKE '%test%'
    AND email_temporal NOT ILIKE '%prueba%'
    AND email_temporal NOT ILIKE '%febrero%'
    AND datos_compra::text NOT ILIKE '%test%'
    AND datos_compra::text NOT ILIKE '%prueba%'
    AND datos_compra::text NOT ILIKE '%febrero%'
ORDER BY id ASC
LIMIT 20;

ROLLBACK; -- Cancelar transacción (aunque no hubo modificaciones)
