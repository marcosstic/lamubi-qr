-- ============================================================
-- LA MUBI QR — Rollback 20261106_001
-- Elimina ÚNICAMENTE los eventos 6 y 7 si no tienen tickets.
--
-- Seguridad:
--   - No toca ningún otro evento.
--   - Si existe un ticket asociado en verificaciones_pagos
--     o en verificaciones_pagos_archive, aborta sin borrar.
--   - Todo dentro de una transacción.
-- ============================================================

BEGIN;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM public.verificaciones_pagos
        WHERE evento_id IN (6, 7)
    ) THEN
        RAISE EXCEPTION 'No se puede revertir: hay tickets asociados a los eventos 6 o 7';
    END IF;

    IF to_regclass('public.verificaciones_pagos_archive') IS NOT NULL THEN
        IF EXISTS (
            SELECT 1
            FROM public.verificaciones_pagos_archive
            WHERE evento_id IN (6, 7)
        ) THEN
            RAISE EXCEPTION 'No se puede revertir: hay tickets archivados asociados a los eventos 6 o 7';
        END IF;
    END IF;
END $$;

DELETE FROM public.eventos e
WHERE e.id IN (6, 7)
  AND NOT EXISTS (
      SELECT 1
      FROM public.verificaciones_pagos vp
      WHERE vp.evento_id = e.id
  );

COMMIT;

-- Verificación posterior
SELECT id, nombre
FROM public.eventos
WHERE id IN (6, 7);
