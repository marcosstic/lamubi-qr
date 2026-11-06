-- ============================================================
-- LA MUBI QR — Migración 20261106_001
-- Agrega los eventos:
--   id 6: LA MUBI PERREO LAND (14/11/2026, Valera)
--   id 7: LA MUBI POOL NIGHT TRUJILLO (28/11/2026, Trujillo)
--
-- Características:
--   - Solo INSERT de dos filas nuevas.
--   - No modifica ni elimina datos existentes.
--   - No cambia el esquema.
--   - Transaccional e idempotente.
--   - Verifica los datos antes de confirmar.
-- ============================================================

BEGIN;

-- 1) Verificar que la tabla exista.
DO $$
BEGIN
    IF to_regclass('public.eventos') IS NULL THEN
        RAISE EXCEPTION 'La tabla public.eventos no existe';
    END IF;
END $$;

-- 2) Verificar que no exista otro evento con los mismos nombres.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM public.eventos
        WHERE nombre IN ('LA MUBI PERREO LAND', 'LA MUBI POOL NIGHT TRUJILLO')
          AND id NOT IN (6, 7)
    ) THEN
        RAISE EXCEPTION 'Ya existe un evento con uno de los nombres a insertar';
    END IF;
END $$;

-- 3) Insertar los dos eventos. Si ya existen por ID, no se sobrescriben.
INSERT INTO public.eventos
    (id, nombre, fecha, hora, ubicacion, ciudad, precio_usd, capacidad, activo, orden)
VALUES
    (6, 'LA MUBI PERREO LAND', DATE '2026-11-14', '21:00',
     'Discoteca Vocas Bistro Bar', 'Valera', 3.00, 700, true, 6),
    (7, 'LA MUBI POOL NIGHT TRUJILLO', DATE '2026-11-28', '21:00',
     'Trujillo', 'Trujillo', 5.00, 700, true, 7)
ON CONFLICT (id) DO NOTHING;

-- 4) Verificar que las filas quedaron exactamente como se esperaba.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM public.eventos
        WHERE id = 6
          AND nombre = 'LA MUBI PERREO LAND'
          AND fecha = DATE '2026-11-14'
          AND hora = '21:00'
          AND ubicacion = 'Discoteca Vocas Bistro Bar'
          AND ciudad = 'Valera'
          AND precio_usd = 3.00
          AND capacidad = 700
          AND activo = true
    ) THEN
        RAISE EXCEPTION 'El evento 6 no quedó con los datos esperados';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM public.eventos
        WHERE id = 7
          AND nombre = 'LA MUBI POOL NIGHT TRUJILLO'
          AND fecha = DATE '2026-11-28'
          AND hora = '21:00'
          AND ubicacion = 'Trujillo'
          AND ciudad = 'Trujillo'
          AND precio_usd = 5.00
          AND capacidad = 700
          AND activo = true
    ) THEN
        RAISE EXCEPTION 'El evento 7 no quedó con los datos esperados';
    END IF;
END $$;

-- 5) Sincronizar la secuencia solo si está por detrás del máximo ID.
DO $$
DECLARE
    seq_name text := pg_get_serial_sequence('public.eventos', 'id');
    max_id bigint;
    seq_last bigint;
BEGIN
    SELECT MAX(id) INTO max_id FROM public.eventos;

    IF seq_name IS NOT NULL AND max_id IS NOT NULL THEN
        EXECUTE format('SELECT last_value FROM %s', seq_name) INTO seq_last;

        IF seq_last < max_id THEN
            PERFORM setval(seq_name::regclass, max_id, true);
        END IF;
    END IF;
END $$;

COMMIT;

-- ============================================================
-- Verificación posterior (solo lectura)
-- ============================================================

SELECT id, nombre, fecha, hora, ubicacion, ciudad, precio_usd, capacidad, activo, orden
FROM public.eventos
WHERE id IN (6, 7)
ORDER BY id;

SELECT COUNT(*) AS total_eventos FROM public.eventos;

SELECT COUNT(*) AS tickets_evento_6
FROM public.verificaciones_pagos
WHERE evento_id = 6;

SELECT COUNT(*) AS tickets_evento_7
FROM public.verificaciones_pagos
WHERE evento_id = 7;
