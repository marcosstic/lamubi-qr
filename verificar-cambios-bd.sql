-- 🎯 LA MUBI - Verificar que los cambios se guardaron en BD
-- Consultas para verificar aprobaciones y rechazos

SELECT '=== VERIFICACIONES PAGOS - ESTADOS ACTUALES ===' as info;
SELECT 
    id,
    email_temporal,
    metodo_pago,
    estado,
    monto,
    fecha_pago,
    fecha_verificacion,
    admin_id,
    admin_notas
FROM verificaciones_pagos 
ORDER BY fecha_pago DESC;

SELECT '=== CONFIGURACIÓN - TASA DÓLAR ===' as info;
SELECT clave, valor, fecha_actualizacion, actualizado_por 
FROM configuracion_sistema 
WHERE clave = 'tasa_dolar_bcv';
