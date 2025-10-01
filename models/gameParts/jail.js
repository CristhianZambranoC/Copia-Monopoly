// Módulo de gestión de cárcel y utilidades de UI (mensajes/confirmaciones)
export function applyJail(Game){
  if(!Game || typeof Game !== 'function') return; if(Game.__jailApplied) return; Game.__jailApplied = true;

  Game.prototype.sendToJail = async function(player){
    if(!player) return;
    if(typeof player.goToJail === 'function') player.goToJail(); else { player.estaEnCarcel = true; player.turnosCarcel = 0; }
    // buscar índice cárcel (id 10) fallback
    const jailIndex = 10;
    player.position = jailIndex;
    const tokenElement = document.querySelector(`[data-player-id="${player.id}"]`);
    const jailSquare = document.querySelector('[data-square-id="10"]');
    if(tokenElement && jailSquare){
      const tokensContainer = jailSquare.querySelector('.player-tokens') || jailSquare;
      tokensContainer.appendChild(tokenElement);
      tokenElement.setAttribute('data-position','10');
    }
    this.mostrarMensaje(player,'🚔 ¡A la Cárcel!','Has sido enviado a la cárcel.');
    this.actualizarEstadoBotones && this.actualizarEstadoBotones();
    this.updatePlayerStatsPanel && this.updatePlayerStatsPanel();
    try { window.dispatchEvent(new CustomEvent('player:jail-enter',{ detail:{ playerId:player.id, nickname:player.nickname }})); } catch(e){}
  };

  Game.prototype.enviarACarcel = function(player){ return this.sendToJail(player); };

  Game.prototype.handleJailTurnStart = function(player, diceInfo = null){
    if(!player?.estaEnCarcel) return { freed:false };
    if(typeof player.tryLeaveJail === 'function'){
      const res = player.tryLeaveJail({ dice:diceInfo, cost:50, maxTurns:3 });
      if(res.freed){
        const map = { pay:'Pagas $50 y sales.', double:'¡Dobles! Sales gratis.', autoPay:'Tercer intento fallido: pagas $50 y sales.', null:'Sales de la cárcel.' };
        this.mostrarMensaje(player,'Cárcel', map[res.reason ?? 'null']);
        this.actualizarEstadoBotones && this.actualizarEstadoBotones();
        this.updatePlayerStatsPanel && this.updatePlayerStatsPanel();
        try { window.dispatchEvent(new CustomEvent('player:jail-exit',{ detail:{ playerId:player.id, nickname:player.nickname, reason:res.reason }})); } catch(e){}
        return { freed:true, reason:res.reason };
      }
      const intento = player.turnosCarcel || 0;
      const restante = Math.max(0,3-intento);
      const texto = restante>0 ? `Intento ${intento}/3 • Necesitas DOBLES o pagar $50.` : 'Próximo intento: pago forzado de $50 si tienes fondos.';
      this.mostrarMensaje(player,'Cárcel',texto);
      this.actualizarEstadoBotones && this.actualizarEstadoBotones();
      this.updatePlayerStatsPanel && this.updatePlayerStatsPanel();
      return { freed:false };
    }
    // fallback mínimo
    player.turnosCarcel = (player.turnosCarcel||0)+1;
    if(diceInfo?.isDouble){ player.estaEnCarcel=false; player.turnosCarcel=0; this.mostrarMensaje(player,'Cárcel','Dobles: sales de la cárcel.'); return { freed:true, reason:'double' }; }
    if(player.turnosCarcel>=3 && player.dinero>=50){ player.dinero-=50; player.estaEnCarcel=false; player.turnosCarcel=0; this.mostrarMensaje(player,'Cárcel','Pagas $50 y sales.'); return { freed:true, reason:'autoPay' }; }
    this.mostrarMensaje(player,'Cárcel',`Sigues en la cárcel (turno ${player.turnosCarcel}/3)`);
    return { freed:false };
  };

  // Modal genérico de mensaje
  Game.prototype.mostrarMensaje = function(player, titulo, mensaje){
    const modal = document.createElement('div');
    modal.className='game-modal-msg';
    modal.style.cssText = 'position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.65);z-index:13000;font-family:system-ui,sans-serif;';
    modal.innerHTML = `\n      <div style="width:min(90%,420px);background:#fff;border-radius:20px;padding:28px 30px;box-shadow:0 18px 45px -10px rgba(0,0,0,.4);position:relative;animation:fadeInScale .35s ease;">\n        <div style="font-size:18px;font-weight:600;margin:0 0 10px;color:#222;display:flex;align-items:center;gap:8px;">${titulo}</div>\n        <div style="font-size:14px;line-height:1.45;color:#333;white-space:pre-line;margin-bottom:22px;">${typeof mensaje==='string'?mensaje: (typeof mensaje==='object'? JSON.stringify(mensaje,null,2): '')}</div>\n        <div style="display:flex;justify-content:flex-end;">\n          <button id="btnCerrarMensaje" style="background:#2563eb;color:#fff;border:none;padding:10px 18px;border-radius:10px;font-size:14px;cursor:pointer;font-weight:600;box-shadow:0 4px 14px -3px #2563ebaa;">Cerrar</button>\n        </div>\n      </div>`;
    if(!document.getElementById('gmModalAnim')){
      const st=document.createElement('style'); st.id='gmModalAnim'; st.textContent='@keyframes fadeInScale{from{opacity:0;transform:scale(.92) translateY(12px);}to{opacity:1;transform:scale(1) translateY(0);}}'; document.head.appendChild(st);
    }
    document.body.appendChild(modal);
    modal.addEventListener('click', e=>{ if(e.target===modal) modal.remove(); });
    modal.querySelector('#btnCerrarMensaje')?.addEventListener('click', ()=> modal.remove());
    setTimeout(()=>{ if(modal.parentNode) modal.remove(); }, 4500);
  };

  Game.prototype.mostrarConfirmacion = function(titulo, mensaje, player){
    return new Promise(res=>{
      const modal = document.createElement('div');
      modal.className='game-modal-confirm';
      modal.style.cssText='position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.55);z-index:14000;font-family:system-ui,sans-serif;';
      modal.innerHTML=`\n        <div style="width:min(90%,440px);background:#fff;border-radius:22px;padding:30px 32px;box-shadow:0 18px 50px -12px rgba(0,0,0,.45);animation:fadeInScale .35s ease;">\n          <h3 style="margin:0 0 14px;font-size:22px;color:#111;">${titulo}</h3>\n          <div style="font-size:14px;line-height:1.5;white-space:pre-line;color:#333;margin-bottom:26px;">${mensaje}</div>\n          <div style="display:flex;gap:12px;justify-content:flex-end;">\n            <button id="btnCancelar" style="background:#e5e7eb;color:#111;border:none;padding:10px 18px;border-radius:10px;cursor:pointer;font-weight:600;">Cancelar</button>\n            <button id="btnConfirmar" style="background:#16a34a;color:#fff;border:none;padding:10px 20px;border-radius:10px;cursor:pointer;font-weight:600;box-shadow:0 4px 12px -3px #16a34aaa;">Confirmar</button>\n          </div>\n        </div>`;
      document.body.appendChild(modal);
      const done = v=>{ if(modal.parentNode) modal.remove(); res(v); };
      modal.addEventListener('click', e=>{ if(e.target===modal) done(false); });
      modal.querySelector('#btnCancelar')?.addEventListener('click', ()=> done(false));
      modal.querySelector('#btnConfirmar')?.addEventListener('click', ()=> done(true));
    });
  };
}
export default applyJail;
