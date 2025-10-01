// Modal Deshipoteca - Manejo separado
(function(){ // IIFE: aísla el scope para no contaminar el global

  // Mapa de IDs del DOM usados por el modal
  const S = {
    btn: 'btnDeshipotecar',              // Botón que abre el modal
    modal: 'modalDeshipoteca',           // Contenedor del modal
    close: 'closeDeshipotecaModal',      // Botón (X) de cierre
    cancelar: 'cancelarDeshipoteca',     // Botón "Cancelar"
    confirmar: 'confirmarDeshipoteca',   // Botón "Confirmar"
    alert: 'deshipoteca-alert',          // Caja de alertas/errores
    nombre: 'deshipoteca-nombre',        // Texto: nombre propiedad
    descripcion: 'deshipoteca-descripcion', // Texto: descripción
    color: 'deshipoteca-color',          // Cinta de color del grupo
    vHipoteca: 'deshipoteca-valor-hipoteca', // Muestra valor hipoteca base
    costo: 'deshipoteca-costo',          // Muestra costo de deshipotecar (con 10%)
    dActual: 'deshipoteca-dinero-actual',// Dinero actual del jugador
    dFinal: 'deshipoteca-dinero-final'   // Dinero resultante tras pagar
  };

  // Helpers cortos para DOM y acceso al juego
  const getEl = id => document.getElementById(id); // Obtiene un elemento por ID
  const getGame = () =>                           // Intenta localizar la instancia del juego
    window.__gameInstance || window.game || window.GameInstance || null;

  // Cierra el modal y limpia la clase del <body>
  const closeModal = modal => {
    if(!modal) return;                            // Si no hay modal, salir
    modal.style.display='none';                   // Oculta el modal
    document.body.classList.remove('modal-open-body'); // Quita bloqueo de scroll, etc.
  };

  // Muestra un mensaje en la caja de alertas por unos ms y luego lo oculta
  function showAlert(el,msg,ms=3500){
    if(!el) return;                               // Sin caja, salir
    el.style.display='block';                     // Hace visible el alert
    el.textContent=msg;                           // Setea el texto del mensaje
    clearTimeout(el._t);                          // Limpia timeout anterior si existe
    el._t=setTimeout(()=> el.style.display='none', ms); // Oculta tras ms milisegundos
  }

  // Abre el modal, calcula costos y rellena los textos/valores
  function openModal(data){
    const { square, propiedad, player } = data;   // Desestructura datos necesarios
    const modal = getEl(S.modal); if(!modal) return; // Referencia al modal o salir
    // Valor de hipoteca: usa el de la casilla o calcula la mitad del precio como fallback
    const valorHipoteca = square.mortgage || Math.floor((square.price||propiedad.price||100)/2);
    const costo = Math.ceil(valorHipoteca * 1.1); // 10% de interés, redondeando hacia arriba
    const dineroFinal = player.dinero - costo;    // Dinero que quedaría tras pagar

    // Rellena UI con datos de la propiedad / jugador
    getEl(S.nombre).textContent = square.name || 'Propiedad';            // Nombre
    getEl(S.descripcion).textContent = square.description || 'Propiedad hipotecada.'; // Descripción
    const colorEl = getEl(S.color);                                      // Banda de color
    if(square.color){                                                    // Si hay color de grupo
      colorEl.style.background = square.color;                           // Píntalo
      colorEl.style.display='block';                                     // Muéstralo
    } else {
      colorEl.style.display='none';                                      // Si no hay color, oculta
    }
    // Montos: hipoteca base, costo con interés, dinero actual y final
    getEl(S.vHipoteca).textContent = '$' + valorHipoteca;
    getEl(S.costo).textContent = '$' + costo;
    getEl(S.dActual).textContent = '$' + player.dinero;
    getEl(S.dFinal).textContent = '$' + dineroFinal;

    // Guarda en data-* del modal para leer al confirmar
    modal.dataset.squareId = square.id; // ID de la casilla
    modal.dataset.costo = costo;        // Costo calculado
    // Muestra el modal y bloquea el body (evita scroll del fondo)
    modal.style.display='flex';
    document.body.classList.add('modal-open-body');
  }

  // Ejecuta la deshipoteca contra la instancia del juego y cierra el modal
  async function applyUnmortgage(modal){
    const game = getGame(); if(!game) return;     // Obtener juego o salir
    const player = game.players?.[game.currentPlayerIndex]; if(!player) return; // Jugador actual
    const squareId = parseInt(modal.dataset.squareId,10); // Lee el ID desde data-*
    if(isNaN(squareId)) return;                   // Validación simple
    // Busca la propiedad en el inventario del jugador
    const propiedad = player.propiedades?.find(p=> p.id === squareId);
    // Busca la casilla en el board (compatibilidad con distintas estructuras)
    const square = game.board?.allSquares?.find?.(s=> s.id===squareId)
                || game.board?.squares?.find?.(s=> s.id===squareId);
    if(!propiedad || !square){                    // Si algo falta, solo cierra
      closeModal(modal);
      return;
    }
    // Llama a la API de juego para deshipotecar, indicando que ya hubo confirmación
    await game.deshipotecarPropiedad?.(player, propiedad, square, { skipConfirm: true });
    closeModal(modal);                            // Cierra el modal al terminar
  }

  // Enlaza eventos: abrir/cerrar modal y confirmar acción
  function bind(){
    const btn = getEl(S.btn); const modal = getEl(S.modal); // Referencias básicas
    if(!btn || !modal) return;                               // Si faltan, no hace nada

    // Botones internos del modal y caja de alertas
    const closeBtn = getEl(S.close);
    const cancelBtn = getEl(S.cancelar);
    const confirmBtn = getEl(S.confirmar);
    const alertBox = getEl(S.alert);

    // Handler reutilizable para cerrar modal
    const handleClose = ()=> closeModal(modal);

    // Cerrar con X o con "Cancelar"
    ;[closeBtn,cancelBtn].forEach(b=> b && b.addEventListener('click', handleClose));

    // Cerrar al hacer click en el fondo (fuera del contenido)
    modal.addEventListener('click', e=> { if(e.target===modal) handleClose(); });

    // Al hacer click en el botón principal "Deshipotecar"
    btn.addEventListener('click', ()=> {
      try {
        const game = getGame(); if(!game) return;                         // Juego
        const player = game.players?.[game.currentPlayerIndex]; if(!player) return; // Jugador actual
        const board = game.board; if(!board) return;                      // Tablero
        // Obtiene la casilla según la posición actual del jugador (dos variantes)
        const square = board.squaresByPosition
          ? board.squaresByPosition[player.position||0]
          : board.squares?.[player.position||0];
        if(!square) return;                                               // Sin casilla, salir
        // Busca la propiedad del jugador con el mismo id de la casilla
        const propiedad = player.propiedades?.find(p=> p.id === square.id);

        // Validaciones de negocio antes de abrir el modal
        if(!propiedad){                       // No pertenece al jugador
          showAlert(alertBox,'❌ No eres propietario.',3000);
          return;
        }
        if(!propiedad.hipotecada){           // No está hipotecada
          showAlert(alertBox,'ℹ️ Esta propiedad no está hipotecada.',3000);
          return;
        }

        // Calcula costo y verifica fondos
        const valorHipoteca = square.mortgage
          || Math.floor((square.price||propiedad.price||100)/2);
        const costo = Math.ceil(valorHipoteca * 1.1);
        if(player.dinero < costo){           // Dinero insuficiente
          showAlert(alertBox, '❌ Necesitas $'+costo+' para deshipotecar.', 3500);
          return;
        }

        // Si todo ok, abrir el modal con los datos ya calculados
        openModal({ square, propiedad, player });
      } catch(err){
        console.error('Error abriendo modal deshipoteca', err); // Log de errores
      }
    });

    // Confirmar la deshipoteca (ejecuta la acción asíncrona y cierra)
    confirmBtn && confirmBtn.addEventListener('click', ()=> {
      applyUnmortgage(modal).catch(err=> console.error('Error deshipotecando', err));
    });
  }

  // Enlaza eventos apenas el DOM esté listo (compatibilidad con estados de carga)
  if(document.readyState==='loading')
    document.addEventListener('DOMContentLoaded', bind);
  else
    bind();

})(); // Fin de la IIFE
