-- ============================================================
-- LA MUBI QR — Migración 20261116_002
-- Renombra el evento 8:
--   De: PLATINIUM CLUB x COCO BAR - LA MUBI POOL NIGHT
--   A:  PLATINIUM CLUB · COCO BAR - LA MUBI POOL NIGHT
--
-- Motivo:
--   La "x" se usa en flyers como abreviatura de "por/colaboración",
--   pero en Maracaibo puede confundir al público general.
--
-- Seguridad:
--   - Solo actualiza el nombre del evento 8.
--   - No modifica tickets, precios, fechas ni otros eventos.
--   - No toca el evento 6 (PERREO LAND).
--   - Transaccional, idempotente y verificable.
-- ============================================================

BEGIN;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM public.eventos WHERE id = 8
    ) THEN
        RAISE EXCEPTION 'El evento 8 no existe';
    END IF;
END $$;

UPDATE public.eventos
SET nombre = 'PLATINIUM CLUB · COCO BAR - LA MUBI POOL NIGHT'
WHERE id = 8
  AND nombre = 'PLATINIUM CLUB x COCO BAR - LA MUBI POOL NIGHT';

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM public.eventos
        WHERE id = 8
          AND nombre = 'PLATINIUM CLUB · COCO BAR - LA MUBI POOL NIGHT'
    ) THEN
        RAISE EXCEPTION 'El evento 8 no quedó con el nombre esperado';
    END IF;
END $$;

COMMIT;

-- Verificación posterior
SELECT id, nombre, fecha, precio_usd, activo
FROM public.eventos
WHERE id = 8;
