-- ============================================================
-- LA MUBI QR — Migración 20261107_005
-- Cambia el precio del evento 7:
--   LA MUBI POOL NIGHT TRUJILLO
--   De $5.00 a $3.00
--
-- Seguridad:
--   - Solo actualiza la columna precio_usd del evento 7.
--   - No modifica tickets existentes.
--   - No toca IDs, secuencias ni otros eventos.
--   - Transaccional y verificable.
-- ============================================================

BEGIN;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM public.eventos WHERE id = 7
    ) THEN
        RAISE EXCEPTION 'El evento 7 no existe';
    END IF;
END $$;

UPDATE public.eventos
SET precio_usd = 3.00
WHERE id = 7;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM public.eventos
        WHERE id = 7
          AND precio_usd = 3.00
    ) THEN
        RAISE EXCEPTION 'El evento 7 no quedó con el precio esperado';
    END IF;
END $$;

COMMIT;

-- Verificación
SELECT id, nombre, precio_usd, activo
FROM public.eventos
WHERE id = 7;

-- Los tickets ya existentes conservan su monto original.
SELECT id, evento_id, monto, estado
FROM public.verificaciones_pagos
WHERE evento_id = 7
ORDER BY id DESC
LIMIT 5;
