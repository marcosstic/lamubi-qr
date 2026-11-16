-- ============================================================
-- LA MUBI QR — Rollback 20261116_002
-- Restaura el nombre anterior del evento 8.
--
-- Seguridad:
--   - Solo actualiza el nombre del evento 8.
--   - No toca tickets, precios, fechas ni otros eventos.
-- ============================================================

BEGIN;

UPDATE public.eventos
SET nombre = 'PLATINIUM CLUB x COCO BAR - LA MUBI POOL NIGHT'
WHERE id = 8
  AND nombre = 'PLATINIUM CLUB · COCO BAR - LA MUBI POOL NIGHT';

COMMIT;

-- Verificación posterior
SELECT id, nombre
FROM public.eventos
WHERE id = 8;
