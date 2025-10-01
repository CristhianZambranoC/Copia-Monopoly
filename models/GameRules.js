/**
 * Sistema de Reglas del Monopoly
 * Un enfoque simple y directo para validaciones
 */

class GameRules {
    constructor(game) {
        this.game = game;
        this.init();
    }

    init() {
        console.log('🎯 Inicializando sistema de reglas básico');
        this.setupButtonValidation();
    }

    /**
     * Configuración simple de validación de botones
     */
    setupButtonValidation() {
        // Interceptar clics en botones de acciones
        document.addEventListener('click', (e) => {
            const button = e.target.closest('button');
            if (!button || button.disabled) return;

            // Solo validar botones de juego específicos
            const gameButtons = ['btnComprarPropiedad', 'btnConstruirCasa', 'btnConstruirHotel', 
                                'btnHipotecar', 'btnDeshipotecar', 'btnIrCarcel'];
            
            if (!gameButtons.includes(button.id)) return;

            const validation = this.validateAction(button.id);
            if (!validation.valid) {
                e.preventDefault();
                e.stopPropagation();
                this.showError(validation.reason);
                return false;
            }
        }, true);
    }

    /**
     * Validación simple de acciones
     */
    validateAction(buttonId) {
        if (!this.game.players || !this.game.players.length) {
            return { valid: false, reason: 'No hay jugadores en el juego' };
        }

        const currentPlayer = this.game.players[this.game.currentPlayerIndex];
        if (!currentPlayer) {
            return { valid: false, reason: 'Jugador actual no encontrado' };
        }

        const square = this.game.board.squaresByPosition[currentPlayer.position || 0];
        if (!square) {
            return { valid: false, reason: 'Casilla no encontrada' };
        }

        switch(buttonId) {
            case 'btnComprarPropiedad':
                return this.validatePurchase(currentPlayer, square);
            case 'btnConstruirCasa':
                return this.validateBuild(currentPlayer, square, 'house');
            case 'btnConstruirHotel':
                return this.validateBuild(currentPlayer, square, 'hotel');
            case 'btnHipotecar':
                return this.validateMortgage(currentPlayer, square, true);
            case 'btnDeshipotecar':
                return this.validateMortgage(currentPlayer, square, false);
            case 'btnIrCarcel':
                return this.validateJailExit(currentPlayer);
            default:
                return { valid: true };
        }
    }

    /**
     * Validar compra de propiedad
     */
    validatePurchase(player, square) {
        // Básico: debe tener dinero y la propiedad debe estar libre
        if (player.estaEnCarcel) {
            return { valid: false, reason: 'No puedes comprar en la cárcel' };
        }

        if (!['property', 'railroad', 'utility'].includes(square.type)) {
            return { valid: false, reason: 'Esta casilla no se puede comprar' };
        }

        const price = square.price || 100;
        if (player.dinero < price) {
            return { valid: false, reason: `Necesitas $${price}. Tienes $${player.dinero}` };
        }

        // Verificar si ya tiene dueño
        const owner = this.game.players.find(p => 
            p.propiedades?.some(prop => prop.id === square.id)
        );
        if (owner) {
            return { valid: false, reason: `Ya pertenece a ${owner.nickname}` };
        }

        return { valid: true };
    }

    /**
     * Validar construcción
     */
    validateBuild(player, square, type) {
        if (player.estaEnCarcel) {
            return { valid: false, reason: 'No puedes construir en la cárcel' };
        }

        // Debe ser propietario
        const property = player.propiedades?.find(p => p.id === square.id);
        if (!property) {
            return { valid: false, reason: 'No eres propietario' };
        }

        // No puede estar hipotecada
        if (property.hipotecada) {
            return { valid: false, reason: 'Propiedad hipotecada' };
        }

        const cost = type === 'house' ? 100 : 250;
        if (player.dinero < cost) {
            return { valid: false, reason: `Necesitas $${cost}` };
        }

        if (type === 'house') {
            if (property.hotel) return { valid: false, reason: 'Ya hay hotel' };
            if (property.casas >= 4) return { valid: false, reason: 'Máximo 4 casas' };
        } else {
            if (property.hotel) return { valid: false, reason: 'Ya hay hotel' };
            if (property.casas < 4) return { valid: false, reason: 'Necesitas 4 casas' };
        }

        return { valid: true };
    }

    /**
     * Validar hipoteca
     */
    validateMortgage(player, square, isMortgage) {
        if (player.estaEnCarcel) {
            return { valid: false, reason: 'No puedes hipotecar en la cárcel' };
        }

        const property = player.propiedades?.find(p => p.id === square.id);
        if (!property) {
            return { valid: false, reason: 'No eres propietario' };
        }

        if (isMortgage) {
            if (property.hipotecada) return { valid: false, reason: 'Ya hipotecada' };
            if (property.casas > 0 || property.hotel) {
                return { valid: false, reason: 'Vende construcciones primero' };
            }
        } else {
            if (!property.hipotecada) return { valid: false, reason: 'No está hipotecada' };
            const cost = Math.floor((square.mortgage || square.price / 2) * 1.1);
            if (player.dinero < cost) return { valid: false, reason: `Necesitas $${cost}` };
        }

        return { valid: true };
    }

    /**
     * Validar salida de cárcel
     */
    validateJailExit(player) {
        if (!player.estaEnCarcel) {
            return { valid: false, reason: 'No estás en la cárcel' };
        }

        if (player.dinero < 50) {
            return { valid: false, reason: 'Necesitas $50 para salir' };
        }

        return { valid: true };
    }

    /**
     * Mostrar error
     */
    showError(message) {
        console.log(`❌ REGLA VIOLADA: ${message}`);
        
        // Mostrar en UI si hay un elemento de mensajes
        const messageEl = document.querySelector('.game-message') || 
                         document.querySelector('#mensaje-juego') ||
                         document.querySelector('.alert');
        
        if (messageEl) {
            messageEl.textContent = `❌ ${message}`;
            messageEl.className = 'alert alert-danger';
            messageEl.style.display = 'block';
            setTimeout(() => {
                messageEl.style.display = 'none';
            }, 3000);
        } else {
            // Fallback: usar alert del navegador
            alert(`❌ ${message}`);
        }
    }
}

export default GameRules;