-- 🎯 LA MUBI - Consultas SQL para contar entradas vendidas (reales)
-- Excluye registros de prueba: test, prueba, febrero, y compras anteriores a reya44438@gmail.com
-- Autor: Asistente IA para cliente LA MUBI

-- =================================================================
-- 1. ENCONTRAR EL PUNTO DE CORTE: ID del primer registro real
-- =================================================================
-- Buscar el ID más antiguo donde email_temporal = 'reya44438@gmail.com'
-- Esto nos da el punto a partir del cual consideramos compras reales

SELECT MIN(id) AS primer_id_real, MIN(fecha_creacion) AS primera_fecha_real
FROM verificaciones_pagos
WHERE email_temporal = 'reya44438@gmail.com';

-- =================================================================
-- 2. CONTAR ENTRADAS VENDIDAS (REALES)
-- =================================================================
-- Opción A: Contar solo compras aprobadas desde el punto de corte real
SELECT 
    COUNT(*) AS entradas_reales_aprobadas,
    COUNT(DISTINCT email_temporal) AS compradores_unicos,
    MIN(fecha_creacion) AS primera_compra_real,
    MAX(fecha_creacion) AS ultima_compra_real
FROM verificaciones_pagos
WHERE 
    estado = 'aprobado'
    AND id >= (SELECT MIN(id) FROM verificaciones_pagos WHERE email_temporal = 'reya44438@gmail.com')
    -- Excluir patrones de prueba
    AND email_temporal NOT ILIKE '%test%'
    AND email_temporal NOT ILIKE '%prueba%'
    AND email_temporal NOT ILIKE '%febrero%'
    -- También excluir por nombre si está en datos_compra
    AND datos_compra::text NOT ILIKE '%test%'
    AND datos_compra::text NOT ILIKE '%prueba%'
    AND datos_compra::text NOT ILIKE '%febrero%';

-- Opción B: Contar todas las entradas (pendientes + aprobadas) reales
SELECT 
    estado,
    COUNT(*) AS cantidad,
    COUNT(DISTINCT email_temporal) AS compradores_unicos
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
ORDER BY estado;

-- =================================================================
-- 3. DETALLE DE COMPRAS REALES (para verificar)
-- =================================================================
-- Mostrar las primeras 20 compras reales para validación visual
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
    id >= (SELECT MIN(id) FROM verificaciones_pagos WHERE email_temporal = 'reya44438@gmail.com')
    -- Excluir patrones de prueba
    AND email_temporal NOT ILIKE '%test%'
    AND email_temporal NOT ILIKE '%prueba%'
    AND email_temporal NOT ILIKE '%febrero%'
    AND datos_compra::text NOT ILIKE '%test%'
    AND datos_compra::text NOT ILIKE '%prueba%'
    AND datos_compra::text NOT ILIKE '%febrero%'
ORDER BY id ASC
LIMIT 20;

-- =================================================================
-- 4. ESTADÍSTICAS ADICIONALES PARA EL CLIENTE
-- =================================================================
-- Ventas por método de pago (reales)
SELECT 
    metodo_pago,
    COUNT(*) AS cantidad,
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
-- 5. VERIFICACIÓN: QUÉ REGISTROS SE EXCLUYEN (pruebas)
-- =================================================================
-- Mostrar cuántos registros se consideran "prueba" y se excluyen
SELECT 
    'Pruebas por email' AS categoria,
    COUNT(*) AS cantidad
FROM verificaciones_pagos
WHERE 
    (email_temporal ILIKE '%test%' OR email_temporal ILIKE '%prueba%' OR email_temporal ILIKE '%febrero%')
    OR datos_compra::text ILIKE '%test%'
    OR datos_compra::text ILIKE '%prueba%'
    OR datos_compra::text ILIKE '%febrero%'

UNION ALL

SELECT 
    'Compras anteriores a reya44438@gmail.com' AS categoria,
    COUNT(*) AS cantidad
FROM verificaciones_pagos
WHERE 
    id < (SELECT MIN(id) FROM verificaciones_pagos WHERE email_temporal = 'reya44438@gmail.com');

-- =================================================================
-- 6. FUNCIÓN REUTILIZABLE PARA FUTURAS CONSULTAS
-- =================================================================
-- Crear una vista que siempre filtre compras reales
CREATE OR REPLACE VIEW compras_reales AS
SELECT 
    vp.*
FROM verificaciones_pagos vp
WHERE 
    vp.id >= (SELECT MIN(id) FROM verificaciones_pagos WHERE email_temporal = 'reya44438@gmail.com')
    -- Excluir patrones de prueba
    AND vp.email_temporal NOT ILIKE '%test%'
    AND vp.email_temporal NOT ILIKE '%prueba%'
    AND vp.email_temporal NOT ILIKE '%febrero%'
    AND vp.datos_compra::text NOT ILIKE '%test%'
    AND vp.datos_compra::text NOT ILIKE '%prueba%'
    AND vp.datos_compra::text NOT ILIKE '%febrero%';

-- Ahora puedes usar simplemente:
-- SELECT COUNT(*) FROM compras_reales WHERE estado = 'aprobado';
-- SELECT * FROM compras_reales ORDER BY fecha_creacion DESC;

-- =================================================================
-- 7. RESUMEN EJECUTIVO PARA CLIENTE
-- =================================================================
-- Una consulta simple que devuelve el número exacto de entradas vendidas
SELECT 
    COUNT(*) AS entradas_vendidas_reales,
    COUNT(DISTINCT email_temporal) AS compradores_unicos,
    'Solo compras aprobadas y reales (excluye pruebas)' AS descripcion
FROM compras_reales
WHERE estado = 'aprobado';
