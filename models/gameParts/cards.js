// Módulo de cartas (Suerte y Caja de Comunidad)
// Uso: import { applyCards } from './gameParts/cards.js'; applyCards(Game);

export function applyCards(Game) {
  if (!Game || typeof Game !== 'function') return;
  if (Game.__cardsApplied) return; Game.__cardsApplied = true;

  // Fallback local previa (se mantiene como respaldo si backend no provee cartas)
  const cartasSuerteFallback = [
    { id: 9001, texto: 'Avanza hasta la casilla GO y cobra $200', accion: { tipo: 'mover', destino: 0, cobrar: 200 } },
    { id: 9002, texto: 'Retrocede 3 casillas', accion: { tipo: 'moverRelativo', pasos: -3 } },
    { id: 9003, texto: 'Paga una multa de $50', accion: { tipo: 'pagar', cantidad: 50 } },
    { id: 9004, texto: 'Ve a la cárcel directamente', accion: { tipo: 'carcel' } },
  ];
  const cartasComunidadFallback = [
    { id: 9101, texto: 'Recibe herencia de $100', accion: { tipo: 'cobrar', cantidad: 100 } },
    { id: 9102, texto: 'Paga $40 por médico', accion: { tipo: 'pagar', cantidad: 40 } },
    { id: 9103, texto: 'Ve a la cárcel', accion: { tipo: 'carcel' } },
    { id: 9104, texto: 'Avanza 2 casillas', accion: { tipo: 'moverRelativo', pasos: 2 } },
  ];

  /**
   * Mapea una carta cruda del backend al formato interno { id, texto, accion }
   * Formatos esperados backend (ejemplos):
   *  { id, description, type:'chance', action:{ money: 150 } }
   *  { id, description, type:'community_chest', action:{ money: -75 } }
   *  { id, description, action:{ goTo: 'jail' } }
   *  { id, description, action:{ moveTo: 0, reward:200 } }
   */
  function mapBackendCard(raw) {
    if (!raw || typeof raw !== 'object') return null;
    const id = raw.id ?? crypto.randomUUID?.() ?? Math.floor(Math.random() * 1e9);
    const texto = raw.description || raw.text || raw.texto || 'Carta';
    const act = raw.action || raw.accion || {};
    let accion = null;
    // Dinero directo
    if (typeof act.money === 'number') {
      accion = { tipo: act.money >= 0 ? 'cobrar' : 'pagar', cantidad: Math.abs(act.money) };
    }
    // Ir a cárcel
    else if (/jail|carcel/i.test(act.goTo || act.goto || '')) {
      accion = { tipo: 'carcel' };
    }
    // Mover a posición absoluta
    else if (typeof act.moveTo === 'number') {
      accion = { tipo: 'mover', destino: act.moveTo, cobrar: act.reward || 0 };
    }
    // Pasos relativos
    else if (typeof act.steps === 'number') {
      accion = { tipo: 'moverRelativo', pasos: act.steps };
    }
    // Si hay reward sin move (solo cobrar)
    else if (typeof act.reward === 'number') {
      accion = { tipo: act.reward >= 0 ? 'cobrar' : 'pagar', cantidad: Math.abs(act.reward) };
    }
    // Fallback: sin acción (solo mostrar carta)
    if (!accion) {
      accion = { tipo: 'ninguna' }; // se ignorará en procesarAccionCarta
    }
    return { id, texto, accion, _raw: raw };
  }

  function obtenerDesdeBackendColeccion(boardArray, tipo) {
    if (!Array.isArray(boardArray) || !boardArray.length) return null;
    const mapped = boardArray.map(c => mapBackendCard(c)).filter(Boolean);
    if (!mapped.length) return null;
    console.log(`🃏 Cartas mapeadas (${tipo}):`, mapped.length);
    return mapped;
  }

  Game.prototype.obtenerCartasSuerte = function () {
    if (!this._cartasSuerte) {
      // Intentar backend
      const backend = this.board?.chanceCards; // crudo
      const mapped = obtenerDesdeBackendColeccion(backend, 'chance');
      this._cartasSuerte = mapped || [...cartasSuerteFallback];
    }
    return this._cartasSuerte;
  };

  Game.prototype.obtenerCartasComunidad = function () {
    if (!this._cartasComunidad) {
      const backend = this.board?.communityCards; // crudo
      const mapped = obtenerDesdeBackendColeccion(backend, 'community');
      this._cartasComunidad = mapped || [...cartasComunidadFallback];
    }
    return this._cartasComunidad;
  };

  Game.prototype.manejarSuerte = async function (player) {
    const cartas = this.obtenerCartasSuerte();
    if (!cartas.length) { this.notifyWarn('Suerte', 'No hay cartas disponibles'); return; }
    const carta = cartas[Math.floor(Math.random() * cartas.length)];
    await this.mostrarCartaBonita('Suerte', carta.texto, '#9b59b6');
    await this.procesarAccionCarta(player, carta.accion);
  };

  Game.prototype.manejarCajaComunidad = async function (player) {
    const cartas = this.obtenerCartasComunidad();
    if (!cartas.length) { this.notifyWarn('Caja de Comunidad', 'No hay cartas disponibles'); return; }
    const carta = cartas[Math.floor(Math.random() * cartas.length)];
    await this.mostrarCartaBonita('Caja de Comunidad', carta.texto, '#27ae60');
    await this.procesarAccionCarta(player, carta.accion);
  };

  Game.prototype.mostrarCartaBonita = async function (tipo, texto, color = '#34495e') {
    let overlay = document.getElementById('cartaOverlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'cartaOverlay';
      overlay.style.cssText = `
            position: fixed;
            inset: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            background: rgba(0,0,0,.75);
            z-index: 12000;
            font-family: system-ui, sans-serif;
            backdrop-filter: blur(8px);
        `;
      document.body.appendChild(overlay);
    }
    overlay.innerHTML = '';

    // Determinar clase y colores según el tipo
    const tipoClase = tipo.toLowerCase().includes('sorpresa') ? 'chance' : 'community_chest';

    const card = document.createElement('div');
    card.className = `card-monopoly ${tipoClase}`;
    card.innerHTML = `
        <div class="band-logo">MONOPOLY</div>
        
        <div class="card-header" data-id="${Date.now()}">
            <div class="chip-tipo">${tipo}</div>
            <div class="icono">
                ${tipoClase === 'chance' ?
        '<svg class="icono-sorpresa" viewBox="0 0 24 24"><path d="M11 18h2v-2h-2v2zm1-16C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-2.21 0-4 1.79-4 4h2c0-1.1.9-2 2-2s2 .9 2 2c0 2-3 1.75-3 5h2c0-2.25 3-2.5 3-5 0-2.21-1.79-4-4-4z"/></svg>' :
        '<svg class="icono-cofre" viewBox="0 0 24 24"><path d="M21 4H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H3V6h18v12zM9 8h2v2H9V8zm0 4h2v2H9v-2zm4-4h2v2h-2V8zm0 4h2v2h-2v-2z"/></svg>'
      }
            </div>
        </div>
        
        <div class="card-body">
            <p class="descripcion">${texto}</p>
            ${texto.includes('$') ?
        `<div class="valor ${texto.includes('Paga') ? 'negativo' : 'positivo'}">
                    ${texto.match(/\$\d+/)?.[0] || ''}
                </div>` : ''
      }
        </div>
        
        <div class="card-footer">
            <div class="sello">© MONOPOLY · CARTA ${tipoClase === 'chance' ? 'SORPRESA' : 'COMUNIDAD'}</div>
            <button class="btn-aplicar">Continuar</button>
        </div>
    `;

    overlay.appendChild(card);

    // Aplicar animación de entrada
    if (!document.getElementById('cardPopStyles')) {
      const st = document.createElement('style');
      st.id = 'cardPopStyles';
      st.textContent = `
            @keyframes cardPop {
                from {
                    opacity: 0;
                    transform: translateY(50px) scale(0.8) rotate(-3deg);
                }
                to {
                    opacity: 1;
                    transform: translateY(0) scale(1) rotate(-0.7deg);
                }
            }
            .card-monopoly {
                animation: cardPop 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
            }
            #cartaOverlay {
                animation: fadeIn 0.3s ease-out forwards;
            }
            @keyframes fadeIn {
                from { background: rgba(0,0,0,0); backdrop-filter: blur(0); }
                to { background: rgba(0,0,0,0.75); backdrop-filter: blur(8px); }
            }
        `;
      document.head.appendChild(st);
    }

    return new Promise(res => {
      const btn = card.querySelector('.btn-aplicar');
      const cerrarCarta = () => {
        overlay.style.animation = 'fadeOut 0.3s ease-out forwards';
        card.style.animation = 'cardPopOut 0.3s ease-in forwards';
        setTimeout(() => {
          overlay.remove();
          res();
        }, 300);
      };
      btn?.addEventListener('click', cerrarCarta);
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) cerrarCarta();
      });
    });
  };

  Game.prototype.procesarAccionCarta = async function (player, accion) {
    if (!accion || accion.tipo === 'ninguna') return; // carta puramente informativa
    const totalSquares = this.board?.squaresByPosition?.length || 40;
    switch (accion.tipo) {
      case 'mover': {
        const destino = (typeof accion.destino === 'number') ? accion.destino % totalSquares : player.position;
        const oldPos = player.position;
        let steps = destino - oldPos;
        if (steps < 0) steps += totalSquares; // avanzar hacia adelante hasta destino
        if (accion.cobrar) player.dinero += accion.cobrar;
        this.movePlayerToken(player, steps);
        break;
      }
      case 'moverRelativo': {
        let pasos = accion.pasos || 0;
        // Si es negativo, pasamos directamente esos pasos (movePlayerToken maneja wrap)
        this.movePlayerToken(player, pasos);
        break;
      }
      case 'pagar':
        player.dinero -= accion.cantidad || 0; break;
      case 'cobrar':
        player.dinero += accion.cantidad || 0; break;
      case 'carcel': {
        const jailIndex = this.board?.squaresByPosition?.findIndex(s => s.type === 'special' && /c[aá]rcel|jail/i.test(s.name || '')) ?? -1;
        if (typeof player.goToJail === 'function') player.goToJail();
        if (jailIndex >= 0) {
          const oldPos = player.position;
          let steps = jailIndex - oldPos;
          if (steps < 0) steps += totalSquares;
          this.movePlayerToken(player, steps);
        }
        break;
      }
      default:
        console.warn('Acción de carta no reconocida', accion);
    }
    this.updatePlayerStatsPanel && this.updatePlayerStatsPanel();
  };
}

export default applyCards;
