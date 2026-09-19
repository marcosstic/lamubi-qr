# Botón de compra del evento PROJECT X - LA MUBI EN VALERA - VOCAS

Este documento describe el botón de compra del evento "LA MUBI EN VALERA - VOCAS" (estilo PROJECT X).

## Ubicación del código

**Archivo:** `index.html`
**Líneas del botón:** 1060-1063
**Líneas CSS del botón:** 658-687
**Líneas de texto dinámico:** 1274 (loadTicketPrice)

## Configuración actual

El botón PROJECT X usa evento_id=1 (General) y obtiene el precio de `configuracion_sistema` (panel admin).

```javascript
// Event listener del botón (línea 1208-1211)
mainCta.addEventListener('click', function(e) {
    e.preventDefault();
    navigateToPurchase(1); // General usa evento_id=1
});
```

## Estilo del botón

El botón tiene estilo PROJECT X con verde fosforescente:

```css
.project-x-button {
    background: linear-gradient(45deg, #00ff00, #39ff14, #00ff7f) !important;
    box-shadow: 0 0 20px rgba(0, 255, 0, 0.6), 0 0 40px rgba(57, 255, 20, 0.4) !important;
    animation: projectXPulse 2s ease-in-out infinite alternate;
}
```

## Texto del botón

**Texto estático (línea 1061):** `LA MUBI EN VALERA - VOCAS`

**Texto dinámico con precio (línea 1274):** `LA MUBI EN VALERA - VOCAS - $X - COMPRAR ENTRADA`

El precio se obtiene dinámicamente de `window.LAMUBI_UTILS.getTicketPriceUSD()`.

## Texto del contador

**Línea 1053:** `LA MUBI EN VALERA - VOCAS entradas vendidas 144 de 1000 disponibles`

## Flujo de compra

1. Usuario presiona el botón PROJECT X
2. Se guarda `evento_id=1` en localStorage
3. Se redirige a `comprar.html`
4. El precio se obtiene de `configuracion_sistema` (panel admin)
5. El flujo de compra funciona normalmente

## Cómo bloquear todas las compras

Para bloquear TODOS los botones de compra (incluyendo PROJECT X):

1. Abrir el archivo `index.html`
2. Buscar la línea 1061
3. Cambiar `COMPRAS_BLOQUEADAS = false` a `COMPRAS_BLOQUEADAS = true`
4. Guardar el archivo
5. Todos los botones estarán bloqueados

## Cómo desbloquear todas las compras

1. Abrir el archivo `index.html`
2. Buscar la línea 1061
3. Cambiar `COMPRAS_BLOQUEADAS = true` a `COMPRAS_BLOQUEADAS = false`
4. Guardar el archivo
5. Todos los botones estarán desbloqueados
