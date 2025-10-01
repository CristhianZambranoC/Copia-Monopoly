// Módulo de impuestos
export function applyTaxes(Game){
  if(!Game || typeof Game !== 'function') return; if(Game.__taxesApplied) return; Game.__taxesApplied = true;
  Game.prototype.manejarImpuesto = async function(player, square){
    if(!player || !square) return;
    const impuesto = square?.action?.money ? Math.abs(square.action.money) : (square.tax || 100);
    if((player.dinero||0) < impuesto){
      this.mostrarMensaje(player,'💸 Sin dinero suficiente',`No puedes pagar el impuesto de $${impuesto}. Tu dinero: $${player.dinero}`);
      return;
    }
    player.dinero -= impuesto;
    this.mostrarMensaje(player,'💸 Impuesto Pagado',`Pagaste $${impuesto}. Dinero: $${player.dinero}`);
    this.updatePlayerStatsPanel && this.updatePlayerStatsPanel();
    this.actualizarEstadoBotones && this.actualizarEstadoBotones();
  };
}
export default applyTaxes;
