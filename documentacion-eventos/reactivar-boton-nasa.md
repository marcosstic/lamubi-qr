# Reactivar botón de compra del evento NASA

Este documento explica cómo reactivar el botón de compra del evento "LOS DE LA NASA - TROCO B-DAY BASH" cuando esté bloqueado.

## Ubicación del código

**Archivo:** `index.html`
**Líneas:** 1063-1068

## Configuración actual

El botón NASA está controlado por la variable de configuración `EVENT_CONFIG.nasa.enabled`:

```javascript
const EVENT_CONFIG = {
    nasa: {
        enabled: false, // Cambiar a true para reactivar compras del evento NASA
        disabledText: 'ENTRADAS DISPONIBLES SOLO EN PUERTA'
    }
};
```

## Estados del botón

### Estado actual (enabled: false)
- El botón muestra el texto normal con precio
- Al presionar el botón, se muestra un modal
- El modal dice: "ENTRADAS DISPONIBLES SOLO EN PUERTA PARA EVENTO LOS DE LA NASA - TROCO B-DAY BASH"
- NO hay redirección a la página de compra
- El modal tiene una X para cerrar
- El modal se cierra al hacer clic en la X o fuera del modal

### Estado reactivado (enabled: true)
- El botón muestra el texto normal con precio
- Al presionar el botón, se redirige a `comprar.html`
- El modal NO aparece
- El flujo de compra funciona normalmente

## Cómo reactivar el botón

1. Abrir el archivo `index.html`
2. Buscar la línea 1065
3. Cambiar `enabled: false` a `enabled: true`
4. Guardar el archivo
5. El botón estará reactivado

## Cómo volver a bloquear el botón

1. Abrir el archivo `index.html`
2. Buscar la línea 1065
3. Cambiar `enabled: true` a `enabled: false`
4. Guardar el archivo
5. El botón estará bloqueado nuevamente

## Ubicación del modal

**HTML:** Líneas 1081-1087
**CSS:** Líneas 689-759
**JavaScript:** Líneas 1307-1323 (funcionalidad para cerrar modal)

## Estilos responsive del modal

El modal tiene estilos responsive para:
- **768px:** max-width 90%, font-size 1rem
- **414px:** max-width 95%, font-size 0.9rem, line-height 1.4
