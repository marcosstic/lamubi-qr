# ESTRUCTURA COMPLETA - BASE DE DATOS SUPABASE (LA MUBI QR)

> Documento de referencia para conocer la estructura completa de la base de datos en Supabase/PostgreSQL.  
> Úsalo cada vez que quieras crear nuevas tablas o expandir el software.

---

## 1) INFORMACIÓN GENERAL DE LA BD

### 1.1 Versión de PostgreSQL
```sql
SELECT version();
```

### 1.2 Esquemas disponibles
```sql
SELECT schema_name
FROM information_schema.schemata
ORDER BY schema_name;
```

### 1.3 Tamaño de la base de datos
```sql
SELECT
  current_database() AS db,
  pg_size_pretty(pg_database_size(current_database())) AS db_size;
```

---

## 2) LISTADO DE TABLAS, VISTAS Y MATERIALIZED VIEWS

### 2.1 Tablas del esquema `public`
```sql
SELECT
  table_schema,
  table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;
```

### 2.2 Vistas
```sql
SELECT
  table_schema,
  table_name
FROM information_schema.views
WHERE table_schema = 'public'
ORDER BY table_name;
```

### 2.3 Materialized views
```sql
SELECT
  schemaname,
  matviewname
FROM pg_matviews
WHERE schemaname = 'public'
ORDER BY matviewname;
```

---

## 3) COLUMNAS, TIPOS, DEFAULTS Y NULABILIDAD

### 3.1 Columnas de una tabla específica (cambia el nombre)
```sql
SELECT
  c.table_name,
  c.ordinal_position,
  c.column_name,
  c.data_type,
  c.udt_name,
  c.is_nullable,
  c.column_default
FROM information_schema.columns c
WHERE c.table_schema = 'public'
  AND c.table_name = 'verificaciones_pagos'
ORDER BY c.ordinal_position;
```

### 3.2 Columnas de todas las tablas (útil para auditoría)
```sql
SELECT
  c.table_name,
  c.ordinal_position,
  c.column_name,
  c.data_type,
  c.udt_name,
  c.is_nullable,
  c.column_default
FROM information_schema.columns c
WHERE c.table_schema = 'public'
ORDER BY c.table_name, c.ordinal_position;
```

---

## 4) CONSTRAINTS (PK, UNIQUE, CHECK)

### 4.1 Constraints de una tabla
```sql
SELECT
  tc.constraint_name,
  tc.constraint_type
FROM information_schema.table_constraints tc
WHERE tc.table_schema = 'public'
  AND tc.table_name = 'verificaciones_pagos'
ORDER BY tc.constraint_type, tc.constraint_name;
```

### 4.2 Detalle de columnas en constraints (PK/UNIQUE)
```sql
SELECT
  tc.table_name,
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name,
  kcu.ordinal_position
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
 AND tc.table_schema = kcu.table_schema
WHERE tc.table_schema = 'public'
  AND tc.constraint_type IN ('PRIMARY KEY','UNIQUE')
ORDER BY tc.table_name, tc.constraint_name, kcu.ordinal_position;
```

### 4.3 CHECK constraints (texto)
```sql
SELECT
  conrelid::regclass AS table_name,
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE contype = 'c'
  AND connamespace = 'public'::regnamespace
ORDER BY conrelid::regclass::text, conname;
```

---

## 5) FOREIGN KEYS (DEPENDENCIAS ENTRE TABLAS)

### 5.1 Lista de FKs (todas)
```sql
SELECT
  tc.table_name AS fk_table,
  kcu.column_name AS fk_column,
  ccu.table_name AS referenced_table,
  ccu.column_name AS referenced_column,
  tc.constraint_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
 AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage ccu
  ON ccu.constraint_name = tc.constraint_name
 AND ccu.table_schema = tc.table_schema
WHERE tc.table_schema = 'public'
  AND tc.constraint_type = 'FOREIGN KEY'
ORDER BY fk_table, tc.constraint_name;
```

### 5.2 Dependencias hacia `verificaciones_pagos`
```sql
SELECT
  tc.table_name AS fk_table,
  kcu.column_name AS fk_column,
  ccu.table_name AS referenced_table,
  ccu.column_name AS referenced_column,
  tc.constraint_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
 AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage ccu
  ON ccu.constraint_name = tc.constraint_name
 AND ccu.table_schema = tc.table_schema
WHERE tc.table_schema = 'public'
  AND tc.constraint_type = 'FOREIGN KEY'
  AND ccu.table_name = 'verificaciones_pagos'
ORDER BY fk_table, tc.constraint_name;
```

---

## 6) ÍNDICES

### 6.1 Índices por tabla
```sql
SELECT
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'verificaciones_pagos'
ORDER BY indexname;
```

### 6.2 Índices de todas las tablas
```sql
SELECT
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
```

---

## 7) SECUENCIAS (Y SU ESTADO)

### 7.1 Secuencias del esquema public
```sql
SELECT
  sequence_schema,
  sequence_name
FROM information_schema.sequences
WHERE sequence_schema = 'public'
ORDER BY sequence_name;
```

### 7.2 Qué secuencia usa una columna identity/serial (por tabla)
```sql
SELECT
  c.table_name,
  c.column_name,
  pg_get_serial_sequence(format('%I.%I', c.table_schema, c.table_name), c.column_name) AS serial_sequence
FROM information_schema.columns c
WHERE c.table_schema = 'public'
  AND c.table_name IN ('verificaciones_pagos','usuarios','compras','administradores')
ORDER BY c.table_name, c.column_name;
```

### 7.3 Valor actual de una secuencia (ejemplo)
> Reemplaza el nombre por el que te salga en 7.2.
```sql
SELECT
  last_value,
  is_called
FROM public.verificaciones_pagos_id_seq;
```

---

## 8) RLS (ROW LEVEL SECURITY) Y POLICIES (SUPABASE)

### 8.1 Ver si las tablas tienen RLS habilitado
```sql
SELECT
  n.nspname AS schema,
  c.relname AS table,
  c.relrowsecurity AS rls_enabled,
  c.relforcerowsecurity AS rls_forced
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relkind = 'r'
ORDER BY c.relname;
```

### 8.2 Policies definidas
```sql
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

---

## 9) FUNCIONES Y TRIGGERS

### 9.1 Funciones del schema public (lista)
```sql
SELECT
  n.nspname AS schema,
  p.proname AS function_name,
  pg_get_function_identity_arguments(p.oid) AS args
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
ORDER BY p.proname;
```

### 9.2 Definición de una función (ejemplo: venezuela_now)
```sql
SELECT
  p.proname,
  pg_get_functiondef(p.oid)
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname = 'venezuela_now';
```

### 9.3 Triggers por tabla
```sql
SELECT
  event_object_table AS table_name,
  trigger_name,
  action_timing,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;
```

---

## 10) DDL (CREATE TABLE) DE TABLAS CLAVE

> Esto te devuelve el DDL exacto en texto usando `pg_dump`-like approach. En Supabase SQL Editor suele funcionar.

### 10.1 DDL de una tabla
```sql
SELECT
  'CREATE TABLE ' || quote_ident(n.nspname) || '.' || quote_ident(c.relname) || E' (\n' ||
  string_agg('  ' || quote_ident(a.attname) || ' ' || pg_catalog.format_type(a.atttypid, a.atttypmod)
    || CASE WHEN a.attnotnull THEN ' NOT NULL' ELSE '' END
    || COALESCE(' DEFAULT ' || pg_get_expr(ad.adbin, ad.adrelid), ''), E',\n')
  || E'\n);' AS create_table_ddl
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
JOIN pg_attribute a ON a.attrelid = c.oid
LEFT JOIN pg_attrdef ad ON ad.adrelid = c.oid AND ad.adnum = a.attnum
WHERE n.nspname = 'public'
  AND c.relname = 'verificaciones_pagos'
  AND a.attnum > 0
  AND NOT a.attisdropped
GROUP BY n.nspname, c.relname;
```

### 10.2 DDL de `administradores`
```sql
SELECT
  'CREATE TABLE ' || quote_ident(n.nspname) || '.' || quote_ident(c.relname) || E' (\n' ||
  string_agg('  ' || quote_ident(a.attname) || ' ' || pg_catalog.format_type(a.atttypid, a.atttypmod)
    || CASE WHEN a.attnotnull THEN ' NOT NULL' ELSE '' END
    || COALESCE(' DEFAULT ' || pg_get_expr(ad.adbin, ad.adrelid), ''), E',\n')
  || E'\n);' AS create_table_ddl
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
JOIN pg_attribute a ON a.attrelid = c.oid
LEFT JOIN pg_attrdef ad ON ad.adrelid = c.oid AND ad.adnum = a.attnum
WHERE n.nspname = 'public'
  AND c.relname = 'administradores'
  AND a.attnum > 0
  AND NOT a.attisdropped
GROUP BY n.nspname, c.relname;
```

### 10.3 DDL de `configuracion_sistema`
```sql
SELECT
  'CREATE TABLE ' || quote_ident(n.nspname) || '.' || quote_ident(c.relname) || E' (\n' ||
  string_agg('  ' || quote_ident(a.attname) || ' ' || pg_catalog.format_type(a.atttypid, a.atttypmod)
    || CASE WHEN a.attnotnull THEN ' NOT NULL' ELSE '' END
    || COALESCE(' DEFAULT ' || pg_get_expr(ad.adbin, ad.adrelid), ''), E',\n')
  || E'\n);' AS create_table_ddl
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
JOIN pg_attribute a ON a.attrelid = c.oid
LEFT JOIN pg_attrdef ad ON ad.adrelid = c.oid AND ad.adnum = a.attnum
WHERE n.nspname = 'public'
  AND c.relname = 'configuracion_sistema'
  AND a.attnum > 0
  AND NOT a.attisdropped
GROUP BY n.nspname, c.relname;
```

### 10.4 DDL de `usuarios`
```sql
SELECT
  'CREATE TABLE ' || quote_ident(n.nspname) || '.' || quote_ident(c.relname) || E' (\n' ||
  string_agg('  ' || quote_ident(a.attname) || ' ' || pg_catalog.format_type(a.atttypid, a.atttypmod)
    || CASE WHEN a.attnotnull THEN ' NOT NULL' ELSE '' END
    || COALESCE(' DEFAULT ' || pg_get_expr(ad.adbin, ad.adrelid), ''), E',\n')
  || E'\n);' AS create_table_ddl
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
JOIN pg_attribute a ON a.attrelid = c.oid
LEFT JOIN pg_attrdef ad ON ad.adrelid = c.oid AND ad.adnum = a.attnum
WHERE n.nspname = 'public'
  AND c.relname = 'usuarios'
  AND a.attnum > 0
  AND NOT a.attisdropped
GROUP BY n.nspname, c.relname;
```

---

## 11) CONTEOS Y ESTADO ACTUAL

### 11.1 Conteo rápido de tablas principales
```sql
SELECT 'administradores' AS table, COUNT(*) AS rows FROM public.administradores
UNION ALL
SELECT 'configuracion_sistema', COUNT(*) FROM public.configuracion_sistema
UNION ALL
SELECT 'verificaciones_pagos', COUNT(*) FROM public.verificaciones_pagos;
```

### 11.2 Último ID vendido (ticket máximo)
```sql
SELECT MAX(id) AS last_ticket_id FROM public.verificaciones_pagos;
```

---

## 12) CHECKLIST ANTES DE CREAR NUEVAS TABLAS

Antes de agregar tablas nuevas:
- Revisa las FKs existentes para evitar conflictos de nombres.
- Verifica si necesitas secuencias nuevas o identity.
- Considera si la tabla necesita RLS/policies de Supabase.
- Decide si la tabla tendrá triggers o constraints especiales.
- Piensa en los índices que necesitarás para consultas frecuentes.

---

## CONTEXTO RÁPIDO (TABLAS PRINCIPALES DEL SISTEMA)

- `verificaciones_pagos` (tickets/compras/estado/qr)
- `administradores` (login panel admin)
- `configuracion_sistema` (tasa dólar, precio ticket, flags)
- `usuarios` (aparece en tests/documentación; confirmar si se usa en producción)

---

## PRÓXIMO PASO

1) Ejecuta las queries de las secciones 2, 5, 7, 8, 9 y 11 para conocer tu estado actual.
2) Usa este documento como referencia cada vez que quieras expandir el software.
3) Al crear nuevas tablas, sigue las convenciones observadas (nombres en minúsculas con guiones bajos, IDs serial/identity, etc.).
