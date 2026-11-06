-- ============================================================
-- LA MUBI QR — Migración 20261106_002
-- Actualiza únicamente la ubicación del evento 7:
--   LA MUBI POOL NIGHT TRUJILLO
--
-- Seguridad:
--   - Solo UPDATE de una columna en una fila (id = 7).
--   - No modifica otros eventos ni otras columnas.
--   - Transaccional y verificable.
-- ============================================================

BEGIN;

-- 1) Verificar que el evento exista.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM public.eventos WHERE id = 7
    ) THEN
        RAISE EXCEPTION 'El evento 7 no existe';
    END IF;
END $$;

-- 2) Actualizar solo la ubicación del evento 7.
UPDATE public.eventos
SET ubicacion = '11:11 Good Vibes - Snack and Bar'
WHERE id = 7;

-- 3) Verificar el resultado.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM public.eventos
        WHERE id = 7
          AND ubicacion = '11:11 Good Vibes - Snack and Bar'
          AND ciudad = 'Trujillo'
    ) THEN
        RAISE EXCEPTION 'El evento 7 no quedó con la ubicación esperada';
    END IF;
END $$;

COMMIT;

-- Verificación posterior
SELECT id, nombre, ubicacion, ciudad
FROM public.eventos
WHERE id = 7;
