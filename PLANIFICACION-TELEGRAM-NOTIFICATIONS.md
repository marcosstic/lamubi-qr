# Planificación Completa: Sistema de Notificaciones Telegram para Panel Admin

## Objetivo General
Implementar notificaciones Telegram para eventos clave del panel admin (creación de ticket pendiente, aprobación/rechazo de pago, y futuro escaneo de tickets) de forma modular, escalable y sin romper la funcionalidad existente.

---

## 1. Arquitectura del Sistema

### 1.1 Diseño Event-Driven
- **Componente principal**: Edge Function en Supabase llamada `telegram-notify`
- **Patrón**: Fire-and-forget (sin bloquear flujos principales)
- **Sin cron jobs**: Las notificaciones se disparan por eventos reales
- **Deduplicación**: Usando metadata existente en la tabla `verificaciones_pagos`

### 1.2 Flujo de Datos
```
Evento (Frontend) → Edge Function → Supabase (lectura) → Telegram API → Actualizar metadata
```

### 1.3 Ventajas
- Mínimo consumo de recursos (importante para tiers gratuitos)
- Sin dependencias de servicios externos
- Fácil de mantener y extender
- No afecta el rendimiento del flujo principal

---

## 2. Eventos y Plantillas de Mensajes

### 2.1 Tipos de Eventos
- `payment_pending_created`: Nuevo ticket pendiente de aprobación
- `payment_approved`: Pago aprobado por admin
- `payment_rejected`: Pago rechazado por admin
- `ticket_scanned`: Ticket validado en puerta (futuro)

### 2.2 Plantillas de Mensajes Completos

#### Mensaje de Pago Pendiente
```
🎫 Nuevo ticket pendiente
ID: #{id}
Email: {email_temporal}
Método: {metodo_pago}
Monto: {monto_formateado}
Referencia: {referencia}
Entradas: {cantidad_entradas} (H: {hombres}, M: {mujeres})
🕐 Compra: {fecha_pago}
👉 Revisar: https://tu-dominio.com/admin
```

#### Mensaje de Pago Aprobado
```
✅ Ticket aprobado
ID: #{id}
Email: {email_temporal}
Referencia: {referencia}
Entradas: {cantidad_entradas}
✅ Verificado: {fecha_verificacion}
```

#### Mensaje de Pago Rechazado
```
❌ Ticket rechazado
ID: #{id}
Email: {email_temporal}
Referencia: {referencia}
Entradas: {cantidad_entradas}
❌ Verificado: {fecha_verificacion}
```

#### Mensaje de Ticket Escaneado (Futuro)
```
📷 Ticket escaneado
ID: #{id}
Email: {email_temporal}
Validador: {validador_nombre}
Ubicación: {ubicacion_validacion}
🕐 Escaneo: {fecha_uso}
```

---

## 3. Mecanismo de Deduplicación

### 3.1 Estrategia
- **Ubicación**: Campo `metadata` (JSONB) en tabla `verificaciones_pagos`
- **Estructura**:
```json
{
  "telegram": {
    "pending": true,
    "approved": true,
    "rejected": true,
    "scanned": true
  }
}
```

### 3.2 Lógica en Edge Function
1. Leer ticket completo de `verificaciones_pagos`
2. Verificar `metadata.telegram[event_type]`
3. Si `true`: omitir envío (ya notificado)
4. Si `false` o inexistente: enviar y marcar como `true`

### 3.3 Ventajas
- Sin necesidad de tablas adicionales
- Persistencia automática con el ticket
- Consultas eficientes (JSONB indexado)
- Fácil de depurar

---

## 4. Puntos de Integración

### 4.1 Creación de Ticket (verificacion.html)
**Ubicación**: Después del `.insert()` exitoso en `guardarVerificacionEnBD()`

```javascript
// Fire-and-forget notification
fetch(`${SUPABASE_URL}/functions/v1/telegram-notify`, {
  method: 'POST',
  headers: { 
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`, 
    'Content-Type': 'application/json' 
  },
  body: JSON.stringify({ 
    event_type: 'payment_pending_created', 
    ticket_id: data.id 
  })
}).catch(console.warn); // No bloquear flujo principal
```

### 4.2 Aprobación/Rechazo (admin-panel.js)
**Ubicación**: Después del `.update()` exitoso en `approvePurchase()` y `rejectPurchase()`

```javascript
// Fire-and-forget notification
fetch(`${SUPABASE_URL}/functions/v1/telegram-notify`, {
  method: 'POST',
  headers: { 
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`, 
    'Content-Type': 'application/json' 
  },
  body: JSON.stringify({ 
    event_type: estado === 'aprobado' ? 'payment_approved' : 'payment_rejected', 
    ticket_id 
  })
}).catch(console.warn); // No bloquear flujo principal
```

### 4.3 Escaneo de Ticket (validador-ios.html - Futuro)
**Ubicación**: Después de confirmar validación

```javascript
// Fire-and-forget notification
fetch(`${SUPABASE_URL}/functions/v1/telegram-notify`, {
  method: 'POST',
  headers: { 
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`, 
    'Content-Type': 'application/json' 
  },
  body: JSON.stringify({ 
    event_type: 'ticket_scanned', 
    ticket_id 
  })
}).catch(console.warn); // No bloquear flujo principal
```

---

## 5. Edge Function: telegram-notify

### 5.1 Estructura del Archivo
```typescript
// supabase/functions/telegram-notify/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  // 1. Validar request
  // 2. Leer ticket con Service Role
  // 3. Verificar deduplicación en metadata
  // 4. Enviar a Telegram API
  // 5. Actualizar metadata
  // 6. Responder
})
```

### 5.2 Lógica Principal
1. **Validación**: Verificar `event_type` y `ticket_id`
2. **Lectura**: Obtener ticket completo usando Service Role
3. **Deduplicación**: Revisar `metadata.telegram[event_type]`
4. **Formateo**: Aplicar plantilla según evento
5. **Envío**: `fetch` a Telegram Bot API
6. **Actualización**: Marcar flag en metadata
7. **Timeout**: 5 segundos máximo
8. **Error handling**: Logs sin exponer detalles

### 5.3 Variables de Entorno
- `TELEGRAM_BOT_TOKEN`: Token del bot (secret)
- `TELEGRAM_CHAT_ID`: ID del grupo (secret)
- `TELEGRAM_ENABLED`: Flag para activar/desactivar (opcional)

---

## 6. Configuración de Telegram

### 6.1 Pasos Previos

#### Crear Bot y Obtener Token
1. Buscar **@BotFather** en Telegram
2. Enviar comando: `/newbot`
3. Seguir instrucciones:
   - Nombre del bot: "LA MUBI Notificaciones"
   - Username: `lamubi_notifications_bot`
4. Copiar el `BOT_TOKEN` proporcionado

#### Crear Grupo y Obtener Chat ID
1. Crear nuevo grupo en Telegram
2. Agregar el bot al grupo
3. Enviar cualquier mensaje en el grupo
4. Llamar a: `https://api.telegram.org/bot<TU_TOKEN>/getUpdates`
5. Buscar `"chat":{"id":<NUMBER>}` en la respuesta
6. Copiar ese `<NUMBER>` como `chat_id`

### 6.2 Configurar Secrets en Supabase
1. Ir a Supabase Dashboard
2. Edge Functions → Secrets
3. Agregar:
   - `TELEGRAM_BOT_TOKEN`: `<token_copiado>`
   - `TELEGRAM_CHAT_ID`: `<chat_id_copiado>`

---

## 7. Manejo de Errores y Confiabilidad

### 7.1 Estrategia de Fallos
- **Timeout**: 5 segundos en Edge Function
- **No bloqueo**: Siempre `.catch()` en frontend
- **Logs**: Errores registrados en Supabase logs
- **Sin reintentos**: Volumen bajo permite simplicidad

### 7.2 Casos de Error
- **Telegram API caída**: Log + continuar flujo
- **Token inválido**: Error 401 + logs
- **Chat ID incorrecto**: Error 400 + logs
- **Ticket no encontrado**: Error 404 + logs
- **Metadata corrupta**: Regenerar estructura

### 7.3 Monitoreo
- Logs de Edge Function en Supabase Dashboard
- Contador de mensajes enviados (opcional)
- Estado del bot via `getMe` endpoint

---

## 8. Datos Requeridos por Plantilla

### 8.1 Campos de verificaciones_pagos
- `id`: ID del ticket
- `email_temporal`: Email del comprador
- `metodo_pago`: Método de pago
- `monto`: Monto en bolívares
- `referencia`: Referencia de pago
- `fecha_pago`: Fecha de pago
- `fecha_verificacion`: Fecha de verificación
- `datos_compra.cantidad_entradas`: Total entradas
- `datos_compra.hombres`: Cantidad hombres
- `datos_compra.mujeres`: Cantidad mujeres

### 8.2 Formateo
- Montos: Formato venezolano con símbolo Bs.
- Fechas: Formato DD/MM/YYYY HH:MM
- URLs: Base configurable

---

## 9. Implementación Paso a Paso

### 9.1 Preparación
1. [ ] Crear bot en Telegram y obtener token
2. [ ] Crear grupo y obtener chat_id
3. [ ] Configurar secrets en Supabase
4. [ ] Probar API de Telegram manualmente

### 9.2 Desarrollo
1. [ ] Crear Edge Function `telegram-notify`
2. [ ] Implementar lógica de eventos y deduplicación
3. [ ] Agregar plantillas de mensajes
4. [ ] Implementar manejo de errores

### 9.3 Integración
1. [ ] Agregar llamada en `verificacion.html`
2. [ ] Agregar llamada en `admin-panel.js`
3. [ ] (Opcional) Agregar llamada en `validador-ios.html`
4. [ ] Probar cada evento individualmente

### 9.4 Testing
1. [ ] Probar flujo completo de compra
2. [ ] Probar aprobación/rechazo
3. [ ] Verificar deduplicación (no enviar duplicados)
4. [ ] Probar con Telegram deshabilitado
5. [ ] Verificar que no se rompen flujos existentes

---

## 10. Consideraciones Adicionales

### 10.1 Seguridad
- Nunca exponer token en código cliente
- Usar siempre Service Role en Edge Function
- Validar inputs en la función
- Rate limiting (opcional)

### 10.2 Performance
- Fire-and-forget en frontend
- Timeout agresivo en Edge Function
- Queries eficientes con índices
- Sin procesamiento pesado

### 10.3 Mantenimiento
- Logs centralizados
- Feature flags para activar/desactivar
- Documentación de plantillas
- Proceso de actualización de bot

---

## 11. Extensión Futura

### 11.1 Nuevos Eventos
- `ticket_refunded`: Devolución de ticket
- `payment_updated`: Actualización de pago
- `admin_login`: Inicio de sesión admin
- `system_alert`: Alertas del sistema

### 11.2 Mejoras
- Botones interactivos en mensajes
- Imágenes/QR en notificaciones
- Múltiples grupos/canales
- Plantillas personalizables por admin

### 11.3 Integraciones
- WhatsApp Business API
- Email notifications
- Slack/Discord webhooks
- SMS notifications

---

## 12. Resumen Técnico

### 12.1 Componentes
- **Frontend**: 3 líneas de código por evento
- **Backend**: 1 Edge Function (~200 líneas)
- **Configuración**: 2 secrets en Supabase
- **Dependencias**: 0 (solo APIs nativas)

### 12.2 Impacto en Sistema
- **Rendimiento**: Mínimo (fire-and-forget)
- **Recursos**: Bajo (solo Edge Function cuando se necesita)
- **Mantenimiento**: Bajo (sin dependencias externas)
- **Escalabilidad**: Alta (arquitectura modular)

### 12.3 Costos Estimados
- **Supabase Edge Functions**: Incluido en tier gratuito
- **Telegram API**: Gratis (hasta límites generosos)
- **Desarrollo**: 2-4 horas implementación completa

---

## 13. Checklist Final de Implementación

### Pre-requisitos
- [ ] Bot de Telegram creado y token obtenido
- [ ] Grupo creado y chat_id obtenido
- [ ] Secrets configurados en Supabase
- [ ] Acceso admin a Supabase Dashboard

### Implementación
- [ ] Edge Function `telegram-notify` creada
- [ ] Lógica de eventos implementada
- [ ] Plantillas de mensajes configuradas
- [ ] Deduplicación funcionando
- [ ] Manejo de errores implementado

### Integración
- [ ] Llamada agregada en `verificacion.html`
- [ ] Llamada agregada en `admin-panel.js`
- [ ] (Opcional) Llamada agregada en `validador-ios.html`
- [ ] Feature flag implementado

### Testing
- [ ] Evento `payment_pending_created` probado
- [ ] Evento `payment_approved` probado
- [ ] Evento `payment_rejected` probado
- [ ] Deduplicación verificada
- [ ] Flujos principales no afectados
- [ ] Error handling probado

### Producción
- [ ] Deploy a producción
- [ ] Monitoreo configurado
- [ ] Documentación actualizada
- [ ] Equipo capacitado

---

## 14. Contacto y Soporte

Para implementación, dudas o incidencias:
- **Documentación**: Este archivo
- **Logs**: Supabase Dashboard → Edge Functions
- **Telegram**: @BotFather para gestión del bot
- **Testing**: Usar chat de prueba antes de producción

---

**Fecha de creación**: 19 de febrero de 2026  
**Versión**: 1.0  
**Estado**: Planificación completada, listo para implementación
