-- ============================================================
-- LA MUBI QR — Rollback 20261119_001
-- Elimina ÚNICAMENTE el evento 9 si no tiene tickets.
--
-- Seguridad:
--   - No toca ningún otro evento.
--   - Si existe un ticket asociado en verificaciones_pagos,
--     aborta sin borrar.
--   - Todo dentro de una transacción.
-- ============================================================

BEGIN;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM public.verificaciones_pagos
        WHERE evento_id = 9
    ) THEN
        RAISE EXCEPTION 'No se puede revertir: hay tickets asociados al evento 9';
    END IF;
END $$;

DELETE FROM public.eventos e
WHERE e.id = 9
  AND NOT EXISTS (
      SELECT 1
      FROM public.verificaciones_pagos vp
      WHERE vp.evento_id = e.id
  );

COMMIT;

-- Verificación posterior
SELECT id, nombre
FROM public.eventos
WHERE id IN (8, 9);
