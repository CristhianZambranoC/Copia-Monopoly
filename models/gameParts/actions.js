// Mixin de acciones: centraliza wrappers en un mapa actionHandlers
// reduce repetición en Game.js

export function applyActions(Game){
  if(!Game || typeof Game !== 'function') return;
  if(Game.__actionsApplied) return; Game.__actionsApplied = true;

  // Registro de acciones
  Game.prototype.actionHandlers = {
    comprar(){
      const currentPlayer = this.players[this.currentPlayerIndex];
      if(!currentPlayer) return this.notifyError?.('Sin jugador activo','Configura jugadores.');
      if(currentPlayer.estaEnCarcel) return this.notifyWarn?.('Acción bloqueada','No puedes comprar en la cárcel.');
      const pos = currentPlayer.position||0;
      let square=null;
      try {
        if(this.board?.getSquareByPosition) square=this.board.getSquareByPosition(pos); else if(this.board?.squaresByPosition) square=this.board.squaresByPosition[pos];
      } catch(e){ console.error('Error obteniendo casilla',pos,e); }
      if(!square) return this.notifyError?.('Casilla desconocida',`Pos ${pos}`);
      if(['property','railroad','utility'].includes(square.type)){
        const yaTiene = this.players.some(p=> p.propiedades?.some(pr=> pr.id===square.id));
        if(yaTiene) return this.notifyInfo?.('Ocupada','Ya tiene dueño.');
        if(currentPlayer.dinero < (square.price||0)) return this.notifyWarn?.('Dinero insuficiente',`Necesitas $${square.price}`);
        return this.ofrecerCompraPropiedad?.(currentPlayer, square);
      } else return this.notifyWarn?.('No comprable','Esta casilla no se puede comprar.');
    },
    renta(){
      const currentPlayer = this.players[this.currentPlayerIndex];
      if(!currentPlayer) return this.notifyError?.('Sin jugador activo','No hay jugador.');
      const pos=currentPlayer.position||0; const square=this.board?.squaresByPosition? this.board.squaresByPosition[pos]:null;
      if(!square) return;
      const propietario = this.players.find(p=> p.propiedades?.some(prop=> prop.id===square.id));
      if(propietario && propietario.id !== currentPlayer.id) return this.pagarRenta?.(currentPlayer, propietario, square);
      return this.notifyInfo?.('Sin renta','No debes pagar renta.');
    },
    construirCasa(){
      if(this.actionInProgress) return;
      this.actionInProgress = true;
      try {
        const currentPlayer = this.players[this.currentPlayerIndex];
        if(!currentPlayer) return this.notifyError?.('Sin jugador activo','No puedes construir.');
        if(currentPlayer.estaEnCarcel) return this.notifyWarn?.('Acción bloqueada','En cárcel no construyes.');
        const pos=currentPlayer.position||0; const square=this.board?.getSquareByPosition? this.board.getSquareByPosition(pos):this.board?.squaresByPosition?.[pos];
        const propiedad=currentPlayer.propiedades?.find(p=> p.id===square?.id);
        if(!square || !propiedad) return this.notifyWarn?.('No es tu propiedad','Solo en propiedades tuyas.');
        if(propiedad.hipotecada) return this.notifyWarn?.('Hipotecada','No puedes construir.');
        if(propiedad.hotel) return this.notifyInfo?.('Hotel existente','Ya hay hotel.');
        if(propiedad.casas>=4) return this.notifyInfo?.('Límite casas','Ya tienes 4 casas.');
        if(!this.puedeConstructor?.(currentPlayer, square)) return this.notifyWarn?.('Sin monopolio','Necesitas todas las del color.');
        if(square.color){
          const {estado,min,max} = this.getEstadoGrupoConstruccion?.(square.color, currentPlayer)||{};
          if(estado){ const propE = estado.find(e=> e.id===square.id); if(propE && propE.casas>min && max-min>0 && propE.casas>=max) return this.notifyWarn?.('Desbalance','Construye donde hay menos casas.'); }
        }
        return this.ofrecerConstruccion?.(currentPlayer, square);
      } finally { this.actionInProgress=false; }
    },
    construirHotel(){
      if(this.actionInProgress) return;
      this.actionInProgress = true;
      try {
        const currentPlayer=this.players[this.currentPlayerIndex];
        if(!currentPlayer) return this.notifyError?.('Sin jugador activo','No puedes construir.');
        if(currentPlayer.estaEnCarcel) return this.notifyWarn?.('Acción bloqueada','En cárcel no construyes.');
        const pos=currentPlayer.position||0; const square=this.board?.getSquareByPosition? this.board.getSquareByPosition(pos):this.board?.squaresByPosition?.[pos];
        const propiedad=currentPlayer.propiedades?.find(p=> p.id===square?.id);
        if(!square || !propiedad) return this.notifyWarn?.('No es tu propiedad','Solo en propiedades tuyas.');
        if(propiedad.hipotecada) return this.notifyWarn?.('Hipotecada','No puedes construir.');
        if(propiedad.hotel) return this.notifyInfo?.('Hotel existente','Ya hay hotel.');
        if(propiedad.casas !== 4) return this.notifyWarn?.('Requisito','Necesitas 4 casas antes de hotel.');
        if(!this.puedeConstructor?.(currentPlayer, square)) return this.notifyWarn?.('Sin monopolio','Necesitas monopolio.');
        if(square.color){
          const {estado} = this.getEstadoGrupoConstruccion?.(square.color, currentPlayer)||{};
            if(estado){ const faltan = estado.filter(e=> e.id!==square.id && !e.hotel && e.casas<4); if(faltan.length) return this.notifyWarn?.('Faltan casas','Todas deben tener 4 casas.'); }
        }
        return this.ofrecerConstruccion?.(currentPlayer, square);
      } finally { this.actionInProgress=false; }
    },
    hipotecar(){
      const currentPlayer=this.players[this.currentPlayerIndex];
      if(!currentPlayer) return this.notifyError?.('Sin jugador activo','No hay jugador.');
      if(currentPlayer.estaEnCarcel) return this.notifyWarn?.('Acción bloqueada','No puedes hipotecar en cárcel.');
      const pos=currentPlayer.position||0;
      let square=null; if(this.board?.getSquareByPosition) square=this.board.getSquareByPosition(pos); else if(this.board?.squaresByPosition) square=this.board.squaresByPosition[pos];
      const propiedad = square && currentPlayer.propiedades?.find(p=> p.id===square.id);
      if(propiedad && !propiedad.hipotecada){
        if(propiedad.casas>0 || propiedad.hotel) return this.notifyWarn?.('No se puede','Vende construcciones antes.');
        return this.hipotecarPropiedad?.(currentPlayer, propiedad, square);
      } else if(!propiedad) return this.notifyError?.('Propiedad ajena','No es tuya.'); else return this.notifyInfo?.('Ya hipotecada','Propiedad hipotecada.');
    },
    deshipotecar(){
      const currentPlayer=this.players[this.currentPlayerIndex];
      if(!currentPlayer) return this.notifyError?.('Sin jugador activo','No hay jugador.');
      if(currentPlayer.estaEnCarcel) return this.notifyWarn?.('Acción bloqueada','No puedes deshipotecar en cárcel.');
      const pos=currentPlayer.position||0; let square=null; if(this.board?.getSquareByPosition) square=this.board.getSquareByPosition(pos); else if(this.board?.squaresByPosition) square=this.board.squaresByPosition[pos];
      if(!square) return this.notifyError?.('Casilla inválida','No se identificó casilla.');
      const propiedad=currentPlayer.propiedades?.find(p=> p.id===square.id);
      if(propiedad && propiedad.hipotecada){
        const valorBase = square.mortgage || square.valorHipoteca || Math.floor((square.price||propiedad.price||0)/2);
        const costo = Math.floor(valorBase*1.1);
        if(currentPlayer.dinero < costo) return this.notifyWarn?.('Dinero insuficiente',`Necesitas $${costo}`);
        return this.deshipotecarPropiedad?.(currentPlayer, propiedad, square);
      } else if(!propiedad) return this.notifyError?.('Propiedad ajena','No es tuya.'); else return this.notifyInfo?.('Sin hipoteca','No está hipotecada.');
    },
    impuesto(){
      const currentPlayer=this.players[this.currentPlayerIndex];
      if(!currentPlayer) return this.notifyError?.('Sin jugador activo','No hay jugador.');
      if(currentPlayer.estaEnCarcel) return this.notifyWarn?.('Acción bloqueada','No pagas impuestos en cárcel.');
      const pos=currentPlayer.position||0; const square=this.board?.squaresByPosition? this.board.squaresByPosition[pos]:null;
      if(square?.type==='tax') return this.manejarImpuesto?.(currentPlayer, square);
      return this.notifyInfo?.('Sin impuestos','Esta casilla no genera impuesto.');
    },
    carcel(){
      const currentPlayer=this.players[this.currentPlayerIndex];
      if(!currentPlayer) return this.notifyError?.('Sin jugador activo','No hay jugador.');
      if(!this.gameStarted) return this.notifyWarn?.('Juego no iniciado','Lanza dados primero.');
      if(this.players[this.currentPlayerIndex].id !== currentPlayer.id) return this.notifyWarn?.('Turno inválido','No es tu turno.');
      if(!currentPlayer.estaEnCarcel) return this.notifyWarn?.('No estás en la cárcel','Solo aplica si estás encerrado.');
      const res = currentPlayer.tryLeaveJail ? currentPlayer.tryLeaveJail({ pay:true, cost:50, maxTurns:3 }):{ freed:false };
      if(res.freed){
        this.notifyOk?.('Sales de la cárcel', 'Pagaste $50 (regla: hasta 3 intentos de dobles, luego pago obligatorio).');
        try { window.dispatchEvent(new CustomEvent('player:jail-exit',{ detail:{ playerId:currentPlayer.id, nickname:currentPlayer.nickname, reason:res.reason||'payManual' }})); } catch(e){}
      } else this.notifyWarn?.('Sigues en cárcel','No has podido salir.');
      this.actualizarEstadoBotones?.(); this.updatePlayerStatsPanel?.();
    }
  };

  Game.prototype.executeAction = function(nombre){
    const h = this.actionHandlers?.[nombre];
    if(!h) return console.warn('Acción no existe:', nombre);
    return h.call(this);
  };

  // Acción automática al caer en una casilla
  Game.prototype.ejecutarAccionCasilla = function(player, position){
    try {
      if(!this.board) return;
      const square = this.board.getSquareByPosition ? this.board.getSquareByPosition(position) : (this.board.squaresByPosition?.[position]);
      if(!square) return;
      // Reset flags de cartas en nuevo aterrizaje
      if(player){ player.chanceDrawn=false; player.communityDrawn=false; }
      // Normalizar tipo especial 'Ve a la Cárcel' que llegó como type 'special' pero con action.goTo === 'jail'
      const isGoToJail = square.type === 'go_to_jail' || (square.type === 'special' && square.action?.goTo === 'jail');
      switch(true){
        case square.type === 'chance':
          if(player && !player.chanceDrawn){ player.chanceDrawn = true; this.manejarSuerte?.(player); }
          break;
        case square.type === 'community_chest':
          if(player && !player.communityDrawn){ player.communityDrawn = true; this.manejarCajaComunidad?.(player); }
          break;
        case square.type === 'tax':
          if(player) this.manejarImpuesto?.(player, square);
          break;
        case isGoToJail:
          if(player) this.sendToJail?.(player);
          break;
        case ['property','railroad','utility'].includes(square.type):
          if(player) this.manejarPropiedad?.(player, square);
          break;
        default:
          // Otros tipos: salida, free_parking, jail visit, etc. sin acción automática
          break;
      }
    } catch(e){
      console.error('Error en ejecutarAccionCasilla', e);
    } finally {
      this.actualizarEstadoBotones?.();
      this.updatePlayerStatsPanel?.();
    }
  };
}

export default applyActions;
