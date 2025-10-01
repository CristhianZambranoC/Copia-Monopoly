// Mixin de Máquina de Estado de Botones y lógica de UI de acciones
// Extraído desde Game.js para reducir tamaño del archivo principal.
// Responsable de habilitar / deshabilitar botones según reglas y estado actual del jugador / casilla.

export function applyUiState(Game){
  if(!Game || typeof Game !== 'function') return;
  if(Game.__uiStateApplied) return; Game.__uiStateApplied = true;

  Game.prototype.agregarTooltipsAcciones = function(){
    const container = document.getElementById('acciones-casilla'); if(!container) return;
    container.querySelectorAll('button').forEach(btn => {
      if (!btn.dataset.tooltipBound) {
        btn.addEventListener('mouseenter', () => {
          if (btn.disabled) {
            const reason = btn.dataset.disableReason || 'Acción no disponible ahora';
            btn.setAttribute('title', reason);
          } else btn.removeAttribute('title');
        });
        btn.dataset.tooltipBound = '1';
      }
    });
  };

  Game.prototype.deshabilitarTodosBotones = function(){
    const botones = [ 'btnComprarPropiedad','btnPagarRenta','btnConstruirCasa','btnConstruirHotel','btnHipotecar','btnDeshipotecar','btnCartaSorpresa','btnCajaComunidad','btnPagarImpuesto','btnIrCarcel' ];
    botones.forEach(id=>{ const btn=document.getElementById(id); if(btn){ btn.disabled=true; btn.dataset.disableReason='Acción no disponible todavía.'; }});
  };

  Game.prototype.aplicarRazonGeneral = function(razon){
    const botones = [ 'btnComprarPropiedad','btnConstruirCasa','btnConstruirHotel','btnHipotecar','btnDeshipotecar','btnCartaSorpresa','btnCajaComunidad','btnPagarImpuesto','btnPagarRenta' ];
    botones.forEach(id=>{ const btn=document.getElementById(id); if(btn && btn.disabled){ btn.dataset.disableReason = razon; }});
  };

  Game.prototype.configurarBotonComprar = function(player, square){
    const btnComprar = document.getElementById('btnComprarPropiedad'); if(!btnComprar) return;
    const esPropiedad = ['property','railroad','utility'].includes(square.type);
    const propietario = this.players.find(p => p.propiedades?.some(prop => prop.id === square.id));
    const precio = square.price || 100;
    const puedeComprar = esPropiedad && !propietario && player.dinero >= precio;
    btnComprar.disabled = !puedeComprar;
    if(!puedeComprar){
      if(!esPropiedad) btnComprar.dataset.disableReason = 'Esta casilla no es una propiedad comprable.';
      else if(propietario) btnComprar.dataset.disableReason = `Ya tiene dueño: ${propietario.nickname}.`;
      else if(player.dinero < precio) btnComprar.dataset.disableReason = `Necesitas $${precio}. Tienes $${player.dinero}.`;
    } else delete btnComprar.dataset.disableReason;
  };

  Game.prototype.configurarBotonesConstruccion = function(player, square){
    const btnCasa = document.getElementById('btnConstruirCasa');
    const btnHotel = document.getElementById('btnConstruirHotel');
    if(!btnCasa || !btnHotel) return;
    const propiedad = player.propiedades?.find(p=> p.id === square.id);
    const esPropiedadJugador = !!propiedad;
    const esColor = square.type==='property' && !!square.color;
    const tieneMonopolio = esPropiedadJugador && esColor && this.puedeConstructor(player, square);
    // Casa
    let motivoCasa='';
    let puedeCasa = esPropiedadJugador && !player.estaEnCarcel && esColor && tieneMonopolio && !propiedad.hotel && propiedad.casas <4;
    if(!esPropiedadJugador) motivoCasa='No es tu propiedad.'; else if(player.estaEnCarcel) motivoCasa='En cárcel no construyes.'; else if(!esColor) motivoCasa='No es propiedad edificable.'; else if(!tieneMonopolio) motivoCasa='Necesitas monopolio del color.'; else if(propiedad.hotel) motivoCasa='Ya tiene hotel.'; else if(propiedad.casas>=4) motivoCasa='Ya 4 casas.';
    btnCasa.disabled = !puedeCasa; if(btnCasa.disabled) btnCasa.dataset.disableReason = motivoCasa; else delete btnCasa.dataset.disableReason;
    // Hotel
    let motivoHotel='';
    let puedeHotel = esPropiedadJugador && !player.estaEnCarcel && esColor && tieneMonopolio && !propiedad.hotel && propiedad.casas === 4;
    if(!esPropiedadJugador) motivoHotel='No es tu propiedad.'; else if(player.estaEnCarcel) motivoHotel='En cárcel no construyes.'; else if(!esColor) motivoHotel='No es edificable.'; else if(!tieneMonopolio) motivoHotel='Necesitas monopolio.'; else if(propiedad.hotel) motivoHotel='Ya tiene hotel.'; else if(propiedad.casas!==4) motivoHotel='Requiere 4 casas.';
    btnHotel.disabled = !puedeHotel; if(btnHotel.disabled) btnHotel.dataset.disableReason = motivoHotel; else delete btnHotel.dataset.disableReason;
  };

  Game.prototype.configurarBotonesHipoteca = function(player, square){
    const btnHipotecar = document.getElementById('btnHipotecar');
    const btnDeshipotecar = document.getElementById('btnDeshipotecar');
    if(!btnHipotecar || !btnDeshipotecar) return;
    const propiedad = player.propiedades?.find(p=> p.id === square.id);
    const esPropJugador= !!propiedad;
    const puedeHipotecar = esPropJugador && !propiedad.hipotecada && (propiedad.casas===0) && !propiedad.hotel;
    const valorHipotecaBase = square?.mortgage || square?.valorHipoteca || Math.floor((square?.price||0)/2);
    btnHipotecar.disabled = !puedeHipotecar;
    if(!puedeHipotecar){
      if(!esPropJugador) btnHipotecar.dataset.disableReason='No es tu propiedad.';
      else if(propiedad.hipotecada) btnHipotecar.dataset.disableReason='Ya hipotecada.';
      else if(propiedad.casas>0 || propiedad.hotel) btnHipotecar.dataset.disableReason='Vende construcciones antes.';
    } else delete btnHipotecar.dataset.disableReason;
    // Deshipotecar
    const puedeDeshipotecar = esPropJugador && propiedad.hipotecada && player.dinero >= Math.floor(valorHipotecaBase*1.1);
    btnDeshipotecar.disabled = !puedeDeshipotecar;
    if(!puedeDeshipotecar){
      if(!esPropJugador) btnDeshipotecar.dataset.disableReason='No es tu propiedad.';
      else if(!propiedad.hipotecada) btnDeshipotecar.dataset.disableReason='No está hipotecada.';
      else if(player.dinero < Math.floor(valorHipotecaBase*1.1)) btnDeshipotecar.dataset.disableReason=`Necesitas $${Math.floor(valorHipotecaBase*1.1)} (incluye 10% interés).`;
    } else delete btnDeshipotecar.dataset.disableReason;
  };

  Game.prototype.configurarBotonesEspeciales = function(player, square){
    const btnSuerte = document.getElementById('btnCartaSorpresa');
    const btnComunidad = document.getElementById('btnCajaComunidad');
    if(btnSuerte){ btnSuerte.disabled=true; btnSuerte.dataset.disableReason='Las cartas se toman automáticamente.'; }
    if(btnComunidad){ btnComunidad.disabled=true; btnComunidad.dataset.disableReason='Las cartas se toman automáticamente.'; }
    const btnImpuesto = document.getElementById('btnPagarImpuesto');
    if(btnImpuesto){ btnImpuesto.disabled = square.type !== 'tax'; if(square.type !== 'tax') btnImpuesto.dataset.disableReason='Solo en casillas de impuesto.'; else delete btnImpuesto.dataset.disableReason; }
    const btnRenta = document.getElementById('btnPagarRenta'); if(btnRenta){ btnRenta.disabled=true; btnRenta.dataset.disableReason='La renta se paga automáticamente.'; }
  };

  Game.prototype.actualizarEstadoBotones = function(){
    console.log('🔄 Actualizando botones con reglas estrictas (mixin UI State)');
    if(!this.players.length || !this.gameStarted){ this.deshabilitarTodosBotones(); return; }
    const currentPlayer = this.players[this.currentPlayerIndex]; if(!currentPlayer) return;
    const position = currentPlayer.position || 0;
    const square = this.board?.squaresByPosition ? this.board.squaresByPosition[position] : null;
    if(!square) return;
    this.deshabilitarTodosBotones();
    const btnLanzarDados = document.getElementById('btnLanzarDados'); if(btnLanzarDados) btnLanzarDados.disabled=false;
    if(currentPlayer.estaEnCarcel){
      const btnIrCarcel = document.getElementById('btnIrCarcel');
      if(btnIrCarcel){ btnIrCarcel.disabled = currentPlayer.dinero < 50; btnIrCarcel.textContent='🔓 Pagar Salida ($50)'; if(btnIrCarcel.disabled) btnIrCarcel.dataset.disableReason='Necesitas $50 para salir de la cárcel.'; else delete btnIrCarcel.dataset.disableReason; }
      this.aplicarRazonGeneral('En cárcel: solo puedes lanzar dados o pagar salida.');
      this.updatePlayerStatsPanel?.();
      this.agregarTooltipsAcciones();
      return;
    }
    this.configurarBotonComprar(currentPlayer, square);
    this.configurarBotonesConstruccion(currentPlayer, square);
    this.configurarBotonesHipoteca(currentPlayer, square);
    this.configurarBotonesEspeciales(currentPlayer, square);
    const btnIrCarcel = document.getElementById('btnIrCarcel'); if(btnIrCarcel){ btnIrCarcel.disabled=true; btnIrCarcel.textContent='Pagar Salida de la Cárcel'; btnIrCarcel.dataset.disableReason='Solo disponible cuando estás en la cárcel.'; }
    this.updatePlayerStatsPanel?.();
    this.agregarTooltipsAcciones();
  };
}

export default applyUiState;
