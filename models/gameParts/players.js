// Módulo de gestión de jugadores, fichas y panel de estadísticas
// Uso: import { applyPlayers } from './gameParts/players.js'; applyPlayers(Game);

export function applyPlayers(Game) {
    if (!Game || typeof Game !== 'function') return;
    if (Game.__playersApplied) return;
    Game.__playersApplied = true;

    // Fallback de conversión de color a CSS si no está definido en Game
    if (typeof Game.prototype.colorToCSS !== 'function') {
        Game.prototype.colorToCSS = function (color) {
            if (!color) return '#64748b';
            if (/^#|rgb|hsl/i.test(color)) return color; // ya es un valor CSS
            const mapa = {
                'Rojo': '#dc2626', 'Azul': '#2563eb', 'Verde': '#059669', 'Amarillo': '#eab308', 'Naranja': '#f97316', 'Morado': '#7e22ce', 'Rosa': '#ec4899', 'Negro': '#111827', 'Blanco': '#f8fafc',
                'Gris': '#64748b', 'Cian': '#06b6d4', 'Lima': '#65a30d', 'Marrón': '#92400e'
            };
            return mapa[color] || '#64748b';
        };
    }

    // Helper interno reutilizable
    function ensureJailAPI(player) {
        if (typeof player.goToJail === 'function') return player;
        player.turnosCarcel = player.turnosCarcel ?? player.turnosEnCarcel ?? 0;
        player.goToJail = function () { this.estaEnCarcel = true; this.turnosCarcel = 0; };
        player.leaveJail = function () { this.estaEnCarcel = false; this.turnosCarcel = 0; };
        player.incrementJailTurn = function () { if (this.estaEnCarcel) this.turnosCarcel = (this.turnosCarcel || 0) + 1; return this.turnosCarcel; };
        player.tryLeaveJail = function ({ pay = false, cost = 50, dice = null, maxTurns = 3 } = {}) {
            if (!this.estaEnCarcel) return { freed: true, reason: null };
            if (pay && (this.dinero || 0) >= cost) { this.dinero -= cost; this.leaveJail(); return { freed: true, reason: 'pay' }; }
            if (dice?.isDouble) { this.leaveJail(); return { freed: true, reason: 'double' }; }
            const t = this.incrementJailTurn();
            if (t >= maxTurns && (this.dinero || 0) >= cost) { this.dinero -= cost; this.leaveJail(); return { freed: true, reason: 'autoPay' }; }
            return { freed: false, reason: null };
        };
        return player;
    }

    // Carga jugadores desde localStorage o crea de prueba
    Game.prototype.loadPlayersFromStorage = function () {
        const jugadoresData = localStorage.getItem('jugadores');
        const numJugadores = localStorage.getItem('numJugadores');
        if (jugadoresData && numJugadores) {
            try {
                const jugadores = JSON.parse(jugadoresData);
                console.log(`🔄 Cargando ${numJugadores} jugadores desde localStorage...`);
                this.players = [];
                jugadores.forEach((jugadorData, index) => {
                    const player = {
                        id: index + 1,
                        nickname: jugadorData.nickname || `Jugador ${index + 1}`,
                        color: jugadorData.color || 'Rojo',
                        ficha: jugadorData.ficha || '🔴',
                        pais: (jugadorData.pais || jugadorData.country_code || 'XX').toUpperCase(),
                        country_code: (jugadorData.country_code || jugadorData.pais || 'XX').toLowerCase(),
                        position: 0,
                        dinero: 1500,
                        propiedades: [],
                        estaEnCarcel: false
                    };
                    this.players.push(ensureJailAPI(player));
                });
                this.gameStarted = true; this.currentPlayerIndex = 0;
                setTimeout(() => { this.renderPlayerTokens(); try { this.sincronizarPropiedadesJugadorAlTablero(); } catch (e) { } }, 500);
                localStorage.removeItem('jugadores'); localStorage.removeItem('numJugadores');
            } catch (e) {
                console.error('❌ Error cargando jugadores:', e); this.createTestPlayers();
            }
        } else {
            console.log('ℹ️ No hay jugadores en storage, creando prueba');
            this.createTestPlayers();
            try { this.sincronizarPropiedadesJugadorAlTablero(); } catch (e) { }
        }
    };

    // Jugadores de prueba
    Game.prototype.createTestPlayers = function () {
        const testPlayers = [
            { nickname: 'Jugador1', color: 'Rojo', ficha: '🔴', pais: 'CO' },
            { nickname: 'Jugador2', color: 'Azul', ficha: '🔵', pais: 'US' }
        ];
        this.players = [];
        testPlayers.forEach((p, i) => {
            const player = { id: i + 1, nickname: p.nickname, color: p.color, ficha: p.ficha, pais: p.pais, position: 0, dinero: 1500, propiedades: [], estaEnCarcel: false };
            this.players.push(ensureJailAPI(player));
        });
        this.gameStarted = true; this.currentPlayerIndex = 0;
        this.renderPlayerTokens();
        console.log('🧪 Jugadores de prueba creados:', this.players.map(p => p.nickname));
    };

    // Debug squares
    Game.prototype.debugSquares = function () {
        const squares = document.querySelectorAll('[data-square-id]');
        console.log(`🔍 Se encontraron ${squares.length} casillas`);
        if (!squares.length) {
            const alt = document.querySelectorAll('.square');
            console.log(`Alternativa .square -> ${alt.length}`);
        }
    };

    // Render principal de fichas
    Game.prototype.renderPlayerTokens = function () {
        console.log('🎯 Renderizando fichas...');
        this.debugSquares();
        if (!this.board || !this.players.length) return;
        this.clearPlayerTokens();
        let startSquare = document.querySelector('[data-square-id="0"]') || document.querySelector('#square-0') || document.querySelector('.square[data-id="0"]') || document.querySelector('.corner:first-child') || document.querySelector('.square:first-child');
        if (!startSquare) { console.error('❌ No se encontró casilla SALIDA'); return; }
        this.renderTokensInSquare(startSquare);
    };

    // Render fichas en una casilla
    // En el método renderTokensInSquare, modificar la creación de fichas:
    Game.prototype.renderTokensInSquare = function (squareElement) {
        let tokensContainer = squareElement.querySelector('.player-tokens');
        if (!tokensContainer) {
            tokensContainer = document.createElement('div');
            tokensContainer.className = 'player-tokens';
            squareElement.appendChild(tokensContainer);
        }
        tokensContainer.innerHTML = '';

        this.players.forEach((player, idx) => {
            const el = document.createElement('div');
            el.className = `player-token player-${player.id}`;
            el.dataset.playerId = player.id;
            el.dataset.position = player.position || 0;

            // Aplicar el color seleccionado en el formulario
            const playerColor = player.color.toLowerCase();
            let backgroundColor;

            // Mapear los colores a códigos hexadecimales
            // En el método renderTokensInSquare, modificar el switch de colores:
            switch (playerColor) {
                case 'rojo':
                    backgroundColor = 'linear-gradient(135deg, #FF6B6B 0%, #FF5252 100%)';
                    break;
                case 'azul':
                    backgroundColor = 'linear-gradient(135deg, #4ECDC4 0%, #26A69A 100%)';
                    break;
                case 'verde':
                    backgroundColor = 'linear-gradient(135deg, #4CAF50 0%, #388E3C 100%)'; // Corregido a tonos verdes
                    break;
                case 'amarillo':
                    backgroundColor = 'linear-gradient(135deg, #F9CA24 0%, #FFC107 100%)';
                    break;
                default:
                    backgroundColor = 'linear-gradient(135deg, #FF6B6B 0%, #FF5252 100%)';
            }

            // Aplicar estilos a la ficha
            el.style.background = backgroundColor;
            el.style.color = playerColor === 'amarillo' ? '#000' : '#fff';

            if (this.currentPlayerIndex === idx) {
                el.classList.add('active');
            }

            el.innerHTML = player.ficha || player.nickname.charAt(0).toUpperCase();
            el.title = `${player.nickname} - $${player.dinero || 1500} - ${player.color}`;
            el.addEventListener('click', () => this.showPlayerInfo(player));

            tokensContainer.appendChild(el);
            setTimeout(() => {
                el.style.animationDelay = `${idx * 0.1}s`;
            }, 50);
        });
    };

    // Info popup jugador
    Game.prototype.showPlayerInfo = function (player) {
        let tooltip = document.getElementById('player-tooltip');
        if (!tooltip) {
            tooltip = document.createElement('div'); tooltip.id = 'player-tooltip';
            tooltip.style.cssText = `position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:linear-gradient(135deg,rgba(0,0,0,.95),rgba(33,33,33,.95));color:#fff;padding:20px;border-radius:12px;box-shadow:0 10px 30px rgba(0,0,0,.5);z-index:10000;min-width:250px;text-align:center;`;
            document.body.appendChild(tooltip);
        }
        tooltip.innerHTML = `<h4>${player.ficha} ${player.nickname}</h4><p><strong>País:</strong> ${player.pais}</p><p><strong>Dinero:</strong> $${player.dinero || 1500}</p><p><strong>Posición:</strong> ${player.position || 0}</p><p><strong>Propiedades:</strong> ${player.propiedades?.length || 0}</p>`;
        tooltip.style.border = `2px solid ${this.colorToCSS(player.color)}`;
        setTimeout(() => { if (tooltip?.parentNode) tooltip.remove(); }, 3000);
        tooltip.addEventListener('click', () => tooltip.remove(), { once: true });
    };

    // Limpia fichas
    Game.prototype.clearPlayerTokens = function () {
        document.querySelectorAll('.player-token').forEach(t => t.remove());
        document.querySelectorAll('.player-tokens').forEach(c => { if (!c.children.length) c.remove(); });
    };

    // Movimiento de ficha (mantiene lógica de activar acción de casilla)
    Game.prototype.movePlayerToken = function (playerOrId, steps) {
        let player = typeof playerOrId === 'object' ? playerOrId : this.players.find(p => p.id === playerOrId);
        if (!player) { console.error('❌ Jugador no encontrado'); return; }
        if (typeof steps !== 'number' || isNaN(steps)) steps = 0; // evitar NaN
        const oldPos = typeof player.position === 'number' ? player.position : 0;
        const tentative = oldPos + steps;
        let newPos = ((tentative % 40) + 40) % 40; // módulo positivo
        console.log(`🚀 ${player.nickname} se mueve de ${oldPos} a ${newPos} (${steps})`);
        player.position = newPos;
        const tokenElement = document.querySelector(`[data-player-id="${player.id}"]`);
        if (!tokenElement) { console.warn('⚠️ Ficha no encontrada'); }
        if (tokenElement) tokenElement.classList.add('moving');
        const targetSquare = document.querySelector(`[data-square-id="${newPos}"]`);
        if (!targetSquare) { console.error('❌ Casilla destino no encontrada', newPos); return; }
        let tokensContainer = targetSquare.querySelector('.player-tokens');
        if (!tokensContainer) { tokensContainer = document.createElement('div'); tokensContainer.className = 'player-tokens'; targetSquare.appendChild(tokensContainer); }
        setTimeout(() => {
            if (tokenElement) { tokensContainer.appendChild(tokenElement); tokenElement.dataset.position = newPos; setTimeout(() => tokenElement.classList.remove('moving'), 600); }
        }, 100);
        // Solo otorgar $200 si dimos una vuelta hacia adelante (pasos positivos y wrap)
        if (steps > 0 && oldPos > newPos) {
            player.dinero = (player.dinero || 1500) + 200; console.log(`💰 ${player.nickname} pasó por SALIDA (+$200)`);
        }
        setTimeout(() => { this.ejecutarAccionCasilla(player, newPos); this.actualizarEstadoBotones(); }, 1000);
    };

    // (Panel de estadísticas extraído a statsPanel.js)
}

export default applyPlayers;
