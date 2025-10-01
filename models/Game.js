import Board from './Board.js';
import Square from './SquareBase.js'; // no lo usamos directo, pero queda listo
import BoardRenderer from '../utils/BoardRenderer.js';
import BoardUtils from '../utils/BoardUtils.js';
import GameRules from './GameRules.js';
// Mixins
import { applyNotifications } from './gameParts/notifications.js';
import { applyTurns } from './gameParts/turns.js';
import { applyPlayers } from './gameParts/players.js';
import { applyProperties } from './gameParts/properties.js';
import { applyCards } from './gameParts/cards.js'; // NUEVO: mixin de cartas
import { applyJail } from './gameParts/jail.js';
import { applyTaxes } from './gameParts/taxes.js';
import { applyUiState } from './gameParts/uiState.js';
import { applyActions } from './gameParts/actions.js';
import { applyEndgame } from './gameParts/endgame.js';
import { applyPropertyVisuals } from './gameParts/propertyVisuals.js';
import { applyStatsPanel } from './gameParts/statsPanel.js';

class Game {
    constructor(containerSelector = '#boardContainer') {
        this.containerSelector = containerSelector;
        this.board = null;
        this.renderer = null;
        this.players = [];
        this.currentPlayerIndex = 0;
        this.gameStarted = false;
        this.eventListenersConfigured = false;
    }

    async initialize(totalSquares = 40){
        try {
            this.board = new Board();
            await this.board.initialize();
            this.renderer = new BoardRenderer(this.containerSelector, this.board, { totalSquares });
            this.renderer.render();
            if(typeof this.loadPlayersFromStorage === 'function') this.loadPlayersFromStorage();
            if(typeof this.renderPlayerTokens === 'function') this.renderPlayerTokens();
            if(typeof this.actualizarEstadoBotones === 'function') this.actualizarEstadoBotones();
            console.log('✅ initialize completado');
        } catch(err){
            console.error('❌ Error en initialize()', err);
        }
    }

    // (Visualización de propiedades e hipotecas movida a propertyVisuals mixin)

    /**
     * Configura todos los eventos de botones del menú lateral
     */
    configurarEventosBotones() {
        // Evitar duplicación de event listeners
        if (this.eventListenersConfigured) {
            console.log('⚠️ Event listeners ya configurados, omitiendo duplicación...');
            return;
        }

        console.log('🔧 Configurando eventos de botones del menú lateral...');
        console.log(`   • Jugadores cargados: ${this.players.length}`);
        console.log(`   • Juego iniciado: ${this.gameStarted}`);

        // Botón principal de dados
        const btnLanzarDados = document.getElementById('btnLanzarDados');
        if (btnLanzarDados) {
            btnLanzarDados.addEventListener('click', () => {
                console.log(`🎲 Click en dados. Jugadores: ${this.players.length}, Iniciado: ${this.gameStarted}`);
                if (this.players.length > 0) {
                    this.gameStarted = true; // Asegurar que esté iniciado
                    this.showDiceBox();
                } else {
                    this.notifyWarn('Configura jugadores', 'Primero debes crear jugadores en el menú principal (index.html).');
                }
            });
            console.log('✅ Event listener agregado a btnLanzarDados');
        } else {
            console.error('❌ No se encontró btnLanzarDados');
        }

        // Botón Comprar Propiedad
        const btnComprarPropiedad = document.getElementById('btnComprarPropiedad');
        if (btnComprarPropiedad) {
            btnComprarPropiedad.addEventListener('click', () => {
                console.log('🏠 Click en Comprar Propiedad');
                this.executeAction?.('comprar');
            });
            console.log('✅ Event listener agregado a btnComprarPropiedad');
        } else {
            console.error('❌ No se encontró btnComprarPropiedad');
        }

        // Botón Pagar Renta
        const btnPagarRenta = document.getElementById('btnPagarRenta');
        if (btnPagarRenta) {
            btnPagarRenta.addEventListener('click', () => {
                console.log('💰 Click en Pagar Renta (manual)');
                this.executeAction?.('renta');
            });
            console.log('✅ Event listener agregado a btnPagarRenta');
        } else {
            console.error('❌ No se encontró btnPagarRenta');
        }

        // Botón Construir Casa
        const btnConstruirCasa = document.getElementById('btnConstruirCasa');
        if (btnConstruirCasa) {
            btnConstruirCasa.addEventListener('click', () => {
                console.log('🏘️ Click en Construir Casa');
                this.executeAction?.('construirCasa');
            });
            console.log('✅ Event listener agregado a btnConstruirCasa');
        } else {
            console.error('❌ No se encontró btnConstruirCasa');
        }

        // Botón Construir Hotel
        const btnConstruirHotel = document.getElementById('btnConstruirHotel');
        if (btnConstruirHotel) {
            btnConstruirHotel.addEventListener('click', () => {
                console.log('🏨 Click en Construir Hotel');
                this.executeAction?.('construirHotel');
            });
            console.log('✅ Event listener agregado a btnConstruirHotel');
        } else {
            console.error('❌ No se encontró btnConstruirHotel');
        }

        // Botón Hipotecar
        const btnHipotecar = document.getElementById('btnHipotecar');
        if (btnHipotecar) {
            btnHipotecar.addEventListener('click', () => {
                console.log('🏦 Click en Hipotecar');
                this.executeAction?.('hipotecar');
            });
            console.log('✅ Event listener agregado a btnHipotecar');
        } else {
            console.error('❌ No se encontró btnHipotecar');
        }

        // Botón Deshipotecar
        const btnDeshipotecar = document.getElementById('btnDeshipotecar');
        if (btnDeshipotecar) {
            btnDeshipotecar.addEventListener('click', () => {
                console.log('🔓 Click en Deshipotecar');
                this.executeAction?.('deshipotecar');
            });
            console.log('✅ Event listener agregado a btnDeshipotecar');
        } else {
            console.error('❌ No se encontró btnDeshipotecar');
        }

        // Botón Carta Sorpresa
        const btnCartaSorpresa = document.getElementById('btnCartaSorpresa');
        if (btnCartaSorpresa) {
            btnCartaSorpresa.addEventListener('click', () => {
                console.log('🎯 Click en Carta Sorpresa');
                const currentPlayer = this.players[this.currentPlayerIndex];
                if (!this.gameStarted || !currentPlayer) return;
                const square = this.board.squares[currentPlayer.position];
                if (!square || square.type !== 'chance') {
                    this.notifyWarn('No estás en Suerte', 'Solo puedes tomar carta aquí cuando caes en una casilla Suerte.');
                    return;
                }
                if (currentPlayer) {
                    if (currentPlayer.chanceDrawn) {
                        this.notifyWarn('Carta ya tomada', 'Ya tomaste una carta de Suerte en este aterrizaje.');
                        return;
                    }
                    this.manejarSuerte(currentPlayer);
                }
            });
            console.log('✅ Event listener agregado a btnCartaSorpresa');
        } else {
            console.error('❌ No se encontró btnCartaSorpresa');
        }

        // Botón Caja de Comunidad
        const btnCajaComunidad = document.getElementById('btnCajaComunidad');
        if (btnCajaComunidad) {
            btnCajaComunidad.addEventListener('click', () => {
                console.log('📦 Click en Caja de Comunidad');
                const currentPlayer = this.players[this.currentPlayerIndex];
                if (!this.gameStarted || !currentPlayer) return;
                const square = this.board.squares[currentPlayer.position];
                if (!square || square.type !== 'community_chest') {
                    this.notifyWarn('No estás en Comunidad', 'Solo puedes tomar carta aquí cuando caes en una casilla de Comunidad.');
                    return;
                }
                if (currentPlayer) {
                    if (currentPlayer.communityDrawn) {
                        this.notifyWarn('Carta ya tomada', 'Ya tomaste una carta de Comunidad en este aterrizaje.');
                        return;
                    }
                    this.manejarCajaComunidad(currentPlayer);
                }
            });
            console.log('✅ Event listener agregado a btnCajaComunidad');
        } else {
            console.error('❌ No se encontró btnCajaComunidad');
        }

        // Botón Pagar Impuesto
        const btnPagarImpuesto = document.getElementById('btnPagarImpuesto');
        if (btnPagarImpuesto) {
            btnPagarImpuesto.addEventListener('click', () => {
                console.log('💸 Click en Pagar Impuesto');
                this.executeAction?.('impuesto');
            });
            console.log('✅ Event listener agregado a btnPagarImpuesto');
        } else {
            console.error('❌ No se encontró btnPagarImpuesto');
        }

        // Botón Ir a Cárcel / Salir de Cárcel
        const btnIrCarcel = document.getElementById('btnIrCarcel');
        if (btnIrCarcel) {
            btnIrCarcel.addEventListener('click', () => {
                console.log('🚔 Click en Ir Cárcel / Salir');
                this.executeAction?.('carcel');
            });
            console.log('✅ Event listener agregado a btnIrCarcel');
        } else {
            console.error('❌ No se encontró btnIrCarcel');
        }

        // Botón Finalizar Juego
        const btnFinalizarJuego = document.getElementById('btnFinalizarJuego');
        if (btnFinalizarJuego) {
            btnFinalizarJuego.addEventListener('click', () => {
                console.log('🏁 Click en Finalizar Juego');
                // Mostrar ganador actual antes de proceso completo
                this.mostrarGanadorActual();
                // Ejecutar flujo completo (ranking, envío backend, etc.)
                this.finalizarJuego();
            });
            console.log('✅ Event listener agregado a btnFinalizarJuego');
        } else {
            console.error('❌ No se encontró btnFinalizarJuego');
        }

        // Botón Ver Ranking
        const btnRankingSidebar = document.getElementById('btnRankingSidebar');
        if (btnRankingSidebar) {
            btnRankingSidebar.addEventListener('click', () => {
                console.log('📊 Click en Ver Ranking');
                window.location.href = 'ranking.html';
            });
            console.log('✅ Event listener agregado a btnRankingSidebar');
        } else {
            console.error('❌ No se encontró btnRankingSidebar');
        }

        console.log('✅ Eventos de botones configurados correctamente');
        console.log(`🎮 Estado final - Jugadores: ${this.players.length}, Iniciado: ${this.gameStarted}`);
        
        // Marcar que los event listeners ya han sido configurados
        this.eventListenersConfigured = true;
        
        // Actualizar estado inicial de los botones
        this.actualizarEstadoBotones?.();
        this.agregarTooltipsAcciones?.();
    }


    // (Hipoteca y deshipoteca movidos a propertyVisuals mixin)


}

// Aplicar extensiones (mixins) al prototipo
applyPlayers(Game);
applyProperties(Game); // <-- necesario para métodos de propiedades (puedeConstructor, manejarPropiedad, etc.)
applyCards(Game); // Métodos de cartas (Suerte / Comunidad)
applyNotifications(Game);
applyTurns(Game);
applyJail(Game);
applyTaxes(Game);
applyUiState(Game);
applyActions(Game);
applyEndgame(Game);
applyPropertyVisuals(Game);
applyStatsPanel(Game);

// Inicialización automática al cargar la página
document.addEventListener('DOMContentLoaded', async () => {
    const game = new Game('#boardContainer');
    await game.initialize(40); // por defecto 40 casillas
    window.game = game; // para inspeccionar desde consola
    
    // Configurar eventos de botones del menú lateral
    game.configurarEventosBotones();
});



export default Game;