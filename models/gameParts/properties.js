// Módulo de gestión de propiedades (compra, renta, construcción, hipotecas, reglas de color)
// Uso: import { applyProperties } from './gameParts/properties.js'; applyProperties(Game);

export function applyProperties(Game){
  if(!Game || typeof Game !== 'function') return;
  if(Game.__propertiesApplied) return;
  Game.__propertiesApplied = true;

  // === UTILIDADES INTERNAS ===
  function findOwner(game, squareId){
    return game.players.find(p => p.propiedades?.some(prop => prop.id === squareId));
  }

  // === MÉTODOS ===
  Game.prototype.manejarPropiedad = async function(player, square){
    const propietario = findOwner(this, square.id);
    if(!propietario){
      await this.ofrecerCompraPropiedad(player, square);
      return;
    }
    if(propietario.id === player.id || propietario.nickname === player.nickname){
      if(square.type === 'railroad') this.mostrarMensaje(player,'🚂 Tu Ferrocarril',`${square.name} es tuyo. Más ferrocarriles = más renta.`);
      else if(square.type === 'utility') this.mostrarMensaje(player,'⚡ Tu Servicio',`${square.name} es tuyo. Más servicios = más renta.`);
      else this.mostrarMensaje(player,'🏠 Tu Propiedad',`${square.name} es tuya. Usa los botones para construir.`);
      return;
    }
    await this.pagarRentaAutomatica(player, propietario, square);
  };

  Game.prototype.pagarRentaAutomatica = async function(player, propietario, square){
    const propiedad = propietario.propiedades.find(p=> p.id === square.id);
    if(propiedad.hipotecada){
      this.mostrarMensaje(player,'🏦 Propiedad Hipotecada',`${square.name} está hipotecada. No pagas renta.`);
      return;
    }
    const renta = this.calcularRenta(propiedad, square);
    if(player.dinero < renta){
      this.mostrarMensaje(player,'💥 BANCARROTA',`No puedes pagar $${renta} de renta. Has perdido.`);
      this.gestionarBancarrota(player);
      return;
    }
    player.dinero -= renta; propietario.dinero += renta;
    const detalle = propiedad.hotel ? ' (hotel)' : (propiedad.casas>0?` (${propiedad.casas} casas)`: '');
    this.mostrarMensaje(player,'💸 Renta Pagada Automáticamente',`Pagaste $${renta} a ${propietario.nickname} por ${square.name}${detalle}. Saldo: $${player.dinero}`);
    this.actualizarEstadoBotones();
    this.updatePlayerStatsPanel();
  };

  Game.prototype.ofrecerCompraPropiedad = async function(player, square){
    const precio = square.price || 100;
    if(player.dinero < precio){
      this.mostrarMensaje(player,'💸 Sin dinero suficiente',`No puedes comprar ${square.name} (cuesta $${precio}). Dinero: $${player.dinero}`);
      return;
    }
    const comprar = await this.mostrarConfirmacion('💰 Comprar Propiedad',`¿Comprar ${square.name} por $${precio}?`, player);
    if(!comprar) return;
    player.dinero -= precio;
    if(!player.propiedades) player.propiedades = [];
    player.propiedades.push({ id:square.id, name:square.name, price:precio, color:square.color, casas:0, hotel:false, hipotecada:false, rentData:square.rent||null, mortgage:square.mortgage || Math.floor(precio/2) });
    try { square.owner = player.id || player.nickname; } catch(e){ console.warn('No se pudo asignar owner', e); }
    this.mostrarMensaje(player,'🏠 Propiedad Comprada',`Ahora eres dueño de ${square.name}. Dinero restante: $${player.dinero}`);
    this.marcarPropiedadComoComprada?.(square.id, player);
    this.sincronizarPropiedadesJugadorAlTablero?.();
    this.guardarEstadoJuego?.();
    this.actualizarEstadoBotones();
    this.updatePlayerStatsPanel();
  };

  Game.prototype.pagarRenta = async function(player, propietario, square){
    const propiedad = propietario.propiedades.find(p=> p.id === square.id);
    if(propiedad.hipotecada){
      this.mostrarMensaje(player,'🏦 Propiedad Hipotecada',`${square.name} está hipotecada. No pagas renta.`);
      return;
    }
    const renta = this.calcularRenta(propiedad, square);
    if(player.dinero < renta){
      this.mostrarMensaje(player,'💸 Bancarrota',`No puedes pagar $${renta} a ${propietario.nickname}.`);
      this.gestionarBancarrota(player); return;
    }
    player.dinero -= renta; propietario.dinero += renta;
    const detalle = propiedad.hotel ? ' (hotel)' : (propiedad.casas>0?` (${propiedad.casas} casas)`:'');
    this.mostrarMensaje(player,'💸 Renta Pagada',`Pagaste $${renta} a ${propietario.nickname} por ${square.name}${detalle}. Saldo: $${player.dinero}`);
    this.actualizarEstadoBotones(); this.updatePlayerStatsPanel();
  };

  Game.prototype.calcularRenta = function(propiedad, square){
    const rentData = square.rent;
    if(square.type === 'railroad' && rentData && typeof rentData === 'object'){
      const owner = findOwner(this, square.id); if(!owner) return 0;
      const ownedRailroads = owner.propiedades.filter(pr=>{ const sq=this.board.squares.get(pr.id); return sq && sq.type==='railroad'; }).length;
      return rentData[String(ownedRailroads)] || 25;
    }
    if(rentData && typeof rentData === 'object' && 'base' in rentData){
      if(propiedad.hotel) return rentData.withHotel || (rentData.base*5);
      if(propiedad.casas>0){ const idx = propiedad.casas-1; const arr=rentData.withHouse||[]; return arr[idx] || (rentData.base*(1+propiedad.casas)); }
      const monopolio = square.color && this.tieneMonopolioColor(propiedad, square.color, findOwner(this,square.id));
      return monopolio ? rentData.base*2 : rentData.base;
    }
    const base = typeof rentData === 'number' ? rentData : (square.rent || 10);
    if(propiedad.hotel) return base*5;
    if(propiedad.casas>0) return base*(1+propiedad.casas);
    return base;
  };

  Game.prototype.ofrecerConstruccion = async function(player, square){
    const propiedad = player.propiedades.find(p=> p.id === square.id);
    if(propiedad.hipotecada){ this.mostrarMensaje(player,'🏦 Propiedad Hipotecada',`No puedes construir en ${square.name} mientras esté hipotecada.`); return; }
    if(!this.puedeConstructor(player, square)){ this.mostrarMensaje(player,'🏗️ No puedes construir','Necesitas todas las propiedades del color.'); return; }
    if(propiedad.hotel){ this.mostrarMensaje(player,'🏨 Hotel Completo',`${square.name} ya tiene un hotel.`); return; }
    if(square.color){ const {estado,min,max} = this.getEstadoGrupoConstruccion(square.color, player); const estadoProp = estado.find(e=> e.id === square.id); if(!propiedad.hotel && propiedad.casas>min && max-min>0 && propiedad.casas>=max){ this.mostrarMensaje(player,'⚖️ Construcción Desbalanceada',`Construye primero en las que tienen menos casas (mínimo actual: ${min}).`); return; } }
    const precioCasa=100, precioHotel=250; let mensaje='', precio=0;
    if(propiedad.casas<4){ mensaje=`¿Construir casa en ${square.name}? (Casa ${propiedad.casas+1}/4) - $${precioCasa}`; precio=precioCasa; } else { mensaje=`¿Construir hotel en ${square.name}? (Reemplaza 4 casas) - $${precioHotel}`; precio=precioHotel; }
    if(player.dinero < precio){ this.mostrarMensaje(player,'💸 Sin dinero suficiente',`Necesitas $${precio}`); return; }
    const construir = await this.mostrarConfirmacion('🏗️ Construcción', mensaje, player);
    if(!construir) return;
    player.dinero -= precio;
    if(propiedad.casas<4){
      propiedad.casas++;
      let msg=`¡Casa construida en ${square.name}! Casas: ${propiedad.casas}/4. Dinero: $${player.dinero}`;
      if(propiedad.casas===4) msg += `\n\n🏨 Con 4 casas ya puedes construir un hotel.`;
      this.mostrarMensaje(player,'🏠 Casa Construida', msg);
    } else {
      propiedad.casas=0; propiedad.hotel=true;
      this.mostrarMensaje(player,'🏨 Hotel Construido',`Hotel en ${square.name}. Dinero: $${player.dinero}`);
    }
    this.actualizarVisualizacionPropiedad?.(square.id, propiedad);
    this.guardarEstadoJuego?.();
    this.actualizarEstadoBotones();
    this.updatePlayerStatsPanel();
  };

  Game.prototype.puedeConstructor = function(player, square){
    if(square?.type !== 'property') return false;
    if(!square?.color) return false;
    const todas = this.board.squaresByPosition.filter(sq => sq && sq.type==='property' && sq.color===square.color);
    if(!todas.length) return false;
    const idsColor = new Set(todas.map(sq=>sq.id));
    const jugadorTiene = player.propiedades.filter(p=> idsColor.has(p.id));
    return jugadorTiene.length === idsColor.size;
  };

  Game.prototype.tieneMonopolioColor = function(propiedadActual, color, player){
    if(!color || !this.board.propertiesByColor) return false;
    const propiedadesDelColor = this.board.propertiesByColor.get(color) || [];
    const propiedadesJugador = player?.propiedades?.filter(p=> p.color === color) || [];
    return propiedadesDelColor.length === propiedadesJugador.length && propiedadesJugador.length>0;
  };

  Game.prototype.getEstadoGrupoConstruccion = function(color, player){
    const grupoSquares = this.board.propertiesByColor?.get(color) || [];
    const estado = grupoSquares.map(sq => { const prop = player.propiedades?.find(p=> p.id === sq.id); return { id:sq.id, nombre:sq.name, casas:prop?.casas||0, hotel:!!prop?.hotel, hipotecada:!!prop?.hipotecada }; });
    const casasValores = estado.filter(e=>!e.hotel).map(e=> e.casas);
    const min = casasValores.length ? Math.min(...casasValores) : 0;
    const max = casasValores.length ? Math.max(...casasValores) : 0;
    const todas4 = estado.every(e=> e.hotel || e.casas === 4);
    return { estado, min, max, todas4 };
  };

  Game.prototype.validarCompraPropiedad = function(player, square){
    if(!['property','railroad','utility'].includes(square.type)) return {valida:false, razon:'No es una propiedad comprable'};
    if(findOwner(this, square.id)) return {valida:false, razon:'Ya tiene propietario'};
    const precio = square.price || 100; if(player.dinero < precio) return {valida:false, razon:`Necesitas $${precio}, tienes $${player.dinero}`};
    if(player.estaEnCarcel) return {valida:false, razon:'No puedes comprar en la cárcel'};
    return {valida:true, razon:null};
  };

  Game.prototype.validarConstruccion = function(player, square, tipo='casa'){
    const propiedad = player.propiedades?.find(p=> p.id === square.id);
    if(!propiedad) return {valida:false, razon:'No eres propietario'};
    if(propiedad.hipotecada) return {valida:false, razon:'Propiedad hipotecada'};
    if(player.estaEnCarcel) return {valida:false, razon:'En cárcel no construyes'};
    if(!this.tieneMonopolioColor(propiedad, square.color, player)) return {valida:false, razon:'Necesitas monopolio'};
    if(tipo==='casa'){
      const costo=100; if(player.dinero < costo) return {valida:false, razon:`Necesitas $${costo}`};
      if(propiedad.hotel) return {valida:false, razon:'Ya hay hotel'};
      if(propiedad.casas>=4) return {valida:false, razon:'Máximo 4 casas'};
      const {min,max} = this.getEstadoGrupoConstruccion(square.color, player); if(propiedad.casas>min && (max-min)>0) return {valida:false, razon:'Construcción no equilibrada'};
    } else if(tipo==='hotel'){
      const costo=250; if(player.dinero < costo) return {valida:false, razon:`Necesitas $${costo}`};
      if(propiedad.hotel) return {valida:false, razon:'Ya hay hotel'};
      if(propiedad.casas<4) return {valida:false, razon:'Necesitas 4 casas'};
      const {estado} = this.getEstadoGrupoConstruccion(square.color, player); const faltan = estado.filter(e=> e.id!==square.id && !e.hotel && e.casas<4); if(faltan.length) return {valida:false, razon:'Todas las propiedades deben tener 4 casas'};
    }
    return {valida:true, razon:null};
  };

  Game.prototype.validarHipoteca = function(player, square, tipo='hipotecar'){
    const propiedad = player.propiedades?.find(p=> p.id === square.id);
    if(!propiedad) return {valida:false, razon:'No eres propietario'};
    if(player.estaEnCarcel) return {valida:false, razon:'En cárcel no hipotecas'};
    if(tipo==='hipotecar'){
      if(propiedad.hipotecada) return {valida:false, razon:'Ya hipotecada'};
      if(propiedad.casas>0 || propiedad.hotel) return {valida:false, razon:'Vende construcciones antes'};
    } else if(tipo==='deshipotecar'){
      if(!propiedad.hipotecada) return {valida:false, razon:'No está hipotecada'};
      const valor = square.mortgage || Math.floor((square.price||100)/2); const costo = Math.ceil(valor*1.1); if(player.dinero < costo) return {valida:false, razon:`Necesitas $${costo}`};
    }
    return {valida:true, razon:null};
  };

  Game.prototype.validarSalidaCarcel = function(player, metodo='pagar'){
    if(!player.estaEnCarcel) return {valida:false, razon:'No estás en la cárcel'};
    if(metodo==='pagar'){ const costo=50; if(player.dinero < costo) return {valida:false, razon:`Necesitas $${costo}`}; }
    else if(metodo==='dobles'){ const t = player.turnosEnCarcel || 0; if(t>=3) return {valida:false, razon:'Debes pagar para salir'}; }
    return {valida:true, razon:null};
  };

  Game.prototype.aplicarReglasEstrictas = function(){
    console.log('🎯 APLICANDO REGLAS ESTRICTAS DE MONOPOLY');
    document.addEventListener('click', (e)=>{
      const button = e.target.closest('button'); if(!button || button.disabled) return;
      const currentPlayer = this.players[this.currentPlayerIndex]; if(!currentPlayer) return;
      const square = this.board.squaresByPosition[currentPlayer.position || 0]; if(!square) return;
      let validacion = {valida:true, razon:null};
      switch(button.id){
        case 'btnComprarPropiedad': validacion = this.validarCompraPropiedad(currentPlayer, square); break;
        case 'btnConstruirCasa': validacion = this.validarConstruccion(currentPlayer, square, 'casa'); break;
        case 'btnConstruirHotel': validacion = this.validarConstruccion(currentPlayer, square, 'hotel'); break;
        case 'btnHipotecar': validacion = this.validarHipoteca(currentPlayer, square, 'hipotecar'); break;
        case 'btnDeshipotecar': validacion = this.validarHipoteca(currentPlayer, square, 'deshipotecar'); break;
        case 'btnIrCarcel': if(currentPlayer.estaEnCarcel) validacion = this.validarSalidaCarcel(currentPlayer,'pagar'); break;
      }
      if(!validacion.valida){ e.preventDefault(); e.stopPropagation(); console.log(`❌ REGLA VIOLADA: ${validacion.razon}`); this.mostrarMensaje(`❌ ${validacion.razon}`, 'error'); return false; }
    }, true);
    console.log('✅ Reglas estrictas aplicadas');
  };

  Game.prototype.inicializarSistemaReglas = function(){
    console.log('🎯 Inicializando Sistema de Reglas Monopoly');
    this.aplicarReglasEstrictas();
    this.verificarIntegridadJuego();
    console.log('✅ Sistema de reglas activo');
  };

  Game.prototype.verificarIntegridadJuego = function(){
    this.players.forEach(player => {
      (player.propiedades||[]).forEach(prop => { const square = this.board.squares.get(prop.id); if(square && !square.owner) square.owner = player.id; });
    });
    this.players.forEach(player => { if(typeof player.position !== 'number' || player.position<0 || player.position>=40) player.position=0; });
  };

  Game.prototype.sincronizarPropiedadesJugadorAlTablero = function(){
    if(!this.board?.squaresByPosition?.length) return;
    this.board.squaresByPosition.forEach(sq => { if(sq) delete sq.owner; });
    this.players.forEach(pl => { (pl.propiedades||[]).forEach(prop => { const sq = this.board.squaresByPosition.find(s=> s && s.id === prop.id); if(sq) sq.owner = pl.id || pl.nickname; }); });
  };
}

export default applyProperties;
