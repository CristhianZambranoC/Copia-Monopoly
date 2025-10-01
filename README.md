# Monopoly Frontend (Arquitectura Modular)

## Visión General
Este frontend implementa un Monopoly simplificado usando **ES Modules** y un patrón de **mixins idempotentes** para extender la clase principal `Game` sin generar un archivo monolítico enorme.

## Núcleo
- `models/Game.js`: Orquestación. Crea tablero, aplica mixins, inicializa, configura eventos.
- `models/Board.js`: Carga y organiza casillas desde backend (`/board`). Corrige datos y construye instancias de `Square`.
- `models/Square.js` / `SquareBase.js`: Modelo de casilla.
- `models/property.js`, `Railroad.js`, `Carta.js`, `player.js`: Entidades de dominio.

## Mixins (carpeta `models/gameParts/`)
Cada mixin añade métodos al prototipo de `Game` y se protege con una bandera (`Game.__nombreApplied`).

| Mixin | Responsabilidad |
|-------|------------------|
| `players.js` | Creación/carga de jugadores, movimiento y fichas. (Ahora sin panel de stats) |
| `properties.js` | Lógica de compra, renta, construcción, validaciones de integridad. |
| `cards.js` | Manejo de cartas (Suerte / Comunidad) y ejecución de acciones. |
| `notifications.js` | Sistema de notificaciones / mensajes contextualizados. |
| `turns.js` | Flujo de turnos, lanzamiento de dados, avance y control de dobles. |
| `jail.js` | Estados y reglas de cárcel (entrada/salida). |
| `taxes.js` | Resolución de casillas de impuestos. |
| `uiState.js` | Habilitar/deshabilitar botones y tooltips de motivos. |
| `actions.js` | Mapa central `actionHandlers` + `executeAction()` + `ejecutarAccionCasilla()`. |
| `endgame.js` | Cálculo de patrimonio, ranking, envío de puntajes, finalización. |
| `propertyVisuals.js` | Indicadores visuales de propiedad, hipoteca, casas/hotel. |
| `statsPanel.js` | Render dinámico del panel de estadísticas (extraído de `players`). |

## Configuración Backend
La URL base del backend se centraliza en `utils/config.mjs`:
```js
export const API_BASE = "http://127.0.0.1:5000";
```
Modifica allí si despliegas en otra ruta.

## Servicios / API
- `controllers/api.js`: Wrap genérico fetch (countries, board, ranking, score). Usa `API_BASE`.
- `controllers/player.service.js`: Normalización y envío de puntajes.
- `controllers/property.service.js`: Servicios de tablero normalizado y construcción (usa cache local).

## Flujo de Inicialización (game.html)
1. Carga `Game.js` (que importa y aplica todos los mixins).
2. `DOMContentLoaded` crea instancia `new Game('#boardContainer')`.
3. `game.initialize()` → fetch tablero → render → carga jugadores (storage o prueba) → render fichas.
4. Se configuran listeners de botones y se actualiza UI state.

## Acciones Centralizadas
Las acciones del sidebar llaman a `game.executeAction(nombre)`:
```js
this.executeAction('comprar');
```
`actions.js` resuelve validaciones y delega.

## Panel de Estadísticas
Extraído a `statsPanel.js`. Métodos:
- `initPlayerStatsPanel()`
- `updatePlayerStatsPanel()`

Se llama automáticamente desde otros mixins cuando cambian estado/dinero/propiedades.

## Eventos Personalizados (Custom Events)
El juego emite eventos sobre `window` para permitir extensiones sin acoplarse a la lógica interna.

Listener básico:
```js
window.addEventListener('property:mortgaged', e => {
	console.log('Propiedad hipotecada', e.detail);
});
```

Eventos disponibles:

| Evento | Detalle (`event.detail`) | Descripción |
|--------|--------------------------|-------------|
| `property:mortgaged` | `{ playerId, player, squareId, name, amount }` | Se hipotecó una propiedad. |
| `property:unmortgaged` | `{ playerId, player, squareId, name, cost }` | Se deshipotecó una propiedad. |
| `property:visual-updated` | `{ squareId, type, ... }` | Cambios visuales: `indicator`, `buildings`, `mortgage`, `unmortgage`. |
| `player:stats-updated` | `{ playerId }` | Stats de un jugador recalculadas. |

Uso potencial:
- Integrar un logger / analytics.
- Mostrar un feed en tiempo real ("Jugador X hipotecó Park Place").
- Disparar autosave cuando ocurren operaciones económicas.

Si deseas añadir más eventos, reutiliza el helper `emitGameEvent(nombre, detail)` ya definido en `propertyVisuals`.

## Patrimonio y Ranking
En `endgame.js`:
- `calcularPatrimonio(player)`
- `finalizarJuego()`
- `mostrarGanadorActual()` / `mostrarModalGanador()`
- Envío al backend con fallback local.

## Extender el Juego
Para añadir un nuevo dominio (ej: auditoría):
1. Crear archivo `models/gameParts/auditoria.js`.
2. Exportar función `applyAuditoria(Game){ if(Game.__auditoriaApplied) return; ... }`.
3. Añadir `import { applyAuditoria } ...` y llamar `applyAuditoria(Game);` en `Game.js`.

## Principios Clave
- **Idempotencia**: Cada mixin se aplica una sola vez; evita colisiones.
- **Responsabilidad única**: Cada archivo tiene un enfoque claro.
- **No duplicar reglas**: Validaciones y efectos de juego centralizados (acciones, UI state, endgame).
- **Fallback limpio**: Cuando backend incompleto → `Board.getFallbackChanceCards()` / `getFallbackCommunityCards()`.

## Limpieza Reciente
Eliminados controladores antiguos y demos (`ControladorJuego`, `BoardService`, `ServicioCartas`, html de pruebas) para reducir ruido técnico.

## Próximas Mejores Prácticas (Opcional)
- Unificar apertura de modales de hipoteca usando directamente `hipotecarPropiedad()` y `deshipotecarPropiedad()` en lugar de lógica duplicada dentro de scripts de modal.
- Crear capa de logging configurable (silenciar en producción).
- Test unitarios ligeros para cálculo de renta y patrimonio (añadir vitest / jest si se desea).

## Troubleshooting Rápido
| Síntoma | Posible causa | Acción |
|---------|---------------|--------|
| No aparecen fichas | `board.initialize()` falló o no hay casilla id 0 | Revisar consola/red; backend activo. |
| Botones siempre deshabilitados | `actualizarEstadoBotones()` no se llama | Ver mixin `uiState.js` y que `gameStarted=true`. |
| Renta incorrecta en ferrocarriles | Propiedad en cache no refleja owner | Revisar `property.service.js` y sincronización. |
| Cartas no cargan | Backend sin campos `chance` / `community_chest` | Se usan fallback, revisar logs. |

## Licencia / Créditos
Proyecto educativo - Universidad de Caldas.

---
Si añades un nuevo mixin, documenta su propósito aquí para mantener coherencia.
