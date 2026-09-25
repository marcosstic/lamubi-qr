-- Agregar campo confirmacion_binance a verificaciones_pagos
ALTER TABLE public.verificaciones_pagos
ADD COLUMN confirmacion_binance character varying;

-- Agregar campo confirmacion_binance a verificaciones_pagos_archive
ALTER TABLE public.verificaciones_pagos_archive
ADD COLUMN confirmacion_binance character varying;

-- Actualizar constraint metodo_pago en verificaciones_pagos
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'verificaciones_pagos_metodo_pago_check'
        AND conrelid = 'public.verificaciones_pagos'::regclass
    ) THEN
        ALTER TABLE public.verificaciones_pagos
        DROP CONSTRAINT verificaciones_pagos_metodo_pago_check;
    END IF;
END $$;

ALTER TABLE public.verificaciones_pagos
ADD CONSTRAINT verificaciones_pagos_metodo_pago_check
CHECK (metodo_pago::text = ANY (ARRAY['pago-movil'::character varying, 'zelle'::character varying, 'binance'::character varying]::text[]));

-- Actualizar constraint metodo_pago en verificaciones_pagos_archive (si existe)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname LIKE '%metodo_pago%'
        AND conrelid = 'public.verificaciones_pagos_archive'::regclass
    ) THEN
        -- Eliminar cualquier constraint de metodo_pago en archive
        EXECUTE format(
            'ALTER TABLE public.verificaciones_pagos_archive DROP CONSTRAINT %I',
            (
                SELECT conname FROM pg_constraint
                WHERE conname LIKE '%metodo_pago%'
                AND conrelid = 'public.verificaciones_pagos_archive'::regclass
                LIMIT 1
            )
        );
    END IF;
END $$;

ALTER TABLE public.verificaciones_pagos_archive
ADD CONSTRAINT verificaciones_pagos_archive_metodo_pago_check
CHECK (metodo_pago::text = ANY (ARRAY['pago-movil'::character varying, 'zelle'::character varying, 'binance'::character varying]::text[]));
