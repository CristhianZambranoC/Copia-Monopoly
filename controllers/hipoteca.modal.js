// Modal Hipoteca - Manejo separado
// Este módulo asume que el juego expone una instancia accesible en window (por ejemplo window.__gameInstance)

(function(){
  const SELECTORS = {
    btn: 'btnHipotecar',
    modal: 'modalHipoteca',
    close: 'closeHipotecaModal',
    cancelar: 'cancelarHipoteca',
    confirmar: 'confirmarHipoteca',
    alert: 'hipoteca-alert',
    nombre: 'hipoteca-nombre',
    descripcion: 'hipoteca-descripcion',
    color: 'hipoteca-color',
    vOriginal: 'hipoteca-valor-original',
    vRecibir: 'hipoteca-valor-recibir',
    dActual: 'hipoteca-dinero-actual',
    dFinal: 'hipoteca-dinero-final'
  };

  function getEl(id){ return document.getElementById(id); }

  function getGameInstance(){
    return window.__gameInstance || window.game || window.GameInstance || window.monopolyGame || null;
  }

  function closeModal(modal){
    if(!modal) return;
    modal.style.display='none';
    document.body.classList.remove('modal-open-body');
  }

  function showAlert(alertBox, msg, ms=3500){
    if(!alertBox) return;
    alertBox.style.display='block';
    alertBox.textContent = msg;
    clearTimeout(alertBox._hideTimer);
    alertBox._hideTimer = setTimeout(()=> { alertBox.style.display='none'; }, ms);
  }

  function openModal(data){
    const { square, propiedad, player, game } = data;
    const modal = getEl(SELECTORS.modal);
    if(!modal) return;

    const valorOriginal = square.price || propiedad.price || 100;
    const valorHipoteca = square.mortgage || Math.floor(valorOriginal/2);
    const dineroFinal = player.dinero + valorHipoteca;

    getEl(SELECTORS.nombre).textContent = square.name || 'Propiedad';
    getEl(SELECTORS.descripcion).textContent = square.description || 'Propiedad hipotecable.';

    const colorEl = getEl(SELECTORS.color);
    if(square.color){
      colorEl.style.background = square.color;
      colorEl.style.display='block';
    } else {
      colorEl.style.display='none';
    }

    getEl(SELECTORS.vOriginal).textContent = '$' + valorOriginal;
    getEl(SELECTORS.vRecibir).textContent = '$' + valorHipoteca;
    getEl(SELECTORS.dActual).textContent = '$' + player.dinero;
    getEl(SELECTORS.dFinal).textContent = '$' + dineroFinal;

    // Guardar datos
    modal.dataset.squareId = square.id;
    modal.dataset.valorHipoteca = valorHipoteca;

    modal.style.display='flex';
    document.body.classList.add('modal-open-body');
  }

  async function applyMortgage(modal){
    const game = getGameInstance(); if(!game) return;
    const player = game.players?.[game.currentPlayerIndex]; if(!player) return;
    const squareId = parseInt(modal.dataset.squareId,10);
    if(isNaN(squareId)) return;
    const propiedad = player.propiedades?.find(p=> p.id === squareId);
    const square = game.board?.allSquares?.find?.(s=> s.id===squareId) || game.board?.squares?.find?.(s=> s.id===squareId);
    if(!propiedad || !square){ closeModal(modal); return; }
    await game.hipotecarPropiedad?.(player, propiedad, square, { skipConfirm: true });
    closeModal(modal);
  }

  function bindEvents(){
    const btn = getEl(SELECTORS.btn);
    const modal = getEl(SELECTORS.modal);
    if(!btn || !modal) return;

    const closeBtn = getEl(SELECTORS.close);
    const cancelarBtn = getEl(SELECTORS.cancelar);
    const confirmarBtn = getEl(SELECTORS.confirmar);
    const alertBox = getEl(SELECTORS.alert);

    const closeHandler = ()=> closeModal(modal);
    [closeBtn, cancelarBtn].forEach(b=> b && b.addEventListener('click', closeHandler));
    modal.addEventListener('click', e=> { if(e.target === modal) closeHandler(); });

    btn.addEventListener('click', () => {
      try {
        const game = getGameInstance();
        if(!game) { console.warn('No se encontró instancia del juego'); return; }
        const player = game.players?.[game.currentPlayerIndex];
        if(!player) return;
        const board = game.board;
        if(!board) return;
        const square = board.squaresByPosition ? board.squaresByPosition[player.position||0] : board.squares?.[player.position||0];
        if(!square) return;

        const validation = game.validarHipoteca ? game.validarHipoteca(player, square, 'hipotecar') : {valida:false, razon:'Validación no disponible'};
        if(!validation.valida){
          showAlert(alertBox, '❌ ' + (validation.razon || 'No se puede hipotecar.'), 4000);
          return;
        }

        const propiedad = player.propiedades?.find(p=> p.id === square.id);
        if(!propiedad){
          showAlert(alertBox, '❌ No eres propietario.', 3000);
          return;
        }

        // Abrir modal
        openModal({ square, propiedad, player, game });
      } catch(err){ console.error('Error preparando modal hipoteca', err); }
    });

    confirmarBtn && confirmarBtn.addEventListener('click', () => {
      applyMortgage(modal).catch(err=> console.error('Error confirmando hipoteca', err));
    });
  }

  if(document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindEvents);
  } else {
    bindEvents();
  }
})();
