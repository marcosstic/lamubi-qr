-- ============================================================
-- LA MUBI QR — Migración 20261119_001
-- Agrega el evento:
--   id 9: TU ERES MALA - STUFFA
--         (05/12/2026, Maracaibo)
--
-- Características:
--   - Solo INSERT de una fila nueva.
--   - No modifica ni elimina otros eventos.
--   - No modifica tickets existentes.
--   - No cambia el esquema.
--   - Transaccional e idempotente.
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
        WHERE nombre = 'TU ERES MALA - STUFFA'
          AND id <> 9
    ) THEN
        RAISE EXCEPTION 'Ya existe un evento con el nombre a insertar';
    END IF;
END $$;

-- 3) Insertar el evento. Si ya existe por ID, no se sobrescribe.
INSERT INTO public.eventos
    (id, nombre, fecha, hora, ubicacion, ciudad, precio_usd, capacidad, activo, orden)
VALUES
    (9, 'TU ERES MALA - STUFFA', DATE '2026-12-05', '21:00',
     'Stuffa - Av. 5 de Julio con Calle 77', 'Maracaibo', 5.00, 700, true, 9)
ON CONFLICT (id) DO NOTHING;

-- 4) Verificar que la fila quedó exactamente como se esperaba.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM public.eventos
        WHERE id = 9
          AND nombre = 'TU ERES MALA - STUFFA'
          AND fecha = DATE '2026-12-05'
          AND hora = '21:00'
          AND ubicacion = 'Stuffa - Av. 5 de Julio con Calle 77'
          AND ciudad = 'Maracaibo'
          AND precio_usd = 5.00
          AND capacidad = 700
          AND activo = true
    ) THEN
        RAISE EXCEPTION 'El evento 9 no quedó con los datos esperados';
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
WHERE id IN (8, 9)
ORDER BY id;

SELECT COUNT(*) AS total_eventos FROM public.eventos;

SELECT COUNT(*) AS tickets_evento_9
FROM public.verificaciones_pagos
WHERE evento_id = 9;
