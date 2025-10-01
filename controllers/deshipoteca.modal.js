// Modal Deshipoteca - Manejo separado
(function(){
  const S = {
    btn: 'btnDeshipotecar',
    modal: 'modalDeshipoteca',
    close: 'closeDeshipotecaModal',
    cancelar: 'cancelarDeshipoteca',
    confirmar: 'confirmarDeshipoteca',
    alert: 'deshipoteca-alert',
    nombre: 'deshipoteca-nombre',
    descripcion: 'deshipoteca-descripcion',
    color: 'deshipoteca-color',
    vHipoteca: 'deshipoteca-valor-hipoteca',
    costo: 'deshipoteca-costo',
    dActual: 'deshipoteca-dinero-actual',
    dFinal: 'deshipoteca-dinero-final'
  };

  const getEl = id => document.getElementById(id);
  const getGame = () => window.__gameInstance || window.game || window.GameInstance || null;
  const closeModal = modal => { if(!modal) return; modal.style.display='none'; document.body.classList.remove('modal-open-body'); };
  function showAlert(el,msg,ms=3500){ if(!el) return; el.style.display='block'; el.textContent=msg; clearTimeout(el._t); el._t=setTimeout(()=> el.style.display='none', ms); }

  function openModal(data){
    const { square, propiedad, player } = data;
    const modal = getEl(S.modal); if(!modal) return;
    const valorHipoteca = square.mortgage || Math.floor((square.price||propiedad.price||100)/2);
    const costo = Math.ceil(valorHipoteca * 1.1);
    const dineroFinal = player.dinero - costo;

    getEl(S.nombre).textContent = square.name || 'Propiedad';
    getEl(S.descripcion).textContent = square.description || 'Propiedad hipotecada.';
    const colorEl = getEl(S.color);
    if(square.color){ colorEl.style.background = square.color; colorEl.style.display='block'; } else { colorEl.style.display='none'; }
    getEl(S.vHipoteca).textContent = '$' + valorHipoteca;
    getEl(S.costo).textContent = '$' + costo;
    getEl(S.dActual).textContent = '$' + player.dinero;
    getEl(S.dFinal).textContent = '$' + dineroFinal;

    modal.dataset.squareId = square.id;
    modal.dataset.costo = costo;
    modal.style.display='flex';
    document.body.classList.add('modal-open-body');
  }

  async function applyUnmortgage(modal){
    const game = getGame(); if(!game) return;
    const player = game.players?.[game.currentPlayerIndex]; if(!player) return;
    const squareId = parseInt(modal.dataset.squareId,10);
    if(isNaN(squareId)) return;
    const propiedad = player.propiedades?.find(p=> p.id === squareId);
    const square = game.board?.allSquares?.find?.(s=> s.id===squareId) || game.board?.squares?.find?.(s=> s.id===squareId);
    if(!propiedad || !square){ closeModal(modal); return; }
    await game.deshipotecarPropiedad?.(player, propiedad, square, { skipConfirm: true });
    closeModal(modal);
  }

  function bind(){
    const btn = getEl(S.btn); const modal = getEl(S.modal);
    if(!btn || !modal) return;
    const closeBtn = getEl(S.close); const cancelBtn = getEl(S.cancelar); const confirmBtn = getEl(S.confirmar); const alertBox = getEl(S.alert);

    const handleClose = ()=> closeModal(modal);
    ;[closeBtn,cancelBtn].forEach(b=> b && b.addEventListener('click', handleClose));
    modal.addEventListener('click', e=> { if(e.target===modal) handleClose(); });

    btn.addEventListener('click', ()=> {
      try {
        const game = getGame(); if(!game) return;
        const player = game.players?.[game.currentPlayerIndex]; if(!player) return;
        const board = game.board; if(!board) return;
        const square = board.squaresByPosition ? board.squaresByPosition[player.position||0] : board.squares?.[player.position||0];
        if(!square) return;
        const propiedad = player.propiedades?.find(p=> p.id === square.id);
        if(!propiedad){ showAlert(alertBox,'❌ No eres propietario.',3000); return; }
        if(!propiedad.hipotecada){ showAlert(alertBox,'ℹ️ Esta propiedad no está hipotecada.',3000); return; }

        const valorHipoteca = square.mortgage || Math.floor((square.price||propiedad.price||100)/2);
        const costo = Math.ceil(valorHipoteca * 1.1);
        if(player.dinero < costo){ showAlert(alertBox, '❌ Necesitas $'+costo+' para deshipotecar.', 3500); return; }

        openModal({ square, propiedad, player });
      } catch(err){ console.error('Error abriendo modal deshipoteca', err); }
    });

    confirmBtn && confirmBtn.addEventListener('click', ()=> {
      applyUnmortgage(modal).catch(err=> console.error('Error deshipotecando', err));
    });
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', bind); else bind();
})();
