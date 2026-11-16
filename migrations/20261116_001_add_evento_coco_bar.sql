-- ============================================================
-- LA MUBI QR — Migración 20261116_001
-- Agrega el evento:
--   id 8: PLATINIUM CLUB x COCO BAR - LA MUBI POOL NIGHT
--         (12/12/2026, Maracaibo)
--
-- Características:
--   - Solo INSERT de una fila nueva.
--   - No modifica ni elimina el evento 6 (PERREO LAND).
--   - No modifica tickets existentes.
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

-- 2) Verificar que no exista otro evento con el mismo nombre.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM public.eventos
        WHERE nombre = 'PLATINIUM CLUB x COCO BAR - LA MUBI POOL NIGHT'
          AND id <> 8
    ) THEN
        RAISE EXCEPTION 'Ya existe un evento con el nombre a insertar';
    END IF;
END $$;

-- 3) Insertar el evento. Si ya existe por ID, no se sobrescribe.
INSERT INTO public.eventos
    (id, nombre, fecha, hora, ubicacion, ciudad, precio_usd, capacidad, activo, orden)
VALUES
    (8, 'PLATINIUM CLUB x COCO BAR - LA MUBI POOL NIGHT', DATE '2026-12-12', '19:00',
     'Platinium Club - Coco Bar', 'Maracaibo', 5.00, 1500, true, 8)
ON CONFLICT (id) DO NOTHING;

-- 4) Verificar que la fila quedó exactamente como se esperaba.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM public.eventos
        WHERE id = 8
          AND nombre = 'PLATINIUM CLUB x COCO BAR - LA MUBI POOL NIGHT'
          AND fecha = DATE '2026-12-12'
          AND hora = '19:00'
          AND ubicacion = 'Platinium Club - Coco Bar'
          AND ciudad = 'Maracaibo'
          AND precio_usd = 5.00
          AND capacidad = 1500
          AND activo = true
    ) THEN
        RAISE EXCEPTION 'El evento 8 no quedó con los datos esperados';
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
WHERE id IN (6, 8)
ORDER BY id;

SELECT COUNT(*) AS total_eventos FROM public.eventos;

SELECT COUNT(*) AS tickets_evento_8
FROM public.verificaciones_pagos
WHERE evento_id = 8;
