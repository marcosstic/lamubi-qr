-- ============================================================
-- LA MUBI QR — Consulta de contadores por evento (solo lectura)
--
-- El contador de la landing es estático y se edita en
-- assets/events-config.js. Esta consulta devuelve el número
-- real de entradas aprobadas para copiarlo allí.
--
-- No modifica ningún dato.
-- ============================================================

SELECT
    e.id,
    e.nombre,
    e.capacidad,
    COALESCE(
        SUM(vp.cantidad_entradas) FILTER (WHERE vp.estado = 'aprobado'),
        0
    ) AS vendidas
FROM public.eventos e
LEFT JOIN public.verificaciones_pagos vp
    ON vp.evento_id = e.id
WHERE e.id IN (6, 7)
GROUP BY e.id, e.nombre, e.capacidad
ORDER BY e.id;

-- Versión para todos los eventos activos
SELECT
    e.id,
    e.nombre,
    e.fecha,
    e.capacidad,
    COALESCE(
        SUM(vp.cantidad_entradas) FILTER (WHERE vp.estado = 'aprobado'),
        0
    ) AS vendidas
FROM public.eventos e
LEFT JOIN public.verificaciones_pagos vp
    ON vp.evento_id = e.id
WHERE e.activo = true
GROUP BY e.id, e.nombre, e.fecha, e.capacidad
ORDER BY e.fecha;
